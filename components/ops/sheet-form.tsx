"use client"

// Renders ONE step of a call sheet from the server's sheet definition. The sheet is data, not a form: the server validates against the
// same definition, so a field added there appears here with no code change. Unanswered yes/no stays unset (it is not "no").
import { Plus, Trash2 } from "lucide-react"

import { Btn, Chip, Field, IconBtn, Input, Select, Seg, Textarea, cx } from "@/components/ops/ops-ui"
import type { FieldError, SheetData, SheetField } from "@/lib/api/ops-onboarding"

type YesNo = "yes" | "no" | "unset"
const asString = (v: unknown) => (v === undefined || v === null ? "" : String(v))
const isFilled = (v: unknown) => !(v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0))

const REASON_TEXT: Record<string, string> = {
  not_a_number: "Enter a number", must_be_whole_number: "Enter a whole number", invalid_phone: "Enter a valid phone number", invalid_email: "Enter a valid e-mail address",
  invalid_url: "Enter a link starting with http:// or https://", invalid_time: "Enter a time like 23:30", not_an_allowed_option: "Choose one of the options", invalid_selection: "Choose from the list", invalid_list: "Too many rows",
  not_a_boolean: "Choose yes or no",
}
export function reasonText(reason: string): string {
  if (REASON_TEXT[reason]) return REASON_TEXT[reason]
  const m = /^(min|max)_(.+)$/.exec(reason)
  if (m) return m[1] === "min" ? `Must be at least ${m[2]}` : `Must be at most ${m[2]}`
  const t = /^too_long_max_(\d+)$/.exec(reason)
  if (t) return `Keep it under ${t[1]} characters`
  return "Check this answer"
}

/** Is a required field of this step still empty? (instant feedback; the server's `missing` is the authority) */
export function stepMissing(fields: SheetField[], data: SheetData): string[] {
  return fields.filter((f) => f.required && !isFilled(data[f.key])).map((f) => f.key)
}

/* ------------------------------- structured lists ------------------------------- */

interface Col { k: string; label: string; type: "text" | "number" | "lines"; placeholder?: string; wide?: boolean }
const LISTS: Record<string, { add: string; cols: Col[]; blank: Record<string, unknown> }> = {
  halls: { add: "Add a hall", cols: [{ k: "name", label: "Hall name", type: "text", placeholder: "Main hall", wide: true }, { k: "capacity", label: "Capacity", type: "number", placeholder: "500" }], blank: { name: "", capacity: "" } },
  packages: { add: "Add a package", cols: [{ k: "name", label: "Package name", type: "text", placeholder: "Gold", wide: true }, { k: "price", label: "Price (PKR)", type: "number", placeholder: "2000000" }, { k: "features", label: "What is included", type: "text", placeholder: "Hall, stage, sound system", wide: true }], blank: { name: "", price: "", features: "" } },
  menus: { add: "Add a menu", cols: [{ k: "title", label: "Menu name", type: "text", placeholder: "Standard", wide: true }, { k: "price", label: "Price per head (PKR)", type: "number", placeholder: "1800" }, { k: "items", label: "Dishes (one per line)", type: "lines", wide: true }], blank: { title: "", price: "", items: [] } },
  socialLinks: { add: "Add a link", cols: [{ k: "platform", label: "Platform", type: "text", placeholder: "Instagram" }, { k: "url", label: "Link", type: "text", placeholder: "https://instagram.com/…", wide: true }], blank: { platform: "", url: "" } },
}

function ListEditor({ field, value, onChange }: { field: SheetField; value: unknown; onChange: (v: unknown) => void }) {
  const def = LISTS[field.key]
  const rows = (Array.isArray(value) ? value : []) as Record<string, unknown>[]
  if (!def) return null
  const set = (i: number, k: string, v: unknown) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  return (
    <div className="stack" style={{ gap: 12 }}>
      {rows.length === 0 ? <p className="hint" style={{ margin: 0, color: "var(--ink-3)", fontSize: 12.5 }}>Nothing added yet.</p> : null}
      {rows.map((row, i) => (
        <div key={i} className="card" style={{ boxShadow: "none" }}>
          <div className="card-b" style={{ paddingTop: 14, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", alignItems: "start" }}>
            {def.cols.map((c) => (
              <Field key={c.k} label={c.label} className={c.wide ? "wide" : undefined}>
                {c.type === "lines" ? (
                  <Textarea rows={4} value={Array.isArray(row[c.k]) ? (row[c.k] as string[]).join("\n") : asString(row[c.k])} placeholder="Chicken karahi&#10;Biryani&#10;Kheer"
                    onChange={(e) => set(i, c.k, e.target.value.split("\n"))} />
                ) : (
                  <Input value={asString(row[c.k])} inputMode={c.type === "number" ? "numeric" : undefined} placeholder={c.placeholder} aria-label={`${c.label} ${i + 1}`}
                    onChange={(e) => set(i, c.k, e.target.value)} />
                )}
              </Field>
            ))}
            <div style={{ alignSelf: "end" }}><IconBtn label={`Remove ${field.label.toLowerCase()} ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))}><Trash2 size={15} /></IconBtn></div>
          </div>
        </div>
      ))}
      <div><Btn size="sm" onClick={() => onChange([...rows, { ...def.blank }])}><Plus size={14} />{def.add}</Btn></div>
    </div>
  )
}

/* ------------------------------------ one field ------------------------------------ */

function FieldInput({ field, value, onChange, invalid, id }: { field: SheetField; value: unknown; onChange: (v: unknown) => void; invalid: boolean; id: string }) {
  switch (field.input) {
    case "boolean": {
      const v: YesNo = value === true ? "yes" : value === false ? "no" : "unset"
      return <Seg<YesNo> label={field.label} value={v} onChange={(n) => onChange(n === "yes" ? true : n === "no" ? false : "")} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unset", label: "Not asked" }]} />
    }
    case "select":
      return (
        <Select id={id} value={asString(value)} invalid={invalid} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {(field.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      )
    case "multiselect": {
      const cur = Array.isArray(value) ? (value as string[]) : []
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} role="group" aria-label={field.label}>
          {(field.options || []).map((o) => (
            <Chip key={o.value} on={cur.includes(o.value)} onClick={() => onChange(cur.includes(o.value) ? cur.filter((x) => x !== o.value) : [...cur, o.value])}>{o.label}</Chip>
          ))}
        </div>
      )
    }
    case "textarea":
      return <Textarea id={id} rows={4} value={asString(value)} invalid={invalid} maxLength={field.max} onChange={(e) => onChange(e.target.value)} />
    case "list":
      return <ListEditor field={field} value={value} onChange={onChange} />
    default: {
      const numeric = field.input === "number" || field.input === "money" || field.input === "percent"
      const type = field.input === "email" ? "email" : field.input === "time" ? "time" : field.input === "url" ? "url" : field.input === "phone" ? "tel" : "text"
      return (
        <Input id={id} type={type} value={asString(value)} invalid={invalid} maxLength={field.max && !numeric ? field.max : undefined}
          inputMode={numeric ? (field.input === "number" ? "numeric" : "decimal") : undefined} autoComplete="off"
          onChange={(e) => onChange(e.target.value)} />
      )
    }
  }
}

export function SheetFields({ fields, data, onChange, errors }: { fields: SheetField[]; data: SheetData; onChange: (key: string, value: unknown) => void; errors: FieldError[] }) {
  const errOf = (k: string) => { const e = errors.find((x) => x.field === k); return e ? reasonText(e.reason) : null }
  return (
    <div style={{ display: "grid", gap: "18px 16px", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", alignItems: "start" }}>
      {fields.map((f) => {
        const id = `sheet-${f.key}`
        const err = errOf(f.key)
        const wide = f.input === "list" || f.input === "textarea" || f.input === "multiselect"
        return (
          <div key={f.key} className={cx(wide && "wide")} style={wide ? { gridColumn: "1 / -1" } : undefined}>
            <Field label={f.label} htmlFor={id} required={f.required} error={err} hint={f.help}>
              <FieldInput field={f} value={data[f.key]} onChange={(v) => onChange(f.key, v)} invalid={!!err} id={id} />
            </Field>
          </div>
        )
      })}
    </div>
  )
}
