'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { TransactionKind, TransactionBucket } from '@/types/database.types';
import { parseDecimalToPoisha } from '@/lib/money';

export interface CategoryOption {
  id: string;
  name: string;
  kind: TransactionKind;
  default_bucket: TransactionBucket;
}

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id?: string;
    kind: TransactionKind;
    amount_decimal: string;
    description: string;
    transaction_date: string;
    category_id: string;
    note?: string | null;
  } | null;
  categories: CategoryOption[];
  createAction: (data: {
    kind: TransactionKind;
    amount_decimal: string;
    description: string;
    transaction_date: string;
    category_id: string;
    note?: string | null;
    request_id?: string | null;
  }) => Promise<unknown>;
  updateAction?: (data: {
    id: string;
    amount_decimal?: string;
    description?: string;
    transaction_date?: string;
    category_id?: string;
    note?: string | null;
  }) => Promise<unknown>;
}

export function TransactionFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  categories,
  createAction,
  updateAction,
}: TransactionFormModalProps) {
  const [kind, setKind] = useState<TransactionKind>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setKind(initialData.kind);
        setAmount(initialData.amount_decimal);
        setDescription(initialData.description);
        setCategoryId(initialData.category_id);
        setTransactionDate(initialData.transaction_date);
        setNote(initialData.note || '');
        setShowNote(Boolean(initialData.note));
      } else {
        setKind('expense');
        setAmount('');
        setDescription('');
        setTransactionDate(new Date().toISOString().split('T')[0]);
        setNote('');
        setShowNote(false);
        const defaultCat = categories.find((c) => c.kind === 'expense');
        setCategoryId(defaultCat ? defaultCat.id : '');
      }
      setErrorMsg(null);
      setIsSubmitting(false);
      setRequestId(crypto.randomUUID());
    }
  }, [isOpen, initialData, categories]);

  const availableCategories = categories.filter((c) => c.kind === kind);

  const handleKindChange = (newKind: TransactionKind) => {
    setKind(newKind);
    const firstCat = categories.find((c) => c.kind === newKind);
    setCategoryId(firstCat ? firstCat.id : '');
  };

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    try {
      parseDecimalToPoisha(amount);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
      return;
    }

    if (!categoryId) {
      setErrorMsg('Please select a valid category');
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialData?.id && updateAction) {
        await updateAction({
          id: initialData.id,
          amount_decimal: amount,
          description,
          transaction_date: transactionDate,
          category_id: categoryId,
          note: note || null,
        });
      } else {
        await createAction({
          kind,
          amount_decimal: amount,
          description,
          transaction_date: transactionDate,
          category_id: categoryId,
          note: note || null,
          request_id: requestId,
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save transaction');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/60 p-0 md:p-4 backdrop-blur-xs">
      {/* Background Backdrop Dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Surface */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-200">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-20">
          <h2 className="text-lg font-bold text-slate-900">
            {initialData?.id ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 pb-12 sm:pb-8">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs font-semibold text-rose-600">
              {errorMsg}
            </div>
          )}

          {/* Kind Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(['expense', 'saving', 'income'] as TransactionKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKindChange(k)}
                  className={`py-2.5 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                    kind === k
                      ? k === 'income'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : k === 'saving'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Amount (BDT ৳)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-700 font-bold text-base select-none">৳</span>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-lg font-bold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label htmlFor="category" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              id="category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-semibold text-slate-900 bg-white cursor-pointer"
            >
              {availableCategories.length === 0 && (
                <option value="">No categories available</option>
              )}
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.default_bucket ? `(${c.default_bucket})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              id="description"
              type="text"
              required
              placeholder="e.g. Monthly Grocery"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="transaction_date" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Date (Asia/Dhaka)
            </label>
            <input
              id="transaction_date"
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white cursor-pointer"
            />
          </div>

          {/* Optional Note */}
          <div>
            {!showNote ? (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 py-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add optional note
              </button>
            ) : (
              <div>
                <label htmlFor="note" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Note
                </label>
                <textarea
                  id="note"
                  rows={2}
                  placeholder="Additional transaction details..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm text-slate-900 bg-white"
                />
              </div>
            )}
          </div>

          {/* Submit Button Container */}
          <div className="pt-3 pb-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {initialData?.id ? 'Update Transaction' : 'Save Transaction'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
