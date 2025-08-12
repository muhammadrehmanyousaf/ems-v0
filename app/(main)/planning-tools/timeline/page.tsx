"use client"

import { useState } from "react";
import Link from "next/link";
import { Clock, Plus, Trash2, Download, Share2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface TimelineItem {
  id: string;
  time: string;
  event: string;
  duration: string;
  responsible: string;
  notes: string;
}

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { id: '1', time: '09:00', event: 'Hair & Makeup', duration: '2 hours', responsible: 'Bride & Bridesmaids', notes: 'Start early to avoid stress' },
    { id: '2', time: '11:00', event: 'Photographer Arrives', duration: '30 min', responsible: 'Photographer', notes: 'Getting ready photos' },
    { id: '3', time: '14:00', event: 'Ceremony', duration: '1 hour', responsible: 'Officiant', notes: 'Main ceremony' },
    { id: '4', time: '15:00', event: 'Cocktail Hour', duration: '1 hour', responsible: 'Caterer', notes: 'Appetizers and drinks' },
    { id: '5', time: '16:00', event: 'Reception', duration: '4 hours', responsible: 'Venue Coordinator', notes: 'Dinner and dancing' },
  ]);
  const [newEvent, setNewEvent] = useState<Partial<TimelineItem>>({});
  const { toast } = useToast();

  const addEvent = () => {
    if (!newEvent.time || !newEvent.event) return;
    const event: TimelineItem = {
      id: Date.now().toString(),
      time: newEvent.time,
      event: newEvent.event,
      duration: newEvent.duration || '1 hour',
      responsible: newEvent.responsible || '',
      notes: newEvent.notes || ''
    };
    setTimeline([...timeline, event]);
    setNewEvent({});
    toast({
      title: "Event added",
      description: "New timeline event has been added.",
    });
  };

  const deleteEvent = (id: string) => {
    setTimeline(timeline.filter(event => event.id !== id));
    toast({
      title: "Event deleted",
      description: "Timeline event has been removed.",
    });
  };

  const sortedTimeline = [...timeline].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/planning-tools" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-4 transition-colors duration-200">
          <ArrowLeft className="w-4 h-4" />
          Back to Planning Tools
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center shadow-lg">
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Timeline Creator</h1>
            <p className="text-neutral-600">Create a detailed timeline for your wedding day</p>
          </div>
        </div>
      </div>

      {/* Timeline Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Wedding Day Timeline</h2>
          <div className="text-sm text-neutral-600">
            {timeline.length} events scheduled
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {timeline.length > 0 ? timeline[0].time : '--'}
            </div>
            <div className="text-sm text-purple-600">Start Time</div>
          </div>
          <div className="text-center p-4 bg-rose-50 rounded-lg">
            <div className="text-2xl font-bold text-rose-600">
              {timeline.length > 0 ? timeline[timeline.length - 1].time : '--'}
            </div>
            <div className="text-sm text-rose-600">End Time</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {timeline.length}
            </div>
            <div className="text-sm text-blue-600">Total Events</div>
          </div>
        </div>
      </div>

      {/* Add New Event */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200 mb-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Add New Event</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            type="time"
            value={newEvent.time || ''}
            onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
          <Input
            placeholder="Event name"
            value={newEvent.event || ''}
            onChange={(e) => setNewEvent({...newEvent, event: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            placeholder="Duration"
            value={newEvent.duration || ''}
            onChange={(e) => setNewEvent({...newEvent, duration: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
          <Input
            placeholder="Responsible person"
            value={newEvent.responsible || ''}
            onChange={(e) => setNewEvent({...newEvent, responsible: e.target.value})}
            className="h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          />
        </div>
        <div className="flex gap-4">
          <Textarea
            placeholder="Notes"
            value={newEvent.notes || ''}
            onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
            className="flex-1 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            rows={2}
          />
          <Button onClick={addEvent} size="sm" className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Timeline Events */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200 mb-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Your Timeline</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedTimeline.map((event, index) => (
            <div key={event.id} className="flex gap-4 p-4 border border-neutral-200 rounded-xl bg-neutral-50 hover:shadow-md transition-all duration-200">
              <div className="flex-shrink-0 w-20 text-center">
                <div className="text-xl font-bold text-purple-600">{event.time}</div>
                <div className="text-xs text-neutral-500">{event.duration}</div>
                {index < sortedTimeline.length - 1 && (
                  <div className="w-0.5 h-8 bg-purple-200 mx-auto mt-2"></div>
                )}
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
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button variant="outline" size="lg" className="border-neutral-200 hover:border-rose-500 hover:text-rose-600 px-8">
          <Download className="w-4 h-4 mr-2" />
          Export Timeline
        </Button>
        <Button variant="outline" size="lg" className="border-neutral-200 hover:border-rose-500 hover:text-rose-600 px-8">
          <Share2 className="w-4 h-4 mr-2" />
          Share Timeline
        </Button>
      </div>
    </div>
  );
}
