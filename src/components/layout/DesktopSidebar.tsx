'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, Calendar, Settings, Plus } from 'lucide-react';

interface DesktopSidebarProps {
  onAddTransaction?: () => void;
}

export function DesktopSidebar({ onAddTransaction }: DesktopSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', href: '/transactions', icon: ReceiptText },
    { label: 'Yearly Review', href: '/review/yearly', icon: Calendar },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside aria-label="Desktop sidebar navigation" className="hidden md:flex flex-col w-64 bg-slate-900/90 backdrop-blur-md border-r border-slate-800/80 min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          Budget Tracker
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">2026 Edition · PWA</p>
      </div>

      <div className="mb-6">
        <button
          type="button"
          onClick={onAddTransaction}
          className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:shadow-[0_0_16px_rgba(16,185,129,0.4)] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Transaction</span>
        </button>
      </div>

      <nav aria-label="Sidebar navigation links" className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800/80 text-[11px] font-medium text-slate-500 flex items-center justify-between">
        <span>BDT (৳)</span>
        <span>Asia/Dhaka</span>
      </div>
    </aside>
  );
}
