"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calculator, Plus, Trash2, Download, Share2, ArrowLeft, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/components/ui/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface BudgetItem {
  id: string;
  category: string;
  item: string;
  estimated: number;
  actual: number;
  notes: string;
  priority: 'low' | 'medium' | 'high';
}

const categories = [
  'Venue', 'Catering', 'Photography', 'Videography', 'Attire', 
  'Decor', 'Music', 'Transportation', 'Stationery', 'Beauty', 'Other'
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' }
];

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItem[]>([
    { id: '1', category: 'Venue', item: 'Reception Hall', estimated: 5000, actual: 5200, notes: 'Including setup fee', priority: 'high' },
    { id: '2', category: 'Catering', item: 'Wedding Dinner', estimated: 3000, actual: 0, notes: 'Per person cost', priority: 'high' },
    { id: '3', category: 'Photography', item: 'Wedding Photos', estimated: 1500, actual: 0, notes: 'Full day coverage', priority: 'medium' },
    { id: '4', category: 'Attire', item: 'Wedding Dress', estimated: 2000, actual: 0, notes: 'Bridal gown', priority: 'medium' },
    { id: '5', category: 'Decor', item: 'Flowers & Centerpieces', estimated: 1200, actual: 0, notes: 'Ceremony & reception', priority: 'low' },
  ]);
  const [totalBudget, setTotalBudget] = useState(15000);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
    category: 'Other',
    item: '',
    estimated: 0,
    actual: 0,
    notes: '',
    priority: 'medium'
  });
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('planning_budget_items');
      if (saved) setItems(JSON.parse(saved));
      const savedBudget = localStorage.getItem('planning_budget_total');
      if (savedBudget) setTotalBudget(JSON.parse(savedBudget));
    } catch { /* ignore corrupt data */ }
    setLoaded(true);
  }, []);

  // Persist items to localStorage
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('planning_budget_items', JSON.stringify(items));
  }, [items, loaded]);

  // Persist total budget to localStorage
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('planning_budget_total', JSON.stringify(totalBudget));
  }, [totalBudget, loaded]);

  const addBudgetItem = () => {
    if (!newItem.item?.trim()) return;
    
    const item: BudgetItem = {
      id: Date.now().toString(),
      category: newItem.category || 'Other',
      item: newItem.item,
      estimated: newItem.estimated || 0,
      actual: newItem.actual || 0,
      notes: newItem.notes || '',
      priority: newItem.priority || 'medium'
    };
    
    setItems([...items, item]);
    setNewItem({
      category: 'Other',
      item: '',
      estimated: 0,
      actual: 0,
      notes: '',
      priority: 'medium'
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Item added",
      description: "New budget item has been added successfully.",
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
  const budgetUsage = (totalActual / totalBudget) * 100;

  const exportBudget = () => {
    const data = items.map(item => ({
      category: item.category,
      item: item.item,
      estimated: item.estimated,
      actual: item.actual,
      difference: item.actual - item.estimated,
      priority: item.priority,
      notes: item.notes
    }));
    
    const csv = [
      ['Category', 'Item', 'Estimated', 'Actual', 'Difference', 'Priority', 'Notes'],
      ...data.map(row => [
        row.category, row.item, row.estimated, row.actual, 
        row.difference, row.priority, row.notes
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding-budget.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Budget exported",
      description: "Your budget has been downloaded as CSV.",
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <Link href="/planning-tools" className="inline-flex items-center gap-2 text-bridal-gold-dark hover:text-bridal-gold-dark mb-4 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm sm:text-base">Back to Planning Tools</span>
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-50 rounded-2xl flex items-center justify-center shadow-lg">
            <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">Budget Calculator</h1>
            <p className="text-sm sm:text-base text-neutral-600">Track your expenses and manage your wedding budget effectively</p>
          </div>
          
          {/* Mobile Actions */}
          {isMobile && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={exportBudget}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Budget Overview Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100 mb-1">Total Budget</p>
                <p className="text-2xl sm:text-3xl font-bold">Rs. {totalBudget.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100 mb-1">Estimated</p>
                <p className="text-2xl sm:text-3xl font-bold">Rs. {totalEstimated.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-bridal-cream mb-1">Spent</p>
                <p className="text-2xl sm:text-3xl font-bold">Rs. {totalActual.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-bridal-gold/40" />
            </div>
          </CardContent>
        </Card>

        <Card className={`text-white border-0 ${overBudget ? 'bg-gradient-to-br from-red-500 to-bridal-gold-dark' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Remaining</p>
                <p className="text-2xl sm:text-3xl font-bold">Rs. {remaining.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-neutral-200 mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1">Budget Usage</h2>
            <p className="text-sm text-neutral-600">
              {Math.round(budgetUsage)}% of your budget has been allocated
            </p>
          </div>
          
          {/* Desktop Actions */}
          {!isMobile && (
            <div className="flex gap-3">
              <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
              <Button variant="outline" onClick={exportBudget} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          )}
        </div>
        
        <Progress value={budgetUsage} className="h-3" />
        <div className="flex justify-between text-sm text-neutral-600 mt-2">
          <span>Rs. 0</span>
          <span>Rs. {totalBudget.toLocaleString()}</span>
        </div>
      </motion.div>

      {/* Budget Items */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-medium text-neutral-900 mb-1">
                        {item.item}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                        <Badge className={`text-xs ${priorities.find(p => p.value === item.priority)?.color}`}>
                          {priorities.find(p => p.value === item.priority)?.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex-shrink-0 p-1 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {item.notes && (
                    <p className="text-xs text-neutral-600 mb-3">{item.notes}</p>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs text-neutral-500 mb-1">Estimated</label>
                    <Input
                      type="number"
                      value={item.estimated}
                      onChange={(e) => updateItem(item.id, 'estimated', parseFloat(e.target.value) || 0)}
                      className="w-24 h-8 text-sm"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-xs text-neutral-500 mb-1">Actual</label>
                    <Input
                      type="number"
                      value={item.actual}
                      onChange={(e) => updateItem(item.id, 'actual', parseFloat(e.target.value) || 0)}
                      className="w-24 h-8 text-sm"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-xs text-neutral-500 mb-1">Difference</label>
                    <div className={`w-24 h-8 flex items-center justify-center text-sm font-medium rounded-md ${
                      item.actual - item.estimated > 0 
                        ? 'bg-red-100 text-red-700' 
                        : item.actual - item.estimated < 0 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      Rs. {item.actual - item.estimated}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-neutral-400 mb-4">
              <Calculator className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No budget items yet</h3>
            <p className="text-neutral-600 mb-4">
              Start tracking your wedding expenses by adding your first budget item
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Add Budget Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Budget Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Item Name</label>
              <Input
                placeholder="e.g., Wedding Dress"
                value={newItem.item}
                onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Category</label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Priority</label>
                <Select value={newItem.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewItem({ ...newItem, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Estimated Cost</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newItem.estimated}
                  onChange={(e) => setNewItem({ ...newItem, estimated: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Actual Cost</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newItem.actual}
                  onChange={(e) => setNewItem({ ...newItem, actual: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Notes (Optional)</label>
              <Textarea
                placeholder="Add any additional notes..."
                value={newItem.notes}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button onClick={addBudgetItem} className="flex-1">
                Add Item
              </Button>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
