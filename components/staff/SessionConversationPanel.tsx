"use client";

import { Bot, UserRound } from "lucide-react";
import { sendStaffMessageAction } from "@/actions/staff-message.action";
import StaffReplyBox from "@/components/staff/StaffReplyBox";
import RequestCard from "@/components/staff/RequestCard";
import type { StaffSessionDetail } from "@/lib/staff-page-data";

function timeLabel(value: Date | string | null) {
  if (!value) return "unknown time";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isGuest(senderType: string) {
  return /customer|guest|user/i.test(senderType);
}

export default function SessionConversationPanel({ session }: { session: StaffSessionDetail }) {
  return (
    <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="flex min-h-0 flex-col">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{session.restaurantName}</p>
          <div className="mt-1 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Table {session.tableNumber}</h2>
              <p className="text-sm text-slate-500">Session #{session.id} - {session.status.replaceAll("_", " ")}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              {session.handoverCount > 0 ? "Needs staff" : "AI handling"}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-5 py-5">
          {session.messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No chat messages have been recorded for this table yet.
            </div>
          ) : (
            session.messages.map((message) => {
              const guest = isGuest(message.senderType);
              const Icon = guest ? UserRound : Bot;
              return (
                <article className={`flex gap-3 ${guest ? "justify-end" : "justify-start"}`} key={message.id}>
                  {!guest ? (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                  ) : null}
                  <div className={`max-w-[min(560px,80%)] ${guest ? "text-right" : ""}`}>
                    <p className="mb-1 text-xs text-slate-500">
                      {guest ? "Guest" : "Assistant"} - {timeLabel(message.createdAt)}
                    </p>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                        guest ? "bg-[#142653] text-white" : "border border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      {message.messageContent}
                    </div>
                  </div>
                  {guest ? (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#142653] text-white">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>

        <StaffReplyBox onSendMessage={(text) => sendStaffMessageAction(session.id, text)} />
      </section>

      <aside className="border-t border-slate-200 bg-[#f2f7fb] p-5 lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-950">Orders</h3>
          <span className="text-sm font-semibold text-slate-500">{session.orders.length}</span>
        </div>
        <div className="mt-3 space-y-3">
          {session.orders.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">No orders yet.</p>
          ) : (
            session.orders.map((order) => (
              <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200" key={order.id}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-950">#{order.id}</p>
                  <p className="font-semibold text-slate-950">EUR {order.total.toFixed(2)}</p>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase text-blue-600">{order.status}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  {order.items.map((item) => (
                    <div className="flex justify-between gap-3" key={item.id}>
                      <span>{item.quantity}x {item.name}</span>
                      <span>EUR {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <h3 className="font-semibold text-slate-950">Service requests</h3>
          <span className="text-sm font-semibold text-slate-500">{session.requests.length}</span>
        </div>
        <div className="mt-3 space-y-3">
          {session.requests.length === 0 ? (
            <p className="rounded-lg bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
              No open service requests.
            </p>
          ) : (
            session.requests.map((request) => (
              <RequestCard
                id={request.id}
                initialStatus={request.status}
                key={request.id}
                text={request.requestType.replace("_", " ")}
                time={request.createdAt ?? new Date()}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
