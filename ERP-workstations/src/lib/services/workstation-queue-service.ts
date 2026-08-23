// Phase S0 WorkstationQueueService.
//
// Orchestration/projection layer only:
//   - getQueue() reads existing domain tables read-only (no writes, no business rules).
//   - claimItem()/releaseClaim() write only the new WorkItemClaim/WorkstationActionLog
//     tables — they never touch RoastingBatch/QcRecord/etc.
//   - advanceItem() never performs a business transition. No station action is
//     registered in S0, so it always reports "not implemented" — it does not call
//     RoastingService, QCService, PackagingService, InventoryService, or OrderService.
//
// `scope` parameters below are intentionally unused in S0. They exist only so a
// future ScopeContext (tenant/branch) can be threaded through later without
// reshaping these function signatures — see the Phase S0 plan's tenant/branch
// scoping decision.

import { prisma } from "@/lib/db";
import { getStationConfig, parseItemRef, buildItemRef } from "@/lib/workstations/station-registry";

export type ScopeContext = Record<string, never>;

export type Actor = { id: string; name: string };

export type QueueItem = {
  itemRef: string;
  itemType: string;
  itemId: string;
  status: string;
  label: string;
  updatedAt: string;
  claim: {
    claimedById: string;
    claimedByName: string;
    claimedAt: string;
    expiresAt: string | null;
  } | null;
};

export type ServiceErrorCode = "UNKNOWN_STATION_TYPE";

export class WorkstationServiceError extends Error {
  code: ServiceErrorCode;
  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type ActionResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

type ValidationOk = { config: ReturnType<typeof getStationConfig> & object; parsed: { itemType: string; itemId: string } };
type ValidationErr = { error: { status: number; message: string } };

function validateStationAndItem(stationType: string, itemRef: string): ValidationOk | ValidationErr {
  const config = getStationConfig(stationType);
  if (!config) {
    return { error: { status: 400, message: `Unknown station type "${stationType}".` } };
  }

  const parsed = parseItemRef(itemRef);
  if (!parsed) {
    return { error: { status: 400, message: "Invalid item reference." } };
  }

  if (!config.allowedItemTypes.includes(parsed.itemType)) {
    return {
      error: {
        status: 400,
        message: `Item type "${parsed.itemType}" is not valid for station "${stationType}".`,
      },
    };
  }

  return { config, parsed };
}

function isUniqueConstraintError(err: unknown): boolean {
  return !!err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002";
}

async function safeLog(data: {
  stationType: string;
  itemType: string;
  itemId: string;
  action: string;
  fromState?: string | null;
  toState?: string | null;
  employeeId: string;
  employeeName: string;
  idempotencyKey: string;
  status: "SUCCESS" | "REJECTED" | "ERROR";
  reason?: string | null;
}) {
  try {
    await prisma.workstationActionLog.create({ data });
  } catch (err) {
    console.error("[workstation-action-log] failed to write log", err);
  }
}

async function getCachedAction(idempotencyKey: string) {
  return prisma.workstationActionLog.findUnique({ where: { idempotencyKey } });
}

/** The request context an idempotencyKey is scoped to — a replay must match all four fields. */
type RequestContext = { stationType: string; itemType: string; itemId: string; action: string };

function buildRequestContext(stationType: string, itemRef: string, action: string): RequestContext {
  const parsed = parseItemRef(itemRef);
  return {
    stationType,
    itemType: parsed?.itemType ?? "UNKNOWN",
    itemId: parsed?.itemId ?? "UNKNOWN",
    action,
  };
}

function contextMatches(
  cached: { stationType: string; itemType: string; itemId: string; action: string },
  ctx: RequestContext
): boolean {
  return (
    cached.stationType === ctx.stationType &&
    cached.itemType === ctx.itemType &&
    cached.itemId === ctx.itemId &&
    cached.action === ctx.action
  );
}

const IDEMPOTENCY_CONFLICT_MESSAGE = "idempotencyKey already used for a different request.";

/**
 * Looks up an idempotencyKey and either returns a replayed result (only when the
 * cached row matches the current request's stationType/itemType/itemId/action) or
 * a 409 conflict (when the key was reused for a genuinely different request) —
 * never silently replays a mismatched cached payload. Returns null when there is
 * no cached row at all, meaning the caller should proceed normally.
 */
async function checkIdempotency(
  idempotencyKey: string,
  ctx: RequestContext
): Promise<ActionResult<{ itemRef: string }> | null> {
  const cached = await getCachedAction(idempotencyKey);
  if (!cached) return null;

  if (!contextMatches(cached, ctx)) {
    return { ok: false, status: 409, error: IDEMPOTENCY_CONFLICT_MESSAGE };
  }

  const itemRef = buildItemRef(ctx.itemType, ctx.itemId);
  if (cached.status === "SUCCESS") {
    return { ok: true, status: 200, data: { itemRef } };
  }
  if (cached.status === "ERROR") {
    return { ok: false, status: 500, error: cached.reason ?? "An unexpected error occurred for this request." };
  }
  // REJECTED — advance rejections in S0 are always "not implemented"; everything
  // else (claim conflicts, missing claims) is a normal 409/403/404 conflict.
  const status = cached.action.startsWith("ADVANCE:") ? 501 : 409;
  return { ok: false, status, error: cached.reason ?? "Request was previously rejected." };
}

/** Read-only queue projection. Returns [] for any station with no backend model wired yet — never fabricates items. */
export async function getQueue(stationType: string, _scope?: ScopeContext): Promise<QueueItem[]> {
  const config = getStationConfig(stationType);
  if (!config) {
    throw new WorkstationServiceError("UNKNOWN_STATION_TYPE", `Unknown station type "${stationType}".`);
  }

  if (!config.queueSource) return [];

  if (config.queueSource.model === "roastingBatch") {
    const [batches, claims] = await Promise.all([
      prisma.roastingBatch.findMany({
        where: { status: { in: config.queueSource.statusIn } },
        orderBy: { updatedAt: "asc" },
        select: { id: true, batchNumber: true, status: true, updatedAt: true },
      }),
      prisma.workItemClaim.findMany({
        where: { stationType: config.stationType, status: "ACTIVE" },
      }),
    ]);

    const claimByItemId = new Map(claims.map((c) => [c.itemId, c]));

    return batches.map((b) => {
      const claim = claimByItemId.get(b.id);
      return {
        itemRef: buildItemRef("RoastingBatch", b.id),
        itemType: "RoastingBatch",
        itemId: b.id,
        status: b.status,
        label: b.batchNumber,
        updatedAt: b.updatedAt.toISOString(),
        claim: claim
          ? {
              claimedById: claim.claimedById,
              claimedByName: claim.claimedByName,
              claimedAt: claim.claimedAt.toISOString(),
              expiresAt: claim.expiresAt?.toISOString() ?? null,
            }
          : null,
      };
    });
  }

  return [];
}

export async function claimItem(params: {
  stationType: string;
  itemRef: string;
  actor: Actor;
  idempotencyKey: string;
  _scope?: ScopeContext;
}): Promise<ActionResult<{ itemRef: string; status?: string; claimedByName?: string }>> {
  const { stationType, itemRef, actor, idempotencyKey } = params;

  const idempotencyResult = await checkIdempotency(idempotencyKey, buildRequestContext(stationType, itemRef, "CLAIM"));
  if (idempotencyResult) return idempotencyResult;

  const validated = validateStationAndItem(stationType, itemRef);
  if ("error" in validated) {
    await safeLog({
      stationType, itemType: "UNKNOWN", itemId: "UNKNOWN", action: "CLAIM",
      employeeId: actor.id, employeeName: actor.name, idempotencyKey,
      status: "REJECTED", reason: validated.error.message,
    });
    return { ok: false, status: validated.error.status, error: validated.error.message };
  }
  const { config, parsed } = validated;

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.workItemClaim.findUnique({ where: { activeItemRef: itemRef } });

      if (existing && existing.claimedById !== actor.id) {
        const reason = `Already claimed by ${existing.claimedByName}.`;
        await tx.workstationActionLog.create({
          data: {
            stationType, itemType: parsed.itemType, itemId: parsed.itemId, action: "CLAIM",
            employeeId: actor.id, employeeName: actor.name, idempotencyKey,
            status: "REJECTED", reason,
          },
        });
        return { ok: false, status: 409, error: reason };
      }

      if (existing && existing.claimedById === actor.id) {
        await tx.workstationActionLog.create({
          data: {
            stationType, itemType: parsed.itemType, itemId: parsed.itemId, action: "CLAIM",
            fromState: "ACTIVE", toState: "ACTIVE", employeeId: actor.id, employeeName: actor.name,
            idempotencyKey, status: "SUCCESS", reason: "Already held by this operator.",
          },
        });
        return { ok: true, status: 200, data: { itemRef, status: existing.status, claimedByName: existing.claimedByName } };
      }

      const expiresAt = new Date(Date.now() + config.claimTimeoutMinutes * 60_000);
      const created = await tx.workItemClaim.create({
        data: {
          stationType, itemType: parsed.itemType, itemId: parsed.itemId, itemRef, activeItemRef: itemRef,
          claimedById: actor.id, claimedByName: actor.name, status: "ACTIVE", expiresAt,
        },
      });

      await tx.workstationActionLog.create({
        data: {
          stationType, itemType: parsed.itemType, itemId: parsed.itemId, action: "CLAIM",
          toState: "ACTIVE", employeeId: actor.id, employeeName: actor.name,
          idempotencyKey, status: "SUCCESS",
        },
      });

      return { ok: true, status: 201, data: { itemRef, status: created.status, claimedByName: created.claimedByName } };
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      // Lost a concurrent race despite the pre-check — the DB unique constraint on
      // activeItemRef is the real authority here, not the application-level check above.
      const winner = await prisma.workItemClaim.findUnique({ where: { activeItemRef: itemRef } });
      const reason = winner ? `Already claimed by ${winner.claimedByName}.` : "Already claimed by another operator.";
      await safeLog({
        stationType, itemType: parsed.itemType, itemId: parsed.itemId, action: "CLAIM",
        employeeId: actor.id, employeeName: actor.name, idempotencyKey,
        status: "REJECTED", reason,
      });
      return { ok: false, status: 409, error: reason };
    }
    throw err;
  }
}

export async function releaseClaim(params: {
  stationType: string;
  itemRef: string;
  actor: Actor;
  idempotencyKey: string;
  supervisorOverride: boolean;
  _scope?: ScopeContext;
}): Promise<ActionResult<{ itemRef: string; status?: string }>> {
  const { stationType, itemRef, actor, idempotencyKey, supervisorOverride } = params;

  // The action name itself is scoped by whether this request asked for a
  // supervisor override — a plain release and an override-release are
  // different requests and must not share a replayed idempotency result.
  const actionName = supervisorOverride ? "OVERRIDE_RELEASE" : "RELEASE";

  const idempotencyResult = await checkIdempotency(idempotencyKey, buildRequestContext(stationType, itemRef, actionName));
  if (idempotencyResult) return idempotencyResult;

  const validated = validateStationAndItem(stationType, itemRef);
  if ("error" in validated) {
    await safeLog({
      stationType, itemType: "UNKNOWN", itemId: "UNKNOWN", action: actionName,
      employeeId: actor.id, employeeName: actor.name, idempotencyKey,
      status: "REJECTED", reason: validated.error.message,
    });
    return { ok: false, status: validated.error.status, error: validated.error.message };
  }
  const { parsed } = validated;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.workItemClaim.findUnique({ where: { activeItemRef: itemRef } });

    if (!existing) {
      const reason = "No active claim exists for this item.";
      await tx.workstationActionLog.create({
        data: {
          stationType, itemType: parsed.itemType, itemId: parsed.itemId, action: actionName,
          employeeId: actor.id, employeeName: actor.name, idempotencyKey,
          status: "REJECTED", reason,
        },
      });
      return { ok: false, status: 404, error: reason };
    }

    if (existing.claimedById !== actor.id && !supervisorOverride) {
      const reason = `Claim is held by ${existing.claimedByName}; supervisor override required.`;
      await tx.workstationActionLog.create({
        data: {
          stationType, itemType: parsed.itemType, itemId: parsed.itemId, action: actionName,
          employeeId: actor.id, employeeName: actor.name, idempotencyKey,
          status: "REJECTED", reason,
        },
      });
      return { ok: false, status: 403, error: reason };
    }

    const isOverride = supervisorOverride && existing.claimedById !== actor.id;
    const newStatus = isOverride ? "OVERRIDDEN" : "RELEASED";

    await tx.workItemClaim.update({
      where: { id: existing.id },
      data: {
        activeItemRef: null,
        status: newStatus,
        releasedAt: new Date(),
        releasedById: actor.id,
        releasedByName: actor.name,
      },
    });

    await tx.workstationActionLog.create({
      data: {
        stationType, itemType: parsed.itemType, itemId: parsed.itemId, action: actionName,
        fromState: "ACTIVE", toState: newStatus, employeeId: actor.id, employeeName: actor.name,
        idempotencyKey, status: "SUCCESS",
      },
    });

    return { ok: true, status: 200, data: { itemRef, status: newStatus } };
  });
}

export async function advanceItem(params: {
  stationType: string;
  itemRef: string;
  actor: Actor;
  idempotencyKey: string;
  action: string;
  _scope?: ScopeContext;
}): Promise<ActionResult<{ itemRef?: string }>> {
  const { stationType, itemRef, actor, idempotencyKey, action } = params;

  const idempotencyResult = await checkIdempotency(idempotencyKey, buildRequestContext(stationType, itemRef, `ADVANCE:${action}`));
  if (idempotencyResult) return idempotencyResult;

  const validated = validateStationAndItem(stationType, itemRef);
  if ("error" in validated) {
    await safeLog({
      stationType, itemType: "UNKNOWN", itemId: "UNKNOWN", action: `ADVANCE:${action}`,
      employeeId: actor.id, employeeName: actor.name, idempotencyKey,
      status: "REJECTED", reason: validated.error.message,
    });
    return { ok: false, status: validated.error.status, error: validated.error.message };
  }
  const { config, parsed } = validated;

  const claim = await prisma.workItemClaim.findUnique({ where: { activeItemRef: itemRef } });
  if (!claim || claim.claimedById !== actor.id) {
    const reason = "You must hold an active claim on this item before advancing it.";
    await safeLog({
      stationType, itemType: parsed.itemType, itemId: parsed.itemId, action: `ADVANCE:${action}`,
      employeeId: actor.id, employeeName: actor.name, idempotencyKey,
      status: "REJECTED", reason,
    });
    return { ok: false, status: 409, error: reason };
  }

  // No station registers any action handler in Phase S0 — this never performs a
  // business transition and never calls an owning module service.
  const reason = config.actions[action]
    ? "unreachable" // no handler is ever registered in S0
    : `Action "${action}" is not implemented for station "${stationType}" in Phase S0.`;

  await safeLog({
    stationType, itemType: parsed.itemType, itemId: parsed.itemId, action: `ADVANCE:${action}`,
    fromState: claim.status, employeeId: actor.id, employeeName: actor.name, idempotencyKey,
    status: "REJECTED", reason,
  });

  return { ok: false, status: 501, error: reason };
}
