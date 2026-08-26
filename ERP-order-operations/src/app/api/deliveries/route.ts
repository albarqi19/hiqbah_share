import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireModule, requireSub } from "@/lib/auth-server";
import { handlePrismaError } from "@/lib/api-error";
import { recalcOrderItemStatus } from "@/lib/services/order-fulfillment";
import { consumeShelfStock, roundKg, trimReservationToDemand } from "@/lib/services/shelf-allocation";

export async function GET() {
  const { error } = await requireModule("dispatch");
  if (error) return error;

  const deliveries = await prisma.delivery.findMany({
    orderBy: { date: "desc" },
    take: 500,
    include: {
      orderItem: { include: { order: { include: { customer: true } } } },
    },
  });
  return NextResponse.json(deliveries);
}

export async function POST(request: Request) {
  const { error, user } = await requireSub("dispatch", "mark_delivered");
  if (error) return error;

  const data = await request.json();
  const { orderItemId, quantityKg, deliveryType, notes, finishedGoodsLotId } = data;

  if (!finishedGoodsLotId) {
    return NextResponse.json(
      { error: "A finished goods lot is required for all deliveries." },
      { status: 400 }
    );
  }

  try {
    const delivery = await prisma.$transaction(async (tx) => {
      const orderItem = await tx.orderItem.findUnique({ where: { id: orderItemId } });
      if (!orderItem) throw { _appCode: 404, message: "Order item not found" };

      const qty = roundKg(Number(quantityKg));
      if (!Number.isFinite(qty) || qty <= 0) {
        throw { _appCode: 400, message: "quantityKg must be a positive number." };
      }

      // Eligibility is a property of the SHELF, not of this order item's own roasting
      // history. The previous rule measured packaged bags of batches belonging to this
      // order item and then deducted from whichever lot the operator picked — so a new
      // order could never draw on a full shelf, while a delivery that did pass could
      // reduce a lot the check never looked at. Both halves now speak about the same
      // kilograms: the lot must actually be able to cover the shipment.
      const outstanding = +(orderItem.quantityKg - orderItem.deliveredQty).toFixed(3);
      if (outstanding <= 0) {
        throw { _appCode: 400, message: "This order item has already been delivered in full." };
      }
      if (qty > outstanding) {
        throw {
          _appCode: 400,
          message: `Cannot deliver ${qty}kg. Only ${outstanding}kg of this order item is still undelivered.`,
        };
      }

      // Validate FGL existence upfront (fail-fast, before any writes). Quantity is NOT read here;
      // it is checked atomically in the conditional update below.
      if (finishedGoodsLotId) {
        const lot = await tx.finishedGoodsLot.findUnique({
          where: { id: finishedGoodsLotId },
          select: {
            id: true,
            productId: true,
            productSkuId: true,
            roastingBatch: { select: { orderItemId: true } },
          },
        });
        if (!lot) throw { _appCode: 404, message: "Finished goods lot not found." };

        // Dual-path match: by product when the order item has one, otherwise by the
        // batch this lot was packaged from (every RoastingBatch belongs to one OrderItem).
        const productMatches = orderItem.productId
          ? lot.productId === orderItem.productId
          : lot.roastingBatch?.orderItemId === orderItem.id;

        // SKU is only enforced when both sides specify one — legacy/incomplete rows
        // with a null SKU on either side are not rejected on that basis alone.
        const skuMatches =
          !orderItem.productSkuId || !lot.productSkuId || lot.productSkuId === orderItem.productSkuId;

        if (!productMatches || !skuMatches) {
          throw { _appCode: 409, message: "Selected finished goods lot does not match this order item." };
        }
      }

      // 1. Create delivery record — needed first so its ID is available for the ledger
      const newDelivery = await tx.delivery.create({
        data: { orderItemId, quantityKg: qty, deliveryType, notes },
      });

      // 2. Update delivery tracking on the order item.
      //    Conditional increment: the `outstanding` check above was an unlocked read, so
      //    two dispatchers submitting the same shipment at once would both pass it. The
      //    WHERE clause re-checks the ceiling at write time and the count tells us who won.
      const claimed = await tx.orderItem.updateMany({
        where: { id: orderItemId, deliveredQty: { lte: roundKg(orderItem.quantityKg - qty) } },
        data: { deliveredQty: { increment: qty } },
      });
      if (claimed.count === 0) {
        throw {
          _appCode: 409,
          message: "This order item was delivered by someone else while this delivery was being recorded. Please reload and retry.",
        };
      }
      const updatedItem = await tx.orderItem.findUniqueOrThrow({
        where: { id: orderItemId },
        select: { deliveredQty: true, quantityKg: true },
      });
      const newDeliveryStatus = updatedItem.quantityKg - updatedItem.deliveredQty <= 0
        ? "Delivered"
        : "Partial Delivered";
      await tx.orderItem.update({
        where: { id: orderItemId },
        data: { deliveryStatus: newDeliveryStatus },
      });

      // 3. Ship the kilograms off the shelf. consumeShelfStock draws down this item's own
      //    reservation first and only touches free stock for the remainder, so a delivery
      //    can never ship coffee that is promised to a different order.
      const shipped = await consumeShelfStock(tx, orderItem, finishedGoodsLotId, qty, user.id);
      if (!shipped) {
        throw {
          _appCode: 409,
          message: "Insufficient free quantity on the selected finished goods lot — it may be reserved for another order.",
        };
      }

      const newLotStatus = shipped.newQuantity <= 0 ? "SHIPPED" : "AVAILABLE";
      await tx.finishedGoodsLot.update({
        where: { id: finishedGoodsLotId },
        data: { status: newLotStatus },
      });

      await tx.inventoryMovement.create({
        data: {
          type: "OUT",
          category: "FINISHED_GOODS",
          referenceEntityId: finishedGoodsLotId,
          quantityChanged: -qty,
          previousQuantity: shipped.previousQuantity,
          newQuantity: shipped.newQuantity,
          sourceDocType: "DELIVERY",
          sourceDocId: newDelivery.id,
          userId: user.id,
          notes: null,
        },
      });

      // 4. Hand back any promise this item no longer needs. An item may hold reservations
      //    on several lots while a delivery draws on only one of them; without this the
      //    leftovers stay promised to an order that is already satisfied, and the coffee
      //    behind them is invisible to every other order forever.
      await trimReservationToDemand(tx, {
        ...orderItem,
        deliveredQty: updatedItem.deliveredQty,
      });

      // 5. Recalculate productionStatus + remainingQty (reads the new deliveredQty committed above)
      await recalcOrderItemStatus(orderItemId, tx);

      return newDelivery;
    });

    return NextResponse.json(delivery, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "_appCode" in err) {
      const e = err as { _appCode: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e._appCode });
    }
    return handlePrismaError(err);
  }
}
