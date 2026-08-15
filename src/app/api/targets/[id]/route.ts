import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** PUT /api/targets/[id] — 更新目标（仅 manager/admin）。 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${BACKEND_URL}/api/v1/targets/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** DELETE /api/targets/[id] — 删除目标（仅 manager/admin）。 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const res = await fetch(`${BACKEND_URL}/api/v1/targets/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
