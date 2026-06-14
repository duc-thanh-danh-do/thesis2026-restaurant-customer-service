import StaffReplyBox from "@/components/staff/StaffReplyBox";

export default function StaffConversationPanel({ sessionId }: { sessionId: string }) {
  return (
    <section className="surface p-4">
      <h1 className="text-xl font-bold">Session {sessionId}</h1>
      <div className="mt-4 rounded-md bg-neutral-100 p-3 text-sm">Customer conversation view.</div>
      <StaffReplyBox />
    </section>
  );
}
