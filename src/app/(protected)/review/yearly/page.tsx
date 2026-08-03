'use client';

import { useState, useEffect } from 'react';
import { getYearlyReport, YearlyReportDTO } from '@/lib/services/reports';
import { Trophy, TrendingUp, RefreshCw } from 'lucide-react';

export default function YearlyReviewPage() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [report, setReport] = useState<YearlyReportDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadReport = (year: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    getYearlyReport(year)
      .then((data) => {
        setReport(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMsg((err as Error).message || 'Failed to load yearly report');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadReport(selectedYear);
  }, [selectedYear]);

  if (isLoading && !report) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-400">Loading 2026 Yearly Review...</p>
      </div>
    );
  }

  if (errorMsg && !report) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3 text-center">
        <p className="text-sm font-semibold text-rose-400">{errorMsg}</p>
        <button
          onClick={() => loadReport(selectedYear)}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-500 transition-colors inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  // Calculate max monthly value for CSS bar chart normalization
  let maxBarValue = 1n;
  report?.monthly_overviews.forEach((m) => {
    const inc = BigInt(m.income_poisha_str);
    const exp = BigInt(m.expenses_poisha_str);
    const sav = BigInt(m.savings_poisha_str);
    if (inc > maxBarValue) maxBarValue = inc;
    if (exp > maxBarValue) maxBarValue = exp;
    if (sav > maxBarValue) maxBarValue = sav;
  });

  return (
    <div className="space-y-6">
      {/* Header & Year Selector */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Yearly Review</h1>
          <p className="text-sm text-slate-400">2026 Annual Allocation & Financial Breakdown</p>
        </div>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:ring-2 focus:ring-emerald-500/20 shadow-sm cursor-pointer"
        >
          <option value={2026}>2026 Annual Overview</option>
          <option value={2025}>2025 Overview</option>
        </select>
      </header>

      {/* Annual Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Total Income</span>
          <p className="text-2xl font-bold text-slate-100 mt-2">{report?.total_income_bdt || '৳ 0.00'}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Total Expenses</span>
          <p className="text-2xl font-bold text-slate-100 mt-2">{report?.total_expenses_bdt || '৳ 0.00'}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Savings</span>
          <p className="text-2xl font-bold text-slate-100 mt-2">{report?.total_savings_bdt || '৳ 0.00'}</p>
          <p className="text-xs text-emerald-400 font-medium mt-1">
            {(report?.yearly_savings_rate_bp || 0) / 100}% Yearly Savings Rate
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Available Balance</span>
          <p className="text-2xl font-bold text-slate-100 mt-2">{report?.total_available_bdt || '৳ 0.00'}</p>
        </div>
      </div>

      {/* Highlights Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Highest Expense Month</span>
            <p className="text-base font-bold text-slate-100">
              {report?.highest_spending_month
                ? `${report.highest_spending_month.month_name} (৳ ${Number(report.highest_spending_month.expenses_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })})`
                : 'No expense records'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Best Savings Month</span>
            <p className="text-base font-bold text-slate-100">
              {report?.best_saving_month
                ? `${report.best_saving_month.month_name} (৳ ${Number(report.best_saving_month.savings_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })})`
                : 'No savings records'}
            </p>
          </div>
        </div>
      </div>

      {/* 12-Month CSS Bar Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">12-Month Trend Comparison</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3 h-3 rounded-xs bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]"></span> Income</span>
            <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3 h-3 rounded-xs bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]"></span> Expenses</span>
            <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3 h-3 rounded-xs bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"></span> Savings</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-1 sm:gap-2 items-end h-44 pt-6 border-b border-slate-800/80">
          {report?.monthly_overviews.map((m) => {
            const incPoisha = BigInt(m.income_poisha_str);
            const expPoisha = BigInt(m.expenses_poisha_str);
            const savPoisha = BigInt(m.savings_poisha_str);

            const incHeight = Number((incPoisha * 100n) / maxBarValue);
            const expHeight = Number((expPoisha * 100n) / maxBarValue);
            const savHeight = Number((savPoisha * 100n) / maxBarValue);

            return (
              <div key={m.month} className="flex flex-col items-center gap-1 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                  <div
                    title={`Income: ৳${m.income_decimal}`}
                    className="w-1.5 sm:w-2.5 bg-blue-500 rounded-t-xs transition-all duration-300 hover:bg-blue-400"
                    style={{ height: `${Math.max(incHeight, 4)}%` }}
                  ></div>
                  <div
                    title={`Expenses: ৳${m.expenses_decimal}`}
                    className="w-1.5 sm:w-2.5 bg-rose-500 rounded-t-xs transition-all duration-300 hover:bg-rose-400"
                    style={{ height: `${Math.max(expHeight, 4)}%` }}
                  ></div>
                  <div
                    title={`Savings: ৳${m.savings_decimal}`}
                    className="w-1.5 sm:w-2.5 bg-emerald-500 rounded-t-xs transition-all duration-300 hover:bg-emerald-400"
                    style={{ height: `${Math.max(savHeight, 4)}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-200">
                  {m.month_name.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12-Month Table Overview */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4 shadow-lg overflow-x-auto">
        <h2 className="text-sm font-semibold text-slate-100">Monthly Financial Breakdowns</h2>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Month</th>
              <th className="py-2.5 px-3 text-right">Income</th>
              <th className="py-2.5 px-3 text-right">Expenses</th>
              <th className="py-2.5 px-3 text-right">Savings</th>
              <th className="py-2.5 px-3 text-right">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {report?.monthly_overviews.map((m) => (
              <tr key={m.month} className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-semibold text-slate-200">{m.month_name}</td>
                <td className="py-2.5 px-3 text-right font-medium text-blue-400">৳ {Number(m.income_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
                <td className="py-2.5 px-3 text-right font-medium text-rose-400">৳ {Number(m.expenses_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
                <td className="py-2.5 px-3 text-right font-medium text-emerald-400">৳ {Number(m.savings_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-100">৳ {Number(m.available_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
