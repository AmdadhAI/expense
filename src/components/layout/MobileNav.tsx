'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, Calendar, Settings } from 'lucide-react';
import { AddTransactionButton } from '@/components/ui/AddTransactionButton';

interface MobileNavProps {
  onAddTransaction?: () => void;
}

export function MobileNav({ onAddTransaction }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', href: '/transactions', icon: ReceiptText },
    { label: 'Yearly', href: '/review/yearly', icon: Calendar },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between z-40">
      {navItems.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-1 px-2 text-xs font-medium transition-colors ${
              isActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            {item.label}
          </Link>
        );
      })}

      <div className="-mt-5">
        <AddTransactionButton onClick={onAddTransaction} />
      </div>

      {navItems.slice(2).map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-1 px-2 text-xs font-medium transition-colors ${
              isActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
