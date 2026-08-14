'use client';

import { useState, useEffect } from 'react';
import { X, Check, HandCoins, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { DebtType, DebtDTO } from '@/types/debt.types';
import { parseDecimalToPoisha } from '@/lib/money';

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: DebtDTO | null;
  createAction: (data: {
    type: DebtType;
    person_name: string;
    amount_decimal: string;
    due_date?: string | null;
    notes?: string | null;
  }) => Promise<unknown>;
  updateAction?: (data: {
    id: string;
    type?: DebtType;
    person_name?: string;
    amount_decimal?: string;
    due_date?: string | null;
    notes?: string | null;
  }) => Promise<unknown>;
}

export function DebtFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  createAction,
  updateAction,
}: DebtFormModalProps) {
  const [type, setType] = useState<DebtType>('lent');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setPersonName(initialData.person_name);
        setAmount(initialData.total_amount_decimal);
        setDueDate(initialData.due_date || '');
        setNotes(initialData.notes || '');
      } else {
        setType('lent');
        setPersonName('');
        setAmount('');
        setDueDate('');
        setNotes('');
      }
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!personName.trim()) {
      setErrorMsg('Please enter a person or entity name.');
      return;
    }

    try {
      parseDecimalToPoisha(amount);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialData?.id && updateAction) {
        await updateAction({
          id: initialData.id,
          type,
          person_name: personName.trim(),
          amount_decimal: amount.trim(),
          due_date: dueDate ? dueDate : null,
          notes: notes.trim() ? notes.trim() : null,
        });
      } else {
        await createAction({
          type,
          person_name: personName.trim(),
          amount_decimal: amount.trim(),
          due_date: dueDate ? dueDate : null,
          notes: notes.trim() ? notes.trim() : null,
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save record');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/80 p-0 md:p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl md:rounded-2xl shadow-2xl border border-slate-800 max-h-[92vh] flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-200">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {initialData?.id ? 'Edit Loan Record' : 'Record Loan / Debt'}
              </h2>
              <p className="text-[11px] text-slate-400">Track money lent or borrowed</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 pb-12 sm:pb-8">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Direction
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setType('lent')}
                className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  type === 'lent'
                    ? 'bg-emerald-600 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>I Lent (They owe me)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('borrowed')}
                className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  type === 'borrowed'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                <span>I Borrowed (I owe them)</span>
              </button>
            </div>
          </div>

          {/* Person / Entity Name */}
          <div>
            <label htmlFor="person_name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Person / Entity Name
            </label>
            <input
              id="person_name"
              type="text"
              required
              placeholder="e.g. Rahim, Abir, Bank, Brother..."
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-100 bg-slate-950 placeholder:text-slate-600"
            />
          </div>

          {/* Total Amount */}
          <div>
            <label htmlFor="amount" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Total Amount (BDT ৳)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-emerald-400 font-bold text-base pointer-events-none select-none">৳</span>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full !pl-10 pr-4 py-3 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-lg font-bold text-slate-100 bg-slate-950 placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Due Date (Optional) */}
          <div>
            <label htmlFor="due_date" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Target Due Date <span className="text-slate-500 text-[10px] font-normal">(Optional)</span>
            </label>
            <input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold text-slate-100 bg-slate-950 cursor-pointer"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label htmlFor="notes" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Notes / Purpose <span className="text-slate-500 text-[10px] font-normal">(Optional)</span>
            </label>
            <textarea
              id="notes"
              rows={2}
              placeholder="e.g. Tuition fee, laptop purchase loan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-100 bg-slate-950 placeholder:text-slate-600"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3 pb-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-emerald-600 text-slate-950 font-bold text-sm hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(16,185,129,0.3)] cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  {initialData?.id ? 'Update Record' : 'Save Record'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
