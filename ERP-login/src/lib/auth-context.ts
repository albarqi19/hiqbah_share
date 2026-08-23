import "server-only";
import { getUserWithPermissions } from "@/lib/auth-server";
import { resolveWorkspace, type AppUserType, type Workspace } from "@/lib/workspace-routing";
import type { Permissions } from "@/lib/auth-shared";

// Server-side auth context contract (S0). Wraps the existing requireAuth /
// getUserWithPermissions guards — does not replace or modify them.
//
// tenantId/branchId are explicitly null: no Tenant/Branch model exists yet in
// this single-tenant system. They must stay null rather than be faked until
// those models are built; do not default them to a placeholder value.
export type AuthContext = {
  userId: string;
  userType: AppUserType;
  tenantId: string | null;
  branchId: string | null;
  roleIds: string[];
  permissions: Permissions;
  sourceInterface: string;
  workspaceRouting: Workspace;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const user = await getUserWithPermissions();
  if (!user) return null;

  // Only one user type is reachable today: the Employee login flow.
  const userType: AppUserType = "TENANT_EMPLOYEE";

  return {
    userId: user.id,
    userType,
    tenantId: null,
    branchId: null,
    roleIds: [user.role],
    permissions: user.permissions,
    sourceInterface: "WEB",
    workspaceRouting: resolveWorkspace(userType).workspace,
  };
}
