import { DesktopSidebar } from './DesktopSidebar';
import { MobileNav } from './MobileNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <DesktopSidebar />
      <main className="flex-1 p-4 md:p-8 mb-20 md:mb-0 max-w-5xl mx-auto w-full">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
