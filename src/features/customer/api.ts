'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SessionListResponse } from '../chat/types';

import type { Customer, CustomerListResponse, CustomerStatsResponse } from './types';

/** Minimal KB shape returned by GET /customers/{id}/knowledge-bases. */
export interface RelatedKnowledgeBase {
  id: number;
  name: string;
  category: string;
  description: string | null;
}

/** Fetch paginated customer list from /api/customers. */
async function fetchCustomers(page = 1, pageSize = 20): Promise<CustomerListResponse> {
  const res = await fetch(`/api/customers?page=${page}&pageSize=${pageSize}`);
  if (!res.ok) {
    throw new Error(`获取客户列表失败: ${res.status}`);
  }
  return res.json();
}

/** Fetch customer statistics from /api/customers/stats. */
async function fetchCustomerStats(): Promise<CustomerStatsResponse> {
  const res = await fetch('/api/customers/stats');
  if (!res.ok) {
    throw new Error(`获取统计数据失败: ${res.status}`);
  }
  return res.json();
}

/** TanStack Query hook for customer list. */
export function useCustomers(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['customers', page, pageSize],
    queryFn: () => fetchCustomers(page, pageSize)
  });
}

/** TanStack Query hook for customer stats. */
export function useCustomerStats() {
  return useQuery({
    queryKey: ['customer-stats'],
    queryFn: fetchCustomerStats
  });
}

/** Fetch a single customer by id from /api/customers/{id}. */
async function fetchCustomer(id: number): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `获取客户详情失败: ${res.status}`);
  }
  return res.json();
}

/** TanStack Query hook for a single customer's detail. */
export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetchCustomer(id),
    enabled: Number.isFinite(id) && id > 0
  });
}

/** Delete a customer via BFF (admin only, enforced by backend). */
async function deleteCustomer(id: number): Promise<void> {
  const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `删除客户失败: ${res.status}`);
  }
}

/** TanStack Query mutation for deleting a customer. */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });
}

/** TanStack Query hook for chat sessions linked to a customer. */
export function useCustomerSessions(id: number) {
  return useQuery({
    queryKey: ['customer-sessions', id],
    queryFn: async (): Promise<SessionListResponse> => {
      const res = await fetch(`/api/customers/${id}/sessions`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `获取关联会话失败: ${res.status}`);
      }
      return res.json();
    },
    enabled: Number.isFinite(id) && id > 0
  });
}

/** TanStack Query hook for KBs used by a customer's sessions. */
export function useCustomerKnowledgeBases(id: number) {
  return useQuery({
    queryKey: ['customer-kbs', id],
    queryFn: async (): Promise<RelatedKnowledgeBase[]> => {
      const res = await fetch(`/api/customers/${id}/knowledge-bases`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `获取关联知识库失败: ${res.status}`);
      }
      return res.json();
    },
    enabled: Number.isFinite(id) && id > 0
  });
}
