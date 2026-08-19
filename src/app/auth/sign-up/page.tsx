'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

export default function SignUpPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('用户名至少 3 个字符');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 个字符');
      return;
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          full_name: fullName.trim(),
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '注册失败');
      }

      router.push('/auth/sign-in?registered=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <div className='w-full max-w-sm space-y-6'>
        <div className='flex flex-col items-center space-y-2'>
          <Icons.logo className='h-10 w-10' />
          <h1 className='text-2xl font-bold'>Agent Platform</h1>
          <p className='text-sm text-muted-foreground'>注册新账户（销售角色）</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='username'>用户名</Label>
            <Input
              id='username'
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder='至少 3 个字符'
              required
              autoComplete='username'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='fullName'>姓名</Label>
            <Input
              id='fullName'
              type='text'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder='请输入真实姓名'
              required
              autoComplete='name'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password'>密码</Label>
            <Input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='至少 6 个字符'
              required
              autoComplete='new-password'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirm'>确认密码</Label>
            <Input
              id='confirm'
              type='password'
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder='再次输入密码'
              required
              autoComplete='new-password'
            />
          </div>

          {error && <p className='text-sm text-destructive'>{error}</p>}

          <Button type='submit' className='w-full' disabled={loading}>
            {loading && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
            注册
          </Button>
        </form>

        <div className='text-center text-sm text-muted-foreground'>
          <span>已有账户？</span>{' '}
          <Link href='/auth/sign-in' className='text-primary hover:underline'>
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
