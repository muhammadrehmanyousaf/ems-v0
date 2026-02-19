"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, Trash2, Download, Share2, ArrowLeft, Mail, Phone, UserCheck, UserX, Clock, Search, Filter, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/components/ui/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface GuestItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  rsvp: 'pending' | 'confirmed' | 'declined';
  plusOne: boolean;
  plusOneName?: string;
  dietaryRestrictions: string;
  tableNumber?: number;
  group: string;
  notes?: string;
}

const groups = [
  'Family - Bride', 'Family - Groom', 'Friends - Bride', 'Friends - Groom', 
  'Colleagues', 'Neighbors', 'Other'
];

const dietaryOptions = [
  'None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 
  'Nut-free', 'Halal', 'Kosher', 'Other'
];

export default function GuestListPage() {
  const [guests, setGuests] = useState<GuestItem[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890', rsvp: 'confirmed', plusOne: true, plusOneName: 'Jane Doe', dietaryRestrictions: 'None', group: 'Friends - Bride' },
    { id: '2', name: 'Sarah Smith', email: 'sarah@example.com', phone: '+1234567891', rsvp: 'pending', plusOne: false, dietaryRestrictions: 'Vegetarian', group: 'Family - Bride' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', phone: '+1234567892', rsvp: 'confirmed', plusOne: true, plusOneName: 'Lisa Johnson', dietaryRestrictions: 'Gluten-free', group: 'Friends - Groom' },
    { id: '4', name: 'Emily Wilson', email: 'emily@example.com', phone: '+1234567893', rsvp: 'declined', plusOne: false, dietaryRestrictions: 'None', group: 'Colleagues' },
  ]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGuest, setNewGuest] = useState<Partial<GuestItem>>({
    rsvp: 'pending',
    plusOne: false,
    dietaryRestrictions: 'None',
    group: 'Other'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedRsvp, setSelectedRsvp] = useState('all');
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('planning_guest_list');
      if (saved) setGuests(JSON.parse(saved));
    } catch { /* ignore corrupt data */ }
    setLoaded(true);
  }, []);

  // Persist guests to localStorage
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('planning_guest_list', JSON.stringify(guests));
  }, [guests, loaded]);

  // Filter guests based on search and filters
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || guest.group === selectedGroup;
    const matchesRsvp = selectedRsvp === 'all' || guest.rsvp === selectedRsvp;
    return matchesSearch && matchesGroup && matchesRsvp;
  });

  const rsvpStats = {
    confirmed: guests.filter(g => g.rsvp === 'confirmed').length,
    pending: guests.filter(g => g.rsvp === 'pending').length,
    declined: guests.filter(g => g.rsvp === 'declined').length,
  };

  const totalGuests = guests.filter(g => g.rsvp === 'confirmed').reduce((sum, g) => sum + 1 + (g.plusOne ? 1 : 0), 0);
  const rsvpProgress = guests.length > 0 ? ((rsvpStats.confirmed + rsvpStats.declined) / guests.length) * 100 : 0;

  const addGuest = () => {
    if (!newGuest.name?.trim() || !newGuest.email?.trim()) return;
    
    const guest: GuestItem = {
      id: Date.now().toString(),
      name: newGuest.name,
      email: newGuest.email,
      phone: newGuest.phone || '',
      rsvp: newGuest.rsvp || 'pending',
      plusOne: newGuest.plusOne || false,
      plusOneName: newGuest.plusOneName || '',
      dietaryRestrictions: newGuest.dietaryRestrictions || 'None',
      group: newGuest.group || 'Other',
      notes: newGuest.notes || ''
    };
    
    setGuests([...guests, guest]);
    setNewGuest({
      rsvp: 'pending',
      plusOne: false,
      dietaryRestrictions: 'None',
      group: 'Other'
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Guest added",
      description: "New guest has been added to the list successfully.",
    });
  };

  const updateGuest = (id: string, field: keyof GuestItem, value: any) => {
    setGuests(guests.map(guest => 
      guest.id === id ? { ...guest, [field]: value } : guest
    ));
  };

  const deleteGuest = (id: string) => {
    setGuests(guests.filter(guest => guest.id !== id));
    toast({
      title: "Guest deleted",
      description: "Guest has been removed from the list.",
    });
  };

  const exportGuestList = () => {
    const data = guests.map(guest => ({
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      rsvp: guest.rsvp,
      plusOne: guest.plusOne ? 'Yes' : 'No',
      plusOneName: guest.plusOneName || '',
      dietaryRestrictions: guest.dietaryRestrictions,
      group: guest.group,
      tableNumber: guest.tableNumber || '',
      notes: guest.notes || ''
    }));
    
    const csv = [
      ['Name', 'Email', 'Phone', 'RSVP', 'Plus One', 'Plus One Name', 'Dietary Restrictions', 'Group', 'Table Number', 'Notes'],
      ...data.map(row => [
        row.name, row.email, row.phone, row.rsvp, row.plusOne, 
        row.plusOneName, row.dietaryRestrictions, row.group, row.tableNumber, row.notes
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding-guest-list.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Guest list exported",
      description: "Your guest list has been downloaded as CSV.",
    });
  };

  const getRsvpColor = (rsvp: string) => {
    switch (rsvp) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'declined': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getRsvpIcon = (rsvp: string) => {
    switch (rsvp) {
      case 'confirmed': return <UserCheck className="w-4 h-4" />;
      case 'declined': return <UserX className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <Link href="/planning-tools" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm sm:text-base">Back to Planning Tools</span>
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">Guest List Manager</h1>
            <p className="text-sm sm:text-base text-neutral-600">Organize your guest list and track RSVPs in one place</p>
          </div>
          
          {/* Mobile Actions */}
          {isMobile && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={exportGuestList}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* RSVP Statistics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <UserCheck className="w-6 h-6 mr-2" />
              <p className="text-2xl sm:text-3xl font-bold">{rsvpStats.confirmed}</p>
            </div>
            <p className="text-sm text-green-100">Confirmed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 mr-2" />
              <p className="text-2xl sm:text-3xl font-bold">{rsvpStats.pending}</p>
            </div>
            <p className="text-sm text-yellow-100">Pending</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-purple-700 text-white border-0">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <UserX className="w-6 h-6 mr-2" />
              <p className="text-2xl sm:text-3xl font-bold">{rsvpStats.declined}</p>
            </div>
            <p className="text-sm text-red-100">Declined</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-6 h-6 mr-2" />
              <p className="text-2xl sm:text-3xl font-bold">{totalGuests}</p>
            </div>
            <p className="text-sm text-blue-100">Total Guests</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* RSVP Progress */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-neutral-200 mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1">RSVP Progress</h2>
            <p className="text-sm text-neutral-600">
              {Math.round(rsvpProgress)}% of guests have responded
            </p>
          </div>
          
          {/* Desktop Actions */}
          {!isMobile && (
            <div className="flex gap-3">
              <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Guest
              </Button>
              <Button variant="outline" onClick={exportGuestList} className="flex items-center gap-2">
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
        
        <Progress value={rsvpProgress} className="h-3" />
        <div className="flex justify-between text-sm text-neutral-600 mt-2">
          <span>0 responses</span>
          <span>{guests.length} total guests</span>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-neutral-200 mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Group Filter */}
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map(group => (
                <SelectItem key={group} value={group}>{group}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* RSVP Filter */}
          <Select value={selectedRsvp} onValueChange={setSelectedRsvp}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All RSVPs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All RSVPs</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Guest List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <AnimatePresence>
          {filteredGuests.map((guest) => (
            <motion.div
              key={guest.id}
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
                        {guest.name}
                        {guest.plusOne && guest.plusOneName && (
                          <span className="text-xs text-neutral-500 ml-2">
                            + {guest.plusOneName}
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {guest.group}
                        </Badge>
                        <Badge className={`text-xs ${getRsvpColor(guest.rsvp)}`}>
                          <span className="flex items-center gap-1">
                            {getRsvpIcon(guest.rsvp)}
                            {guest.rsvp}
                          </span>
                        </Badge>
                        {guest.plusOne && (
                          <Badge variant="outline" className="text-xs">
                            +1
                          </Badge>
                        )}
                        {guest.dietaryRestrictions !== 'None' && (
                          <Badge variant="outline" className="text-xs">
                            {guest.dietaryRestrictions}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-neutral-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {guest.email}
                        </div>
                        {guest.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {guest.phone}
                          </div>
                        )}
                        {guest.tableNumber && (
                          <div className="flex items-center gap-1">
                            <Table className="w-3 h-3" />
                            Table {guest.tableNumber}
                          </div>
                        )}
                      </div>
                      
                      {guest.notes && (
                        <p className="text-xs text-neutral-500 mt-2">{guest.notes}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => deleteGuest(guest.id)}
                      className="flex-shrink-0 p-1 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={guest.rsvp} onValueChange={(value: 'pending' | 'confirmed' | 'declined') => updateGuest(guest.id, 'rsvp', value)}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {guest.rsvp === 'confirmed' && (
                    <Input
                      type="number"
                      placeholder="Table #"
                      value={guest.tableNumber || ''}
                      onChange={(e) => updateGuest(guest.id, 'tableNumber', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full sm:w-20 text-sm"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredGuests.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-neutral-400 mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No guests found</h3>
            <p className="text-neutral-600 mb-4">
              {searchTerm || selectedGroup !== 'all' || selectedRsvp !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first guest to the list'
              }
            </p>
            {!searchTerm && selectedGroup === 'all' && selectedRsvp === 'all' && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Guest
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Add Guest Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Guest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">First Name</label>
                <Input
                  placeholder="John"
                  value={newGuest.name?.split(' ')[0] || ''}
                  onChange={(e) => {
                    const lastName = newGuest.name?.split(' ')[1] || '';
                    setNewGuest({ ...newGuest, name: `${e.target.value} ${lastName}`.trim() });
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Last Name</label>
                <Input
                  placeholder="Doe"
                  value={newGuest.name?.split(' ')[1] || ''}
                  onChange={(e) => {
                    const firstName = newGuest.name?.split(' ')[0] || '';
                    setNewGuest({ ...newGuest, name: `${firstName} ${e.target.value}`.trim() });
                  }}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={newGuest.email}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Phone (Optional)</label>
              <Input
                placeholder="+1234567890"
                value={newGuest.phone}
                onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Group</label>
                <Select value={newGuest.group} onValueChange={(value) => setNewGuest({ ...newGuest, group: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Dietary Restrictions</label>
                <Select value={newGuest.dietaryRestrictions} onValueChange={(value) => setNewGuest({ ...newGuest, dietaryRestrictions: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dietaryOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="plus-one"
                checked={newGuest.plusOne}
                onCheckedChange={(checked) => setNewGuest({ ...newGuest, plusOne: checked as boolean })}
              />
              <label htmlFor="plus-one" className="text-sm font-medium text-neutral-700">
                Plus One
              </label>
            </div>
            
            {newGuest.plusOne && (
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">Plus One Name</label>
                <Input
                  placeholder="Jane Doe"
                  value={newGuest.plusOneName}
                  onChange={(e) => setNewGuest({ ...newGuest, plusOneName: e.target.value })}
                />
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Notes (Optional)</label>
              <Textarea
                placeholder="Any additional notes..."
                value={newGuest.notes}
                onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button onClick={addGuest} className="flex-1">
                Add Guest
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
