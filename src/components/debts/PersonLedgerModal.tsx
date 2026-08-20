'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  CornerDownLeft,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import type { DebtContactDTO, DebtEntryDTO, DebtEntryType } from '@/types/debt.types';
import { getContactLedger, deleteDebtEntry, deleteDebtContact } from '@/lib/services/debts';

interface PersonLedgerModalProps {
  contactId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAddEntry: (contactId: string, defaultType?: DebtEntryType) => void;
  onSuccess: () => void;
}

export function PersonLedgerModal({
  contactId,
  isOpen,
  onClose,
  onOpenAddEntry,
  onSuccess,
}: PersonLedgerModalProps) {
  const [contact, setContact] = useState<DebtContactDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  const fetchLedger = useCallback(async () => {
    if (!contactId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getContactLedger(contactId);
      setContact(data);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to load ledger');
    } finally {
      setIsLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    if (isOpen && contactId) {
      fetchLedger();
    } else {
      setContact(null);
    }
  }, [isOpen, contactId, fetchLedger]);

  if (!isOpen || !contactId) return null;

  async function handleDeleteEntry(entryId: string) {
    if (!confirm('Are you sure you want to delete this transaction record?')) return;
    setDeletingEntryId(entryId);
    try {
      await deleteDebtEntry(entryId);
      await fetchLedger();
      onSuccess();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete record');
    } finally {
      setDeletingEntryId(null);
    }
  }

  async function handleDeleteContact() {
    if (!confirm(`Are you sure you want to delete the entire account and all transaction records for "${contact?.name}"?`)) return;
    setIsDeletingContact(true);
    try {
      await deleteDebtContact(contactId!);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete contact');
      setIsDeletingContact(false);
    }
  }

  const entries: DebtEntryDTO[] = contact?.entries || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/80 p-0 md:p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl bg-slate-900 rounded-t-3xl md:rounded-2xl shadow-2xl border border-slate-800 max-h-[92vh] flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
              {contact ? contact.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {contact?.name || 'ব্যক্তির হিসাব'}
                {contact?.status === 'settled' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    সমান হিসাব (৳0)
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">লেনদেনের খতিয়ান ও বিস্তারিত বিবরণ</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDeleteContact}
              disabled={isDeletingContact}
              title="Delete Contact & All Entries"
              className="p-2 text-rose-400 hover:text-rose-300 rounded-full hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 pb-12 sm:pb-8">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400">
              {errorMsg}
            </div>
          )}

          {isLoading && !contact ? (
            <div className="py-12 text-center text-xs text-slate-500">
              হিসাবের খতিয়ান লোড হচ্ছে...
            </div>
          ) : contact ? (
            <>
              {/* Summary Banner */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    বর্তমান মোট বাকি (Net Balance)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                        contact.status === 'paona'
                          ? 'text-emerald-400'
                          : contact.status === 'dena'
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {contact.net_balance_bdt}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        contact.status === 'paona'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : contact.status === 'dena'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {contact.status === 'paona'
                        ? 'পাওনা (They owe you)'
                        : contact.status === 'dena'
                        ? 'দেনা (You owe them)'
                        : 'হিসাব সমান (Settled)'}
                    </span>
                  </div>
                </div>

                {/* Quick Add Entry Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onOpenAddEntry(contact.id, contact.status === 'dena' ? 'paid' : 'received')}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 font-bold text-xs hover:bg-teal-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <HandCoins className="w-3.5 h-3.5" />
                    টাকা গ্রহণ / পরিশোধ
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAddEntry(contact.id, 'gave')}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-emerald-600 text-slate-950 font-bold text-xs hover:bg-emerald-500 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    নতুন লেনদেন
                  </button>
                </div>
              </div>

              {/* Transactions History Header */}
              <div className="flex items-center justify-between pt-1">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  লেনদেনের ইতিহাস ({entries.length})
                </h3>
                <span className="text-[11px] text-slate-500">কালানুক্রমিক হিসাব (Newest first)</span>
              </div>

              {/* Ledger Entries List */}
              {entries.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-semibold">কোন লেনদেনের রেকর্ড পাওয়া যায়নি</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    উপরের &quot;নতুন লেনদেন&quot; বাটনে চাপ দিয়ে হিসাব শুরু করুন
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {entries.map((entry) => {
                    const isGave = entry.entry_type === 'gave';
                    const isReceived = entry.entry_type === 'received';
                    const isTook = entry.entry_type === 'took';
                    const isPaid = entry.entry_type === 'paid';

                    return (
                      <div
                        key={entry.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`p-2 rounded-xl border mt-0.5 ${
                                isGave
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : isReceived
                                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                                  : isTook
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              }`}
                            >
                              {isGave && <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />}
                              {isReceived && <CornerDownLeft className="w-4 h-4 stroke-[2.5]" />}
                              {isTook && <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />}
                              {isPaid && <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-100">
                                  {isGave && 'পাওনা (টাকা দিয়েছেন)'}
                                  {isReceived && 'টাকা ফেরত পেয়েছেন (ফেরত)'}
                                  {isTook && 'দেনা (টাকা নিয়েছেন)'}
                                  {isPaid && 'দেনা পরিশোধ করেছেন'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{entry.entry_date}</span>
                                {entry.due_date && (
                                  <span className="text-amber-400 font-medium">
                                    • শেষ তারিখ: {entry.due_date}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Amount & Actions */}
                          <div className="flex items-center gap-2 text-right">
                            <div>
                              <span
                                className={`text-sm font-extrabold block ${
                                  isGave || isPaid ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isGave ? `+${entry.amount_bdt}` : isReceived ? `-${entry.amount_bdt}` : isTook ? `+${entry.amount_bdt}` : `-${entry.amount_bdt}`}
                              </span>
                              {entry.running_balance_bdt && (
                                <span className="text-[10px] text-slate-400 block font-medium">
                                  বাকি: {entry.running_balance_bdt}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(entry.id)}
                              disabled={deletingEntryId === entry.id}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer ml-1"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {entry.notes && (
                          <div className="text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/60">
                            &ldquo;{entry.notes}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
