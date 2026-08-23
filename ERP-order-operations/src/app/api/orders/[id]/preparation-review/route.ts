import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSub } from "@/lib/auth-server";
import { handlePrismaError } from "@/lib/api-error";
import {
  appendOrderActivity,
  aggregatePreparationStatus,
  isPreparationDecision,
  PREPARATION_REVIEW_ENTRY_STATUSES,
  validatePreparationQuantities,
  roundKg,
  NOTE_MESSAGE_MAX_LENGTH,
  type PreparationDecision,
} from "@/lib/services/order-operations";

type Params = { params: Promise<{ id: string }> };

type RawItem = {
  orderItemId?: unknown;
  decision?: unknown;
  availableQuantity?: unknown;
  productionRequiredQuantity?: unknown;
};

type ParsedItem = {
  orderItemId: string;
  decision: PreparationDecision;
  availableQuantity: number | null;
  productionRequiredQuantity: number | null;
};

const ENTRY_STATUSES = PREPARATION_REVIEW_ENTRY_STATUSES as string[];

export async function POST(request: Request, { params }: Params) {
  const { user, error } = await requireSub("orders", "prepare_review");
  if (error) return error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { items, note } = (body ?? {}) as { items?: unknown; note?: unknown };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items must be a non-empty array." }, { status: 400 });
  }

  const trimmedNote = typeof note === "string" ? note.trim() : "";
  if (trimmedNote.length > NOTE_MESSAGE_MAX_LENGTH) {
    return NextResponse.json(
      { error: `note must be at most ${NOTE_MESSAGE_MAX_LENGTH} characters.` },
      { status: 400 }
    );
  }

  // Structural + value validation of every submitted item before any DB access.
  const seenIds = new Set<string>();
  const parsedItems: ParsedItem[] = [];

  for (const raw of items as RawItem[]) {
    if (typeof raw.orderItemId !== "string" || !raw.orderItemId) {
      return NextResponse.json({ error: "Each item requires a valid orderItemId." }, { status: 400 });
    }
    if (seenIds.has(raw.orderItemId)) {
      return NextResponse.json(
        { error: `Duplicate orderItemId in request: ${raw.orderItemId}` },
        { status: 400 }
      );
    }
    seenIds.add(raw.orderItemId);

    const decisionValue = raw.decision;
    if (!isPreparationDecision(decisionValue)) {
      return NextResponse.json(
        {
          error: `Invalid decision for item ${raw.orderItemId}. Must be one of: Available on Shelf, Needs Production, Partially Available, Blocked.`,
        },
        { status: 400 }
      );
    }

    let availableQuantity: number | null = null;
    if (raw.availableQuantity !== undefined && raw.availableQuantity !== null && raw.availableQuantity !== "") {
      const n = Number(raw.availableQuantity);
      if (!Number.isFinite(n)) {
        return NextResponse.json(
          { error: `availableQuantity for item ${raw.orderItemId} must be a number.` },
          { status: 400 }
        );
      }
      availableQuantity = n;
    }

    let productionRequiredQuantity: number | null = null;
    if (
      raw.productionRequiredQuantity !== undefined &&
      raw.productionRequiredQuantity !== null &&
      raw.productionRequiredQuantity !== ""
    ) {
      const n = Number(raw.productionRequiredQuantity);
      if (!Number.isFinite(n)) {
        return NextResponse.json(
          { error: `productionRequiredQuantity for item ${raw.orderItemId} must be a number.` },
          { status: 400 }
        );
      }
      productionRequiredQuantity = n;
    }

    parsedItems.push({
      orderItemId: raw.orderItemId,
      decision: decisionValue,
      availableQuantity,
      productionRequiredQuantity,
    });
  }

  if (parsedItems.some((i) => i.decision === "Blocked") && !trimmedNote) {
    return NextResponse.json(
      { error: "note is required when any item is marked Blocked." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          items: { select: { id: true, quantityKg: true } },
        },
      });
      if (!order) throw { _appCode: 404, message: "Order not found." };

      if (!ENTRY_STATUSES.includes(order.status)) {
        throw {
          _appCode: 409,
          message: `Preparation review is not allowed while the order is in status "${order.status}".`,
        };
      }

      const itemsById = new Map(order.items.map((i) => [i.id, i]));
      for (const p of parsedItems) {
        if (!itemsById.has(p.orderItemId)) {
          throw { _appCode: 400, message: `Order item ${p.orderItemId} does not belong to this order.` };
        }
      }

      for (const p of parsedItems) {
        const item = itemsById.get(p.orderItemId)!;
        const validationError = validatePreparationQuantities(
          p.decision,
          item.quantityKg,
          p.availableQuantity,
          p.productionRequiredQuantity
        );
        if (validationError) {
          throw { _appCode: 400, message: `Item ${p.orderItemId}: ${validationError}` };
        }
      }

      for (const p of parsedItems) {
        await tx.orderItem.update({
          where: { id: p.orderItemId },
          data: {
            preparationDecision: p.decision,
            // Stored at the same 3-decimal-place precision used to validate them, so the
            // persisted row can never drift from what was actually checked above.
            availableQuantity: p.availableQuantity === null ? null : roundKg(p.availableQuantity),
            productionRequiredQuantity:
              p.productionRequiredQuantity === null ? null : roundKg(p.productionRequiredQuantity),
            // productionStatus, deliveryStatus, remainingQty intentionally omitted —
            // these remain system-derived (recalcOrderItemStatus) and must never be
            // written by preparation review.
          },
        });
      }

      const refreshedItems = await tx.orderItem.findMany({
        where: { orderId: id },
        select: { preparationDecision: true },
      });
      const newStatus = aggregatePreparationStatus(refreshedItems);

      // Conditional guard: only applies if the order is still in an entry status we
      // already verified above. Catches a concurrent Hold/Cancel that landed between
      // our read and this write.
      const updateResult = await tx.order.updateMany({
        where: { id, status: { in: ENTRY_STATUSES } },
        data: { status: newStatus },
      });
      if (updateResult.count === 0) {
        throw { _appCode: 409, message: "Order status changed during review. Please reload and retry." };
      }

      await appendOrderActivity(tx, {
        orderId: id,
        type: "PREPARATION_REVIEWED",
        message: `Preparation review submitted by ${user.name} for ${parsedItems.length} item(s). Order status set to ${newStatus}.`,
        department: "Preparation",
        authorId: user.id,
        authorName: user.name,
        metadata: {
          items: parsedItems.map((p) => ({
            orderItemId: p.orderItemId,
            decision: p.decision,
            availableQuantity: p.availableQuantity,
            productionRequiredQuantity: p.productionRequiredQuantity,
          })),
        },
      });

      if (trimmedNote) {
        await appendOrderActivity(tx, {
          orderId: id,
          type: "MANUAL_NOTE",
          message: trimmedNote,
          department: "Preparation",
          authorId: user.id,
          authorName: user.name,
        });
      }

      return tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          items: {
            select: {
              id: true,
              preparationDecision: true,
              availableQuantity: true,
              productionRequiredQuantity: true,
            },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "_appCode" in err) {
      const e = err as { _appCode: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e._appCode });
    }
    return handlePrismaError(err);
  }
}
