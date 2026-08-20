'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useTargetTree, useUsers } from '@/features/targets/api';
import type { TargetTreeNode } from '@/features/targets/types';

function periodLabel(year: number, type: string, index: number): string {
  if (type === 'month') return `${year}年${index}月`;
  if (type === 'quarter') return `${year}年Q${index}`;
  if (type === 'week') return `${year}年第${index}周`;
  return `${year}年`;
}

function TargetNode({ node, depth }: { node: TargetTreeNode; depth: number }) {
  const t = node.target;
  return (
    <div className='border-l-2 border-border pl-4' style={{ marginLeft: depth * 16 }}>
      <div className='flex flex-wrap items-center gap-2 py-2'>
        <Badge variant={node.children.length > 0 ? 'default' : 'secondary'}>
          {periodLabel(t.year, t.periodType, t.periodIndex)}
        </Badge>
        <span className='text-sm font-medium'>{t.ownerFullName || `用户#${t.ownerId}`}</span>
        {t.objective && <span className='text-muted-foreground text-xs'>— {t.objective}</span>}
      </div>
      <div className='text-muted-foreground mb-2 text-xs'>
        成交目标 ¥{t.dealAmountTarget.toLocaleString()} · 拜访目标 {t.visitsCountTarget} · 阶段推进 {t.stageAdvancesTarget}
      </div>
      {node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TargetNode key={child.target.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TargetTreePage() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const { data: users } = useUsers();
  const salesOptions = (users ?? []).filter((u) => u.role === 'sales' || u.role === 'manager');

  const { data: tree, isLoading } = useTargetTree({ ownerId, year });

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>目标树</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          OKR + 数字拆解:年度 → 季度 → 月度 → 周度 层级展开
        </p>
      </div>

      <div className='flex flex-wrap gap-3'>
        <div className='w-28 space-y-1'>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='w-40 space-y-1'>
          <Select
            value={ownerId ? String(ownerId) : 'all'}
            onValueChange={(v) => setOwnerId(v === 'all' ? null : Number(v))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
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

      {isLoading ? (
        <p className='text-muted-foreground text-sm'>加载中…</p>
      ) : !tree || tree.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          暂无目标。请先在
          <Link href='/dashboard/targets' className='px-1 text-primary hover:underline'>目标管理</Link>
          创建顶层(年度)目标。
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>{year} 年目标树</CardTitle>
          </CardHeader>
          <CardContent>
            {tree.map((node) => (
              <TargetNode key={node.target.id} node={node} depth={0} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
