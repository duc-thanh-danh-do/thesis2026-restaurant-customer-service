"use client";
/* eslint-disable */

import { useState, useTransition, useEffect } from "react";
import {
  createMenuItemAction,
  editMenuItemAction,
} from "@/actions/menu-item.action";
import {
  getDietaryTagsAction,
  getIngredientsAction,
} from "@/actions/catalog.action";
import TagSelectionField from "./TagSelectionField";
import ImageUploadBox from "./ImageUploadBox";

interface AddDishDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: MenuItem | null;
}

interface MenuItem {
  id: number;
  name: string;
  category: string | null;
  price: number;
  isAvailable: boolean;
  dietary?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  ingredients?: string | null;
}

function useDishForm(
  initialData: MenuItem | null | undefined,
  isOpen: boolean,
  onClose: () => void
) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("STARTERS");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [ingredientTags, setIngredientTags] = useState<string[]>([]);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      const fetchCatalogs = async () => {
        const freshDietaries = await getDietaryTagsAction();
        const freshIngredients = await getIngredientsAction();
        setDietaryTags(freshDietaries);
        setIngredientTags(freshIngredients);
      };
      fetchCatalogs();

      if (initialData) {
        setName(initialData.name);
        setCategory(initialData.category || "STARTERS");
        setPrice(Number(initialData.price).toString());
        setDescription(initialData.description || "");
        setImageUrl(initialData.imageUrl || "");

        if (initialData.dietary) {
          const dietArray = initialData.dietary
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
          setSelectedDietary(dietArray);
        } else {
          setSelectedDietary([]);
        }

        if (initialData.ingredients) {
          const ingArray = initialData.ingredients
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
          setSelectedIngredients(ingArray);
        } else {
          setSelectedIngredients([]);
        }
      } else {
        setName("");
        setCategory("STARTERS");
        setPrice("");
        setDescription("");
        setSelectedDietary([]);
        setSelectedIngredients([]);
      }
    }
  }, [isOpen, initialData]);

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
      const payload = {
        name,
        category,
        price: parseFloat(price) || 0,
        description,
        dietary: selectedDietary.join(", "),
        ingredients: selectedIngredients.join(", "),
        imageUrl,
      };

      let result;
      if (initialData) {
        result = await editMenuItemAction(initialData.id, payload);
      } else {
        result = await createMenuItemAction(payload);
      }

      if (result.success) {
        onClose();
      } else {
        alert("Failed to save dish: " + result.error);
      }
    });
  };

  return {
    formState: {
      name,
      category,
      price,
      description,
      selectedDietary,
      selectedIngredients,
      imageUrl,
    },
    tags: { dietaryTags, ingredientTags },
    actions: {
      setName,
      setCategory,
      setPrice,
      setDescription,
      toggleDietary,
      toggleIngredient,
      handleSubmit,
      setImageUrl,
    },
    isPending,
  };
}

export default function AddDishDrawer({
  isOpen,
  onClose,
  initialData,
}: AddDishDrawerProps) {
  const { formState, tags, actions, isPending } = useDishForm(
    initialData,
    isOpen,
    onClose
  );

  const titleText = initialData ? "Edit dish" : "Add dish";
  const buttonText = initialData ? "Save changes" : "Add dish";

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
          <h3 className="text-xl font-bold text-slate-800">{titleText}</h3>
          <button
            title="close"
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
          <ImageUploadBox
            value={formState.imageUrl}
            onChange={actions.setImageUrl}
            disabled={isPending}
          />

          {/* Name & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Name</label>
              <input
                title="dish name"
                type="text"
                value={formState.name}
                onChange={(e) => actions.setName(e.target.value)}
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
                value={formState.category}
                onChange={(e) => actions.setCategory(e.target.value)}
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
                value={formState.price}
                onChange={(e) => actions.setPrice(e.target.value)}
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
              value={formState.description}
              onChange={(e) => actions.setDescription(e.target.value)}
              placeholder="Describe the dish..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-slate-500 resize-none"
            ></textarea>
          </div>

          {/* Dietary Fieldset */}
          <TagSelectionField
            legend="DIETARY"
            tags={tags.dietaryTags}
            selectedTags={formState.selectedDietary}
            onToggle={actions.toggleDietary}
          />

          {/* Ingredients Fieldset */}
          <TagSelectionField
            legend="INGREDIENTS"
            tags={tags.ingredientTags}
            selectedTags={formState.selectedIngredients}
            onToggle={actions.toggleIngredient}
          />
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
            onClick={actions.handleSubmit}
            disabled={isPending}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#142653] hover:bg-[#13275a] rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? "Saving..." : buttonText}
          </button>
        </div>
      </div>
    </>
  );
}
