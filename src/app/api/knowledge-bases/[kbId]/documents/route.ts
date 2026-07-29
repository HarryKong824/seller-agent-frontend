import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** GET /api/knowledge-bases/[kbId]/documents — list documents in a KB. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ kbId: string }> }
) {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { kbId } = await params;

  const res = await fetch(`${BACKEND_URL}/api/v1/knowledge-bases/${kbId}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** POST /api/knowledge-bases/[kbId]/documents — upload document (multipart/form-data passthrough). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ kbId: string }> }
) {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { kbId } = await params;

  // 关键：用 req.formData() 原样拿到 multipart/form-data，不能当 JSON 转发
  const formData = await req.formData();

  const res = await fetch(`${BACKEND_URL}/api/v1/knowledge-bases/${kbId}/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
      // 不设 Content-Type，让 fetch 自动带 boundary
    },
    body: formData,
    cache: 'no-store'
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
