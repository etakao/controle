import { GroupNav } from '@/components/layout/GroupNav';

export default function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { groupId: string };
}) {
  return (
    <div className='grid gap-5'>
      <GroupNav groupId={params.groupId} />
      <div className='min-w-0 p-4'>{children}</div>
    </div>
  );
}

