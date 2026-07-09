"use client";

import { useState, useEffect, useCallback } from "react";
import ActiveTableCard, {
  type ActiveTableBadge,
  type ActiveTableSummary,
} from "@/components/staff/ActiveTableCard";
import StaffConversationPanel from "@/components/staff/StaffConversationPanel";

import { getActiveOrdersAction } from "@/actions/customer-order.action";
import { getActiveRequestsAction } from "@/actions/customer-request.action";
import { getAllTablesAction } from "@/actions/restaurant-table.action";
import { ScrollArea } from "@/components/ui/scroll-area";
import TableDetailsPanel from "./TableDetailsPanel";

type DashboardTable = {
  tableNumber: string;
};

type DashboardOrder = {
  status: string;
  createdAt: Date | string | null;
  session?: {
    table?: {
      tableNumber?: string | null;
    } | null;
  } | null;
};

type DashboardRequest = {
  requestType: string;
  status: string;
  createdAt: Date | string | null;
  session?: {
    table?: {
      tableNumber?: string | null;
    } | null;
  } | null;
};

type DashboardCache = {
  activeTables: ActiveTableSummary[];
  selectedTableId: string | null;
  storedAt: number;
};

let dashboardCache: DashboardCache | null = null;
const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

function readDashboardCache() {
  if (!dashboardCache) return null;

  if (Date.now() - dashboardCache.storedAt > DASHBOARD_CACHE_TTL_MS) {
    dashboardCache = null;
    return null;
  }

  return dashboardCache;
}

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function StaffWorkSpace() {
  const initialCache = readDashboardCache();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(
    initialCache?.selectedTableId ?? null,
  );
  const [activeTables, setActiveTables] = useState<ActiveTableSummary[]>(
    initialCache?.activeTables ?? [],
  );

  const fetchDashboardData = useCallback(async () => {
    const [rawTables, rawOrders, rawRequests] = await Promise.all([
      getAllTablesAction(),
      getActiveOrdersAction(),
      getActiveRequestsAction(),
    ]);

    const tables = rawTables as DashboardTable[];
    const orders = rawOrders as DashboardOrder[];
    const requests = rawRequests as DashboardRequest[];

    const formattedTables = tables.map((t) => {
      const tableOrders = orders.filter(
        (o) => o.session?.table?.tableNumber === t.tableNumber,
      );
      const tableRequests = requests.filter(
        (req) => req.session?.table?.tableNumber === t.tableNumber,
      );

      let hasWarning = false;
      let warningColor = "text-amber-500";
      const badges: ActiveTableBadge[] = [];
      let latestTime = "";

      let oldestPendingTime = Infinity;

      const latestOrder = tableOrders.reduce<DashboardOrder | null>(
        (currentLatest, order) => {
          if (!currentLatest) return order;

          const currentLatestTime = currentLatest.createdAt
            ? new Date(currentLatest.createdAt).getTime()
            : 0;
          const nextOrderTime = order.createdAt
            ? new Date(order.createdAt).getTime()
            : 0;

          return nextOrderTime > currentLatestTime ? order : currentLatest;
        },
        null,
      );

      if (latestOrder) {
        if (latestOrder.createdAt) {
          latestTime = new Date(latestOrder.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        const displayStatus = formatStatus(latestOrder.status);
        const isPlaced = displayStatus.toLowerCase() === "placed";

        badges.push({
          text: `Order: ${displayStatus}`,
          color: isPlaced ? "bg-amber-500" : "bg-slate-500",
        });

        if (isPlaced) {
          hasWarning = true;
          if (latestOrder.createdAt) {
            const tTime = new Date(latestOrder.createdAt).getTime();
            if (tTime < oldestPendingTime) oldestPendingTime = tTime;
          }
        }
      }

      tableRequests.forEach((req) => {
        if (!latestTime && req.createdAt)
          latestTime = new Date(req.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        if (req.status === "Waiting") {
          hasWarning = true;
          warningColor = "text-red-500";
          badges.push({
            text: `Req: ${req.requestType.replace("_", " ")}`,
            color: "bg-red-500",
          });
          if (req.createdAt) {
            const tTime = new Date(req.createdAt).getTime();
            if (tTime < oldestPendingTime) oldestPendingTime = tTime;
          }
        } else if (req.status === "In progress")
          badges.push({ text: "Req: In Progress", color: "bg-slate-500" });
      });

      return {
        id: t.tableNumber,
        name: `Table ${t.tableNumber}`,
        time: latestTime,
        hasWarning,
        warningColor,
        badges,
        sortTime: oldestPendingTime,
      };
    });

    formattedTables.sort((a, b) => {
      return a.sortTime - b.sortTime;
    });

    setActiveTables(formattedTables);
    const nextSelectedTableId =
      selectedTableId &&
      formattedTables.some((table) => table.id === selectedTableId)
        ? selectedTableId
        : (formattedTables[0]?.id ?? null);

    dashboardCache = {
      activeTables: formattedTables,
      selectedTableId: nextSelectedTableId,
      storedAt: Date.now(),
    };

    if (nextSelectedTableId !== selectedTableId)
      setSelectedTableId(nextSelectedTableId);
  }, [selectedTableId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
  };

  return (
    <div className="flex h-[calc(100dvh-73px)] flex-col overflow-hidden bg-slate-100 xl:flex-row">
      {/* ActiveTableCard */}
      <div className="flex max-h-105 w-full shrink-0 flex-col bg-[#13275a] xl:max-h-none xl:w-[320px]">
        <div className="p-5">
          <p className="text-xs font-medium text-blue-300 uppercase tracking-wide">
            Staff Dashboard
          </p>
          <p className="text-sm text-blue-200 mt-1">
            {activeTables.length} tables active
          </p>
        </div>
        <ScrollArea className="min-h-0 flex-1 px-5 pb-5">
          <div className="space-y-3">
            {activeTables.map((table) => (
              <ActiveTableCard
                key={table.id}
                table={table}
                isSelected={selectedTableId === table.id}
                onClick={() => handleSelectTable(table.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:flex-row bg-white">
        {/* chatPanel */}
        <div className="min-w-0 flex-1 h-full overflow-hidden border-r border-slate-200">
          <StaffConversationPanel tableId={selectedTableId} />
        </div>

        {/* detailsPanel */}
        <div className="h-full w-full shrink-0 overflow-hidden bg-slate-50/50 lg:w-70 xl:w-[320px]">
          <TableDetailsPanel
            tableId={selectedTableId}
            onDataChange={fetchDashboardData}
          />
        </div>
      </div>
    </div>
  );
}
