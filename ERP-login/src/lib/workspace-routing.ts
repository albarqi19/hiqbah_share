// WorkspaceRoutingService — resolves the destination workspace for an
// authenticated principal. Server-only decision; the client receives the
// result but never supplies or influences it (doc Section 4.5 / R3 / R5).
//
// S0 reality check: today only TENANT_EMPLOYEE is reachable (the Employee
// login flow). The other branches mirror the doc's "initial routing rules"
// verbatim so the mapping is ready the moment those user types/models exist —
// they are not invented speculatively, just not yet wired to a login path.

export type Workspace = "BACK_OFFICE" | "CUSTOMER_PORTAL" | "RESTRICTED";

export type AppUserType =
  | "PLATFORM_ADMIN"
  | "TENANT_EMPLOYEE"
  | "SALES_REP"
  | "B2B_CUSTOMER"
  | "B2C_CUSTOMER"
  | "MYSTERY_SHOPPER"
  | "AUDITOR"
  | "INTEGRATION_PRINCIPAL";

export type WorkspaceRoutingDecision = {
  workspace: Workspace;
};

export function resolveWorkspace(userType: AppUserType): WorkspaceRoutingDecision {
  switch (userType) {
    case "PLATFORM_ADMIN":
    case "TENANT_EMPLOYEE":
    case "SALES_REP":
      return { workspace: "BACK_OFFICE" };
    case "B2B_CUSTOMER":
    case "B2C_CUSTOMER":
      return { workspace: "CUSTOMER_PORTAL" };
    case "AUDITOR":
    case "MYSTERY_SHOPPER":
    case "INTEGRATION_PRINCIPAL":
      return { workspace: "RESTRICTED" };
  }
}
