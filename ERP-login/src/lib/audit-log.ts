import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { hashRateLimitKey } from "@/lib/rate-limit";

// AuthAuditLog writer. Never stores raw IP, identity, password, PIN, or token —
// only HMAC hashes (same pepper/algorithm as LoginAttempt/RateLimit) plus
// non-sensitive metadata. A write failure must never break the auth flow it's
// observing (S0 requirement), so this function never throws.

export type AuthAction = "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT";
export type AuthResult = "SUCCESS" | "FAILURE";

export type AuthAuditEvent = {
  userId?: string | null;
  /** Raw identifier (e.g. "pwd:ahmed" or "pin:1234") — hashed before storage, never stored raw. */
  identifier?: string | null;
  action: AuthAction;
  result: AuthResult;
  reasonCode?: string | null;
  sourceInterface?: string;
  workspaceRouting?: string | null;
  /** Raw IP — hashed before storage, never stored raw. */
  ip: string;
  userAgent?: string | null;
  /** Non-sensitive context only. Never include passwords, PINs, tokens, or full request bodies. */
  metadata?: Prisma.InputJsonValue | null;
};

export async function recordAuthEvent(event: AuthAuditEvent): Promise<void> {
  try {
    await prisma.authAuditLog.create({
      data: {
        userId: event.userId ?? null,
        identifierHash: event.identifier ? hashRateLimitKey(event.identifier) : null,
        action: event.action,
        result: event.result,
        reasonCode: event.reasonCode ?? null,
        sourceInterface: event.sourceInterface ?? "WEB",
        workspaceRouting: event.workspaceRouting ?? null,
        ipHash: hashRateLimitKey(event.ip),
        userAgent: event.userAgent ?? null,
        metadata: event.metadata ?? undefined,
      },
    });
  } catch (err) {
    // Audit-write failure must not block login/logout. No secrets in this line.
    console.error("[audit-log] failed to record auth event:", event.action, err);
  }
}
