'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  ChatSource,
  MessageCreateRequest,
  MessageCreateResponse,
  MessageResponse,
  SessionCreateRequest,
  SessionDetailResponse,
  SessionListResponse,
  SessionRenameRequest,
  SessionResponse,
  SessionSummaryResponse
} from './types';

const BASE = '/api/chat';

/** SSE stream event from backend (see §4.1.1.1 event types). */
export interface StreamEvent {
  type: 'meta' | 'sources' | 'token' | 'done' | 'error';
  /** Token delta (type=token). */
  delta?: string;
  /** Rewritten query (type=meta). */
  rewritten_query?: string;
  /** Sub-queries (type=meta). */
  sub_queries?: string[];
  /** Source list (type=sources, done). */
  sources?: ChatSource[];
  /** Final answer (type=done). */
  answer?: string;
  /** Error message (type=error). */
  message?: string;
}

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

/** Send a message (non-streaming, used as fallback). */
export async function sendMessage(
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

/** Send a message via SSE streaming, calling onEvent for each parsed event. */
export async function sendMessageStream(
  sessionId: number,
  data: MessageCreateRequest,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const res = await fetch(`${BASE}/sessions/${sessionId}/messages/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `发送消息失败: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('无法获取响应流');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr) {
        try {
          onEvent(JSON.parse(dataStr) as StreamEvent);
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}

/** 为某条 assistant 消息请求推荐销售话术（M4-2）。 */
export async function suggestScripts(
  sessionId: number,
  messageId: number
): Promise<MessageResponse> {
  const res = await fetch(
    `${BASE}/sessions/${sessionId}/messages/${messageId}/suggest-scripts`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取推荐话术失败: ${res.status}`);
  }
  return res.json();
}

/** 生成会话结构化活动记录 + 跟进邮件草稿（线 B② AI 自动内务）。 */
export async function summarizeSession(
  sessionId: number
): Promise<SessionSummaryResponse> {
  const res = await fetch(`${BASE}/sessions/${sessionId}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `生成失败: ${res.status}`);
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

/** TanStack Query hook for creating a session. */
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

/** TanStack Query mutation for summarizing a session (线 B②). */
export function useSummarizeSession() {
  return useMutation({
    mutationFn: (sessionId: number) => summarizeSession(sessionId)
  });
}