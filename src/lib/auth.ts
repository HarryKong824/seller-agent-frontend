import { cookies } from 'next/headers';

export interface SessionUser {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export interface Session {
  user: SessionUser;
  accessToken: string;
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/**
 * Get the current session from the access_token cookie (server-side only).
 * Returns null if not authenticated or token is invalid.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return null;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!res.ok) {
      return null;
    }

    const user: SessionUser = await res.json();
    return { user, accessToken: token };
  } catch {
    return null;
  }
}

/**
 * Require authentication. Redirects to sign-in if not authenticated.
 * Use in server components and layout.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

/**
 * Authenticate with backend and return access token.
 * Called by the /api/auth/login route handler.
 */
export async function authenticateWithBackend(
  username: string,
  password: string
): Promise<{ accessToken: string }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
    cache: 'no-store'
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Authentication failed: ${res.status}`);
  }

  const data = await res.json();
  return { accessToken: data.access_token };
}
