'use client';

import { Plus } from 'lucide-react';

export function AddTransactionButton() {
  return (
    <button
      disabled
      aria-disabled="true"
      title="Add Transaction (Phase 2)"
      className="inline-flex items-center justify-center p-3 rounded-full bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 shadow-none border border-slate-300"
    >
      <Plus className="w-5 h-5" />
      <span className="sr-only">Add Transaction (Phase 2)</span>
    </button>
  );
}
