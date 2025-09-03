import { useState } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerDescription, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  AlertCircle, 
  FileText, 
  User, 
  Clock, 
  Trash2,
  X
} from 'lucide-react';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { formatDistanceToNow } from 'date-fns';
import { AdmissionApplication, AdmissionDocument } from '@/lib/database';

export const SyncQueueDrawer = () => {
  const { 
    syncQueue, 
    isSyncing, 
    retryItem, 
    clearFailedItems,
    processSyncQueue 
  } = useSyncQueue();

  const [isOpen, setIsOpen] = useState(false);

  const getStatusIcon = (retryCount: number) => {
    if (retryCount === 0) return <Clock className="h-4 w-4 text-blue-500" />;
    if (retryCount < 3) return <AlertCircle className="h-4 w-4 text-orange-500" />;
    return <X className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (retryCount: number) => {
    if (retryCount === 0) return 'Pending';
    if (retryCount < 3) return `Retry ${retryCount}/3`;
    return 'Failed';
  };

  const getStatusColor = (retryCount: number) => {
    if (retryCount === 0) return 'bg-blue-100 text-blue-800';
    if (retryCount < 3) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const pendingCount = syncQueue?.filter(item => item.retryCount < 3).length || 0;
  const failedCount = syncQueue?.filter(item => item.retryCount >= 3).length || 0;

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Queue
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
              {pendingCount}
            </Badge>
          )}
          {failedCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {failedCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Sync Queue</DrawerTitle>
            <DrawerDescription>
              {pendingCount} items pending, {failedCount} failed
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={processSyncQueue} 
                disabled={isSyncing}
                className="flex-1"
              >
                {isSyncing ? 'Syncing...' : 'Sync All'}
              </Button>
              {failedCount > 0 && (
                <Button 
                  variant="outline" 
                  onClick={clearFailedItems}
                  className="flex-1"
                >
                  Clear Failed
                </Button>
              )}
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {syncQueue?.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.type === 'application' ? (
                          <User className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-500" />
                        )}
                        <span className="font-medium capitalize">
                          {item.type} {item.action}
                        </span>
                      </div>
                      <Badge className={getStatusColor(item.retryCount)}>
                        {getStatusIcon(item.retryCount)}
                        <span className="ml-1">{getStatusText(item.retryCount)}</span>
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {item.type === 'application' && (
                        <div>
                          {(item.data as AdmissionApplication).personalInfo?.firstName} {(item.data as AdmissionApplication).personalInfo?.lastName}
                        </div>
                      )}
                      {item.type === 'document' && (
                        <div>{(item.data as AdmissionDocument).name}</div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                      </span>
                      {item.retryCount > 0 && (
                        <span>Attempts: {item.retryCount}/3</span>
                      )}
                    </div>
                    
                    {item.retryCount < 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryItem(item.id!)}
                        className="mt-2 w-full"
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                ))}
                
                {syncQueue?.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No items in sync queue</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
