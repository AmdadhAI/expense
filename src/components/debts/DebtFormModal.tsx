'use client';

import { useState, useEffect } from 'react';
import { X, Check, HandCoins, ArrowDownLeft, ArrowUpRight, Plus, UserCheck, ArrowRightLeft, CornerDownLeft } from 'lucide-react';
import type { DebtEntryType } from '@/types/debt.types';
import { parseDecimalToPoisha } from '@/lib/money';

interface ContactOption {
  id: string;
  name: string;
}

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contacts: ContactOption[];
  preselectedContactId?: string | null;
  defaultEntryType?: DebtEntryType;
  createAction: (data: {
    contact_id?: string | null;
    person_name?: string | null;
    entry_type: DebtEntryType;
    amount_decimal: string;
    entry_date: string;
    due_date?: string | null;
    notes?: string | null;
  }) => Promise<unknown>;
}

export function DebtFormModal({
  isOpen,
  onClose,
  onSuccess,
  contacts,
  preselectedContactId,
  defaultEntryType,
  createAction,
}: DebtFormModalProps) {
  const [isNewContact, setIsNewContact] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [personName, setPersonName] = useState('');
  const [entryType, setEntryType] = useState<DebtEntryType>('gave');
  const [amount, setAmount] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setEntryDate(today);
      setDueDate('');
      setAmount('');
      setNotes('');
      setErrorMsg(null);
      setIsSubmitting(false);

      if (defaultEntryType) {
        setEntryType(defaultEntryType);
      } else {
        setEntryType('gave');
      }

      if (preselectedContactId) {
        setSelectedContactId(preselectedContactId);
        setIsNewContact(false);
        setPersonName('');
      } else if (contacts.length > 0) {
        setSelectedContactId(contacts[0].id);
        setIsNewContact(false);
        setPersonName('');
      } else {
        setIsNewContact(true);
        setSelectedContactId('');
        setPersonName('');
      }
    }
  }, [isOpen, preselectedContactId, defaultEntryType, contacts]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (isNewContact && !personName.trim()) {
      setErrorMsg('Please enter a person name (কার সাথে হিসাব).');
      return;
    }

    if (!isNewContact && !selectedContactId) {
      setErrorMsg('Please select a person from the list.');
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
      await createAction({
        contact_id: isNewContact ? null : selectedContactId,
        person_name: isNewContact ? personName.trim() : null,
        entry_type: entryType,
        amount_decimal: amount.trim(),
        entry_date: entryDate,
        due_date: dueDate ? dueDate : null,
        notes: notes.trim() ? notes.trim() : null,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save entry');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/80 p-0 md:p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl md:rounded-2xl shadow-2xl border border-slate-800 max-h-[92vh] flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                নতুন লেনদেন যুক্ত করুন (Add Entry)
              </h2>
              <p className="text-[11px] text-slate-400">দেনা - পাওনার হিসাব ও খতিয়ান</p>
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

          {/* Person / Contact Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ব্যক্তি / প্রতিষ্ঠান (Person)
              </label>
              {contacts.length > 0 && !preselectedContactId && (
                <button
                  type="button"
                  onClick={() => {
                    setIsNewContact(!isNewContact);
                    setErrorMsg(null);
                  }}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  {isNewContact ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>তালিকা থেকে বেছে নিন</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>নতুন নাম লিখুন</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {isNewContact || contacts.length === 0 ? (
              <input
                id="person_name"
                type="text"
                required
                placeholder="যেমন: রহিম, আবির, ভাই, দোকান..."
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-100 bg-slate-950 placeholder:text-slate-600"
              />
            ) : (
              <select
                id="contact_select"
                value={selectedContactId}
                disabled={!!preselectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-100 bg-slate-950 cursor-pointer disabled:opacity-75"
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 4-Way Action Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              লেনদেনের ধরণ (Transaction Type)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Gave Money (Paona) */}
              <button
                type="button"
                onClick={() => setEntryType('gave')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  entryType === 'gave'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">পাওনা (টাকা দিয়েছি)</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-[10px] text-slate-500">He owes you</span>
              </button>

              {/* Received Payment (Paona deduction) */}
              <button
                type="button"
                onClick={() => setEntryType('received')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  entryType === 'received'
                    ? 'bg-teal-500/15 border-teal-500 text-teal-400 shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">টাকা ফেরত পেলাম</span>
                  <CornerDownLeft className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-[10px] text-slate-500">Paona repaid</span>
              </button>

              {/* Took Money (Dena) */}
              <button
                type="button"
                onClick={() => setEntryType('took')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  entryType === 'took'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-400 shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">দেনা (টাকা নিয়েছি)</span>
                  <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-[10px] text-slate-500">You owe them</span>
              </button>

              {/* Made Repayment (Dena deduction) */}
              <button
                type="button"
                onClick={() => setEntryType('paid')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  entryType === 'paid'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">দেনা পরিশোধ করলাম</span>
                  <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-[10px] text-slate-500">Dena repaid</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              টাকার পরিমাণ (Amount BDT ৳)
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

          {/* Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Entry Date */}
            <div>
              <label htmlFor="entry_date" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                তারিখ (Date)
              </label>
              <input
                id="entry_date"
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold text-slate-100 bg-slate-950 cursor-pointer"
              />
            </div>

            {/* Target Due Date (Optional) */}
            <div>
              <label htmlFor="due_date" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                পরিশোধের শেষ তারিখ <span className="text-slate-500 text-[10px] font-normal">(Optional)</span>
              </label>
              <input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold text-slate-100 bg-slate-950 cursor-pointer"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              বিবরণ / নোট (Notes) <span className="text-slate-500 text-[10px] font-normal">(Optional)</span>
            </label>
            <input
              id="notes"
              type="text"
              placeholder="যেমন: বিকাশে ফেরত, টিউশন ফি, জরুরি সাহায্য..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-100 bg-slate-950 placeholder:text-slate-600"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 pb-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-emerald-600 text-slate-950 font-bold text-sm hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(16,185,129,0.3)] cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                'সংরক্ষণ হচ্ছে...'
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  হিসাব সংরক্ষণ করুন (Save Entry)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
