"use client"

import { useState } from "react"
import { CalendarDays, Calculator, Users, Clock, Plus, Trash2, CheckCircle, Circle, Save, Download, Share2, Heart, Star, Award, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

// Types
interface ChecklistItem {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  category: string
}

interface BudgetItem {
  id: string
  category: string
  item: string
  estimated: number
  actual: number
  notes: string
}

interface GuestItem {
  id: string
  name: string
  email: string
  phone: string
  rsvp: 'pending' | 'confirmed' | 'declined'
  plusOne: boolean
  dietaryRestrictions: string
  tableNumber?: number
}

interface TimelineItem {
  id: string
  time: string
  event: string
  duration: string
  responsible: string
  notes: string
}

const tools = [
  {
    title: "Wedding Checklist",
    description: "Stay organized with our comprehensive wedding planning checklist",
    icon: CalendarDays,
    gradient: "from-purple-600 via-purple-700 to-violet-800",
    accentColor: "text-purple-300",
    step: "01",
  },
  {
    title: "Budget Calculator",
    description: "Track your expenses and manage your wedding budget effectively",
    icon: Calculator,
    gradient: "from-gold-500 via-amber-600 to-orange-700",
    accentColor: "text-amber-200",
    step: "02",
  },
  {
    title: "Guest List Manager",
    description: "Organize your guest list and track RSVPs in one place",
    icon: Users,
    gradient: "from-purple-500 via-indigo-600 to-blue-700",
    accentColor: "text-indigo-200",
    step: "03",
  },
  {
    title: "Timeline Creator",
    description: "Create a detailed timeline for your wedding day",
    icon: Clock,
    gradient: "from-purple-800 via-purple-900 to-slate-900",
    accentColor: "text-purple-300",
    step: "04",
  },
]

// Checklist Component
function ChecklistTool() {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', title: 'Book venue', completed: false, category: 'Venue' },
    { id: '2', title: 'Hire photographer', completed: true, category: 'Vendors' },
    { id: '3', title: 'Choose wedding dress', completed: false, category: 'Attire' },
    { id: '4', title: 'Send invitations', completed: false, category: 'Invitations' },
  ])
  const [newItem, setNewItem] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const { toast } = useToast()

  const categories = ['Venue', 'Vendors', 'Attire', 'Invitations', 'Decor', 'Catering', 'Music', 'Transportation']

  const addItem = () => {
    if (!newItem.trim()) return
    const item: ChecklistItem = {
      id: Date.now().toString(),
      title: newItem,
      completed: false,
      category: newCategory || 'General'
    }
    setItems([...items, item])
    setNewItem('')
    setNewCategory('')
    toast({
      title: "Item added",
      description: "New checklist item has been added successfully.",
    })
  }

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    toast({
      title: "Item deleted",
      description: "Checklist item has been removed.",
    })
  }

  const completedCount = items.filter(item => item.completed).length
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-neutral-900">Wedding Checklist</h3>
          <p className="text-sm text-neutral-600">
            {completedCount} of {items.length} tasks completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progress} className="w-32 h-2" />
          <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0">
            {Math.round(progress)}%
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder="Add new task..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            className="flex-1 h-12 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 h-12"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Button onClick={addItem} size="sm" className="h-12 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-xl hover:shadow-md transition-all duration-200">
            <button
              onClick={() => toggleItem(item.id)}
              className="flex-shrink-0 hover:scale-110 transition-transform duration-200"
            >
              {item.completed ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Circle className="w-6 h-6 text-neutral-400 hover:text-purple-500" />
              )}
            </button>
            <div className="flex-1">
              <p className={`font-medium ${item.completed ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                {item.title}
              </p>
              <Badge variant="secondary" className="mt-1 bg-purple-100 text-purple-700 border-0">
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

      <div className="flex gap-3 pt-4 border-t border-neutral-200">
        <Button variant="outline" size="sm" className="border-neutral-200 hover:border-purple-500 hover:text-purple-600">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm" className="border-neutral-200 hover:border-purple-500 hover:text-purple-600">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  )
}

// Budget Calculator Component
function BudgetCalculator() {
  const [items, setItems] = useState<BudgetItem[]>([
    { id: '1', category: 'Venue', item: 'Reception Hall', estimated: 5000, actual: 5200, notes: 'Including setup fee' },
    { id: '2', category: 'Catering', item: 'Wedding Dinner', estimated: 3000, actual: 0, notes: 'Per person cost' },
    { id: '3', category: 'Photography', item: 'Wedding Photos', estimated: 1500, actual: 0, notes: 'Full day coverage' },
  ])
  const [totalBudget, setTotalBudget] = useState(15000)
  const { toast } = useToast()

  const categories = ['Venue', 'Catering', 'Photography', 'Videography', 'Attire', 'Decor', 'Music', 'Transportation', 'Stationery', 'Beauty', 'Other']

  const addBudgetItem = () => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      category: 'Other',
      item: '',
      estimated: 0,
      actual: 0,
      notes: ''
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof BudgetItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const totalEstimated = items.reduce((sum, item) => sum + item.estimated, 0)
  const totalActual = items.reduce((sum, item) => sum + item.actual, 0)
  const remaining = totalBudget - totalActual
  const overBudget = remaining < 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
          <h4 className="font-semibold text-green-100">Total Budget</h4>
          <p className="text-3xl font-bold">Rs. {totalBudget.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
          <h4 className="font-semibold text-blue-100">Estimated</h4>
          <p className="text-3xl font-bold">Rs. {totalEstimated.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-xl text-white shadow-lg ${overBudget ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}>
          <h4 className="font-semibold">Remaining</h4>
          <p className="text-3xl font-bold">Rs. {remaining.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="total-budget" className="text-lg font-semibold">Total Budget</Label>
          <Input
            id="total-budget"
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(Number(e.target.value))}
            className="w-40 h-12 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Budget Items</h4>
          <Button onClick={addBudgetItem} size="sm" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4 max-h-64 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="p-4 border border-neutral-200 rounded-xl space-y-4 bg-white hover:shadow-md transition-all duration-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-neutral-700">Category</Label>
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mt-1"
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
                    className="text-sm mt-1 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-neutral-700">Estimated</Label>
                  <Input
                    type="number"
                    value={item.estimated}
                    onChange={(e) => updateItem(item.id, 'estimated', Number(e.target.value))}
                    className="text-sm mt-1 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-neutral-700">Actual</Label>
                  <Input
                    type="number"
                    value={item.actual}
                    onChange={(e) => updateItem(item.id, 'actual', Number(e.target.value))}
                    className="text-sm mt-1 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                  className="text-sm mt-1 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-neutral-200">
        <Button variant="outline" size="sm" className="border-neutral-200 hover:border-purple-500 hover:text-purple-600">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
        <Button variant="outline" size="sm" className="border-neutral-200 hover:border-purple-500 hover:text-purple-600">
          <Share2 className="w-4 h-4 mr-2" />
          Share Budget
        </Button>
      </div>
    </div>
  )
}

// Guest List Manager Component
function GuestListManager() {
  const [guests, setGuests] = useState<GuestItem[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890', rsvp: 'confirmed', plusOne: true, dietaryRestrictions: 'None' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', rsvp: 'pending', plusOne: false, dietaryRestrictions: 'Vegetarian' },
  ])
  const [newGuest, setNewGuest] = useState<Partial<GuestItem>>({})
  const { toast } = useToast()

  const addGuest = () => {
    if (!newGuest.name || !newGuest.email) return
    const guest: GuestItem = {
      id: Date.now().toString(),
      name: newGuest.name,
      email: newGuest.email,
      phone: newGuest.phone || '',
      rsvp: 'pending',
      plusOne: newGuest.plusOne || false,
      dietaryRestrictions: newGuest.dietaryRestrictions || 'None'
    }
    setGuests([...guests, guest])
    setNewGuest({})
    toast({
      title: "Guest added",
      description: "New guest has been added to the list.",
    })
  }

  const updateGuest = (id: string, field: keyof GuestItem, value: any) => {
    setGuests(guests.map(guest => 
      guest.id === id ? { ...guest, [field]: value } : guest
    ))
  }

  const deleteGuest = (id: string) => {
    setGuests(guests.filter(guest => guest.id !== id))
  }

  const rsvpStats = {
    confirmed: guests.filter(g => g.rsvp === 'confirmed').length,
    pending: guests.filter(g => g.rsvp === 'pending').length,
    declined: guests.filter(g => g.rsvp === 'declined').length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white text-center shadow-lg">
          <p className="text-3xl font-bold">{rsvpStats.confirmed}</p>
          <p className="text-sm text-green-100">Confirmed</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl text-white text-center shadow-lg">
          <p className="text-3xl font-bold">{rsvpStats.pending}</p>
          <p className="text-sm text-yellow-100">Pending</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white text-center shadow-lg">
          <p className="text-3xl font-bold">{rsvpStats.declined}</p>
          <p className="text-sm text-red-100">Declined</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Add New Guest</h4>
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Full name"
            value={newGuest.name || ''}
            onChange={(e) => setNewGuest({...newGuest, name: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <Input
            placeholder="Email"
            type="email"
            value={newGuest.email || ''}
            onChange={(e) => setNewGuest({...newGuest, email: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Phone"
            value={newGuest.phone || ''}
            onChange={(e) => setNewGuest({...newGuest, phone: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <Input
            placeholder="Dietary restrictions"
            value={newGuest.dietaryRestrictions || ''}
            onChange={(e) => setNewGuest({...newGuest, dietaryRestrictions: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newGuest.plusOne || false}
              onChange={(e) => setNewGuest({...newGuest, plusOne: e.target.checked})}
              className="w-4 h-4 text-purple-600 border-neutral-300 rounded focus:ring-purple-500"
            />
            Plus One
          </label>
          <Button onClick={addGuest} size="sm" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {guests.map(guest => (
          <div key={guest.id} className="p-4 border border-neutral-200 rounded-xl space-y-3 bg-white hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-neutral-900">{guest.name}</p>
                <p className="text-sm text-neutral-600">{guest.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={guest.rsvp}
                  onChange={(e) => updateGuest(guest.id, 'rsvp', e.target.value)}
                  className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 border-t border-neutral-200">
        <Button variant="outline" size="sm" className="border-neutral-200 hover:border-purple-500 hover:text-purple-600">
          <Download className="w-4 h-4 mr-2" />
          Export List
        </Button>
        <Button variant="outline" size="sm" className="border-neutral-200 hover:border-purple-500 hover:text-purple-600">
          <Share2 className="w-4 h-4 mr-2" />
          Share List
        </Button>
      </div>
    </div>
  )
}

// Timeline Creator Component
function TimelineCreator() {
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { id: '1', time: '09:00', event: 'Hair & Makeup', duration: '2 hours', responsible: 'Bride & Bridesmaids', notes: 'Start early to avoid stress' },
    { id: '2', time: '11:00', event: 'Photographer Arrives', duration: '30 min', responsible: 'Photographer', notes: 'Getting ready photos' },
    { id: '3', time: '14:00', event: 'Ceremony', duration: '1 hour', responsible: 'Officiant', notes: 'Main ceremony' },
  ])
  const [newEvent, setNewEvent] = useState<Partial<TimelineItem>>({})
  const { toast } = useToast()

  const addEvent = () => {
    if (!newEvent.time || !newEvent.event) return
    const event: TimelineItem = {
      id: Date.now().toString(),
      time: newEvent.time,
      event: newEvent.event,
      duration: newEvent.duration || '1 hour',
      responsible: newEvent.responsible || '',
      notes: newEvent.notes || ''
    }
    setTimeline([...timeline, event])
    setNewEvent({})
    toast({
      title: "Event added",
      description: "New timeline event has been added.",
    })
  }

  const deleteEvent = (id: string) => {
    setTimeline(timeline.filter(event => event.id !== id))
  }

  const sortedTimeline = [...timeline].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Add New Event</h4>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="time"
            value={newEvent.time || ''}
            onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <Input
            placeholder="Event name"
            value={newEvent.event || ''}
            onChange={(e) => setNewEvent({...newEvent, event: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Duration"
            value={newEvent.duration || ''}
            onChange={(e) => setNewEvent({...newEvent, duration: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <Input
            placeholder="Responsible person"
            value={newEvent.responsible || ''}
            onChange={(e) => setNewEvent({...newEvent, responsible: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="flex gap-4">
          <Textarea
            placeholder="Notes"
            value={newEvent.notes || ''}
            onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
            className="flex-1 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            rows={2}
          />
          <Button onClick={addEvent} size="sm" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {sortedTimeline.map((event, index) => (
          <div key={event.id} className="flex gap-4 p-4 border border-neutral-200 rounded-xl bg-white hover:shadow-md transition-all duration-200">
            <div className="flex-shrink-0 w-20 text-center">
              <div className="text-xl font-bold text-purple-600">{event.time}</div>
              <div className="text-xs text-neutral-500">{event.duration}</div>
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-neutral-900">{event.event}</h5>
              <p className="text-sm text-neutral-600">Responsible: {event.responsible}</p>
              {event.notes && (
                <p className="text-sm text-neutral-500 mt-1">{event.notes}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteEvent(event.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 border-t border-neutral-200">
        <Button variant="outline" size="sm" className="border-neutral-200 hover:border-purple-500 hover:text-purple-600">
          <Download className="w-4 h-4 mr-2" />
          Export Timeline
        </Button>
        <Button variant="outline" size="sm" className="border-neutral-200 hover:border-purple-500 hover:text-purple-600">
          <Share2 className="w-4 h-4 mr-2" />
          Share Timeline
        </Button>
      </div>
    </div>
  )
}

export function PlanningTools() {
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const getToolContent = (toolTitle: string) => {
    switch (toolTitle) {
      case "Wedding Checklist":
        return <ChecklistTool />
      case "Budget Calculator":
        return <BudgetCalculator />
      case "Guest List Manager":
        return <GuestListManager />
      case "Timeline Creator":
        return <TimelineCreator />
      default:
        return null
    }
  }

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-white via-purple-50/30 to-white">
      <div className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold-600 mb-2">Plan Your Day</p>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3">Essential Planning Tools</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Everything you need to plan your perfect wedding, all in one place.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {tools.map((tool) => (
            <Dialog key={tool.title}>
              <DialogTrigger asChild>
                <div className={`relative cursor-pointer group rounded-2xl overflow-hidden bg-gradient-to-br ${tool.gradient} p-5 sm:p-6 flex flex-col justify-between min-h-[200px] sm:min-h-[240px] shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}>
                  {/* Step number watermark */}
                  <span className="absolute top-3 right-4 text-5xl sm:text-6xl font-heading font-black text-white/10 leading-none select-none">
                    {tool.step}
                  </span>

                  <div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300">
                      <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight mb-1.5">{tool.title}</h3>
                    <p className={`text-xs sm:text-sm ${tool.accentColor} leading-snug line-clamp-2`}>{tool.description}</p>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-white/80 text-xs sm:text-sm font-medium group-hover:text-white transition-colors">
                    Open Tool
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-2xl">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg`}>
                      <tool.icon className="w-5 h-5 text-white" />
                    </div>
                    {tool.title}
                  </DialogTitle>
                  <DialogDescription className="text-base text-neutral-600">
                    {tool.description}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6">
                  {getToolContent(tool.title)}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </section>
  )
}

