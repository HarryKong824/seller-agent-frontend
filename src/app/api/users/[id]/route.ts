import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

type Params = { params: Promise<{ id: string }> };

// BFF proxy: update user (PATCH) → backend /api/v1/users/{id}.
// Reads access_token httpOnly cookie and forwards as Authorization header.
export async function PATCH(req: NextRequest, { params }: Params) {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.text();
  const res = await fetch(`${BACKEND_URL}/api/v1/users/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
