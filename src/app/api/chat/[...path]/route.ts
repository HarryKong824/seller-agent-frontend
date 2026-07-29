import { NextRequest, NextResponse } from 'next/server';

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
  return `${BACKEND_URL}/api/v1/chat/${pathStr}`;
}

/** Forward a request to the backend, returning the JSON response. */
async function proxyRequest(
  req: NextRequest,
  method: string,
  path: string[]
): Promise<NextResponse> {
  const authHeader = getAuthHeader(req);

  if (Object.keys(authHeader).length === 0) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const headers: Record<string, string> = {
    ...authHeader,
    'Content-Type': 'application/json'
  };

  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store' as RequestCache
  };

  // Forward JSON body for POST/PATCH
  if (method === 'POST' || method === 'PATCH') {
    try {
      const body = await req.text();
      if (body) {
        init.body = body;
      }
    } catch {
      // No body — that's fine
    }
  }

  const res = await fetch(buildBackendUrl(path), init);

  // 204 No Content (DELETE success)
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** GET /api/chat/[...path] — proxy to backend. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, 'GET', path);
}

/** POST /api/chat/[...path] — proxy to backend. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, 'POST', path);
}

/** PATCH /api/chat/[...path] — proxy to backend. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, 'PATCH', path);
}

/** DELETE /api/chat/[...path] — proxy to backend. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, 'DELETE', path);
}
