'use client';

import { useCallback, useEffect, useState } from 'react';

export interface AuthUser {
  userId: string;
  email: string;
  username: string;
  role: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Client-side authentication hook.
 * Fetches current user via /api/auth/me (reads httpOnly cookie server-side).
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(
    async (username: string, password: string) => {
      setError(null);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '登录失败');
        }

        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '登录失败');
        return false;
      }
    },
    [refresh]
  );

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, error, signIn, signOut, refresh };
}
