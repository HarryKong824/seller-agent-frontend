'use client';

import { useRef } from 'react';
import { format } from 'date-fns';
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
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useDocuments, useUploadDocument } from '@/features/knowledge/api';
import { STATUS_LABELS, type DocStatus } from '@/features/knowledge/types';

const statusVariant: Record<DocStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  parsing: 'secondary',
  indexing: 'secondary',
  indexed: 'default',
  failed: 'destructive'
};

export default function KbDocumentsPage() {
  const params = useParams<{ kbId: string }>();
  const kbId = Number(params.kbId);

  return <KbDocumentsContent kbId={kbId} />;
}

function KbDocumentsContent({ kbId }: { kbId: number }) {
  const { data: docs, isLoading, isError } = useDocuments(kbId);
  const uploadMutation = useUploadDocument(kbId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 校验文件类型
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'md' && ext !== 'txt') {
      toast.error('仅支持 .md 和 .txt 文件');
      e.target.value = '';
      return;
    }

    try {
      await uploadMutation.mutateAsync(file);
      toast.success('文档上传成功，正在后台索引...');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '上传失败');
    }
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <Icons.spinner className='text-muted-foreground size-6 animate-spin' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='text-muted-foreground flex flex-1 items-center justify-center'>
        文档列表加载失败
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <Link
              href='/dashboard/knowledge'
              className='text-muted-foreground hover:text-foreground text-sm'
            >
              知识库
            </Link>
            <span className='text-muted-foreground'>/</span>
            <h2 className='text-2xl font-bold tracking-tight'>文档管理</h2>
          </div>
          <p className='text-muted-foreground mt-1 text-sm'>
            上传文档，后台自动解析→分块→索引。状态轮询直到 indexed/failed。
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type='file'
            accept='.md,.txt'
            onChange={handleUpload}
            className='hidden'
          />
          <Button
            size='sm'
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <Icons.spinner className='mr-1 size-4 animate-spin' />
            ) : (
              <Icons.upload className='mr-1 size-4' />
            )}
            上传文档
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文档列表</CardTitle>
          <CardDescription>
            上传后自动索引。pending→indexing→indexed/failed，每 3 秒轮询刷新。
          </CardDescription>
        </CardHeader>
        <div className='px-6 pb-6'>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文件名</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className='w-[180px]'>索引进度</TableHead>
                  <TableHead>分块数</TableHead>
                  <TableHead>上传时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs && docs.length > 0 ? (
                  docs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className='font-medium'>{doc.filename}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {doc.fileType === 'markdown' ? 'Markdown' : '纯文本'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[doc.status]}>
                          {STATUS_LABELS[doc.status]}
                        </Badge>
                        {doc.errorMsg && (
                          <span className='text-destructive ml-2 text-xs'>
                            {doc.errorMsg}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.status === 'indexed' ? (
                          <span className='text-sm text-green-600'>100%</span>
                        ) : doc.status === 'failed' ? (
                          <span className='text-destructive text-sm'>失败</span>
                        ) : (
                          <div className='flex items-center gap-2'>
                            <Progress value={doc.indexProgress} className='h-2' />
                            <span className='text-muted-foreground w-10 text-xs'>
                              {doc.indexProgress}%
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {doc.chunkCount > 0 ? doc.chunkCount : '-'}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {format(new Date(doc.created_at), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-muted-foreground h-24 text-center'
                    >
                      暂无文档，点击右上角上传
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* 检索测试台入口 */}
      <div className='flex justify-end'>
        <Link href={`/dashboard/knowledge/${kbId}/search`}>
          <Button variant='outline' size='sm'>
            <Icons.search className='mr-1 size-4' />
            检索测试台
          </Button>
        </Link>
      </div>
    </div>
  );
}
