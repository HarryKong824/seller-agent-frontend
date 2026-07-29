'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  MessageCreateRequest,
  MessageCreateResponse,
  SessionCreateRequest,
  SessionDetailResponse,
  SessionListResponse,
  SessionRenameRequest,
  SessionResponse
} from './types';

const BASE = '/api/chat';

/** Fetch session list from BFF. */
async function fetchSessions(): Promise<SessionListResponse> {
  const res = await fetch(`${BASE}/sessions`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`获取会话列表失败: ${res.status}`);
  }
  return res.json();
}

/** Create a session via BFF. */
async function createSession(data: SessionCreateRequest): Promise<SessionResponse> {
  const res = await fetch(`${BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `创建会话失败: ${res.status}`);
  }
  return res.json();
}

/** Get session detail + message history via BFF. */
async function fetchSession(sessionId: number): Promise<SessionDetailResponse> {
  const res = await fetch(`${BASE}/sessions/${sessionId}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`获取会话详情失败: ${res.status}`);
  }
  return res.json();
}

/** Rename a session via BFF. */
async function renameSession(
  sessionId: number,
  data: SessionRenameRequest
): Promise<SessionResponse> {
  const res = await fetch(`${BASE}/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `重命名会话失败: ${res.status}`);
  }
  return res.json();
}

/** Delete a session via BFF. */
async function deleteSession(sessionId: number): Promise<void> {
  const res = await fetch(`${BASE}/sessions/${sessionId}`, {
    method: 'DELETE'
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`删除会话失败: ${res.status}`);
  }
}

/** Send a message via BFF. */
async function sendMessage(
  sessionId: number,
  data: MessageCreateRequest
): Promise<MessageCreateResponse> {
  const res = await fetch(`${BASE}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `发送消息失败: ${res.status}`);
  }
  return res.json();
}

/** TanStack Query hook for session list. */
export function useSessions() {
  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: fetchSessions
  });
}

/** TanStack Query mutation for creating a session. */
export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    }
  });
}

/** TanStack Query hook for session detail + messages. */
export function useSession(sessionId: number | null) {
  return useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: () => fetchSession(sessionId!),
    enabled: sessionId !== null
  });
}

/** TanStack Query mutation for renaming a session. */
export function useRenameSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: number; title: string }) =>
      renameSession(sessionId, { title }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    }
  });
}

/** TanStack Query mutation for deleting a session. */
export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    }
  });
}

/** TanStack Query mutation for sending a message. */
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: number; data: MessageCreateRequest }) =>
      sendMessage(sessionId, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['chat-session', variables.sessionId]
      });
    }
  });
}
