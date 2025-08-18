"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Plus, Trash2, Download, Share2, ArrowLeft, Calendar, Users, MapPin, Search, Filter, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/components/ui/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimelineItem {
  id: string;
  time: string;
  event: string;
  duration: string;
  responsible: string;
  location: string;
  notes: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

const categories = [
  'Getting Ready', 'Ceremony', 'Reception', 'Photography', 'Transportation', 
  'Vendor Setup', 'Guest Arrival', 'Other'
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' }
];

const timeSlots = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00'
];

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { id: '1', time: '09:00', event: 'Hair & Makeup', duration: '2 hours', responsible: 'Bride & Bridesmaids', location: 'Bride\'s Suite', notes: 'Start early to avoid stress', priority: 'high', category: 'Getting Ready' },
    { id: '2', time: '11:00', event: 'Photographer Arrives', duration: '30 min', responsible: 'Photographer', location: 'Venue', notes: 'Getting ready photos', priority: 'medium', category: 'Photography' },
    { id: '3', time: '14:00', event: 'Ceremony', duration: '1 hour', responsible: 'Officiant', location: 'Ceremony Hall', notes: 'Main ceremony', priority: 'high', category: 'Ceremony' },
    { id: '4', time: '15:00', event: 'Cocktail Hour', duration: '1 hour', responsible: 'Caterer', location: 'Garden Area', notes: 'Appetizers and drinks', priority: 'medium', category: 'Reception' },
    { id: '5', time: '16:00', event: 'Reception', duration: '4 hours', responsible: 'Venue Coordinator', location: 'Main Hall', notes: 'Dinner and dancing', priority: 'high', category: 'Reception' },
  ]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<TimelineItem>>({
    duration: '1 hour',
    priority: 'medium',
    category: 'Other'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Filter timeline based on search and filters
  const filteredTimeline = timeline.filter(item => {
    const matchesSearch = item.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.responsible.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const sortedTimeline = [...filteredTimeline].sort((a, b) => a.time.localeCompare(b.time));

  const addEvent = () => {
    if (!newEvent.time || !newEvent.event?.trim()) return;
    
    const event: TimelineItem = {
      id: Date.now().toString(),
      time: newEvent.time,
      event: newEvent.event,
      duration: newEvent.duration || '1 hour',
      responsible: newEvent.responsible || '',
      location: newEvent.location || '',
      notes: newEvent.notes || '',
      priority: newEvent.priority || 'medium',
      category: newEvent.category || 'Other'
    };
    
    setTimeline([...timeline, event]);
    setNewEvent({
      duration: '1 hour',
      priority: 'medium',
      category: 'Other'
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Event added",
      description: "New timeline event has been added successfully.",
    });
  };

  const deleteEvent = (id: string) => {
    setTimeline(timeline.filter(event => event.id !== id));
    toast({
      title: "Event deleted",
      description: "Timeline event has been removed.",
    });
  };

  const exportTimeline = () => {
    const data = timeline.map(item => ({
      time: item.time,
      event: item.event,
      duration: item.duration,
      responsible: item.responsible,
      location: item.location,
      category: item.category,
      priority: item.priority,
      notes: item.notes
    }));
    
    const csv = [
      ['Time', 'Event', 'Duration', 'Responsible', 'Location', 'Category', 'Priority', 'Notes'],
      ...data.map(row => [
        row.time, row.event, row.duration, row.responsible, 
        row.location, row.category, row.priority, row.notes
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding-timeline.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Timeline exported",
      description: "Your timeline has been downloaded as CSV.",
    });
  };

  const getTotalDuration = () => {
    if (timeline.length === 0) return '0 hours';
    const startTime = timeline[0].time;
    const endTime = timeline[timeline.length - 1].time;
    // Simple calculation - in a real app you'd want more sophisticated time math
    return `${timeline.length} events`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <Link href="/planning-tools" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-4 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm sm:text-base">Back to Planning Tools</span>
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-50 rounded-2xl flex items-center justify-center shadow-lg">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">Timeline Creator</h1>
            <p className="text-sm sm:text-base text-neutral-600">Create a detailed timeline for your wedding day</p>
          </div>
          
          {/* Mobile Actions */}
          {isMobile && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={exportTimeline}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Timeline Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 mr-2" />
              <p className="text-2xl sm:text-3xl font-bold">{timeline.length}</p>
            </div>
            <p className="text-sm text-purple-100">Total Events</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-6 h-6 mr-2" />
              <p className="text-2xl sm:text-3xl font-bold">
                {timeline.length > 0 ? timeline[0].time : '--'}
              </p>
            </div>
            <p className="text-sm text-blue-100">Start Time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 mr-2" />
              <p className="text-2xl sm:text-3xl font-bold">
                {timeline.length > 0 ? timeline[timeline.length - 1].time : '--'}
              </p>
            </div>
            <p className="text-sm text-rose-100">End Time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-6 h-6 mr-2" />
              <p className="text-2xl sm:text-3xl font-bold">
                {getTotalDuration()}
              </p>
            </div>
            <p className="text-sm text-green-100">Duration</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-neutral-200 mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1">Wedding Day Timeline</h2>
            <p className="text-sm text-neutral-600">
              {timeline.length} events scheduled for your special day
            </p>
          </div>
          
          {/* Desktop Actions */}
          {!isMobile && (
            <div className="flex gap-3">
              <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
              <Button variant="outline" onClick={exportTimeline} className="flex items-center gap-2">
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
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search events..."
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
          
          {/* Priority Filter */}
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Timeline Events */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <AnimatePresence>
          {sortedTimeline.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Time and Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg text-purple-600 font-bold text-sm">
                          {item.time}
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-medium text-neutral-900">
                            {item.event}
                          </h3>
                          <p className="text-xs text-neutral-500">{item.duration}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                        <Badge className={`text-xs ${priorities.find(p => p.value === item.priority)?.color}`}>
                          {priorities.find(p => p.value === item.priority)?.label}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-neutral-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {item.responsible}
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </div>
                        )}
                      </div>
                      
                      {item.notes && (
                        <p className="text-xs text-neutral-500 mt-2">{item.notes}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => deleteEvent(item.id)}
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
        
        {sortedTimeline.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-neutral-400 mb-4">
              <Clock className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No events found</h3>
            <p className="text-neutral-600 mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first timeline event'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && selectedPriority === 'all' && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Event
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Add Event Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Timeline Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Event Name</label>
              <Input
                placeholder="e.g., Hair & Makeup"
                value={newEvent.event}
                onChange={(e) => setNewEvent({ ...newEvent, event: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Time</label>
                <Select value={newEvent.time} onValueChange={(value) => setNewEvent({ ...newEvent, time: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Duration</label>
                <Input
                  placeholder="1 hour"
                  value={newEvent.duration}
                  onChange={(e) => setNewEvent({ ...newEvent, duration: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Category</label>
                <Select value={newEvent.category} onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}>
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
                <Select value={newEvent.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewEvent({ ...newEvent, priority: value })}>
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
            
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Responsible Person</label>
              <Input
                placeholder="e.g., Bride & Bridesmaids"
                value={newEvent.responsible}
                onChange={(e) => setNewEvent({ ...newEvent, responsible: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Location (Optional)</label>
              <Input
                placeholder="e.g., Bride's Suite"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Notes (Optional)</label>
              <Textarea
                placeholder="Any additional notes..."
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button onClick={addEvent} className="flex-1">
                Add Event
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
