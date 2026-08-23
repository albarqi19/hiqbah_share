import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSub } from "@/lib/auth-server";
import { handlePrismaError } from "@/lib/api-error";

const VALID_VAT_INVOICE_STATUSES = ["Sent", "Not Yet", "Not Paid"];

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
  const { vatInvoiceStatus } = body as { vatInvoiceStatus?: string };

  if (!vatInvoiceStatus || !VALID_VAT_INVOICE_STATUSES.includes(vatInvoiceStatus)) {
    return NextResponse.json(
      { error: `vatInvoiceStatus must be one of: ${VALID_VAT_INVOICE_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { vatInvoiceStatus },
      include: { customer: true, items: true },
    });
    return NextResponse.json(order);
  } catch (err) {
    return handlePrismaError(err);
  }
}
