import { useAuthStore } from '@/stores/authStore';

export function usePermission() {
  const user = useAuthStore((s) => s.user);

  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const isSuperAdmin = roles.includes('super_admin');

  const has = (perm: string): boolean => {
    if (!perm) return true;
    if (isSuperAdmin) return true;
    return permissions.includes(perm);
  };

  const hasAny = (perms: string[]): boolean => {
    if (!perms?.length) return true;
    if (isSuperAdmin) return true;
    return perms.some((p) => permissions.includes(p));
  };

  const hasAll = (perms: string[]): boolean => {
    if (!perms?.length) return true;
    if (isSuperAdmin) return true;
    return perms.every((p) => permissions.includes(p));
  };

  const hasRole = (role: string): boolean => roles.includes(role);

  return { has, hasAny, hasAll, hasRole, permissions, roles, isSuperAdmin };
}
