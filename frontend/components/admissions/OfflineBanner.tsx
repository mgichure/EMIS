import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const OfflineBanner = () => {
  const { isOnline, isSyncing, pendingItems, processSyncQueue } = useSyncQueue();

  if (isOnline) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <WifiOff className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-orange-800">
          You&apos;re currently offline. {pendingItems?.length || 0} items pending sync.
        </span>
        <div className="flex items-center gap-2">
          {isSyncing && (
            <RefreshCw className="h-4 w-4 animate-spin text-orange-600" />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={processSyncQueue}
            disabled={isSyncing}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
