"use client";

/**
 * Vendor↔vendor collaboration (M23 Layer 2, §20.2). Send an invite to
 * another Wedding Wala vendor, and accept/decline invites others sent
 * you. Amounts are tracked, not collected (payment = later layer).
 *
 * Flag NEXT_PUBLIC_SUBCONTRACT (shared with the sub-contract ledger).
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Handshake, Send, Check, X, Loader2, Inbox, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { CollaborationsAPI, type CollabInvite, type CollabStatus } from "@/lib/api/collaborations";

const STATUS_TONE: Record<CollabStatus, string> = {
  pending: "bg-amber-50 border-amber-200 text-amber-800",
  accepted: "bg-emerald-50 border-emerald-200 text-emerald-800",
  declined: "bg-rose-50 border-rose-200 text-rose-800",
  cancelled: "bg-neutral-100 border-neutral-300 text-neutral-600",
};
const fmtPKR = (n: number | string | null) =>
  n == null || n === "" ? null : `Rs ${Math.round(Number(n)).toLocaleString("en-PK")}`;
const fmtDate = (s: string | null) => {
  if (!s) return "";
  try { return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return s; }
};

export default function CollaborationsView() {
  const [incoming, setIncoming] = useState<CollabInvite[]>([]);
  const [outgoing, setOutgoing] = useState<CollabInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  // send form
  const [toName, setToName] = useState("");
  const [toContact, setToContact] = useState("");
  const [eventLabel, setEventLabel] = useState("");
  const [scope, setScope] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([CollaborationsAPI.incoming(), CollaborationsAPI.outgoing()])
      .then(([inc, out]) => { setIncoming(inc); setOutgoing(out); })
      .catch(() => toast.error("Could not load collaborations"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const isEmail = (s: string) => /\S+@\S+\.\S+/.test(s);

  const sendInvite = async () => {
    if (!toContact.trim()) { toast.error("Enter the vendor's phone or email"); return; }
    setSending(true);
    try {
      const contact = toContact.trim();
      const res = await CollaborationsAPI.send({
        toName: toName.trim() || undefined,
        toEmail: isEmail(contact) ? contact : undefined,
        toPhone: isEmail(contact) ? undefined : contact,
        eventLabel: eventLabel.trim() || undefined,
        scope: scope.trim() || undefined,
        amount: undefined,
        agreedAmount: amount.trim() ? Math.max(0, parseInt(amount, 10) || 0) : undefined,
      } as any);
      toast.success(res?.matched ? "Invite sent + vendor notified" : "Invite saved (vendor not on Wedding Wala yet)");
      setToName(""); setToContact(""); setEventLabel(""); setScope(""); setAmount("");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not send invite");
    } finally {
      setSending(false);
    }
  };

  const respond = async (id: number, accept: boolean) => {
    setBusyId(id);
    try {
      if (accept) await CollaborationsAPI.accept(id);
      else await CollaborationsAPI.decline(id);
      toast.success(accept ? "Accepted" : "Declined");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    } finally { setBusyId(null); }
  };

  const cancelInvite = async (id: number) => {
    setBusyId(id);
    try {
      await CollaborationsAPI.cancel(id);
      toast.success("Invite cancelled");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not cancel invite");
    } finally { setBusyId(null); }
  };

  return (
    <div className="space-y-6">
      {/* Send invite */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Handshake className="h-4 w-4 text-bridal-gold-dark" />
            Invite a vendor to collaborate
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Bringing another vendor onto an event? Invite them by phone or email.
            If they&apos;re on Wedding Wala they&apos;re notified instantly. Amounts are
            tracked here (payment stays between you for now).
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Vendor name (optional)</Label>
              <Input value={toName} onChange={(e) => setToName(e.target.value)} placeholder="e.g. Lazeez Caterers" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Their phone or email *</Label>
              <Input value={toContact} onChange={(e) => setToContact(e.target.value)} placeholder="03xx-xxxxxxx or name@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Event</Label>
              <Input value={eventLabel} onChange={(e) => setEventLabel(e.target.value)} placeholder="e.g. Ahmed–Sara Walima · 15 Dec" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Agreed amount Rs (optional)</Label>
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Scope</Label>
            <Textarea rows={2} value={scope} onChange={(e) => setScope(e.target.value)} placeholder="What you need them to handle" />
          </div>
          <div className="flex justify-end">
            <Button onClick={sendInvite} disabled={sending}>
              {sending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}
              Send invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Incoming */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Inbox className="h-4 w-4 text-bridal-gold-dark" /> Invites to you
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incoming.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No invites yet.</p>
              ) : (
                <div className="space-y-2">
                  {incoming.map((iv) => (
                    <div key={iv.id} className="rounded-md border p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-medium">{iv.fromVendor?.fullName || iv.fromName || "A vendor"}</span>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[iv.status]}`}>{iv.status}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {iv.eventLabel || "Event"}{fmtPKR(iv.agreedAmount) ? ` · ${fmtPKR(iv.agreedAmount)}` : ""} · {fmtDate(iv.createdAt)}
                      </p>
                      {iv.scope && <p className="text-[11px] italic">&ldquo;{iv.scope}&rdquo;</p>}
                      {iv.status === "pending" && (
                        <div className="flex gap-1.5 pt-1">
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-emerald-700 border-emerald-200"
                            disabled={busyId === iv.id} onClick={() => respond(iv.id, true)}>
                            {busyId === iv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Accept
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-rose-700 border-rose-200"
                            disabled={busyId === iv.id} onClick={() => respond(iv.id, false)}>
                            <X className="h-3.5 w-3.5" /> Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outgoing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ArrowUpRight className="h-4 w-4 text-bridal-gold-dark" /> Invites you sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              {outgoing.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No sent invites yet.</p>
              ) : (
                <div className="space-y-2">
                  {outgoing.map((iv) => (
                    <div key={iv.id} className="rounded-md border p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-medium">{iv.toVendor?.fullName || iv.toNameSnapshot || iv.toPhone || iv.toEmail || "Vendor"}</span>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[iv.status]}`}>{iv.status}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {iv.eventLabel || "Event"}{fmtPKR(iv.agreedAmount) ? ` · ${fmtPKR(iv.agreedAmount)}` : ""} · {fmtDate(iv.createdAt)}
                        {!iv.toUserId && " · not on Wedding Wala yet"}
                      </p>
                      {iv.status === "declined" && iv.declineReason && (
                        <p className="text-[11px] text-rose-700">Reason: {iv.declineReason}</p>
                      )}
                      {iv.status === "pending" && (
                        <div className="flex pt-1">
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-rose-700 border-rose-200"
                            disabled={busyId === iv.id} onClick={() => cancelInvite(iv.id)}>
                            {busyId === iv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Cancel invite
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
