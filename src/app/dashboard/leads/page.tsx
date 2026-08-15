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
  LEAD_SOURCES,
  LEAD_STATUS_LABELS,
  type LeadResponse,
  type LeadSource,
  type LeadStatus
} from '@/features/leads/types';
import {
  useConvertLead,
  useCreateLead,
  useDeleteLead,
  useLeads,
  useUpdateLead
} from '@/features/leads/api';

type FormState = {
  contactName: string;
  companyName: string;
  phone: string;
  email: string;
  source: LeadSource;
  interest: string;
  score: string;
  status: LeadStatus;
};

const EMPTY_FORM: FormState = {
  contactName: '',
  companyName: '',
  phone: '',
  email: '',
  source: '其他',
  interest: '',
  score: '',
  status: 'new'
};

const STATUS_BADGE_VARIANT: Record<LeadStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'secondary',
  contacted: 'outline',
  qualified: 'default',
  disqualified: 'destructive',
  converted: 'outline'
};

function toIntOrNull(v: string): number | null {
  const s = v.trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.floor(n) : null;
}

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const { data, isLoading, isError } = useLeads({
    status: statusFilter === 'all' ? null : statusFilter,
    source: sourceFilter === 'all' ? null : sourceFilter
  });
  const createMut = useCreateLead();
  const updateMut = useUpdateLead();
  const deleteMut = useDeleteLead();
  const convertMut = useConvertLead();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editLead, setEditLead] = useState<LeadResponse | null>(null);

  const [deleteLead, setDeleteLead] = useState<LeadResponse | null>(null);
  const [convertLead, setConvertLead] = useState<LeadResponse | null>(null);
  const [convertGrade, setConvertGrade] = useState<'A' | 'B' | 'C'>('C');
  const [convertIndustry, setConvertIndustry] = useState<string>('');

  const leads = useMemo(() => data?.items ?? [], [data]);

  function openCreate() {
    setEditLead(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(l: LeadResponse) {
    setEditLead(l);
    setForm({
      contactName: l.contactName,
      companyName: l.companyName ?? '',
      phone: l.phone ?? '',
      email: l.email ?? '',
      source: l.source,
      interest: l.interest ?? '',
      score: l.score != null ? String(l.score) : '',
      status: l.status
    });
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (!form.contactName.trim()) {
      toast.error('请填写联系人姓名');
      return;
    }
    const score = toIntOrNull(form.score);
    if (score != null && (score < 0 || score > 100)) {
      toast.error('评分需在 0-100 之间');
      return;
    }
    try {
      if (editLead) {
        await updateMut.mutateAsync({
          id: editLead.id,
          contact_name: form.contactName.trim(),
          company_name: form.companyName.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          source: form.source,
          status: form.status,
          interest: form.interest.trim() || null,
          score
        });
        toast.success('已更新线索');
      } else {
        await createMut.mutateAsync({
          contact_name: form.contactName.trim(),
          company_name: form.companyName.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          source: form.source,
          interest: form.interest.trim() || null,
          score
        });
        toast.success('已创建线索');
      }
      setFormOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    }
  }

  async function handleDelete() {
    if (!deleteLead) return;
    try {
      await deleteMut.mutateAsync(deleteLead.id);
      toast.success('已删除线索');
      setDeleteLead(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  }

  async function handleConvert() {
    if (!convertLead) return;
    try {
      await convertMut.mutateAsync({
        id: convertLead.id,
        grade: convertGrade,
        industry: convertIndustry.trim() || '其他'
      });
      toast.success('已转化为客户');
      setConvertLead(null);
      setConvertIndustry('');
      setConvertGrade('C');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '转化失败');
    }
  }

  const pending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending || convertMut.isPending;

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>线索管理</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            沉淀展会/广告/转介绍等来源的潜在客户线索，跟进状态推进，成熟后一键转化为客户。
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icons.plusCircle className='mr-1 size-4' />
          新建线索
        </Button>
      </div>

      {/* 筛选 */}
      <div className='flex flex-wrap gap-3'>
        <div className='w-40 space-y-1'>
          <Label className='text-xs'>状态</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部状态</SelectItem>
              {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-40 space-y-1'>
          <Label className='text-xs'>来源</Label>
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? 'all')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部来源</SelectItem>
              {LEAD_SOURCES.map((src) => (
                <SelectItem key={src} value={src}>
                  {src}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <p className='text-muted-foreground text-sm'>加载中…</p>}
      {isError && (
        <p className='text-sm text-red-500'>加载线索失败，请确认你已登录后重试。</p>
      )}

      {!isLoading && !isError && leads.length === 0 && (
        <p className='text-muted-foreground text-sm'>
          暂无线索，点击右上角「新建线索」开始沉淀潜在客户。
        </p>
      )}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {leads.map((l) => (
          <Card key={l.id} className='flex flex-col'>
            <CardHeader className='flex flex-row items-start justify-between space-y-0'>
              <div className='flex flex-col gap-1'>
                <CardTitle className='text-base'>{l.contactName}</CardTitle>
                <div className='flex flex-wrap gap-1'>
                  <Badge variant='secondary'>{l.source}</Badge>
                  <Badge variant={STATUS_BADGE_VARIANT[l.status]}>
                    {LEAD_STATUS_LABELS[l.status]}
                  </Badge>
                </div>
              </div>
              <div className='flex gap-1'>
                {l.status !== 'converted' && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-7'
                    onClick={() => setConvertLead(l)}
                    aria-label='转化为客户'
                  >
                    <Icons.user2 className='size-4' />
                  </Button>
                )}
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7'
                  onClick={() => openEdit(l)}
                  aria-label='编辑'
                >
                  <Icons.edit className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7 text-red-500'
                  onClick={() => setDeleteLead(l)}
                  aria-label='删除'
                >
                  <Icons.trash className='size-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col gap-2 text-sm'>
              {l.companyName && (
                <div className='text-muted-foreground'>
                  公司：<span className='text-foreground'>{l.companyName}</span>
                </div>
              )}
              <div className='text-muted-foreground'>
                归属：<span className='text-foreground'>{l.ownerSales}</span>
              </div>
              {l.phone && (
                <div className='text-muted-foreground'>
                  电话：<span className='text-foreground'>{l.phone}</span>
                </div>
              )}
              {l.email && (
                <div className='text-muted-foreground'>
                  邮箱：<span className='text-foreground'>{l.email}</span>
                </div>
              )}
              {l.interest && (
                <div className='text-muted-foreground'>
                  意向：<span className='text-foreground'>{l.interest}</span>
                </div>
              )}
              <div className='mt-auto flex items-center justify-between pt-1'>
                <span className='text-muted-foreground text-xs'>
                  评分：{l.score != null ? l.score : '—'}
                </span>
                {l.convertedCustomerId != null && (
                  <span className='text-muted-foreground text-xs'>
                    客户#{l.convertedCustomerId}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 新建 / 编辑 Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditLead(null);
            setFormOpen(false);
          }
        }}
      >
        <DialogContent className='sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>{editLead ? '编辑线索' : '新建线索'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label htmlFor='contactName'>联系人 *</Label>
                <Input
                  id='contactName'
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  placeholder='必填'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='companyName'>公司名称</Label>
                <Input
                  id='companyName'
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label htmlFor='phone'>电话</Label>
                <Input
                  id='phone'
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>邮箱</Label>
                <Input
                  id='email'
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label>来源</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) => setForm({ ...form, source: v as LeadSource })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((src) => (
                      <SelectItem key={src} value={src}>
                        {src}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='score'>评分 (0-100)</Label>
                <Input
                  id='score'
                  type='number'
                  min={0}
                  max={100}
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: e.target.value })}
                  placeholder='可空'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='interest'>意向产品 / 备注</Label>
              <Input
                id='interest'
                value={form.interest}
                onChange={(e) => setForm({ ...form, interest: e.target.value })}
              />
            </div>
            {editLead && (
              <div className='space-y-2'>
                <Label>跟进状态</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as LeadStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {LEAD_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!editLead && (
              <p className='text-muted-foreground text-xs'>
                线索归属销售为你本人（由系统按当前登录账号强制写入）。
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setEditLead(null);
                setFormOpen(false);
              }}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending && <Icons.spinner className='mr-1 size-4 animate-spin' />}
              {editLead ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 转化 Dialog */}
      <Dialog open={convertLead !== null} onOpenChange={(o) => !o && setConvertLead(null)}>
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>转化为客户</DialogTitle>
          </DialogHeader>
          <p className='text-muted-foreground text-sm'>
            将线索「{convertLead?.contactName}」生成客户（{convertLead?.companyName || convertLead?.contactName}），
            归属当前销售，阶段为线索、状态为潜在。
          </p>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-2'>
              <Label>客户分级</Label>
              <Select value={convertGrade} onValueChange={(v) => setConvertGrade(v as 'A' | 'B' | 'C')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='A'>A</SelectItem>
                  <SelectItem value='B'>B</SelectItem>
                  <SelectItem value='C'>C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='industry'>行业</Label>
              <Input
                id='industry'
                value={convertIndustry}
                onChange={(e) => setConvertIndustry(e.target.value)}
                placeholder='默认：其他'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConvertLead(null)}>
              取消
            </Button>
            <Button onClick={handleConvert} disabled={convertMut.isPending}>
              {convertMut.isPending && <Icons.spinner className='mr-1 size-4 animate-spin' />}
              转化
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 Dialog */}
      <Dialog open={deleteLead !== null} onOpenChange={(o) => !o && setDeleteLead(null)}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className='text-muted-foreground py-2 text-sm'>
            确定删除线索「{deleteLead?.contactName}」？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteLead(null)}>
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
