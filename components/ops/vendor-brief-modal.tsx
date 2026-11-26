"use client"

// Complete read-only Vendor Fact Sheet for Team B (Client Desk) while talking to a couple on the phone.
// Shows all packages, menus, dishes, photos, address, rules, busy platform dates, and recent Team A checks —
// plus a 1-step "Client Called About This Venue -> Save & Ask Team A" workflow.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarX2, Check, ExternalLink, MapPin, PhoneCall, Plus, Send, UtensilsCrossed } from "lucide-react"

import { AvailabilityBadge, EVENT_LABEL, fmtPkr } from "@/components/ops/client-bits"
import { useOps } from "@/components/ops/ops-shell"
import { Btn, ErrorState, Field, Input, Modal, Notice, Select, SkelRows, Status, fmtDay, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { clientsApi, shortlistApi, vendorsApi, type ClientEventKind } from "@/lib/api/ops-clients"
import { vendorLeafHref } from "@/lib/seo/vendor-href"

const FACT_FLAGS: [string, string][] = [
  ["isAirConditioned", "AC available"],
  ["valetParkingIncluded", "Valet parking"],
  ["wifiAvailable", "Wi-Fi"],
  ["separateMenWomenHalls", "Separate halls (M/F)"],
  ["outsideDecorAllowed", "Outside decor OK"],
  ["outsideDjAllowed", "Outside DJ OK"],
  ["outsideFoodAllowed", "Outside food OK"],
  ["inHouseCateringOnly", "In-house catering only"],
]

export function VendorBriefModal({
  businessId,
  open,
  onClose,
  clientId,
  clientName,
  shortlisted = [],
  onShortlisted,
}: {
  businessId: number | null
  open: boolean
  onClose: () => void
  clientId?: number
  clientName?: string
  shortlisted?: number[]
  onShortlisted?: () => void
}) {
  const { can } = useOps()
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useOpsToast()

  const briefQ = useQuery({
    queryKey: ["ops", "vendor-brief", businessId],
    queryFn: () => vendorsApi.brief(businessId!),
    enabled: open && !!businessId,
    staleTime: 30_000,
  })
  const citiesQ = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities, enabled: open && !clientId })

  const [takingCall, setTakingCall] = useState(false)
  const [cName, setCName] = useState("")
  const [cPhone, setCPhone] = useState("")
  const [cCityId, setCCityId] = useState("")
  const [cGuests, setCGuests] = useState("")
  const [cEvKind, setCEvKind] = useState<ClientEventKind>("barat")
  const [cEvDate, setCEvDate] = useState("")
  const [cNote, setCNote] = useState("")
  const [sendTeamA, setSendTeamA] = useState(true)

  const addShortlistMut = useMutation({
    mutationFn: () => shortlistApi.add(clientId!, [businessId!]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops", "client", clientId] })
      onShortlisted?.()
      toast({ title: "Venue added to shortlist" })
      onClose()
    },
    onError: (e) => toast({ title: "Could not add", body: opsErrorMessage(e), tone: "bad" }),
  })

  const createFromCallMut = useMutation({
    mutationFn: () =>
      clientsApi.fromVendor({
        businessId: businessId!,
        name: cName.trim(),
        phone: cPhone.trim(),
        source: "phone",
        spokeNow: true,
        cityId: cCityId ? Number(cCityId) : undefined,
        guests: cGuests ? Number(cGuests) : undefined,
        notes: cNote.trim() || undefined,
        event: cEvDate || cEvKind ? { kind: cEvKind, eventDate: cEvDate || undefined, guests: cGuests ? Number(cGuests) : undefined } : undefined,
        sendToVendorTeam: sendTeamA,
        assignNote: cNote.trim() || undefined,
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ops", "clients"] })
      qc.invalidateQueries({ queryKey: ["ops", "home-summary"] })
      toast({
        title: r.assigned ? `Saved & sent to ${r.assignment?.assigneeName || "Vendor Team"}` : "Couple saved with this venue",
        body: r.existing ? "Added to their existing client profile." : undefined,
      })
      onClose()
      router.push(`/ops/clients/${r.id}`)
    },
    onError: (e) => toast({ title: "Could not save", body: opsErrorMessage(e), tone: "bad" }),
  })

  const d = briefQ.data
  const v = d?.vendor
  const isOnList = !!(businessId && shortlisted.includes(businessId))
  const pubUrl = v ? vendorLeafHref({ id: v.id, name: v.name, city: v.city, vendorType: v.vendorType }) : null
  const tsd = (v?.typeSpecificDetails ?? {}) as Record<string, unknown>

  return (
    <Modal
      open={open}
      onClose={() => { setTakingCall(false); onClose() }}
      size="xwide"
      title={v ? v.name : "Vendor Details"}
      description={
        v
          ? [v.vendorType, v.subArea, v.city, v.isLive ? "Live on site" : "Vendor team is still updating this page"].filter(Boolean).join(" · ")
          : "Loading all vendor details entered by Vendor Team..."
      }
      footer={
        v ? (
          <div className="row between" style={{ width: "100%" }}>
            <div className="row">
              {pubUrl && v.isLive && (
                <a href={pubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost sm">
                  Open Website Page <ExternalLink size={13} aria-hidden />
                </a>
              )}
              {v.googleMapsUrl && (
                <a href={v.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost sm">
                  <MapPin size={13} aria-hidden />Location Map
                </a>
              )}
            </div>
            <div className="row">
              {clientId ? (
                isOnList ? (
                  <Status tone="ok"><Check size={12} aria-hidden /> Already shortlisted</Status>
                ) : (
                  <Btn
                    variant="primary"
                    icon={<Plus aria-hidden />}
                    disabled={!v.isLive}
                    title={v.isLive ? undefined : "Wait until Vendor Team makes this vendor live"}
                    loading={addShortlistMut.isPending}
                    onClick={() => addShortlistMut.mutate()}
                  >
                    Add to {clientName || "Client"}
                  </Btn>
                )
              ) : (
                !takingCall && can("ops_client_manage") && v.isLive && (
                  <Btn variant="primary" icon={<PhoneCall aria-hidden />} onClick={() => setTakingCall(true)}>
                    Client Asked About This — Save &amp; Send to Team A
                  </Btn>
                )
              )}
              <Btn onClick={() => { setTakingCall(false); onClose() }}>Close</Btn>
            </div>
          </div>
        ) : undefined
      }
    >
      {briefQ.isLoading ? (
        <SkelRows rows={8} />
      ) : briefQ.isError || !d || !v ? (
        <ErrorState message={opsErrorMessage(briefQ.error)} onRetry={() => briefQ.refetch()} />
      ) : (
        <div className="stack" style={{ gap: 14 }}>
          {!v.isLive && (
            <Notice tone="warn">
              This vendor page is still being completed by Vendor Team (not live on the website yet). You can read the saved prices below while talking, and ask Vendor Team before promising anything.
            </Notice>
          )}

          {/* 1-Click Live-Call Capture Form when Iqra is on phone about this vendor */}
          {takingCall && !clientId && (
            <div className="card" style={{ padding: 14, borderColor: "var(--accent-line)", background: "var(--accent-wash)" }}>
              <div className="td-name" style={{ marginBottom: 4 }}>Save Couple Calling About {v.name}</div>
              <p className="small muted" style={{ marginBottom: 12 }}>
                Enter the couple's name &amp; number while on the call. If their number already exists, it opens their file without creating a duplicate.
              </p>
              <div className="form-grid">
                <Field label="Couple / Caller Name" htmlFor="vf-name" required>
                  <Input id="vf-name" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="e.g. Ayesha & Bilal" />
                </Field>
                <Field label="Phone / WhatsApp" htmlFor="vf-phone" required>
                  <Input id="vf-phone" value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="0300 1234567" />
                </Field>
                <Field label="Function" htmlFor="vf-ev">
                  <Select id="vf-ev" value={cEvKind} onChange={(e) => setCEvKind(e.target.value as ClientEventKind)}>
                    {(Object.keys(EVENT_LABEL) as ClientEventKind[]).map((k) => <option key={k} value={k}>{EVENT_LABEL[k]}</option>)}
                  </Select>
                </Field>
                <Field label="Event Date (if known)" htmlFor="vf-date">
                  <Input id="vf-date" type="date" value={cEvDate} onChange={(e) => setCEvDate(e.target.value)} />
                </Field>
                <Field label="Guests" htmlFor="vf-guests">
                  <Input id="vf-guests" inputMode="numeric" value={cGuests} onChange={(e) => setCGuests(e.target.value)} placeholder="350" />
                </Field>
                <Field label="City" htmlFor="vf-city">
                  <Select id="vf-city" value={cCityId} onChange={(e) => setCCityId(e.target.value)}>
                    <option value="">{v.city || "Default city"}</option>
                    {(citiesQ.data?.cities ?? []).filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </Field>
                <Field label="Note for Vendor Team (what to ask)" htmlFor="vf-note" className="full">
                  <Input id="vf-note" value={cNote} onChange={(e) => setCNote(e.target.value)} placeholder="e.g. Asking for 15 Nov night hall rate & parking availability" />
                </Field>
              </div>
              {can("ops_client_assign") && (
                <label className="check" style={{ marginTop: 10 }}>
                  <input type="checkbox" checked={sendTeamA} onChange={(e) => setSendTeamA(e.target.checked)} />
                  Send straight to Vendor Team right now to confirm availability &amp; final rate
                </label>
              )}
              {createFromCallMut.isError && (
                <div style={{ marginTop: 10 }}>
                  <Notice tone="bad">{opsErrorMessage(createFromCallMut.error)}</Notice>
                </div>
              )}
              <div className="row" style={{ marginTop: 12 }}>
                <Btn
                  variant="primary"
                  icon={<Send aria-hidden />}
                  disabled={!cName.trim() || !cPhone.trim()}
                  loading={createFromCallMut.isPending}
                  onClick={() => createFromCallMut.mutate()}
                >
                  {sendTeamA ? "Save Couple & Send to Vendor Team" : "Save Couple"}
                </Btn>
                <Btn onClick={() => setTakingCall(false)}>Cancel</Btn>
              </div>
            </div>
          )}

          {/* Top Quick Facts for Reading Aloud on Phone */}
          <div className="kpis" style={{ marginBottom: 0 }}>
            <div className="card kpi">
              <div className="k-l">Starting Price</div>
              <div className="k-v num" style={{ fontSize: 18 }}>{fmtPkr(v.minimumPrice)}</div>
              <div className="k-n">{v.perHeadFromPkr ? `Menus from ${fmtPkr(v.perHeadFromPkr)}/head` : "Ask for custom rate"}</div>
            </div>
            <div className="card kpi">
              <div className="k-l">Guest Capacity</div>
              <div className="k-v num" style={{ fontSize: 18 }}>
                {v.maxCapacity && v.maxCapacity > 1 ? `${v.minCapacity ? `${v.minCapacity} – ` : "Up to "}${v.maxCapacity}` : "Not set"}
              </div>
              <div className="k-n">
                {[v.indoorCapacity ? `Indoor ${v.indoorCapacity}` : null, v.outdoorCapacity ? `Outdoor ${v.outdoorCapacity}` : null].filter(Boolean).join(" · ") || (v.seatedCapacity ? `Seated ${v.seatedCapacity}` : "Capacity flexible")}
              </div>
            </div>
            <div className="card kpi">
              <div className="k-l">Advance &amp; Policy</div>
              <div className="k-v" style={{ fontSize: 16 }}>
                {v.downPayment && v.downPayment > 0
                  ? `${v.downPaymentType === "Percentage" ? `${v.downPayment}%` : fmtPkr(v.downPayment)}`
                  : "Flexible / Ask"}
              </div>
              <div className="k-n">{v.eventClosingTime ? `Closes ${v.eventClosingTime}` : v.oneDishPolicy ? "One-dish rule applies" : "Standard hall timings"}</div>
            </div>
          </div>

          {/* Address & Overview */}
          <div className="card" style={{ padding: 14 }}>
            <dl className="kv">
              <dt>Address</dt><dd>{[v.address, v.subArea, v.city].filter(Boolean).join(", ") || "Not added yet"}</dd>
              {v.description && <><dt>About Vendor</dt><dd>{v.description}</dd></>}
              {v.additionalInfo && <><dt>Important Notes</dt><dd>{v.additionalInfo}</dd></>}
              {v.cancelationPolicy && <><dt>Cancellation Rule</dt><dd>{v.cancelationPolicy}</dd></>}
            </dl>
            <div className="chips" style={{ marginTop: 10 }}>
              {v.parking && <span className="chip on">Parking{v.carParkingCapacity ? ` (${v.carParkingCapacity} cars)` : ""}</span>}
              {v.catering && <span className="chip on">Own kitchen</span>}
              {v.outsideVendorsAllowed && <span className="chip on">Outside vendors OK</span>}
              {Number(tsd.generatorKw) > 0 && <span className="chip on">Generator {String(tsd.generatorKw)} kW</span>}
              {FACT_FLAGS.filter(([k]) => tsd[k] === true).map(([, label]) => (
                <span key={label} className="chip on">{label}</span>
              ))}
              {(v.amenities ?? []).slice(0, 8).map((a) => <span key={a} className="chip">{a}</span>)}
            </div>
          </div>

          {/* Packages & Food Menus added by Rubab */}
          <div className="grid2">
            <div className="card" style={{ padding: 14 }}>
              <div className="td-name" style={{ marginBottom: 8 }}>Packages ({d.packages.length})</div>
              {d.packages.length === 0 ? (
                <p className="small muted">No packages added yet — send to Vendor Team to get exact rate.</p>
              ) : (
                <div className="stack" style={{ gap: 10 }}>
                  {d.packages.map((p) => (
                    <div key={p.id} style={{ paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                      <div className="row between">
                        <span className="strong">{p.name}</span>
                        <span className="num strong" style={{ color: "var(--accent-ink)" }}>
                          {fmtPkr(p.price)} {p.pricingUnit === "per_head" ? "/ head" : "/ event"}
                        </span>
                      </div>
                      <div className="small muted">
                        {[
                          p.capacity ? `Up to ${p.capacity} guests` : null,
                          p.minGuaranteeCount ? `Min ${p.minGuaranteeCount} guests` : null,
                          p.includesFood ? "Food included" : null,
                        ].filter(Boolean).join(" · ")}
                      </div>
                      {p.description && <div className="small" style={{ marginTop: 3 }}>{p.description}</div>}
                      {p.features.length > 0 && (
                        <div className="small muted" style={{ marginTop: 4 }}>{p.features.join(" · ")}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 14 }}>
              <div className="row" style={{ gap: 6, marginBottom: 8 }}>
                <UtensilsCrossed size={15} aria-hidden />
                <span className="td-name">Food Menus ({d.menus.length})</span>
              </div>
              {d.menus.length === 0 ? (
                <p className="small muted">No food menus listed.</p>
              ) : (
                <div className="stack" style={{ gap: 10 }}>
                  {d.menus.map((m) => (
                    <div key={m.id} style={{ paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                      <div className="row between">
                        <span className="strong">{m.title}</span>
                        <span className="num strong" style={{ color: "var(--accent-ink)" }}>
                          {fmtPkr(m.price)} {m.pricingUnit === "per_event" ? "/ event" : "/ head"}
                        </span>
                      </div>
                      {m.minGuaranteeCount && <div className="small muted">Min guarantee: {m.minGuaranteeCount} guests</div>}
                      {m.items.length > 0 && (
                        <div className="small" style={{ marginTop: 4 }}>{m.items.join(" · ")}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Photos */}
          {v.images.length > 0 && (
            <div className="card" style={{ padding: 14 }}>
              <div className="td-name" style={{ marginBottom: 8 }}>Photos ({v.images.length})</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                {v.images.slice(0, 8).map((src, i) => (
                  <a key={src + i} href={src} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", aspectRatio: "4/3" }}>
                    <img src={src} alt={`${v.name} photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Busy Dates & Recent Team A Phone Checks */}
          <div className="grid2">
            <div className="card" style={{ padding: 14 }}>
              <div className="row" style={{ gap: 6, marginBottom: 6 }}>
                <CalendarX2 size={15} aria-hidden />
                <span className="td-name">Dates Already Booked on Wedding Wala</span>
              </div>
              {d.busyDates.length === 0 ? (
                <p className="small muted">No platform bookings showing yet — ask Vendor Team to verify by phone before confirming.</p>
              ) : (
                <div className="stack" style={{ gap: 6 }}>
                  {d.busyDates.map((b, idx) => (
                    <div key={`${b.date}-${idx}`} className="row between small">
                      <span><b>{fmtDay(b.date)}</b> · {b.slot}</span>
                      <Status tone={b.status === "Confirmed" ? "bad" : "warn"}>{b.kind === "hold" ? "Date Hold" : b.status}</Status>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 14 }}>
              <div className="td-name" style={{ marginBottom: 6 }}>Latest Replies from Vendor Team</div>
              {d.recentChecks.length === 0 ? (
                <p className="small muted">Vendor Team has not logged an availability check for this vendor recently.</p>
              ) : (
                <div className="stack" style={{ gap: 8 }}>
                  {d.recentChecks.map((rc) => (
                    <div key={rc.id} style={{ paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>
                      <div className="row" style={{ gap: 6 }}>
                        <AvailabilityBadge value={rc.availability} />
                        {rc.checkedForDate && <span className="small">for {fmtDay(rc.checkedForDate)}</span>}
                        {rc.perHeadPkr && <span className="small num">· {fmtPkr(rc.perHeadPkr)}/head</span>}
                        {rc.quotedPricePkr && <span className="small num">· {fmtPkr(rc.quotedPricePkr)}</span>}
                      </div>
                      {rc.note && <div className="small muted" style={{ marginTop: 2 }}>{rc.note}</div>}
                      <div className="small muted">{rc.checkedAt ? fmtWhen(rc.checkedAt) : ""}{rc.checkedByName ? ` · by ${rc.checkedByName}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
