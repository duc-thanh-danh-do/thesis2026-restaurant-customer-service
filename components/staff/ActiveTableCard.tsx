"use client";

import { AlertTriangle } from "lucide-react";

export type ActiveTableBadge = {
  text: string;
  color: string;
};

export type ActiveTableSummary = {
  id: string;
  name: string;
  time: string;
  preview?: string;
  hasWarning: boolean;
  warningColor?: string;
  badges: ActiveTableBadge[];
  sortTime: number;
};

interface ActiveTableCardProps {
  table: ActiveTableSummary;
  isSelected: boolean;
  onClick: () => void;
}

export default function ActiveTableCard({
  table,
  isSelected,
  onClick,
}: ActiveTableCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer rounded-lg p-4 transition-all duration-200
        ${isSelected ? "bg-white/10" : "hover:bg-white/5"}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {table.hasWarning && (
            <AlertTriangle
              className={`h-4 w-4 ${table.warningColor || "text-amber-500"}`}
            />
          )}
          <span className="font-semibold text-white">{table.name}</span>
        </div>
        <span className="text-xs text-slate-400">{table.time}</span>
      </div>

      <p className="mt-1 text-sm text-slate-300 line-clamp-2">
        {table.preview}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {table.badges.map((badge, i) => (
          <span
            key={i}
            className={`text-xs px-2 py-0.5 rounded-full text-white ${badge.color}`}
          >
            {badge.text}
          </span>
        ))}
      </div>
    </div>
  );
}
