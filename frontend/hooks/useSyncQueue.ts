import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, SyncQueueItem, isOnline, AdmissionApplication, AdmissionDocument } from '@/lib/database';

export const useSyncQueue = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const syncQueue = useLiveQuery(() => db.syncQueue.toArray());
  const pendingItems = useLiveQuery(() => 
    db.syncQueue.where('retryCount').below(3).toArray()
  );

  const processSyncQueue = useCallback(async () => {
    if (!isOnline() || isSyncing) return;

    setIsSyncing(true);
    const items = await db.syncQueue.where('retryCount').below(3).toArray();

    for (const item of items) {
      try {
        // Simulate API call - replace with actual API endpoints
        const response = await fetch(`/api/admissions/${item.type}s`, {
          method: item.action === 'delete' ? 'DELETE' : 
                  item.action === 'create' ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: item.action !== 'delete' ? JSON.stringify(item.data) : undefined,
        });

        if (response.ok) {
          // Mark as synced and remove from queue
          if (item.type === 'application') {
            const appData = item.data as AdmissionApplication;
            if (appData.id) {
              await db.applications.where('id').equals(appData.id).modify({
                synced: true,
                syncId: response.headers.get('x-sync-id') || undefined
              });
            }
          } else if (item.type === 'document') {
            const docData = item.data as AdmissionDocument;
            if (docData.id) {
              await db.documents.where('id').equals(docData.id).modify({
                synced: true
              });
            }
          }
          
          await db.syncQueue.delete(item.id!);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`Sync failed for ${item.type} ${item.id}:`, error);
        
        // Increment retry count
        await db.syncQueue.update(item.id!, {
          retryCount: item.retryCount + 1,
          lastAttempt: new Date()
        });
      }
    }

    setIsSyncing(false);
    setLastSync(new Date());
  }, [isSyncing]);

  const retryItem = useCallback(async (itemId: string) => {
    const item = await db.syncQueue.get(itemId);
    if (item) {
      await db.syncQueue.update(itemId, {
        retryCount: 0,
        lastAttempt: new Date()
      });
      await processSyncQueue();
    }
  }, [processSyncQueue]);

  const clearFailedItems = useCallback(async () => {
    await db.syncQueue.where('retryCount').aboveOrEqual(3).delete();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      processSyncQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processSyncQueue]);

  // Auto-sync every 30 seconds when online
  useEffect(() => {
    if (!isOnline()) return;

    const interval = setInterval(() => {
      processSyncQueue();
    }, 30000);

    return () => clearInterval(interval);
  }, [processSyncQueue]);

  return {
    syncQueue,
    pendingItems,
    isSyncing,
    lastSync,
    processSyncQueue,
    retryItem,
    clearFailedItems,
    isOnline: isOnline()
  };
};
