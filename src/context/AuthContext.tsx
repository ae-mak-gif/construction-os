import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
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
  role_name: string;
  organization: Organization;
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

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
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

    const { data: prof, error: profError } = await supabase
      .from('profiles')
      .select('id, email, full_name, display_name, avatar_url')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (profError) {
      setError(`Unable to load profile: ${profError.message}`);
    } else if (prof) {
      profileData = prof as Profile;
    } else {
      profileData = {
        id: currentUser.id,
        email: currentUser.email ?? '',
        full_name: currentUser.user_metadata?.full_name ?? null,
        display_name: null,
        avatar_url: null,
      };
    }

    const { data: memb, error: membError } = await supabase
      .from('organization_members')
      .select(`
        id,
        organization_id,
        user_id,
        role_name,
        organization:organizations(id, name, slug)
      `)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (membError) {
      setError(`Unable to load organization membership: ${membError.message}`);
    } else if (memb) {
      const m = memb as unknown as {
        id: string;
        organization_id: string;
        user_id: string;
        role_name: string;
        organization: Organization | Organization[];
      };
      const org = Array.isArray(m.organization) ? m.organization[0] : m.organization;
      membershipData = {
        id: m.id,
        organization_id: m.organization_id,
        user_id: m.user_id,
        role_name: m.role_name,
        organization: org ?? { id: m.organization_id, name: 'Unknown', slug: null },
      };
    }

    setProfile(profileData);
    setMembership(membershipData);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfileAndMembership(s.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setError(null);
      if (s?.user) {
        setLoading(true);
        (async () => {
          await loadProfileAndMembership(s.user);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setMembership(null);
        setLoading(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return { error: signInError.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setMembership(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, membership, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
