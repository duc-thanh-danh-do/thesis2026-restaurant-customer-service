import { prisma } from "@/lib/prisma";
import {
  fallbackKnowledgeBase,
  fallbackRestaurant,
  fallbackTables,
  isDatabaseUnavailable,
} from "@/lib/fallback-data";

const fallbackStartedAt = new Date(Date.now() - 23 * 60 * 1000);

export function canUseDemoStaffData() {
  return process.env.NODE_ENV !== "production" && process.env.DISABLE_STAFF_DEMO_DATA !== "true";
}

export type StaffSessionSummary = {
  id: number;
  tableNumber: string;
  status: string;
  startedAt: Date | null;
  endedAt: Date | null;
  lastMessage: string;
  requestCount: number;
  orderCount: number;
  handoverCount: number;
};

export type StaffSessionDetail = StaffSessionSummary & {
  restaurantName: string;
  messages: Array<{
    id: number;
    senderType: string;
    messageContent: string;
    createdAt: Date | null;
  }>;
  requests: Array<{
    id: number;
    requestType: string;
    status: string;
    description: string | null;
    createdAt: Date | null;
  }>;
  orders: Array<{
    id: number;
    status: string;
    total: number;
    createdAt: Date | null;
    items: Array<{ id: number; name: string; quantity: number; price: number }>;
  }>;
};

export type StaffTableSummary = {
  id: number;
  tableNumber: string;
  qrCodeToken: string;
  isActive: boolean;
  createdAt: Date | null;
  activeSessions: number;
  totalSessions: number;
  pendingRequests: number;
  lastStartedAt: Date | null;
};

export type StaffAiLogSummary = {
  id: number;
  tableNumber: string;
  modelName: string;
  prompt: string;
  response: string;
  handoverRequired: boolean;
  createdAt: Date | null;
};

export type StaffSettingsData = {
  restaurant: {
    id: number;
    name: string;
    description: string | null;
    address: string | null;
  };
  staffUsers: Array<{
    id: number;
    name: string;
    email: string;
    role: string | null;
    isActive: boolean;
  }>;
  tableCount: number;
  activeTableCount: number;
  menuItemCount: number;
  knowledgeBaseCount: number;
};

function summarizeLastMessage(
  messages: Array<{ messageContent: string; senderType: string }> | undefined,
) {
  const lastMessage = messages?.at(-1);
  if (!lastMessage) return "No conversation yet.";
  return `${labelSender(lastMessage.senderType)}: ${lastMessage.messageContent}`;
}

function labelSender(senderType: string) {
  if (senderType.toLowerCase().includes("customer")) return "Guest";
  if (senderType.toLowerCase().includes("staff")) return "Staff";
  return "Assistant";
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value ?? 0);
}

function fallbackSessions(): StaffSessionDetail[] {
  return [
    {
      id: 1,
      restaurantName: fallbackRestaurant.name,
      tableNumber: "4",
      status: "waiting_staff",
      startedAt: fallbackStartedAt,
      endedAt: null,
      lastMessage: "Assistant: Your request has been sent to the staff.",
      requestCount: 1,
      orderCount: 1,
      handoverCount: 1,
      messages: [
        {
          id: 1,
          senderType: "assistant",
          messageContent: "Welcome to Bistro Aurora, table 4. How can I help you today?",
          createdAt: new Date(Date.now() - 23 * 60 * 1000),
        },
        {
          id: 2,
          senderType: "customer",
          messageContent: "Which dishes are vegetarian and do not contain sesame?",
          createdAt: new Date(Date.now() - 22 * 60 * 1000),
        },
        {
          id: 3,
          senderType: "assistant",
          messageContent:
            "Three dishes match: Wild Mushroom Risotto, Roasted Beet Salad, and Tomato Orecchiette. None contain sesame.",
          createdAt: new Date(Date.now() - 21 * 60 * 1000),
        },
        {
          id: 4,
          senderType: "customer",
          messageContent: "Can I have the bill, please?",
          createdAt: new Date(Date.now() - 3 * 60 * 1000),
        },
        {
          id: 5,
          senderType: "assistant",
          messageContent: "Your request has been sent to the staff.",
          createdAt: new Date(Date.now() - 2 * 60 * 1000),
        },
      ],
      requests: [
        {
          id: 1,
          requestType: "Request bill",
          status: "Waiting",
          description: "Customer wants to pay",
          createdAt: new Date(Date.now() - 3 * 60 * 1000),
        },
      ],
      orders: [
        {
          id: 1,
          status: "Preparing",
          total: 26.5,
          createdAt: new Date(Date.now() - 19 * 60 * 1000),
          items: [
            { id: 1, name: "Wild Mushroom Risotto", quantity: 1, price: 17 },
            { id: 2, name: "Roasted Beet Salad", quantity: 1, price: 9.5 },
          ],
        },
      ],
    },
    {
      id: 2,
      restaurantName: fallbackRestaurant.name,
      tableNumber: "2",
      status: "active",
      startedAt: new Date(Date.now() - 8 * 60 * 1000),
      endedAt: null,
      lastMessage: "Assistant: Welcome to Bistro Aurora, table 2.",
      requestCount: 0,
      orderCount: 0,
      handoverCount: 0,
      messages: [],
      requests: [],
      orders: [],
    },
  ];
}

export async function getStaffSessions() {
  try {
    const sessions = await prisma.customerSession.findMany({
      include: {
        table: true,
        chatMessages: { orderBy: { id: "asc" } },
        customerRequests: true,
        orders: true,
        aiResponseLogs: true,
      },
      orderBy: [{ endedAt: "asc" }, { startedAt: "desc" }],
      take: 30,
    });

    return sessions.map((session): StaffSessionSummary => ({
      id: session.id,
      tableNumber: session.table.tableNumber,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      lastMessage: summarizeLastMessage(session.chatMessages),
      requestCount: session.customerRequests.length,
      orderCount: session.orders.length,
      handoverCount: session.aiResponseLogs.filter((log) => log.handoverRequired).length,
    }));
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    if (!canUseDemoStaffData()) return [];
    return fallbackSessions();
  }
}

export async function getStaffSessionDetail(sessionId: number) {
  try {
    const session = await prisma.customerSession.findUnique({
      where: { id: sessionId },
      include: {
        restaurant: true,
        table: true,
        chatMessages: { orderBy: { id: "asc" } },
        customerRequests: { orderBy: { id: "asc" } },
        orders: {
          include: { orderItems: { orderBy: { id: "asc" } } },
          orderBy: { id: "desc" },
        },
        aiResponseLogs: true,
      },
    });

    if (!session) return null;

    return {
      id: session.id,
      restaurantName: session.restaurant.name,
      tableNumber: session.table.tableNumber,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      lastMessage: summarizeLastMessage(session.chatMessages),
      requestCount: session.customerRequests.length,
      orderCount: session.orders.length,
      handoverCount: session.aiResponseLogs.filter((log) => log.handoverRequired).length,
      messages: session.chatMessages,
      requests: session.customerRequests,
      orders: session.orders.map((order) => ({
        id: order.id,
        status: order.status,
        total: toNumber(order.total),
        createdAt: order.createdAt,
        items: order.orderItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: toNumber(item.price),
        })),
      })),
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    if (!canUseDemoStaffData()) return null;
    return fallbackSessions().find((session) => session.id === sessionId) ?? fallbackSessions()[0];
  }
}

export async function getStaffTables() {
  try {
    const tables = await prisma.restaurantTable.findMany({
      include: {
        sessions: {
          include: { customerRequests: true },
          orderBy: { startedAt: "desc" },
        },
      },
      orderBy: { tableNumber: "asc" },
    });

    return tables.map((table): StaffTableSummary => {
      const activeSessions = table.sessions.filter((session) => session.status !== "closed");
      return {
        id: table.id,
        tableNumber: table.tableNumber,
        qrCodeToken: table.qrCodeToken,
        isActive: table.isActive,
        createdAt: table.createdAt,
        activeSessions: activeSessions.length,
        totalSessions: table.sessions.length,
        pendingRequests: table.sessions.flatMap((session) => session.customerRequests).filter(
          (request) => !/resolved|closed/i.test(request.status),
        ).length,
        lastStartedAt: table.sessions[0]?.startedAt ?? null,
      };
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    if (!canUseDemoStaffData()) return [];
    return fallbackTables.map((table, index): StaffTableSummary => ({
      ...table,
      activeSessions: index === 1 ? 1 : 0,
      totalSessions: index === 1 ? 1 : 0,
      pendingRequests: index === 1 ? 1 : 0,
      lastStartedAt: index === 1 ? fallbackStartedAt : null,
    }));
  }
}

export async function getStaffTableDetail(tableId: number) {
  const tables = await getStaffTables();
  return tables.find((table) => table.id === tableId) ?? null;
}

export async function getStaffAiLogs() {
  try {
    const logs = await prisma.aiResponseLog.findMany({
      include: {
        session: { include: { table: true } },
      },
      orderBy: { id: "desc" },
      take: 40,
    });

    return logs.map((log): StaffAiLogSummary => ({
      id: log.id,
      tableNumber: log.session?.table.tableNumber ?? "Unassigned",
      modelName: log.modelName ?? "Unknown model",
      prompt: log.prompt ?? "No prompt stored.",
      response: log.response ?? "No response stored.",
      handoverRequired: log.handoverRequired,
      createdAt: log.createdAt,
    }));
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    if (!canUseDemoStaffData()) return [];
    return [
      {
        id: 1,
        tableNumber: "4",
        modelName: "gemini",
        prompt: "Customer asks for allergen-safe vegetarian dishes.",
        response: "Suggested vegetarian dishes and escalated for allergy confirmation.",
        handoverRequired: true,
        createdAt: new Date(Date.now() - 21 * 60 * 1000),
      },
    ];
  }
}

export async function getStaffSettingsData(): Promise<StaffSettingsData> {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      include: {
        staffUsers: { orderBy: { id: "asc" } },
        tables: true,
        menuItems: true,
        knowledgeBase: true,
      },
      orderBy: { id: "asc" },
    });

    if (!restaurant) {
      if (!canUseDemoStaffData()) return emptyStaffSettingsData();

      return {
        restaurant: fallbackRestaurant,
        staffUsers: [],
        tableCount: fallbackTables.length,
        activeTableCount: fallbackTables.filter((table) => table.isActive).length,
        menuItemCount: 0,
        knowledgeBaseCount: fallbackKnowledgeBase.length,
      };
    }

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
      },
      staffUsers: restaurant.staffUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      })),
      tableCount: restaurant.tables.length,
      activeTableCount: restaurant.tables.filter((table) => table.isActive).length,
      menuItemCount: restaurant.menuItems.length,
      knowledgeBaseCount: restaurant.knowledgeBase.length,
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    if (!canUseDemoStaffData()) return emptyStaffSettingsData();
    return {
      restaurant: fallbackRestaurant,
      staffUsers: [
        {
          id: 1,
          name: "Shift Lead",
          email: "staff@testpizza.local",
          role: "manager",
          isActive: true,
        },
      ],
      tableCount: fallbackTables.length,
      activeTableCount: fallbackTables.filter((table) => table.isActive).length,
      menuItemCount: 5,
      knowledgeBaseCount: fallbackKnowledgeBase.length,
    };
  }
}

function emptyStaffSettingsData(): StaffSettingsData {
  return {
    restaurant: {
      id: 0,
      name: "Restaurant unavailable",
      description: "Restaurant settings could not be loaded.",
      address: null,
    },
    staffUsers: [],
    tableCount: 0,
    activeTableCount: 0,
    menuItemCount: 0,
    knowledgeBaseCount: 0,
  };
}
