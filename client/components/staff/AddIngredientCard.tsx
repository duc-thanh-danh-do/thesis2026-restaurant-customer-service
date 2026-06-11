"use client";

import React, { useState } from "react";

interface AddIngredientCardProps {
  onAdd: (ingredient: string) => void;
}

export default function AddIngredientCard({ onAdd }: AddIngredientCardProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-4">Add ingredient</h3>
      <div className="flex gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()} // 支持回车键添加
          placeholder="e.g. saffron"
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400 transition placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-slate-400 hover:bg-slate-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"
        >
          <button
            type="button"
            onClick={handleAdd}
            className="bg-slate-400 hover:bg-slate-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Add
          </button>
        </button>
      </div>
    </div>
  );
}
