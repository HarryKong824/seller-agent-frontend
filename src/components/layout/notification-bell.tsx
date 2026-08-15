'use client';

import Link from 'next/link';

import { useUnreadCount } from '@/features/notifications/api';

import { Icons } from '@/components/icons';

/** Header 未读通知角标（轮询未读数，点击进入通知中心）。 */
export default function NotificationBell() {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;

  return (
    <Link
      href='/dashboard/notifications'
      className='hover:bg-accent relative inline-flex h-9 w-9 items-center justify-center rounded-md'
      aria-label='通知中心'
    >
      <Icons.notification className='size-5' />
      {count > 0 && (
        <span className='bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold'>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
