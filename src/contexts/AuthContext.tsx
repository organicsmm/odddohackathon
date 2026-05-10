import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { currentUser } from '@/lib/store';
import type { User } from '@/lib/types';

type AuthCtx = { user: User | null; refresh: () => void };
const Ctx = createContext<AuthCtx>({ user: null, refresh: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(currentUser());
  const refresh = () => setUser(currentUser());
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('traveloop:auth-changed', h);
    window.addEventListener('storage', h);
    return () => {
      window.removeEventListener('traveloop:auth-changed', h);
      window.removeEventListener('storage', h);
    };
  }, []);
  return <Ctx.Provider value={{ user, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
