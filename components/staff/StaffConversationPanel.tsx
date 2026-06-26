"use client";

import DashboardConversationPanel from "@/components/staff/DashboardConversationPanel";
import SessionConversationPanel from "@/components/staff/SessionConversationPanel";
import type { StaffSessionDetail } from "@/lib/staff-page-data";

type StaffConversationPanelProps =
  | { session: StaffSessionDetail; tableId?: never }
  | { tableId: string | null; session?: never };

export default function StaffConversationPanel(props: StaffConversationPanelProps) {
  if (props.session) {
    return <SessionConversationPanel session={props.session} />;
  }

  return <DashboardConversationPanel tableId={props.tableId} />;
}
