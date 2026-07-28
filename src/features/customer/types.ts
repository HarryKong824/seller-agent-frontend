/** Customer-related TypeScript types matching backend API responses. */

export interface Customer {
  id: number;
  name: string;
  industry: string;
  grade: string;
  status: string;
  ownerSales: string;
  lastFollowUpAt: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GradeDistribution {
  grade: string;
  count: number;
}

export interface CustomerStatsResponse {
  totalCustomers: number;
  gradeDistribution: GradeDistribution[];
  churnWarningCount: number;
}

export const GRADE_LABELS: Record<string, string> = {
  A: 'A级客户',
  B: 'B级客户',
  C: 'C级客户'
};

export const STATUS_LABELS: Record<string, string> = {
  prospect: '潜在',
  active: '活跃',
  dormant: '休眠',
  churned: '流失'
};
