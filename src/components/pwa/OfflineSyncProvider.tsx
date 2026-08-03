'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { getOfflineQueue, syncOfflineQueue } from '@/lib/services/offline-queue';
import { createTransaction } from '@/lib/services/transactions';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OfflineSyncContextType {
  isOnline: boolean;
  pendingCount: number;
  triggerSync: () => Promise<void>;
  refreshPendingCount: () => void;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  isOnline: true,
  pendingCount: 0,
  triggerSync: async () => {},
  refreshPendingCount: () => {},
});

export function useOfflineSync() {
  return useContext(OfflineSyncContext);
}

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const router = useRouter();

  const refreshPendingCount = useCallback(() => {
    if (typeof window !== 'undefined') {
      setPendingCount(getOfflineQueue().length);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!navigator.onLine) return;

    const queue = getOfflineQueue();
    if (queue.length === 0) {
      setPendingCount(0);
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg(`Syncing ${queue.length} offline record${queue.length > 1 ? 's' : ''}...`);

    try {
      const res = await syncOfflineQueue(createTransaction);
      refreshPendingCount();

      if (res.syncedCount > 0) {
        setSyncStatusMsg(`Successfully synced ${res.syncedCount} offline record${res.syncedCount > 1 ? 's' : ''}!`);
        router.refresh();
        setTimeout(() => {
          setSyncStatusMsg(null);
        }, 4000);
      } else {
        setSyncStatusMsg(null);
      }
    } catch (err) {
      console.error('Auto sync error:', err);
      setSyncStatusMsg('Sync error occurred. Will retry automatically.');
      setTimeout(() => {
        setSyncStatusMsg(null);
      }, 4000);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPendingCount, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      refreshPendingCount();

      const handleOnline = () => {
        setIsOnline(true);
        triggerSync();
      };

      const handleOffline = () => {
        setIsOnline(false);
        refreshPendingCount();
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Initial auto-sync check if online and pending items exist
      if (navigator.onLine) {
        triggerSync();
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [refreshPendingCount, triggerSync]);

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        pendingCount,
        triggerSync,
        refreshPendingCount,
      }}
    >
      {children}

      {/* Floating Status Banners */}
      {!isOnline && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500/90 text-slate-950 font-bold text-xs shadow-xl border border-amber-300/40 backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <WifiOff className="w-4 h-4 stroke-[2.5]" />
          <span>Offline Mode ({pendingCount} pending item{pendingCount === 1 ? '' : 's'})</span>
        </div>
      )}

      {isOnline && isSyncing && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-blue-600 text-white font-bold text-xs shadow-xl border border-blue-400/40 backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {isOnline && !isSyncing && syncStatusMsg && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-600 text-slate-950 font-bold text-xs shadow-xl border border-emerald-400/40 backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 stroke-[3]" />
          <span>{syncStatusMsg}</span>
        </div>
      )}
    </OfflineSyncContext.Provider>
  );
}
