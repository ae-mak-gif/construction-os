import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string | null;
}

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  role_name: string;
  organization: Organization;
  status?: string | null;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  membership: Membership | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  if (name) {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    return parts[0].slice(0, 2).toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return 'BF';
}

export { getInitials };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfileAndMembership = async (currentUser: User) => {
    let profileData: Profile | null = null;
    let membershipData: Membership | null = null;

    // ---------------------------------------------------------
    // LOAD PROFILE
    // ---------------------------------------------------------
    // The verified profiles table contains:
    // id, full_name, phone, avatar_url, created_at, updated_at
    //
    // Email comes from the authenticated Supabase user.
    // ---------------------------------------------------------

    const { data: prof, error: profError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, avatar_url')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (profError) {
      setError(`Unable to load profile: ${profError.message}`);
    } else if (prof) {
      profileData = {
        id: prof.id,
        email: currentUser.email ?? '',
        full_name: prof.full_name ?? null,
        display_name: prof.full_name ?? null,
        avatar_url: prof.avatar_url ?? null,
        phone: prof.phone ?? null,
      };
    } else {
      // Graceful fallback if a profile record does not exist.
      profileData = {
        id: currentUser.id,
        email: currentUser.email ?? '',
        full_name: currentUser.user_metadata?.full_name ?? null,
        display_name: currentUser.user_metadata?.full_name ?? null,
        avatar_url: null,
        phone: null,
      };
    }

    // ---------------------------------------------------------
    // LOAD ORGANIZATION MEMBERSHIP
    // ---------------------------------------------------------
    // Verified schema:
    //
    // organization_members:
    // id
    // organization_id
    // user_id
    // role_id
    // status
    //
    // roles:
    // id
    // organization_id
    // name
    //
    // Therefore we DO NOT request organization_members.role_name.
    // ---------------------------------------------------------

    const { data: memb, error: membError } = await supabase
      .from('organization_members')
      .select(`
        id,
        organization_id,
        user_id,
        role_id,
        status,
        organization:organizations(
          id,
          name,
          slug
        )
      `)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (membError) {
      setError(
        `Unable to load organization membership: ${membError.message}`
      );
    } else if (memb) {
      const organizationData = Array.isArray(memb.organization)
        ? memb.organization[0]
        : memb.organization;

      // -------------------------------------------------------
      // LOAD ROLE USING role_id
      // -------------------------------------------------------

      let roleName = 'User';

      if (memb.role_id) {
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('id, name')
          .eq('id', memb.role_id)
          .maybeSingle();

        if (roleError) {
          setError(`Unable to load user role: ${roleError.message}`);
        } else if (role?.name) {
          roleName = role.name;
        }
      }

      membershipData = {
        id: memb.id,
        organization_id: memb.organization_id,
        user_id: memb.user_id,
        role_id: memb.role_id,
        role_name: roleName,
        status: memb.status ?? null,
        organization:
          organizationData ?? {
            id: memb.organization_id,
            name: 'Unknown',
            slug: null,
          },
      };
    }

    setProfile(profileData);
    setMembership(membershipData);
  };

  useEffect(() => {
    let mounted = true;

    // ---------------------------------------------------------
    // INITIAL SESSION
    // ---------------------------------------------------------

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        loadProfileAndMembership(currentSession.user).finally(() => {
          if (mounted) {
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    // ---------------------------------------------------------
    // AUTH STATE CHANGES
    // ---------------------------------------------------------

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setError(null);

      if (currentSession?.user) {
        setLoading(true);

        loadProfileAndMembership(currentSession.user).finally(() => {
          if (mounted) {
            setLoading(false);
          }
        });
      } else {
        setProfile(null);
        setMembership(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // -----------------------------------------------------------
  // SIGN IN
  // -----------------------------------------------------------

  const signIn = async (email: string, password: string) => {
    setError(null);

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      return {
        error: signInError.message,
      };
    }

    return {
      error: null,
    };
  };

  // -----------------------------------------------------------
  // SIGN OUT
  // -----------------------------------------------------------

  const signOut = async () => {
    await supabase.auth.signOut();

    setSession(null);
    setUser(null);
    setProfile(null);
    setMembership(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        membership,
        loading,
        error,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}