'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Check, ChevronDown, Tag } from 'lucide-react';
import { TransactionKind, TransactionBucket } from '@/types/database.types';
import { parseDecimalToPoisha } from '@/lib/money';
import { createCategory } from '@/lib/services/categories';

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

  // Custom Category selector dropdown state
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  // Inline Category creation state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBucket, setNewCatBucket] = useState<'needs' | 'wants'>('needs');
  const [localCategories, setLocalCategories] = useState<CategoryOption[]>(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

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
        const defaultCat = localCategories.find((c) => c.kind === 'expense');
        setCategoryId(defaultCat ? defaultCat.id : '');
      }
      setIsCategoryPickerOpen(false);
      setIsCreatingCategory(false);
      setNewCatName('');
      setErrorMsg(null);
      setIsSubmitting(false);
      setRequestId(crypto.randomUUID());
    }
  }, [isOpen, initialData, localCategories]);

  const availableCategories = localCategories.filter((c) => c.kind === kind);
  const selectedCategoryObj = localCategories.find((c) => c.id === categoryId);

  const handleKindChange = (newKind: TransactionKind) => {
    setKind(newKind);
    const firstCat = localCategories.find((c) => c.kind === newKind);
    setCategoryId(firstCat ? firstCat.id : '');
    setIsCategoryPickerOpen(false);
    setIsCreatingCategory(false);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setErrorMsg(null);
    try {
      const created = await createCategory({
        name: newCatName.trim(),
        kind,
        default_bucket: kind === 'expense' ? newCatBucket : kind === 'saving' ? 'savings' : null,
      });
      const newOpt: CategoryOption = {
        id: created.id,
        name: created.name,
        kind: created.kind,
        default_bucket: created.default_bucket,
      };
      setLocalCategories((prev) => [...prev, newOpt]);
      setCategoryId(created.id);
      setIsCreatingCategory(false);
      setIsCategoryPickerOpen(false);
      setNewCatName('');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to create category');
    }
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
      setErrorMsg('Please select or add a category');
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/80 p-0 md:p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl md:rounded-2xl shadow-2xl border border-slate-800 max-h-[92vh] flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-200">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
          <h2 className="text-lg font-bold text-slate-100">
            {initialData?.id ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4.5 overflow-y-auto flex-1 pb-12 sm:pb-8">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Kind Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
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
                        ? 'bg-emerald-600 text-slate-950 shadow-sm'
                        : 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input with Fixed Padding */}
          <div>
            <label htmlFor="amount" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Amount (BDT ৳)
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
                className="w-full !pl-10 pr-4 py-3 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-lg font-bold text-slate-100 bg-slate-950"
              />
            </div>
          </div>

          {/* Custom Touch-Friendly Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Category
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCategory(!isCreatingCategory);
                  setIsCategoryPickerOpen(false);
                }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isCreatingCategory ? 'Cancel' : 'New Category'}
              </button>
            </div>

            {isCreatingCategory ? (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Dining)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-800 text-xs font-semibold bg-slate-900 text-slate-100"
                />
                {kind === 'expense' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Bucket:</span>
                    <button
                      type="button"
                      onClick={() => setNewCatBucket('needs')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                        newCatBucket === 'needs' ? 'bg-emerald-600 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Needs
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCatBucket('wants')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                        newCatBucket === 'wants' ? 'bg-emerald-600 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Wants
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="w-full py-2.5 bg-emerald-600 text-slate-950 rounded-lg text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                >
                  Create & Select Category
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between text-left hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-100">
                      {selectedCategoryObj
                        ? `${selectedCategoryObj.name} ${selectedCategoryObj.default_bucket ? `(${selectedCategoryObj.default_bucket})` : ''}`
                        : 'Select Category'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCategoryPickerOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Custom Category Selection Chips */}
                {isCategoryPickerOpen && (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                    {availableCategories.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">No categories available for {kind}.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5">
                        {availableCategories.map((c) => {
                          const isSelected = c.id === categoryId;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setCategoryId(c.id);
                                setIsCategoryPickerOpen(false);
                              }}
                              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800/60'
                              }`}
                            >
                              <span>
                                {c.name} {c.default_bucket ? `(${c.default_bucket})` : ''}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              id="description"
              type="text"
              required
              placeholder="e.g. Monthly Grocery"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-100 bg-slate-950"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="transaction_date" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Date (Asia/Dhaka)
            </label>
            <input
              id="transaction_date"
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-100 bg-slate-950 cursor-pointer"
            />
          </div>

          {/* Optional Note */}
          <div>
            {!showNote ? (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 py-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add optional note
              </button>
            ) : (
              <div>
                <label htmlFor="note" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Note
                </label>
                <textarea
                  id="note"
                  rows={2}
                  placeholder="Additional transaction details..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-100 bg-slate-950"
                />
              </div>
            )}
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
