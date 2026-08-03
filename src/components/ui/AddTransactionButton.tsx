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
      className="inline-flex items-center justify-center p-3 rounded-full bg-slate-900 text-white cursor-pointer hover:bg-slate-800 transition-colors shadow-md border border-slate-900"
    >
      <Plus className="w-5 h-5" />
      <span className="sr-only">Add Transaction</span>
    </button>
  );
}
