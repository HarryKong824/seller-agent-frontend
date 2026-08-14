/** 管理者聚合报表类型（线C·C2），镜像后端 app/schemas/reports.py */

/** 单个销售的周期聚合指标（自报 vs GPS 客观打卡交叉校验）。 */
export interface TeamMemberReport {
  userId: number;
  fullName: string | null;
  reportCount: number;
  /** 自报拜访数（来自 daily_reports） */
  visitsCount: number;
  /** GPS 客观打卡数（来自 visit_checkins，KPI 公平基准） */
  actualVisits: number;
  newOpportunities: number;
  stageAdvances: number;
  callMinutes: number;
  emailsSent: number;
  dealAmount: number;
}

/** 全队合计。 */
export interface TeamReportTotals {
  reportCount: number;
  visitsCount: number;
  actualVisits: number;
  newOpportunities: number;
  stageAdvances: number;
  callMinutes: number;
  emailsSent: number;
  dealAmount: number;
}

/** 管理者聚合报表响应。 */
export interface TeamReportResponse {
  period: string;
  start: string;
  end: string;
  members: TeamMemberReport[];
  totals: TeamReportTotals;
}

export type ReportPeriod = 'day' | 'week' | 'month';

/** 量化指标展示顺序（突出可量化 KPI，自报 vs 客观并列）。 */
export const METRIC_ORDER: { key: keyof TeamMemberReport; label: string }[] = [
  { key: 'visitsCount', label: '自报拜访' },
  { key: 'actualVisits', label: 'GPS 打卡' },
  { key: 'newOpportunities', label: '新增商机' },
  { key: 'stageAdvances', label: '推进阶段' },
  { key: 'callMinutes', label: '通话分钟' },
  { key: 'emailsSent', label: '发送邮件' },
  { key: 'dealAmount', label: '推进金额(元)' }
];

export const PERIOD_LABELS: Record<ReportPeriod, string> = {
  day: '今日',
  week: '本周',
  month: '本月'
};
