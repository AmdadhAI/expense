'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HandCoins,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  RefreshCw,
  Clock,
  ChevronRight,
  FileText,
  UserCheck,
} from 'lucide-react';
import {
  listDebtContacts,
  getDebtSummary,
  createDebtEntry,
  listAllContacts,
} from '@/lib/services/debts';
import type { DebtContactDTO, DebtSummaryDTO, DebtEntryType } from '@/types/debt.types';
import { DebtFormModal } from '@/components/debts/DebtFormModal';
import { PersonLedgerModal } from '@/components/debts/PersonLedgerModal';

export default function DebtsPage() {
  const [contacts, setContacts] = useState<DebtContactDTO[]>([]);
  const [allContactsList, setAllContactsList] = useState<Array<{ id: string; name: string }>>([]);
  const [summary, setSummary] = useState<DebtSummaryDTO | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paona' | 'dena' | 'settled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [selectedContactForEntry, setSelectedContactForEntry] = useState<string | null>(null);
  const [defaultEntryType, setDefaultEntryType] = useState<DebtEntryType | undefined>(undefined);

  const [ledgerContactId, setLedgerContactId] = useState<string | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [contactsData, summaryData, allContacts] = await Promise.all([
        listDebtContacts({
          status: statusFilter,
          searchQuery,
        }),
        getDebtSummary(),
        listAllContacts(),
      ]);
      setContacts(contactsData);
      setSummary(summaryData);
      setAllContactsList(allContacts);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to load Dena-Paona records');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleOpenAddEntry(contactId?: string | null, type?: DebtEntryType) {
    setSelectedContactForEntry(contactId || null);
    setDefaultEntryType(type);
    setIsAddEntryOpen(true);
  }

  function handleOpenLedger(contactId: string) {
    setLedgerContactId(contactId);
    setIsLedgerOpen(true);
  }

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 inline-flex">
                <HandCoins className="w-6 h-6" />
              </span>
              দেনা - পাওনা (Dena - Paona)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ব্যক্তিভিত্তিক ধারের খতিয়ান, দেনা-পাওনা ও পরিশোধের হিসাব
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchData()}
            title="Refresh records"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddEntry()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-slate-950 font-bold text-xs hover:bg-emerald-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_16px_rgba(16,185,129,0.25)] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            নতুন লেনদেন (Add Entry)
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400">
          {errorMsg}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Paona (Receivable) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              মোট পাওনা (You will receive)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {summary ? summary.total_paona_bdt : '৳ 0.00'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary ? `${summary.paona_contacts_count} জনের কাছে পাওনা বাকি` : '০ জনের কাছে পাওনা'}
            </p>
          </div>
        </div>

        {/* Total Dena (Payable) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              মোট দেনা (You will pay)
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
              {summary ? summary.total_dena_bdt : '৳ 0.00'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary ? `${summary.dena_contacts_count} জনকে পরিশোধ করতে হবে` : '০ জনের দেনা'}
            </p>
          </div>
        </div>

        {/* Net Position */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              নেট ব্যালেন্স (Net Position)
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                summary && BigInt(summary.net_balance_poisha_str) > 0n
                  ? 'text-emerald-400'
                  : summary && BigInt(summary.net_balance_poisha_str) < 0n
                  ? 'text-rose-400'
                  : 'text-slate-100'
              }`}
            >
              {summary ? summary.net_balance_bdt : '৳ 0.00'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary && BigInt(summary.net_balance_poisha_str) > 0n
                ? 'পাওনার পরিমাণ দেনার চেয়ে বেশি (+)'
                : summary && BigInt(summary.net_balance_poisha_str) < 0n
                ? 'দেনার পরিমাণ পাওনার চেয়ে বেশি (-)'
                : 'দেনা ও পাওনা সম্পূর্ণ সমান (৳০)'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="ব্যক্তির নাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            সব হিসাব
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paona')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              statusFilter === 'paona'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            পাওনাদার
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('dena')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              statusFilter === 'dena'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            দেনাদার
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('settled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'settled'
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            সমান হিসাব (৳0)
          </button>
        </div>
      </div>

      {/* Person Accounts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            ব্যক্তিদের তালিকা ({contacts.length})
          </h2>
          <span className="text-[11px] text-slate-500">কার্ডে ক্লিক করে বিস্তারিত খতিয়ান দেখুন</span>
        </div>

        {contacts.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-300">কোন হিসাব পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              নতুন কোন ব্যক্তির সাথে দেনা বা পাওনার হিসাব শুরু করতে উপরের &quot;নতুন লেনদেন&quot; বাটনে চাপ দিন।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((c) => {
              const isPaona = c.status === 'paona';
              const isDena = c.status === 'dena';

              return (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 group"
                >
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-base border ${
                          isPaona
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : isDena
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {c.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{c.entries_count} টি লেনদেন</span>
                          {c.last_activity_date && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {c.last_activity_date}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                        isPaona
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : isDena
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {isPaona ? 'পাওনা' : isDena ? 'দেনা' : 'সমান (৳0)'}
                    </span>
                  </div>

                  {/* Net Balance Details */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {isPaona ? 'বাকি পাওনা:' : isDena ? 'বাকি দেনা:' : 'মোট হিসাব:'}
                    </span>
                    <span
                      className={`text-lg font-extrabold tracking-tight ${
                        isPaona ? 'text-emerald-400' : isDena ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    >
                      {c.net_balance_bdt}
                    </span>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => handleOpenLedger(c.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      হিসাব দেখুন
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddEntry(c.id, isDena ? 'paid' : 'received')}
                      className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      লেনদেন
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Entry Modal */}
      <DebtFormModal
        isOpen={isAddEntryOpen}
        onClose={() => {
          setIsAddEntryOpen(false);
          setSelectedContactForEntry(null);
          setDefaultEntryType(undefined);
        }}
        onSuccess={() => {
          fetchData();
        }}
        contacts={allContactsList}
        preselectedContactId={selectedContactForEntry}
        defaultEntryType={defaultEntryType}
        createAction={createDebtEntry}
      />

      {/* Person Ledger Statement Modal */}
      <PersonLedgerModal
        isOpen={isLedgerOpen}
        contactId={ledgerContactId}
        onClose={() => {
          setIsLedgerOpen(false);
          setLedgerContactId(null);
        }}
        onOpenAddEntry={(cid, type) => {
          setIsLedgerOpen(false);
          handleOpenAddEntry(cid, type);
        }}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
