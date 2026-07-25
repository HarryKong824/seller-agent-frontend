import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfileViewPage() {
  return (
    <div className='flex w-full flex-col p-4'>
      <Card>
        <CardHeader>
          <CardTitle>个人资料</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>
            用户资料管理功能开发中。原模板此处使用 Clerk 的 UserProfile 组件，已移除
            Clerk，待替换为自实现的用户资料页面。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
