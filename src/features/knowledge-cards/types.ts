/** 知识沉淀卡片类型（线B⑤），镜像后端 app/schemas/knowledge_card.py */

export type CardCategory = 'product' | 'sales_script' | 'case' | 'faq' | 'competitor';
export type CardStatus = 'pending' | 'approved' | 'rejected';

/** 后端响应（字段已 camelCase 别名）。 */
export interface KnowledgeCard {
  id: number;
  title: string;
  content: string;
  category: string;
  categoryLabel: string;
  tags: string | null;
  status: string;
  statusLabel: string;
  sourceSessionId: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeCardListResponse {
  items: KnowledgeCard[];
  total: number;
}

/** 分类中文标签（与后端 CATEGORY_LABELS 镜像） */
export const CATEGORY_LABELS: Record<string, string> = {
  product: '产品资料',
  sales_script: '销售话术',
  case: '行业案例',
  faq: 'FAQ',
  competitor: '竞品应对'
};

/** 分类固定顺序（用于分组展示） */
export const CATEGORY_ORDER: CardCategory[] = [
  'product',
  'sales_script',
  'case',
  'faq',
  'competitor'
];

/** 状态中文标签（与后端 STATUS_LABELS 镜像） */
export const STATUS_LABELS: Record<string, string> = {
  pending: '待审核',
  approved: '已采纳',
  rejected: '已驳回'
};
