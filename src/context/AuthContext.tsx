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

export interface ClientAccess {
  id: string;
  organization_id: string;
  client_id: string;
  user_id: string;
  client_name: string;
}

export type AccountType = 'internal' | 'client' | null;

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  membership: Membership | null;
  clientAccess: ClientAccess | null;
  accountType: AccountType;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : 'BF';
}
export { getInitials };

interface LoadedAuthContext {
  profile: Profile | null;
  membership: Membership | null;
  clientAccess: ClientAccess | null;
  accountType: AccountType;
  error: string | null;
}

async function loadProfile(currentUser: User): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, display_name, phone, avatar_url')
    .eq('id', currentUser.id)
    .maybeSingle();

  if (!data) {
    const name = currentUser.user_metadata?.display_name ?? currentUser.user_metadata?.full_name ?? null;
    return {
      id: currentUser.id,
      email: currentUser.email ?? '',
      full_name: name,
      display_name: name,
      avatar_url: null,
      phone: null,
    };
  }

  const derivedName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
  const displayName = data.display_name?.trim() || derivedName || null;
  return {
    id: data.id,
    email: currentUser.email ?? '',
    full_name: displayName,
    display_name: displayName,
    avatar_url: data.avatar_url ?? null,
    phone: data.phone ?? null,
  };
}

async function loadProfileAndAccess(currentUser: User): Promise<LoadedAuthContext> {
  // Profile information is helpful but not an access-control dependency.
  const profilePromise = loadProfile(currentUser).catch(() => null);

  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select(`
      id, organization_id, user_id, role_id, status,
      organization:organizations(id, name, slug)
    `)
    .eq('user_id', currentUser.id)
    .eq('status', 'active')
    .limit(2);

  if (membershipError) {
    return {
      profile: await profilePromise,
      membership: null,
      clientAccess: null,
      accountType: null,
      error: `Unable to verify organisation membership: ${membershipError.message}`,
    };
  }

  const { data: clientLinks, error: clientLinkError } = await supabase
    .from('client_portal_access')
    .select('id, organization_id, client_id, user_id')
    .eq('user_id', currentUser.id)
    .eq('status', 'active')
    .limit(2);

  if (clientLinkError) {
    return {
      profile: await profilePromise,
      membership: null,
      clientAccess: null,
      accountType: null,
      error: `Unable to verify client portal access: ${clientLinkError.message}`,
    };
  }

  if ((memberships?.length ?? 0) > 1 || (clientLinks?.length ?? 0) > 1) {
    return {
      profile: await profilePromise,
      membership: null,
      clientAccess: null,
      accountType: null,
      error: 'This account has multiple active access assignments. Ask an administrator to resolve the account assignments before signing in.',
    };
  }

  if ((memberships?.length ?? 0) === 1 && (clientLinks?.length ?? 0) === 1) {
    return {
      profile: await profilePromise,
      membership: null,
      clientAccess: null,
      accountType: null,
      error: 'This account is configured as both an internal organisation user and an external client. These access types must use separate accounts.',
    };
  }

  if (memberships?.length === 1) {
    const member = memberships[0];
    const organization = Array.isArray(member.organization) ? member.organization[0] : member.organization;

    if (!organization?.id || !member.role_id) {
      return {
        profile: await profilePromise,
        membership: null,
        clientAccess: null,
        accountType: null,
        error: 'Your active organisation membership is incomplete. Ask your administrator to check your organisation and role assignment.',
      };
    }

    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('id', member.role_id)
      .eq('organization_id', member.organization_id)
      .maybeSingle();

    if (roleError || !role?.name) {
      return {
        profile: await profilePromise,
        membership: null,
        clientAccess: null,
        accountType: null,
        error: roleError
          ? `Unable to resolve your organisation role: ${roleError.message}`
          : 'Your organisation role could not be found. Ask your administrator to check your role assignment.',
      };
    }

    return {
      profile: await profilePromise,
      membership: {
        id: member.id,
        organization_id: member.organization_id,
        user_id: member.user_id,
        role_id: member.role_id,
        role_name: role.name,
        status: member.status ?? null,
        organization: { id: organization.id, name: organization.name, slug: organization.slug ?? null },
      },
      clientAccess: null,
      accountType: 'internal',
      error: null,
    };
  }

  if (clientLinks?.length === 1) {
    const link = clientLinks[0];
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, status')
      .eq('id', link.client_id)
      .eq('organization_id', link.organization_id)
      .maybeSingle();

    if (clientError || !client || client.status !== 'active') {
      return {
        profile: await profilePromise,
        membership: null,
        clientAccess: null,
        accountType: null,
        error: clientError
          ? `Unable to resolve your client account: ${clientError.message}`
          : 'Your client portal access is not linked to an active client record. Contact the organisation that invited you.',
      };
    }

    return {
      profile: await profilePromise,
      membership: null,
      clientAccess: {
        id: link.id,
        organization_id: link.organization_id,
        client_id: link.client_id,
        user_id: link.user_id,
        client_name: client.name,
      },
      accountType: 'client',
      error: null,
    };
  }

  return {
    profile: await profilePromise,
    membership: null,
    clientAccess: null,
    accountType: null,
    error: 'Your account has no active BuildFlow organisation or client portal access. Contact the organisation that invited you.',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [clientAccess, setClientAccess] = useState<ClientAccess | null>(null);
  const [accountType, setAccountType] = useState<AccountType>(null);
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
      setClientAccess(null);
      setAccountType(null);
      setError(null);

      if (!currentSession?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const loaded = await loadProfileAndAccess(currentSession.user);
        if (!mounted || requestId !== requestSequence.current) return;
        setProfile(loaded.profile);
        setMembership(loaded.membership);
        setClientAccess(loaded.clientAccess);
        setAccountType(loaded.accountType);
        setError(loaded.error);
      } catch (loadError) {
        if (!mounted || requestId !== requestSequence.current) return;
        setError(loadError instanceof Error
          ? `Unable to restore your BuildFlow access: ${loadError.message}`
          : 'Unable to restore your BuildFlow access. Please try again.');
      } finally {
        if (mounted && requestId === requestSequence.current) setLoading(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      authEventReceived = true;
      // Supabase queries must run after the auth callback releases its internal lock.
      window.setTimeout(() => { void applySession(currentSession); }, 0);
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
        setError(sessionError instanceof Error
          ? `Unable to restore your sign-in session: ${sessionError.message}`
          : 'Unable to restore your sign-in session. Please try again.');
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
          : 'Unable to reach the sign-in service. Check your connection and try again.',
      };
    }
  };

  const signOut = async () => {
    try { await supabase.auth.signOut(); } finally {
      requestSequence.current += 1;
      setSession(null);
      setUser(null);
      setProfile(null);
      setMembership(null);
      setClientAccess(null);
      setAccountType(null);
      setError(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      session, user, profile, membership, clientAccess, accountType, loading, error, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
