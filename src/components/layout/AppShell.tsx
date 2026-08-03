'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileNav } from './MobileNav';
import { TransactionFormModal, CategoryOption } from '@/components/transactions/TransactionFormModal';
import { listCategories } from '@/lib/services/categories';
import { createTransaction, updateTransaction } from '@/lib/services/transactions';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch categories for the form dropdown
    listCategories()
      .then((cats) => {
        setCategories(
          cats.map((c) => ({
            id: c.id,
            name: c.name,
            kind: c.kind,
            default_bucket: c.default_bucket,
          }))
        );
      })
      .catch((err) => {
        console.error('Failed to load categories in AppShell:', err);
      });
  }, []);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-400">
      <DesktopSidebar onAddTransaction={() => setIsModalOpen(true)} />
      <main className="flex-1 p-4 md:p-8 mb-24 md:mb-0 max-w-5xl mx-auto w-full">
        {children}
      </main>
      <MobileNav onAddTransaction={() => setIsModalOpen(true)} />

      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        categories={categories}
        createAction={createTransaction}
        updateAction={updateTransaction}
      />
    </div>
  );
}
