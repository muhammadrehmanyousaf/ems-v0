"use client"

import { useState } from "react"
import { CalendarDays, Calculator, Users, Clock, Plus, Trash2, CheckCircle, Circle, Save, Download, Share2 } from "lucide-react"
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
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Budget Calculator",
    description: "Track your expenses and manage your wedding budget effectively",
    icon: Calculator,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Guest List Manager",
    description: "Organize your guest list and track RSVPs in one place",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Timeline Creator",
    description: "Create a detailed timeline for your wedding day",
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Wedding Checklist</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {items.length} tasks completed
          </p>
        </div>
        <Progress value={progress} className="w-32" />
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Add new task..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Button onClick={addItem} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <button
              onClick={() => toggleItem(item.id)}
              className="flex-shrink-0"
            >
              {item.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <div className="flex-1">
              <p className={`${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                {item.title}
              </p>
              <Badge variant="secondary" className="text-xs">
                {item.category}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteItem(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm">
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-800">Total Budget</h4>
          <p className="text-2xl font-bold text-green-600">${totalBudget.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800">Estimated</h4>
          <p className="text-2xl font-bold text-blue-600">${totalEstimated.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-lg ${overBudget ? 'bg-red-50' : 'bg-orange-50'}`}>
          <h4 className={`font-semibold ${overBudget ? 'text-red-800' : 'text-orange-800'}`}>Remaining</h4>
          <p className={`text-2xl font-bold ${overBudget ? 'text-red-600' : 'text-orange-600'}`}>
            ${remaining.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="total-budget">Total Budget</Label>
          <Input
            id="total-budget"
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(Number(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Budget Items</h4>
          <Button onClick={addBudgetItem} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="p-3 border rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Category</Label>
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Item</Label>
                  <Input
                    value={item.item}
                    onChange={(e) => updateItem(item.id, 'item', e.target.value)}
                    placeholder="Item name"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Estimated</Label>
                  <Input
                    type="number"
                    value={item.estimated}
                    onChange={(e) => updateItem(item.id, 'estimated', Number(e.target.value))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Actual</Label>
                  <Input
                    type="number"
                    value={item.actual}
                    onChange={(e) => updateItem(item.id, 'actual', Number(e.target.value))}
                    className="text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={item.notes}
                  onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                  placeholder="Add notes..."
                  className="text-sm"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
        <Button variant="outline" size="sm">
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
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{rsvpStats.confirmed}</p>
          <p className="text-sm text-green-800">Confirmed</p>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-600">{rsvpStats.pending}</p>
          <p className="text-sm text-yellow-800">Pending</p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{rsvpStats.declined}</p>
          <p className="text-sm text-red-800">Declined</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold">Add New Guest</h4>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Full name"
            value={newGuest.name || ''}
            onChange={(e) => setNewGuest({...newGuest, name: e.target.value})}
          />
          <Input
            placeholder="Email"
            type="email"
            value={newGuest.email || ''}
            onChange={(e) => setNewGuest({...newGuest, email: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Phone"
            value={newGuest.phone || ''}
            onChange={(e) => setNewGuest({...newGuest, phone: e.target.value})}
          />
          <Input
            placeholder="Dietary restrictions"
            value={newGuest.dietaryRestrictions || ''}
            onChange={(e) => setNewGuest({...newGuest, dietaryRestrictions: e.target.value})}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newGuest.plusOne || false}
              onChange={(e) => setNewGuest({...newGuest, plusOne: e.target.checked})}
            />
            Plus One
          </label>
          <Button onClick={addGuest} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {guests.map(guest => (
          <div key={guest.id} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{guest.name}</p>
                <p className="text-sm text-muted-foreground">{guest.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={guest.rsvp}
                  onChange={(e) => updateGuest(guest.id, 'rsvp', e.target.value)}
                  className="px-2 py-1 text-sm border rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteGuest(guest.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Phone:</span> {guest.phone}
              </div>
              <div>
                <span className="font-medium">Plus One:</span> {guest.plusOne ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <span className="font-medium text-sm">Dietary:</span> {guest.dietaryRestrictions}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export List
        </Button>
        <Button variant="outline" size="sm">
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
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-semibold">Add New Event</h4>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="time"
            value={newEvent.time || ''}
            onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
          />
          <Input
            placeholder="Event name"
            value={newEvent.event || ''}
            onChange={(e) => setNewEvent({...newEvent, event: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Duration"
            value={newEvent.duration || ''}
            onChange={(e) => setNewEvent({...newEvent, duration: e.target.value})}
          />
          <Input
            placeholder="Responsible person"
            value={newEvent.responsible || ''}
            onChange={(e) => setNewEvent({...newEvent, responsible: e.target.value})}
          />
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder="Notes"
            value={newEvent.notes || ''}
            onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
            className="flex-1"
            rows={2}
          />
          <Button onClick={addEvent} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sortedTimeline.map((event, index) => (
          <div key={event.id} className="flex gap-4 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-16 text-center">
              <div className="text-lg font-bold">{event.time}</div>
              <div className="text-xs text-muted-foreground">{event.duration}</div>
            </div>
            <div className="flex-1">
              <h5 className="font-semibold">{event.event}</h5>
              <p className="text-sm text-muted-foreground">Responsible: {event.responsible}</p>
              {event.notes && (
                <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteEvent(event.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Timeline
        </Button>
        <Button variant="outline" size="sm">
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
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Essential Planning Tools</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <Dialog key={tool.title}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105">
                  <CardHeader className="text-center">
                    <div className={`w-12 h-12 ${tool.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <tool.icon className={`w-6 h-6 ${tool.color}`} />
                    </div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${tool.bgColor} rounded-lg flex items-center justify-center`}>
                      <tool.icon className={`w-5 h-5 ${tool.color}`} />
                    </div>
                    {tool.title}
                  </DialogTitle>
                  <DialogDescription>
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

