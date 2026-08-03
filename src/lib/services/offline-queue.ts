import { TransactionKind } from '@/types/database.types';

export interface QueuedTransaction {
  request_id: string;
  kind: TransactionKind;
  amount_decimal: string;
  description: string;
  transaction_date: string;
  category_id: string;
  note?: string | null;
  queued_at: string;
}

const STORAGE_KEY = 'budget_2026_offline_queue_v1';

export function getOfflineQueue(): QueuedTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read offline queue:', err);
    return [];
  }
}

export function enqueueOfflineTransaction(
  item: Omit<QueuedTransaction, 'queued_at'>
): QueuedTransaction[] {
  if (typeof window === 'undefined') return [];
  const current = getOfflineQueue();
  
  // Prevent duplicate queuing of exact same request_id
  if (current.some((existing) => existing.request_id === item.request_id)) {
    return current;
  }

  const newItem: QueuedTransaction = {
    ...item,
    queued_at: new Date().toISOString(),
  };

  const updated = [...current, newItem];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save offline transaction:', err);
  }
  return updated;
}

export function removeOfflineTransaction(requestId: string): QueuedTransaction[] {
  if (typeof window === 'undefined') return [];
  const current = getOfflineQueue();
  const updated = current.filter((item) => item.request_id !== requestId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove item from offline queue:', err);
  }
  return updated;
}

export async function syncOfflineQueue(
  createFn: (data: {
    kind: TransactionKind;
    amount_decimal: string;
    description: string;
    transaction_date: string;
    category_id: string;
    note?: string | null;
    request_id?: string | null;
  }) => Promise<unknown>
): Promise<{ syncedCount: number; remainingCount: number; errors: string[] }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, remainingCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const item of queue) {
    try {
      await createFn({
        kind: item.kind,
        amount_decimal: item.amount_decimal,
        description: item.description,
        transaction_date: item.transaction_date,
        category_id: item.category_id,
        note: item.note,
        request_id: item.request_id,
      });
      removeOfflineTransaction(item.request_id);
      syncedCount++;
    } catch (err: unknown) {
      console.error(`Failed to sync offline item ${item.request_id}:`, err);
      errors.push((err as Error).message || 'Failed to sync offline transaction');
    }
  }

  const remaining = getOfflineQueue().length;
  return { syncedCount, remainingCount: remaining, errors };
}
