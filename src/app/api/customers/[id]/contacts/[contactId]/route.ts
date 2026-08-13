import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** DELETE /api/customers/[id]/contacts/[contactId] — delete a DMU contact. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { id, contactId } = await params;

  const res = await fetch(
    `${BACKEND_URL}/api/v1/customers/${id}/contacts/${contactId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    }
  );

  // 后端 DELETE 返回 204 无响应体，按状态码透传
  return new NextResponse(null, { status: res.status });
}
