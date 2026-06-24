"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import ActiveTableCard from "@/components/staff/ActiveTableCard";
import StaffConversationPanel from "@/components/staff/StaffConversationPanel";
import TableDetailPage from "@/app/(staff)/tables/[tableId]/page";

import { getActiveOrdersAction } from "@/actions/customer-order.action";
import { getActiveRequestsAction } from "@/actions/customer-request.action";
import { getAllTablesAction } from "@/actions/restaurant-table.action";
import { ScrollArea } from "@/components/ui/scroll-area";
import TableDetailsPanel from "./TableDetailsPanel";

export default function StaffWorkSpace() {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeTables, setActiveTables] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    const [rawTables, rawOrders, rawRequests] = await Promise.all([
      getAllTablesAction(),
      getActiveOrdersAction(),
      getActiveRequestsAction(),
    ]);

    const formattedTables = rawTables.map((t: any) => {
      const tableOrders = rawOrders.filter(
        (o: any) => o.session?.table?.tableNumber === t.tableNumber
      );
      const tableRequests = rawRequests.filter(
        (req: any) => req.session?.table?.tableNumber === t.tableNumber
      );

      let hasWarning = false;
      let warningColor = "text-amber-500";
      const badges: any[] = [];
      let latestTime = "";

      let oldestPendingTime = Infinity;

      tableOrders.forEach((order: any) => {
        if (!latestTime && order.createdAt)
          latestTime = new Date(order.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        if (order.status === "Placed") {
          hasWarning = true;
          badges.push({ text: "Order: Placed", color: "bg-amber-500" });
          if (order.createdAt) {
            const tTime = new Date(order.createdAt).getTime();
            if (tTime < oldestPendingTime) oldestPendingTime = tTime;
          }
        } else {
          badges.push({
            text: `Order: ${order.status}`,
            color: "bg-slate-500",
          });
        }
      });

      tableRequests.forEach((req: any) => {
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
    if (formattedTables.length > 0 && !selectedTableId)
      setSelectedTableId(formattedTables[0].id);
  }, [selectedTableId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="flex h-[calc(100dvh-73px)] flex-col bg-slate-100 xl:flex-row overflow-hidden">
      {/* ActiveTableCard */}
      <div className="flex max-h-[420px] w-full flex-col bg-[#13275a] xl:max-h-none xl:w-[320px] flex-shrink-0">
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
                onClick={() => setSelectedTableId(table.id)}
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
        <div className="w-full h-full overflow-hidden lg:w-[280px] xl:w-[320px] flex-shrink-0 bg-slate-50/50">
          <TableDetailsPanel
            tableId={selectedTableId}
            onDataChange={fetchDashboardData}
          />
        </div>
      </div>
    </div>
  );
}
