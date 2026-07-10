import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border px-2.5 font-semibold",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "danger" && "border-rose-200 bg-rose-50 text-rose-700",
        tone === "info" && "border-blue-200 bg-blue-50 text-blue-700",
        tone === "neutral" && "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {children}
    </Badge>
  );
}

export function MetricCard({ label, value, detail, icon, tone = "blue" }: { label: string; value: string | number; detail: string; icon: React.ReactNode; tone?: "blue" | "green" | "amber" | "violet" }) {
  return (
    <Card className="gap-0 border-0 py-0 shadow-sm ring-1 ring-slate-200/80">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[#142653]">{value}</p>
          </div>
          <div className={cn("grid size-10 place-items-center rounded-xl", tone === "blue" && "bg-blue-50 text-blue-600", tone === "green" && "bg-emerald-50 text-emerald-600", tone === "amber" && "bg-amber-50 text-amber-600", tone === "violet" && "bg-violet-50 text-violet-600")}>{icon}</div>
        </div>
        <p className="mt-3 text-xs text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}
