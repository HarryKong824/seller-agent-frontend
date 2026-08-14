'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
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
  METRIC_ORDER,
  PERIOD_LABELS,
  type ReportPeriod
} from '@/features/team-reports/types';
import { useTeamReport, useUsers } from '@/features/team-reports/api';

/** 自报 vs GPS 偏差超过该比例则高亮预警（KPI 公平交叉校验）。 */
const VISIT_GAP_WARN_RATIO = 0.3;

function gapRatio(self: number, gps: number): number {
  if (gps <= 0) return 0;
  return Math.abs(self - gps) / gps;
}

export default function TeamReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [userId, setUserId] = useState<number | null>(null);

  const { data, isLoading, isError } = useTeamReport({ period, userId });
  const { data: users } = useUsers();

  const salesOptions = useMemo(
    () => (users ?? []).filter((u) => u.role === 'sales' || u.role === 'manager'),
    [users]
  );

  const members = useMemo(() => data?.members ?? [], [data]);

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>团队报表</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            按周期聚合每位销售的量化动作。灰色「自报拜访」与蓝色「GPS 打卡」并列——两者偏差过大时高亮，用于 KPI/工资公平交叉校验。
          </p>
        </div>
      </div>

      <div className='flex flex-wrap items-end gap-3'>
        <div className='w-40 space-y-1'>
          <Label>统计周期</Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABELS) as ReportPeriod[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-52 space-y-1'>
          <Label>限定销售（可选）</Label>
          <Select
            value={userId ? String(userId) : 'all'}
            onValueChange={(v) => setUserId(v === 'all' ? null : Number(v))}
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
      </div>

      {data && (
        <div className='flex flex-wrap gap-3'>
          <Badge variant='secondary' className='text-sm'>
            {data.start} ~ {data.end}
          </Badge>
          <Badge variant='outline' className='text-sm'>
            <Icons.teams className='mr-1 size-3.5' />
            {members.length} 名销售
          </Badge>
          <Badge variant='outline' className='text-sm'>
            自报拜访合计 {data.totals.visitsCount}
          </Badge>
          <Badge variant='outline' className='text-sm'>
            GPS 打卡合计 {data.totals.actualVisits}
          </Badge>
        </div>
      )}

      {isLoading && <p className='text-muted-foreground text-sm'>加载中…</p>}
      {isError && (
        <p className='text-sm text-red-500'>加载团队报表失败，请确认你有管理者权限后重试。</p>
      )}

      {!isLoading && !isError && members.length === 0 && (
        <p className='text-muted-foreground text-sm'>该周期暂无销售数据。</p>
      )}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {members.map((m) => {
          const hasGap = gapRatio(m.visitsCount, m.actualVisits) > VISIT_GAP_WARN_RATIO;
          return (
            <Card key={m.userId} className='flex flex-col'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0'>
                <CardTitle className='text-base'>{m.fullName || `用户#${m.userId}`}</CardTitle>
                <Badge variant='secondary'>{m.reportCount} 份日报</Badge>
              </CardHeader>
              <CardContent className='flex flex-1 flex-col gap-2'>
                <div className='grid grid-cols-2 gap-2'>
                  {METRIC_ORDER.map((mt) => {
                    const isVisitPair = mt.key === 'visitsCount' || mt.key === 'actualVisits';
                    const gapHighlight =
                      isVisitPair && mt.key === 'visitsCount' && hasGap;
                    return (
                      <div
                        key={mt.key}
                        className={`rounded px-2 py-1.5 text-sm ${
                          gapHighlight ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-muted/50'
                        }`}
                      >
                        <div className='text-muted-foreground text-xs'>{mt.label}</div>
                        <div className='font-medium'>{mt.key === 'dealAmount' ? `¥${Number(m[mt.key]).toLocaleString()}` : m[mt.key]}</div>
                      </div>
                    );
                  })}
                </div>
                {hasGap && (
                  <p className='text-amber-700 dark:text-amber-400 text-xs'>
                    ⚠ 自报拜访与 GPS 打卡偏差超过 {Math.round(VISIT_GAP_WARN_RATIO * 100)}%，建议核实。
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
