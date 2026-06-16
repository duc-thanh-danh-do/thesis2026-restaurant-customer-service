"use client";

import React, { useState, useTransition } from "react";
import { createMenuItemAction } from "@/actions/menu-item.action";

interface AddDishDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDishDrawer({ isOpen, onClose }: AddDishDrawerProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("STARTERS"); // 默认选 Starters
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const [isPending, startTransition] = useTransition();

  const toggleDietary = (tag: string) => {
    setSelectedDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleIngredient = (tag: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (!name || !price) {
      alert("Please fill in the Name and Price!");
      return;
    }

    startTransition(async () => {
      const result = await createMenuItemAction({
        name,
        category,
        price: parseFloat(price) || 0,
        description,
        ingredients: selectedIngredients.join(", "),
        isVegetarian: selectedDietary.includes("VEGETARIAN"),
        isVegan: selectedDietary.includes("VEGAN"),
      });

      if (result.success) {
        setName("");
        setCategory("STARTERS");
        setPrice("");
        setDescription("");
        setSelectedDietary([]);
        setSelectedIngredients([]);
        onClose();
      } else {
        alert("Failed to save dish: " + result.error);
      }
    });
  };

  const dietaryTags = [
    "VEGAN",
    "VEGETARIAN",
    "GLUTEN-FREE",
    "DAIRY-FREE",
    "NUT-FREE",
    "HALAL",
    "KOSHER",
    "SPICY",
  ];

  const ingredientTags = [
    "beets",
    "goat cheese",
    "walnuts",
    "citrus vinaigrette",
    "burrata",
    "heritage tomatoes",
    "basil",
    "sourdough",
    "carnaroli rice",
    "porcini",
    "thyme",
    "parmesan",
    "sea bass",
    "fennel",
    "lemon",
    "capers",
    "butter",
    "orecchiette",
    "n'duja",
    "chili",
    "pecorino",
    "broccolini",
    "garlic",
    "potato",
    "truffle oil",
    "dark chocolate",
    "vanilla ice cream",
    "shortcrust",
    "meringue",
    "seasonal fruit",
    "tempranillo",
    "mineral water",
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      {/* panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <h3 className="text-xl font-bold text-slate-800">Add dish</h3>
          <button
            title="add dish"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">Image</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <input
                type="file"
                disabled
                className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 opacity-50 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Name & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Name</label>
              <input
                title="dish name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Garlic Bread"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">
                Category
              </label>
              <select
                title="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="STARTERS">Starters</option>
                <option value="MAINS">Mains</option>
                <option value="SIDES">Sides</option>
                <option value="DESSERTS">Desserts</option>
                <option value="DRINKS">Drinks</option>
              </select>
            </div>
          </div>

          {/* Price & Allergens */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">
                Price (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">
                Allergens
              </label>
              <input
                type="text"
                placeholder="dairy, nuts"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-slate-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the dish..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-slate-500 resize-none"
            ></textarea>
          </div>

          {/* Dietary Fieldset */}
          <fieldset className="border border-slate-200 rounded-xl p-4 pt-2">
            <legend className="text-xs font-bold text-slate-500 px-2 tracking-wider">
              DIETARY
            </legend>
            <div className="flex flex-wrap gap-2 mt-1">
              {dietaryTags.map((tag) => {
                const isSelected = selectedDietary.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDietary(tag)}
                    className={`border px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "border-slate-200 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Ingredients Fieldset */}
          <fieldset className="border border-slate-200 rounded-xl p-4 pt-2">
            <legend className="text-xs font-bold text-slate-500 px-2 tracking-wider">
              INGREDIENTS
            </legend>
            <div className="flex flex-wrap gap-2 mt-1">
              {ingredientTags.map((tag) => {
                const isSelected = selectedIngredients.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleIngredient(tag)}
                    className={`border px-3 py-1.5 rounded-full text-xs transition-colors ${
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "border-slate-200 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#142653] hover:bg-[#13275a] rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? "Saving..." : "Add dish"}
          </button>
        </div>
      </div>
    </>
  );
}
