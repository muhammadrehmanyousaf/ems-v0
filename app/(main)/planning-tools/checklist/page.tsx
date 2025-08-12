"use client"

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Trash2, CheckCircle, Circle, Download, Share2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  category: string;
}

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', title: 'Book venue', completed: false, category: 'Venue' },
    { id: '2', title: 'Hire photographer', completed: true, category: 'Vendors' },
    { id: '3', title: 'Choose wedding dress', completed: false, category: 'Attire' },
    { id: '4', title: 'Send invitations', completed: false, category: 'Invitations' },
    { id: '5', title: 'Book caterer', completed: false, category: 'Catering' },
    { id: '6', title: 'Arrange transportation', completed: false, category: 'Transportation' },
    { id: '7', title: 'Choose wedding rings', completed: false, category: 'Jewelry' },
    { id: '8', title: 'Book music/DJ', completed: false, category: 'Entertainment' },
  ]);
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const { toast } = useToast();

  const categories = ['Venue', 'Vendors', 'Attire', 'Invitations', 'Decor', 'Catering', 'Music', 'Transportation', 'Jewelry', 'Entertainment', 'Other'];

  const addItem = () => {
    if (!newItem.trim()) return;
    const item: ChecklistItem = {
      id: Date.now().toString(),
      title: newItem,
      completed: false,
      category: newCategory || 'General'
    };
    setItems([...items, item]);
    setNewItem('');
    setNewCategory('');
    toast({
      title: "Item added",
      description: "New checklist item has been added successfully.",
    });
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast({
      title: "Item deleted",
      description: "Checklist item has been removed.",
    });
  };

  const completedCount = items.filter(item => item.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/planning-tools" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-4 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" />
          Back to Planning Tools
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center shadow-lg">
            <CalendarDays className="w-8 h-8 text-rose-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Wedding Checklist</h1>
            <p className="text-neutral-600">Stay organized with our comprehensive wedding planning checklist</p>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Progress Overview</h2>
            <p className="text-sm text-neutral-600">
              {completedCount} of {items.length} tasks completed
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="w-32 h-2" />
            <Badge className="bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0">
              {Math.round(progress)}%
            </Badge>
          </div>
        </div>
      </div>

      {/* Add New Item */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200 mb-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Add New Task</h3>
        <div className="flex gap-3">
          <Input
            placeholder="Add new task..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            className="flex-1 h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 h-12"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Button onClick={addItem} size="sm" className="h-12 px-6 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200 mb-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Your Tasks</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:shadow-md transition-all duration-200">
              <button
                onClick={() => toggleItem(item.id)}
                className="flex-shrink-0 hover:scale-110 transition-transform duration-200"
              >
                {item.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Circle className="w-6 h-6 text-neutral-400 hover:text-rose-500" />
                )}
              </button>
              <div className="flex-1">
                <p className={`font-medium ${item.completed ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                  {item.title}
                </p>
                <Badge variant="secondary" className="mt-1 bg-rose-100 text-rose-700 border-0">
                  {item.category}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteItem(item.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" size="lg" className="border-neutral-200 hover:border-rose-500 hover:text-rose-600 px-8">
          <Download className="w-4 h-4 mr-2" />
          Export Checklist
        </Button>
        <Button variant="outline" size="lg" className="border-neutral-200 hover:border-rose-500 hover:text-rose-600 px-8">
          <Share2 className="w-4 h-4 mr-2" />
          Share Checklist
        </Button>
      </div>
    </div>
  );
}
