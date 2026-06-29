"use client"

/**
 * Type-specific settings manager (redesigned, Track C — interactive editor).
 *
 * Renders the editable per-vendor-type fields (typeSpecificFields from
 * lib/vendor-type-config) for the business's vendor type and saves them via
 * BusinessesAPI.update — the SAME backend the original
 * components/tabs/type-specific-tab.tsx uses. The save / array-rewrap /
 * multi-select / grouped-options logic is ported verbatim from that original
 * (which was non-exported); only the presentation is reskinned to the
 * redesigned hub shell (Section card + Switch + Button + Icon + sonner /
 * undo-toast). Own dirty-tracked save (separate API surface, like the other
 * redesigned managers), so the hub's profile save bar is untouched.
 *
 * Empty state when the vendor type declares no type-specific fields
 * (e.g. Car Rental, which only has a Fleet packages mode).
 */

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard"
import { type VendorTypeConfig, type TypeSpecificFieldDef } from "@/lib/vendor-type-config"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner, type IconName } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const labelCls = "text-xs font-medium text-muted-foreground"
const inputCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"

function getFieldValue(business: ApiBusiness, key: string): unknown {
  return (business as unknown as Record<string, unknown>)[key]
}

function initialValues(
  business: ApiBusiness,
  fields: TypeSpecificFieldDef[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const field of fields) {
    out[field.key] =
      getFieldValue(business, field.key) ??
      (field.type === "boolean" ? false : field.type === "multi-select" ? [] : "")
  }
  return out
}

interface Props {
  business: ApiBusiness
  /**
   * Only the two fields this manager reads — a structural subset of
   * VendorTypeConfig so callers can pass a lightweight fallback for unknown
   * vendor types without constructing a full config (icon/nav/etc.).
   */
  config: Pick<VendorTypeConfig, "displayName" | "typeSpecificFields">
  /** Invalidate the hub's business query after a successful save. */
  onSaved?: () => void
}

export function TypeSpecificManager({ business, config, onSaved }: Props) {
  const qc = useQueryClient()
  const fields = config.typeSpecificFields

  const [values, setValues] = React.useState<Record<string, unknown>>(() =>
    initialValues(business, fields),
  )
  const [dirty, setDirty] = React.useState(false)

  // Re-sync local state when the business prop changes (e.g. after save + refetch).
  React.useEffect(() => {
    setValues(initialValues(business, fields))
    setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business])

  const setValue = (key: string, val: unknown) => {
    setValues((prev) => ({ ...prev, [key]: val }))
    setDirty(true)
  }

  const toggleMultiSelect = (key: string, option: string) => {
    setValues((prev) => {
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : []
      const next = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option]
      return { ...prev, [key]: next }
    })
    setDirty(true)
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const updateData: Record<string, unknown> = {}
      for (const field of fields) {
        const val = values[field.key]
        if (field.type === "number") {
          updateData[field.key] = val === "" || val == null ? null : Number(val)
        } else if (field.type === "select") {
          // Some fields (e.g. subBusinessType) are stored as ARRAY in PostgreSQL.
          // If the original DB value was an array, re-wrap the selected string as an array.
          const original = getFieldValue(business, field.key)
          updateData[field.key] = Array.isArray(original)
            ? val
              ? [String(val)]
              : []
            : val
        } else {
          updateData[field.key] = val
        }
      }
      return BusinessesAPI.update(business.id, updateData as Partial<ApiBusiness>)
    },
    onSuccess: () => {
      showSuccessToast("Settings updated")
      setDirty(false)
      qc.invalidateQueries({ queryKey: ["biz-settings-hub"] })
      onSaved?.()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Failed to update settings"),
  })

  // ── Empty state — vendor type has no type-specific fields ─────────
  if (fields.length === 0) {
    return (
      <EmptyState
        icon="Settings2"
        title="No type-specific settings"
        description={`${config.displayName} businesses don't have any extra settings to configure here. Use the other tabs for your profile, pricing and packages.`}
      />
    )
  }

  const renderField = (field: TypeSpecificFieldDef) => {
    const val = values[field.key]

    switch (field.type) {
      case "boolean":
        return (
          <label
            key={field.key}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5 hover:bg-accent/50"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium">{field.label}</span>
              {field.description && (
                <span className="block text-xs text-muted-foreground">{field.description}</span>
              )}
            </span>
            <Switch
              checked={!!val}
              onCheckedChange={(checked) => setValue(field.key, checked)}
              aria-label={field.label}
            />
          </label>
        )

      case "number":
        return (
          <div key={field.key} className="space-y-1.5">
            <label className={labelCls}>{field.label}</label>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            <input
              type="number"
              className={cn(inputCls, "tabular-nums")}
              value={val?.toString() || ""}
              onChange={(e) => setValue(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        )

      case "text":
        return (
          <div key={field.key} className="space-y-1.5">
            <label className={labelCls}>{field.label}</label>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            <input
              className={inputCls}
              value={(val as string) || ""}
              onChange={(e) => setValue(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        )

      case "select": {
        // subBusinessType may be stored as a single-item array from the registration form.
        const selectVal = Array.isArray(val)
          ? (val as string[])[0] ?? ""
          : (val as string) || ""
        return (
          <div key={field.key} className="space-y-1.5">
            <label className={labelCls}>{field.label}</label>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            <select
              className={inputCls}
              value={selectVal}
              onChange={(e) => setValue(field.key, e.target.value)}
            >
              <option value="">{`Select ${field.label.toLowerCase()}`}</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )
      }

      case "multi-select": {
        const selected = Array.isArray(val) ? (val as string[]) : []

        // Grouped rendering for fields that define option groups (e.g. stationery products).
        if (field.groups && field.groups.length > 0) {
          const selectAllInGroup = (items: string[]) => {
            const allOn = items.every((item) => selected.includes(item))
            const next = allOn
              ? selected.filter((v) => !items.includes(v))
              : [...new Set([...selected, ...items])]
            setValue(field.key, next)
          }
          return (
            <div key={field.key} className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className={labelCls}>{field.label}</label>
                {selected.length > 0 && (
                  <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                )}
              </div>
              {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
              <div className="space-y-3">
                {field.groups.map(({ group, emoji, description, items }) => {
                  const selectedInGroup = items.filter((item) => selected.includes(item)).length
                  const allSelected = selectedInGroup === items.length
                  return (
                    <div key={group} className="overflow-hidden rounded-xl border border-border">
                      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{emoji}</span>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{group}</p>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </div>
                        <div className="ml-2 flex shrink-0 items-center gap-2">
                          {selectedInGroup > 0 && (
                            <span className="text-xs font-medium text-primary">
                              {selectedInGroup}/{items.length}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => selectAllInGroup(items)}
                            className={cn(
                              "rounded-full border px-2 py-1 text-xs font-medium transition-colors",
                              allSelected
                                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                                : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary",
                            )}
                          >
                            {allSelected ? "Deselect all" : "Select all"}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 px-4 py-3">
                        {items.map((opt) => {
                          const isSelected = selected.includes(opt)
                          return (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => toggleMultiSelect(field.key, opt)}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                                  : "border-border bg-background text-muted-foreground hover:bg-accent",
                              )}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        // Default flat rendering for other multi-select fields.
        return (
          <div key={field.key} className="space-y-1.5 sm:col-span-2">
            <label className={labelCls}>{field.label}</label>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            <div className="flex flex-wrap gap-2">
              {field.options?.map((opt) => {
                const isSelected = selected.includes(opt)
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleMultiSelect(field.key, opt)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border-border bg-background text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  const icon: IconName = "Settings2"

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon name={icon} size={16} />
        </span>
        <div className="mr-auto">
          <h2 className="text-sm font-semibold">{config.displayName} details</h2>
          <p className="text-xs text-muted-foreground">
            Settings specific to your {config.displayName.toLowerCase()} business.
          </p>
        </div>
        <Button
          size="sm"
          disabled={!dirty || saveMut.isPending}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? (
            <>
              <Spinner size={14} className="mr-1.5" /> Saving…
            </>
          ) : (
            <>
              <Icon name="CheckCircle2" size={14} className="mr-1.5" /> Save changes
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">{fields.map(renderField)}</div>
    </div>
  )
}

export default TypeSpecificManager
