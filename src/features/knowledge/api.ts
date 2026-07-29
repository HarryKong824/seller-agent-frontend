'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  Document,
  KnowledgeBase,
  KnowledgeBaseCreate,
  KnowledgeBaseListResponse,
  SearchRequest,
  SearchResponse
} from './types';

/** Fetch knowledge base list from BFF /api/knowledge-bases. */
async function fetchKnowledgeBases(): Promise<KnowledgeBaseListResponse> {
  const res = await fetch('/api/knowledge-bases', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`获取知识库列表失败: ${res.status}`);
  }
  return res.json();
}

/** Create a knowledge base via BFF. */
async function createKnowledgeBase(data: KnowledgeBaseCreate): Promise<KnowledgeBase> {
  const res = await fetch('/api/knowledge-bases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `创建知识库失败: ${res.status}`);
  }
  return res.json();
}

/** Fetch documents for a KB from BFF. */
async function fetchDocuments(kbId: number): Promise<Document[]> {
  const res = await fetch(`/api/knowledge-bases/${kbId}/documents`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`获取文档列表失败: ${res.status}`);
  }
  return res.json();
}

/** Upload a document via BFF (multipart/form-data passthrough). */
async function uploadDocument(kbId: number, file: File): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`/api/knowledge-bases/${kbId}/documents`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `上传文档失败: ${res.status}`);
  }
  return res.json();
}

/** Search chunks via BFF. */
async function searchChunks(kbId: number, body: SearchRequest): Promise<SearchResponse> {
  const res = await fetch(`/api/knowledge-bases/${kbId}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `检索失败: ${res.status}`);
  }
  return res.json();
}

/** TanStack Query hook for knowledge base list. */
export function useKnowledgeBases() {
  return useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: fetchKnowledgeBases
  });
}

/** TanStack Query mutation for creating a knowledge base. */
export function useCreateKnowledgeBase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKnowledgeBase,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['knowledge-bases'] });
    }
  });
}

/** TanStack Query hook for documents in a KB. Polls while indexing. */
export function useDocuments(kbId: number) {
  return useQuery({
    queryKey: ['documents', kbId],
    queryFn: () => fetchDocuments(kbId),
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (!docs) return 3000;
      const hasPending = docs.some(
        (d) => d.status === 'pending' || d.status === 'parsing' || d.status === 'indexing'
      );
      return hasPending ? 3000 : false;
    }
  });
}

/** TanStack Query mutation for uploading a document. */
export function useUploadDocument(kbId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadDocument(kbId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents', kbId] });
    }
  });
}

/** TanStack Query mutation for searching chunks. */
export function useSearch(kbId: number) {
  return useMutation({
    mutationFn: (body: SearchRequest) => searchChunks(kbId, body)
  });
}
