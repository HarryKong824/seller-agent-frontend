import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** GET /api/targets — 目标列表（manager/admin 看全部，sales 看自己）。 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const backendUrl = new URL('/api/v1/targets', BACKEND_URL);
  searchParams.forEach((value, key) => backendUrl.searchParams.set(key, value));

  const res = await fetch(backendUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** POST /api/targets — 创建目标（仅 manager/admin）。 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${BACKEND_URL}/api/v1/targets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
