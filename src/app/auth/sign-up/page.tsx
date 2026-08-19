'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

/**
 * 注册页已关闭——账户由管理员统一开通。
 * 用户访问此页时提示联系管理员，并引导返回登录。
 */
export default function SignUpClosedPage() {
  const router = useRouter();

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <div className='w-full max-w-sm space-y-6 text-center'>
        <div className='flex flex-col items-center space-y-2'>
          <Icons.logo className='h-10 w-10' />
          <h1 className='text-2xl font-bold'>账户开通</h1>
        </div>

        <div className='rounded-lg border bg-muted/50 p-6 space-y-3'>
          <p className='text-sm text-muted-foreground'>
            本系统不支持自助注册。
          </p>
          <p className='text-sm'>
            请联系管理员，由管理员在「用户管理」页面为您开通账户并分配角色。
          </p>
        </div>

        <Button
          className='w-full'
          onClick={() => router.push('/auth/sign-in')}
        >
          返回登录
        </Button>
      </div>
    </div>
  );
}
