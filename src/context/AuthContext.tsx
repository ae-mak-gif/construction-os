import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/* eslint-disable react-refresh/only-export-components -- Context modules intentionally export their provider and hook. */

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
  if (email) return email.slice(0, 2).toUpperCase();
  return 'BF';
}

export { getInitials };

interface LoadedAuthContext {
  profile: Profile | null;
  membership: Membership | null;
  error: string | null;
}

async function loadProfileAndMembership(currentUser: User): Promise<LoadedAuthContext> {
  let profileData: Profile | null = null;
  let membershipData: Membership | null = null;
  const loadErrors: string[] = [];

  const { data: prof, error: profError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, display_name, phone, avatar_url')
    .eq('id', currentUser.id)
    .maybeSingle();

  if (profError) {
    loadErrors.push(`Unable to load profile: ${profError.message}`);
  } else if (prof) {
    const derivedName = [prof.first_name, prof.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    const displayName = prof.display_name?.trim() || derivedName || null;

    profileData = {
      id: prof.id,
      email: currentUser.email ?? '',
      full_name: displayName,
      display_name: displayName,
      avatar_url: prof.avatar_url ?? null,
      phone: prof.phone ?? null,
    };
  } else {
    profileData = {
      id: currentUser.id,
      email: currentUser.email ?? '',
      full_name:
        currentUser.user_metadata?.display_name ??
        currentUser.user_metadata?.full_name ??
        null,
      display_name:
        currentUser.user_metadata?.display_name ??
        currentUser.user_metadata?.full_name ??
        null,
      avatar_url: null,
      phone: null,
    };
  }

  const { data: memberships, error: membershipError } = await supabase
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
    .eq('status', 'active')
    .limit(2);

  if (membershipError) {
    loadErrors.push(`Unable to load organization membership: ${membershipError.message}`);
  } else if (!memberships || memberships.length === 0) {
    loadErrors.push('Your account does not have an active organisation membership. Please contact your administrator.');
  } else if (memberships.length > 1) {
    loadErrors.push('Your account is linked to more than one organisation. Organisation selection must be configured before you can continue.');
  } else {
    const member = memberships[0];
    const organizationData = Array.isArray(member.organization)
      ? member.organization[0]
      : member.organization;

    if (!organizationData?.id) {
      loadErrors.push('Your active organisation could not be resolved. Please contact your administrator.');
    } else if (!member.role_id) {
      loadErrors.push('Your organisation membership has no assigned role. Please contact your administrator.');
    } else {
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id, name')
        .eq('id', member.role_id)
        .eq('organization_id', member.organization_id)
        .maybeSingle();

      if (roleError) {
        loadErrors.push(`Unable to load user role: ${roleError.message}`);
      } else if (!role?.name) {
        loadErrors.push('Your organisation role could not be resolved. Please contact your administrator.');
      } else {
        membershipData = {
          id: member.id,
          organization_id: member.organization_id,
          user_id: member.user_id,
          role_id: member.role_id,
          role_name: role.name,
          status: member.status ?? null,
          organization: {
            id: organizationData.id,
            name: organizationData.name,
            slug: organizationData.slug ?? null,
          },
        };
      }
    }
  }

  return {
    profile: profileData,
    membership: membershipData,
    error: loadErrors.length ? loadErrors.join(' ') : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;

    const applySession = async (currentSession: Session | null) => {
      const requestId = ++requestSequence.current;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setProfile(null);
      setMembership(null);
      setError(null);

      if (!currentSession?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const loaded = await loadProfileAndMembership(currentSession.user);
        if (!mounted || requestId !== requestSequence.current) return;
        setProfile(loaded.profile);
        setMembership(loaded.membership);
        setError(loaded.error);
      } catch (loadError) {
        if (!mounted || requestId !== requestSequence.current) return;
        setProfile(null);
        setMembership(null);
        setError(
          loadError instanceof Error
            ? `Unable to restore your BuildFlow account: ${loadError.message}`
            : 'Unable to restore your BuildFlow account. Please try again.'
        );
      } finally {
        if (mounted && requestId === requestSequence.current) {
          setLoading(false);
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      authEventReceived = true;
      // Defer Supabase queries until the auth callback has released its internal lock.
      window.setTimeout(() => {
        void applySession(currentSession);
      }, 0);
    });

    void supabase.auth.getSession()
      .then(({ data: { session: initialSession }, error: sessionError }) => {
        if (!mounted || authEventReceived) return;
        if (sessionError) {
          setError(`Unable to restore your sign-in session: ${sessionError.message}`);
          setLoading(false);
          return;
        }
        void applySession(initialSession);
      })
      .catch((sessionError: unknown) => {
        if (!mounted || authEventReceived) return;
        setError(
          sessionError instanceof Error
            ? `Unable to restore your sign-in session: ${sessionError.message}`
            : 'Unable to restore your sign-in session. Please try again.'
        );
        setLoading(false);
      });

    return () => {
      mounted = false;
      requestSequence.current += 1;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    return { error: signInError?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    requestSequence.current += 1;
    setSession(null);
    setUser(null);
    setProfile(null);
    setMembership(null);
    setError(null);
    setLoading(false);
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
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
