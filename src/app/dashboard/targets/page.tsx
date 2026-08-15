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
  PERIOD_TYPES,
  TARGET_METRICS,
  type PeriodType,
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

/** 当前日期对应的默认周期序号。 */
function defaultIndex(type: PeriodType): number {
  const now = new Date();
  if (type === 'month') return now.getMonth() + 1;
  if (type === 'quarter') return Math.floor(now.getMonth() / 3) + 1;
  const onejan = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
}

function periodLabel(year: number, type: PeriodType, index: number): string {
  if (type === 'month') return `${year} 年 ${index} 月`;
  if (type === 'quarter') return `${year} Q${index}`;
  return `${year} 第 ${index} 周`;
}

function toNonNegInt(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

type FormState = {
  ownerId: number | null;
  managerId: number | null;
  year: number;
  periodType: PeriodType;
  periodIndex: number;
  visitsCountTarget: string;
  newOpportunitiesTarget: string;
  stageAdvancesTarget: string;
  callMinutesTarget: string;
  emailsSentTarget: string;
  dealAmountTarget: string;
};

const EMPTY_FORM: FormState = {
  ownerId: null,
  managerId: null,
  year: new Date().getFullYear(),
  periodType: 'month',
  periodIndex: defaultIndex('month'),
  visitsCountTarget: '0',
  newOpportunitiesTarget: '0',
  stageAdvancesTarget: '0',
  callMinutesTarget: '0',
  emailsSentTarget: '0',
  dealAmountTarget: '0'
};

export default function TargetsPage() {
  const { data: users } = useUsers();
  const salesOptions = useMemo(
    () => (users ?? []).filter((u) => u.role === 'sales' || u.role === 'manager'),
    [users]
  );
  const managerOptions = useMemo(
    () => (users ?? []).filter((u) => u.role === 'manager'),
    [users]
  );
  const userMap = useMemo(() => {
    const m = new Map<number, string>();
    (users ?? []).forEach((u) => m.set(u.id, u.full_name || u.username));
    return m;
  }, [users]);

  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [periodIndex, setPeriodIndex] = useState<number>(defaultIndex('month'));
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [managerId, setManagerId] = useState<number | null>(null);

  const { data, isLoading, isError } = useTargets({
    ownerId,
    year,
    periodType,
    periodIndex,
    managerId
  });
  const createMut = useCreateTarget();
  const updateMut = useUpdateTarget();
  const deleteMut = useDeleteTarget();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<TargetResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TargetResponse | null>(null);

  const targets = useMemo(() => data ?? [], [data]);

  // 周期类型切换时重置周期序号默认值
  function changePeriodType(t: PeriodType) {
    setPeriodType(t);
    setPeriodIndex(defaultIndex(t));
  }

  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, year, periodType, periodIndex: defaultIndex(periodType) });
    setFormOpen(true);
  }

  function openEdit(t: TargetResponse) {
    setEditTarget(t);
    setForm({
      ownerId: t.ownerId,
      managerId: t.managerId,
      year: t.year,
      periodType: t.periodType,
      periodIndex: t.periodIndex,
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
      period_type: form.periodType,
      period_index: form.periodIndex,
      manager_id: form.managerId,
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
    const idxMax = PERIOD_TYPES.find((p) => p.value === form.periodType)?.max ?? 12;
    if (form.periodIndex < 1 || form.periodIndex > idxMax) {
      toast.error(`周期序号超出 ${form.periodType} 合法范围 1-${idxMax}`);
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
            为销售设置周期量化 KPI 目标（月/季/周）。完成率以 GPS 客观打卡等实际值对比目标计算。
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icons.plusCircle className='mr-1 size-4' />
          设置目标
        </Button>
      </div>

      {/* 筛选 */}
      <div className='flex flex-wrap gap-3'>
        <div className='w-40 space-y-1'>
          <Label className='text-xs'>周期类型</Label>
          <Select value={periodType} onValueChange={(v) => changePeriodType(v as PeriodType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_TYPES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}度
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-24 space-y-1'>
          <Label className='text-xs'>周期序号</Label>
          <Select value={String(periodIndex)} onValueChange={(v) => setPeriodIndex(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from(
                { length: PERIOD_TYPES.find((p) => p.value === periodType)?.max ?? 12 },
                (_, i) => i + 1
              ).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-28 space-y-1'>
          <Label className='text-xs'>年份</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-40 space-y-1'>
          <Label className='text-xs'>归属销售</Label>
          <Select
            value={ownerId ? String(ownerId) : 'all'}
            onValueChange={(v) => setOwnerId(v === 'all' ? null : Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部销售</SelectItem>
              {salesOptions.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.full_name || u.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-40 space-y-1'>
          <Label className='text-xs'>团队经理</Label>
          <Select
            value={managerId ? String(managerId) : 'all'}
            onValueChange={(v) => setManagerId(v === 'all' ? null : Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部团队</SelectItem>
              {managerOptions.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.full_name || u.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <p className='text-muted-foreground text-sm'>加载中…</p>}
      {isError && <p className='text-sm text-red-500'>加载目标失败，请确认你有管理者权限后重试。</p>}

      {!isLoading && !isError && targets.length === 0 && (
        <p className='text-muted-foreground text-sm'>该周期暂无目标，点击右上角「设置目标」。</p>
      )}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {targets.map((t) => (
          <Card key={t.id} className='flex flex-col'>
            <CardHeader className='flex flex-row items-start justify-between space-y-0'>
              <div className='flex flex-col gap-1'>
                <CardTitle className='text-base'>{t.ownerFullName || `用户#${t.ownerId}`}</CardTitle>
                <Badge variant='secondary'>{periodLabel(t.year, t.periodType, t.periodIndex)}</Badge>
                {t.managerId != null && (
                  <Badge variant='outline' className='w-fit'>
                    团队：{userMap.get(t.managerId) || `#${t.managerId}`}
                  </Badge>
                )}
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
              <div className='w-28 space-y-2'>
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
            </div>
            <div className='flex gap-3'>
              <div className='w-32 space-y-2'>
                <Label>周期类型</Label>
                <Select
                  value={form.periodType}
                  onValueChange={(v) =>
                    setForm({ ...form, periodType: v as PeriodType, periodIndex: defaultIndex(v as PeriodType) })
                  }
                  disabled={!!editTarget}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_TYPES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}度
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='w-28 space-y-2'>
                <Label>周期序号</Label>
                <Select
                  value={String(form.periodIndex)}
                  onValueChange={(v) => setForm({ ...form, periodIndex: Number(v) })}
                  disabled={!!editTarget}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      { length: PERIOD_TYPES.find((p) => p.value === form.periodType)?.max ?? 12 },
                      (_, i) => i + 1
                    ).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex-1 space-y-2'>
                <Label>团队经理（可选）</Label>
                <Select
                  value={form.managerId ? String(form.managerId) : 'none'}
                  onValueChange={(v) => setForm({ ...form, managerId: v === 'none' ? null : Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='不指定' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>不指定（默认归属设定者）</SelectItem>
                    {managerOptions.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.full_name || u.username}
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
              <p className='text-muted-foreground text-xs'>同一销售同周期仅能设置一条目标，重复将提示已存在。</p>
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
            确定删除 {deleteTarget?.ownerFullName} {periodLabel(deleteTarget?.year ?? 0, deleteTarget?.periodType ?? 'month', deleteTarget?.periodIndex ?? 0)} 的目标？此操作不可撤销。
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
