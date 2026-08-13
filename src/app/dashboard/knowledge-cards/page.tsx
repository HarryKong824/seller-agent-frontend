'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  STATUS_LABELS,
  type CardCategory,
  type KnowledgeCard
} from '@/features/knowledge-cards/types';
import {
  useCreateCard,
  useDeleteCard,
  useKnowledgeCards,
  useUpdateCardStatus
} from '@/features/knowledge-cards/api';

type FormState = {
  title: string;
  content: string;
  category: CardCategory;
  tags: string;
};

const EMPTY_FORM: FormState = {
  title: '',
  content: '',
  category: 'competitor',
  tags: ''
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    case 'rejected':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    default:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  }
}

function copyContent(c: KnowledgeCard) {
  void navigator.clipboard?.writeText(c.content);
  toast.success('已复制到剪贴板');
}

export default function KnowledgeCardsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data, isLoading, isError } = useKnowledgeCards();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeCard | null>(null);

  const createMut = useCreateCard();
  const updateStatusMut = useUpdateCardStatus();
  const deleteMut = useDeleteCard();

  const items = useMemo(() => data?.items ?? [], [data]);

  const filtered = useMemo(
    () =>
      items.filter((c) => {
        if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        return true;
      }),
    [items, categoryFilter, statusFilter]
  );

  const grouped = useMemo(() => {
    const map: Record<string, KnowledgeCard[]> = {};
    for (const c of filtered) {
      (map[c.category] ??= []).push(c);
    }
    return map;
  }, [filtered]);

  function openContribute() {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('标题与内容为必填');
      return;
    }
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      tags: form.tags.trim() || null
    };
    try {
      await createMut.mutateAsync(payload);
      toast.success('已投稿，等待管理员审核');
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '投稿失败');
    }
  }

  async function handleReview(c: KnowledgeCard, status: 'approved' | 'rejected') {
    try {
      await updateStatusMut.mutateAsync({ id: c.id, status });
      toast.success(status === 'approved' ? '已采纳' : '已驳回');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '审核失败');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success('已删除卡片');
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>知识沉淀</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            会话赢/丢自动摘取 + 一线投稿，经管理员审核后成为团队可检索的知识资产。
          </p>
        </div>
        <Button onClick={openContribute}>
          <Icons.plusCircle className='mr-1 size-4' />
          投稿知识
        </Button>
      </div>

      <div className='flex flex-wrap items-end gap-3'>
        <div className='w-44 space-y-1'>
          <Label>分类</Label>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部分类</SelectItem>
              {CATEGORY_ORDER.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-40 space-y-1'>
          <Label>状态</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部状态</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={categoryFilter === 'competitor' ? 'default' : 'outline'}
          className='h-9'
          onClick={() =>
            setCategoryFilter(categoryFilter === 'competitor' ? 'all' : 'competitor')
          }
        >
          <Icons.book className='mr-1 size-4' />
          竞品应对库
        </Button>
      </div>

      {isLoading && <p className='text-muted-foreground text-sm'>加载中…</p>}
      {isError && <p className='text-sm text-red-500'>加载知识卡片失败，请重试。</p>}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className='text-muted-foreground text-sm'>暂无符合条件的知识卡片。</p>
      )}

      <div className='flex flex-col gap-6'>
        {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((category) => {
          const isCompetitor = category === 'competitor';
          return (
            <section
              key={category}
              className={
                isCompetitor
                  ? 'rounded-lg border border-primary/40 p-3'
                  : undefined
              }
            >
              <h2 className='mb-3 flex items-center gap-2 text-lg font-medium'>
                <span className='bg-primary/10 text-primary rounded px-2 py-0.5 text-sm'>
                  {CATEGORY_LABELS[category]}
                </span>
                <span className='text-muted-foreground text-sm'>
                  {grouped[category].length} 个
                </span>
                {isCompetitor && (
                  <span className='text-primary text-xs'>竞品应对库</span>
                )}
              </h2>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {grouped[category].map((c) => (
                  <Card key={c.id} className='flex flex-col'>
                    <CardHeader className='flex flex-row items-start justify-between gap-2 space-y-0'>
                      <CardTitle className='text-base'>{c.title}</CardTitle>
                      {isAdmin && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-7 text-red-500'
                          onClick={() => setDeleteTarget(c)}
                          aria-label='删除'
                        >
                          <Icons.trash className='size-4' />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className='flex flex-1 flex-col gap-3'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge variant='secondary'>{c.categoryLabel}</Badge>
                        <Badge className={statusBadgeClass(c.status)}>{c.statusLabel}</Badge>
                        {c.tags
                          ?.split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((t) => (
                            <Badge key={t} variant='outline'>
                              {t}
                            </Badge>
                          ))}
                      </div>
                      <p className='text-muted-foreground whitespace-pre-wrap text-sm'>
                        {c.content}
                      </p>
                      <div className='mt-auto flex items-center justify-between pt-2'>
                        <span className='text-muted-foreground text-xs'>by {c.createdBy}</span>
                        <div className='flex gap-1'>
                          {isAdmin && c.status === 'pending' && (
                            <>
                              <Button
                                variant='outline'
                                size='sm'
                                className='text-green-600'
                                onClick={() => handleReview(c, 'approved')}
                              >
                                采纳
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                className='text-red-600'
                                onClick={() => handleReview(c, 'rejected')}
                              >
                                驳回
                              </Button>
                            </>
                          )}
                          <Button variant='outline' size='sm' onClick={() => copyContent(c)}>
                            <Icons.copy className='mr-1 size-3.5' />
                            复制
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* 投稿 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>投稿知识卡片</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='kc-title'>标题</Label>
              <Input
                id='kc-title'
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder='如：竞品 A 价格对比要点'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='kc-category'>分类</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as CardCategory })}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ORDER.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='kc-content'>内容</Label>
              <Textarea
                id='kc-content'
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder='可直接复用或检索的知识要点'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='kc-tags'>标签（逗号分隔，可选）</Label>
              <Input
                id='kc-tags'
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder='如：竞品A,价格'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending}>
              {createMut.isPending && (
                <Icons.spinner className='mr-1 size-4 animate-spin' />
              )}
              提交投稿
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className='text-muted-foreground py-2 text-sm'>
            确定删除卡片「{deleteTarget?.title}」？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending && <Icons.spinner className='mr-1 size-4 animate-spin' />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
