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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useCustomers } from '@/features/customer/api';
import {
  METRIC_ORDER,
  MODE_LABELS,
  type DailyReport,
  type ManagerJudgment
} from '@/features/daily-reports/types';
import {
  useCreateReport,
  useDeleteReport,
  useDailyReports,
  useGenerateReport,
  useSetVisitJudgment,
  useUpdateReport
} from '@/features/daily-reports/api';

type VisitRow = {
  customer_id: number | null;
  visit_action_note: string;
};

type FormState = {
  report_date: string;
  new_opportunities: string;
  stage_advances: string;
  call_minutes: string;
  emails_sent: string;
  deal_amount: string;
  summary: string;
  visits: VisitRow[];
};

const EMPTY_FORM: FormState = {
  report_date: new Date().toISOString().slice(0, 10),
  new_opportunities: '0',
  stage_advances: '0',
  call_minutes: '0',
  emails_sent: '0',
  deal_amount: '0',
  summary: '',
  visits: [{ customer_id: null, visit_action_note: '' }]
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function toNonNegInt(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function JudgmentBadge({ judgment }: { judgment: ManagerJudgment }) {
  if (judgment === 'normal') {
    return (
      <Badge variant='secondary' className='text-green-600'>
        <Icons.circleCheck className='mr-1 size-3' />
        有效(正常)
      </Badge>
    );
  }
  if (judgment === 'abnormal') {
    return (
      <Badge variant='destructive'>
        <Icons.circleX className='mr-1 size-3' />
        不达成
      </Badge>
    );
  }
  return (
    <Badge variant='outline'>
      <Icons.warning className='mr-1 size-3' />
      待复核
    </Badge>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) {
    return <Badge variant='outline'>未评分</Badge>;
  }
  const cls =
    score >= 60 ? 'text-green-600' : score >= 30 ? 'text-amber-600' : 'text-red-600';
  return (
    <Badge variant='secondary' className={cls}>
      加权 {score}
    </Badge>
  );
}

export default function DailyReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;
  const canReview = isManager;

  const [dateFilter, setDateFilter] = useState('');
  const { data, isLoading, isError } = useDailyReports(dateFilter || undefined);
  const { data: customersData } = useCustomers(1, 100);
  const customers = customersData?.items ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [aiForm, setAiForm] = useState<{ report_date: string; transcript: string }>({
    report_date: todayISO(),
    transcript: ''
  });
  const [editTarget, setEditTarget] = useState<DailyReport | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DailyReport | null>(null);
  const [detailTarget, setDetailTarget] = useState<DailyReport | null>(null);
  const [draftJudgment, setDraftJudgment] = useState<Record<number, ManagerJudgment>>({});

  const createMut = useCreateReport();
  const generateMut = useGenerateReport();
  const updateMut = useUpdateReport();
  const deleteMut = useDeleteReport();
  const judgeMut = useSetVisitJudgment();

  const items = useMemo(() => data ?? [], [data]);

  function addVisitRow() {
    setForm((f) => ({
      ...f,
      visits: [...f.visits, { customer_id: null, visit_action_note: '' }]
    }));
  }

  function removeVisitRow(i: number) {
    setForm((f) => ({ ...f, visits: f.visits.filter((_, idx) => idx !== i) }));
  }

  function updateVisitRow(
    i: number,
    patch: Partial<{ customer_id: number | null; visit_action_note: string }>
  ) {
    setForm((f) => ({
      ...f,
      visits: f.visits.map((row, idx) => (idx === i ? { ...row, ...patch } : row))
    }));
  }

  function openForm() {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(r: DailyReport) {
    setEditTarget(r);
    setForm({
      report_date: r.reportDate,
      new_opportunities: String(r.newOpportunities),
      stage_advances: String(r.stageAdvances),
      call_minutes: String(r.callMinutes),
      emails_sent: String(r.emailsSent),
      deal_amount: String(r.dealAmount),
      summary: r.summary ?? '',
      visits: (r.visits ?? []).map((v) => ({
        customer_id: v.customerId,
        visit_action_note: v.visitActionNote ?? ''
      }))
    });
    setFormOpen(true);
  }

  function openDetail(r: DailyReport) {
    setDetailTarget(r);
  }

  function buildVisitsPayload() {
    return form.visits
      .filter((v) => v.customer_id != null && v.visit_action_note.trim().length > 0)
      .map((v) => ({
        customer_id: v.customer_id as number,
        visit_action_note: v.visit_action_note.trim()
      }));
  }

  async function handleCreate() {
    if (!form.report_date) {
      toast.error('请选择报表日期');
      return;
    }
    try {
      await createMut.mutateAsync({
        report_date: form.report_date,
        new_opportunities: toNonNegInt(form.new_opportunities),
        stage_advances: toNonNegInt(form.stage_advances),
        call_minutes: toNonNegInt(form.call_minutes),
        emails_sent: toNonNegInt(form.emails_sent),
        deal_amount: Number(form.deal_amount) || 0,
        summary: form.summary.trim() || null,
        visits: buildVisitsPayload()
      });
      toast.success('日报已提交');
      setFormOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '提交失败');
    }
  }

  async function handleGenerate() {
    if (!aiForm.report_date || !aiForm.transcript.trim()) {
      toast.error('请填写日期与对话/工作记录');
      return;
    }
    try {
      await generateMut.mutateAsync(aiForm);
      toast.success('AI 已生成日报');
      setAiOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI 生成失败');
    }
  }

  async function handleUpdate() {
    if (!editTarget) return;
    try {
      await updateMut.mutateAsync({
        id: editTarget.id,
        new_opportunities: toNonNegInt(form.new_opportunities),
        stage_advances: toNonNegInt(form.stage_advances),
        call_minutes: toNonNegInt(form.call_minutes),
        emails_sent: toNonNegInt(form.emails_sent),
        deal_amount: Number(form.deal_amount) || 0,
        summary: form.summary.trim() || null,
        visits: buildVisitsPayload()
      });
      toast.success('已更新日报');
      setEditTarget(null);
      setFormOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '更新失败');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success('已删除日报');
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  }

  async function handleJudge(visitId: number) {
    try {
      await judgeMut.mutateAsync({
        visitId,
        judgment: draftJudgment[visitId] ?? 'normal'
      });
      toast.success('人审结论已保存');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '人审失败');
    }
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>每日报表</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            量化记录每日销售动作（拜访/商机/通话/邮件/金额）。拜访数由 GPS 打卡自动统计，其余自填或 AI 生成。
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setAiOpen(true)}>
            <Icons.sparkles className='mr-1 size-4' />
            AI 生成
          </Button>
          <Button onClick={openForm}>
            <Icons.plusCircle className='mr-1 size-4' />
            手动填写
          </Button>
        </div>
      </div>

      <div className='flex flex-wrap items-end gap-3'>
        <div className='w-48 space-y-1'>
          <Label htmlFor='dr-date'>按日期筛选（可选）</Label>
          <Input
            id='dr-date'
            type='date'
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        {dateFilter && (
          <Button variant='ghost' className='h-9' onClick={() => setDateFilter('')}>
            清除筛选
          </Button>
        )}
      </div>

      {isLoading && <p className='text-muted-foreground text-sm'>加载中…</p>}
      {isError && <p className='text-sm text-red-500'>加载日报失败，请重试。</p>}

      {!isLoading && !isError && items.length === 0 && (
        <p className='text-muted-foreground text-sm'>暂无日报，点击右上角「手动填写」或「AI 生成」创建。</p>
      )}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {items.map((r) => (
          <Card key={r.id} className='flex flex-col'>
            <CardHeader className='flex flex-row items-start justify-between gap-2 space-y-0'>
              <div className='flex flex-col gap-1'>
                <CardTitle className='text-base'>{r.reportDate}</CardTitle>
                <div className='flex flex-wrap gap-1'>
                  <Badge variant='secondary'>{MODE_LABELS[r.mode]}</Badge>
                  {(r.effectiveVisitsCount ?? 0) > 0 && (
                    <Badge variant='secondary' className='text-green-600'>
                      有效拜访 {r.effectiveVisitsCount}
                    </Badge>
                  )}
                </div>
              </div>
              <div className='flex gap-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7'
                  onClick={() => openDetail(r)}
                  aria-label='明细/人审'
                >
                  <Icons.forms className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7'
                  onClick={() => openEdit(r)}
                  aria-label='编辑'
                >
                  <Icons.edit className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7 text-red-500'
                  onClick={() => setDeleteTarget(r)}
                  aria-label='删除'
                >
                  <Icons.trash className='size-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col gap-3'>
              <div className='grid grid-cols-2 gap-2'>
                {METRIC_ORDER.map((m) => (
                  <div
                    key={m.key}
                    className='bg-muted/50 rounded px-2 py-1.5 text-sm'
                  >
                    <div className='text-muted-foreground text-xs'>{m.label}</div>
                    <div className='font-medium'>
                      {m.key === 'dealAmount'
                        ? `¥${Number(r[m.key]).toLocaleString()}`
                        : r[m.key]}
                    </div>
                  </div>
                ))}
              </div>
              {r.summary && (
                <p className='text-muted-foreground whitespace-pre-wrap text-sm'>
                  {r.summary}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 手动填写 / 编辑 Dialog */}
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
            <DialogTitle>{editTarget ? '编辑日报' : '填写每日报表'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='dr-form-date'>报表日期</Label>
              <Input
                id='dr-form-date'
                type='date'
                value={form.report_date}
                onChange={(e) => setForm({ ...form, report_date: e.target.value })}
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label htmlFor='dr-visits'>新增商机</Label>
                <Input
                  id='dr-visits'
                  type='number'
                  min={0}
                  value={form.new_opportunities}
                  onChange={(e) => setForm({ ...form, new_opportunities: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='dr-stage'>推进阶段</Label>
                <Input
                  id='dr-stage'
                  type='number'
                  min={0}
                  value={form.stage_advances}
                  onChange={(e) => setForm({ ...form, stage_advances: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='dr-call'>通话分钟</Label>
                <Input
                  id='dr-call'
                  type='number'
                  min={0}
                  value={form.call_minutes}
                  onChange={(e) => setForm({ ...form, call_minutes: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='dr-email'>发送邮件</Label>
                <Input
                  id='dr-email'
                  type='number'
                  min={0}
                  value={form.emails_sent}
                  onChange={(e) => setForm({ ...form, emails_sent: e.target.value })}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='dr-amount'>推进金额(元)</Label>
              <Input
                id='dr-amount'
                type='number'
                min={0}
                value={form.deal_amount}
                onChange={(e) => setForm({ ...form, deal_amount: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='dr-summary'>工作小结（可选）</Label>
              <Textarea
                id='dr-summary'
                rows={4}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder='当日重点工作与下一步'
              />
            </div>

            {/* F14：逐客户拜访动作明细 */}
            <div className='space-y-3 rounded-md border p-3'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-semibold'>拜访动作明细 (F14)</Label>
                <Button type='button' variant='outline' size='sm' onClick={addVisitRow}>
                  <Icons.plusCircle className='mr-1 size-4' />
                  添加明细
                </Button>
              </div>
              {form.visits.map((row, i) => (
                <div key={i} className='space-y-2 rounded-md border p-3'>
                  <div className='flex items-end gap-2'>
                    <div className='flex-1 space-y-2'>
                      <Label>关联客户</Label>
                      <Select
                        value={row.customer_id != null ? String(row.customer_id) : 'none'}
                        onValueChange={(v) =>
                          updateVisitRow(i, {
                            customer_id: v === 'none' ? null : Number(v)
                          })
                        }
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='选择客户' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='none'>不关联具体客户</SelectItem>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {form.visits.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-8 text-red-500'
                        onClick={() => removeVisitRow(i)}
                        aria-label='删除明细'
                      >
                        <Icons.trash className='size-4' />
                      </Button>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label>拜访动作说明（必填）</Label>
                    <Textarea
                      rows={2}
                      value={row.visit_action_note}
                      onChange={(e) =>
                        updateVisitRow(i, { visit_action_note: e.target.value })
                      }
                      placeholder='说明本次拜访做了什么（如：演示方案、确认需求、推进商务）'
                    />
                  </div>
                </div>
              ))}
              <p className='text-muted-foreground text-xs'>
                逐客户填写拜访动作；管理者将据此人审"是否有效拜访"。未填动作说明的明细不会提交。
              </p>
            </div>

            <p className='text-muted-foreground text-xs'>
              拜访数(打卡)由系统按 GPS 打卡自动统计，无需填写。
            </p>
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
            <Button
              onClick={editTarget ? handleUpdate : handleCreate}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {(createMut.isPending || updateMut.isPending) && (
                <Icons.spinner className='mr-1 size-4 animate-spin' />
              )}
              {editTarget ? '保存' : '提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 明细 / 人审 Dialog */}
      <Dialog open={detailTarget !== null} onOpenChange={(o) => !o && setDetailTarget(null)}>
        <DialogContent className='sm:max-w-[640px]'>
          <DialogHeader>
            <DialogTitle>日报明细 · 管理者人审</DialogTitle>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            {detailTarget && (detailTarget.visits ?? []).length === 0 && (
              <p className='text-muted-foreground text-sm'>该日报暂无拜访动作明细。</p>
            )}
            {detailTarget?.visits.map((v) => (
              <div key={v.id} className='space-y-2 rounded-md border p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-medium'>
                    {v.customerName ?? `#${v.customerId}`}
                  </span>
                  <ScoreBadge score={v.visitScore} />
                </div>
                <p className='text-muted-foreground whitespace-pre-wrap text-sm'>
                  {v.visitActionNote ?? '—'}
                </p>
                <div className='flex items-center gap-2'>
                  <JudgmentBadge judgment={v.managerJudgment} />
                  {canReview && (
                    <div className='ml-auto flex items-center gap-2'>
                      <Select
                        value={draftJudgment[v.id] ?? v.managerJudgment}
                        onValueChange={(val) =>
                          setDraftJudgment((d) => ({
                            ...d,
                            [v.id]: val as ManagerJudgment
                          }))
                        }
                      >
                        <SelectTrigger className='w-28'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='normal'>正常</SelectItem>
                          <SelectItem value='pending'>待复核</SelectItem>
                          <SelectItem value='abnormal'>不达成</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size='sm'
                        disabled={judgeMut.isPending}
                        onClick={() => handleJudge(v.id)}
                      >
                        {judgeMut.isPending && (
                          <Icons.spinner className='mr-1 size-4 animate-spin' />
                        )}
                        保存
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {canReview && (detailTarget?.visits.length ?? 0) > 0 && (
              <p className='text-muted-foreground text-xs'>
                人审结论"正常"计入有效拜访（KPI 真值），"不达成"排除。系统不自动裁决，以管理者判断为准。
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI 生成 Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className='sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>AI 生成日报</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='ai-date'>报表日期</Label>
              <Input
                id='ai-date'
                type='date'
                value={aiForm.report_date}
                onChange={(e) => setAiForm({ ...aiForm, report_date: e.target.value })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='ai-transcript'>对话 / 工作记录</Label>
              <Textarea
                id='ai-transcript'
                rows={8}
                value={aiForm.transcript}
                onChange={(e) => setAiForm({ ...aiForm, transcript: e.target.value })}
                placeholder='粘贴当日销售对话或工作记录，AI 将抽取量化指标并生成小结'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAiOpen(false)}>
              取消
            </Button>
            <Button onClick={handleGenerate} disabled={generateMut.isPending}>
              {generateMut.isPending && (
                <Icons.spinner className='mr-1 size-4 animate-spin' />
              )}
              AI 生成
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
            确定删除 {deleteTarget?.reportDate} 的日报？此操作不可撤销。
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
