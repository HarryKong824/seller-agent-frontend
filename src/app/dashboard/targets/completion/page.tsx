'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useTargetCompletion, useUsers } from '@/features/targets/api';
import type { TargetMetricCompletion } from '@/features/targets/types';

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function metricBadge(actual: number, target: number, rate: number) {
  if (target === 0 && actual === 0) return 'default';
  if (rate >= 1) return 'default';
  if (rate >= 0.6) return 'secondary';
  return 'destructive';
}

export default function TargetCompletionPage() {
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [ownerId, setOwnerId] = useState<number | null>(null);

  const { data: users } = useUsers();
  const salesOptions = useMemo(
    () => (users ?? []).filter((u) => u.role === 'sales' || u.role === 'manager'),
    [users]
  );

  const { data, isLoading, isError, refetch } = useTargetCompletion({
    ownerId: ownerId ?? 0,
    year,
    month
  });

  // ownerId 为 0 时后端要求必填；未选销售时不请求
  const ready = ownerId !== null;

  const metrics: TargetMetricCompletion[] = data?.metrics ?? [];

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>目标完成率</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            按销售、年、月查看 KPI 目标完成率。拜访数取 GPS 客观打卡（与自报交叉校验），其余取量化自报。
          </p>
        </div>
      </div>

      <div className='flex flex-wrap items-end gap-3'>
        <div className='w-44 space-y-1'>
          <Label>选择销售</Label>
          <Select
            value={ownerId ? String(ownerId) : 'all'}
            onValueChange={(v) => setOwnerId(v === 'all' ? null : Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>请选择…</SelectItem>
              {salesOptions.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.full_name || u.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-28 space-y-1'>
          <Label>年份</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-24 space-y-1'>
          <Label>月份</Label>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} 月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant='outline' onClick={() => refetch()} disabled={isLoading || !ready}>
          <Icons.spinner className='mr-1 size-4' />
          刷新
        </Button>
      </div>

      {!ready && (
        <p className='text-muted-foreground text-sm'>请先选择一位销售查看完成率。</p>
      )}

      {ready && isLoading && <p className='text-muted-foreground text-sm'>加载中…</p>}
      {ready && isError && (
        <p className='text-sm text-red-500'>加载完成率失败，请确认权限后重试。</p>
      )}

      {ready && data && !data.targetSet && (
        <div className='bg-muted/50 rounded-md p-4 text-sm text-muted-foreground'>
          该销售 {year} 年 {month} 月 <span className='font-medium'>尚未设置目标</span>，仅显示当月实际值。设置目标后可查看完成率。
        </div>
      )}

      {ready && data && data.targetSet && (
        <>
          <div className='flex flex-wrap items-center gap-3'>
            <Badge variant='outline' className='text-sm'>
              {data.ownerFullName}
            </Badge>
            <Badge variant='default' className='text-sm'>
              总体完成率 {pct(data.overallCompletion)}
            </Badge>
            <Badge variant='outline' className='text-sm'>
              {data.periodStart} ~ {data.periodEnd}
            </Badge>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {metrics.map((m) => (
              <Card key={m.metric}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0'>
                  <CardTitle className='text-base'>{m.label}</CardTitle>
                  <Badge variant={metricBadge(m.actual, m.target, m.completionRate)}>
                    {pct(m.completionRate)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      实际 {m.actual}
                    </span>
                    <span className='text-muted-foreground'>目标 {m.target}</span>
                  </div>
                  <div className='bg-muted mt-2 h-2 w-full overflow-hidden rounded-full'>
                    <div
                      className='bg-primary h-full rounded-full'
                      style={{ width: `${Math.min(100, m.completionRate * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
