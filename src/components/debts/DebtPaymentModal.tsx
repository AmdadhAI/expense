'use client';

import { useState, useEffect } from 'react';
import { X, Check, Trash2, Calendar, Coins, History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { DebtDTO, DebtPaymentDTO } from '@/types/debt.types';
import { parseDecimalToPoisha } from '@/lib/money';

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  debt: DebtDTO | null;
  recordPaymentAction: (data: {
    debt_id: string;
    amount_decimal: string;
    payment_date: string;
    notes?: string | null;
  }) => Promise<DebtPaymentDTO>;
  deletePaymentAction: (paymentId: string) => Promise<void>;
}

export function DebtPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  debt,
  recordPaymentAction,
  deletePaymentAction,
}: DebtPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && debt) {
      setAmount(debt.remaining_amount_decimal !== '0.00' ? debt.remaining_amount_decimal : '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setErrorMsg(null);
      setIsSubmitting(false);
      setDeletingPaymentId(null);
    }
  }, [isOpen, debt]);

  if (!isOpen || !debt) return null;

  const isLent = debt.type === 'lent';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!debt) return;
    setErrorMsg(null);

    try {
      parseDecimalToPoisha(amount);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
      return;
    }

    setIsSubmitting(true);

    try {
      await recordPaymentAction({
        debt_id: debt.id,
        amount_decimal: amount.trim(),
        payment_date: paymentDate,
        notes: notes.trim() ? notes.trim() : null,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to record payment');
      setIsSubmitting(false);
    }
  }

  async function handleDeletePayment(paymentId: string) {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    setDeletingPaymentId(paymentId);
    try {
      await deletePaymentAction(paymentId);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete payment');
      setDeletingPaymentId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/80 p-0 md:p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl md:rounded-2xl shadow-2xl border border-slate-800 max-h-[92vh] flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-200">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isLent ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {isLent ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isLent ? 'Receive Payment' : 'Make Repayment'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isLent ? `${debt.person_name} paying you back` : `Paying back ${debt.person_name}`}
              </p>
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

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 pb-12 sm:pb-8">
          {/* Balance Overview Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Total Amount:</span>
              <span className="text-slate-200 font-bold">{debt.total_amount_bdt}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Already Repaid:</span>
              <span className="text-emerald-400 font-bold">{debt.repaid_amount_bdt} ({debt.repaid_percent}%)</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Remaining Balance:</span>
              <span className="text-base font-bold text-sky-400">{debt.remaining_amount_bdt}</span>
            </div>
          </div>

          {/* New Payment Form */}
          {debt.status !== 'settled' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-400" />
                Record New Payment
              </h3>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400">
                  {errorMsg}
                </div>
              )}

              {/* Amount Input with Full Balance quick button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="payment-amount" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Payment Amount (BDT ৳)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(debt.remaining_amount_decimal)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    Full Balance ({debt.remaining_amount_bdt})
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-emerald-400 font-bold text-base pointer-events-none select-none">৳</span>
                  <input
                    id="payment-amount"
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full !pl-10 pr-4 py-3 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base font-bold text-slate-100 bg-slate-950"
                  />
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label htmlFor="payment-date" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Payment Date
                </label>
                <input
                  id="payment-date"
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold text-slate-100 bg-slate-950 cursor-pointer"
                />
              </div>

              {/* Note (Optional) */}
              <div>
                <label htmlFor="payment-note" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Note <span className="text-slate-500 text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  id="payment-note"
                  type="text"
                  placeholder="e.g. Cash payment, Bkash transfer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-100 bg-slate-950 placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 text-slate-950 font-bold text-sm hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(16,185,129,0.3)] cursor-pointer active:scale-[0.99]"
              >
                {isSubmitting ? (
                  'Recording...'
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    Record Payment
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
              <p className="text-xs font-bold text-emerald-400">This loan is fully settled!</p>
              <p className="text-[11px] text-slate-400">Zero remaining balance.</p>
            </div>
          )}

          {/* Payment History Section */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-sky-400" />
              Repayment History ({debt.payments.length})
            </h3>

            {debt.payments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">No repayments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {debt.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">{p.amount_bdt}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {p.payment_date}
                        </span>
                      </div>
                      {p.notes && <p className="text-[11px] text-slate-400 italic">"{p.notes}"</p>}
                    </div>

                    <button
                      type="button"
                      disabled={deletingPaymentId === p.id}
                      onClick={() => handleDeletePayment(p.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Payment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
