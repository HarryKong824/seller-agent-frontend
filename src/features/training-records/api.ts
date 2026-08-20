'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  TrainingRecordCreateInput,
  TrainingRecordListResponse,
  TrainingRecordUpdateInput
} from './types';

async function fetchTrainingRecords(params: {
  recordType?: string | null;
  traineeId?: number | null;
}): Promise<TrainingRecordListResponse> {
  const qs = new URLSearchParams();
  if (params.recordType) qs.set('record_type', params.recordType);
  if (params.traineeId) qs.set('trainee_id', String(params.traineeId));
  const res = await fetch(`/api/training-records?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取培训记录失败: ${res.status}`);
  }
  return res.json();
}

export function useTrainingRecords(params: {
  recordType?: string | null;
  traineeId?: number | null;
} = {}) {
  return useQuery({
    queryKey: ['training-records', params.recordType ?? 'all', params.traineeId ?? 'all'],
    queryFn: () => fetchTrainingRecords(params)
  });
}

async function createTrainingRecord(payload: TrainingRecordCreateInput): Promise<void> {
  const res = await fetch('/api/training-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `创建培训记录失败: ${res.status}`);
  }
}

export function useCreateTrainingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTrainingRecord,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['training-records'] });
    }
  });
}

async function updateTrainingRecord(
  id: number,
  payload: TrainingRecordUpdateInput
): Promise<void> {
  const res = await fetch(`/api/training-records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `更新培训记录失败: ${res.status}`);
  }
}

export function useUpdateTrainingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & TrainingRecordUpdateInput) =>
      updateTrainingRecord(id, rest),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['training-records'] });
    }
  });
}

async function deleteTrainingRecord(id: number): Promise<void> {
  const res = await fetch(`/api/training-records/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `删除培训记录失败: ${res.status}`);
  }
}

export function useDeleteTrainingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTrainingRecord,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['training-records'] });
    }
  });
}
