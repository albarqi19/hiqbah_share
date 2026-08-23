import type { Permission } from '@/types/auth';

// UI-experience cache only — controls what is shown, not what is allowed.
// The backend RBAC layer remains the real security boundary.
let cachedPermissions: Permission[] = [];

export function getCachedPermissions(): Permission[] {
  return cachedPermissions;
}

export function setCachedPermissions(permissions: Permission[]): void {
  cachedPermissions = permissions;
}

export function hasPermission(permission: Permission): boolean {
  return cachedPermissions.includes(permission);
}
