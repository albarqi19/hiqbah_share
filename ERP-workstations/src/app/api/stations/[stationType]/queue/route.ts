import { NextResponse } from "next/server";
import { requireModule } from "@/lib/auth-server";
import { handlePrismaError } from "@/lib/api-error";
import { getQueue, WorkstationServiceError } from "@/lib/services/workstation-queue-service";

type Params = { params: Promise<{ stationType: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireModule("stations");
  if (error) return error;

  const { stationType } = await params;

  try {
    const items = await getQueue(stationType);
    return NextResponse.json({ stationType, items });
  } catch (err) {
    if (err instanceof WorkstationServiceError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return handlePrismaError(err);
  }
}
