"use client"

/**
 * Collaborations. Both directions of a vendor↔vendor invite: Incoming (invites
 * to you — Accept/Decline) and Outgoing (invites you sent — Cancel).
 *
 * Amounts here are TRACKED, NOT COLLECTED — accepting does not create a
 * booking, a payable, a receivable or a Khata line anywhere (WWL-463). The
 * screen says so rather than leaving a vendor to discover it.
 *
 * Route /dashboard/collaborations.
 */

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { errorMessage } from "@/lib/utils/api-error"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CollaborationsAPI, type CollabInvite, type CollabStatus } from "@/lib/api/collaborations"
import { InviteVendorDialog } from "@/components/dashboard/mainScreens/collaborations/redesigned/invite-vendor-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { todayInKarachi } from "@/lib/utils/pk-date"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

type Direction = "incoming" | "outgoing"

/** Amounts are optional. `null` means "no price agreed" — not "agreed zero". */
const money = (v: number | string | null | undefined): number | null => {
  if (v == null || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const sum = (rows: CollabInvite[]) => rows.reduce((t, c) => t + (money(c.agreedAmount) ?? 0), 0)

/** For enum values only — it also turns underscores into spaces. */
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")

/**
 * WWL-468 — `cap()` was applied to Scope, a free-text field the vendor types.
 * A scope written "drone_coverage" silently became "Drone coverage": an
 * enum-formatting transformation applied to someone's prose. Free text is shown
 * as written.
 */
const plain = (s?: string | null) => (s && s.trim() ? s : "—")

// WWL-468 — Promote's identical column uses 2-digit; two screens in the same
// redesign track were rendering the same kind of date differently.
const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

const STATUS_TONE: Record<CollabStatus, StatusTone> = {
  accepted: "success",
  pending: "warning",
  declined: "error",
  cancelled: "neutral",
}

/**
 * WWL-462 — `respondedAt` is stamped by accept, by decline AND by cancel, so a
 * single column carried three different meanings. Naming it by the status it
 * belongs to is the whole fix.
 */
const RESPONDED_VERB: Record<CollabStatus, string | null> = {
  pending: null,
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Withdrawn",
}

/**
 * Who the vendor is collaborating WITH. `toNameSnapshot` falls back to the raw
 * phone or email, so an invite sent without a name used to print a bare
 * `0300…` or an address into a column headed "To" as though it were a person's
 * name (WWL-462). The contact is still shown — it is all we have — but it is no
 * longer dressed up as a name.
 */
function counterpart(c: CollabInvite, dir: Direction): { name: string | null; contact: string | null } {
  if (dir === "incoming") {
    return { name: c.fromVendor?.fullName || c.fromName || null, contact: null }
  }
  const name = c.toVendor?.fullName || c.toNameSnapshot || null
  const contact = c.toPhone || c.toEmail || null
  // toNameSnapshot is set from the typed name; if it equals the contact it IS
  // the fallback, not a name.
  if (name && contact && name.trim() === contact.trim()) return { name: null, contact }
  return { name, contact: name ? null : contact }
}

const counterpartText = (c: CollabInvite, dir: Direction) => {
  const { name, contact } = counterpart(c, dir)
  return name || contact || (dir === "incoming" ? "A vendor" : "—")
}

export function CollaborationsRedesignedView() {
  const qc = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [cancelTarget, setCancelTarget] = React.useState<CollabInvite | null>(null)

  /**
   * WWL-466 — the direction lived in component state only: switching to
   * "Invites you sent" left the URL at /dashboard/collaborations, a reload
   * dropped back to Incoming, the back button did not walk the tabs, and a
   * vendor could not link or bookmark the view they were looking at.
   */
  const tab: Direction = searchParams?.get("dir") === "outgoing" ? "outgoing" : "incoming"
  const setTab = React.useCallback(
    (next: Direction) => {
      const qs = new URLSearchParams(searchParams?.toString() ?? "")
      if (next === "incoming") qs.delete("dir")
      else qs.set("dir", next)
      const s = qs.toString()
      router.replace(s ? `?${s}` : "?", { scroll: false })
    },
    [router, searchParams],
  )

  const invalidate = () => qc.invalidateQueries({ queryKey: ["collaborations-redesigned"] })

  const acceptMut = useMutation({
    mutationFn: (id: number) => CollaborationsAPI.accept(id),
    onSuccess: () => { showSuccessToast("Invite accepted"); invalidate() },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't accept")),
  })
  const declineMut = useMutation({
    mutationFn: (id: number) => CollaborationsAPI.decline(id),
    onSuccess: () => { showSuccessToast("Invite declined"); invalidate() },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't decline")),
  })
  /**
   * Chase an invite that went to someone with no account.
   *
   * The only action a sender had on a pending off-platform invite was
   * "Withdraw". Since nothing was ever sent to the invitee in the first place,
   * "pending" meant "sitting in our database, unseen" — and the sender's only
   * way to try again was to create a second invite, i.e. a duplicate row. Now
   * the first send emails them, and this re-sends the same invite.
   */
  const resendMut = useMutation({
    mutationFn: (id: number) => CollaborationsAPI.resend(id),
    onSuccess: () => { showSuccessToast("Invitation re-sent"); invalidate() },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't resend the invitation")),
  })

  const cancelMut = useMutation({
    mutationFn: (id: number) => CollaborationsAPI.cancel(id),
    onSuccess: () => { showSuccessToast("Invite withdrawn — we've let them know"); setCancelTarget(null); invalidate() },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't cancel invite")),
  })

  /**
   * WWL-465 — this was `Promise.all`, which rejects on the FIRST failure. A
   * failing "outgoing" request therefore took down a perfectly good "incoming"
   * list and rendered "Couldn't load collaborations." over the whole screen —
   * including the tab a vendor may urgently need in order to answer someone
   * else's offer. The two directions are independent; they fail independently
   * now, and the query itself only fails when BOTH do.
   */
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["collaborations-redesigned"],
    queryFn: async () => {
      const [inc, out] = await Promise.allSettled([
        CollaborationsAPI.incoming(),
        CollaborationsAPI.outgoing(),
      ])
      if (inc.status === "rejected" && out.status === "rejected") throw inc.reason
      return {
        incoming: inc.status === "fulfilled" ? inc.value : [],
        outgoing: out.status === "fulfilled" ? out.value : [],
        incomingError: inc.status === "rejected" ? inc.reason : null,
        outgoingError: out.status === "rejected" ? out.reason : null,
      }
    },
  })

  const incoming = data?.incoming ?? []
  const outgoing = data?.outgoing ?? []
  const tabError = tab === "incoming" ? data?.incomingError : data?.outgoingError
  const otherError = tab === "incoming" ? data?.outgoingError : data?.incomingError
  const otherLabel = tab === "incoming" ? "Invites you sent" : "Invites to you"

  // Row ids are not unique across tabs, and a query typed against incoming
  // invites was silently filtering the outgoing list (WWL-466).
  React.useEffect(() => { setSelected(new Set()); setSearch("") }, [tab])

  const rows = tab === "incoming" ? incoming : outgoing
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((c) =>
      [counterpartText(c, tab), c.eventLabel, c.scope].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [rows, search, tab])

  /**
   * WWL-460 — all four cards read from `[...incoming, ...outgoing]`. "Pending"
   * counted invites waiting on ME together with invites waiting on SOMEONE ELSE
   * — two different obligations under one number — and "Agreed value" summed
   * money I would receive with money I would pay, including declined and
   * cancelled rows, so the headline figure was neither owed, earned nor
   * committed.
   *
   * Direction decides the meaning: an incoming invite is work I would do and be
   * paid for; an outgoing one is work I would pay for. Only ACCEPTED rows count
   * as agreed.
   */
  const pendingOnMe = incoming.filter((c) => c.status === "pending").length
  const pendingOnThem = outgoing.filter((c) => c.status === "pending").length
  const acceptedIn = incoming.filter((c) => c.status === "accepted")
  const acceptedOut = outgoing.filter((c) => c.status === "accepted")

  const withHeader = tab === "incoming" ? "From" : "To"

  const columns: Column<CollabInvite>[] = [
    {
      key: "event",
      header: "Event",
      render: (c) => <span className="font-medium">{c.eventLabel || "Untitled collaboration"}</span>,
    },
    {
      key: "with",
      header: withHeader,
      cellClassName: "text-muted-foreground",
      render: (c) => {
        const { name, contact } = counterpart(c, tab)
        return (
          <span className="block">
            {name ? (
              <span>{name}</span>
            ) : (
              <span className="italic">No name given</span>
            )}
            {contact && <span className="block text-[11px] tabular-nums">{contact}</span>}
            {/* "Not on Wedding Wala yet" was true and useless — it named the
                problem and left the sender with nothing to do about it. Say
                whether an invitation actually went out. */}
            {tab === "outgoing" && !c.toUserId && (
              <span className="block text-[11px] italic text-muted-foreground">
                {c.toEmail
                  ? "Not on Wedding Wala yet — invitation emailed"
                  : "Not on Wedding Wala yet — no email, so we can't invite them"}
              </span>
            )}
          </span>
        )
      },
    },
    { key: "scope", header: "Scope", cellClassName: "text-muted-foreground", render: (c) => plain(c.scope) },
    {
      key: "amount",
      header: "Agreed amount",
      align: "right",
      /* WWL-464 — `num()` coerced null to 0, so "we didn't agree a price"
         rendered identically to "we agreed on nothing". MoneyCell already
         renders null as an em dash; Promote passes null through to it
         deliberately, and this screen now does the same. */
      render: (c) => <MoneyCell amount={money(c.agreedAmount)} />,
    },
    { key: "created", header: "Sent", cellClassName: "text-muted-foreground", render: (c) => fmtDate(c.createdAt) },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <div className="space-y-0.5">
          <StatusPill tone={STATUS_TONE[c.status] ?? "neutral"}>{cap(c.status)}</StatusPill>
          {/* WWL-462 — declineReason is captured, stored and shown nowhere, so
              the sender learned that an invite was refused but never why. */}
          {c.status === "declined" && c.declineReason && (
            <p className="max-w-[22ch] text-[11px] text-muted-foreground">{c.declineReason}</p>
          )}
        </div>
      ),
    },
    {
      key: "responded",
      header: "Responded",
      cellClassName: "text-muted-foreground",
      render: (c) => {
        const verb = RESPONDED_VERB[c.status]
        if (!verb || !c.respondedAt) return "—"
        return (
          <span className="whitespace-nowrap">
            {verb} · {fmtDate(c.respondedAt)}
          </span>
        )
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => {
        if (c.status !== "pending") return <span className="text-xs text-muted-foreground">—</span>
        if (tab === "incoming") {
          return (
            <div className="flex items-center justify-end gap-1">
              <Button size="sm" variant="outline" disabled={acceptMut.isPending} onClick={() => acceptMut.mutate(c.id)}>
                <Icon name="Check" size={14} className="mr-1" /> Accept
              </Button>
              <Button size="sm" variant="ghost" disabled={declineMut.isPending} onClick={() => declineMut.mutate(c.id)}>
                <Icon name="XCircle" size={14} className="mr-1 text-muted-foreground" /> Decline
              </Button>
            </div>
          )
        }
        return (
          <div className="flex items-center justify-end gap-1">
            {!c.toUserId && c.toEmail && (
              <Button size="sm" variant="outline" disabled={resendMut.isPending} onClick={() => resendMut.mutate(c.id)}>
                <Icon name="Send" size={14} className="mr-1" /> Resend
              </Button>
            )}
            <Button size="sm" variant="ghost" disabled={cancelMut.isPending} onClick={() => setCancelTarget(c)}>
              <Icon name="XCircle" size={14} className="mr-1 text-muted-foreground" /> Withdraw
            </Button>
          </div>
        )
      },
    },
  ]

  const tabBtn = (id: Direction, label: string, count: number) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={cn(
        "inline-flex h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
        tab === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {label}
      <span className={cn(
        "rounded-full px-1.5 text-[11px] tabular-nums",
        tab === id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}>{count}</span>
    </button>
  )

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Grow"
        title="Collaborations"
        description="Invites to team up with other Wedding Wala vendors on events — incoming and outgoing."
        actions={<Button onClick={() => setDialogOpen(true)}><Icon name="Plus" size={16} className="mr-1.5" /> Invite vendor</Button>}
      />

      {/* WWL-461 — "Pending" carried trend="flat" and "Accepted" trend="up",
          neither computed. Verified live with ZERO accepted invites: the card
          still rendered its upward arrow. An arrow in a position that reads as
          data has to be data, so the decorative ones are gone. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Waiting on you" value={pendingOnMe} icon="Clock" error={!!data?.incomingError} />
        <StatCard label="Waiting on them" value={pendingOnThem} icon="Send" error={!!data?.outgoingError} />
        <StatCard
          label="Agreed to receive"
          value={formatPkr(sum(acceptedIn))}
          delta={`${acceptedIn.length} accepted`}
          icon="Wallet"
          error={!!data?.incomingError}
        />
        <StatCard
          label="Agreed to pay"
          value={formatPkr(sum(acceptedOut))}
          delta={`${acceptedOut.length} accepted`}
          icon="Wallet"
          error={!!data?.outgoingError}
        />
      </div>

      {/* WWL-463 — accepting changes a status and sends a notification, and
          that is where the feature stops: no booking, no function-sheet line,
          no supplier, no expense, no payable on the sender's side and no
          receivable on the invitee's. The module's own comment is honest about
          it; nothing on the screen was. */}
      <p className="text-xs text-muted-foreground">
        Agreed amounts here are a record between the two of you. They are not invoiced, collected or
        posted to your Khata — settle them the way you already do.
      </p>

      {otherError && (
        <p className="rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-2.5 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
          <span className="font-medium">{otherLabel}</span> didn&apos;t load
          {" — "}{errorMessage(otherError, "we couldn't reach the server.")}{" "}
          <button type="button" className="underline underline-offset-2" onClick={() => refetch()} disabled={isFetching}>
            Try again
          </button>
        </p>
      )}

      <div role="tablist" aria-label="Invite direction" className="flex w-fit items-center gap-1 rounded-lg border border-border bg-card p-1">
        {tabBtn("incoming", "Invites to you", incoming.length)}
        {tabBtn("outgoing", "Invites you sent", outgoing.length)}
      </div>

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        caption="Collaborations"
        columns={columns}
        data={filtered}
        getRowId={(c) => String(c.id)}
        loading={isLoading}
        error={
          isError
            ? "Couldn't load collaborations."
            : tabError
              ? errorMessage(tabError, "Couldn't load these invites.")
              : null
        }
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Users",
          title: tab === "incoming" ? "No invites to you yet" : "No invites sent yet",
          description:
            tab === "incoming"
              ? "When another Wedding Wala vendor invites you onto an event, it'll show up here to accept or decline."
              : "Invite another Wedding Wala vendor to team up on an event — they accept or decline, and agreed amounts are tracked here.",
          action: <Button size="sm" onClick={() => setDialogOpen(true)}><Icon name="Plus" size={14} className="mr-1" /> Invite vendor</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <label htmlFor="collab-search" className="sr-only">Search collaborations</label>
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input id="collab-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search collaborations…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              {/* WWL-469 — both tabs exported `collaborations.csv`, with no
                  direction and no date, while the second column HEADER changed
                  with the active tab. Two files a minute apart were
                  indistinguishable by name and differed in content. */}
              <ExportMenu
                selectedIds={selected}
                getRowId={(c) => String(c.id)}
                rows={filtered}
                filename={`collaborations-${tab}-${todayInKarachi()}`}
                columns={[
                  { header: "Event", value: (c) => c.eventLabel ?? "" },
                  { header: withHeader, value: (c) => counterpartText(c, tab) },
                  { header: "Phone", value: (c) => c.toPhone ?? "" },
                  { header: "Email", value: (c) => c.toEmail ?? "" },
                  { header: "Scope", value: (c) => c.scope ?? "" },
                  { header: "Agreed amount", value: (c) => money(c.agreedAmount) ?? "" },
                  { header: "Sent", value: (c) => c.createdAt ?? "" },
                  { header: "Status", value: (c) => c.status ?? "" },
                  { header: "Responded", value: (c) => (RESPONDED_VERB[c.status] ? c.respondedAt ?? "" : "") },
                  { header: "Decline reason", value: (c) => c.declineReason ?? "" },
                  { header: "Function sheet", value: (c) => c.functionSheetId ?? "" },
                ]}
              />
            </div>
          </>
        }
        /* WWL-459 — the mobile card rendered the event, the counterpart, the
           amount and a status pill, and contained no Accept, no Decline and no
           Cancel: the actions column existed only in the desktop table. On a
           screen whose entire purpose is answering another vendor's offer, a
           phone could read invites and not respond to them. */
        renderCard={(c) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{c.eventLabel || "Untitled collaboration"}</div>
                <div className="text-xs text-muted-foreground">
                  {counterpartText(c, tab)}
                  {money(c.agreedAmount) != null && ` · ${formatPkr(money(c.agreedAmount) as number)}`}
                </div>
                {c.status === "declined" && c.declineReason && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{c.declineReason}</p>
                )}
              </div>
              <StatusPill tone={STATUS_TONE[c.status] ?? "neutral"}>{cap(c.status)}</StatusPill>
            </div>
            {c.status === "pending" && (
              <div className="flex items-center gap-2">
                {tab === "incoming" ? (
                  <>
                    <Button size="sm" className="h-11 flex-1" disabled={acceptMut.isPending} onClick={() => acceptMut.mutate(c.id)}>
                      <Icon name="Check" size={14} className="mr-1" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" className="h-11 flex-1" disabled={declineMut.isPending} onClick={() => declineMut.mutate(c.id)}>
                      Decline
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" className="h-11 flex-1" disabled={cancelMut.isPending} onClick={() => setCancelTarget(c)}>
                    Withdraw invite
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      />

      <InviteVendorDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={invalidate} />

      <AlertDialog open={!!cancelTarget} onOpenChange={(v) => { if (!v) setCancelTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this invite?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget
                ? `The invite to ${counterpartText(cancelTarget, "outgoing")}${cancelTarget.eventLabel ? ` for "${cancelTarget.eventLabel}"` : ""} will be withdrawn and they'll be told. This can't be undone — you'd have to send a new invite.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMut.isPending}>Keep invite</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (cancelTarget) cancelMut.mutate(cancelTarget.id) }}
              disabled={cancelMut.isPending}
            >
              {cancelMut.isPending ? "Withdrawing…" : "Withdraw invite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CollaborationsRedesignedView
