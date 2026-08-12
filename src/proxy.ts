import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy middleware (Next.js 16+ convention, formerly "middleware.ts").
 * Protects /dashboard/* routes.
 *
 * Validates the access token's expiry locally by decoding the JWT `exp` claim.
 * Signature verification is still done API-side; here we only need to catch
 * expired tokens so the user is redirected to sign-in instead of landing on a
 * dashboard whose data fetches would 401 ("客户列表/统计数据加载失败").
 * Edge Runtime compatible — uses req.cookies and atob, not next/headers.
 */
function isTokenAlive(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    // base64url -> base64
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const data = JSON.parse(atob(b64));
    if (typeof data.exp === 'number') {
      return data.exp * 1000 > Date.now();
    }
    // Tokens without an exp claim are passed through (API-side validates them).
    return true;
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;

  if (!token || !isTokenAlive(token)) {
    const signInUrl = new URL('/auth/sign-in', req.url);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
