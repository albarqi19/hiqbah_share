import { useState } from 'react';

export type ConnectivityState = 'online' | 'offline' | 'unknown';

// Placeholder: real network detection requires a NetInfo-style dependency,
// which is not added in Phase M0 without explicit approval. Always reports
// 'unknown' until that decision is made.
export function useConnectivity(): ConnectivityState {
  const [state] = useState<ConnectivityState>('unknown');
  return state;
}
