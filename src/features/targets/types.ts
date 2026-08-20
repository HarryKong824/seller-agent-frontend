/** KPI 目标管理类型（线C·C4 + P3-2，DECISIONS #33/#35），镜像后端 app/schemas/targets.py */

export type PeriodType = 'month' | 'quarter' | 'week';

export interface TargetResponse {
  id: number;
  ownerId: number;
  ownerFullName: string | null;
  setById: number;
  managerId: number | null;
  parentTargetId: number | null;
  objective: string | null;
  year: number;
  periodType: PeriodType;
  periodIndex: number;
  visitsCountTarget: number;
  newOpportunitiesTarget: number;
  stageAdvancesTarget: number;
  callMinutesTarget: number;
  emailsSentTarget: number;
  dealAmountTarget: number;
  createdAt: string;
  updatedAt: string;
}

export interface TargetMetricCompletion {
  metric: string;
  label: string;
  actual: number;
  target: number;
  completionRate: number;
}

export interface TargetCompletionResponse {
  ownerId: number;
  ownerFullName: string;
  year: number;
  periodType: PeriodType;
  periodIndex: number;
  periodStart: string;
  periodEnd: string;
  /** 是否设置了目标（区分未设目标与设了但为 0） */
  targetSet: boolean;
  actual: {
    visitsCount: number;
    newOpportunities: number;
    stageAdvances: number;
    callMinutes: number;
    emailsSent: number;
    dealAmount: number;
  };
  target: {
    visitsCount: number;
    newOpportunities: number;
    stageAdvances: number;
    callMinutes: number;
    emailsSent: number;
    dealAmount: number;
  };
  metrics: TargetMetricCompletion[];
  overallCompletion: number;
}

/** 创建目标请求体（snake_case，与后端一致）。 */
export interface TargetCreateInput {
  owner_id: number;
  year: number;
  period_type?: PeriodType;
  period_index: number;
  manager_id?: number | null;
  visits_count_target?: number;
  new_opportunities_target?: number;
  stage_advances_target?: number;
  call_minutes_target?: number;
  emails_sent_target?: number;
  deal_amount_target?: number;
}

export interface TargetUpdateInput {
  visits_count_target?: number;
  new_opportunities_target?: number;
  stage_advances_target?: number;
  call_minutes_target?: number;
  emails_sent_target?: number;
  deal_amount_target?: number;
}

/** 6 指标展示顺序（与后端 METRIC_LABELS 对齐）。 */
export const TARGET_METRICS: { key: keyof TargetResponse; label: string; isAmount?: boolean }[] = [
  { key: 'visitsCountTarget', label: '拜访数(打卡)' },
  { key: 'newOpportunitiesTarget', label: '新增商机' },
  { key: 'stageAdvancesTarget', label: '阶段推进' },
  { key: 'callMinutesTarget', label: '通话分钟' },
  { key: 'emailsSentTarget', label: '邮件发送' },
  { key: 'dealAmountTarget', label: '成交金额(元)' }
];

/** 周期类型展示顺序与中文标签。 */
export const PERIOD_TYPES: { value: PeriodType; label: string; max: number }[] = [
  { value: 'month', label: '月', max: 12 },
  { value: 'quarter', label: '季', max: 4 },
  { value: 'week', label: '周', max: 53 }
];

export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  month: '月',
  quarter: '季',
  week: '周'
};


/** 目标树节点(层级拆解视图:年度→季度→月度→周度) */
export interface TargetTreeNode {
  target: TargetResponse;
  children: TargetTreeNode[];
}

/** 周期类型含 year (用于年度目标) */
export type PeriodTypeWithYear = PeriodType | 'year';
