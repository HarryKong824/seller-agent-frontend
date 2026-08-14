import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** GET /api/daily-reports/me — list current user's reports (any authenticated user). */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const backendUrl = new URL('/api/v1/daily-reports/me', BACKEND_URL);
  searchParams.forEach((value, key) => backendUrl.searchParams.set(key, value));

  const res = await fetch(backendUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** POST /api/daily-reports — submit a form-mode report (own only). */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${BACKEND_URL}/api/v1/daily-reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
