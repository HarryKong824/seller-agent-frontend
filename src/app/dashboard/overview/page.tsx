'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerDashboard } from '@/features/customer/customer-dashboard';
import { PipelineOverview } from '@/features/overview/components/pipeline-overview';

export default function OverViewPage() {
  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-2xl font-bold tracking-tight'>仪表盘</h2>
      </div>
      <Tabs defaultValue='pipeline' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='pipeline'>Pipeline 仪表盘</TabsTrigger>
          <TabsTrigger value='customers'>客户管理</TabsTrigger>
        </TabsList>
        <TabsContent value='pipeline' className='space-y-4'>
          <PipelineOverview />
        </TabsContent>
        <TabsContent value='customers' className='space-y-4'>
          <CustomerDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
