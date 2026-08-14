/** AI 管理建议类型（线C·C3），镜像后端 app/schemas/insights.py */

export type InsightSeverity = 'info' | 'warning' | 'critical';

export type InsightGeneratedBy = 'llm' | 'fallback';

export interface ManagementSuggestion {
  title: string;
  detail: string;
  severity: InsightSeverity;
  userId: number | null;
  fullName: string | null;
}

export interface ManagementInsightResponse {
  period: string;
  start: string;
  end: string;
  /** 'llm'=AI 生成；'fallback'=LLM 失败后的规则降级 */
  generatedBy: InsightGeneratedBy;
  summary: string;
  suggestions: ManagementSuggestion[];
}

export type InsightPeriod = 'day' | 'week' | 'month';

export const PERIOD_LABELS: Record<InsightPeriod, string> = {
  day: '今日',
  week: '本周',
  month: '本月'
};

export const SEVERITY_LABELS: Record<InsightSeverity, string> = {
  info: '提示',
  warning: '注意',
  critical: '重点'
};

export const GENERATED_BY_LABELS: Record<InsightGeneratedBy, string> = {
  llm: 'AI 生成',
  fallback: '规则建议（AI 暂不可用）'
};
