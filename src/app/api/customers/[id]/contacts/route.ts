import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** GET /api/customers/[id]/contacts — list DMU contacts for a customer. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { id } = await params;

  const res = await fetch(`${BACKEND_URL}/api/v1/customers/${id}/contacts`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

/** POST /api/customers/[id]/contacts — create a DMU contact. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${BACKEND_URL}/api/v1/customers/${id}/contacts`, {
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
