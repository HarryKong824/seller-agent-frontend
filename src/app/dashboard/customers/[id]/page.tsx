'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { useCustomer, useCustomerKnowledgeBases, useCustomerSessions } from '@/features/customer/api';
import { GRADE_LABELS, STATUS_LABELS, type Customer } from '@/features/customer/types';

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1 border-b py-3 last:border-b-0'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <span className='text-sm font-medium'>{children}</span>
    </div>
  );
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

  if (isLoading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <Icons.spinner className='text-muted-foreground size-6 animate-spin' />
      </div>
    );
  }

  if (isError || !customer) {
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

  const c: Customer = customer;

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
          <p className='text-muted-foreground mt-1 text-sm'>
            客户 ID #{c.id} · 基础信息与跟进状态
          </p>
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
              {c.lastFollowUpAt
                ? format(new Date(c.lastFollowUpAt), 'yyyy-MM-dd')
                : '未跟进'}
            </Field>
            <Field label='创建时间'>
              {format(new Date(c.created_at), 'yyyy-MM-dd HH:mm')}
            </Field>
            <Field label='更新时间'>
              {format(new Date(c.updated_at), 'yyyy-MM-dd HH:mm')}
            </Field>
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
                      <div className='truncate text-sm font-medium'>
                        {s.title || `会话 #${s.id}`}
                      </div>
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
                      <div className='truncate text-sm font-medium'>
                        {kb.name}
                      </div>
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
    </div>
  );
}
