"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Camera, Heart, Share2, Bookmark, ArrowRight, CheckCircle, AlertCircle, Info, Star, Award } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const tips = [
  {
    icon: Calendar,
    title: "When to Start Planning",
    description: "Ideal timeline for wedding planning and important milestones",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    gradient: "from-purple-600 to-purple-700",
    content: {
      timeline: [
        { month: "12-18 months before", tasks: ["Set budget", "Choose wedding style", "Book venue", "Hire photographer"] },
        { month: "10-12 months before", tasks: ["Choose wedding party", "Book caterer", "Start dress shopping", "Plan honeymoon"] },
        { month: "8-10 months before", tasks: ["Book entertainment", "Choose florist", "Plan ceremony details", "Book transportation"] },
        { month: "6-8 months before", tasks: ["Send invitations", "Book hotel blocks", "Schedule tastings", "Plan rehearsal dinner"] },
        { month: "4-6 months before", tasks: ["Buy wedding rings", "Schedule hair/makeup", "Plan ceremony music", "Book officiant"] },
        { month: "2-4 months before", tasks: ["Finalize details", "Schedule rehearsal", "Plan day-of timeline", "Get marriage license"] },
        { month: "1-2 months before", tasks: ["Final fittings", "Confirm all vendors", "Plan seating chart", "Write vows"] },
        { month: "1 week before", tasks: ["Final vendor meetings", "Pack for honeymoon", "Relax and enjoy!"] }
      ],
      tips: [
        "Start with the big decisions first - venue and date",
        "Create a detailed budget spreadsheet",
        "Use a wedding planning app or binder",
        "Delegate tasks to trusted family/friends",
        "Don't forget to enjoy the process!"
      ],
      checklist: [
        "Set realistic budget",
        "Choose wedding date",
        "Book ceremony venue",
        "Book reception venue",
        "Hire photographer",
        "Hire videographer",
        "Choose wedding dress",
        "Book caterer",
        "Choose florist",
        "Book entertainment",
        "Send invitations",
        "Plan honeymoon"
      ]
    }
  },
  {
    icon: Clock,
    title: "Wedding Day Timeline",
    description: "How to create the perfect schedule for your big day",
    color: "text-green-600",
    bgColor: "bg-green-50",
    gradient: "from-green-500 to-emerald-600",
    content: {
      timeline: [
        { time: "6:00 AM", event: "Bride & Bridesmaids Hair & Makeup", duration: "3 hours", notes: "Start early to avoid stress" },
        { time: "9:00 AM", event: "Photographer Arrives", duration: "30 min", notes: "Getting ready photos" },
        { time: "10:00 AM", event: "Groom & Groomsmen Prep", duration: "1 hour", notes: "Include getting ready photos" },
        { time: "11:00 AM", event: "First Look (Optional)", duration: "30 min", notes: "Private moment before ceremony" },
        { time: "12:00 PM", event: "Ceremony", duration: "1 hour", notes: "Main wedding ceremony" },
        { time: "1:00 PM", event: "Cocktail Hour", duration: "1 hour", notes: "Photos and mingling" },
        { time: "2:00 PM", event: "Reception", duration: "4-5 hours", notes: "Dinner, dancing, celebrations" },
        { time: "7:00 PM", event: "Grand Exit", duration: "30 min", notes: "Sparklers, bubbles, or confetti" }
      ],
      tips: [
        "Build in buffer time between events",
        "Consider travel time between venues",
        "Plan for weather contingencies",
        "Assign a timeline manager",
        "Share timeline with all vendors"
      ],
      checklist: [
        "Create detailed timeline",
        "Share with wedding party",
        "Share with vendors",
        "Plan transportation",
        "Prepare emergency kit",
        "Assign timeline manager",
        "Plan backup for weather",
        "Practice ceremony timing"
      ]
    }
  },
  {
    icon: Users,
    title: "Guest List Tips",
    description: "Managing your guest list and seating arrangements",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    gradient: "from-blue-500 to-indigo-600",
    content: {
      categories: [
        { name: "Family", percentage: 40, description: "Immediate and extended family members" },
        { name: "Friends", percentage: 35, description: "Close friends and social circle" },
        { name: "Colleagues", percentage: 15, description: "Work friends and professional contacts" },
        { name: "Vendors", percentage: 10, description: "Photographer, planner, etc." }
      ],
      tips: [
        "Start with must-have guests",
        "Consider venue capacity",
        "Plan for plus-ones carefully",
        "Use digital RSVP system",
        "Track dietary restrictions"
      ],
      seating: [
        "Front rows for immediate family",
        "Close friends near the couple",
        "Group similar people together",
        "Consider family dynamics",
        "Plan for singles and couples"
      ],
      checklist: [
        "Create initial guest list",
        "Categorize by priority",
        "Check venue capacity",
        "Plan plus-one policy",
        "Create RSVP system",
        "Track responses",
        "Plan seating chart",
        "Consider dietary needs"
      ]
    }
  },
  {
    icon: Camera,
    title: "Photography Guide",
    description: "Essential shots and styles for your wedding album",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    gradient: "from-purple-500 to-violet-600",
    content: {
      styles: [
        { name: "Traditional", description: "Classic posed portraits and formal shots", pros: "Timeless, family-friendly", cons: "Less candid moments" },
        { name: "Photojournalistic", description: "Documentary style capturing natural moments", pros: "Authentic, emotional", cons: "Less control over poses" },
        { name: "Fine Art", description: "Creative, artistic approach with unique angles", pros: "Unique, artistic", cons: "May miss traditional shots" },
        { name: "Contemporary", description: "Modern, trendy style with current aesthetics", pros: "Current, stylish", cons: "May date quickly" }
      ],
      shots: [
        "Getting ready photos",
        "First look",
        "Ceremony moments",
        "Family portraits",
        "Wedding party shots",
        "Reception highlights",
        "Detail shots",
        "Candid moments"
      ],
      tips: [
        "Meet photographer before booking",
        "Create shot list",
        "Plan for lighting conditions",
        "Consider second shooter",
        "Discuss editing style"
      ],
      checklist: [
        "Research photographers",
        "View full galleries",
        "Check references",
        "Discuss package options",
        "Sign contract",
        "Create shot list",
        "Plan timeline",
        "Discuss backup plan"
      ]
    }
  }
]

function TipDetailModal({ tip }: { tip: any }) {
  const { toast } = useToast()

  const handleShare = () => {
    navigator.share?.({
      title: tip.title,
      text: tip.description,
      url: window.location.href
    }).catch(() => {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Tip link has been copied to clipboard.",
      })
    })
  }

  const handleSave = () => {
    toast({
      title: "Tip saved!",
      description: "This tip has been saved successfully.",
    })
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3 text-2xl">
          <div className={`w-12 h-12 ${tip.bgColor} rounded-xl flex items-center justify-center shadow-lg`}>
            <tip.icon className={`w-7 h-7 ${tip.color}`} />
          </div>
          {tip.title}
        </DialogTitle>
        <DialogDescription className="text-lg text-neutral-600">
          {tip.description}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-8">
        {tip.title === "When to Start Planning" && (
          <>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-neutral-900">Planning Timeline</h3>
              <div className="space-y-4">
                {tip.content.timeline.map((item: any, index: number) => (
                  <div key={index} className="p-6 border border-neutral-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center gap-4 mb-4">
                      <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0">
                        {item.month}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {item.tasks.map((task: string, taskIndex: number) => (
                        <div key={taskIndex} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-neutral-900">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900">Pro Tips</h3>
                <div className="space-y-4">
                  {tip.content.tips.map((tipText: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <span className="font-medium text-neutral-900">{tipText}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900">Essential Checklist</h3>
                <div className="space-y-3">
                  {tip.content.checklist.map((item: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg hover:shadow-md transition-all duration-200">
                      <div className="w-5 h-5 border-2 border-neutral-300 rounded" />
                      <span className="font-medium text-neutral-900">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tip.title === "Wedding Day Timeline" && (
          <>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-neutral-900">Sample Timeline</h3>
              <div className="space-y-4">
                {tip.content.timeline.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-6 p-6 border border-neutral-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200">
                    <div className="flex-shrink-0 w-24 text-center">
                      <div className="text-2xl font-bold text-green-600">{item.time}</div>
                      <div className="text-sm text-neutral-500">{item.duration}</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-neutral-900">{item.event}</h4>
                      <p className="text-neutral-600">{item.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900">Timeline Tips</h3>
                <div className="space-y-4">
                  {tip.content.tips.map((tipText: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <span className="font-medium text-neutral-900">{tipText}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900">Timeline Checklist</h3>
                <div className="space-y-3">
                  {tip.content.checklist.map((item: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg hover:shadow-md transition-all duration-200">
                      <div className="w-5 h-5 border-2 border-neutral-300 rounded" />
                      <span className="font-medium text-neutral-900">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tip.title === "Guest List Tips" && (
          <>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-neutral-900">Guest List Breakdown</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {tip.content.categories.map((category: any, index: number) => (
                  <div key={index} className="p-6 border border-neutral-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-neutral-900">{category.name}</h4>
                      <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0">
                        {category.percentage}%
                      </Badge>
                    </div>
                    <p className="text-neutral-600">{category.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900">Guest List Tips</h3>
                <div className="space-y-4">
                  {tip.content.tips.map((tipText: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <span className="font-medium text-neutral-900">{tipText}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900">Seating Tips</h3>
                <div className="space-y-4">
                  {tip.content.seating.map((tipText: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="font-medium text-neutral-900">{tipText}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-neutral-900">Guest List Checklist</h3>
              <div className="grid grid-cols-2 gap-3">
                {tip.content.checklist.map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg hover:shadow-md transition-all duration-200">
                    <div className="w-5 h-5 border-2 border-neutral-300 rounded" />
                    <span className="font-medium text-neutral-900">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tip.title === "Photography Guide" && (
          <>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-neutral-900">Photography Styles</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {tip.content.styles.map((style: any, index: number) => (
                  <div key={index} className="p-6 border border-neutral-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200">
                    <h4 className="text-xl font-bold text-neutral-900 mb-3">{style.name}</h4>
                    <p className="text-neutral-600 mb-4">{style.description}</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Pros: {style.pros}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium">Cons: {style.cons}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900">Essential Shots</h3>
                <div className="grid grid-cols-2 gap-3">
                  {tip.content.shots.map((shot: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg">
                      <Camera className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-neutral-900">{shot}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-neutral-900">Photography Tips</h3>
                <div className="space-y-4">
                  {tip.content.tips.map((tipText: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <span className="font-medium text-neutral-900">{tipText}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-neutral-900">Photography Checklist</h3>
              <div className="grid grid-cols-2 gap-3">
                {tip.content.checklist.map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg hover:shadow-md transition-all duration-200">
                    <div className="w-5 h-5 border-2 border-neutral-300 rounded" />
                    <span className="font-medium text-neutral-900">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-neutral-200">
          <Button onClick={handleSave} variant="outline" className="flex-1 h-12 border-neutral-200 hover:border-purple-500 hover:text-purple-600">
            <Bookmark className="w-5 h-5 mr-2" />
            Save Tip
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex-1 h-12 border-neutral-200 hover:border-purple-500 hover:text-purple-600">
            <Share2 className="w-5 h-5 mr-2" />
            Share Tip
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}

export function WeddingTips() {
  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-neutral-50 via-white to-purple-50/30">
      <div className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center mb-12">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold-600 mb-2">Expert Advice</p>
          <h2 className="text-4xl font-heading font-bold text-foreground mb-4">Wedding Planning Tips</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Expert advice to help you plan your perfect day. From timelines to photography, 
            we've got all the tips you need for a stress-free wedding planning experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tips.map((tip) => (
            <Dialog key={tip.title}>
              <DialogTrigger asChild>
                <Card className="hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group border-0 shadow-lg bg-white">
                  <CardHeader className="pt-8 px-6">
                    <div className={`w-16 h-16 rounded-2xl ${tip.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <tip.icon className={`w-8 h-8 ${tip.color}`} />
                    </div>
                    <h3 className="font-bold text-xl text-neutral-900">{tip.title}</h3>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <p className="text-neutral-600 mb-6 leading-relaxed">{tip.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-600 text-sm font-semibold group-hover:text-purple-700 transition-colors duration-200">
                        Read more →
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <TipDetailModal tip={tip} />
            </Dialog>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg" 
            className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300 bg-white hover:bg-purple-50 transition-all duration-300 px-8 py-3"
          >
            View all planning tips
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  )
}

