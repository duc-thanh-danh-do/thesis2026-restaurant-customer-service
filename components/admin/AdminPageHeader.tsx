import Link from "next/link";
import { ChevronRight } from "lucide-react";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({ eyebrow, title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <div className="mb-3 flex items-center gap-1 text-xs font-medium text-slate-500">
            <Link href="/admin" className="hover:text-[#438ed8]">Admin</Link>
            <ChevronRight className="size-3" />
            <span>{eyebrow}</span>
          </div>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-[#142653] sm:text-[1.75rem]">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
