import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-errors";
import {
  confirmOrder,
  serializeOrderDraft,
  updateDraftOrderItemQuantity,
} from "@/services/customer-order.service";
import { updateCustomerOrderSchema } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const parsedOrderId = Number(orderId);

    if (!Number.isInteger(parsedOrderId)) {
      throw new HttpError("Invalid order id", "INVALID_ORDER_ID", 400);
    }

    const sessionToken = new URL(request.url).searchParams.get("sessionToken")?.trim();
    if (!sessionToken) {
      throw new HttpError("Session token is required", "SESSION_TOKEN_REQUIRED", 400);
    }

    const order = await prisma.order.findFirst({
      where: {
        id: parsedOrderId,
        session: { sessionToken },
      },
      include: {
        orderItems: {
          orderBy: { id: "asc" },
        },
        session: {
          include: {
            table: true,
          },
        },
      },
    });

    if (!order) throw new HttpError("Order not found", "ORDER_NOT_FOUND", 404);

    return Response.json({
      order: {
        id: order.id,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt,
        tableNumber: order.session.table.tableNumber,
        items: order.orderItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
        })),
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const parsedOrderId = Number(orderId);
    if (!Number.isInteger(parsedOrderId)) {
      throw new HttpError("Invalid order id", "INVALID_ORDER_ID", 400);
    }
    const body = updateCustomerOrderSchema.parse(await request.json());

    if (body.action === "confirm") {
      const order = await confirmOrder(parsedOrderId, body.sessionToken);

      return Response.json({
        order: serializeOrderDraft(order),
      });
    }

    if (body.action === "update_item_quantity") {
      const order = await updateDraftOrderItemQuantity({
        orderId: parsedOrderId,
        itemId: body.itemId,
        quantity: body.quantity,
        sessionToken: body.sessionToken,
      });

      return Response.json({
        order: serializeOrderDraft(order),
      });
    }

    throw new HttpError("Unsupported order action", "UNSUPPORTED_ORDER_ACTION", 400);
  } catch (error) {
    return toErrorResponse(error);
  }
}
