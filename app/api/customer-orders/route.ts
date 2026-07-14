import { prisma } from "@/lib/prisma";
import { HttpError, toErrorResponse } from "@/lib/http-errors";
import { createUnconfirmedOrder } from "@/services/customer-order.service";
import { createCustomerOrderSchema } from "@/lib/validation";

const ACTIVE_SESSION_STATUSES = ["active", "waiting_staff"];

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const qrToken = searchParams.get("qrToken");
    const sessionToken = searchParams.get("sessionToken");

    if (!qrToken)
      throw new HttpError("QR token is required", "QR_TOKEN_REQUIRED", 400);

    const table = await prisma.restaurantTable.findUnique({
      where: { qrCodeToken: qrToken },
    });

    if (!table)
      throw new HttpError("Restaurant table not found", "TABLE_NOT_FOUND", 404);

    const responseInit = {
      headers: {
        "Cache-Control": "no-store",
      },
    };

    if (!sessionToken) {
      return Response.json(
        { tableNumber: table.tableNumber, orders: [] },
        responseInit,
      );
    }

    const session = await prisma.customerSession.findFirst({
      where: {
        sessionToken,
        tableId: table.id,
        status: { in: ACTIVE_SESSION_STATUSES },
      },
      include: {
        orders: {
          include: {
            orderItems: {
              orderBy: { id: "asc" },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!session) {
      return Response.json(
        { tableNumber: table.tableNumber, orders: [] },
        responseInit,
      );
    }

    return Response.json(
      {
        tableNumber: table.tableNumber,
        orders: session.orders.map((order) => ({
          id: order.id,
          status: order.status,
          total: Number(order.total),
          createdAt: order.createdAt,
          tableNumber: table.tableNumber,
          items: order.orderItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: item.quantity,
          })),
        })),
      },
      responseInit,
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = createCustomerOrderSchema.parse(await request.json());

    const { order, sessionToken } = await createUnconfirmedOrder({
      qrToken: body.qrToken,
      sessionToken: body.sessionToken,
      items: body.items,
    });

    return Response.json(
      {
        order,
        sessionToken,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
