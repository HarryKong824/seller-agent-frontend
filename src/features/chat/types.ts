/** Chat-related TypeScript types matching backend chat API schemas.

Backend (app/schemas/chat.py) uses serialization_alias for camelCase JSON output:
  SessionResponse → { id, userId, kbId, title, createdAt, updatedAt }
  MessageResponse → { id, sessionId, role, content, sources, kbId, createdAt }

Sources are stored as JSONB dicts with snake_case keys (doc_id, chunk_id, etc.).
*/

/** POST /chat/sessions request body. */
export interface SessionCreateRequest {
  kbId?: number;
  customerId?: number;
  title?: string;
}

/** Session response (GET/POST/PATCH /chat/sessions). */
export interface SessionResponse {
  id: number;
  userId: string;
  kbId: number | null;
  customerId: number | null;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /chat/sessions list response. */
export interface SessionListResponse {
  items: SessionResponse[];
  total: number;
}

/** PATCH /chat/sessions/{id} request body. */
export interface SessionRenameRequest {
  title: string;
}

/** Citation source attached to assistant messages. */
export interface ChatSource {
  doc_id: number;
  chunk_id: number;
  source: string | null;
  snippet: string;
}

/** Message response (inside SessionDetailResponse). */
export interface MessageResponse {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources: ChatSource[] | null;
  kbId: number | null;
  createdAt: string;
  suggestedScripts?: string[] | null;
}

/** GET /chat/sessions/{id} response — session detail + message history. */
export interface SessionDetailResponse {
  session: SessionResponse;
  messages: MessageResponse[];
}

/** POST /chat/sessions/{id}/messages request body. */
export interface MessageCreateRequest {
  query: string;
  kbId?: number;
}

/** POST /chat/sessions/{id}/messages response — single conversation turn. */
export interface MessageCreateResponse {
  answer: string;
  sources: ChatSource[];
  rewrittenQuery?: string;
  subQueries?: string[];
}

/** POST /chat/sessions/{id}/summarize response (线 B② AI 自动内务). */
export interface SessionSummaryResponse {
  customer: string;
  summary: string;
  keyPoints: string[];
  nextSteps: string[];
  followUpEmailSubject: string;
  followUpEmailBody: string;
}
