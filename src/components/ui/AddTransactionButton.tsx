'use client';

import { Plus } from 'lucide-react';

interface AddTransactionButtonProps {
  onClick?: () => void;
}

export function AddTransactionButton({ onClick }: AddTransactionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Add Transaction"
      title="Add Transaction"
      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-slate-950 cursor-pointer hover:bg-emerald-400 transition-all shadow-[0_0_18px_rgba(16,185,129,0.4)] border-4 border-slate-950 active:scale-95 shrink-0"
    >
      <Plus className="w-6 h-6 stroke-[3]" />
      <span className="sr-only">Add Transaction</span>
    </button>
  );
}
