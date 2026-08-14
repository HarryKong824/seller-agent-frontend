'use client';

import { useQuery } from '@tanstack/react-query';

import type { ReportPeriod, TeamReportResponse } from './types';

/** GET /api/reports/team — manager/admin 专属：按销售与周期聚合量化指标。 */
export async function fetchTeamReport(params: {
  period: ReportPeriod;
  userId?: number | null;
  start?: string | null;
  end?: string | null;
}): Promise<TeamReportResponse> {
  const qs = new URLSearchParams({ period: params.period });
  if (params.userId) qs.set('user_id', String(params.userId));
  if (params.start) qs.set('start', params.start);
  if (params.end) qs.set('end', params.end);

  const res = await fetch(`/api/reports/team?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取团队报表失败: ${res.status}`);
  }
  return res.json();
}

export function useTeamReport(params: {
  period: ReportPeriod;
  userId?: number | null;
  start?: string | null;
  end?: string | null;
}) {
  return useQuery({
    queryKey: ['team-report', params.period, params.userId ?? 'all', params.start ?? '', params.end ?? ''],
    queryFn: () => fetchTeamReport(params)
  });
}

/** 管理者选择销售下拉用：拉取用户列表（取销售角色）。 */
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
