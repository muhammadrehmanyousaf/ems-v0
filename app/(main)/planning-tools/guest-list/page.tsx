"use client"

import { useState } from "react";
import Link from "next/link";
import { Users, Plus, Trash2, Download, Share2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface GuestItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  rsvp: 'pending' | 'confirmed' | 'declined';
  plusOne: boolean;
  dietaryRestrictions: string;
  tableNumber?: number;
}

export default function GuestListPage() {
  const [guests, setGuests] = useState<GuestItem[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890', rsvp: 'confirmed', plusOne: true, dietaryRestrictions: 'None' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', rsvp: 'pending', plusOne: false, dietaryRestrictions: 'Vegetarian' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', phone: '+1234567892', rsvp: 'confirmed', plusOne: true, dietaryRestrictions: 'Gluten-free' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', phone: '+1234567893', rsvp: 'declined', plusOne: false, dietaryRestrictions: 'None' },
  ]);
  const [newGuest, setNewGuest] = useState<Partial<GuestItem>>({});
  const { toast } = useToast();

  const addGuest = () => {
    if (!newGuest.name || !newGuest.email) return;
    const guest: GuestItem = {
      id: Date.now().toString(),
      name: newGuest.name,
      email: newGuest.email,
      phone: newGuest.phone || '',
      rsvp: 'pending',
      plusOne: newGuest.plusOne || false,
      dietaryRestrictions: newGuest.dietaryRestrictions || 'None'
    };
    setGuests([...guests, guest]);
    setNewGuest({});
    toast({
      title: "Guest added",
      description: "New guest has been added to the list.",
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

  const rsvpStats = {
    confirmed: guests.filter(g => g.rsvp === 'confirmed').length,
    pending: guests.filter(g => g.rsvp === 'pending').length,
    declined: guests.filter(g => g.rsvp === 'declined').length,
  };

  const totalGuests = guests.filter(g => g.rsvp === 'confirmed').reduce((sum, g) => sum + 1 + (g.plusOne ? 1 : 0), 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/planning-tools" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-4 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" />
          Back to Planning Tools
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Guest List Manager</h1>
            <p className="text-neutral-600">Organize your guest list and track RSVPs in one place</p>
          </div>
        </div>
      </div>

      {/* RSVP Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white text-center shadow-lg">
          <p className="text-3xl font-bold">{rsvpStats.confirmed}</p>
          <p className="text-sm text-green-100">Confirmed</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl text-white text-center shadow-lg">
          <p className="text-3xl font-bold">{rsvpStats.pending}</p>
          <p className="text-sm text-yellow-100">Pending</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl text-white text-center shadow-lg">
          <p className="text-3xl font-bold">{rsvpStats.declined}</p>
          <p className="text-sm text-red-100">Declined</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl text-white text-center shadow-lg">
          <p className="text-3xl font-bold">{totalGuests}</p>
          <p className="text-sm text-purple-100">Total Guests</p>
        </div>
      </div>

      {/* Add New Guest */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200 mb-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Add New Guest</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            placeholder="Full name"
            value={newGuest.name || ''}
            onChange={(e) => setNewGuest({...newGuest, name: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
          <Input
            placeholder="Email"
            type="email"
            value={newGuest.email || ''}
            onChange={(e) => setNewGuest({...newGuest, email: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            placeholder="Phone"
            value={newGuest.phone || ''}
            onChange={(e) => setNewGuest({...newGuest, phone: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
          <Input
            placeholder="Dietary restrictions"
            value={newGuest.dietaryRestrictions || ''}
            onChange={(e) => setNewGuest({...newGuest, dietaryRestrictions: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newGuest.plusOne || false}
              onChange={(e) => setNewGuest({...newGuest, plusOne: e.target.checked})}
              className="w-4 h-4 text-rose-600 border-neutral-300 rounded focus:ring-rose-500"
            />
            Plus One
          </label>
          <Button onClick={addGuest} size="sm" className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Guest List */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200 mb-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Guest List</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {guests.map(guest => (
            <div key={guest.id} className="p-4 border border-neutral-200 rounded-xl space-y-3 bg-neutral-50 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-neutral-900">{guest.name}</p>
                  <p className="text-sm text-neutral-600">{guest.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={guest.rsvp}
                    onChange={(e) => updateGuest(guest.id, 'rsvp', e.target.value)}
                    className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="declined">Declined</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGuest(guest.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-neutral-700">Phone:</span> {guest.phone}
                </div>
                <div>
                  <span className="font-medium text-neutral-700">Plus One:</span> {guest.plusOne ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <span className="font-medium text-sm text-neutral-700">Dietary:</span> {guest.dietaryRestrictions}
              </div>
              <div className="flex gap-2">
                <Badge 
                  variant="secondary" 
                  className={`${
                    guest.rsvp === 'confirmed' ? 'bg-green-100 text-green-700' :
                    guest.rsvp === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  } border-0`}
                >
                  {guest.rsvp.charAt(0).toUpperCase() + guest.rsvp.slice(1)}
                </Badge>
                {guest.plusOne && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0">
                    +1
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" size="lg" className="border-neutral-200 hover:border-rose-500 hover:text-rose-600 px-8">
          <Download className="w-4 h-4 mr-2" />
          Export List
        </Button>
        <Button variant="outline" size="lg" className="border-neutral-200 hover:border-rose-500 hover:text-rose-600 px-8">
          <Share2 className="w-4 h-4 mr-2" />
          Share List
        </Button>
      </div>
    </div>
  );
}
