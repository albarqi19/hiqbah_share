import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSub } from "@/lib/auth-server";
import { handlePrismaError } from "@/lib/api-error";

const VALID_PAYMENT_STATUSES = ["Paid", "Not Paid", "Partial Paid"];

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
  const { paymentStatus } = body as { paymentStatus?: string };

  if (!paymentStatus || !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
    return NextResponse.json(
      { error: `paymentStatus must be one of: ${VALID_PAYMENT_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { paymentStatus },
      include: { customer: true, items: true },
    });
    return NextResponse.json(order);
  } catch (err) {
    return handlePrismaError(err);
  }
}
