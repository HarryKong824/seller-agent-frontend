import { NextResponse } from 'next/server';

/**
 * 公开注册已关闭——账户由管理员统一开通。
 * 用户管理页面：/dashboard/users（仅管理员可访问）。
 *
 * 保留此路由是为了给出明确的 403 响应，而非 404，
 * 避免调用方误以为是路径错误。
 */
export async function POST() {
  return NextResponse.json(
    {
      error: '注册已关闭。请联系管理员开通账户。',
      hint: '管理员可在「用户管理」页面创建账户并分配角色。'
    },
    { status: 403 }
  );
}
