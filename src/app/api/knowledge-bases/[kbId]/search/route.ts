import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/** POST /api/knowledge-bases/[kbId]/search — search chunks in a KB. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ kbId: string }> }
) {
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: '未登录' }, { status: 401 });
  }

  const { kbId } = await params;
  const body = await req.json();

  const res = await fetch(
    `${BACKEND_URL}/api/v1/knowledge-bases/${kbId}/search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
