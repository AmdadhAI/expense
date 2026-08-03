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
      className="inline-flex items-center justify-center p-3.5 rounded-full bg-emerald-600 text-slate-950 cursor-pointer hover:bg-emerald-500 transition-all shadow-[0_0_16px_rgba(16,185,129,0.35)] border border-emerald-400/40 active:scale-95"
    >
      <Plus className="w-5 h-5 stroke-[3]" />
      <span className="sr-only">Add Transaction</span>
    </button>
  );
}
