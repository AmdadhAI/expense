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
    <aside aria-label="Desktop sidebar navigation" className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Budget Tracker
        </h1>
        <p className="text-xs text-slate-500">2026 Edition</p>
      </div>

      <div className="mb-6">
        <button
          type="button"
          onClick={onAddTransaction}
          className="w-full flex items-center justify-center gap-2 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      <nav aria-label="Sidebar navigation links" className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
        BDT · Asia/Dhaka
      </div>
    </aside>
  );
}
