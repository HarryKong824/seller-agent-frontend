import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** POST /api/insights/management — manager/admin 专属，透传后端 v1（AI 或规则降级）。 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${BACKEND_URL}/api/v1/insights/management`, {
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
