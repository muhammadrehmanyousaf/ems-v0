"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Trash2, CheckCircle, Circle, Download, Share2, ArrowLeft, Filter, Search, Calendar, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { shareCurrentTool } from "@/lib/shareTool";
import { useIsMobile } from "@/components/ui/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

const categories = [
  'Venue', 'Vendors', 'Attire', 'Invitations', 'Decor', 
  'Catering', 'Music', 'Transportation', 'Jewelry', 'Entertainment', 'Other'
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' }
];

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', title: 'Book venue', completed: false, category: 'Venue', priority: 'high' },
    { id: '2', title: 'Hire photographer', completed: true, category: 'Vendors', priority: 'high' },
    { id: '3', title: 'Choose wedding dress', completed: false, category: 'Attire', priority: 'medium' },
    { id: '4', title: 'Send invitations', completed: false, category: 'Invitations', priority: 'medium' },
    { id: '5', title: 'Book caterer', completed: false, category: 'Catering', priority: 'high' },
    { id: '6', title: 'Arrange transportation', completed: false, category: 'Transportation', priority: 'low' },
    { id: '7', title: 'Choose wedding rings', completed: false, category: 'Jewelry', priority: 'medium' },
    { id: '8', title: 'Book music/DJ', completed: false, category: 'Entertainment', priority: 'medium' },
  ]);
  
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('planning_checklist_items');
      if (saved) setItems(JSON.parse(saved));
    } catch { /* ignore corrupt data */ }
    setLoaded(true);
  }, []);

  // Persist items to localStorage
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('planning_checklist_items', JSON.stringify(items));
  }, [items, loaded]);

  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesCompletion = showCompleted || !item.completed;
    return matchesSearch && matchesCategory && matchesCompletion;
  });

  const completedCount = items.filter(item => item.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const addItem = () => {
    if (!newItem.trim()) return;
    const item: ChecklistItem = {
      id: Date.now().toString(),
      title: newItem,
      completed: false,
      category: newCategory || 'Other',
      priority: newPriority
    };
    setItems([...items, item]);
    setNewItem('');
    setNewCategory('');
    setNewPriority('medium');
    setIsAddDialogOpen(false);
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

  const exportChecklist = () => {
    const data = items.map(item => ({
      title: item.title,
      completed: item.completed ? 'Yes' : 'No',
      category: item.category,
      priority: item.priority,
      dueDate: item.dueDate || 'Not set'
    }));
    
    const csv = [
      ['Task', 'Completed', 'Category', 'Priority', 'Due Date'],
      ...data.map(row => [row.title, row.completed, row.category, row.priority, row.dueDate])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding-checklist.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Checklist exported",
      description: "Your checklist has been downloaded as CSV.",
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
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-bridal-cream rounded-2xl flex items-center justify-center shadow-lg">
            <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8 text-bridal-gold-dark" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">Wedding Checklist</h1>
            <p className="text-sm sm:text-base text-neutral-600">Stay organized with our comprehensive wedding planning checklist</p>
          </div>
          
          {/* Mobile Actions */}
          {isMobile && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={exportChecklist}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Progress Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-neutral-200 mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1">Progress Overview</h2>
            <p className="text-sm text-neutral-600">
              {completedCount} of {items.length} tasks completed
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="w-24 sm:w-32 h-2" />
            <span className="text-sm font-medium text-neutral-700">{Math.round(progress)}%</span>
          </div>
        </div>
        
        {/* Desktop Actions */}
        {!isMobile && (
          <div className="flex gap-3">
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
            <Button variant="outline" onClick={exportChecklist} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={async () => {
                const r = await shareCurrentTool({ title: "Wedding Checklist · Wedding Wala", text: "Plan your wedding checklist on Wedding Wala" });
                if (r === "copied") toast({ title: "Link copied", description: "Paste it anywhere to share this checklist." });
                else if (r === "failed") toast({ title: "Couldn't share", description: "Sharing isn't supported on this device.", variant: "destructive" });
              }}
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        )}
      </motion.div>

      {/* Filters and Search */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-neutral-200 mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Show/Hide Completed */}
          <Button
            variant={showCompleted ? "default" : "outline"}
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full sm:w-auto"
          >
            {showCompleted ? 'Hide' : 'Show'} Completed
          </Button>
        </div>
      </motion.div>

      {/* Tasks List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <AnimatePresence>
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="flex-shrink-0 mt-1"
                >
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-400 hover:text-bridal-gold transition-colors" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm sm:text-base font-medium ${item.completed ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                        <Badge className={`text-xs ${priorities.find(p => p.value === item.priority)?.color}`}>
                          {priorities.find(p => p.value === item.priority)?.label}
                        </Badge>
                        {item.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-neutral-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex-shrink-0 p-1 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-neutral-400 mb-4">
              <CalendarDays className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No tasks found</h3>
            <p className="text-neutral-600 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first wedding planning task'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Task
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Task Title</label>
              <Input
                placeholder="Enter task title..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Category</label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
                <Select value={newPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewPriority(value)}>
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
            
            <div className="flex gap-3 pt-4">
              <Button onClick={addItem} className="flex-1">
                Add Task
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
