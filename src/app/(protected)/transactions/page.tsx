'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listTransactionsByMonth, deleteTransaction, TransactionDTO } from '@/lib/services/transactions';
import { listCategories, CategoryDTO } from '@/lib/services/categories';
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal';
import { createTransaction, updateTransaction } from '@/lib/services/transactions';
import { Search, Pencil, Trash2, X } from 'lucide-react';
import { TransactionKind } from '@/types/database.types';

export default function TransactionsPage() {
  const now = new Date();
  const [selectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedKind, setSelectedKind] = useState<TransactionKind | 'all'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [items, setItems] = useState<TransactionDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit modal state
  const [editingTx, setEditingTx] = useState<TransactionDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete confirmation modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const router = useRouter();

  const fetchCategoryList = () => {
    listCategories().then(setCategories).catch(console.error);
  };

  useEffect(() => {
    fetchCategoryList();
  }, []);

  const loadData = () => {
    setIsLoading(true);
    setErrorMsg(null);
    listTransactionsByMonth({
      year: selectedYear,
      month: selectedMonth,
      kind: selectedKind === 'all' ? undefined : selectedKind,
      category_id: selectedCategoryId || undefined,
      search_query: searchQuery.trim() || undefined,
    })
      .then((res) => {
        setItems(res.items);
        setNextCursor(res.next_cursor);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMsg((err as Error).message || 'Failed to load transactions');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth, selectedKind, selectedCategoryId, searchQuery]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setDeletingId(null);
      loadData();
      router.refresh();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete transaction');
    }
  };

  const clearFilters = () => {
    setSelectedKind('all');
    setSelectedCategoryId('');
    setSearchQuery('');
  };

  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-slate-500">Filter, Edit, and Manage Dated Records</p>
        </div>
      </header>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Month Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1, 1).toLocaleString('en-US', { month: 'long' })} 2026
                </option>
              ))}
            </select>
          </div>

          {/* Kind Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Type
            </label>
            <select
              value={selectedKind}
              onChange={(e) => setSelectedKind(e.target.value as TransactionKind | 'all')}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-slate-900 capitalize cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="expense">Expense</option>
              <option value="saving">Saving</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.kind})
                </option>
              ))}
            </select>
          </div>

          {/* Search Query with fixed padding */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Search
            </label>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full !pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>
          </div>
        </div>

        {(selectedKind !== 'all' || selectedCategoryId || searchQuery) && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-100 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
            Filtered Records ({items.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-slate-900 border-t-transparent"></div>
            <p className="text-xs text-slate-400">Loading transactions...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-600 text-xs text-center font-medium">
            {errorMsg}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm font-medium text-slate-600">No matching transactions found.</p>
            <p className="text-xs text-slate-400">Try adjusting your filter parameters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.description}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      item.kind === 'income'
                        ? 'bg-blue-50 text-blue-600'
                        : item.kind === 'saving'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {item.kind} {item.bucket ? `· ${item.bucket}` : ''}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400">
                    {categoryMap.get(item.category_id) || 'Category'} · {item.transaction_date}
                  </p>
                  {item.note && <p className="text-xs text-slate-500 italic">"{item.note}"</p>}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-bold text-xs sm:text-sm ${
                    item.kind === 'income'
                      ? 'text-blue-600'
                      : item.kind === 'saving'
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}>
                    {item.kind === 'income' ? '+' : '-'} ৳ {Number(item.amount_decimal).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingTx(item);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        onSuccess={() => {
          loadData();
          fetchCategoryList();
          router.refresh();
        }}
        initialData={editingTx}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
          default_bucket: c.default_bucket,
        }))}
        createAction={createTransaction}
        updateAction={updateTransaction}
      />

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Delete Transaction?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this transaction record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
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
