'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMonthlyReport, type MonthlyReportDTO } from '@/lib/services/reports';
import { getDebtSummary } from '@/lib/services/debts';
import type { DebtSummaryDTO } from '@/types/debt.types';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  Wallet,
  PiggyBank,
  RefreshCw,
  HandCoins,
  ChevronRight,
} from 'lucide-react';

export default function DashboardPage() {
  const [report, setReport] = useState<MonthlyReportDTO | null>(null);
  const [debtSummary, setDebtSummary] = useState<DebtSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const now = new Date();
  const [selectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const loadData = (year: number, month: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    Promise.all([getMonthlyReport(year, month), getDebtSummary().catch(() => null)])
      .then(([reportData, debtsData]) => {
        setReport(reportData);
        setDebtSummary(debtsData);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMsg((err as Error).message || 'Failed to load dashboard report');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setSelectedMonth(val);
  };

  if (isLoading && !report) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-400">Loading Dashboard...</p>
      </div>
    );
  }

  if (errorMsg && !report) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3 text-center">
        <p className="text-sm font-semibold text-rose-400">{errorMsg}</p>
        <button
          type="button"
          onClick={() => loadData(selectedYear, selectedMonth)}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const isNegativeAvailable = report && BigInt(report.available_poisha_str) < 0n;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header & Month Selector */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400">Monthly Allocation & Summaries (Asia/Dhaka)</p>
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2026, m - 1, 1).toLocaleString('en-US', { month: 'long' })} 2026
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* 4 Primary Summary Cards - Mobile Optimized Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Income Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-wider">Income</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-lg sm:text-2xl font-bold text-slate-100 tracking-tight truncate">{report?.income_bdt || '৳ 0.00'}</p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider">Expenses</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-lg sm:text-2xl font-bold text-slate-100 tracking-tight truncate">{report?.expenses_bdt || '৳ 0.00'}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
              Needs: {report?.needs_bdt}
            </p>
          </div>
        </div>

        {/* Saved Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">Saved</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-lg sm:text-2xl font-bold text-slate-100 tracking-tight truncate">{report?.savings_bdt || '৳ 0.00'}</p>
            <p className="text-[10px] sm:text-xs text-emerald-400 font-bold mt-0.5">
              {(report?.savings_rate_bp || 0) / 100}% Rate
            </p>
          </div>
        </div>

        {/* Available Card */}
        <div className={`p-4 sm:p-5 rounded-2xl bg-slate-900/90 border shadow-lg flex flex-col justify-between ${
          isNegativeAvailable ? 'border-rose-500/40 bg-rose-950/20' : 'border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-sky-400 uppercase tracking-wider">Available</span>
            <div className={`p-1.5 sm:p-2 rounded-xl ${isNegativeAvailable ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'}`}>
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className={`text-lg sm:text-2xl font-bold tracking-tight truncate ${
              isNegativeAvailable ? 'text-rose-400' : 'text-slate-100'
            }`}>
              {report?.available_bdt || '৳ 0.00'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Balance</p>
          </div>
        </div>
      </div>

      {/* Lend & Borrow Quick Status Widget */}
      {debtSummary && (
        <Link
          href="/debts"
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Lend & Borrow Overview
                </h2>
                <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Track money lent, borrowed debts, and settlement progress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/80 pt-3 sm:pt-0">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Owed to you</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                {debtSummary.total_lent_remaining_bdt}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">You owe</span>
              <span className="text-xs sm:text-sm font-bold text-rose-400 flex items-center gap-0.5">
                <ArrowDownLeft className="w-3 h-3" />
                {debtSummary.total_borrowed_remaining_bdt}
              </span>
            </div>

            <div className="flex items-center text-slate-400 group-hover:text-slate-200 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      )}

      {/* Allocation Targets Progress */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4 sm:space-y-5 shadow-lg">
        <h2 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">2026 Target Allocations</h2>

        <div className="space-y-4">
          {/* Needs Target */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-300">Needs (Target 20%)</span>
              <span className="text-slate-400 font-semibold">
                {report?.needs_bdt} / {report ? `৳ ${Number(report.needs_target_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}` : '৳ 0.00'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                style={{ width: `${Math.min((report?.needs_budget_used_bp || 0) / 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Wants Target */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-300">Wants (Target 10%)</span>
              <span className="text-slate-400 font-semibold">
                {report?.wants_bdt} / {report ? `৳ ${Number(report.wants_target_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}` : '৳ 0.00'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                style={{ width: `${Math.min((report?.wants_budget_used_bp || 0) / 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Savings Target */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-300">Savings (Target 70%)</span>
              <span className="text-slate-400 font-semibold">
                {report?.savings_bdt} / {report ? `৳ ${Number(report.savings_target_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}` : '৳ 0.00'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                style={{ width: `${Math.min((report?.savings_budget_used_bp || 0) / 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3 sm:space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">Recent Transactions</h2>
        </div>

        {!report?.recent_transactions || report.recent_transactions.length === 0 ? (
          <div className="py-6 sm:py-8 text-center space-y-1">
            <p className="text-xs font-medium text-slate-500">No transactions recorded for this month.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {report.recent_transactions.map((t) => (
              <div key={t.id} className="py-2.5 sm:py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200 text-xs sm:text-sm">{t.description}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500">{t.transaction_date}</p>
                </div>
                <div className={`font-bold text-xs sm:text-sm ${
                  t.kind === 'income'
                    ? 'text-blue-400'
                    : t.kind === 'saving'
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>
                  {t.kind === 'income' ? '+' : '-'} ৳ {Number(t.amount_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
