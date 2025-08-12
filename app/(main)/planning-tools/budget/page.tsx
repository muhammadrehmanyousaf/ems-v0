"use client"

import { useState } from "react";
import Link from "next/link";
import { Calculator, Plus, Trash2, Download, Share2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface BudgetItem {
  id: string;
  category: string;
  item: string;
  estimated: number;
  actual: number;
  notes: string;
}

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItem[]>([
    { id: '1', category: 'Venue', item: 'Reception Hall', estimated: 5000, actual: 5200, notes: 'Including setup fee' },
    { id: '2', category: 'Catering', item: 'Wedding Dinner', estimated: 3000, actual: 0, notes: 'Per person cost' },
    { id: '3', category: 'Photography', item: 'Wedding Photos', estimated: 1500, actual: 0, notes: 'Full day coverage' },
    { id: '4', category: 'Attire', item: 'Wedding Dress', estimated: 2000, actual: 0, notes: 'Bridal gown' },
    { id: '5', category: 'Decor', item: 'Flowers & Centerpieces', estimated: 1200, actual: 0, notes: 'Ceremony & reception' },
  ]);
  const [totalBudget, setTotalBudget] = useState(15000);
  const { toast } = useToast();

  const categories = ['Venue', 'Catering', 'Photography', 'Videography', 'Attire', 'Decor', 'Music', 'Transportation', 'Stationery', 'Beauty', 'Other'];

  const addBudgetItem = () => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      category: 'Other',
      item: '',
      estimated: 0,
      actual: 0,
      notes: ''
    };
    setItems([...items, newItem]);
    toast({
      title: "Item added",
      description: "New budget item has been added.",
    });
  };

  const updateItem = (id: string, field: keyof BudgetItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast({
      title: "Item deleted",
      description: "Budget item has been removed.",
    });
  };

  const totalEstimated = items.reduce((sum, item) => sum + item.estimated, 0);
  const totalActual = items.reduce((sum, item) => sum + item.actual, 0);
  const remaining = totalBudget - totalActual;
  const overBudget = remaining < 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/planning-tools" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-4 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" />
          Back to Planning Tools
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center shadow-lg">
            <Calculator className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Budget Calculator</h1>
            <p className="text-neutral-600">Track your expenses and manage your wedding budget effectively</p>
          </div>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
          <h4 className="font-semibold text-green-100">Total Budget</h4>
          <p className="text-3xl font-bold">₹{totalBudget.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
          <h4 className="font-semibold text-blue-100">Estimated</h4>
          <p className="text-3xl font-bold">₹{totalEstimated.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-xl text-white shadow-lg ${overBudget ? 'bg-gradient-to-br from-red-500 to-pink-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}>
          <h4 className="font-semibold">Remaining</h4>
          <p className="text-3xl font-bold">₹{remaining.toLocaleString()}</p>
        </div>
      </div>

      {/* Total Budget Input */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200 mb-8">
        <div className="flex items-center justify-between">
          <Label htmlFor="total-budget" className="text-lg font-semibold">Set Total Budget</Label>
          <Input
            id="total-budget"
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(Number(e.target.value))}
            className="w-40 h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>
      </div>

      {/* Budget Items */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-neutral-900">Budget Items</h3>
          <Button onClick={addBudgetItem} size="sm" className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="p-4 border border-neutral-200 rounded-xl space-y-4 bg-neutral-50 hover:shadow-md transition-all duration-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-neutral-700">Category</Label>
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 mt-1"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-neutral-700">Item</Label>
                  <Input
                    value={item.item}
                    onChange={(e) => updateItem(item.id, 'item', e.target.value)}
                    placeholder="Item name"
                    className="text-sm mt-1 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-neutral-700">Estimated (₹)</Label>
                  <Input
                    type="number"
                    value={item.estimated}
                    onChange={(e) => updateItem(item.id, 'estimated', Number(e.target.value))}
                    className="text-sm mt-1 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-neutral-700">Actual (₹)</Label>
                  <Input
                    type="number"
                    value={item.actual}
                    onChange={(e) => updateItem(item.id, 'actual', Number(e.target.value))}
                    className="text-sm mt-1 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-neutral-700">Notes</Label>
                <Textarea
                  value={item.notes}
                  onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                  placeholder="Add notes..."
                  className="text-sm mt-1 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" size="lg" className="border-neutral-200 hover:border-rose-500 hover:text-rose-600 px-8">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
        <Button variant="outline" size="lg" className="border-neutral-200 hover:border-rose-500 hover:text-rose-600 px-8">
          <Share2 className="w-4 h-4 mr-2" />
          Share Budget
        </Button>
      </div>
    </div>
  );
}
