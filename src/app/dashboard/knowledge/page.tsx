'use client';

import { useState } from 'react';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useKnowledgeBases, useCreateKnowledgeBase } from '@/features/knowledge/api';
import { CATEGORY_LABELS, type KnowledgeBaseCreate } from '@/features/knowledge/types';
import Link from 'next/link';
import { toast } from 'sonner';

const categoryVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  product: 'default',
  sales_script: 'secondary',
  case: 'outline',
  faq: 'destructive'
};

function CreateKbDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<KnowledgeBaseCreate['category']>('product');
  const mutation = useCreateKnowledgeBase();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('库名不能为空');
      return;
    }
    try {
      await mutation.mutateAsync({ name, description: description || undefined, category });
      toast.success('知识库创建成功');
      setOpen(false);
      setName('');
      setDescription('');
      setCategory('product');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size='sm'>
            <Icons.add className='mr-1 size-4' />
            新建知识库
          </Button>
        }
      />
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>新建知识库</DialogTitle>
          <DialogDescription>创建一个独立的知识库，用于文档管理和检索</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='kb-name'>库名</Label>
            <Input
              id='kb-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='如：产品知识库'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='kb-desc'>描述（可选）</Label>
            <Textarea
              id='kb-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='知识库的用途说明'
              rows={2}
            />
          </div>
          <div className='space-y-2'>
            <Label>业务分类</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as KnowledgeBaseCreate['category'])}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? <Icons.spinner className='mr-1 size-4 animate-spin' /> : null}
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function KnowledgePage() {
  const { data, isLoading, isError } = useKnowledgeBases();

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>知识库管理</h2>
          <p className='text-muted-foreground mt-1 text-sm'>管理知识库、上传文档、检索测试</p>
        </div>
        <CreateKbDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>知识库列表</CardTitle>
          <CardDescription>点击知识库进入文档管理与检索测试</CardDescription>
        </CardHeader>
        <div className='px-6 pb-6'>
          {isLoading ? (
            <div className='flex h-48 items-center justify-center'>
              <Icons.spinner className='text-muted-foreground size-6 animate-spin' />
            </div>
          ) : isError ? (
            <div className='text-muted-foreground flex h-48 items-center justify-center'>
              知识库列表加载失败
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>库名</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>创建人</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items?.length ? (
                    data.items.map((kb) => (
                      <TableRow key={kb.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/knowledge/${kb.id}`}
                            className='hover:text-primary font-medium underline-offset-4 hover:underline'
                          >
                            {kb.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={categoryVariant[kb.category] ?? 'outline'}>
                            {CATEGORY_LABELS[kb.category] ?? kb.category}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-muted-foreground max-w-[200px] truncate'>
                          {kb.description || '-'}
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {kb.ownerUsername ?? String(kb.ownerId)}
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {format(new Date(kb.created_at), 'yyyy-MM-dd HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className='text-muted-foreground h-24 text-center'>
                        暂无知识库，点击右上角创建
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
