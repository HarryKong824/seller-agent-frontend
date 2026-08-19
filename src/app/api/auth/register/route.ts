import { NextRequest, NextResponse } from 'next/server';
import { registerWithBackend } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, full_name } = body;

    if (!username || !password || !full_name) {
      return NextResponse.json(
        { error: '用户名、姓名和密码均不能为空' },
        { status: 400 }
      );
    }

    if (String(username).length < 3) {
      return NextResponse.json(
        { error: '用户名至少 3 个字符' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: '密码至少 6 个字符' },
        { status: 400 }
      );
    }

    await registerWithBackend(username, password, full_name);

    return NextResponse.json({ success: true });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json(
      { error: e.message || '注册失败' },
      { status: e.status || 400 }
    );
  }
}
