'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface VisitCheckin {
  id: number;
  user_id: number;
  customer_id: number | null;
  visit_target: string;
  action: string;
  check_in_type: string;
  location_lat: number;
  location_lng: number;
  location_accuracy: number | null;
  address: string | null;
  note: string | null;
  created_at: string;
}

export interface VisitCheckinListResponse {
  items: VisitCheckin[];
  total: number;
}

export interface VisitCheckinCreate {
  customer_id?: number | null;
  visit_target: string;
  action: string;
  check_in_type?: string;
  location_lat: number;
  location_lng: number;
  location_accuracy?: number | null;
  address?: string | null;
  note?: string | null;
}

async function fetchVisits(params: { customerId?: number; date?: string } = {}): Promise<VisitCheckinListResponse> {
  const qs = new URLSearchParams();
  if (params.customerId) qs.set('customer_id', String(params.customerId));
  if (params.date) qs.set('visit_date', params.date);
  const res = await fetch(`/api/visits?${qs.toString()}`);
  if (!res.ok) {
    throw new Error(`获取拜访记录失败: ${res.status}`);
  }
  return res.json();
}

export function useVisits(params: { customerId?: number; date?: string } = {}) {
  return useQuery({
    queryKey: ['visits', params.customerId, params.date],
    queryFn: () => fetchVisits(params)
  });
}

async function createVisit(payload: VisitCheckinCreate): Promise<VisitCheckin> {
  const res = await fetch('/api/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `创建拜访打卡失败: ${res.status}`);
  }
  return res.json();
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVisit,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['visits'] });
    }
  });
}
