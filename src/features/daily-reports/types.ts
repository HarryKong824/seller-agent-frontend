/** 每日报表类型（线C·C1），镜像后端 app/schemas/daily_report.py */

export type ReportMode = 'ai_chat' | 'form';

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
  createdAt: string;
  updatedAt: string;
}

/** 量化指标展示顺序（用于详情卡，突出可量化 KPI）。 */
export const METRIC_ORDER: { key: keyof DailyReport; label: string }[] = [
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
