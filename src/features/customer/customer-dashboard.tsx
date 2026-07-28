'use client';

import { format } from 'date-fns';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useCustomers, useCustomerStats } from './api';
import { GRADE_LABELS, STATUS_LABELS, type Customer } from './types';

const gradeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  A: 'default',
  B: 'secondary',
  C: 'outline'
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  prospect: 'secondary',
  dormant: 'outline',
  churned: 'destructive'
};

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'name',
    header: '客户名称'
  },
  {
    accessorKey: 'industry',
    header: '行业'
  },
  {
    accessorKey: 'grade',
    header: '分级',
    cell: ({ row }) => {
      const grade = row.original.grade;
      return <Badge variant={gradeVariant[grade] ?? 'outline'}>{grade}</Badge>;
    }
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={statusVariant[status] ?? 'outline'}>
          {STATUS_LABELS[status] ?? status}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'ownerSales',
    header: '负责销售'
  },
  {
    accessorKey: 'lastFollowUpAt',
    header: '最近跟进',
    cell: ({ row }) => {
      const date = row.original.lastFollowUpAt;
      if (!date) return <span className='text-muted-foreground'>未跟进</span>;
      return format(new Date(date), 'yyyy-MM-dd');
    }
  }
];

function StatsCards() {
  const { data, isLoading, isError } = useCustomerStats();

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader>
              <div className='bg-muted h-4 w-24 rounded' />
              <div className='bg-muted h-8 w-16 rounded' />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>统计数据加载失败</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const gradeMap = Object.fromEntries(data.gradeDistribution.map((g) => [g.grade, g.count]));

  const cards = [
    {
      label: '客户总量',
      value: data.totalCustomers,
      icon: Icons.teams,
      hint: '全部客户'
    },
    {
      label: GRADE_LABELS.A,
      value: gradeMap.A ?? 0,
      icon: Icons.trendingUp,
      hint: '高价值客户'
    },
    {
      label: GRADE_LABELS.B,
      value: gradeMap.B ?? 0,
      icon: Icons.adjustments,
      hint: '中等价值客户'
    },
    {
      label: '流失预警',
      value: data.churnWarningCount,
      icon: Icons.warning,
      hint: '超30天未跟进'
    }
  ];

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader>
            <CardDescription>{c.label}</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums'>{c.value}</CardTitle>
            <CardAction>
              <c.icon className='text-muted-foreground size-5' />
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function CustomerTable() {
  const { data, isLoading, isError } = useCustomers(1, 20);

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  if (isLoading) {
    return (
      <div className='flex h-48 items-center justify-center'>
        <Icons.spinner className='text-muted-foreground size-6 animate-spin' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-48 items-center justify-center text-muted-foreground'>
        客户列表加载失败
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='text-muted-foreground h-24 text-center'>
                  暂无客户数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {data && (
        <div className='text-muted-foreground flex items-center justify-between text-sm'>
          <span>
            共 {data.total} 条，第 {data.page} 页
          </span>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' disabled={data.page <= 1}>
              上一页
            </Button>
            <Button variant='outline' size='sm' disabled>
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomerDashboard() {
  return (
    <div className='flex flex-1 flex-col space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold tracking-tight'>客户资产看板</h2>
      </div>
      <StatsCards />
      <Card>
        <CardHeader>
          <CardTitle>客户列表</CardTitle>
          <CardDescription>所有客户的基础信息与跟进状态</CardDescription>
        </CardHeader>
        <div className='px-6 pb-6'>
          <CustomerTable />
        </div>
      </Card>
    </div>
  );
}
