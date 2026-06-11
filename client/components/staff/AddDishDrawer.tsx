import React from "react";

interface AddDishDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDishDrawer({ isOpen, onClose }: AddDishDrawerProps) {
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
    "camaroli rice",
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

      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <h3 className="text-xl font-bold text-slate-800">Add dish</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close drawer"
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
                className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
              />
            </div>
          </div>

          {/* Name & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Name</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">
                Category
              </label>
              <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-slate-500 bg-white">
                <option>Starters</option>
                <option>Mains</option>
                <option>Desserts</option>
              </select>
            </div>
          </div>

          {/* Price & Allergens */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Price</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">
                Allergens (comma-separated)
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
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-slate-500 resize-none"
            ></textarea>
          </div>

          {/* Dietary Fieldset */}
          <fieldset className="border border-slate-200 rounded-xl p-4 pt-2">
            <legend className="text-xs font-bold text-slate-500 px-2 tracking-wider">
              DIETARY
            </legend>
            <div className="flex flex-wrap gap-2 mt-1">
              {dietaryTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs font-medium hover:border-slate-400 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Ingredients Fieldset */}
          <fieldset className="border border-slate-200 rounded-xl p-4 pt-2">
            <legend className="text-xs font-bold text-slate-500 px-2 tracking-wider">
              INGREDIENTS
            </legend>
            <div className="flex flex-wrap gap-2 mt-1">
              {ingredientTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs hover:border-slate-400 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-400 hover:bg-slate-500 rounded-lg shadow-sm transition"
          >
            Add dish
          </button>
        </div>
      </div>
    </>
  );
}
