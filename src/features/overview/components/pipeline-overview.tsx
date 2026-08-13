'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Icons } from '@/components/icons';
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';

import { useCustomerStats } from '@/features/customer/api';
import { STAGE_LABELS, type PipelineStats } from '@/features/customer/types';

const STAGE_COLORS: Record<string, string> = {
  lead: 'var(--chart-1)',
  qualified: 'var(--chart-2)',
  proposal: 'var(--chart-3)',
  negotiation: 'var(--chart-4)',
  won: 'var(--chart-5)',
  lost: 'var(--chart-1)'
};

function fmtYuan(v: number): string {
  if (!Number.isFinite(v)) return '¥0';
  if (Math.abs(v) >= 10000) return `¥${(v / 10000).toFixed(1)}万`;
  return `¥${v.toFixed(0)}`;
}

function KpiCard({
  label,
  value,
  hint,
  trend
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: 'up' | 'down';
}) {
  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-muted-foreground text-sm'>
          {trend === 'up' && <Icons.trendingUp className='mr-1 inline size-4' />}
          {trend === 'down' && <Icons.trendingDown className='mr-1 inline size-4' />}
          {hint ?? '—'}
        </div>
      </CardContent>
    </Card>
  );
}

export function PipelineOverview() {
  const { data, isLoading, isError } = useCustomerStats();

  if (isLoading) {
    return (
      <div className='flex h-40 items-center justify-center'>
        <Icons.spinner className='text-muted-foreground size-6 animate-spin' />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <Card>
        <CardContent className='text-muted-foreground py-10 text-center text-sm'>
          Pipeline 数据加载失败
        </CardContent>
      </Card>
    );
  }

  const p: PipelineStats = data.pipeline;
  const funnelData = p.funnel.map((f) => ({
    label: f.label,
    amount: f.amount,
    winRate: f.winRate
  }));
  const distData = p.stageDistribution
    .filter((s) => s.count > 0)
    .map((s) => ({
      stage: s.stage,
      label: STAGE_LABELS[s.stage] ?? s.stage,
      count: s.count,
      fill: STAGE_COLORS[s.stage] ?? 'var(--chart-1)'
    }));

  const cycleText =
    p.avgCycleDays != null ? `平均 ${p.avgCycleDays.toFixed(0)} 天` : '数据不足';

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6'>
        <KpiCard
          label='加权预测'
          value={fmtYuan(p.weightedForecast)}
          hint='Σ 在途金额 × 阶段赢率'
          trend='up'
        />
        <KpiCard
          label='在途商机金额'
          value={fmtYuan(p.openPipelineAmount)}
          hint={`${p.openDeals} 个在途商机`}
        />
        <KpiCard
          label='平均客单价（赢单）'
          value={fmtYuan(p.avgDealAmount)}
          hint={`赢单 ${p.wonDeals} 个`}
        />
        <KpiCard
          label='赢单率'
          value={`${p.winRate.toFixed(0)}%`}
          hint={`赢 ${p.wonDeals} / 丢 ${p.lostDeals}`}
          trend={p.winRate >= 50 ? 'up' : 'down'}
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
        {/* 漏斗：各在途阶段商机金额 */}
        <Card className='col-span-4'>
          <CardHeader>
            <CardTitle>Pipeline 漏斗（在途阶段商机金额）</CardTitle>
            <CardDescription>按商机阶段分布，金额越高代表该阶段积压价值越大</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelData.every((d) => d.amount === 0) ? (
              <div className='text-muted-foreground py-10 text-center text-sm'>
                暂无在途商机金额数据
              </div>
            ) : (
              <ChartContainer
                config={{ amount: { label: '商机金额' } }}
                className='h-[260px] w-full'
              >
                <BarChart
                  layout='vertical'
                  data={funnelData}
                  margin={{ left: 8, right: 16 }}
                >
                  <YAxis
                    dataKey='label'
                    type='category'
                    tickLine={false}
                    tickMargin={8}
                    axisLine={false}
                    width={72}
                  />
                  <XAxis dataKey='amount' type='number' hide />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => fmtYuan(Number(value))}
                        nameKey='label'
                      />
                    }
                  />
                  <Bar dataKey='amount' radius={4} fill='var(--chart-1)'>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* 阶段分布：各阶段客户数 */}
        <Card className='col-span-4 md:col-span-3'>
          <CardHeader>
            <CardTitle>阶段分布</CardTitle>
            <CardDescription>各商机阶段客户数（含赢单/丢单）</CardDescription>
          </CardHeader>
          <CardContent>
            {distData.length === 0 ? (
              <div className='text-muted-foreground py-10 text-center text-sm'>
                暂无阶段分布数据
              </div>
            ) : (
              <ChartContainer
                config={{ count: { label: '客户数' } }}
                className='mx-auto aspect-square max-h-[260px] min-h-[200px]'
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey='label' />} />
                  <Pie data={distData} dataKey='count' nameKey='label' innerRadius={40} radius={10} paddingAngle={2}>
                    {distData.map((d) => (
                      <Cell key={d.stage} fill={d.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className='text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-1 py-4 text-sm'>
          <span>平均销售周期：{cycleText}</span>
          <span>赢单金额合计：{fmtYuan(p.wonAmount)}</span>
          <span>商机总数：{p.totalDeals}</span>
        </CardContent>
      </Card>
    </div>
  );
}
