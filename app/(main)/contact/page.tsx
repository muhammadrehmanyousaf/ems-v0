"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, Phone, MapPin, Send, Clock, Loader2, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" })
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    setSent(true)
    toast({ title: "Message Sent", description: "We'll get back to you within 24 hours." })
  }

  const info = [
    { icon: Mail, label: "Email", value: "support@ajoint.pk", href: "mailto:support@ajoint.pk" },
    { icon: Phone, label: "Phone", value: "+92 300 1234567", href: "tel:+923001234567" },
    { icon: MapPin, label: "Office", value: "Lahore, Pakistan", href: null },
    { icon: Clock, label: "Hours", value: "Mon-Sat, 9 AM - 6 PM", href: null },
  ]

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-lg text-purple-100 max-w-xl mx-auto">
            Have a question, feedback, or need help? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Contact Information</h2>
            {info.map((item) => (
              <Card key={item.label} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-medium text-neutral-900 hover:text-purple-600">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-neutral-900">{item.value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                {sent ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">Message Sent!</h3>
                    <p className="text-neutral-600 mb-6">We'll get back to you within 24 hours.</p>
                    <Button variant="outline" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" placeholder="Your name" value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="What is this about?" value={form.subject}
                        onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea id="message" placeholder="Tell us how we can help..." rows={5} value={form.message}
                        onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
