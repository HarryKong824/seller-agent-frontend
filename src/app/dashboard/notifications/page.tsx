'use client';

import { useState } from 'react';

import { useMarkAllRead, useMarkRead, useNotifications } from '@/features/notifications/api';
import type { NotificationTab } from '@/features/notifications/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

const TABS: { key: NotificationTab; label: string }[] = [
  { key: 'unread', label: '未读' },
  { key: 'all', label: '全部' },
  { key: 'read', label: '已读' }
];

function formatTime(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString('zh-CN', { hour12: false });
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<NotificationTab>('unread');
  const { data, isLoading, isError } = useNotifications({
    unreadOnly: tab === 'unread'
  });
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const raw = data?.items ?? [];
  const items =
    tab === 'all'
      ? raw
      : raw.filter((it) => (tab === 'unread' ? !it.isRead : it.isRead));

  const handleMark = async (id: number) => {
    try {
      await markRead.mutateAsync(id);
      toast.success('已标记为已读');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      toast.success('已全部标记为已读');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>通知中心</h2>
          <p className='text-muted-foreground mt-1 text-sm'>
            外出拜访打卡等事件会自动推送给相关管理者
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={handleMarkAll} disabled={markAll.isPending}>
          {markAll.isPending && <Icons.spinner className='mr-1 size-4 animate-spin' />}
          全部已读
        </Button>
      </div>

      {/* Tab 切换 */}
      <div className='flex gap-2'>
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
          <CardDescription>
            {tab === 'unread'
              ? '仅显示未读通知'
              : tab === 'read'
                ? '仅显示已读通知'
                : '显示全部通知'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex h-48 items-center justify-center'>
              <Icons.spinner className='text-muted-foreground size-6 animate-spin' />
            </div>
          ) : isError ? (
            <div className='text-muted-foreground flex h-48 items-center justify-center'>
              通知加载失败
            </div>
          ) : items.length === 0 ? (
            <div className='text-muted-foreground flex h-48 flex-col items-center justify-center gap-2'>
              <Icons.notification className='size-8' />
              <p>暂无{tab === 'unread' ? '未读' : tab === 'read' ? '已读' : ''}通知</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {items.map((n) => (
                <div
                  key={n.id}
                  className='flex items-start justify-between gap-4 rounded-md border p-3'
                >
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{n.title}</span>
                      {!n.isRead && <Badge variant='destructive'>未读</Badge>}
                    </div>
                    <p className='text-muted-foreground mt-1 text-sm'>{n.body}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {formatTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleMark(n.id)}
                      disabled={markRead.isPending}
                    >
                      标记已读
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
