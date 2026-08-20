import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** Extract JWT from httpOnly cookie for forwarding to backend. */
function getAuthHeader(req: NextRequest): Record<string, string> {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}

/** Build backend URL from catch-all path segments. */
function buildBackendUrl(path: string[]): string {
  const pathStr = path.join('/');
  return `${BACKEND_URL}/api/v1/generated/${pathStr}`;
}

/** GET /api/v1/generated/[...path] — proxy file download to backend. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const authHeader = getAuthHeader(req);

  if (Object.keys(authHeader).length === 0) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const res = await fetch(buildBackendUrl(path), {
    method: 'GET',
    headers: authHeader,
    cache: 'no-store' as RequestCache
  });

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  }

  // Stream the binary file back to the browser with the backend's headers.
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const disposition = res.headers.get('content-disposition') || undefined;
  const body = res.body;

  const headers: Record<string, string> = {
    'content-type': contentType
  };
  if (disposition) headers['content-disposition'] = disposition;

  return new Response(body, { status: res.status, headers });
}
