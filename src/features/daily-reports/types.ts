/** 每日报表类型（线C·C1 / F14），镜像后端 app/schemas/daily_report.py */

export type ReportMode = 'ai_chat' | 'form';

/** 管理者人审结论（F14 决策 #4/#5）。 */
export type ManagerJudgment = 'normal' | 'pending' | 'abnormal';

/** 逐客户拜访动作明细（读出，镜像 DailyReportVisitResponse）。 */
export interface DailyReportVisit {
  id: number;
  dailyReportId: number;
  customerId: number;
  customerName: string | null;
  visitActionNote: string | null;
  managerJudgment: ManagerJudgment;
  managerScore: number | null;
  visitScore: number | null;
  createdAt: string;
  updatedAt: string;
}

/** 逐客户拜访动作明细（写入，镜像 DailyReportVisitCreate，snake_case 体）。 */
export interface DailyReportVisitInput {
  customer_id: number;
  visit_action_note: string;
}

/** 后端响应（字段已 camelCase 别名）。 */
export interface DailyReport {
  id: number;
  userId: number;
  reportDate: string;
  mode: ReportMode;
  visitsCount: number;
  newOpportunities: number;
  stageAdvances: number;
  callMinutes: number;
  emailsSent: number;
  dealAmount: number;
  summary: string | null;
  aiRaw: string | null;
  /** F14：逐客户拜访动作明细。 */
  visits: DailyReportVisit[];
  /** KPI 真值：管理者人审正常的明细数。 */
  effectiveVisitsCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 量化指标键（仅数值型 KPI，用于详情卡展示）。 */
export type DailyReportMetricKey =
  | 'visitsCount'
  | 'newOpportunities'
  | 'stageAdvances'
  | 'callMinutes'
  | 'emailsSent'
  | 'dealAmount';

/** 量化指标展示顺序（用于详情卡，突出可量化 KPI）。 */
export const METRIC_ORDER: { key: DailyReportMetricKey; label: string }[] = [
  { key: 'visitsCount', label: '拜访数(打卡)' },
  { key: 'newOpportunities', label: '新增商机' },
  { key: 'stageAdvances', label: '推进阶段' },
  { key: 'callMinutes', label: '通话分钟' },
  { key: 'emailsSent', label: '发送邮件' },
  { key: 'dealAmount', label: '推进金额(元)' }
];

export const MODE_LABELS: Record<ReportMode, string> = {
  ai_chat: 'AI 生成',
  form: '手动填写'
};
