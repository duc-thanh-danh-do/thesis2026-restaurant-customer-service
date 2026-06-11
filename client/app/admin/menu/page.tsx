"use client";

import React, { useState } from "react";
import AddDishDrawer from "@/components/staff/AddDishDrawer";
import MenuAdminHeader from "@/components/staff/MenuAdminHeader";

export default function MenuAdminPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-slate-50 overflow-hidden relative">
      {/* Header */}
      <MenuAdminHeader activeTab="dishes" />

      <div className="flex-1 overflow-y-auto p-6 w-full">
        <div className="flex items-start gap-3 w-full">
          <div className="w-5 shrink-0" />

          <div className="flex-1 max-w-5xl space-y-6 pb-10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-1">
                Dishes
              </h3>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 text-sm shadow-sm"
              >
                <span className="text-lg leading-none mb-0.5">+</span>
                Add dish
              </button>
            </div>

            {/* MenuList */}
            <p className="text-slate-400 text-sm mt-10">
              Menu list will be rendered here...
            </p>
          </div>
        </div>
      </div>

      <AddDishDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
