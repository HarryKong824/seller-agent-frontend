'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateTrainingRecord,
  useDeleteTrainingRecord,
  useTrainingRecords,
  useUpdateTrainingRecord
} from '@/features/training-records/api';
import { useUsers } from '@/features/targets/api';
import {
  TRAINING_TYPE_LABELS,
  type TrainingRecord,
  type TrainingRecordType
} from '@/features/training-records/types';

type FormState = {
  recordType: TrainingRecordType;
  title: string;
  description: string;
  trainerId: number | null;
  traineeId: number | null;
  trainingDate: string;
  durationMinutes: string;
  outcome: string;
  tags: string;
};

const EMPTY_FORM: FormState = {
  recordType: 'weekly_meeting',
  title: '',
  description: '',
  trainerId: null,
  traineeId: null,
  trainingDate: format(new Date(), 'yyyy-MM-dd'),
  durationMinutes: '',
  outcome: '',
  tags: ''
};

export default function TrainingPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<TrainingRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrainingRecord | null>(null);

  const { data: users } = useUsers();
  const userMap = useMemo(() => {
    const m = new Map<number, string>();
    (users ?? []).forEach((u) => m.set(u.id, u.full_name || u.username));
    return m;
  }, [users]);

  const { data, isLoading } = useTrainingRecords({
    recordType: filterType === 'all' ? null : filterType
  });
  const createMut = useCreateTrainingRecord();
  const updateMut = useUpdateTrainingRecord();
  const deleteMut = useDeleteTrainingRecord();

  const records = data?.items ?? [];

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(r: TrainingRecord) {
    setEditTarget(r);
    setForm({
      recordType: r.recordType,
      title: r.title,
      description: r.description ?? '',
      trainerId: r.trainerId,
      traineeId: r.traineeId,
      trainingDate: format(new Date(r.trainingDate), 'yyyy-MM-dd'),
      durationMinutes: r.durationMinutes?.toString() ?? '',
      outcome: r.outcome ?? '',
      tags: r.tags?.join(', ') ?? ''
    });
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      toast.error('请输入标题');
      return;
    }
    const tags = form.tags.split(',').map((s) => s.trim()).filter(Boolean);
    const payload = {
      title: form.title,
      description: form.description || null,
      trainer_id: form.trainerId,
      trainee_id: form.traineeId,
      training_date: new Date(form.trainingDate).toISOString(),
      duration_minutes: form.durationMinutes ? Number(form.durationMinutes) : null,
      outcome: form.outcome || null,
      tags: tags.length > 0 ? tags : null
    };
    try {
      if (editTarget) {
        await updateMut.mutateAsync({ id: editTarget.id, ...payload });
        toast.success('已更新培训记录');
      } else {
        await createMut.mutateAsync({
          record_type: form.recordType,
          ...payload
        });
        toast.success('已创建培训记录');
      }
      setFormOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success('已删除');
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>培训记录</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            团队赋能:新人带教 / 周例会 / 月度复盘 / 案例库
          </p>
        </div>
        <Button onClick={openCreate}>
          <Icons.plusCircle className='mr-1 size-4' />
          新增记录
        </Button>
      </div>

      <div className='w-40 space-y-1'>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as string)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>全部类型</SelectItem>
            {Object.entries(TRAINING_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className='text-muted-foreground text-sm'>加载中…</p>
      ) : records.length === 0 ? (
        <p className='text-muted-foreground text-sm'>暂无培训记录</p>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {records.map((r) => (
            <Card key={r.id}>
              <CardHeader className='flex flex-row items-start justify-between space-y-0'>
                <div className='flex flex-col gap-1'>
                  <CardTitle className='text-base'>{r.title}</CardTitle>
                  <Badge variant='secondary'>{TRAINING_TYPE_LABELS[r.recordType]}</Badge>
                </div>
                <div className='flex gap-1'>
                  <Button variant='ghost' size='icon' className='size-7' onClick={() => openEdit(r)}>
                    <Icons.edit className='size-4' />
                  </Button>
                  <Button variant='ghost' size='icon' className='size-7 text-red-500' onClick={() => setDeleteTarget(r)}>
                    <Icons.trash className='size-4' />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-2 text-sm'>
                <div className='text-muted-foreground'>
                  {format(new Date(r.trainingDate), 'yyyy-MM-dd')}
                  {r.durationMinutes && ` · ${r.durationMinutes}分钟`}
                </div>
                {r.trainerId && (
                  <div>培训者: {userMap.get(r.trainerId) ?? `#${r.trainerId}`}</div>
                )}
                {r.traineeId && (
                  <div>受训者: {userMap.get(r.traineeId) ?? `#${r.traineeId}`}</div>
                )}
                {r.description && <p className='text-muted-foreground'>{r.description}</p>}
                {r.outcome && <p className='text-muted-foreground'>结果: {r.outcome}</p>}
                {r.tags && r.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {r.tags.map((t) => (
                      <Badge key={t} variant='outline' className='text-xs'>{t}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className='sm:max-w-[560px]'>
          <DialogHeader>
            <DialogTitle>{editTarget ? '编辑培训记录' : '新增培训记录'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='flex gap-3'>
              <div className='w-40 space-y-2'>
                <Label>类型</Label>
                <Select
                  value={form.recordType}
                  onValueChange={(v) => setForm({ ...form, recordType: v as TrainingRecordType })}
                  disabled={!!editTarget}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRAINING_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex-1 space-y-2'>
                <Label>标题</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
            </div>
            <div className='flex gap-3'>
              <div className='flex-1 space-y-2'>
                <Label>培训者</Label>
                <Select
                  value={form.trainerId ? String(form.trainerId) : 'none'}
                  onValueChange={(v) => setForm({ ...form, trainerId: v === 'none' ? null : Number(v) })}
                >
                  <SelectTrigger><SelectValue placeholder='不指定' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>不指定</SelectItem>
                    {(users ?? []).map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.full_name || u.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex-1 space-y-2'>
                <Label>受训者</Label>
                <Select
                  value={form.traineeId ? String(form.traineeId) : 'none'}
                  onValueChange={(v) => setForm({ ...form, traineeId: v === 'none' ? null : Number(v) })}
                >
                  <SelectTrigger><SelectValue placeholder='不指定' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>不指定</SelectItem>
                    {(users ?? []).map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.full_name || u.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='flex gap-3'>
              <div className='flex-1 space-y-2'>
                <Label>培训日期</Label>
                <Input type='date' value={form.trainingDate} onChange={(e) => setForm({ ...form, trainingDate: e.target.value })} />
              </div>
              <div className='flex-1 space-y-2'>
                <Label>时长(分钟)</Label>
                <Input type='number' min={0} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>描述</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className='space-y-2'>
              <Label>结果/改进点</Label>
              <Textarea value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} rows={2} />
            </div>
            <div className='space-y-2'>
              <Label>标签(逗号分隔)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder='如 SPIN, 异议处理' />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <Icons.spinner className='mr-1 size-4 animate-spin' />}
              {editTarget ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className='text-muted-foreground py-2 text-sm'>
            确定删除培训记录「{deleteTarget?.title}」?此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)}>取消</Button>
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
