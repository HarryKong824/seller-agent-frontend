'use client';

import { useCallback, useEffect, useState } from 'react';

import { useCustomers } from '@/features/customer/api';
import {
  useCreateVisit,
  useVisits,
  type VisitCheckin
} from '@/features/visit/api';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';

const VISIT_ACTIONS = ['初次拜访', '方案演示', '商务谈判', '回访', '签约', '其他'];

function formatDateTime(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString('zh-CN', { hour12: false });
}

type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied';

export default function VisitsPage() {
  const { data: visitsData, isLoading, isError, refetch } = useVisits();
  const { data: customersData } = useCustomers(1, 100);
  const createVisit = useCreateVisit();

  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [visitTarget, setVisitTarget] = useState('');
  const [action, setAction] = useState<string>(VISIT_ACTIONS[0]);
  const [note, setNote] = useState('');

  const customers = customersData?.items ?? [];

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('denied');
      toast.warning('当前环境不支持定位，请手动填写坐标');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAccuracy(pos.coords.accuracy ?? null);
        setGeoStatus('granted');
      },
      () => {
        setGeoStatus('denied');
        toast.warning('定位被拒绝，可手动填写经纬度');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const hasCoords = lat !== null && lng !== null;

  const handleSubmit = async () => {
    if (!visitTarget.trim()) {
      toast.error('请填写拜访对象');
      return;
    }
    if (!hasCoords) {
      toast.error(geoStatus === 'denied' ? '请手动填写经纬度' : '定位获取中，请稍候');
      return;
    }
    try {
      await createVisit.mutateAsync({
        customer_id: customerId,
        visit_target: visitTarget.trim(),
        action,
        check_in_type: 'arrive',
        location_lat: lat as number,
        location_lng: lng as number,
        location_accuracy: accuracy,
        note: note.trim() || null
      });
      toast.success('拜访打卡成功');
      setVisitTarget('');
      setCustomerId(null);
      setNote('');
      void refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '打卡失败');
    }
  };

  const items: VisitCheckin[] = visitsData?.items ?? [];

  return (
    <div className='flex flex-1 flex-col space-y-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>拜访打卡</h2>
        <p className='text-muted-foreground mt-1 text-sm'>
          外出拜访时定位打卡，记录拜访对象、动作与位置
        </p>
      </div>

      {/* 打卡表单 */}
      <Card>
        <CardHeader>
          <CardTitle>新建打卡</CardTitle>
          <CardDescription>
            自动获取当前位置；若拒绝定位可手动填写经纬度
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* 位置状态 */}
          <div className='space-y-2'>
            <Label>定位</Label>
            {geoStatus === 'granted' ? (
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                <Icons.mapPin className='size-4 text-green-600' />
                <span>
                  已定位：{lat?.toFixed(6)}, {lng?.toFixed(6)}（精度{' '}
                  {accuracy ? `${Math.round(accuracy)}m` : '未知'}）
                </span>
              </div>
            ) : geoStatus === 'denied' ? (
              <div className='space-y-2'>
                <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <Icons.mapPin className='size-4' />
                  <span>定位不可用，请手动填写：</span>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <Input
                    type='number'
                    step='any'
                    placeholder='纬度 latitude'
                    value={lat ?? ''}
                    onChange={(e) =>
                      setLat(e.target.value === '' ? null : Number(e.target.value))
                    }
                  />
                  <Input
                    type='number'
                    step='any'
                    placeholder='经度 longitude'
                    value={lng ?? ''}
                    onChange={(e) =>
                      setLng(e.target.value === '' ? null : Number(e.target.value))
                    }
                  />
                </div>
              </div>
            ) : (
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                <Icons.spinner className='size-4 animate-spin' />
                <span>正在获取定位…</span>
              </div>
            )}
            {geoStatus === 'granted' && (
              <Button variant='ghost' size='sm' onClick={requestLocation}>
                <Icons.mapPin className='mr-1 size-4' /> 重新定位
              </Button>
            )}
          </div>

          {/* 关联客户 */}
          <div className='space-y-2'>
            <Label>关联客户（可选）</Label>
            <Select
              value={customerId ? String(customerId) : 'none'}
              onValueChange={(v) => setCustomerId(v === 'none' ? null : Number(v))}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='不关联具体客户' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>不关联具体客户</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 拜访对象 */}
          <div className='space-y-2'>
            <Label htmlFor='visit-target'>拜访对象</Label>
            <Input
              id='visit-target'
              maxLength={200}
              value={visitTarget}
              onChange={(e) => setVisitTarget(e.target.value)}
              placeholder='如：采购部王经理 / 公司前台'
            />
          </div>

          {/* 动作 */}
          <div className='space-y-2'>
            <Label>拜访动作</Label>
            <Select value={action} onValueChange={(v) => setAction(v as string)}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIT_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 备注 */}
          <div className='space-y-2'>
            <Label htmlFor='visit-note'>备注（可选）</Label>
            <textarea
              id='visit-note'
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='补充本次拜访的背景、进展或下一步计划'
              rows={3}
              className='flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
            />
          </div>

          <Button onClick={handleSubmit} disabled={createVisit.isPending}>
            {createVisit.isPending && (
              <Icons.spinner className='mr-1 size-4 animate-spin' />
            )}
            <Icons.mapPin className='mr-1 size-4' />
            提交打卡
          </Button>
        </CardContent>
      </Card>

      {/* 历史列表 */}
      <Card>
        <CardHeader>
          <CardTitle>拜访记录</CardTitle>
          <CardDescription>
            按时间倒序，销售查看自己的打卡，管理员查看全部
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex h-48 items-center justify-center'>
              <Icons.spinner className='text-muted-foreground size-6 animate-spin' />
            </div>
          ) : isError ? (
            <div className='text-muted-foreground flex h-48 items-center justify-center'>
              拜访记录加载失败
            </div>
          ) : items.length === 0 ? (
            <div className='text-muted-foreground flex h-48 flex-col items-center justify-center gap-2'>
              <Icons.mapPin className='size-8' />
              <p>暂无拜访记录，完成首次打卡吧</p>
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>拜访对象</TableHead>
                    <TableHead>动作</TableHead>
                    <TableHead>关联客户</TableHead>
                    <TableHead>位置</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className='whitespace-nowrap text-sm'>
                        {formatDateTime(v.created_at)}
                      </TableCell>
                      <TableCell className='font-medium'>{v.visit_target}</TableCell>
                      <TableCell>
                        <Badge variant='secondary'>{v.action}</Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {v.customer_id ? (
                          <a
                            href={`/dashboard/customers/${v.customer_id}`}
                            className='text-blue-600 hover:underline'
                          >
                            #{v.customer_id}
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className='text-muted-foreground whitespace-nowrap text-xs'>
                        {v.location_lat.toFixed(4)}, {v.location_lng.toFixed(4)}
                      </TableCell>
                      <TableCell
                        className='text-muted-foreground max-w-[200px] truncate'
                        title={v.note ?? ''}
                      >
                        {v.note ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
