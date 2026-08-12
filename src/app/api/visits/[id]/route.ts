import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const res = await fetch(`${BACKEND_URL}/api/v1/visits/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
