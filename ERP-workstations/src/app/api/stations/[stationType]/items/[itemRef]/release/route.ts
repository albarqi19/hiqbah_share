import { NextResponse } from "next/server";
import { requireSub } from "@/lib/auth-server";
import { handlePrismaError } from "@/lib/api-error";
import { releaseClaim } from "@/lib/services/workstation-queue-service";

type Params = { params: Promise<{ stationType: string; itemRef: string }> };

export async function POST(request: Request, { params }: Params) {
  const { user, error } = await requireSub("stations", "claim");
  if (error) return error;

  const { stationType, itemRef } = await params;

  let body: { idempotencyKey?: unknown; supervisorOverride?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const idempotencyKey = body.idempotencyKey;
  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return NextResponse.json({ error: "idempotencyKey is required." }, { status: 400 });
  }

  const wantsOverride = body.supervisorOverride === true;
  if (wantsOverride) {
    const { error: overrideError } = await requireSub("stations", "supervisor_override");
    if (overrideError) return overrideError;
  }

  try {
    const result = await releaseClaim({
      stationType,
      itemRef,
      actor: { id: user.id, name: user.name },
      idempotencyKey,
      supervisorOverride: wantsOverride,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data, { status: result.status });
  } catch (err) {
    return handlePrismaError(err);
  }
}
