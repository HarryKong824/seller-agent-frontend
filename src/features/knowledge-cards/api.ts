'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CardCategory,
  CardStatus,
  KnowledgeCard,
  KnowledgeCardListResponse
} from './types';

/** GET /api/knowledge-cards — list cards (any authenticated user). */
async function fetchCards(): Promise<KnowledgeCardListResponse> {
  const res = await fetch('/api/knowledge-cards', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`获取知识卡片失败: ${res.status}`);
  }
  return res.json();
}

/** TanStack Query hook for the knowledge deposit cards. */
export function useKnowledgeCards() {
  return useQuery({
    queryKey: ['knowledge-cards'],
    queryFn: fetchCards
  });
}

/** Request body for contribution (投稿). */
export type KnowledgeCardInput = {
  title: string;
  content: string;
  category: CardCategory;
  tags?: string | null;
  sourceSessionId?: number | null;
};

async function createCard(payload: KnowledgeCardInput): Promise<KnowledgeCard> {
  const res = await fetch('/api/knowledge-cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `投稿失败: ${res.status}`);
  }
  return res.json();
}

async function updateCardStatus(
  id: number,
  status: CardStatus
): Promise<KnowledgeCard> {
  const res = await fetch(`/api/knowledge-cards/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `审核失败: ${res.status}`);
  }
  return res.json();
}

async function deleteCard(id: number): Promise<void> {
  const res = await fetch(`/api/knowledge-cards/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `删除失败: ${res.status}`);
  }
}

/** Any authenticated user may contribute (投稿) → pending card. */
export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCard,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-cards'] });
    }
  });
}

/** Admin-only review transition. */
export function useUpdateCardStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: CardStatus }) =>
      updateCardStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-cards'] });
    }
  });
}

/** Admin-only delete. */
export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['knowledge-cards'] });
    }
  });
}
