'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NotificationListResponse, UnreadCountResponse } from './types';

/** 当前用户通知列表（分页 + 仅未读过滤）。 */
export async function fetchNotifications(params: {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
} = {}): Promise<NotificationListResponse> {
  const qs = new URLSearchParams();
  if (params.unreadOnly) qs.set('unread_only', 'true');
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('page_size', String(params.pageSize));

  const res = await fetch(`/api/notifications?${qs.toString()}`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取通知失败: ${res.status}`);
  }
  return res.json();
}

export function useNotifications(params: { unreadOnly?: boolean } = {}) {
  return useQuery({
    queryKey: ['notifications', params.unreadOnly ? 'unread' : 'all'],
    queryFn: () => fetchNotifications(params)
  });
}

/** 当前用户未读数量（header 角标用，定时刷新）。 */
export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const res = await fetch('/api/notifications/unread-count', {
    cache: 'no-store'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取未读失败: ${res.status}`);
  }
  return res.json();
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000
  });
}

async function markRead(id: number): Promise<void> {
  const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `标记已读失败: ${res.status}`);
  }
}

async function markAllRead(): Promise<void> {
  const res = await fetch('/api/notifications/read-all', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `全部已读失败: ${res.status}`);
  }
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}
