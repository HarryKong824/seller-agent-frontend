'use client';

import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

type Role = 'sales' | 'manager' | 'admin';

interface UserDetail {
  id: number;
  username: string;
  full_name: string;
  email: string | null;
  role: string;
  is_active: boolean;
}

const ROLE_OPTIONS: Role[] = ['sales', 'manager', 'admin'];

const roleVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  manager: 'secondary',
  sales: 'outline'
};

function roleLabel(role: string): string {
  return { sales: '销售', manager: '经理', admin: '管理员' }[role] ?? role;
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('sales');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (username.trim().length < 3) {
      toast.error('用户名至少 3 个字符');
      return;
    }
    if (password.length < 6) {
      toast.error('密码至少 6 个字符');
      return;
    }
    if (!fullName.trim()) {
      toast.error('姓名不能为空');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          full_name: fullName.trim(),
          role
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `创建失败: ${res.status}`);
      }
      toast.success('用户创建成功');
      setOpen(false);
      setUsername('');
      setPassword('');
      setFullName('');
      setRole('sales');
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size='sm'>
            <Icons.add className='mr-1 size-4' />
            新建用户
          </Button>
        }
      />
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>新建用户</DialogTitle>
          <DialogDescription>由管理员创建账号并分配角色</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='u-username'>用户名</Label>
            <Input
              id='u-username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder='至少 3 个字符'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='u-password'>密码</Label>
            <Input
              id='u-password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='至少 6 个字符'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='u-fullname'>姓名</Label>
            <Input
              id='u-fullname'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder='真实姓名'
            />
          </div>
          <div className='space-y-2'>
            <Label>角色</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Icons.spinner className='mr-1 size-4 animate-spin' /> : null}
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    setError(false);
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (res.status === 403) {
        setForbidden(true);
        setUsers([]);
        return;
      }
      if (!res.ok) {
        setError(true);
        setUsers([]);
        return;
      }
      const data = (await res.json()) as UserDetail[];
      setUsers(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchUser = async (id: number, body: { is_active?: boolean; role?: string }) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `更新失败: ${res.status}`);
    }
    const updated = (await res.json()) as UserDetail;
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
  };

  const handleToggleActive = async (user: UserDetail, checked: boolean) => {
    try {
      await patchUser(user.id, { is_active: checked });
      toast.success(checked ? '已启用' : '已停用');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败');
      // Revert optimistic state by reloading.
      void load();
    }
  };

  const handleRoleChange = async (user: UserDetail, newRole: string | null) => {
    if (!newRole || newRole === user.role) return;
    try {
      await patchUser(user.id, { role: newRole });
      toast.success('角色已更新');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败');
      void load();
    }
  };

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>用户管理</h2>
          <p className='text-muted-foreground mt-1 text-sm'>管理员创建账号、分配角色、停用启用</p>
        </div>
        {!forbidden && <CreateUserDialog onCreated={() => void load()} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>仅管理员可访问</CardDescription>
        </CardHeader>
        <div className='px-6 pb-6'>
          {loading ? (
            <div className='flex h-48 items-center justify-center'>
              <Icons.spinner className='text-muted-foreground size-6 animate-spin' />
            </div>
          ) : forbidden ? (
            <div className='text-muted-foreground flex h-48 flex-col items-center justify-center gap-2'>
              <Icons.user className='size-8' />
              <p>权限不足：仅管理员可查看用户管理</p>
            </div>
          ) : error ? (
            <div className='text-muted-foreground flex h-48 items-center justify-center'>
              用户列表加载失败
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>邮箱</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length ? (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className='font-medium'>{u.username}</TableCell>
                        <TableCell className='text-muted-foreground'>{u.full_name}</TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(v) => void handleRoleChange(u, v)}
                          >
                            <SelectTrigger className='h-8 w-28'>
                              <SelectValue>
                                <Badge variant={roleVariant[u.role] ?? 'outline'}>
                                  {roleLabel(u.role)}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {roleLabel(r)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Switch
                              checked={u.is_active}
                              onCheckedChange={(checked) =>
                                void handleToggleActive(u, checked)
                              }
                            />
                            <span className='text-muted-foreground text-sm'>
                              {u.is_active ? '启用' : '停用'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {u.email ?? '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className='text-muted-foreground h-24 text-center'>
                        暂无用户
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
