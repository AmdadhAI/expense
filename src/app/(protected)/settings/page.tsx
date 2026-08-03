'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getBudgetPlanForYear, updateBudgetPlan } from '@/lib/services/budget-plans';
import {
  listCategoriesGroupedByKind,
  createCategory,
  updateCategory,
  archiveCategory,
  CategoryDTO,
} from '@/lib/services/categories';
import { TransactionKind } from '@/types/database.types';
import { LogOut, Save, CheckCircle2, AlertCircle, Plus, Pencil, Archive, KeyRound, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [year] = useState(2026);
  const [needsPercent, setNeedsPercent] = useState(20);
  const [wantsPercent, setWantsPercent] = useState(10);
  const [savingsPercent, setSavingsPercent] = useState(70);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Account & Credentials state
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);

  // Categories management state
  const [groupedCategories, setGroupedCategories] = useState<Record<TransactionKind, CategoryDTO[]>>({
    income: [],
    expense: [],
    saving: [],
  });
  const [catSuccessMsg, setCatSuccessMsg] = useState<string | null>(null);
  const [catErrorMsg, setCatErrorMsg] = useState<string | null>(null);

  // New Category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatKind, setNewCatKind] = useState<TransactionKind>('expense');
  const [newCatBucket, setNewCatBucket] = useState<'needs' | 'wants'>('needs');
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Editing Category state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const loadData = () => {
    setIsLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setCurrentUserEmail(data.user.email);
        setNewEmail(data.user.email);
      }
    });

    Promise.all([getBudgetPlanForYear(year), listCategoriesGroupedByKind()])
      .then(([plan, cats]) => {
        setNeedsPercent(plan.needs_bp / 100);
        setWantsPercent(plan.wants_bp / 100);
        setSavingsPercent(plan.savings_bp / 100);
        setGroupedCategories(cats);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMsg((err as Error).message || 'Failed to load settings data');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [year]);

  async function handleUpdateCredentials(e: React.FormEvent) {
    e.preventDefault();
    setAuthSuccessMsg(null);
    setAuthErrorMsg(null);

    if (!newEmail && !newPassword) {
      setAuthErrorMsg('Please enter a new email or new password.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setAuthErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsUpdatingAuth(true);
    try {
      const supabase = createClient();
      const updateData: { email?: string; password?: string } = {};
      if (newEmail && newEmail !== currentUserEmail) {
        updateData.email = newEmail;
      }
      if (newPassword) {
        updateData.password = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        setAuthErrorMsg('No changes detected.');
        setIsUpdatingAuth(false);
        return;
      }

      const { data, error } = await supabase.auth.updateUser(updateData);
      if (error) {
        throw error;
      }

      setAuthSuccessMsg('Sign-in credentials updated successfully!');
      if (data.user?.email) {
        setCurrentUserEmail(data.user.email);
      }
      setNewPassword('');
      setIsUpdatingAuth(false);
    } catch (err: unknown) {
      setAuthErrorMsg((err as Error).message || 'Failed to update credentials');
      setIsUpdatingAuth(false);
    }
  }

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

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatSuccessMsg(null);
    setCatErrorMsg(null);

    try {
      await createCategory({
        name: newCatName.trim(),
        kind: newCatKind,
        default_bucket: newCatKind === 'expense' ? newCatBucket : newCatKind === 'saving' ? 'savings' : null,
      });
      setCatSuccessMsg(`Category "${newCatName.trim()}" created!`);
      setNewCatName('');
      setIsCreatingCat(false);
      loadData();
      router.refresh();
    } catch (err: unknown) {
      setCatErrorMsg((err as Error).message || 'Failed to create category');
    }
  }

  async function handleUpdateCategory(id: string) {
    if (!editingCatName.trim()) return;
    setCatSuccessMsg(null);
    setCatErrorMsg(null);

    try {
      await updateCategory({
        id,
        name: editingCatName.trim(),
      });
      setCatSuccessMsg('Category updated successfully!');
      setEditingCatId(null);
      setEditingCatName('');
      loadData();
      router.refresh();
    } catch (err: unknown) {
      setCatErrorMsg((err as Error).message || 'Failed to update category');
    }
  }

  async function handleArchiveCategory(id: string) {
    setCatSuccessMsg(null);
    setCatErrorMsg(null);

    try {
      await archiveCategory(id);
      setCatSuccessMsg('Category archived successfully!');
      loadData();
      router.refresh();
    } catch (err: unknown) {
      setCatErrorMsg((err as Error).message || 'Failed to archive category');
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500">Preferences, Security, Categories & Target Allocations</p>
      </header>

      {/* Security & Account Credentials */}
      <form onSubmit={handleUpdateCredentials} className="p-6 rounded-2xl bg-white border border-slate-100 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-900" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Account Credentials</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Supabase Auth</span>
        </div>

        {authSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {authSuccessMsg}
          </div>
        )}

        {authErrorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs font-medium text-rose-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {authErrorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Sign-in Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              New Password (Optional)
            </label>
            <input
              id="auth-password"
              type="password"
              placeholder="Min 6 characters..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isUpdatingAuth}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            {isUpdatingAuth ? 'Updating...' : 'Update Credentials'}
          </button>
        </div>
      </form>

      {/* Application Defaults */}
      <div className="p-6 rounded-2xl bg-white border border-slate-100 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Application Environment</h2>
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
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2026 Target Allocations</h2>
          <span className="text-xs text-slate-400 font-medium">Must total 100%</span>
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
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Targets'}
          </button>
        </div>
      </form>

      {/* Category Management Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-100 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Category Management</h2>
            <p className="text-xs text-slate-400">Add, rename, or archive transaction categories</p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingCat(!isCreatingCat)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {isCreatingCat ? 'Cancel' : 'Add Category'}
          </button>
        </div>

        {catSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {catSuccessMsg}
          </div>
        )}

        {catErrorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs font-medium text-rose-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {catErrorMsg}
          </div>
        )}

        {/* Add Category Form */}
        {isCreatingCat && (
          <form onSubmit={handleCreateCategory} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900">Create New Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dining"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                <select
                  value={newCatKind}
                  onChange={(e) => setNewCatKind(e.target.value as TransactionKind)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold bg-white cursor-pointer"
                >
                  <option value="expense">Expense</option>
                  <option value="saving">Saving</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {newCatKind === 'expense' ? (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Bucket</label>
                  <select
                    value={newCatBucket}
                    onChange={(e) => setNewCatBucket(e.target.value as 'needs' | 'wants')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold bg-white cursor-pointer"
                  >
                    <option value="needs">Needs</option>
                    <option value="wants">Wants</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Bucket</label>
                  <input
                    type="text"
                    disabled
                    value={newCatKind === 'saving' ? 'savings' : 'None'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold bg-slate-100 text-slate-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Create Category
              </button>
            </div>
          </form>
        )}

        {/* Grouped Category Lists */}
        <div className="space-y-4">
          {(['expense', 'saving', 'income'] as TransactionKind[]).map((kind) => {
            const list = groupedCategories[kind] || [];
            return (
              <div key={kind} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 capitalize flex items-center justify-between">
                  <span>{kind} Categories ({list.length})</span>
                </h3>

                {list.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No active categories for {kind}.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {list.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                      >
                        {editingCatId === c.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="w-full px-2 py-1 text-xs font-bold rounded border border-slate-300 bg-white"
                            />
                            <button
                              onClick={() => handleUpdateCategory(c.id)}
                              className="px-2 py-1 bg-slate-900 text-white rounded font-bold hover:bg-slate-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCatId(null)}
                              className="px-2 py-1 text-slate-500 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{c.name}</span>
                              {c.default_bucket && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                                  {c.default_bucket}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingCatId(c.id);
                                  setEditingCatName(c.name);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors"
                                title="Rename"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleArchiveCategory(c.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Archive"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Session Sign Out */}
      <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Session Management</h2>
          <p className="text-xs text-slate-400">Sign out of your private personal budget session</p>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
