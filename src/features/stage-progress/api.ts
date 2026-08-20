'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  StageProgressCreateInput,
  StageProgressListResponse,
  StageProgressStatsResponse
} from './types';

async function fetchStageProgress(customerId: number): Promise<StageProgressListResponse> {
  const res = await fetch(`/api/customers/${customerId}/stage-progress`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取阶段历史失败: ${res.status}`);
  }
  return res.json();
}

export function useStageProgress(customerId: number) {
  return useQuery({
    queryKey: ['stage-progress', customerId],
    queryFn: () => fetchStageProgress(customerId),
    enabled: Number.isFinite(customerId) && customerId > 0
  });
}

async function fetchStageStats(): Promise<StageProgressStatsResponse> {
  const res = await fetch('/api/customers/stage-stats', { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取阶段统计失败: ${res.status}`);
  }
  return res.json();
}

export function useStageStats() {
  return useQuery({
    queryKey: ['stage-stats'],
    queryFn: fetchStageStats
  });
}

async function createStageProgress(
  customerId: number,
  payload: StageProgressCreateInput
): Promise<void> {
  const res = await fetch(`/api/customers/${customerId}/stage-progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `补记阶段失败: ${res.status}`);
  }
}

export function useCreateStageProgress(customerId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StageProgressCreateInput) => createStageProgress(customerId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['stage-progress', customerId] });
      void qc.invalidateQueries({ queryKey: ['stage-stats'] });
    }
  });
}
