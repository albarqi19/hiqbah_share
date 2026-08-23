import { generateIdempotencyKey } from '@/sync/idempotencyKey';
import { getSourceInterface } from '@/sync/sourceInterface';
import type { OutboxItem } from '@/types/sync';

// In-memory placeholder only — lost on app restart. Real persistence (e.g. a
// local database) and a real sync engine are out of scope for Phase M0.
let items: OutboxItem[] = [];

export function enqueue<TPayload>(payload: TPayload): OutboxItem<TPayload> {
  const item: OutboxItem<TPayload> = {
    id: generateIdempotencyKey(),
    idempotencyKey: generateIdempotencyKey(),
    sourceInterface: getSourceInterface(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    payload,
  };
  items = [...items, item];
  return item;
}

export function peekAll(): OutboxItem[] {
  return items;
}

export function ack(id: string): void {
  items = items.filter((item) => item.id !== id);
}
