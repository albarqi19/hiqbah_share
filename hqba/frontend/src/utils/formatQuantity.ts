import type { ItemType } from '@/types';

export function formatQuantity(quantity: number, itemType: ItemType): string {
  switch (itemType) {
    case 'green':
    case 'roasted':
      return `${quantity.toFixed(2)} kg`;
    case 'finished_250':
    case 'finished_500':
    case 'finished_1kg':
      return `${Math.round(quantity)} bags`;
    case 'bar':
      return `${quantity.toFixed(0)} g`;
    default:
      return `${quantity}`;
  }
}
