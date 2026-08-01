"use client"

/**
 * A customer's own complaints.
 *
 * The complaint form hands out a reference number and promises a resolution
 * date. Without this screen the only record either of those exists is an
 * email, and the only way to check progress is to ask someone. That is how a
 * complaints procedure quietly becomes a black hole.
 */

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Clock, Loader2, MessageSquareWarning } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  listMyComplaints,
  type ComplaintRow,
} from "@/lib/api/complaints"

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

function StatusIcon({ status }: { status: ComplaintRow["status"] }) {
  if (status === "resolved") return <CheckCircle2 className="w-5 h-5 text-green-600" />
  if (status === "dismissed") return <AlertTriangle className="w-5 h-5 text-neutral-400" />
  return <Clock className="w-5 h-5 text-amber-600" />
}

export default function UserComplaintsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-complaints"],
    queryFn: listMyComplaints,
  })

  const rows = data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My complaints</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Complaints you&apos;ve raised with Wedding Wala, and where each one stands.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/complaints">Raise a complaint</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-neutral-500 py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-neutral-600">We couldn&apos;t load your complaints.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquareWarning className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="font-medium text-neutral-900">You haven&apos;t raised any complaints</p>
            <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
              If something goes wrong — a vendor, a payment, or us — tell us and we&apos;ll
              give you a reference number and a date by which we&apos;ll have answered.
            </p>
            <Button asChild className="mt-5">
              <Link href="/complaints">Raise a complaint</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {rows.map((row) => {
          const isOpen = row.status === "open" || row.status === "in_progress"
          return (
            <Card key={row.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <StatusIcon status={row.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-neutral-900">
                        {row.reference}
                      </span>
                      <Badge variant={isOpen ? "secondary" : "outline"}>
                        {STATUS_LABEL[row.status]}
                      </Badge>
                      <Badge variant="outline">{CATEGORY_LABEL[row.category]}</Badge>
                    </div>

                    <p className="font-medium text-neutral-900">{row.subject}</p>

                    <p className="text-sm text-neutral-500 mt-1">
                      Raised {formatDate(row.createdAt)}
                      {isOpen && row.dueAt
                        ? ` · We aim to answer by ${formatDate(row.dueAt)}`
                        : ""}
                      {!isOpen && row.resolvedAt ? ` · Closed ${formatDate(row.resolvedAt)}` : ""}
                    </p>

                    {row.resolutionNotes && (
                      <div className="mt-3 rounded-lg bg-neutral-50 border p-3">
                        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                          Our response
                        </p>
                        <p className="text-sm text-neutral-800 whitespace-pre-wrap">
                          {row.resolutionNotes}
                        </p>
                      </div>
                    )}

                    {!isOpen && (
                      <p className="text-xs text-neutral-500 mt-2">
                        Not satisfied? Reply to the resolution email to ask for a senior
                        review, or see the{" "}
                        <Link href="/complaints" className="underline">
                          complaints procedure
                        </Link>
                        .
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
