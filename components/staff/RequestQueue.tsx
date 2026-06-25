"use client";

import { useState, useEffect, useCallback } from "react";
import { getActiveRequestsAction } from "@/actions/customer-request.action";
import RequestCard from "@/components/staff/RequestCard";
import { CheckCircle2, Clock } from "lucide-react";

export default function RequestsPage() {
  const [groupedRequests, setGroupedRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);

  const fetchRequests = useCallback(async () => {
    const rawRequests = await getActiveRequestsAction();
    setTotalPending(rawRequests.length);

    const groups: Record<string, any[]> = {};
    rawRequests.forEach((req: any) => {
      const tableNum = req.session?.table?.tableNumber || "Unknown";
      if (!groups[tableNum]) {
        groups[tableNum] = [];
      }
      groups[tableNum].push(req);
    });

    const groupedArray = Object.keys(groups).map((tableNum) => {
      const reqs = groups[tableNum];
      reqs.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      return {
        tableName: `Table ${tableNum}`,
        requests: reqs,
        oldestTime: reqs[0].createdAt
          ? new Date(reqs[0].createdAt).getTime()
          : 0,
      };
    });

    groupedArray.sort((a, b) => a.oldestTime - b.oldestTime);

    setGroupedRequests(groupedArray);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => {
      fetchRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Request queue</h1>
        <p className="text-slate-500 mt-1">
          Manage and resolve all customer service requests
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Active Queue
          </h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {totalPending} pending
          </span>
        </div>

        <div className="p-6 bg-white min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full text-slate-400 py-12">
              Loading requests...
            </div>
          ) : groupedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-400 mb-4" />
              <h3 className="text-xl font-medium text-slate-700">
                All caught up!
              </h3>
              <p className="text-slate-500 mt-1">
                There are no active customer requests right now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedRequests.map((group) => (
                <div
                  key={group.tableName}
                  className="bg-amber-50/60 rounded-xl p-5 transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                    {/* Table Number  */}
                    <div className="md:w-32 flex-shrink-0 pt-2">
                      <h3 className="text-lg font-bold text-amber-900">
                        {group.tableName}
                      </h3>
                      <p className="text-xs text-amber-700/70 mt-0.5">
                        {group.requests.length} requests
                      </p>
                    </div>

                    {/* Requests */}
                    <div className="flex-1 flex flex-col gap-3">
                      {group.requests.map((req: any) => {
                        const timeStr = req.createdAt
                          ? new Date(req.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Just now";
                        const reqType = req.requestType.replace("_", " ");

                        return (
                          <RequestCard
                            key={req.id}
                            id={req.id}
                            text={reqType}
                            time={timeStr}
                            initialStatus={req.status}
                            onRefresh={fetchRequests}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
