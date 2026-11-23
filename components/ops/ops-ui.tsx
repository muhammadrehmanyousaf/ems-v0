"use client"

// Ops Portal primitives. They render the vendor portal's classes (see ops-css.ts), so every screen shares one look,
// one spacing system and one set of states (default / hover / active / focus-visible / disabled / loading).
import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { AlertCircle, Check, CheckCircle2, Copy, Info, Search, TriangleAlert } from "lucide-react"

export const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(" ")

/* ---------- shell root (modals portal INTO the shell so they inherit the tokens) ---------- */
export const OpsRootContext = React.createContext<HTMLElement | null>(null)

/* ---------- toasts ---------- */
type ToastTone = "ok" | "warn" | "bad"
interface ToastItem { id: number; title: string; body?: string; tone: ToastTone }
const ToastContext = React.createContext<(t: { title: string; body?: string; tone?: ToastTone }) => void>(() => {})
export const useOpsToast = () => React.useContext(ToastContext)

export function OpsToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])
  const push = React.useCallback((t: { title: string; body?: string; tone?: ToastTone }) => {
    const id = Date.now() + Math.random()
    setItems((cur) => [...cur.slice(-3), { id, title: t.title, body: t.body, tone: t.tone ?? "ok" }])
    window.setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), t.tone === "bad" ? 7000 : 3800)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={cx("toast", t.tone !== "ok" && t.tone)} role={t.tone === "bad" ? "alert" : "status"}>
            <i aria-hidden />
            <div><b>{t.title}</b>{t.body ? <span>{t.body}</span> : null}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/* ---------- layout ---------- */
export function PageHead({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="head">
      <div style={{ minWidth: 0 }}>
        <h1>{title}</h1>
        {sub ? <p className="sub">{sub}</p> : null}
      </div>
      {actions ? <div className="head-actions">{actions}</div> : null}
    </div>
  )
}

export function Card({ title, sub, actions, flush, children, className }: {
  title?: React.ReactNode
  sub?: React.ReactNode
  actions?: React.ReactNode
  flush?: boolean
  children?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cx("card", className)}>
      {(title || actions) && (
        <div className="card-h">
          <div style={{ minWidth: 0 }}>
            {title ? <h2>{title}</h2> : null}
            {sub ? <p className="sub">{sub}</p> : null}
          </div>
          {actions}
        </div>
      )}
      {children !== undefined && <div className={cx("card-b", flush && "flush")}>{children}</div>}
    </section>
  )
}

/* ---------- buttons ---------- */
export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "link"
  size?: "md" | "sm"
  loading?: boolean
  icon?: React.ReactNode
}
export const Btn = React.forwardRef<HTMLButtonElement, BtnProps>(function Btn(
  { variant = "ghost", size = "md", loading, icon, children, className, disabled, type = "button", ...rest }, ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={cx("btn", `btn-${variant}`, size === "sm" && "sm", className)} {...rest}>
      {loading ? <span className="spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})

export function IconBtn({ label, children, ...rest }: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="ibtn" aria-label={label} title={label} {...rest}>{children}</button>
}

/* ---------- status, chips, avatar ---------- */
export type Tone = "ok" | "warn" | "info" | "bad" | "acc" | "mut"
export function Status({ tone = "mut", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={cx("st", tone !== "mut" && tone)}><i aria-hidden />{children}</span>
}
export function Chip({ on, onClick, children }: { on?: boolean; onClick?: () => void; children: React.ReactNode }) {
  if (!onClick) return <span className={cx("chip", on && "on")}>{children}</span>
  return <button type="button" className={cx("chip", on && "on")} aria-pressed={!!on} onClick={onClick}>{children}</button>
}
export function Avatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?"
  return <span className="ava" aria-hidden>{initials}</span>
}

/* ---------- segmented + tabs (docs/design-samples) ---------- */
export function Seg<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label?: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={cx(value === o.value && "on")} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}
export function TabBar<T extends string>({ value, onChange, tabs, label }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[]; label?: string }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.value} type="button" role="tab" aria-selected={value === t.value} className={cx("tab", value === t.value && "on")} onClick={() => onChange(t.value)}>
          {t.label}{t.count !== undefined && <span className="cnt">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* ---------- forms ---------- */
export function Field({ label, hint, error, required, htmlFor, children, className }: {
  label?: string; hint?: React.ReactNode; error?: string | null; required?: boolean; htmlFor?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cx("field", className)}>
      {label ? <label htmlFor={htmlFor}>{label}{required ? <span className="req" aria-hidden>*</span> : null}</label> : null}
      {children}
      {error ? <p className="err" role="alert"><AlertCircle size={13} aria-hidden />{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; compact?: boolean }>(
  function Input({ className, invalid, compact, ...rest }, ref) { return <input ref={ref} className={cx("inp", compact && "sm", invalid && "invalid", className)} {...rest} /> })
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, children, ...rest }, ref) { return <select ref={ref} className={cx("sel", invalid && "invalid", className)} {...rest}>{children}</select> })
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...rest }, ref) { return <textarea ref={ref} className={cx("txa", invalid && "invalid", className)} {...rest} /> })
export function Check_({ checked, onChange, children, disabled }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; disabled?: boolean }) {
  return <label className="check"><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />{children}</label>
}
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className="sw" onClick={() => onChange(!checked)} />
}
export function SearchBox({ value, onChange, placeholder = "Search", label = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) {
  return (
    <label className="f-search">
      <Search aria-hidden /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} />
    </label>
  )
}

/* ---------- feedback ---------- */
export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "bad" | "ok"; children: React.ReactNode }) {
  const Icon = tone === "bad" ? AlertCircle : tone === "warn" ? TriangleAlert : tone === "ok" ? CheckCircle2 : Info
  return <div className={cx("notice", tone)} role={tone === "bad" ? "alert" : "status"}><Icon aria-hidden /><div>{children}</div></div>
}
export function Empty({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="empty">
      {icon ? <span className="e-ico" aria-hidden>{icon}</span> : null}
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  )
}
export function Skel({ h = 14, w = "100%", style }: { h?: number; w?: number | string; style?: React.CSSProperties }) {
  return <div className="skel" aria-hidden style={{ height: h, width: w, ...style }} />
}
export function SkelRows({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ padding: 16, display: "grid", gap: 14 }} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => <Skel key={i} h={16} w={`${90 - (i % 3) * 14}%`} />)}
    </div>
  )
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Empty icon={<AlertCircle />} title="Something went wrong" action={onRetry ? <Btn onClick={onRetry}>Try again</Btn> : undefined}>{message}</Empty>
  )
}
export function Kpi({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
  return <div className="card kpi"><div className="k-l">{label}</div><div className="k-v">{value}</div>{note ? <div className="k-n">{note}</div> : null}</div>
}

/* ---------- pager ---------- */
export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const win: number[] = []
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) win.push(p)
  return (
    <div className="tbl-foot">
      <span className="num">{total === 0 ? "No results" : `${from}–${to} of ${total}`}</span>
      {pages > 1 && (
        <div className="pager" role="navigation" aria-label="Pages">
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">‹</button>
          {win.map((p) => <button key={p} type="button" className={cx(p === page && "on")} aria-current={p === page ? "page" : undefined} onClick={() => onPage(p)}>{p}</button>)}
          <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">›</button>
        </div>
      )}
    </div>
  )
}

/* ---------- modal ---------- */
export function Modal({ open, onClose, title, description, children, footer, size = "md" }: {
  open: boolean; onClose: () => void; title: string; description?: React.ReactNode; children?: React.ReactNode; footer?: React.ReactNode; size?: "md" | "wide" | "xwide"
}) {
  const root = React.useContext(OpsRootContext)
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal container={root ?? undefined}>
        <Dialog.Overlay className="ov" />
        <Dialog.Content className={cx("dlg", size === "wide" && "wide", size === "xwide" && "xwide")} aria-describedby={description ? undefined : undefined}>
          <div className="dlg-h">
            <Dialog.Title asChild><h2>{title}</h2></Dialog.Title>
            {description ? <Dialog.Description asChild><p>{description}</p></Dialog.Description> : null}
          </div>
          {children ? <div className="dlg-b">{children}</div> : null}
          {footer ? <div className="dlg-f">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ---------- misc ---------- */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Btn size="sm" icon={copied ? <Check aria-hidden /> : <Copy aria-hidden />} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 2000) } catch { /* text is selectable */ }
    }}>{copied ? "Copied" : label}</Btn>
  )
}

/** "12,345" style number, tabular. */
export const fmtNum = (n: number | null | undefined) => (n == null ? "—" : new Intl.NumberFormat("en-PK").format(n))
/** Short date+time in Pakistan time, e.g. "23 Nov, 4:30 pm". */
export function fmtWhen(iso: string | Date | null | undefined): string {
  if (!iso) return "—"
  const d = typeof iso === "string" ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(d).replace(",", "")
}
export function fmtDay(iso: string | Date | null | undefined): string {
  if (!iso) return "—"
  const d = typeof iso === "string" ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" }).format(d)
}
/** "3 hours ago" / "in 2 days". */
export function fromNow(iso: string | Date | null | undefined): string {
  if (!iso) return "—"
  const t = (typeof iso === "string" ? new Date(iso) : iso).getTime()
  if (Number.isNaN(t)) return "—"
  const diff = t - Date.now()
  const abs = Math.abs(diff)
  const m = Math.round(abs / 60000)
  const unit = m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`
  if (m < 1) return "just now"
  return diff < 0 ? `${unit} ago` : `in ${unit}`
}
