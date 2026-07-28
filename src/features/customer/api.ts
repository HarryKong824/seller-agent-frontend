'use client';

import { useQuery } from '@tanstack/react-query';

import type { CustomerListResponse, CustomerStatsResponse } from './types';

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
