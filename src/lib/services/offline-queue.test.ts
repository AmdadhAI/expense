import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getOfflineQueue,
  enqueueOfflineTransaction,
  removeOfflineTransaction,
  syncOfflineQueue,
} from './offline-queue';

// Mock localStorage for Vitest node environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('window', {});

describe('offline-queue service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with an empty queue', () => {
    expect(getOfflineQueue()).toEqual([]);
  });

  it('enqueues a new offline transaction correctly', () => {
    const item = {
      request_id: 'test-req-1',
      kind: 'expense' as const,
      amount_decimal: '150.00',
      description: 'Snacks',
      transaction_date: '2026-08-04',
      category_id: 'cat-1',
    };

    const queue = enqueueOfflineTransaction(item);
    expect(queue.length).toBe(1);
    expect(queue[0].description).toBe('Snacks');
    expect(queue[0].request_id).toBe('test-req-1');
  });

  it('prevents duplicate queue items with identical request_id', () => {
    const item = {
      request_id: 'test-req-1',
      kind: 'expense' as const,
      amount_decimal: '150.00',
      description: 'Snacks',
      transaction_date: '2026-08-04',
      category_id: 'cat-1',
    };

    enqueueOfflineTransaction(item);
    const queue = enqueueOfflineTransaction(item);
    expect(queue.length).toBe(1);
  });

  it('removes an item from queue', () => {
    enqueueOfflineTransaction({
      request_id: 'test-req-1',
      kind: 'expense',
      amount_decimal: '100.00',
      description: 'Bus fare',
      transaction_date: '2026-08-04',
      category_id: 'cat-1',
    });

    const queue = removeOfflineTransaction('test-req-1');
    expect(queue.length).toBe(0);
  });

  it('syncs offline items sequentially and removes synced items', async () => {
    enqueueOfflineTransaction({
      request_id: 'test-req-1',
      kind: 'expense',
      amount_decimal: '100.00',
      description: 'Bus fare',
      transaction_date: '2026-08-04',
      category_id: 'cat-1',
    });

    const mockCreate = vi.fn().mockResolvedValue({ id: 'real-tx-1' });

    const result = await syncOfflineQueue(mockCreate);
    expect(result.syncedCount).toBe(1);
    expect(result.remainingCount).toBe(0);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        request_id: 'test-req-1',
        description: 'Bus fare',
      })
    );
  });
});
