"use client"

import * as React from "react"
import { Palette, Sun, Moon, Monitor, Check } from "lucide-react"
import { useTheme as useNextTheme } from "next-themes"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import {
  useThemePrefs,
  type ThemeName,
  type ThemeMode,
} from "@/lib/store/theme-prefs"

export interface ThemePickerProps {
  /** Compact icon-only trigger (topbar) vs labeled. Default: "icon". */
  variant?: "icon" | "labeled"
  className?: string
  /** Show the custom-accent field. Default: true. */
  enableCustomAccent?: boolean
  /** Show the light/dark/system toggle inside the popover. Default: true. */
  enableModeToggle?: boolean
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
}

/**
 * Each swatch shows two dots (primary + surface) so users see the palette at a
 * glance. Hexes are display-only previews (~ the light primary), not the source
 * of truth — the live preview row reflects the actually-applied tokens.
 */
const THEME_SWATCHES: {
  name: ThemeName
  label: string
  primary: string
  surface: string
}[] = [
  { name: "champagne", label: "Champagne", primary: "#B8862B", surface: "#FBF8F2" },
  { name: "indigo", label: "Indigo", primary: "#4B47E0", surface: "#FAFAFD" },
  { name: "violet", label: "Violet", primary: "#7C3AED", surface: "#FBFAFE" },
  { name: "emerald", label: "Emerald", primary: "#12865A", surface: "#F7FBF9" },
  { name: "slate", label: "Slate", primary: "#3B72C4", surface: "#FAFBFC" },
  { name: "rose", label: "Rose", primary: "#DB2D63", surface: "#FDF8F9" },
]

function swatchHexFor(theme: ThemeName): string {
  return THEME_SWATCHES.find((s) => s.name === theme)?.primary ?? "#4B47E0"
}

function ModeButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="capitalize">{label}</span>
    </button>
  )
}

function ThemeSwatch({
  name,
  label,
  primary,
  surface,
  selected,
}: {
  name: ThemeName
  label: string
  primary: string
  surface: string
  selected: boolean
}) {
  return (
    <Label
      htmlFor={`theme-${name}`}
      className={cn(
        "relative flex cursor-pointer flex-col items-center gap-1.5 rounded-md border p-2 transition-colors",
        selected ? "border-primary ring-1 ring-ring" : "border-input hover:bg-accent"
      )}
    >
      <RadioGroupItem id={`theme-${name}`} value={name} aria-label={label} className="sr-only" />
      <span
        className="flex h-7 w-full items-center justify-center gap-1 rounded"
        style={{ background: surface }}
      >
        <span className="h-3.5 w-3.5 rounded-full" style={{ background: primary }} />
        <span
          className="h-3.5 w-3.5 rounded-full border"
          style={{ background: surface, borderColor: primary }}
        />
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {selected && (
        <Check className="absolute right-1 top-1 h-3 w-3 text-primary" />
      )}
    </Label>
  )
}

export function ThemePicker({
  variant = "icon",
  className,
  enableCustomAccent = true,
  enableModeToggle = true,
  side = "bottom",
  align = "end",
}: ThemePickerProps) {
  const { theme, mode, customAccent, setTheme, setMode, setCustomAccent } =
    useThemePrefs()
  const { resolvedTheme } = useNextTheme()

  return (
    <Popover>
      <PopoverTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size="icon" aria-label="Theme settings" className={className}>
            <Palette className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className={className}>
            <Palette className="mr-2 h-4 w-4" />
            Theme
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-72 space-y-4 p-4">
        {enableModeToggle && (
          <section aria-label="Color mode" className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Mode
            </Label>
            <div className="grid grid-cols-3 gap-1.5">
              <ModeButton icon={Sun} label="light" active={mode === "light"} onClick={() => setMode("light")} />
              <ModeButton icon={Moon} label="dark" active={mode === "dark"} onClick={() => setMode("dark")} />
              <ModeButton icon={Monitor} label="system" active={mode === "system"} onClick={() => setMode("system")} />
            </div>
          </section>
        )}

        <section aria-label="Theme palette" className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Theme
          </Label>
          <RadioGroup
            value={theme}
            onValueChange={(v) => setTheme(v as ThemeName)}
            className="grid grid-cols-3 gap-2"
          >
            {THEME_SWATCHES.map((s) => (
              <ThemeSwatch key={s.name} {...s} selected={theme === s.name} />
            ))}
          </RadioGroup>
        </section>

        {enableCustomAccent && (
          <section aria-label="Custom accent" className="space-y-1.5">
            <Label htmlFor="accent-hex" className="text-xs uppercase tracking-wide text-muted-foreground">
              Custom accent
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick accent color"
                value={customAccent ?? swatchHexFor(theme)}
                onChange={(e) => setCustomAccent(e.target.value)}
                className="h-8 w-8 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0"
              />
              <Input
                id="accent-hex"
                value={customAccent ?? ""}
                placeholder="#5B5BFF"
                className="h-8"
                onChange={(e) => {
                  const v = e.target.value.trim()
                  if (!v) {
                    setCustomAccent(null)
                    return
                  }
                  if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
                    setCustomAccent(v.startsWith("#") ? v : "#" + v)
                  }
                }}
              />
              {customAccent && (
                <Button variant="ghost" size="sm" onClick={() => setCustomAccent(null)}>
                  Reset
                </Button>
              )}
            </div>
          </section>
        )}

        <section
          aria-label="Preview"
          className="space-y-2 rounded-md border border-border p-3"
        >
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">Primary</span>
            <span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">Secondary</span>
            <span className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">Accent</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-2 py-1">Muted</span>
            <span className="rounded border border-border px-2 py-1 ring-1 ring-ring">Ring</span>
            <span className="text-[10px] leading-5">
              {resolvedTheme === "dark" ? "Dark" : "Light"}
            </span>
          </div>
        </section>
      </PopoverContent>
    </Popover>
  )
}

export default ThemePicker
