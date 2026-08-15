'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  PeriodType,
  TargetCompletionResponse,
  TargetCreateInput,
  TargetResponse,
  TargetUpdateInput
} from './types';

/** 管理者选择销售下拉用：拉取用户列表（取销售/经理角色）。 */
export interface UserOption {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

export async function fetchUsers(): Promise<UserOption[]> {
  const res = await fetch('/api/users', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`获取用户列表失败: ${res.status}`);
  }
  return res.json();
}

export function useUsers() {
  return useQuery({
    queryKey: ['users-options'],
    queryFn: fetchUsers
  });
}

/** 目标列表（manager/admin 看全部，sales 看自己），支持周期/团队过滤。 */
export async function fetchTargets(params: {
  ownerId?: number | null;
  year?: number | null;
  periodType?: PeriodType | null;
  periodIndex?: number | null;
  managerId?: number | null;
}): Promise<TargetResponse[]> {
  const qs = new URLSearchParams();
  if (params.ownerId) qs.set('owner_id', String(params.ownerId));
  if (params.year) qs.set('year', String(params.year));
  if (params.periodType) qs.set('period_type', params.periodType);
  if (params.periodIndex) qs.set('period_index', String(params.periodIndex));
  if (params.managerId) qs.set('manager_id', String(params.managerId));

  const res = await fetch(`/api/targets?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取目标失败: ${res.status}`);
  }
  return res.json();
}

export function useTargets(params: {
  ownerId?: number | null;
  year?: number | null;
  periodType?: PeriodType | null;
  periodIndex?: number | null;
  managerId?: number | null;
} = {}) {
  return useQuery({
    queryKey: [
      'targets',
      params.ownerId ?? 'all',
      params.year ?? 'all',
      params.periodType ?? 'all',
      params.periodIndex ?? 'all',
      params.managerId ?? 'all'
    ],
    queryFn: () => fetchTargets(params)
  });
}

/** 目标完成率（manager/admin 查指定 owner，sales 仅查自己）。 */
export async function fetchTargetCompletion(params: {
  ownerId: number;
  year: number;
  periodType?: PeriodType;
  periodIndex: number;
}): Promise<TargetCompletionResponse> {
  const qs = new URLSearchParams({
    owner_id: String(params.ownerId),
    year: String(params.year),
    period_type: params.periodType ?? 'month',
    period_index: String(params.periodIndex)
  });
  const res = await fetch(`/api/targets/completion?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取完成率失败: ${res.status}`);
  }
  return res.json();
}

export function useTargetCompletion(params: {
  ownerId: number;
  year: number;
  periodType?: PeriodType;
  periodIndex: number;
}) {
  return useQuery({
    queryKey: [
      'target-completion',
      params.ownerId,
      params.year,
      params.periodType ?? 'month',
      params.periodIndex
    ],
    queryFn: () => fetchTargetCompletion(params)
  });
}

async function createTarget(payload: TargetCreateInput): Promise<TargetResponse> {
  const res = await fetch('/api/targets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `创建目标失败: ${res.status}`);
  }
  return res.json();
}

async function updateTarget(id: number, payload: TargetUpdateInput): Promise<TargetResponse> {
  const res = await fetch(`/api/targets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `更新目标失败: ${res.status}`);
  }
  return res.json();
}

async function deleteTarget(id: number): Promise<void> {
  const res = await fetch(`/api/targets/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `删除目标失败: ${res.status}`);
  }
}

export function useCreateTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTarget,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['targets'] });
    }
  });
}

export function useUpdateTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & TargetUpdateInput) => updateTarget(id, rest),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['targets'] });
      void qc.invalidateQueries({ queryKey: ['target-completion'] });
    }
  });
}

export function useDeleteTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTarget,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['targets'] });
      void qc.invalidateQueries({ queryKey: ['target-completion'] });
    }
  });
}
