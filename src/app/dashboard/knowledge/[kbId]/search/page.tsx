'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { useDocuments, useSearch } from '@/features/knowledge/api';
import type { ChunkSearchResult } from '@/features/knowledge/types';

const TOP_K_OPTIONS = [3, 5, 10, 20];

export default function KbSearchPage() {
  const params = useParams<{ kbId: string }>();
  const kbId = Number(params.kbId);
  return <KbSearchContent kbId={kbId} />;
}

function KbSearchContent({ kbId }: { kbId: number }) {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [filterDocId, setFilterDocId] = useState<string>('all');
  const [results, setResults] = useState<ChunkSearchResult[] | null>(null);
  const [fused, setFused] = useState(false);

  const { data: docs } = useDocuments(kbId);
  const searchMutation = useSearch(kbId);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      toast.error('请输入检索关键词');
      return;
    }

    try {
      const body: {
        query: string;
        topK: number;
        filterDocIds?: number[];
      } = {
        query: trimmed,
        topK
      };
      if (filterDocId !== 'all') {
        body.filterDocIds = [Number(filterDocId)];
      }

      const res = await searchMutation.mutateAsync(body);
      setResults(res.chunks);
      setFused(res.fused);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '检索失败');
      setResults(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !searchMutation.isPending) {
      void handleSearch();
    }
  };

  // 构建文档 ID → 文件名映射
  const docMap = new Map<number, string>();
  docs?.forEach((d) => {
    if (d.status === 'indexed') docMap.set(d.id, d.filename);
  });

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      {/* 面包屑 */}
      <div className='flex items-center gap-2'>
        <Link
          href='/dashboard/knowledge'
          className='text-muted-foreground hover:text-foreground text-sm'
        >
          知识库
        </Link>
        <span className='text-muted-foreground'>/</span>
        <Link
          href={`/dashboard/knowledge/${kbId}`}
          className='text-muted-foreground hover:text-foreground text-sm'
        >
          文档管理
        </Link>
        <span className='text-muted-foreground'>/</span>
        <h2 className='text-2xl font-bold tracking-tight'>检索测试台</h2>
      </div>

      {/* 搜索控制区 */}
      <Card>
        <CardHeader>
          <CardTitle>检索测试</CardTitle>
          <CardDescription>
            输入关键词测试 RAG 召回效果，查看分块原文、相似度分数和来源信息。
          </CardDescription>
        </CardHeader>
        <div className='px-6 pb-6'>
          <div className='flex items-center gap-3'>
            <Input
              placeholder='输入检索关键词...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className='flex-1'
              disabled={searchMutation.isPending}
            />
            <Select value={String(topK)} onValueChange={(v) => setTopK(Number(v))}>
              <SelectTrigger className='w-[100px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOP_K_OPTIONS.map((k) => (
                  <SelectItem key={k} value={String(k)}>
                    Top {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {docs && docs.filter((d) => d.status === 'indexed').length > 0 && (
              <Select
                value={filterDocId}
                onValueChange={(v) => setFilterDocId(v ?? 'all')}
              >
                <SelectTrigger className='w-[200px]'>
                  <SelectValue placeholder='筛选文档' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全部文档</SelectItem>
                  {docs
                    .filter((d) => d.status === 'indexed')
                    .map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.filename}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={() => void handleSearch()}
              disabled={searchMutation.isPending || !query.trim()}
            >
              {searchMutation.isPending ? (
                <Icons.spinner className='mr-1 size-4 animate-spin' />
              ) : (
                <Icons.search className='mr-1 size-4' />
              )}
              检索
            </Button>
          </div>
        </div>
      </Card>

      {/* 检索结果 */}
      {results !== null && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>检索结果</CardTitle>
              <div className='flex items-center gap-2'>
                <Badge variant={fused ? 'default' : 'secondary'}>
                  {fused ? 'RRF 混合检索' : '向量检索'}
                </Badge>
                <span className='text-muted-foreground text-sm'>
                  共 {results.length} 条
                </span>
              </div>
            </div>
          </CardHeader>
          <div className='px-6 pb-6'>
            {results.length === 0 ? (
              <div className='text-muted-foreground py-12 text-center'>
                未找到匹配的分块，请尝试其他关键词
              </div>
            ) : (
              <Accordion className='w-full'>
                {results.map((chunk, index) => (
                  <AccordionItem key={chunk.chunkId} value={String(chunk.chunkId)}>
                    <AccordionTrigger className='hover:no-underline'>
                      <div className='flex flex-1 items-center gap-4 pr-4'>
                        <span className='text-muted-foreground w-8 shrink-0 text-sm'>
                          #{index + 1}
                        </span>
                        <div className='flex-1 truncate text-sm'>
                          {chunk.content.slice(0, 80)}
                          {chunk.content.length > 80 ? '...' : ''}
                        </div>
                        <Badge
                          variant={chunk.score >= 0.7 ? 'default' : 'secondary'}
                          className='shrink-0'
                        >
                          {chunk.score.toFixed(4)}
                        </Badge>
                        <span className='text-muted-foreground shrink-0 text-xs'>
                          {docMap.get(chunk.docId) ?? `文档 #${chunk.docId}`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className='space-y-3 rounded-md border p-4'>
                        {/* 元信息 */}
                        <div className='flex flex-wrap gap-4 text-xs'>
                          <div>
                            <span className='text-muted-foreground'>分数：</span>
                            <span className='font-mono font-medium'>
                              {chunk.score.toFixed(4)}
                            </span>
                          </div>
                          <div>
                            <span className='text-muted-foreground'>来源文档：</span>
                            <span>{docMap.get(chunk.docId) ?? `#${chunk.docId}`}</span>
                          </div>
                          <div>
                            <span className='text-muted-foreground'>doc_id：</span>
                            <span className='font-mono'>{chunk.docId}</span>
                          </div>
                          <div>
                            <span className='text-muted-foreground'>chunk_id：</span>
                            <span className='font-mono'>{chunk.chunkId}</span>
                          </div>
                        </div>

                        {/* meta_json */}
                        {chunk.metaJson && Object.keys(chunk.metaJson).length > 0 && (
                          <div className='text-xs'>
                            <span className='text-muted-foreground'>元数据：</span>
                            <span className='font-mono'>
                              {JSON.stringify(chunk.metaJson, null, 2)}
                            </span>
                          </div>
                        )}

                        {/* 分块原文 */}
                        <div>
                          <span className='text-muted-foreground text-xs'>分块原文：</span>
                          <pre className='bg-muted mt-1 max-h-[300px] overflow-auto rounded-md p-3 text-sm whitespace-pre-wrap'>
                            {chunk.content}
                          </pre>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
