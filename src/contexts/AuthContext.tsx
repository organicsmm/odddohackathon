import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User as SbUser } from '@supabase/supabase-js';

export type AppUser = {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
};

type AuthCtx = {
  user: AppUser | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => void;
};

const Ctx = createContext<AuthCtx>({
  user: null, session: null, isAdmin: false, loading: true,
  signOut: async () => {}, refresh: () => {},
});

const toAppUser = (u: SbUser | null | undefined): AppUser | null => {
  if (!u) return null;
  const meta = (u.user_metadata || {}) as Record<string, unknown>;
  return {
    id: u.id,
    email: u.email || '',
    name: (meta.full_name as string) || (meta.name as string) || (u.email?.split('@')[0] ?? 'User'),
    avatar_url: meta.avatar_url as string | undefined,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = useCallback(async (uid: string | null) => {
    if (!uid) { setIsAdmin(false); return; }
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', uid)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  }, []);

  useEffect(() => {
    // Listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      const u = toAppUser(sess?.user);
      setUser(u);
      // Defer DB call to avoid deadlock
      if (sess?.user?.id) {
        setTimeout(() => checkAdmin(sess.user.id), 0);
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(toAppUser(sess?.user));
      if (sess?.user?.id) checkAdmin(sess.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [checkAdmin]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsAdmin(false);
  }, []);

  const refresh = useCallback(() => {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(toAppUser(sess?.user));
      if (sess?.user?.id) checkAdmin(sess.user.id);
    });
  }, [checkAdmin]);

  return (
    <Ctx.Provider value={{ user, session, isAdmin, loading, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
