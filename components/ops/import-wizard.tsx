"use client"

// Spreadsheet import: choose a file, check the columns, review what would happen, then commit.
// The file is read in the BROWSER and only plain rows are sent; the server re-validates every cell and never parses a binary file.
// Nothing becomes a prospect until "Add prospects" is pressed.
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Download, FileSpreadsheet, Upload } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { Btn, Card, Empty, ErrorState, Field, Kpi, Notice, PageHead, Select, SkelRows, Status, TabBar, fmtWhen, useOpsToast, type Tone } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { importsApi, type ImportField, type ImportMapping, type ImportRowKind, type ImportRowLabel } from "@/lib/api/ops-prospects"
import { VENDOR_TYPES } from "@/lib/vendor-types"

const MAX_ROWS = 5000
const FIELDS: { key: ImportField; label: string; required?: boolean; hint?: string }[] = [
  { key: "name", label: "Business name", required: true },
  { key: "phone", label: "Phone", required: true, hint: "The main number" },
  { key: "phone2", label: "Second phone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "vendorType", label: "Category", hint: "e.g. Banquet hall, Photographer" },
  { key: "city", label: "City" },
  { key: "area", label: "Area" },
  { key: "address", label: "Address" },
  { key: "mapsUrl", label: "Google Maps link" },
  { key: "website", label: "Website" },
  { key: "email", label: "Email" },
  { key: "contactPerson", label: "Contact person" },
  { key: "notes", label: "Notes" },
]

const KIND_META: Record<ImportRowKind, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "ok" },
  matches_listing: { label: "On Wedding Wala (unclaimed)", tone: "acc" },
  possible_match: { label: "Check: similar name", tone: "warn" },
  duplicate_file: { label: "Repeated in this file", tone: "mut" },
  duplicate_prospect: { label: "Already a prospect", tone: "mut" },
  existing_vendor: { label: "Already a live vendor", tone: "info" },
  error: { label: "Cannot import", tone: "bad" },
}
const REASON: Record<string, string> = {
  no_name: "No business name",
  no_phone: "No phone number",
  phone_damaged: "Phone damaged by Excel (it shows like 3.0E+09). Format the column as Text and re-export.",
  phone_damaged_partly: "One phone was damaged by Excel and skipped",
  unknown_city: "City not recognised",
  unknown_type: "Category not recognised",
  no_city: "No city",
  no_type: "No category",
  bad_email: "Email looks wrong and was ignored",
}

type Parsed = { fileName: string; headers: string[]; rows: string[][]; sheets: string[]; sheet: string }
type Step = "setup" | "map" | "review" | "done"
type PreviewOk = Extract<Awaited<ReturnType<typeof importsApi.preview>>, { needsMapping: false }>

const DEMO_HEADERS = [
  "Business Name",
  "Phone",
  "Category",
  "City",
  "Area",
  "WhatsApp",
  "Phone 2",
  "Contact Person",
  "Address",
  "Email",
  "Google Maps Link",
  "Website",
  "Notes",
]

const DEMO_SAMPLE_ROWS: string[][] = [
  [
    "Royal Garden Marquee",
    "03001234567",
    "Wedding venue",
    "Lahore",
    "Gulberg III",
    "03001234567",
    "04235761234",
    "Haji Tariq Mehmood",
    "Plot 45 Main Boulevard Gulberg III, Lahore",
    "info@royalgarden.pk",
    "https://maps.google.com/?q=Royal+Garden+Marquee+Lahore",
    "https://royalgarden.pk",
    "Dual banquet halls up to 700 guests",
  ],
  [
    "Noor Bridal Salon & Studio",
    "03219876543",
    "Makeup artist",
    "Karachi",
    "DHA Phase 6",
    "03219876543",
    "",
    "Sana Salman",
    "Lane 4 Bukhari Commercial, DHA Phase 6, Karachi",
    "",
    "",
    "https://instagram.com/noorbridalstudio",
    "Bridal + party makeup packages",
  ],
  [
    "Zaiqa Royale Catering",
    "03335554433",
    "Catering",
    "Islamabad",
    "F-10 Markaz",
    "03335554433",
    "",
    "Usman Khalid",
    "Street 12 F-10 Markaz, Islamabad",
    "orders@zaiqaroyale.pk",
    "",
    "",
    "Specialists in Mutton Qorma & live BBQ",
  ],
  [
    "ClickCraft Wedding Films",
    "03457778899",
    "Photographer",
    "Rawalpindi",
    "Bahria Town Phase 7",
    "03457778899",
    "",
    "Bilal Ahmed",
    "Civic Center Bahria Town Phase 7",
    "",
    "",
    "",
    "Full drone & cinema wedding shoots",
  ],
]

async function downloadDemoFile(format: "xlsx" | "csv") {
  const XLSX = await import("xlsx")
  const aoa = [DEMO_HEADERS, ...DEMO_SAMPLE_ROWS]
  if (format === "csv") {
    const csv = aoa.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n")
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "wedding-wala-vendors-demo-template.csv"
    document.body.appendChild(a); a.click(); a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
    return
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  // Format Phone, WhatsApp & Phone 2 columns strictly as text so Excel never strips leading zeros or prints 3.00E+09
  const textCols = [1, 5, 6]
  for (let r = 1; r <= DEMO_SAMPLE_ROWS.length; r++) {
    for (const c of textCols) {
      const ref = XLSX.utils.encode_cell({ r, c })
      if (ws[ref]) { ws[ref].t = "s"; ws[ref].z = "@" }
    }
  }
  ws["!cols"] = DEMO_HEADERS.map((h) => ({ wch: Math.max(16, h.length + 4) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Vendors")
  XLSX.writeFile(wb, "wedding-wala-vendors-demo-template.xlsx")
}

async function readSheet(file: File, sheetName?: string): Promise<Parsed> {
  const XLSX = await import("xlsx")
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: "array" })
  const sheet = sheetName && wb.SheetNames.includes(sheetName) ? sheetName : wb.SheetNames[0]
  const ws = wb.Sheets[sheet]
  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "", blankrows: false })
  const text = grid.map((r) => (r as unknown[]).map((c) => String(c ?? "").trim()))
  if (text.length < 2) throw new Error("The file needs a header row and at least one row of vendors.")
  let width = Math.max(...text.map((r) => r.length))
  while (width > 1 && text.every((r) => !r[width - 1])) width--
  const headers = Array.from({ length: width }, (_, i) => text[0][i] || `Column ${i + 1}`)
  const rows = text.slice(1).map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ""))
  return { fileName: file.name, headers, rows, sheets: wb.SheetNames, sheet }
}

export function ImportWizard() {
  const { me, can } = useOps()
  const qc = useQueryClient()
  const toast = useOpsToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("setup")
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [teamId, setTeamId] = useState("")
  const [cityId, setCityId] = useState("")
  const [defaultType, setDefaultType] = useState("")
  const [sourceType, setSourceType] = useState("maps")
  const [mapping, setMapping] = useState<ImportMapping>({})
  const [needsMessage, setNeedsMessage] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewOk | null>(null)
  const [listTab, setListTab] = useState<"import" | "skipped" | "errors">("import")
  const [assign, setAssign] = useState("pool")
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ batchId: number; created: number; skippedAsDuplicate: number } | null>(null)

  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities })
  const allTeams = useQuery({ queryKey: ["ops", "teams"], queryFn: opsApi.teams, enabled: me.scope.all || can("ops_prospect_reassign") })
  const history = useQuery({ queryKey: ["ops", "imports"], queryFn: importsApi.list })

  const teamOptions = useMemo(() => {
    if (me.scope.all) return (allTeams.data?.teams ?? []).filter((t) => t.kind === "vendor_outreach" && t.active).map((t) => ({ id: t.id, name: t.name }))
    return me.memberships.filter((m) => m.kind === "vendor_outreach").map((m) => ({ id: m.teamId, name: m.teamName }))
  }, [me, allTeams.data])
  useEffect(() => { if (!teamId && teamOptions.length === 1) setTeamId(String(teamOptions[0].id)) }, [teamOptions, teamId])
  const teamPeople = useMemo(() => {
    const t = (allTeams.data?.teams ?? []).find((x) => String(x.id) === teamId)
    return (t?.members ?? []).filter((m) => m.active && m.user && m.userId !== me.user.id).map((m) => ({ id: m.userId, name: m.user!.fullName }))
  }, [allTeams.data, teamId, me.user.id])

  const runPreview = async (p: Parsed, m?: ImportMapping, replace?: number) => {
    setError(null); setBusy("Checking every row against your existing prospects and the marketplace…")
    try {
      const res = await importsApi.preview({
        fileName: p.fileName, headers: p.headers, rows: p.rows, mapping: m, teamId: teamId ? Number(teamId) : undefined, cityId: cityId ? Number(cityId) : undefined,
        defaultVendorType: defaultType || undefined, sourceType, replaceBatchId: replace,
      })
      if (res.needsMapping) { setMapping(res.suggestedMapping); setNeedsMessage(res.message); setPreview(null); setStep("map"); return }
      setPreview(res); setMapping(res.mapping); setNeedsMessage(null); setListTab(res.summary.willImport ? "import" : res.summary.error ? "errors" : "skipped"); setStep("review")
    } catch (e) { setError(opsErrorMessage(e)) } finally { setBusy(null) }
  }

  const onFile = async (file: File | undefined, sheet?: string) => {
    if (!file) return
    setError(null)
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { setError("Choose an Excel (.xlsx, .xls) or CSV file."); return }
    if (file.size > 10 * 1024 * 1024) { setError("That file is over 10 MB. Split it and import in parts."); return }
    if (!teamId && teamOptions.length !== 1 && !me.scope.all) { setError("Choose which team this sheet is for first."); return }
    setBusy("Reading the file…")
    try {
      const p = await readSheet(file, sheet)
      if (p.rows.length > MAX_ROWS) { setError(`This sheet has ${p.rows.length.toLocaleString()} rows. The limit is ${MAX_ROWS.toLocaleString()} per file: split it and import in parts.`); setBusy(null); return }
      setParsed(p)
      await runPreview(p)
    } catch (e) { setError((e as Error).message || "Could not read that file."); setBusy(null) }
  }
  const fileRef = useRef<File | null>(null)

  const commit = useMutation({
    mutationFn: () => importsApi.commit(preview!.batchId, assign === "pool" ? "pool" : assign === "me" ? "me" : Number(assign)),
    onSuccess: (r) => { setResult(r); setStep("done"); qc.invalidateQueries({ queryKey: ["ops", "prospects"] }); qc.invalidateQueries({ queryKey: ["ops", "imports"] }); qc.invalidateQueries({ queryKey: ["ops", "summary"] }); toast({ title: `${r.created} prospects added` }) },
    onError: (e) => setError(opsErrorMessage(e)),
  })
  const discard = useMutation({
    mutationFn: () => importsApi.discard(preview!.batchId),
    onSuccess: () => { reset(); toast({ title: "Import discarded", body: "Nothing was added." }) },
    onError: (e) => setError(opsErrorMessage(e)),
  })
  const reset = () => { setStep("setup"); setParsed(null); setPreview(null); setMapping({}); setResult(null); setError(null); setNeedsMessage(null); if (fileInput.current) fileInput.current.value = ""; fileRef.current = null }

  const sampleValues = (col: number | undefined) => (col == null || !parsed ? [] : parsed.rows.slice(0, 3).map((r) => r[col]).filter(Boolean))

  /* ------------------------------ steps ------------------------------ */

  const setupCard = (
    <Card title="1. Choose the sheet" sub="Excel or CSV. The first row must be the column names. Up to 5,000 vendors per file.">
      <div className="stack" style={{ gap: 18 }}>
        <div className="form-grid">
          {(teamOptions.length > 1 || me.scope.all) && (
            <Field label="Which team is this sheet for?" htmlFor="im-team" required>
              <Select id="im-team" value={teamId} onChange={(e) => setTeamId(e.target.value)}><option value="">Choose…</option>{teamOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
            </Field>
          )}
          <Field label="City for rows with no city" htmlFor="im-city" hint="Optional. Used only when the sheet has no city column.">
            <Select id="im-city" value={cityId} onChange={(e) => setCityId(e.target.value)}><option value="">None</option>{(cities.data?.cities ?? []).filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          </Field>
          <Field label="Category for rows with no category" htmlFor="im-type" hint="Optional. Useful when the whole sheet is one kind of vendor.">
            <Select id="im-type" value={defaultType} onChange={(e) => setDefaultType(e.target.value)}><option value="">None</option>{Object.values(VENDOR_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}</Select>
          </Field>
          <Field label="Where did this list come from?" htmlFor="im-src">
            <Select id="im-src" value={sourceType} onChange={(e) => setSourceType(e.target.value)}><option value="maps">Google Maps research</option><option value="referral">Referrals</option><option value="other">Other</option></Select>
          </Field>
        </div>

        <label className="card" style={{ borderStyle: "dashed", padding: 28, textAlign: "center", cursor: busy ? "wait" : "pointer", display: "block" }}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); fileRef.current = e.dataTransfer.files?.[0] ?? null; void onFile(fileRef.current ?? undefined) }}>
          <span className="e-ico" aria-hidden style={{ display: "inline-grid", width: 40, height: 40, borderRadius: 10, background: "var(--surface-3)", border: "1px solid var(--border)", placeItems: "center", marginBottom: 8 }}><Upload size={20} /></span>
          <div className="strong">Drop a file here, or click to choose</div>
          <div className="small muted" style={{ marginTop: 4 }}>.xlsx, .xls or .csv (CSV must be saved as UTF-8 so Urdu names stay readable)</div>
          <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" hidden disabled={!!busy} onChange={(e) => { fileRef.current = e.target.files?.[0] ?? null; void onFile(fileRef.current ?? undefined) }} />
        </label>

        <Notice tone="info"><b>Tip for phone numbers:</b> before saving from Excel, format the phone column as <b>Text</b>. Otherwise Excel turns long numbers into 3.0E+09 and drops the leading zero, and those digits cannot be recovered. Rows like that are held back, never guessed.</Notice>

        <div className="card" style={{ padding: 14, background: "var(--surface-2)" }}>
          <div className="row between" style={{ gap: 12, marginBottom: 10 }}>
            <div>
              <div className="td-name">Need the right spreadsheet format?</div>
              <div className="small muted">Download a ready demo file with sample Pakistani vendor rows and phone columns already locked as Text.</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Btn size="sm" variant="primary" icon={<Download size={14} aria-hidden />} onClick={() => void downloadDemoFile("xlsx")}>
                Download Demo Excel (.xlsx)
              </Btn>
              <Btn size="sm" icon={<Download size={14} aria-hidden />} onClick={() => void downloadDemoFile("csv")}>
                Download Demo CSV
              </Btn>
            </div>
          </div>
          <details>
            <summary className="small strong" style={{ cursor: "pointer", color: "var(--accent-ink)" }}>
              View exact columns &amp; sample record format (2 required, 11 optional)
            </summary>
            <div className="tbl-wrap" style={{ marginTop: 10 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Business Name *</th>
                    <th>Phone *</th>
                    <th>Category</th>
                    <th>City</th>
                    <th>Area</th>
                    <th>WhatsApp</th>
                    <th>Contact Person</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_SAMPLE_ROWS.slice(0, 2).map((row) => (
                    <tr key={row[1]}>
                      <td className="td-name">{row[0]}</td>
                      <td className="nw num">{row[1]}</td>
                      <td>{row[2]}</td>
                      <td>{row[3]}</td>
                      <td>{row[4]}</td>
                      <td className="nw num">{row[5]}</td>
                      <td>{row[7]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted" style={{ marginTop: 8 }}>
              Optional columns also supported automatically: <code>Phone 2</code>, <code>Address</code>, <code>Email</code>, <code>Google Maps Link</code>, <code>Website</code>, and <code>Notes</code>.
            </p>
          </details>
        </div>
      </div>
    </Card>
  )

  const mapCard = parsed && (
    <Card title="2. Check the columns" sub={needsMessage ?? "We matched your columns automatically. Fix any that look wrong."}
      actions={parsed.sheets.length > 1 ? (
        <Select aria-label="Sheet" value={parsed.sheet} onChange={(e) => fileRef.current && void onFile(fileRef.current, e.target.value)} style={{ width: "auto" }}>{parsed.sheets.map((s) => <option key={s} value={s}>Sheet: {s}</option>)}</Select>
      ) : undefined}>
      <div className="stack" style={{ gap: 14 }}>
        {needsMessage && <Notice tone="warn">{needsMessage}</Notice>}
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Information</th><th>Column in your file</th><th>First values</th></tr></thead>
          <tbody>
            {FIELDS.map((f) => (
              <tr key={f.key}>
                <td><div className="td-name">{f.label}{f.required && <span className="req" aria-hidden>*</span>}</div>{f.hint && <div className="td-sub">{f.hint}</div>}</td>
                <td style={{ minWidth: 220 }}>
                  <Select aria-label={f.label} value={mapping[f.key] == null ? "" : String(mapping[f.key])} onChange={(e) => setMapping((m) => { const n = { ...m }; if (e.target.value === "") delete n[f.key]; else n[f.key] = Number(e.target.value); return n })}>
                    <option value="">{f.required ? "Choose a column…" : "Not in my file"}</option>
                    {parsed.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </Select>
                </td>
                <td className="td-mut" style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sampleValues(mapping[f.key]).join(" · ") || <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <div className="row">
          <Btn variant="primary" loading={!!busy} disabled={mapping.name == null || (mapping.phone == null && mapping.phone2 == null && mapping.whatsapp == null)} onClick={() => runPreview(parsed, mapping, preview?.batchId)}>Check this file</Btn>
          <Btn onClick={reset}>Start over</Btn>
        </div>
      </div>
    </Card>
  )

  const s = preview?.summary
  const listRows: ImportRowLabel[] = !preview ? [] : listTab === "import" ? preview.sample : listTab === "errors" ? preview.issues.filter((r) => r.kind === "error") : preview.issues.filter((r) => r.kind !== "error")
  const skipped = s ? s.duplicateFile + s.duplicateProspect + s.existingVendor : 0

  const reviewCard = preview && s && (
    <div className="stack">
      <div className="kpis">
        <Kpi label="Will be added" value={s.willImport.toLocaleString()} note={`of ${s.total.toLocaleString()} rows`} />
        <Kpi label="New vendors" value={s.new.toLocaleString()} />
        <Kpi label="Already on Wedding Wala" value={s.matchesListing.toLocaleString()} note="Unclaimed listings: high priority" />
        <Kpi label="Check: similar name" value={s.possibleMatch.toLocaleString()} note="Added, flagged for a human" />
        <Kpi label="Skipped duplicates" value={skipped.toLocaleString()} note={`${s.duplicateFile} in file · ${s.duplicateProspect} known · ${s.existingVendor} live vendors`} />
        <Kpi label="Cannot import" value={s.error.toLocaleString()} note={s.phoneDamaged ? `${s.phoneDamaged} have a damaged phone` : "No name or no phone"} />
      </div>
      {s.phoneDamaged > 0 && <Notice tone="warn"><b>{s.phoneDamaged} phone number{s.phoneDamaged === 1 ? " was" : "s were"} damaged by Excel</b> (they look like 3.0E+09). Those rows are held back, because the real digits are gone. Format the phone column as Text, export again, and import just those rows.</Notice>}
      <Card title="3. Review" sub="Nothing has been added yet." actions={<Btn size="sm" onClick={() => setStep("map")}>Change columns</Btn>} flush>
        <div style={{ padding: "0 18px 12px" }}>
          <TabBar value={listTab} onChange={setListTab} label="Rows" tabs={[{ value: "import", label: "Will be added", count: s.willImport }, { value: "skipped", label: "Skipped", count: skipped }, { value: "errors", label: "Cannot import", count: s.error }]} />
        </div>
        {listRows.length === 0 ? <Empty title="Nothing in this list" /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th className="nw">Row</th><th>Business</th><th>Phone</th><th>What happens</th></tr></thead>
              <tbody>
                {listRows.map((r) => {
                  const m = KIND_META[r.kind]
                  const why = [...r.errors, ...r.warnings].map((c) => REASON[c] ?? c)
                  return (
                    <tr key={r.index}>
                      <td className="nw num td-mut">{r.row}</td>
                      <td style={{ minWidth: 220 }}><div className="td-name">{r.name || "—"}</div><div className="td-sub">{[r.vendorType, r.city].filter(Boolean).join(" · ") || "—"}</div></td>
                      <td className="nw num td-mut">{r.phones.join(" / ") || "—"}</td>
                      <td style={{ minWidth: 260 }}>
                        <Status tone={m.tone}>{m.label}</Status>
                        {r.ref?.name && <div className="td-sub">{r.kind === "duplicate_prospect" ? "Same as prospect" : "Same as listing"}: {r.ref.name}</div>}
                        {r.ref?.row && <div className="td-sub">Same number as row {r.ref.row}</div>}
                        {why.length > 0 && <div className="td-sub" style={{ color: r.errors.length ? "var(--bad)" : undefined }}>{why.join(" · ")}</div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {listTab === "import" && s.willImport > preview.sample.length && <div className="small muted" style={{ padding: "10px 18px 14px" }}>Showing the first {preview.sample.length} of {s.willImport.toLocaleString()}.</div>}
      </Card>

      <Card title="4. Add them">
        <div className="stack" style={{ gap: 14 }}>
          <Field label="Who gets these prospects?" htmlFor="im-assign" hint="Anyone on the team can pick up unassigned prospects from the call queue.">
            <Select id="im-assign" value={assign} onChange={(e) => setAssign(e.target.value)}>
              <option value="pool">Leave them in the team pool</option>
              <option value="me">Assign all to me</option>
              {can("ops_prospect_reassign") && teamPeople.map((p) => <option key={p.id} value={p.id}>Assign all to {p.name}</option>)}
            </Select>
          </Field>
          {error && <Notice tone="bad">{error}</Notice>}
          <div className="row">
            <Btn variant="primary" loading={commit.isPending} disabled={s.willImport === 0} onClick={() => commit.mutate()}>Add {s.willImport.toLocaleString()} prospect{s.willImport === 1 ? "" : "s"}</Btn>
            <Btn loading={discard.isPending} onClick={() => discard.mutate()}>Discard this import</Btn>
          </div>
        </div>
      </Card>
    </div>
  )

  const doneCard = result && (
    <Card>
      <Empty icon={<FileSpreadsheet />} title={`${result.created.toLocaleString()} prospects added`}
        action={<div className="row" style={{ justifyContent: "center" }}><Link className="btn btn-primary" href={`/ops/prospects?batch=${result.batchId}&view=all`}>See them</Link>{can("ops_prospect_call") && <Link className="btn btn-ghost" href="/ops/call">Start calling</Link>}<Btn onClick={reset}>Import another file</Btn></div>}>
        {result.skippedAsDuplicate > 0 ? `${result.skippedAsDuplicate} were skipped because someone added the same number while you were reviewing.` : "Every importable row was added."}
      </Empty>
    </Card>
  )

  return (
    <>
      <PageHead title="Import vendors" sub="Turn a spreadsheet of vendors (from Google Maps research, for example) into a call list. Duplicates are found by phone number, never by name alone." />
      <div className="stack">
        {busy && <Notice tone="info"><span className="row" style={{ flexWrap: "nowrap" }}><span className="spin" aria-hidden />{busy}</span></Notice>}
        {error && step !== "review" && <Notice tone="bad"><AlertTriangle size={0} aria-hidden />{error}</Notice>}
        {step === "setup" && setupCard}
        {step === "map" && mapCard}
        {step === "review" && reviewCard}
        {step === "done" && doneCard}

        <Card title="Earlier imports" flush>
          {history.isLoading ? <SkelRows rows={3} /> : history.isError ? <ErrorState message={opsErrorMessage(history.error)} onRetry={() => history.refetch()} />
            : (history.data?.batches ?? []).length === 0 ? <Empty title="No imports yet">Your first import will show up here.</Empty> : (
              <div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>File</th><th>By</th><th>Team</th><th className="r">Rows</th><th className="r">Added</th><th>Status</th><th>When</th><th /></tr></thead>
                <tbody>
                  {history.data!.batches.map((b) => (
                    <tr key={b.id}>
                      <td className="td-name">{b.fileName ?? `Import #${b.id}`}</td>
                      <td className="td-mut">{b.uploadedBy?.fullName ?? "—"}</td>
                      <td className="td-mut">{b.team?.name ?? "—"}</td>
                      <td className="r num">{b.totalRows.toLocaleString()}</td>
                      <td className="r num">{b.committedRows.toLocaleString()}</td>
                      <td>{b.status === "committed" ? <Status tone="ok">Added</Status> : <Status tone="warn">Not added</Status>}</td>
                      <td className="nw td-mut">{fmtWhen(b.committedAt ?? b.createdAt)}</td>
                      <td className="r">{b.status === "committed" && <Link className="btn btn-link" href={`/ops/prospects?batch=${b.id}&view=all`}>View</Link>}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
        </Card>
      </div>
    </>
  )
}
