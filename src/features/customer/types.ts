/** Customer-related TypeScript types matching backend API responses. */

export interface Customer {
  id: number;
  name: string;
  industry: string;
  grade: string;
  status: string;
  ownerSales: string;
  lastFollowUpAt: string | null;
  /** 客户 360：健康度评分 0-100，null=未评估 */
  healthScore: number | null;
  /** 客户 360：续约日期 ISO(yyyy-MM-dd)，null=未设置 */
  renewalDate: string | null;
  created_at: string;
  updated_at: string;
}

/** DMU 决策链联系人（后端无别名，snake_case 对齐）。 */
export interface Contact {
  id: number;
  customer_id: number;
  name: string;
  role: string;
  attitude: string;
  power: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactListResponse {
  items: Contact[];
  total: number;
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
