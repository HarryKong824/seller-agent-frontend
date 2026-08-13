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
  PHASE_LABELS,
  PHASE_ORDER,
  TYPE_LABELS,
  type PlaybookPhase,
  type PlaybookTemplate,
  type PlaybookType
} from '@/features/playbook/types';
import {
  useCreatePlaybook,
  useDeletePlaybook,
  usePlaybooks,
  useUpdatePlaybook
} from '@/features/playbook/api';

type FormState = {
  phase: PlaybookPhase;
  template_type: PlaybookType;
  title: string;
  content: string;
  tags: string;
};

const EMPTY_FORM: FormState = {
  phase: 'discovery',
  template_type: 'playbook',
  title: '',
  content: '',
  tags: ''
};

function copyContent(t: PlaybookTemplate) {
  void navigator.clipboard?.writeText(t.content);
  toast.success('已复制到剪贴板');
}

export default function PlaybookPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data, isLoading, isError } = usePlaybooks();

  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlaybookTemplate | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<PlaybookTemplate | null>(null);

  const createMut = useCreatePlaybook();
  const updateMut = useUpdatePlaybook();
  const deleteMut = useDeletePlaybook();

  const items = useMemo(() => data?.items ?? [], [data]);

  const filtered = useMemo(
    () =>
      items.filter((t) => {
        if (phaseFilter !== 'all' && t.phase !== phaseFilter) return false;
        if (typeFilter !== 'all' && t.templateType !== typeFilter) return false;
        return true;
      }),
    [items, phaseFilter, typeFilter]
  );

  const grouped = useMemo(() => {
    const map: Record<string, PlaybookTemplate[]> = {};
    for (const t of filtered) {
      (map[t.phase] ??= []).push(t);
    }
    return map;
  }, [filtered]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(t: PlaybookTemplate) {
    setEditing(t);
    setForm({
      phase: t.phase as PlaybookPhase,
      template_type: t.templateType as PlaybookType,
      title: t.title,
      content: t.content,
      tags: t.tags ?? ''
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('标题与内容为必填');
      return;
    }
    const payload = {
      phase: form.phase,
      template_type: form.template_type,
      title: form.title.trim(),
      content: form.content.trim(),
      tags: form.tags.trim() || null
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, payload });
        toast.success('已更新模板');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('已新增模板');
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success('已删除模板');
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Playbook 模板库</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            分阶段打法卡与标准模板，一线直接复制使用。
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Icons.plusCircle className='mr-1 size-4' />
            新增模板
          </Button>
        )}
      </div>

      <div className='flex flex-wrap gap-3'>
        <div className='w-40 space-y-1'>
          <Label>阶段</Label>
          <Select value={phaseFilter} onValueChange={(v) => setPhaseFilter(v ?? 'all')}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部阶段</SelectItem>
              {PHASE_ORDER.map((p) => (
                <SelectItem key={p} value={p}>
                  {PHASE_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-40 space-y-1'>
          <Label>类型</Label>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部类型</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <p className='text-muted-foreground text-sm'>加载中…</p>}
      {isError && <p className='text-sm text-red-500'>加载模板库失败，请重试。</p>}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className='text-muted-foreground text-sm'>暂无符合条件的模板。</p>
      )}

      <div className='flex flex-col gap-6'>
        {PHASE_ORDER.filter((p) => grouped[p]?.length).map((phase) => (
          <section key={phase}>
            <h2 className='mb-3 flex items-center gap-2 text-lg font-medium'>
              <span className='bg-primary/10 text-primary rounded px-2 py-0.5 text-sm'>
                {PHASE_LABELS[phase]}
              </span>
              <span className='text-muted-foreground text-sm'>{grouped[phase].length} 个</span>
            </h2>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {grouped[phase].map((t) => (
                <Card key={t.id} className='flex flex-col'>
                  <CardHeader className='flex flex-row items-start justify-between gap-2 space-y-0'>
                    <CardTitle className='text-base'>{t.title}</CardTitle>
                    {isAdmin && (
                      <div className='flex shrink-0 gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-7'
                          onClick={() => openEdit(t)}
                          aria-label='编辑'
                        >
                          <Icons.edit className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-7 text-red-500'
                          onClick={() => setDeleteTarget(t)}
                          aria-label='删除'
                        >
                          <Icons.trash className='size-4' />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className='flex flex-1 flex-col gap-3'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge variant='secondary'>{t.typeLabel}</Badge>
                      {t.tags
                        ?.split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <Badge key={tag} variant='outline'>
                            {tag}
                          </Badge>
                        ))}
                    </div>
                    <p className='text-muted-foreground whitespace-pre-wrap text-sm'>{t.content}</p>
                    <div className='mt-auto flex items-center justify-between pt-2'>
                      <span className='text-muted-foreground text-xs'>by {t.createdBy}</span>
                      <Button variant='outline' size='sm' onClick={() => copyContent(t)}>
                        <Icons.copy className='mr-1 size-3.5' />
                        复制
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 新增 / 编辑 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑模板' : '新增模板'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>阶段</Label>
                <Select
                  value={form.phase}
                  onValueChange={(v) => setForm({ ...form, phase: v as PlaybookPhase })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHASE_ORDER.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PHASE_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>类型</Label>
                <Select
                  value={form.template_type}
                  onValueChange={(v) => setForm({ ...form, template_type: v as PlaybookType })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='pb-title'>标题</Label>
              <Input
                id='pb-title'
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder='如：开场破冰话术'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='pb-content'>内容 / 打法</Label>
              <Textarea
                id='pb-content'
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder='可直接复制使用的标准话术 / 模板正文'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='pb-tags'>标签（逗号分隔，可选）</Label>
              <Input
                id='pb-tags'
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder='如：陌拜,破冰'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && (
                <Icons.spinner className='mr-1 size-4 animate-spin' />
              )}
              保存
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
            确定删除模板「{deleteTarget?.title}」？此操作不可撤销。
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
