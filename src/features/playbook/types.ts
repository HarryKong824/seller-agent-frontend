/** Playbook 模板库类型（线B④），镜像后端 app/schemas/playbook.py */

export type PlaybookPhase = 'discovery' | 'validation' | 'proposal' | 'commercial' | 'delivery';
export type PlaybookType = 'playbook' | 'email' | 'quote' | 'objection';

/** 后端响应（字段已 camelCase 别名）。 */
export interface PlaybookTemplate {
  id: number;
  phase: string;
  phaseLabel: string;
  templateType: string;
  typeLabel: string;
  title: string;
  content: string;
  tags: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaybookListResponse {
  items: PlaybookTemplate[];
  total: number;
}

/** 阶段中文标签（与后端 PHASE_LABELS 镜像） */
export const PHASE_LABELS: Record<string, string> = {
  discovery: '发现',
  validation: '验证',
  proposal: '方案',
  commercial: '商务',
  delivery: '交付'
};

/** 阶段固定顺序（用于分组展示）：发现→验证→方案→商务→交付 */
export const PHASE_ORDER: PlaybookPhase[] = [
  'discovery',
  'validation',
  'proposal',
  'commercial',
  'delivery'
];

/** 类型中文标签（与后端 TYPE_LABELS 镜像） */
export const TYPE_LABELS: Record<string, string> = {
  playbook: '打法卡',
  email: '邮件',
  quote: '报价',
  objection: '异议'
};
