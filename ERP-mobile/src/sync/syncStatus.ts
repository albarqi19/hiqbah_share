import type { SyncStatus } from '@/types/sync';

// In-memory placeholder only. No real sync engine yet.
let status: SyncStatus = { state: 'idle', lastSyncedAt: null, lastError: null };

export function getSyncStatus(): SyncStatus {
  return status;
}

export function setSyncStatus(next: SyncStatus): void {
  status = next;
}
