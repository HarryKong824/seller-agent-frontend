'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { DailyReport } from './types';

/** GET /api/daily-reports/me — list current user's reports (optional date filter). */
async function fetchMyReports(date?: string): Promise<DailyReport[]> {
  const qs = date ? `?report_date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`/api/daily-reports/me${qs}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`获取日报失败: ${res.status}`);
  }
  return res.json();
}

export function useDailyReports(date?: string) {
  return useQuery({
    queryKey: ['daily-reports', date ?? 'all'],
    queryFn: () => fetchMyReports(date)
  });
}

/** 手动填写提交体。 */
export type DailyReportInput = {
  report_date: string;
  new_opportunities?: number;
  stage_advances?: number;
  call_minutes?: number;
  emails_sent?: number;
  deal_amount?: number;
  summary?: string | null;
};

async function createReport(payload: DailyReportInput): Promise<DailyReport> {
  const res = await fetch('/api/daily-reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `提交失败: ${res.status}`);
  }
  return res.json();
}

/** AI 生成提交体。 */
export type DailyReportGenerateInput = {
  report_date: string;
  transcript: string;
};

async function generateReport(
  payload: DailyReportGenerateInput
): Promise<DailyReport> {
  const res = await fetch('/api/daily-reports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `AI 生成失败: ${res.status}`);
  }
  return res.json();
}

async function updateReport(
  id: number,
  payload: Partial<DailyReportInput>
): Promise<DailyReport> {
  const res = await fetch(`/api/daily-reports/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `更新失败: ${res.status}`);
  }
  return res.json();
}

async function deleteReport(id: number): Promise<void> {
  const res = await fetch(`/api/daily-reports/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `删除失败: ${res.status}`);
  }
}

/** 当前用户提交自己的日报（量化指标）。 */
export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['daily-reports'] });
    }
  });
}

/** AI 从对话/工作记录生成日报。 */
export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generateReport,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['daily-reports'] });
    }
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & Partial<DailyReportInput>) =>
      updateReport(id, rest),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['daily-reports'] });
    }
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['daily-reports'] });
    }
  });
}
