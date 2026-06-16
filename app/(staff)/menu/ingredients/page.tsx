'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INGREDIENTS } from '@/data/mock-data';
import MenuAdminHeader from '@/components/menu/MenuManagementHeader';

export default function IngredientsPage() {
  const [newIngredient, setNewIngredient] = useState('');
  const [ingredients, setIngredients] = useState(INGREDIENTS);

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter((i) => i !== ingredient));
  };

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-[#f5f9fc] overflow-hidden relative">
      {/* Header */}
      <MenuAdminHeader />

      {/* Ingredients */}
      <div className="flex-1 overflow-y-auto px-6 py-6 w-full">
        <div className="max-w-[620px] mx-auto space-y-6">
          
          {/* Add Ingredient Card */}
          <Card className="p-4 bg-white border border-[#d5e1ec] rounded-[20px]">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#142653]">
                Add ingredient
              </Label>
              <div className="flex gap-3">
                <Input
                  placeholder="e.g. saffron"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  className="flex-1 border-[#d5e1ec] rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addIngredient();
                    }
                  }}
                />
                <Button
                  onClick={addIngredient}
                  disabled={!newIngredient.trim()}
                  className="bg-[#142653] hover:bg-[#13275a] text-white rounded-lg px-4"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </Card>

          {/* Catalog */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              CATALOG ({ingredients.length})
            </div>
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <Card key={index} className="p-3 bg-white border border-[#d5e1ec] rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#142653] capitalize font-medium">{ingredient}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(ingredient)}
                      className="p-2 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}