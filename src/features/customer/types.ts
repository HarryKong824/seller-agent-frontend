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
  /** 线B③ Pipeline：商机阶段 */
  stage: string;
  /** 线B③ Pipeline：商机金额（元），null=未填 */
  dealAmount: number | null;
  /** 线B③ Pipeline：预计成交日期 ISO(yyyy-MM-dd)，null=未设置 */
  expectedCloseDate: string | null;
  /** 线A·P3-3 地理围栏：客户坐标（可空）+ 围栏半径(米) */
  locationLat: number | null;
  locationLng: number | null;
  geofenceRadius: number;
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
  /** 线B③ Pipeline 经营仪表盘指标 */
  pipeline: PipelineStats;
}

/** 单阶段漏斗（仅含在途阶段，按固定顺序） */
export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  amount: number;
  winRate: number;
  weightedAmount: number;
}

/** 各阶段客户数 */
export interface StageCount {
  stage: string;
  label: string;
  count: number;
}

/** 线B③ Pipeline 核心指标 */
export interface PipelineStats {
  stageDistribution: StageCount[];
  funnel: FunnelStage[];
  openPipelineAmount: number;
  weightedForecast: number;
  wonAmount: number;
  avgDealAmount: number;
  avgCycleDays: number | null;
  winRate: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalDeals: number;
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

/** 6 阶段销售过程(2026-08-20 扩展, DECISIONS #37) - 与后端 STAGE_LABELS 镜像 */
export const STAGE_LABELS: Record<string, string> = {
  lead: '线索',
  qualified: '需求确认',
  proposal: '方案呈现',
  negotiation: '商务谈判',
  won: '已签约',
  delivered: '交付验收',
  ongoing: '持续经营',
  lost: '丢单'
};

/** 商机阶段固定顺序(6阶段+终态) */
export const STAGE_ORDER: string[] = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'delivered',
  'ongoing',
  'lost'
];

/** 在途(未关闭)阶段:参与在途金额统计 */
export const OPEN_STAGES: string[] = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'delivered',
  'ongoing'
];
