"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, ShieldCheck, Copy, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const CATEGORIES = [
  { value: "vendor_conduct", label: "How a vendor behaved" },
  { value: "booking_problem", label: "A problem with a booking" },
  { value: "payment_problem", label: "A payment or refund problem" },
  { value: "listing_incorrect", label: "A listing has wrong information" },
  { value: "app_problem", label: "The website or app isn't working" },
  { value: "other", label: "Something else" },
]

function formatDue(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return null
  }
}

export function ComplaintForm() {
  const [form, setForm] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    category: "other",
    subject: "",
    body: "",
    bot: "",
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ reference: string | null; dueAt: string | null } | null>(
    null,
  )
  const [copied, setCopied] = useState(false)

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      // Pass the token when we have one so the complaint attaches to the
      // account. Absence is normal and never blocks submission.
      let token: string | null = null
      try {
        token = localStorage.getItem("auth_token")
      } catch {
        token = null
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.ok) {
        toast({
          title: "We couldn't record your complaint",
          description: data?.error || "Please try again in a moment.",
          variant: "destructive",
        })
        return
      }

      setResult({ reference: data.reference ?? null, dueAt: data.dueAt ?? null })
    } catch {
      toast({
        title: "We couldn't reach our servers",
        description: "Please try again, or email info@weddingwala.pk directly.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    const due = formatDue(result.dueAt)
    return (
      <Card className="border-green-200 bg-green-50/60 not-prose">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Your complaint has been recorded
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                A confirmation is on its way to {form.contactEmail}. Our team has been
                notified.
              </p>
            </div>
          </div>

          {result.reference && (
            <div className="rounded-lg border border-green-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Your reference number
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  {result.reference}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(result.reference as string)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-neutral-600 mt-2">
                Quote this if you call or message us.
                {due ? ` We aim to resolve it by ${due}.` : ""}
              </p>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => {
              setResult(null)
              setForm({
                contactName: "",
                contactEmail: "",
                contactPhone: "",
                category: "other",
                subject: "",
                body: "",
                bot: "",
              })
            }}
          >
            Raise another complaint
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-neutral-200 not-prose">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="complaint-name">Your name</Label>
              <Input
                id="complaint-name"
                placeholder="So we know who we're replying to"
                value={form.contactName}
                onChange={(e) => set("contactName")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complaint-email">Email *</Label>
              <Input
                id="complaint-email"
                type="email"
                required
                placeholder="you@example.com"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail")(e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="complaint-phone">Phone (optional)</Label>
              <Input
                id="complaint-phone"
                placeholder="03xx xxxxxxx"
                value={form.contactPhone}
                onChange={(e) => set("contactPhone")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complaint-category">What is this about?</Label>
              <Select value={form.category} onValueChange={set("category")}>
                <SelectTrigger id="complaint-category">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-subject">Title *</Label>
            <Input
              id="complaint-subject"
              required
              placeholder="One line — e.g. Vendor cancelled two days before the event"
              value={form.subject}
              onChange={(e) => set("subject")(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-body">What happened? *</Label>
            <Textarea
              id="complaint-body"
              required
              rows={7}
              placeholder="Dates, names, booking ID, amounts — the more specific you are, the faster we can investigate."
              value={form.body}
              onChange={(e) => set("body")(e.target.value)}
            />
            <p className="text-xs text-neutral-500">
              {form.body.trim().length < 20
                ? "Please write at least a sentence or two."
                : `${form.body.trim().length} characters`}
            </p>
          </div>

          {/* Honeypot — hidden from people, irresistible to bots. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="complaint-bot">Leave this empty</label>
            <input
              id="complaint-bot"
              tabIndex={-1}
              autoComplete="off"
              value={form.bot}
              onChange={(e) => set("bot")(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
              </>
            ) : (
              "Submit complaint"
            )}
          </Button>

          <p className="text-xs text-neutral-500">
            You&apos;ll get a reference number straight away, and an email confirming it. We
            acknowledge within 48 hours and aim to resolve within 14 working days.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
