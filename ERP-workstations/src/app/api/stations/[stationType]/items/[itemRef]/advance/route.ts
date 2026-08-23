import { NextResponse } from "next/server";
import { requireSub } from "@/lib/auth-server";
import { handlePrismaError } from "@/lib/api-error";
import { advanceItem } from "@/lib/services/workstation-queue-service";

type Params = { params: Promise<{ stationType: string; itemRef: string }> };

// Phase S0: no station has a registered action handler. This route never
// performs a business transition and never calls RoastingService, QCService,
// PackagingService, InventoryService, or OrderService — it always responds
// with a clear "not implemented" result once auth/claim checks pass.
export async function POST(request: Request, { params }: Params) {
  const { user, error } = await requireSub("stations", "advance");
  if (error) return error;

  const { stationType, itemRef } = await params;

  let body: { idempotencyKey?: unknown; action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const idempotencyKey = body.idempotencyKey;
  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return NextResponse.json({ error: "idempotencyKey is required." }, { status: 400 });
  }

  const action = body.action;
  if (!action || typeof action !== "string") {
    return NextResponse.json({ error: "action is required." }, { status: 400 });
  }

  try {
    const result = await advanceItem({
      stationType,
      itemRef,
      actor: { id: user.id, name: user.name },
      idempotencyKey,
      action,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({}, { status: result.status });
  } catch (err) {
    return handlePrismaError(err);
  }
}
