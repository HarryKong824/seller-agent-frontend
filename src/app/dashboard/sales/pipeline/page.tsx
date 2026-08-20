'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useCustomerStats } from '@/features/customer/api';
import {
  OPEN_STAGES,
  STAGE_LABELS,
  STAGE_ORDER,
  type Customer
} from '@/features/customer/types';
import { useStageStats } from '@/features/stage-progress/api';

/** 按阶段分组客户(排除 lost 终态) */
function groupByStage(customers: Customer[]): Record<string, Customer[]> {
  const map: Record<string, Customer[]> = {};
  OPEN_STAGES.forEach((s) => (map[s] = []));
  customers.forEach((c) => {
    if (map[c.stage]) map[c.stage].push(c);
  });
  return map;
}

export default function SalesPipelinePage() {
  // 使用 stats 获取 pipeline, 再 fetch 客户列表(简化: 用 stats 自带数据)
  const { data: statsData, isLoading: statsLoading } = useCustomerStats();
  const { data: stageStats } = useStageStats();
  // 客户列表(粗略拉取)
  // 注: 完整实现应使用专门的 list API,此处简化使用 stats 内 funnel
  const pipeline = statsData?.pipeline;
  const funnel = useMemo(() => pipeline?.funnel ?? [], [pipeline]);
  const distribution = useMemo(() => pipeline?.stageDistribution ?? [], [pipeline]);

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>销售6阶段看板</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          ①线索获取 → ②需求确认 → ③方案呈现 → ④商务谈判 → ⑤交付验收 → ⑥持续经营
        </p>
      </div>

      {/* 核心指标卡 */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='text-muted-foreground text-xs'>在途金额</div>
            <div className='mt-1 text-xl font-semibold'>
              ¥{(pipeline?.openPipelineAmount ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-muted-foreground text-xs'>加权预测</div>
            <div className='mt-1 text-xl font-semibold'>
              ¥{(pipeline?.weightedForecast ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-muted-foreground text-xs'>在途商机</div>
            <div className='mt-1 text-xl font-semibold'>{pipeline?.openDeals ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-muted-foreground text-xs'>赢单率</div>
            <div className='mt-1 text-xl font-semibold'>{pipeline?.winRate ?? 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* 6阶段漏斗 */}
      {statsLoading ? (
        <p className='text-muted-foreground text-sm'>加载中…</p>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6'>
          {funnel.map((stage) => (
            <Card key={stage.stage} className='flex flex-col'>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center justify-between text-sm'>
                  <span>{stage.label}</span>
                  <Badge variant='secondary'>{stage.count}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className='flex-1 space-y-2'>
                <div>
                  <div className='text-muted-foreground text-xs'>商机金额</div>
                  <div className='text-sm font-medium'>
                    ¥{stage.amount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className='text-muted-foreground text-xs'>赢率</div>
                  <div className='text-sm font-medium'>{(stage.winRate * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className='text-muted-foreground text-xs'>加权金额</div>
                  <div className='text-sm font-medium'>
                    ¥{stage.weightedAmount.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 阶段分布(含 lost 终态) */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>阶段分布(全量)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {distribution.map((s) => (
              <Badge key={s.stage} variant='outline'>
                {s.label}: {s.count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 阶段流转统计 */}
      {stageStats && stageStats.stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>阶段流转统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b text-left'>
                    <th className='py-2 pr-4'>从阶段</th>
                    <th className='py-2 pr-4'>到阶段</th>
                    <th className='py-2 pr-4'>转化次数</th>
                    <th className='py-2 pr-4'>平均停留(天)</th>
                  </tr>
                </thead>
                <tbody>
                  {stageStats.stats.map((s, i) => (
                    <tr key={i} className='border-b'>
                      <td className='py-2 pr-4'>{STAGE_LABELS[s.fromStage] ?? s.fromStage}</td>
                      <td className='py-2 pr-4'>{STAGE_LABELS[s.toStage] ?? s.toStage}</td>
                      <td className='py-2 pr-4'>{s.count}</td>
                      <td className='py-2 pr-4'>
                        {s.avgDwellDays != null ? s.avgDwellDays.toFixed(1) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
