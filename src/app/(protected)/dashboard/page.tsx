'use client';

import { useState, useEffect } from 'react';
import { getMonthlyReport, MonthlyReportDTO } from '@/lib/services/reports';
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [report, setReport] = useState<MonthlyReportDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const now = new Date();
  const [selectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const loadReport = (year: number, month: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    getMonthlyReport(year, month)
      .then((data) => {
        setReport(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMsg((err as Error).message || 'Failed to load dashboard report');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadReport(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setSelectedMonth(val);
  };

  if (isLoading && !report) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-900 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-500">Loading Dashboard...</p>
      </div>
    );
  }

  if (errorMsg && !report) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100 space-y-3 text-center">
        <p className="text-sm font-semibold text-rose-600">{errorMsg}</p>
        <button
          type="button"
          onClick={() => loadReport(selectedYear, selectedMonth)}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500">Monthly Allocation & Summaries (Asia/Dhaka)</p>
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-xs"
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
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider">Income</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{report?.income_bdt || '৳ 0.00'}</p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-rose-600 uppercase tracking-wider">Expenses</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{report?.expenses_bdt || '৳ 0.00'}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
              Needs: {report?.needs_bdt}
            </p>
          </div>
        </div>

        {/* Saved Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider">Saved</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{report?.savings_bdt || '৳ 0.00'}</p>
            <p className="text-[10px] sm:text-xs text-emerald-600 font-bold mt-0.5">
              {(report?.savings_rate_bp || 0) / 100}% Rate
            </p>
          </div>
        </div>

        {/* Available Card */}
        <div className={`p-4 sm:p-5 rounded-2xl bg-white border shadow-xs flex flex-col justify-between ${
          isNegativeAvailable ? 'border-rose-300 bg-rose-50/40' : 'border-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Available</span>
            <div className={`p-1.5 sm:p-2 rounded-xl ${isNegativeAvailable ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className={`text-lg sm:text-2xl font-bold tracking-tight truncate ${
              isNegativeAvailable ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {report?.available_bdt || '৳ 0.00'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Balance</p>
          </div>
        </div>
      </div>

      {/* Allocation Targets Progress */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-100 space-y-4 sm:space-y-5 shadow-xs">
        <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">2026 Target Allocations</h2>

        <div className="space-y-3.5">
          {/* Needs Target */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700">Needs (Target 20%)</span>
              <span className="text-slate-500 font-semibold">
                {report?.needs_bdt} / {report ? `৳ ${Number(report.needs_target_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}` : '৳ 0.00'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((report?.needs_budget_used_bp || 0) / 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Wants Target */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700">Wants (Target 10%)</span>
              <span className="text-slate-500 font-semibold">
                {report?.wants_bdt} / {report ? `৳ ${Number(report.wants_target_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}` : '৳ 0.00'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((report?.wants_budget_used_bp || 0) / 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Savings Target */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-700">Savings (Target 70%)</span>
              <span className="text-slate-500 font-semibold">
                {report?.savings_bdt} / {report ? `৳ ${Number(report.savings_target_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}` : '৳ 0.00'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((report?.savings_budget_used_bp || 0) / 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-100 space-y-3 sm:space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Transactions</h2>
        </div>

        {!report?.recent_transactions || report.recent_transactions.length === 0 ? (
          <div className="py-6 sm:py-8 text-center space-y-1">
            <p className="text-xs font-medium text-slate-500">No transactions recorded for this month.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {report.recent_transactions.map((t) => (
              <div key={t.id} className="py-2.5 sm:py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{t.description}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400">{t.transaction_date}</p>
                </div>
                <div className={`font-bold text-xs sm:text-sm ${
                  t.kind === 'income'
                    ? 'text-blue-600'
                    : t.kind === 'saving'
                    ? 'text-emerald-600'
                    : 'text-rose-600'
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
