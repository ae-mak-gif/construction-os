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
    setError(null);

    try {
      // Match the live profiles schema: first_name, last_name and display_name.
      // The former full_name selection caused every successful sign-in to show
      // a misleading Connection Issue screen.
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, display_name, phone, avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profError) {
        throw new Error(`Unable to load profile: ${profError.message}`);
      }

      const joinedName = [prof?.first_name, prof?.last_name]
        .filter((part): part is string => Boolean(part?.trim()))
        .join(' ');
      const fullName = prof?.display_name?.trim() || joinedName || currentUser.user_metadata?.full_name || null;

      const profileData: Profile = {
        id: currentUser.id,
        email: currentUser.email ?? '',
        full_name: fullName,
        display_name: fullName,
        avatar_url: prof?.avatar_url ?? null,
        phone: prof?.phone ?? null,
      };

      // Internal membership is optional for authentication. External clients
      // are linked through client_portal_access and must not be given an
      // internal organisation role merely to make login succeed.
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          user_id,
          role_id,
          status,
          organization:organizations(id, name, slug)
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .limit(2);

      if (membershipError) {
        throw new Error(`Unable to load organization membership: ${membershipError.message}`);
      }

      if ((memberships?.length ?? 0) > 1) {
        throw new Error('This account has more than one active organisation membership. Please contact your administrator to select the correct organisation.');
      }

      let membershipData: Membership | null = null;
      const memb = memberships?.[0];

      if (memb) {
        const organizationData = Array.isArray(memb.organization)
          ? memb.organization[0]
          : memb.organization;

        let roleName = 'User';
        if (memb.role_id) {
          const { data: role, error: roleError } = await supabase
            .from('roles')
            .select('id, name')
            .eq('id', memb.role_id)
            .eq('organization_id', memb.organization_id)
            .maybeSingle();

          if (roleError) {
            throw new Error(`Unable to load user role: ${roleError.message}`);
          }
          if (role?.name) roleName = role.name;
        }

        membershipData = {
          id: memb.id,
          organization_id: memb.organization_id,
          user_id: memb.user_id,
          role_id: memb.role_id,
          role_name: roleName,
          status: memb.status ?? null,
          organization: organizationData ?? {
            id: memb.organization_id,
            name: 'Unknown',
            slug: null,
          },
        };
      }

      setProfile(profileData);
      setMembership(membershipData);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your BuildFlow account details.');
      setProfile(null);
      setMembership(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // ---------------------------------------------------------
    // INITIAL SESSION
    // ---------------------------------------------------------

    supabase.auth.getSession().then(({ data: { session: currentSession }, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(`Unable to restore your BuildFlow session: ${sessionError.message}`);

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        void loadProfileAndMembership(currentSession.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch((sessionError: unknown) => {
      if (!mounted) return;
      setError(sessionError instanceof Error ? sessionError.message : 'Unable to restore your BuildFlow session.');
      setLoading(false);
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
        // Defer Supabase data queries until after the auth callback releases
        // its internal lock; avoids auth callback re-entrancy/deadlock.
        setTimeout(() => {
          if (!mounted) return;
          void loadProfileAndMembership(currentSession.user).finally(() => {
            if (mounted) setLoading(false);
          });
        }, 0);
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

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      return { error: signInError?.message ?? null };
    } catch (signInError) {
      return {
        error: signInError instanceof Error
          ? signInError.message
          : 'Unable to contact the authentication service. Check your connection and try again.',
      };
    }
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