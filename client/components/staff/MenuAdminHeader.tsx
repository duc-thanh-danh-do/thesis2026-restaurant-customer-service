"use client";

import React from "react";
import Link from "next/link";

interface MenuAdminHeaderProps {
  activeTab: "dishes" | "ingredients";
}

export default function MenuAdminHeader({ activeTab }: MenuAdminHeaderProps) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white shrink-0">
      <div className="flex items-start gap-3 w-full">
        <Link
          href="/admin/dashboard"
          className="mt-0.5 text-slate-400 hover:text-slate-800 transition-colors shrink-0"
          aria-label="Back to dashboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </Link>

        {/* Tabs */}
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Manager
          </p>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Menu admin
          </h2>

          <div className="flex items-center gap-2 mt-4">
            {/* Dishes Tab */}
            {activeTab === "dishes" ? (
              <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold cursor-default shadow-sm">
                Dishes
              </span>
            ) : (
              <Link
                href="/admin/menu"
                className="text-slate-500 hover:text-slate-800 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                Dishes
              </Link>
            )}

            {/* Ingredients Tab */}
            {activeTab === "ingredients" ? (
              <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold cursor-default shadow-sm">
                Ingredients
              </span>
            ) : (
              <Link
                href="/admin/ingredients"
                className="text-slate-500 hover:text-slate-800 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                Ingredients
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
