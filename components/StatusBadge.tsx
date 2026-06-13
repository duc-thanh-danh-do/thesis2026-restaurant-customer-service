import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status }: { status: string }) {
  return <Badge>{status}</Badge>;
}
