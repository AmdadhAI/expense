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

  const leftNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', href: '/transactions', icon: ReceiptText },
  ];

  const rightNavItems = [
    { label: 'Yearly', href: '/review/yearly', icon: Calendar },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-1 py-1.5 grid grid-cols-5 items-center z-40 pb-[calc(0.6rem+env(safe-area-inset-bottom))]"
    >
      {/* Left 2 Items */}
      {leftNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`col-span-1 flex flex-col items-center justify-center py-1 px-0.5 text-center transition-all ${
              isActive ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-[10px] leading-none truncate max-w-full font-medium tracking-tight">
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Center Floating Action Button */}
      <div className="col-span-1 flex items-center justify-center -mt-6 z-50">
        <AddTransactionButton onClick={onAddTransaction} />
      </div>

      {/* Right 2 Items */}
      {rightNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`col-span-1 flex flex-col items-center justify-center py-1 px-0.5 text-center transition-all ${
              isActive ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-[10px] leading-none truncate max-w-full font-medium tracking-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
