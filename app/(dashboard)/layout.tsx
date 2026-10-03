import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebarProvider } from '@/components/layout/MobileSidebarContext';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileSidebarProvider>
      <div className='min-h-screen'>
        <Navbar />
        <div className='relative mx-auto flex max-w-full lg:max-w-7xl gap-6 overflow-x-clip'>
          <Sidebar />
          <main className='min-w-0 flex-1'>{children}</main>
        </div>
      </div>
    </MobileSidebarProvider>
  );
}

