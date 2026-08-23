import type { Session } from '@/types/auth';

// In-memory placeholder only. No persistence, no real login wiring yet.
let currentSession: Session | null = null;

export function getSession(): Session | null {
  return currentSession;
}

export function setSession(session: Session | null): void {
  currentSession = session;
}

export function isAuthenticated(): boolean {
  return currentSession !== null;
}
