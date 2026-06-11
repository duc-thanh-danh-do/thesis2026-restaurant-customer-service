"use client";

import React, { useState } from "react";
import MenuAdminHeader from "@/components/staff/MenuAdminHeader";
import AddIngredientCard from "@/components/staff/AddIngredientCard";
import IngredientList from "@/components/staff/IngredientList";

export default function IngredientsAdminPage() {
  const [ingredients, setIngredients] = useState([
    "beets",
    "goat cheese",
    "walnuts",
    "citrus vinaigrette",
    "burrata",
    "heritage tomatoes",
  ]);

  const handleAddIngredient = (newIngredient: string) => {
    if (!ingredients.includes(newIngredient)) {
      setIngredients([newIngredient, ...ingredients]);
    }
  };

  const handleDeleteIngredient = (indexToRemove: number) => {
    setIngredients(ingredients.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-slate-50 overflow-hidden relative">
      {/* Header */}
      <MenuAdminHeader activeTab="ingredients" />

      <div className="flex-1 overflow-y-auto p-6 w-full flex justify-center">
        <div className="w-full max-w-2xl flex flex-col items-center pb-10">
          <div className="w-full space-y-8">
            <AddIngredientCard onAdd={handleAddIngredient} />
            <IngredientList
              ingredients={ingredients}
              onDelete={handleDeleteIngredient}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
