'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  LeadConvertInput,
  LeadCreateInput,
  LeadListResponse,
  LeadResponse,
  LeadUpdateInput
} from './types';

/** 线索列表（sales 仅自己，manager/admin 全团队），支持状态/来源过滤。 */
export async function fetchLeads(params: {
  status?: string | null;
  source?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<LeadListResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.source) qs.set('source', params.source);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('page_size', String(params.pageSize));

  const res = await fetch(`/api/leads?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取线索失败: ${res.status}`);
  }
  return res.json();
}

export function useLeads(params: { status?: string | null; source?: string | null } = {}) {
  return useQuery({
    queryKey: ['leads', params.status ?? 'all', params.source ?? 'all'],
    queryFn: () => fetchLeads(params)
  });
}

/** 单条线索详情（按 owner 隔离，越权返回 404）。 */
export async function fetchLead(id: number): Promise<LeadResponse> {
  const res = await fetch(`/api/leads/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取线索详情失败: ${res.status}`);
  }
  return res.json();
}

export function useLead(id: number | null) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLead(id as number),
    enabled: id != null
  });
}

async function createLead(payload: LeadCreateInput): Promise<LeadResponse> {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `创建线索失败: ${res.status}`);
  }
  return res.json();
}

async function updateLead(id: number, payload: LeadUpdateInput): Promise<LeadResponse> {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `更新线索失败: ${res.status}`);
  }
  return res.json();
}

async function deleteLead(id: number): Promise<void> {
  const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `删除线索失败: ${res.status}`);
  }
}

async function convertLead(id: number, payload: LeadConvertInput = {}): Promise<LeadResponse> {
  const res = await fetch(`/api/leads/${id}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `转化线索失败: ${res.status}`);
  }
  return res.json();
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leads'] });
    }
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & LeadUpdateInput) => updateLead(id, rest),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leads'] });
    }
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leads'] });
    }
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & LeadConvertInput) => convertLead(id, rest),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leads'] });
      void qc.invalidateQueries({ queryKey: ['customers'] });
    }
  });
}
