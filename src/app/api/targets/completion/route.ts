import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** GET /api/targets/completion — 目标完成率（manager/admin 查指定 owner，sales 仅查自己）。 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const backendUrl = new URL('/api/v1/targets/completion', BACKEND_URL);
  searchParams.forEach((value, key) => backendUrl.searchParams.set(key, value));

  const res = await fetch(backendUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
