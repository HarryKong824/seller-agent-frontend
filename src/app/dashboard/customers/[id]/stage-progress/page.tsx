'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { STAGE_LABELS, STAGE_ORDER } from '@/features/customer/types';
import { useCreateStageProgress, useStageProgress } from '@/features/stage-progress/api';

export default function StageProgressPage() {
  const params = useParams<{ id: string }>();
  const customerId = Number(params.id);
  const { data, isLoading } = useStageProgress(customerId);
  const createMut = useCreateStageProgress(customerId);

  const [fromStage, setFromStage] = useState<string>('lead');
  const [toStage, setToStage] = useState<string>('qualified');
  const [note, setNote] = useState('');

  async function handleAdd() {
    try {
      await createMut.mutateAsync({
        from_stage: fromStage,
        to_stage: toStage,
        changed_by_id: 0, // 后端从 token 推断,这里传 0 占位
        note: note || null
      });
      toast.success('已补记阶段推进');
      setNote('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '补记失败');
    }
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <Link href={`/dashboard/customers/${customerId}`} className='text-muted-foreground text-sm hover:underline'>
            ← 返回客户详情
          </Link>
          <h1 className='mt-1 text-2xl font-semibold tracking-tight'>阶段推进历史</h1>
        </div>
      </div>

      {/* 补记表单 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>补记阶段推进</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap items-end gap-3'>
            <div className='w-40 space-y-1'>
              <Label className='text-xs'>从阶段</Label>
              <Select value={fromStage} onValueChange={(v) => setFromStage(v as string)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Icons.chevronRight className='mb-2 size-4' />
            <div className='w-40 space-y-1'>
              <Label className='text-xs'>到阶段</Label>
              <Select value={toStage} onValueChange={(v) => setToStage(v as string)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex-1 space-y-1'>
              <Label className='text-xs'>备注(可选)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder='如越级推进原因' />
            </div>
            <Button onClick={handleAdd} disabled={createMut.isPending}>
              {createMut.isPending && <Icons.spinner className='mr-1 size-4 animate-spin' />}
              补记
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 历史时间轴 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>推进历史</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className='text-muted-foreground text-sm'>加载中…</p>
          ) : !data || data.items.length === 0 ? (
            <p className='text-muted-foreground text-sm'>暂无阶段推进记录</p>
          ) : (
            <div className='space-y-4'>
              {data.items.map((p, i) => (
                <div key={p.id} className='flex gap-3'>
                  <div className='flex flex-col items-center'>
                    <div className='bg-primary size-2 rounded-full' />
                    {i < data.items.length - 1 && <div className='bg-border w-px flex-1' />}
                  </div>
                  <div className='flex-1 pb-4'>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>{STAGE_LABELS[p.fromStage] ?? p.fromStage}</Badge>
                      <Icons.chevronRight className='size-3' />
                      <Badge>{STAGE_LABELS[p.toStage] ?? p.toStage}</Badge>
                      <span className='text-muted-foreground text-xs'>
                        {format(new Date(p.changedAt), 'yyyy-MM-dd HH:mm')}
                      </span>
                    </div>
                    {p.note && <p className='mt-1 text-sm'>{p.note}</p>}
                    {p.snapshot && (
                      <details className='mt-1'>
                        <summary className='text-muted-foreground text-xs cursor-pointer'>指标快照</summary>
                        <pre className='bg-muted/50 mt-1 rounded p-2 text-xs'>
                          {JSON.stringify(p.snapshot, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
