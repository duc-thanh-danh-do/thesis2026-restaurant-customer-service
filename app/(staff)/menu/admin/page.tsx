'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Pencil, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INGREDIENTS, MENU_ITEMS } from '@/data/mock-data';
import Link from 'next/link';

export default function MenuAdminPage() {
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

  const menuItemsByCategory = MENU_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof MENU_ITEMS>);

  const categoryOrder = ['STARTERS', 'MAINS', 'SIDES', 'DESSERTS', 'DRINKS'];

  return (
    <div className="min-h-screen bg-[#f5f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-[#d5e1ec]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                MANAGER
              </div>
              <h1 className="text-lg font-semibold text-[#142653]">Menu admin</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <Tabs defaultValue="dishes" className="w-full">
          <TabsList className="mb-6 w-full overflow-x-auto border border-[#d5e1ec] bg-white p-1 sm:w-auto">
            <TabsTrigger
              value="dishes"
              className="data-[state=active]:bg-[#142653] data-[state=active]:text-white px-4 py-2 rounded-lg font-medium"
            >
              Dishes
            </TabsTrigger>
            <TabsTrigger
              value="ingredients"
              className="data-[state=active]:bg-[#142653] data-[state=active]:text-white px-4 py-2 rounded-lg font-medium"
            >
              Ingredients
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dishes" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                DISHES
              </div>
              <Button className="bg-[#142653] hover:bg-[#13275a] text-white rounded-full px-4 py-2">
                <Plus className="h-4 w-4 mr-2" />
                Add dish
              </Button>
            </div>

            <div className="space-y-6">
              {categoryOrder.map((category) => {
                const items = menuItemsByCategory[category] || [];
                if (items.length === 0) return null;

                return (
                  <div key={category} className="space-y-3">
                    <div className="text-sm font-medium text-[#142653] uppercase tracking-wide">
                      {category}
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <Card key={item.id} className="p-4 bg-white border border-[#d5e1ec] rounded-[20px]">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <div className="w-6 h-6 bg-gray-300 rounded"></div>
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-[#142653]">{item.name}</div>
                                <div className="text-sm text-gray-600">
                                  €{item.price.toFixed(2)} · {item.tags.join(', ').toLowerCase()}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" size="sm" className="rounded-full px-3 py-1 text-sm">
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="p-2">
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-2">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-6">
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
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg px-4"
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
                    <Card key={index} className="p-3 bg-white border border-[#d5e1ec] rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[#142653] capitalize">{ingredient}</span>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
