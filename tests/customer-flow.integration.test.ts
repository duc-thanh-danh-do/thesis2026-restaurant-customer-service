import assert from "node:assert/strict";
import test from "node:test";
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { POST as createCustomerSessionRoute } from "@/app/api/customer-sessions/route";
import {
  GET as getCustomerSessionRoute,
  PATCH as closeCustomerSessionRoute,
} from "@/app/api/customer-sessions/[sessionToken]/route";
import { GET as getCustomerMessagesRoute } from "@/app/api/customer-sessions/[sessionToken]/messages/route";
import { POST as createCustomerRequestRoute } from "@/app/api/customer-sessions/[sessionToken]/requests/route";
import {
  GET as getCustomerOrdersRoute,
  POST as createCustomerOrderRoute,
} from "@/app/api/customer-orders/route";
import {
  GET as getCustomerOrderRoute,
  PATCH as updateCustomerOrderRoute,
} from "@/app/api/customer-orders/[orderId]/route";
import { POST as sendCustomerChatMessageRoute } from "@/app/api/chat/messages/route";
import {
  getStaffAiLogDetail,
  getStaffAiLogs,
} from "@/lib/staff-page-data";

async function canReachDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function cleanupRestaurantByName(name: string) {
  const restaurants = await prisma.restaurant.findMany({
    where: { name },
    select: { id: true },
  });
  const restaurantIds = restaurants.map((restaurant) => restaurant.id);
  if (restaurantIds.length === 0) return;

  const sessions = await prisma.customerSession.findMany({
    where: { restaurantId: { in: restaurantIds } },
    select: { id: true },
  });
  const sessionIds = sessions.map((session) => session.id);

  const orders = await prisma.order.findMany({
    where: { sessionId: { in: sessionIds } },
    select: { id: true },
  });
  const orderIds = orders.map((order) => order.id);

  await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  await prisma.aiResponseLog.deleteMany({ where: { sessionId: { in: sessionIds } } });
  await prisma.customerRequest.deleteMany({ where: { sessionId: { in: sessionIds } } });
  await prisma.chatMessage.deleteMany({ where: { sessionId: { in: sessionIds } } });
  await prisma.customerSession.deleteMany({ where: { id: { in: sessionIds } } });
  await prisma.diningSession.deleteMany({ where: { restaurantId: { in: restaurantIds } } });
  await prisma.menuItem.deleteMany({ where: { restaurantId: { in: restaurantIds } } });
  await prisma.restaurantKnowledgeBase.deleteMany({ where: { restaurantId: { in: restaurantIds } } });
  await prisma.$executeRawUnsafe(
    `DELETE FROM "handover_rules" WHERE "restaurant_id" IN (${restaurantIds.join(",")})`,
  ).catch(() => undefined);
  await prisma.staffUser.deleteMany({ where: { restaurantId: { in: restaurantIds } } });
  await prisma.restaurantTable.deleteMany({ where: { restaurantId: { in: restaurantIds } } });
  await prisma.restaurant.deleteMany({ where: { id: { in: restaurantIds } } });
}

test("customer table flow persists session, messages, requests, orders, and closure", async (t) => {
  if (!(await canReachDatabase())) {
    t.skip("Database is unavailable; skipping database-backed integration test.");
    return;
  }

  const runId = `integration-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const restaurantName = `Integration Test Restaurant ${runId}`;
  const otherRestaurantName = `Other Integration Restaurant ${runId}`;
  const qrCodeToken = `qr-${runId}`;

  await cleanupRestaurantByName(restaurantName);
  t.after(async () => {
    await cleanupRestaurantByName(restaurantName);
    await cleanupRestaurantByName(otherRestaurantName);
  });

  const restaurant = await prisma.restaurant.create({
    data: {
      name: restaurantName,
      description: "Temporary restaurant for customer-flow integration testing.",
      address: "Integration Street 1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const table = await prisma.restaurantTable.create({
    data: {
      restaurantId: restaurant.id,
      tableNumber: "INT-1",
      qrCodeToken,
      isActive: true,
      createdAt: new Date(),
    },
  });

  const concurrentTable = await prisma.restaurantTable.create({
    data: {
      restaurantId: restaurant.id,
      tableNumber: "INT-CONCURRENT",
      qrCodeToken: `qr-concurrent-${runId}`,
      isActive: true,
      createdAt: new Date(),
    },
  });
  const concurrentSessionResponses = await Promise.all(
    Array.from({ length: 5 }, () =>
      createCustomerSessionRoute(
        new Request("http://localhost/api/customer-sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ qrCodeToken: concurrentTable.qrCodeToken }),
        }),
      ),
    ),
  );
  assert.ok(concurrentSessionResponses.every((response) => response.status === 201));
  assert.equal(
    await prisma.diningSession.count({
      where: {
        tableId: concurrentTable.id,
        status: { in: ["active", "waiting_staff"] },
      },
    }),
    1,
  );

  const menuItem = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      name: `Integration Pizza ${runId}`,
      description: "Pizza created by the integration test.",
      category: "Pizza",
      price: 12.5,
      ingredients: "Dough, tomato, cheese",
      dietary: "VEGETARIAN",
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const createSessionResponse = await createCustomerSessionRoute(
    new Request("http://localhost/api/customer-sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ qrCodeToken }),
    }),
  );
  const createSessionBody = await createSessionResponse.json();
  const sessionToken = createSessionBody.sessionToken as string;

  assert.equal(createSessionResponse.status, 201);
  assert.match(sessionToken, /^sess_/);
  assert.equal(createSessionBody.restaurant.name, restaurantName);
  assert.equal(createSessionBody.table.id, table.id);

  const createdSession = await prisma.customerSession.findUnique({
    where: { sessionToken },
  });
  assert.ok(createdSession);
  assert.equal(createdSession.status, "active");

  await prisma.chatMessage.createMany({
    data: [
      {
        sessionId: createdSession.id,
        senderType: "customer",
        messageContent: "Can I get some water?",
        createdAt: new Date(),
      },
      {
        sessionId: createdSession.id,
        senderType: "staff",
        messageContent: "Of course.",
        createdAt: new Date(),
      },
    ],
  });

  const messagesResponse = await getCustomerMessagesRoute(
    new Request(`http://localhost/api/customer-sessions/${sessionToken}/messages`),
    { params: Promise.resolve({ sessionToken }) },
  );
  const messagesBody = await messagesResponse.json();

  assert.equal(messagesResponse.status, 200);
  assert.equal(messagesBody.messages.length, 2);
  assert.equal(messagesBody.messages[0].messageContent, "Can I get some water?");

  const requestResponse = await createCustomerRequestRoute(
    new Request(`http://localhost/api/customer-sessions/${sessionToken}/requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestType: "staff_help",
        description: "Customer needs help with an allergy question.",
      }),
    }),
    { params: Promise.resolve({ sessionToken }) },
  );
  const requestBody = await requestResponse.json();

  assert.equal(requestResponse.status, 201);
  assert.equal(requestBody.request.sessionId, createdSession.id);
  assert.equal(requestBody.request.status, "pending");

  const previousGeminiApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "";
  let handoverResponse: Response | null = null;
  try {
    handoverResponse = await sendCustomerChatMessageRoute(
      new Request("http://localhost/api/chat/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          qrToken: qrCodeToken,
          sessionToken,
          message: "I have a peanut allergy. Is this pizza safe for me?",
        }),
      }),
    );
  } finally {
    if (previousGeminiApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = previousGeminiApiKey;
    }
  }
  assert.ok(handoverResponse);
  const handoverBody = await handoverResponse.json();

  assert.equal(handoverResponse.status, 200);
  assert.equal(handoverBody.handoverRequired, true);
  assert.equal(handoverBody.sessionStatus, "waiting_staff");
  assert.ok(handoverBody.requestId);
  assert.match(handoverBody.reply, /staff/i);

  const handoverRequest = await prisma.customerRequest.findUnique({
    where: { id: handoverBody.requestId },
  });
  assert.equal(handoverRequest?.requestType, "allergy_confirmation");
  assert.equal(handoverRequest?.status, "pending");

  const waitingSession = await prisma.customerSession.findUnique({
    where: { sessionToken },
  });
  assert.equal(waitingSession?.status, "waiting_staff");
  const waitingDiningSession = await prisma.diningSession.findUnique({
    where: { id: createdSession.diningSessionId },
  });
  assert.equal(waitingDiningSession?.status, "waiting_staff");

  const otherRestaurant = await prisma.restaurant.create({
    data: {
      name: otherRestaurantName,
      description: "Separate tenant for AI-log isolation testing.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const aiLog = await prisma.aiResponseLog.findFirst({
    where: { sessionId: createdSession.id },
    orderBy: { id: "desc" },
  });
  assert.ok(aiLog);
  assert.ok(await getStaffAiLogDetail(aiLog.id, restaurant.id));
  assert.equal(await getStaffAiLogDetail(aiLog.id, otherRestaurant.id), null);
  assert.equal((await getStaffAiLogs(otherRestaurant.id)).length, 0);

  const orderResponse = await createCustomerOrderRoute(
    new Request("http://localhost/api/customer-orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        qrToken: qrCodeToken,
        sessionToken,
        items: { [menuItem.id]: 2 },
      }),
    }),
  );
  const orderBody = await orderResponse.json();

  assert.equal(orderResponse.status, 201);
  assert.equal(orderBody.sessionToken, sessionToken);
  assert.equal(orderBody.order.orderItems.length, 1);
  assert.equal(Number(orderBody.order.total), 25);

  const otherTable = await prisma.restaurantTable.create({
    data: {
      restaurantId: restaurant.id,
      tableNumber: "INT-2",
      qrCodeToken: `qr-other-${runId}`,
      isActive: true,
      createdAt: new Date(),
    },
  });
  const attackerSessionResponse = await createCustomerSessionRoute(
    new Request("http://localhost/api/customer-sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ qrCodeToken: otherTable.qrCodeToken }),
    }),
  );
  const attackerSessionBody = await attackerSessionResponse.json();
  const attackerSessionToken = attackerSessionBody.sessionToken as string;

  const missingOwnerTokenResponse = await getCustomerOrderRoute(
    new Request(`http://localhost/api/customer-orders/${orderBody.order.id}`),
    { params: Promise.resolve({ orderId: String(orderBody.order.id) }) },
  );
  assert.equal(missingOwnerTokenResponse.status, 400);

  const crossTableReadResponse = await getCustomerOrderRoute(
    new Request(
      `http://localhost/api/customer-orders/${orderBody.order.id}?sessionToken=${attackerSessionToken}`,
    ),
    { params: Promise.resolve({ orderId: String(orderBody.order.id) }) },
  );
  assert.equal(crossTableReadResponse.status, 404);

  const crossTableUpdateResponse = await updateCustomerOrderRoute(
    new Request(`http://localhost/api/customer-orders/${orderBody.order.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "confirm",
        sessionToken: attackerSessionToken,
      }),
    }),
    { params: Promise.resolve({ orderId: String(orderBody.order.id) }) },
  );
  assert.equal(crossTableUpdateResponse.status, 404);

  const ownerUpdateResponse = await updateCustomerOrderRoute(
    new Request(`http://localhost/api/customer-orders/${orderBody.order.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "confirm", sessionToken }),
    }),
    { params: Promise.resolve({ orderId: String(orderBody.order.id) }) },
  );
  const ownerUpdateBody = await ownerUpdateResponse.json();
  assert.equal(ownerUpdateResponse.status, 200);
  assert.equal(ownerUpdateBody.order.status, "placed");

  const ordersResponse = await getCustomerOrdersRoute(
    new Request(
      `http://localhost/api/customer-orders?qrToken=${qrCodeToken}&sessionToken=${sessionToken}`,
    ),
  );
  const ordersBody = await ordersResponse.json();

  assert.equal(ordersResponse.status, 200);
  assert.equal(ordersBody.tableNumber, table.tableNumber);
  assert.equal(ordersBody.orders.length, 1);
  assert.equal(ordersBody.orders[0].items[0].quantity, 2);

  const getSessionResponse = await getCustomerSessionRoute(
    new Request(`http://localhost/api/customer-sessions/${sessionToken}`),
    { params: Promise.resolve({ sessionToken }) },
  );
  const getSessionBody = await getSessionResponse.json();

  assert.equal(getSessionResponse.status, 200);
  assert.equal(getSessionBody.session.customerRequests.length, 2);
  assert.equal(getSessionBody.session.chatMessages.length, 4);

  const closeSessionResponse = await closeCustomerSessionRoute(
    new Request(`http://localhost/api/customer-sessions/${sessionToken}`, {
      method: "PATCH",
    }),
    { params: Promise.resolve({ sessionToken }) },
  );
  const closeSessionBody = await closeSessionResponse.json();

  assert.equal(closeSessionResponse.status, 200);
  assert.equal(closeSessionBody.session.status, "closed");

  const closedSession = await prisma.customerSession.findUnique({
    where: { sessionToken },
  });
  assert.equal(closedSession?.status, "closed");
  assert.ok(closedSession?.endedAt);

  const closedSessionRequestResponse = await createCustomerRequestRoute(
    new Request(`http://localhost/api/customer-sessions/${sessionToken}/requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestType: "staff_help" }),
    }),
    { params: Promise.resolve({ sessionToken }) },
  );
  assert.equal(closedSessionRequestResponse.status, 409);
});
