'use client';

import { useState } from 'react';
import { toast } from 'sonner';

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
import {
  PERIOD_LABELS,
  SEVERITY_LABELS,
  type InsightPeriod,
  type ManagementSuggestion,
  type InsightSeverity
} from '@/features/management-insights/types';
import { useManagementInsight } from '@/features/management-insights/api';

const SEVERITY_BADGE: Record<InsightSeverity, 'default' | 'secondary' | 'destructive'> = {
  info: 'secondary',
  warning: 'default',
  critical: 'destructive'
};

export default function InsightsPage() {
  const [period, setPeriod] = useState<InsightPeriod>('week');

  const insightMut = useManagementInsight();

  async function handleGenerate() {
    try {
      await insightMut.mutateAsync({ period });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '获取管理建议失败');
    }
  }

  const data = insightMut.data;
  const suggestions: ManagementSuggestion[] = data?.suggestions ?? [];

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>管理建议</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            基于团队量化数据（自报 + GPS 客观打卡）生成管理建议。AI 不可用时自动降级为规则建议，并在来源处标注。
          </p>
        </div>
        <div className='flex items-end gap-3'>
          <div className='w-36 space-y-1'>
            <Label>统计周期</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as InsightPeriod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABELS) as InsightPeriod[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PERIOD_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={insightMut.isPending}>
            {insightMut.isPending && <Icons.spinner className='mr-1 size-4 animate-spin' />}
            <Icons.sparkles className='mr-1 size-4' />
            生成建议
          </Button>
        </div>
      </div>

      {data && (
        <div className='flex flex-wrap items-center gap-3'>
          <Badge variant='outline' className='text-sm'>
            {data.start} ~ {data.end}
          </Badge>
          <Badge variant={data.generatedBy === 'llm' ? 'default' : 'secondary'} className='text-sm'>
            {data.generatedBy === 'llm' ? (
              <Icons.sparkles className='mr-1 size-3.5' />
            ) : (
              <Icons.adjustments className='mr-1 size-3.5' />
            )}
            {data.generatedBy === 'llm' ? 'AI 生成' : '规则建议（AI 暂不可用）'}
          </Badge>
          <span className='text-muted-foreground text-sm'>共 {suggestions.length} 条建议</span>
        </div>
      )}

      {insightMut.isError && (
        <p className='text-sm text-red-500'>获取管理建议失败，请确认你有管理者权限后重试。</p>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>总体研判</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm leading-relaxed'>{data.summary}</p>
          </CardContent>
        </Card>
      )}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {suggestions.map((s, i) => (
          <Card key={i} className='flex flex-col'>
            <CardHeader className='flex flex-row items-start justify-between space-y-0'>
              <CardTitle className='text-base'>{s.title}</CardTitle>
              <Badge variant={SEVERITY_BADGE[s.severity]}>{SEVERITY_LABELS[s.severity]}</Badge>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col gap-2'>
              <p className='text-muted-foreground text-sm leading-relaxed'>{s.detail}</p>
              {s.fullName && (
                <p className='text-xs text-muted-foreground'>涉及：{s.fullName}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {data && suggestions.length === 0 && (
        <p className='text-muted-foreground text-sm'>该周期暂无显著偏差，团队执行良好。</p>
      )}
    </div>
  );
}
