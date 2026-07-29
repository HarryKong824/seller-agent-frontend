import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** GET /api/knowledge-bases — list all knowledge bases. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/api/v1/knowledge-bases`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** POST /api/knowledge-bases — create a knowledge base. */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`${BACKEND_URL}/api/v1/knowledge-bases`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
