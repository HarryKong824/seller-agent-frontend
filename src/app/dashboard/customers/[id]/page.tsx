'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
  useContacts,
  useCreateContact,
  useCustomer,
  useCustomerKnowledgeBases,
  useCustomerSessions,
  useDeleteContact,
  useUpdateCustomer360
} from '@/features/customer/api';
import { GRADE_LABELS, STATUS_LABELS, STAGE_LABELS, STAGE_ORDER, type Contact, type Customer } from '@/features/customer/types';
import { toast } from 'sonner';

const gradeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  A: 'default',
  B: 'secondary',
  C: 'outline'
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  prospect: 'secondary',
  dormant: 'outline',
  churned: 'destructive'
};

const KB_CATEGORY_LABELS: Record<string, string> = {
  product: '产品',
  sales_script: '话术',
  case: '案例',
  faq: '问答'
};

const DMU_ROLES = ['决策人', '影响者', '使用者', '采购', '财务', '其他'];
const ATTITUDES = ['支持', '中立', '反对'];
const POWERS = ['高', '中', '低'];

const attitudeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  支持: 'default',
  中立: 'secondary',
  反对: 'destructive'
};

const powerVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  高: 'default',
  中: 'secondary',
  低: 'outline'
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1 border-b py-3 last:border-b-0'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <span className='text-sm font-medium'>{children}</span>
    </div>
  );
}

/** 计算续约倒计时与预警（续约前 90 天）。 */
function renewalInfo(renewalDate: string | null): {
  text: string;
  warning: boolean;
} {
  if (!renewalDate) return { text: '未设置', warning: false };
  const target = new Date(renewalDate);
  if (Number.isNaN(target.getTime())) return { text: renewalDate, warning: false };
  const days = Math.ceil((target.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { text: `${format(target, 'yyyy-MM-dd')}（已过期 ${Math.abs(days)} 天）`, warning: false };
  if (days <= 90) return { text: `${format(target, 'yyyy-MM-dd')}（剩余 ${days} 天）`, warning: true };
  return { text: `${format(target, 'yyyy-MM-dd')}（剩余 ${days} 天）`, warning: false };
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  return <CustomerDetailContent id={id} />;
}

function CustomerDetailContent({ id }: { id: number }) {
  const { data: customer, isLoading, isError } = useCustomer(id);
  const {
    data: sessions,
    isLoading: sessionsLoading,
    isError: sessionsError
  } = useCustomerSessions(id);
  const {
    data: kbs,
    isLoading: kbsLoading,
    isError: kbsError
  } = useCustomerKnowledgeBases(id);
  const {
    data: contactsData,
    isLoading: contactsLoading,
    isError: contactsError
  } = useContacts(id);
  const createContact = useCreateContact(id);
  const deleteContact = useDeleteContact(id);
  const update360 = useUpdateCustomer360(id);

  const [cName, setCName] = useState('');
  const [cRole, setCRole] = useState(DMU_ROLES[0]);
  const [cAttitude, setCAttitude] = useState('中立');
  const [cPower, setCPower] = useState('中');
  const [cTitle, setCTitle] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cNote, setCNote] = useState('');

  const [healthInput, setHealthInput] = useState('');
  const [renewalInput, setRenewalInput] = useState('');

  // 线B③ Pipeline 表单状态
  const [stageInput, setStageInput] = useState('lead');
  const [dealAmountInput, setDealAmountInput] = useState('');
  const [expectedCloseInput, setExpectedCloseInput] = useState('');

  const c: Customer | undefined = customer;

  // 同步 360 编辑表单的初始值
  useEffect(() => {
    if (c) {
      setHealthInput(c.healthScore != null ? String(c.healthScore) : '');
      setRenewalInput(c.renewalDate ?? '');
      setStageInput(c.stage ?? 'lead');
      setDealAmountInput(c.dealAmount != null ? String(c.dealAmount) : '');
      setExpectedCloseInput(c.expectedCloseDate ?? '');
    }
  }, [c]);

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <Icons.spinner className='text-muted-foreground size-6 animate-spin' />
      </div>
    );
  }

  if (isError || !c) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center gap-3'>
        <p className='text-muted-foreground'>客户不存在或加载失败</p>
        <Link href='/dashboard/overview'>
          <Button variant='outline' size='sm'>
            返回客户资产看板
          </Button>
        </Link>
      </div>
    );
  }

  const contacts: Contact[] = contactsData?.items ?? [];
  const renew = renewalInfo(c.renewalDate);

  const handleAddContact = async () => {
    if (!cName.trim()) {
      toast.error('请填写联系人姓名');
      return;
    }
    try {
      await createContact.mutateAsync({
        name: cName.trim(),
        role: cRole,
        attitude: cAttitude,
        power: cPower,
        title: cTitle.trim() || null,
        phone: cPhone.trim() || null,
        email: cEmail.trim() || null,
        note: cNote.trim() || null
      });
      toast.success('已添加联系人');
      setCName('');
      setCTitle('');
      setCPhone('');
      setCEmail('');
      setCNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '添加联系人失败');
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    try {
      await deleteContact.mutateAsync(contactId);
      toast.success('已删除联系人');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除联系人失败');
    }
  };

  const handleSave360 = async () => {
    const hs = healthInput.trim() === '' ? null : Number(healthInput);
    if (hs != null && (Number.isNaN(hs) || hs < 0 || hs > 100)) {
      toast.error('健康度评分需在 0-100 之间');
      return;
    }
    try {
      await update360.mutateAsync({
        health_score: hs,
        renewal_date: renewalInput.trim() === '' ? null : renewalInput
      });
      toast.success('已保存客户 360 信息');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    }
  };

  // 线B③ Pipeline 保存：阶段 / 商机金额 / 预计成交
  const handleSavePipeline = async () => {
    const amtRaw = dealAmountInput.trim();
    const amt = amtRaw === '' ? null : Number(amtRaw);
    if (amt != null && (Number.isNaN(amt) || amt < 0)) {
      toast.error('商机金额需为非负数');
      return;
    }
    try {
      await update360.mutateAsync({
        stage: stageInput,
        deal_amount: amt,
        expected_close_date: expectedCloseInput.trim() === '' ? null : expectedCloseInput
      });
      toast.success('已保存商机 Pipeline 信息');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    }
  };

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <Link
              href='/dashboard/overview'
              className='text-muted-foreground hover:text-foreground text-sm'
            >
              客户资产看板
            </Link>
            <span className='text-muted-foreground'>/</span>
            <h2 className='text-2xl font-bold tracking-tight'>{c.name}</h2>
          </div>
          <p className='text-muted-foreground mt-1 text-sm'>客户 ID #{c.id} · 基础信息与跟进状态</p>
        </div>
        <Link href='/dashboard/overview'>
          <Button variant='outline' size='sm'>
            <Icons.chevronLeft className='mr-1 size-4' />
            返回看板
          </Button>
        </Link>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>基础信息</CardTitle>
            <CardDescription>客户的核心属性</CardDescription>
          </CardHeader>
          <div className='px-6 pb-6'>
            <Field label='客户名称'>{c.name}</Field>
            <Field label='行业'>{c.industry}</Field>
            <Field label='分级'>
              <Badge variant={gradeVariant[c.grade] ?? 'outline'}>
                {GRADE_LABELS[c.grade] ?? c.grade}
              </Badge>
            </Field>
            <Field label='状态'>
              <Badge variant={statusVariant[c.status] ?? 'outline'}>
                {STATUS_LABELS[c.status] ?? c.status}
              </Badge>
            </Field>
            <Field label='负责销售'>{c.ownerSales}</Field>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>跟进与时间</CardTitle>
            <CardDescription>最近跟进与系统时间</CardDescription>
          </CardHeader>
          <div className='px-6 pb-6'>
            <Field label='最近跟进'>
              {c.lastFollowUpAt ? format(new Date(c.lastFollowUpAt), 'yyyy-MM-dd') : '未跟进'}
            </Field>
            <Field label='创建时间'>{format(new Date(c.created_at), 'yyyy-MM-dd HH:mm')}</Field>
            <Field label='更新时间'>{format(new Date(c.updated_at), 'yyyy-MM-dd HH:mm')}</Field>
          </div>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {/* 关联会话 */}
        <Card>
          <CardHeader>
            <CardTitle>关联会话</CardTitle>
            <CardDescription>与该客户相关的聊天会话</CardDescription>
          </CardHeader>
          <div className='px-6 pb-6'>
            {sessionsLoading ? (
              <div className='flex h-20 items-center justify-center'>
                <Icons.spinner className='text-muted-foreground size-5 animate-spin' />
              </div>
            ) : sessionsError ? (
              <p className='text-muted-foreground text-sm'>加载失败</p>
            ) : sessions && sessions.items.length > 0 ? (
              <div className='flex flex-col'>
                {sessions.items.map((s) => (
                  <Link
                    key={s.id}
                    href='/dashboard/chat'
                    className='flex items-center justify-between border-b py-2.5 last:border-b-0 hover:bg-accent'
                  >
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-medium'>{s.title || `会话 #${s.id}`}</div>
                      <div className='text-muted-foreground text-xs'>
                        {format(new Date(s.updatedAt), 'yyyy-MM-dd HH:mm')}
                      </div>
                    </div>
                    <Icons.chevronRight className='text-muted-foreground size-4' />
                  </Link>
                ))}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>
                暂无关联会话。可在「对话」页新建会话时选择关联此客户。
              </p>
            )}
          </div>
        </Card>

        {/* 关联知识库 */}
        <Card>
          <CardHeader>
            <CardTitle>关联知识库</CardTitle>
            <CardDescription>该客户会话使用过的知识库</CardDescription>
          </CardHeader>
          <div className='px-6 pb-6'>
            {kbsLoading ? (
              <div className='flex h-20 items-center justify-center'>
                <Icons.spinner className='text-muted-foreground size-5 animate-spin' />
              </div>
            ) : kbsError ? (
              <p className='text-muted-foreground text-sm'>加载失败</p>
            ) : kbs && kbs.length > 0 ? (
              <div className='flex flex-col'>
                {kbs.map((kb) => (
                  <Link
                    key={kb.id}
                    href={`/dashboard/knowledge/${kb.id}`}
                    className='flex items-center justify-between border-b py-2.5 last:border-b-0 hover:bg-accent'
                  >
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-medium'>{kb.name}</div>
                      <div className='text-muted-foreground text-xs'>
                        {KB_CATEGORY_LABELS[kb.category] ?? kb.category}
                      </div>
                    </div>
                    <Icons.chevronRight className='text-muted-foreground size-4' />
                  </Link>
                ))}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>
                暂无关联知识库。该客户的会话绑定知识库后将自动出现在此。
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* 线 B① 客户 360 增强 */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {/* 决策链 DMU 联系人 */}
        <Card>
          <CardHeader>
            <CardTitle>决策链 DMU（联系人）</CardTitle>
            <CardDescription>记录客户侧决策圈：角色 / 态度 / 决策权力</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {contactsLoading ? (
              <div className='flex h-24 items-center justify-center'>
                <Icons.spinner className='text-muted-foreground size-5 animate-spin' />
              </div>
            ) : contactsError ? (
              <p className='text-muted-foreground text-sm'>联系人加载失败</p>
            ) : contacts.length === 0 ? (
              <p className='text-muted-foreground text-sm'>暂无联系人，添加决策链关键人。</p>
            ) : (
              <div className='flex flex-col divide-y'>
                {contacts.map((ct) => (
                  <div key={ct.id} className='flex items-start justify-between gap-2 py-3'>
                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='text-sm font-medium'>{ct.name}</span>
                        <Badge variant='outline'>{ct.role}</Badge>
                        <Badge variant={attitudeVariant[ct.attitude] ?? 'secondary'}>{ct.attitude}</Badge>
                        <Badge variant={powerVariant[ct.power] ?? 'outline'}>权力：{ct.power}</Badge>
                      </div>
                      <div className='text-muted-foreground mt-1 space-y-0.5 text-xs'>
                        {ct.title && <div>职位：{ct.title}</div>}
                        {ct.phone && <div>电话：{ct.phone}</div>}
                        {ct.email && <div>邮箱：{ct.email}</div>}
                        {ct.note && <div>备注：{ct.note}</div>}
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-muted-foreground shrink-0'
                      onClick={() => handleDeleteContact(ct.id)}
                      disabled={deleteContact.isPending}
                      aria-label='删除联系人'
                    >
                      <Icons.trash className='size-4' />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 新增联系人表单 */}
            <div className='space-y-3 border-t pt-4'>
              <div className='space-y-2'>
                <Label htmlFor='contact-name'>联系人姓名</Label>
                <Input
                  id='contact-name'
                  maxLength={100}
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder='如：王强'
                />
              </div>
              <div className='grid grid-cols-3 gap-2'>
                <div className='space-y-2'>
                  <Label>决策角色</Label>
                  <Select value={cRole} onValueChange={(v) => setCRole(v as string)}>
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DMU_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>态度</Label>
                  <Select value={cAttitude} onValueChange={(v) => setCAttitude(v as string)}>
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ATTITUDES.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>决策权力</Label>
                  <Select value={cPower} onValueChange={(v) => setCPower(v as string)}>
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POWERS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='grid grid-cols-3 gap-2'>
                <div className='space-y-2'>
                  <Label htmlFor='contact-title'>职位</Label>
                  <Input
                    id='contact-title'
                    maxLength={100}
                    value={cTitle}
                    onChange={(e) => setCTitle(e.target.value)}
                    placeholder='如：CTO'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='contact-phone'>电话</Label>
                  <Input
                    id='contact-phone'
                    maxLength={50}
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    placeholder='手机号'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='contact-email'>邮箱</Label>
                  <Input
                    id='contact-email'
                    maxLength={120}
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    placeholder='邮箱'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='contact-note'>备注</Label>
                <textarea
                  id='contact-note'
                  value={cNote}
                  onChange={(e) => setCNote(e.target.value)}
                  rows={2}
                  placeholder='补充背景、沟通过程或其他信息'
                  className='flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                />
              </div>
              <Button onClick={handleAddContact} disabled={createContact.isPending}>
                {createContact.isPending && <Icons.spinner className='mr-1 size-4 animate-spin' />}
                添加联系人
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 客户健康度与续约 */}
        <Card>
          <CardHeader>
            <CardTitle>客户健康度与续约</CardTitle>
            <CardDescription>轻量健康度评分 + 续约前 90 天预警</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>健康度评分</span>
                <span className='text-sm font-semibold'>
                  {c.healthScore != null ? `${c.healthScore} / 100` : '未评估'}
                </span>
              </div>
              <div className='h-2.5 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full rounded-full bg-primary transition-all'
                  style={{ width: `${c.healthScore != null ? Math.max(0, Math.min(100, c.healthScore)) : 0}%` }}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>续约日期</span>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>{renew.text}</span>
                  {renew.warning && (
                    <Badge variant='destructive'>续约前 90 天预警</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className='space-y-3 border-t pt-4'>
              <div className='space-y-2'>
                <Label htmlFor='health-score'>健康度评分（0-100，留空清空）</Label>
                <Input
                  id='health-score'
                  type='number'
                  min={0}
                  max={100}
                  value={healthInput}
                  onChange={(e) => setHealthInput(e.target.value)}
                  placeholder='如：80'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='renewal-date'>续约日期</Label>
                <Input
                  id='renewal-date'
                  type='date'
                  value={renewalInput}
                  onChange={(e) => setRenewalInput(e.target.value)}
                />
              </div>
              <Button onClick={handleSave360} disabled={update360.isPending}>
                {update360.isPending && <Icons.spinner className='mr-1 size-4 animate-spin' />}
                保存 360 信息
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 线B③ Pipeline 经营仪表盘：商机阶段 / 金额 / 预计成交 */}
      <Card>
        <CardHeader>
          <CardTitle>商机 Pipeline（销售阶段）</CardTitle>
          <CardDescription>
            标记商机所处阶段与金额，用于经营仪表盘漏斗与加权预测（赢率权重自动计入）
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label>商机阶段</Label>
              <Select value={stageInput} onValueChange={(v) => setStageInput(v as string)}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABELS[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='deal-amount'>商机金额（元）</Label>
              <Input
                id='deal-amount'
                type='number'
                min={0}
                value={dealAmountInput}
                onChange={(e) => setDealAmountInput(e.target.value)}
                placeholder='如：120000'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='expected-close'>预计成交日期</Label>
              <Input
                id='expected-close'
                type='date'
                value={expectedCloseInput}
                onChange={(e) => setExpectedCloseInput(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSavePipeline} disabled={update360.isPending}>
            {update360.isPending && <Icons.spinner className='mr-1 size-4 animate-spin' />}
            保存商机信息
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
