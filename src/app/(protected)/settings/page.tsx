'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500">Preferences & Account Management</p>
      </header>

      <div className="p-6 rounded-2xl bg-white border border-slate-100 space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Application Defaults</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500">Currency</span>
              <p className="font-semibold text-slate-800 mt-1">BDT (৳)</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500">Timezone</span>
              <p className="font-semibold text-slate-800 mt-1">Asia/Dhaka</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">2026 Target Allocations</h2>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-slate-500">Needs</span>
              <p className="font-bold text-slate-900 mt-1">20%</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-slate-500">Wants</span>
              <p className="font-bold text-slate-900 mt-1">10%</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-slate-500">Savings</span>
              <p className="font-bold text-slate-900 mt-1">70%</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-medium text-xs hover:bg-rose-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
