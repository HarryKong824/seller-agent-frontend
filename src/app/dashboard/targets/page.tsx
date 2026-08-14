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
import {
  TARGET_METRICS,
  type TargetResponse,
  type TargetCreateInput
} from '@/features/targets/types';
import {
  useCreateTarget,
  useDeleteTarget,
  useTargets,
  useUpdateTarget,
  useUsers
} from '@/features/targets/api';

type FormState = {
  ownerId: number | null;
  year: number;
  month: number;
  visitsCountTarget: string;
  newOpportunitiesTarget: string;
  stageAdvancesTarget: string;
  callMinutesTarget: string;
  emailsSentTarget: string;
  dealAmountTarget: string;
};

const EMPTY_FORM: FormState = {
  ownerId: null,
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  visitsCountTarget: '0',
  newOpportunitiesTarget: '0',
  stageAdvancesTarget: '0',
  callMinutesTarget: '0',
  emailsSentTarget: '0',
  dealAmountTarget: '0'
};

function toNonNegInt(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export default function TargetsPage() {
  const { data: users } = useUsers();
  const salesOptions = useMemo(
    () => (users ?? []).filter((u) => u.role === 'sales' || u.role === 'manager'),
    [users]
  );

  const { data, isLoading, isError } = useTargets({});
  const createMut = useCreateTarget();
  const updateMut = useUpdateTarget();
  const deleteMut = useDeleteTarget();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<TargetResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TargetResponse | null>(null);

  const targets = useMemo(() => data ?? [], [data]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(t: TargetResponse) {
    setEditTarget(t);
    setForm({
      ownerId: t.ownerId,
      year: t.year,
      month: t.month,
      visitsCountTarget: String(t.visitsCountTarget),
      newOpportunitiesTarget: String(t.newOpportunitiesTarget),
      stageAdvancesTarget: String(t.stageAdvancesTarget),
      callMinutesTarget: String(t.callMinutesTarget),
      emailsSentTarget: String(t.emailsSentTarget),
      dealAmountTarget: String(t.dealAmountTarget)
    });
    setFormOpen(true);
  }

  function buildPayload(): TargetCreateInput {
    return {
      owner_id: form.ownerId as number,
      year: form.year,
      month: form.month,
      visits_count_target: toNonNegInt(form.visitsCountTarget),
      new_opportunities_target: toNonNegInt(form.newOpportunitiesTarget),
      stage_advances_target: toNonNegInt(form.stageAdvancesTarget),
      call_minutes_target: toNonNegInt(form.callMinutesTarget),
      emails_sent_target: toNonNegInt(form.emailsSentTarget),
      deal_amount_target: Number(form.dealAmountTarget) || 0
    };
  }

  async function handleSubmit() {
    if (!form.ownerId) {
      toast.error('请选择目标归属销售');
      return;
    }
    try {
      if (editTarget) {
        await updateMut.mutateAsync({
          id: editTarget.id,
          visits_count_target: toNonNegInt(form.visitsCountTarget),
          new_opportunities_target: toNonNegInt(form.newOpportunitiesTarget),
          stage_advances_target: toNonNegInt(form.stageAdvancesTarget),
          call_minutes_target: toNonNegInt(form.callMinutesTarget),
          emails_sent_target: toNonNegInt(form.emailsSentTarget),
          deal_amount_target: Number(form.dealAmountTarget) || 0
        });
        toast.success('已更新目标');
      } else {
        await createMut.mutateAsync(buildPayload());
        toast.success('已创建目标');
      }
      setFormOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success('已删除目标');
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>目标管理</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            为销售设置月度量化 KPI 目标（拜访/商机/阶段/通话/邮件/金额）。完成率以 GPS 客观打卡等实际值对比目标计算。
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icons.plusCircle className='mr-1 size-4' />
          设置目标
        </Button>
      </div>

      {isLoading && <p className='text-muted-foreground text-sm'>加载中…</p>}
      {isError && <p className='text-sm text-red-500'>加载目标失败，请确认你有管理者权限后重试。</p>}

      {!isLoading && !isError && targets.length === 0 && (
        <p className='text-muted-foreground text-sm'>暂无目标，点击右上角「设置目标」。</p>
      )}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {targets.map((t) => (
          <Card key={t.id} className='flex flex-col'>
            <CardHeader className='flex flex-row items-start justify-between space-y-0'>
              <div className='flex flex-col gap-1'>
                <CardTitle className='text-base'>{t.ownerFullName || `用户#${t.ownerId}`}</CardTitle>
                <Badge variant='secondary'>{t.year} 年 {t.month} 月</Badge>
              </div>
              <div className='flex gap-1'>
                <Button variant='ghost' size='icon' className='size-7' onClick={() => openEdit(t)} aria-label='编辑'>
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
            </CardHeader>
            <CardContent className='flex flex-1 flex-col gap-2'>
              <div className='grid grid-cols-2 gap-2'>
                {TARGET_METRICS.map((mt) => (
                  <div key={mt.key} className='bg-muted/50 rounded px-2 py-1.5 text-sm'>
                    <div className='text-muted-foreground text-xs'>{mt.label}</div>
                    <div className='font-medium'>
                      {mt.isAmount ? `¥${Number(t[mt.key]).toLocaleString()}` : t[mt.key]}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 创建 / 编辑 Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditTarget(null);
            setFormOpen(false);
          }
        }}
      >
        <DialogContent className='sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>{editTarget ? '编辑目标' : '设置目标'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='flex gap-3'>
              <div className='flex-1 space-y-2'>
                <Label>归属销售</Label>
                <Select
                  value={form.ownerId ? String(form.ownerId) : ''}
                  onValueChange={(v) => setForm({ ...form, ownerId: Number(v) })}
                  disabled={!!editTarget}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='选择销售' />
                  </SelectTrigger>
                  <SelectContent>
                    {salesOptions.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.full_name || u.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='w-24 space-y-2'>
                <Label>年份</Label>
                <Select value={String(form.year)} onValueChange={(v) => setForm({ ...form, year: Number(v) })} disabled={!!editTarget}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[form.year - 1, form.year, form.year + 1].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='w-20 space-y-2'>
                <Label>月份</Label>
                <Select value={String(form.month)} onValueChange={(v) => setForm({ ...form, month: Number(v) })} disabled={!!editTarget}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              {TARGET_METRICS.map((mt) => (
                <div key={mt.key} className='space-y-2'>
                  <Label htmlFor={`t-${mt.key}`}>{mt.label}</Label>
                  <Input
                    id={`t-${mt.key}`}
                    type='number'
                    min={0}
                    value={form[mt.key as keyof FormState] as string}
                    onChange={(e) => setForm({ ...form, [mt.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            {!editTarget && (
              <p className='text-muted-foreground text-xs'>同一销售同年同月仅能设置一条目标，重复将提示已存在。</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setEditTarget(null);
                setFormOpen(false);
              }}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && (
                <Icons.spinner className='mr-1 size-4 animate-spin' />
              )}
              {editTarget ? '保存' : '创建'}
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
            确定删除 {deleteTarget?.ownerFullName} {deleteTarget?.year} 年 {deleteTarget?.month} 月的目标？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleteMut.isPending}>
              {deleteMut.isPending && <Icons.spinner className='mr-1 size-4 animate-spin' />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
