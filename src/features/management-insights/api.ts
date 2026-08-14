'use client';

import { useMutation } from '@tanstack/react-query';

import type {
  InsightPeriod,
  ManagementInsightResponse
} from './types';

/** POST /api/insights/management — manager/admin 专属：基于团队量化数据生成管理建议。 */
export async function fetchManagementInsight(params: {
  period: InsightPeriod;
  userId?: number | null;
  start?: string | null;
  end?: string | null;
}): Promise<ManagementInsightResponse> {
  const body: Record<string, unknown> = { period: params.period };
  if (params.userId) body.user_id = params.userId;
  if (params.start) body.start = params.start;
  if (params.end) body.end = params.end;

  const res = await fetch('/api/insights/management', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取管理建议失败: ${res.status}`);
  }
  return res.json();
}

export function useManagementInsight() {
  return useMutation({ mutationFn: fetchManagementInsight });
}
