'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  useCreatePerformanceConfig,
  usePerformanceConfigs,
  usePerformanceScore,
  useUpdatePerformanceConfig
} from '@/features/performance/api';
import {
  useUsers as useTargetUsers
} from '@/features/targets/api';

function defaultIndex(type: string): number {
  const now = new Date();
  if (type === 'month') return now.getMonth() + 1;
  if (type === 'quarter') return Math.floor(now.getMonth() / 3) + 1;
  const onejan = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
}

export default function PerformancePage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [periodType, setPeriodType] = useState<string>('month');
  const [periodIndex, setPeriodIndex] = useState<number>(defaultIndex('month'));

  const { data: users } = useTargetUsers();
  const salesOptions = (users ?? []).filter((u) => u.role === 'sales' || u.role === 'manager');

  const { data: configs, isLoading: configsLoading } = usePerformanceConfigs();
  const { data: score, isLoading: scoreLoading } = usePerformanceScore({
    userId,
    year,
    periodType,
    periodIndex
  });
  const createConfigMut = useCreatePerformanceConfig();
  const updateConfigMut = useUpdatePerformanceConfig();

  const [configOpen, setConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
    name: '',
    resultWeight: '0.6',
    processWeight: '0.3',
    behaviorWeight: '0.1'
  });

  function openCreateConfig() {
    setConfigForm({ name: '', resultWeight: '0.6', processWeight: '0.3', behaviorWeight: '0.1' });
    setConfigOpen(true);
  }

  async function handleConfigSubmit() {
    const rw = Number(configForm.resultWeight);
    const pw = Number(configForm.processWeight);
    const bw = Number(configForm.behaviorWeight);
    if (Math.abs(rw + pw + bw - 1.0) > 0.001) {
      toast.error('三类指标权重之和必须为 1.0');
      return;
    }
    try {
      await createConfigMut.mutateAsync({
        name: configForm.name,
        result_weight: rw,
        process_weight: pw,
        behavior_weight: bw,
        is_active: true
      });
      toast.success('已创建并激活配置');
      setConfigOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '创建失败');
    }
  }

  async function handleActivate(id: number) {
    try {
      await updateConfigMut.mutateAsync({ id, is_active: true });
      toast.success('已切换为当前生效方案');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '切换失败');
    }
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>绩效考核</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          3 层指标:结果(60%) + 过程(30%) + 行为(10%)
        </p>
      </div>

      {/* 配置区 */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='text-base'>绩效配置</CardTitle>
          <Button size='sm' onClick={openCreateConfig}>
            <Icons.plusCircle className='mr-1 size-4' />
            新增方案
          </Button>
        </CardHeader>
        <CardContent>
          {configsLoading ? (
            <p className='text-muted-foreground text-sm'>加载中…</p>
          ) : !configs || configs.length === 0 ? (
            <p className='text-muted-foreground text-sm'>暂无配置,默认 60%/30%/10%</p>
          ) : (
            <div className='flex flex-wrap gap-2'>
              {configs.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-2 rounded border p-2 ${
                    c.isActive ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>{c.name}</span>
                    <span className='text-muted-foreground text-xs'>
                      {c.resultWeight}/{c.processWeight}/{c.behaviorWeight}
                    </span>
                  </div>
                  {c.isActive ? (
                    <Badge>当前生效</Badge>
                  ) : (
                    <Button size='sm' variant='outline' onClick={() => handleActivate(c.id)}>
                      启用
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 评分查询 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>绩效评分</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap gap-3'>
            <div className='w-40 space-y-1'>
              <Label className='text-xs'>销售</Label>
              <Select
                value={userId ? String(userId) : ''}
                onValueChange={(v) => setUserId(Number(v))}
              >
                <SelectTrigger><SelectValue placeholder='选择销售' /></SelectTrigger>
                <SelectContent>
                  {salesOptions.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.full_name || u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='w-28 space-y-1'>
              <Label className='text-xs'>年份</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[year - 1, year, year + 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='w-28 space-y-1'>
              <Label className='text-xs'>周期类型</Label>
              <Select value={periodType} onValueChange={(v) => { const sv = v as string; setPeriodType(sv); setPeriodIndex(defaultIndex(sv)); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='month'>月</SelectItem>
                  <SelectItem value='quarter'>季</SelectItem>
                  <SelectItem value='week'>周</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='w-24 space-y-1'>
              <Label className='text-xs'>周期序号</Label>
              <Input
                type='number'
                min={1}
                value={periodIndex}
                onChange={(e) => setPeriodIndex(Number(e.target.value))}
              />
            </div>
          </div>

          {!userId ? (
            <p className='text-muted-foreground text-sm'>请选择销售以查看评分</p>
          ) : scoreLoading ? (
            <p className='text-muted-foreground text-sm'>加载中…</p>
          ) : !score ? (
            <p className='text-muted-foreground text-sm'>暂无评分数据</p>
          ) : (
            <div className='space-y-4'>
              {/* 综合得分 */}
              <div className='bg-primary/5 rounded-lg border p-4'>
                <div className='text-muted-foreground text-xs'>综合得分</div>
                <div className='mt-1 text-3xl font-semibold'>
                  {(score.overall * 100).toFixed(1)}
                  <span className='text-muted-foreground text-base'> / 100</span>
                </div>
                <div className='text-muted-foreground mt-1 text-xs'>
                  {score.userName} · {score.periodStart} ~ {score.periodEnd} · 配置: {score.configName}
                </div>
              </div>

              {/* 三层指标 */}
              <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
                {[
                  { label: '结果指标', data: score.result, color: 'text-primary' },
                  { label: '过程指标', data: score.process, color: 'text-primary' },
                  { label: '行为指标', data: score.behavior, color: 'text-primary' }
                ].map((layer) => (
                  <Card key={layer.label}>
                    <CardContent className='p-4'>
                      <div className='text-muted-foreground text-xs'>
                        {layer.label}({(layer.data.weight * 100).toFixed(0)}%)
                      </div>
                      <div className={`mt-1 text-xl font-semibold ${layer.color}`}>
                        {(layer.data.score * 100).toFixed(1)}%
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        加权: {(layer.data.weighted * 100).toFixed(2)}
                      </div>
                      <div className='text-muted-foreground mt-1 text-xs'>{layer.data.detail}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建配置 Dialog */}
      <Dialog open={configOpen} onOpenChange={(o) => !o && setConfigOpen(false)}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>新增绩效配置</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label>方案名称</Label>
              <Input value={configForm.name} onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })} />
            </div>
            <div className='grid grid-cols-3 gap-3'>
              <div className='space-y-2'>
                <Label>结果权重</Label>
                <Input type='number' step={0.1} min={0} max={1} value={configForm.resultWeight} onChange={(e) => setConfigForm({ ...configForm, resultWeight: e.target.value })} />
              </div>
              <div className='space-y-2'>
                <Label>过程权重</Label>
                <Input type='number' step={0.1} min={0} max={1} value={configForm.processWeight} onChange={(e) => setConfigForm({ ...configForm, processWeight: e.target.value })} />
              </div>
              <div className='space-y-2'>
                <Label>行为权重</Label>
                <Input type='number' step={0.1} min={0} max={1} value={configForm.behaviorWeight} onChange={(e) => setConfigForm({ ...configForm, behaviorWeight: e.target.value })} />
              </div>
            </div>
            <p className='text-muted-foreground text-xs'>三类权重之和必须为 1.0,创建后自动设为当前生效方案。</p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfigOpen(false)}>取消</Button>
            <Button onClick={handleConfigSubmit} disabled={createConfigMut.isPending}>
              {createConfigMut.isPending && <Icons.spinner className='mr-1 size-4 animate-spin' />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
