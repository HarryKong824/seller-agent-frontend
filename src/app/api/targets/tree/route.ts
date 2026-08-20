import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** GET /api/targets/tree — 目标树(年度→季度→月度→周度)。 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const backendUrl = new URL('/api/v1/targets/tree', BACKEND_URL);
  searchParams.forEach((value, key) => backendUrl.searchParams.set(key, value));
  const res = await fetch(backendUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
