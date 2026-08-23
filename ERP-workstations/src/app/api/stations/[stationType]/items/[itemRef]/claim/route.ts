import { NextResponse } from "next/server";
import { requireSub } from "@/lib/auth-server";
import { handlePrismaError } from "@/lib/api-error";
import { claimItem } from "@/lib/services/workstation-queue-service";

type Params = { params: Promise<{ stationType: string; itemRef: string }> };

export async function POST(request: Request, { params }: Params) {
  const { user, error } = await requireSub("stations", "claim");
  if (error) return error;

  const { stationType, itemRef } = await params;

  let body: { idempotencyKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const idempotencyKey = body.idempotencyKey;
  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    return NextResponse.json({ error: "idempotencyKey is required." }, { status: 400 });
  }

  try {
    const result = await claimItem({
      stationType,
      itemRef,
      actor: { id: user.id, name: user.name },
      idempotencyKey,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.data, { status: result.status });
  } catch (err) {
    return handlePrismaError(err);
  }
}
