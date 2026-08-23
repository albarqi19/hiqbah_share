import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSub } from "@/lib/auth-server";
import { handlePrismaError } from "@/lib/api-error";

const VALID_APPROVAL_STATUSES = ["Pending", "Yes", "No"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSub("orders", "edit");
  if (error) return error;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { approvalStatus } = body as { approvalStatus?: string };

  if (!approvalStatus || !VALID_APPROVAL_STATUSES.includes(approvalStatus)) {
    return NextResponse.json(
      { error: `approvalStatus must be one of: ${VALID_APPROVAL_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        approvalStatus,
        approvalDate: approvalStatus === "Pending" ? null : new Date(),
      },
      include: { customer: true, items: true },
    });
    return NextResponse.json(order);
  } catch (err) {
    return handlePrismaError(err);
  }
}
