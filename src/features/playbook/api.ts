'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  PlaybookListResponse,
  PlaybookPhase,
  PlaybookTemplate,
  PlaybookType
} from './types';

/** GET /api/playbooks — list templates, optionally filtered by phase / type. */
async function fetchPlaybooks(
  phase?: string,
  templateType?: string
): Promise<PlaybookListResponse> {
  const params = new URLSearchParams();
  if (phase) params.set('phase', phase);
  if (templateType) params.set('template_type', templateType);
  const qs = params.toString();
  const res = await fetch(`/api/playbooks${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    throw new Error(`获取模板库失败: ${res.status}`);
  }
  return res.json();
}

/** TanStack Query hook for the playbook library. */
export function usePlaybooks(phase?: string, templateType?: string) {
  return useQuery({
    queryKey: ['playbooks', phase ?? '', templateType ?? ''],
    queryFn: () => fetchPlaybooks(phase, templateType)
  });
}

/** Request body for create / partial update. */
export type PlaybookInput = {
  phase: PlaybookPhase;
  template_type: PlaybookType;
  title: string;
  content: string;
  tags?: string | null;
};

async function createPlaybook(payload: PlaybookInput): Promise<PlaybookTemplate> {
  const res = await fetch('/api/playbooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `创建模板失败: ${res.status}`);
  }
  return res.json();
}

async function updatePlaybook(
  id: number,
  payload: Partial<PlaybookInput>
): Promise<PlaybookTemplate> {
  const res = await fetch(`/api/playbooks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `更新模板失败: ${res.status}`);
  }
  return res.json();
}

async function deletePlaybook(id: number): Promise<void> {
  const res = await fetch(`/api/playbooks/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `删除模板失败: ${res.status}`);
  }
}

/** Admin-only create mutation. */
export function useCreatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlaybook,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['playbooks'] });
    }
  });
}

/** Admin-only update mutation. */
export function useUpdatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PlaybookInput> }) =>
      updatePlaybook(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['playbooks'] });
    }
  });
}

/** Admin-only delete mutation. */
export function useDeletePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlaybook,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['playbooks'] });
    }
  });
}
