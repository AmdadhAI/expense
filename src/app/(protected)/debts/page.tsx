'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  listDebts,
  getDebtSummary,
  createDebt,
  updateDebt,
  deleteDebt,
  recordDebtPayment,
  deleteDebtPayment,
} from '@/lib/services/debts';
import type { DebtDTO, DebtSummaryDTO, DebtType, DebtStatus } from '@/types/debt.types';
import { DebtFormModal } from '@/components/debts/DebtFormModal';
import { DebtPaymentModal } from '@/components/debts/DebtPaymentModal';
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Pencil,
  Trash2,
  Coins,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function DebtsPage() {
  const router = useRouter();

  const [debts, setDebts] = useState<DebtDTO[]>([]);
  const [summary, setSummary] = useState<DebtSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<DebtType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<DebtStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtDTO | null>(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtDTO | null>(null);

  // Delete modal
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setIsLoading(true);
    setErrorMsg(null);

    Promise.all([
      listDebts({
        type: selectedType,
        status: selectedStatus,
        searchQuery: searchQuery.trim(),
      }),
      getDebtSummary(),
    ])
      .then(([debtsData, summaryData]) => {
        setDebts(debtsData);
        setSummary(summaryData);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMsg((err as Error).message || 'Failed to load debt records');
        setIsLoading(false);
      });
  }, [selectedType, selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDebt(id);
      setDeletingId(null);
      loadData();
      router.refresh();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete record');
    }
  };

  const handleOpenAdd = () => {
    setEditingDebt(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (debt: DebtDTO) => {
    setEditingDebt(debt);
    setIsFormOpen(true);
  };

  const handleOpenPayment = (debt: DebtDTO) => {
    setPayingDebt(debt);
    setIsPaymentOpen(true);
  };

  const handleSuccess = () => {
    loadData();
    router.refresh();
  };

  const isNetNegative = summary && BigInt(summary.net_balance_poisha_str) < 0n;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <HandCoins className="w-6 h-6 text-emerald-400" />
            Lend & Borrow
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor money lent to others, debts owed, and repayments
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Loan / Debt</span>
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* You are Owed (Lent) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">
              You are Owed (Lent)
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              {summary?.total_lent_remaining_bdt || '৳ 0.00'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>{summary?.active_lent_count || 0} active lent record{summary?.active_lent_count === 1 ? '' : 's'}</span>
              <span>Total: {summary?.total_lent_bdt || '৳ 0.00'}</span>
            </div>
          </div>
        </div>

        {/* You Owe (Borrowed) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider">
              You Owe (Borrowed)
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              {summary?.total_borrowed_remaining_bdt || '৳ 0.00'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>{summary?.active_borrowed_count || 0} active debt{summary?.active_borrowed_count === 1 ? '' : 's'}</span>
              <span>Total: {summary?.total_borrowed_bdt || '৳ 0.00'}</span>
            </div>
          </div>
        </div>

        {/* Net Standing */}
        <div className={`p-4 sm:p-5 rounded-2xl bg-slate-900/90 border shadow-lg flex flex-col justify-between ${
          isNetNegative ? 'border-rose-500/40 bg-rose-950/20' : 'border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
              isNetNegative ? 'text-rose-400' : 'text-sky-400'
            }`}>
              Net Balance Position
            </span>
            <div className={`p-1.5 sm:p-2 rounded-xl border ${
              isNetNegative ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
            }`}>
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isNetNegative ? 'text-rose-400' : 'text-slate-100'
            }`}>
              {summary?.net_balance_bdt || '৳ 0.00'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {isNetNegative ? 'You owe more than you are owed' : 'You are owed more than you owe'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Direction
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DebtType | 'all')}
              className="w-full px-3 py-2 rounded-xl border border-slate-800 text-xs font-semibold bg-slate-950 text-slate-200 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="all">All Directions</option>
              <option value="lent">Lent (They owe me)</option>
              <option value="borrowed">Borrowed (I owe them)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as DebtStatus | 'all')}
              className="w-full px-3 py-2 rounded-xl border border-slate-800 text-xs font-semibold bg-slate-950 text-slate-200 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="settled">Settled Only</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Search Person
            </label>
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full !pl-8 pr-3 py-2 rounded-xl border border-slate-800 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 bg-slate-950 text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Records List */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
            Loan & Debt Records ({debts.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
            <p className="text-xs text-slate-500">Loading records...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3 text-center">
            <p className="text-sm font-semibold text-rose-400">{errorMsg}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : debts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-800/60 text-slate-400">
              <HandCoins className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No loan or debt records found.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start by tapping "+ Add Loan / Debt" above to record money you lent or borrowed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((item) => {
              const isLent = item.type === 'lent';
              const isSettled = item.status === 'settled';

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-md flex flex-col justify-between space-y-4 ${
                    isSettled
                      ? 'bg-slate-950/60 border-slate-800/60 opacity-80'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  {/* Top Details */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                          {item.person_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              isLent
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isLent ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                            {isLent ? 'Lent (They Owe)' : 'Borrowed (You Owe)'}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              isSettled
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            }`}
                          >
                            {isSettled ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3" />}
                            {isSettled ? 'Settled' : 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
                          Remaining
                        </span>
                        <span className={`text-base sm:text-lg font-bold tracking-tight ${
                          isSettled ? 'text-slate-400 line-through' : isLent ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {item.remaining_amount_bdt}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Amounts */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                        <span>Repaid: {item.repaid_amount_bdt}</span>
                        <span>Total: {item.total_amount_bdt}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isSettled
                              ? 'bg-slate-500'
                              : isLent
                              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                              : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                          }`}
                          style={{ width: `${item.repaid_percent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Due Date & Notes */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      {item.due_date ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Due: {item.due_date}
                        </span>
                      ) : (
                        <span>No due date</span>
                      )}
                      <span>{item.payments.length} payment{item.payments.length === 1 ? '' : 's'}</span>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleOpenPayment(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isSettled
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-emerald-600 text-slate-950 hover:bg-emerald-500 shadow-xs'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{isSettled ? 'View History' : 'Record Payment'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Record"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Debt Add / Edit Modal */}
      <DebtFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDebt(null);
        }}
        onSuccess={handleSuccess}
        initialData={editingDebt}
        createAction={createDebt}
        updateAction={updateDebt}
      />

      {/* Debt Payment Modal */}
      <DebtPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setPayingDebt(null);
        }}
        onSuccess={handleSuccess}
        debt={payingDebt}
        recordPaymentAction={recordDebtPayment}
        deletePaymentAction={deleteDebtPayment}
      />

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-800">
            <h3 className="text-base font-bold text-slate-100">Delete Loan Record?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete this debt/loan record and all its associated repayment history? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
