// Tags which device interface originated a write, for future backend audit trails.
export type SourceInterface = 'IOS' | 'ANDROID' | 'WEB';

export type OutboxItemStatus = 'pending' | 'syncing' | 'failed' | 'synced';

export interface OutboxItem<TPayload = unknown> {
  id: string;
  idempotencyKey: string;
  sourceInterface: SourceInterface;
  createdAt: string;
  status: OutboxItemStatus;
  payload: TPayload;
}

export type SyncState = 'idle' | 'syncing' | 'error';

export interface SyncStatus {
  state: SyncState;
  lastSyncedAt: string | null;
  lastError: string | null;
}
