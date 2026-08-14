import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** GET /api/reports/team — manager/admin 专属团队聚合报表（透传后端 v1）。 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const backendUrl = new URL('/api/v1/reports/team', BACKEND_URL);
  searchParams.forEach((value, key) => backendUrl.searchParams.set(key, value));

  const res = await fetch(backendUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
