'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  PerformanceConfig,
  PerformanceConfigCreateInput,
  PerformanceConfigUpdateInput,
  PerformanceScoreResponse
} from './types';

async function fetchConfigs(): Promise<PerformanceConfig[]> {
  const res = await fetch('/api/performance/configs', { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取绩效配置失败: ${res.status}`);
  }
  return res.json();
}

export function usePerformanceConfigs() {
  return useQuery({
    queryKey: ['performance-configs'],
    queryFn: fetchConfigs
  });
}

async function createConfig(payload: PerformanceConfigCreateInput): Promise<void> {
  const res = await fetch('/api/performance/configs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `创建配置失败: ${res.status}`);
  }
}

export function useCreatePerformanceConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createConfig,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['performance-configs'] });
    }
  });
}

async function updateConfig(
  id: number,
  payload: PerformanceConfigUpdateInput
): Promise<void> {
  const res = await fetch(`/api/performance/configs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `更新配置失败: ${res.status}`);
  }
}

export function useUpdatePerformanceConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & PerformanceConfigUpdateInput) =>
      updateConfig(id, rest),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['performance-configs'] });
    }
  });
}

async function fetchScore(params: {
  userId: number;
  year: number;
  periodType: string;
  periodIndex: number;
}): Promise<PerformanceScoreResponse> {
  const qs = new URLSearchParams({
    user_id: String(params.userId),
    year: String(params.year),
    period_type: params.periodType,
    period_index: String(params.periodIndex)
  });
  const res = await fetch(`/api/performance/scores?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取绩效评分失败: ${res.status}`);
  }
  return res.json();
}

export function usePerformanceScore(params: {
  userId: number | null;
  year: number;
  periodType: string;
  periodIndex: number;
}) {
  return useQuery({
    queryKey: ['performance-score', params.userId, params.year, params.periodType, params.periodIndex],
    queryFn: () =>
      fetchScore({
        userId: params.userId as number,
        year: params.year,
        periodType: params.periodType,
        periodIndex: params.periodIndex
      }),
    enabled: Number.isFinite(params.userId) && (params.userId as number) > 0
  });
}
