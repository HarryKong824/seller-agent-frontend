import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy middleware (Next.js 16+ convention, formerly "middleware.ts").
 * Protects /dashboard/* routes.
 * Only checks token existence (signature validation is done API-side).
 * Edge Runtime compatible — uses req.cookies, not next/headers.
 */
export function proxy(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    const signInUrl = new URL('/auth/sign-in', req.url);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
