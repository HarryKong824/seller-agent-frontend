import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// BFF proxy: list users (GET) / create user (POST) → backend /api/v1/users.
// Mirrors src/app/api/customers/route.ts: reads access_token httpOnly cookie
// and forwards it as an Authorization: Bearer header to the backend.
export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/api/v1/users`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const body = await req.text();
  const res = await fetch(`${BACKEND_URL}/api/v1/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
