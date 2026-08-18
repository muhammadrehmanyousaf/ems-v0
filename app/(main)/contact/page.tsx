"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, Phone, MapPin, Send, Clock, Loader2, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  BUSINESS_ADDRESS_LINES,
  BUSINESS_ADDRESS_ONELINE,
  BUSINESS_HOURS_DISPLAY,
  LEGAL_ENTITY_LINE,
  LEGAL_ENTITY_FORM,
  BUSINESS_NTN,
  TAT_FIRST_RESPONSE,
  TAT_RESOLUTION,
} from "@/lib/seo"

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
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) {
        toast({
          title: "Couldn't send",
          description: data?.error || "Something went wrong. Please try again, or email us directly at info@weddingwala.pk.",
          variant: "destructive",
        })
        return
      }
      setSent(true)
      toast({ title: "Message Sent", description: "We'll get back to you within 24 hours." })
    } catch {
      toast({
        title: "Network error",
        description: "Couldn't reach our servers. Please try again, or email info@weddingwala.pk.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // "Lahore, Pakistan" is a city, not an address. A customer disputing a charge
  // — and the payment processor reviewing us — needs a place of business they
  // can actually reach, matching the registration on file. Single source of
  // truth: lib/seo/constants.ts.
  const info = [
    { icon: Mail, label: "Email", value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
    { icon: Phone, label: "Phone & WhatsApp", value: SUPPORT_PHONE_DISPLAY, href: SUPPORT_PHONE_TEL },
    { icon: MapPin, label: "Office", value: BUSINESS_ADDRESS_LINES, href: null },
    { icon: Clock, label: "Hours", value: BUSINESS_HOURS_DISPLAY, href: null },
  ] satisfies {
    icon: typeof Mail
    label: string
    value: string | readonly string[]
    href: string | null
  }[]

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-lg text-bridal-cream max-w-xl mx-auto">
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
                  <div className="w-10 h-10 bg-bridal-gold/15 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-bridal-gold-dark" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-medium text-neutral-900 hover:text-bridal-gold-dark">
                        {item.value as string}
                      </a>
                    ) : Array.isArray(item.value) ? (
                      <address className="not-italic text-sm font-medium leading-snug text-neutral-900">
                        {item.value.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </address>
                    ) : (
                      <p className="text-sm font-medium text-neutral-900">{item.value as string}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Registered business information. A payment processor's merchant
                review, and any customer disputing a charge, needs to see who
                the legal counterparty is — not just a brand name. */}
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-neutral-500">Registered business</p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <div>
                    <dt className="sr-only">Legal name</dt>
                    <dd className="font-medium text-neutral-900">{LEGAL_ENTITY_LINE}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-neutral-500">Entity</dt>
                    <dd className="text-neutral-900">{LEGAL_ENTITY_FORM}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-neutral-500">NTN</dt>
                    <dd className="text-neutral-900 tabular-nums">{BUSINESS_NTN}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-neutral-500">Registered address</dt>
                    <dd className="text-neutral-900">{BUSINESS_ADDRESS_ONELINE}</dd>
                  </div>
                </dl>
                <p className="mt-3 border-t border-neutral-100 pt-3 text-xs leading-relaxed text-neutral-500">
                  We acknowledge every message {TAT_FIRST_RESPONSE} and resolve
                  complaints {TAT_RESOLUTION}. Payment or refund queries can also
                  go to our{" "}
                  <a href="/complaints" className="underline hover:text-bridal-gold-dark">
                    complaints process
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
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
                    <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-bridal-gold to-bridal-gold-dark hover:from-bridal-gold-dark hover:to-bridal-gold-dark text-white">
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
