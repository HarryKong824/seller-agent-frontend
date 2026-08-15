/** 线索管理类型（线C·P3-1），镜像后端 app/schemas/lead.py */

export type LeadSource = '展会' | '广告' | '转介绍' | '官网' | '电话' | '其他';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'disqualified' | 'converted';
export type CustomerGrade = 'A' | 'B' | 'C';

export interface LeadResponse {
  id: number;
  companyName: string | null;
  contactName: string;
  phone: string | null;
  email: string | null;
  source: LeadSource;
  status: LeadStatus;
  ownerSales: string;
  interest: string | null;
  score: number | null;
  convertedCustomerId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadListResponse {
  items: LeadResponse[];
  total: number;
  page: number;
  pageSize: number;
}

/** 创建线索请求体（snake_case，与后端一致；owner_sales 由后端强制为 JWT 用户）。 */
export interface LeadCreateInput {
  company_name?: string | null;
  contact_name: string;
  phone?: string | null;
  email?: string | null;
  source?: LeadSource;
  interest?: string | null;
  score?: number | null;
}

export interface LeadUpdateInput {
  company_name?: string | null;
  contact_name?: string;
  phone?: string | null;
  email?: string | null;
  source?: LeadSource;
  status?: LeadStatus;
  interest?: string | null;
  score?: number | null;
}

/** 转化请求体（可选）：补全客户行业与分级。 */
export interface LeadConvertInput {
  industry?: string;
  grade?: CustomerGrade;
}

/** 来源展示顺序（与后端 LeadSource 枚举对齐）。 */
export const LEAD_SOURCES: LeadSource[] = ['展会', '广告', '转介绍', '官网', '电话', '其他'];

/** 状态中文标签（key 与后端 status 一致）。 */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: '新建',
  contacted: '已联系',
  qualified: '已确认',
  disqualified: '已淘汰',
  converted: '已转化'
};
