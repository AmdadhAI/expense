'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getBudgetPlanForYear, updateBudgetPlan } from '@/lib/services/budget-plans';
import { LogOut, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [year, setYear] = useState(2026);
  const [needsPercent, setNeedsPercent] = useState(20);
  const [wantsPercent, setWantsPercent] = useState(10);
  const [savingsPercent, setSavingsPercent] = useState(70);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setErrorMsg(null);
    getBudgetPlanForYear(year)
      .then((plan) => {
        setNeedsPercent(plan.needs_bp / 100);
        setWantsPercent(plan.wants_bp / 100);
        setSavingsPercent(plan.savings_bp / 100);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMsg((err as Error).message || 'Failed to load budget plan');
        setIsLoading(false);
      });
  }, [year]);

  async function handleSaveTargets(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const total = needsPercent + wantsPercent + savingsPercent;
    if (total !== 100) {
      setErrorMsg(`Target percentages must sum to exactly 100% (current total: ${total}%)`);
      return;
    }

    setIsSaving(true);
    try {
      await updateBudgetPlan({
        year,
        needs_bp: needsPercent * 100,
        wants_bp: wantsPercent * 100,
        savings_bp: savingsPercent * 100,
      });
      setSuccessMsg('2026 Target allocations updated successfully!');
      setIsSaving(false);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to update budget plan');
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500">Preferences & Target Allocations</p>
      </header>

      {/* Application Defaults */}
      <div className="p-6 rounded-2xl bg-white border border-slate-100 space-y-4 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900">Application Environment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium">Currency</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">BDT (৳)</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium">Timezone</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">Asia/Dhaka</p>
          </div>
        </div>
      </div>

      {/* Editable Allocation Targets */}
      <form onSubmit={handleSaveTargets} className="p-6 rounded-2xl bg-white border border-slate-100 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">2026 Annual Target Allocations</h2>
          <span className="text-xs text-slate-400">Must total exactly 100%</span>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs font-medium text-rose-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading targets...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="needs" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Needs (%)
              </label>
              <input
                id="needs"
                type="number"
                min={0}
                max={100}
                required
                value={needsPercent}
                onChange={(e) => setNeedsPercent(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label htmlFor="wants" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Wants (%)
              </label>
              <input
                id="wants"
                type="number"
                min={0}
                max={100}
                required
                value={wantsPercent}
                onChange={(e) => setWantsPercent(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label htmlFor="savings" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Savings (%)
              </label>
              <input
                id="savings"
                type="number"
                min={0}
                max={100}
                required
                value={savingsPercent}
                onChange={(e) => setSavingsPercent(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className={`text-xs font-bold ${
            needsPercent + wantsPercent + savingsPercent === 100 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            Total: {needsPercent + wantsPercent + savingsPercent}%
          </span>

          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Targets'}
          </button>
        </div>
      </form>

      {/* Account Session Sign Out */}
      <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Session Management</h2>
          <p className="text-xs text-slate-400">Sign out of your private personal budget session</p>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-semibold text-xs hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
