"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import OrderCard from "@/components/staff/OrderCard";
import RequestCard from "@/components/staff/RequestCard";
import { getTableOrderAction } from "@/actions/customer-order.action";
import { getTableRequestsAction } from "@/actions/customer-request.action";

export default function TableDetailsPanel({
  tableId,
  onDataChange,
}: {
  tableId: string | null;
  onDataChange: () => void;
}) {
  const [realOrder, setRealOrder] = useState<any>(null);
  const [realRequests, setRealRequests] = useState<any[]>([]);

  const fetchDetails = useCallback(() => {
    if (!tableId) return;
    getTableOrderAction(tableId).then((data) => setRealOrder(data));
    getTableRequestsAction(tableId).then((data) => setRealRequests(data));
  }, [tableId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleActionSuccess = () => {
    fetchDetails();
    onDataChange();
  };

  return (
    <div className="h-full w-full overflow-y-auto p-5 sm:p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">
            Orders
          </h3>
          {realOrder ? (
            <OrderCard
              key={realOrder.id}
              id={realOrder.id}
              time={realOrder.time}
              initialStatus={realOrder.status}
              items={realOrder.items}
              onRefresh={handleActionSuccess}
            />
          ) : (
            <div className="text-sm text-slate-400 p-4 border border-dashed border-slate-200 rounded-lg text-center">
              Loading order data...
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">
            Service requests
          </h3>
          <div className="space-y-3">
            {realRequests.length === 0 ? (
              <div className="text-sm text-slate-400 p-4 border border-dashed border-slate-200 rounded-lg text-center">
                No active requests
              </div>
            ) : (
              realRequests.map((req) => {
                const reqType = req.requestType.replace("_", " ");
                const timeStr = req.createdAt
                  ? new Date(req.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Just now";
                return (
                  <RequestCard
                    key={req.id}
                    id={req.id}
                    text={reqType}
                    time={timeStr}
                    initialStatus={req.status}
                    onRefresh={handleActionSuccess}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
