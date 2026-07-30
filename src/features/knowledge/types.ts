/** Knowledge base related TypeScript types matching backend API responses. */

export interface KnowledgeBase {
  id: number;
  name: string;
  description: string | null;
  category: string;
  ownerId: number;
  ownerUsername?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseListResponse {
  items: KnowledgeBase[];
  total: number;
}

export interface KnowledgeBaseCreate {
  name: string;
  description?: string;
  category: 'product' | 'sales_script' | 'case' | 'faq';
}

export type DocStatus = 'pending' | 'parsing' | 'indexing' | 'indexed' | 'failed';

export interface Document {
  id: number;
  kbId: number;
  filename: string;
  fileType: string;
  status: DocStatus;
  chunkCount: number;
  indexProgress: number;
  errorMsg: string | null;
  uploadedBy: string;
  created_at: string;
  updated_at: string;
}

export interface ChunkSearchResult {
  chunkId: number;
  docId: number;
  content: string;
  score: number;
  metaJson: Record<string, string | number> | null;
  fused: boolean;
}

export interface SearchResponse {
  chunks: ChunkSearchResult[];
  fused: boolean;
  total: number;
}

export interface SearchRequest {
  query: string;
  topK?: number;
  filterDocIds?: number[];
}

export const CATEGORY_LABELS: Record<string, string> = {
  product: '产品资料',
  sales_script: '销售话术',
  case: '行业案例',
  faq: '常见问题'
};

export const STATUS_LABELS: Record<DocStatus, string> = {
  pending: '待解析',
  parsing: '解析中',
  indexing: '索引中',
  indexed: '已索引',
  failed: '失败'
};
