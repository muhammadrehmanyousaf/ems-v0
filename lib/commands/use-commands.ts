"use client"

import { useRouter } from "next/navigation"
import { useMemo } from "react"
import type { IconName } from "@/components/dashboard/shared/icon"

export interface AppCommand {
  id: string
  label: string
  /** Group heading in the palette. */
  group: string
  icon: IconName
  /** Extra match terms (synonyms). */
  keywords?: string
  run: () => void
}

/**
 * The command registry — the single source of truth for ⌘K. Nav commands follow
 * the 5-zone IA; create commands deep-link with a `?new=1` intent that screens
 * can read to auto-open their create dialog. Cross-entity search is layered on
 * later (needs a backend search endpoint).
 */
export function useCommands(): AppCommand[] {
  const router = useRouter()

  return useMemo(() => {
    const nav = (
      label: string,
      path: string,
      icon: IconName,
      group: string,
      keywords?: string,
    ): AppCommand => ({ id: `nav:${path}`, label, group, icon, keywords, run: () => router.push(path) })

    const create = (label: string, path: string, icon: IconName, keywords?: string): AppCommand => ({
      id: `create:${path}`,
      label,
      group: "Create",
      icon,
      keywords,
      run: () => router.push(path.includes("?") ? path : `${path}?new=1`),
    })

    return [
      // Create
      create("Add booking", "/dashboard/bookings", "Plus", "new event shoot"),
      create("Log a lead", "/dashboard/leads", "Plus", "new inquiry"),
      create("Record a payment", "/dashboard/payments", "Plus", "money"),
      create("Add expense", "/dashboard/expenses", "Plus", "cost"),

      // Today
      nav("Today", "/dashboard/today", "Home", "Today", "home start"),
      nav("Dashboard", "/dashboard", "LayoutGrid", "Today", "overview home"),

      // Operate
      nav("Bookings", "/dashboard/bookings", "Calendar", "Operate", "events shoots"),
      nav("Bookings — new design", "/dashboard/bookings-new", "Sparkles", "Operate", "redesigned preview"),
      nav("Leads", "/dashboard/leads", "Inbox", "Operate", "inquiries"),
      nav("Leads — new design", "/dashboard/leads-new", "Sparkles", "Operate", "redesigned preview"),
      nav("Customers — new design", "/dashboard/customers-new", "Sparkles", "Operate", "redesigned clients preview"),
      nav("Calendar", "/dashboard/calendar", "Calendar", "Operate", "schedule"),
      nav("Function sheets", "/dashboard/function-sheets", "FileText", "Operate", "BEO"),
      nav("Customers", "/dashboard/customers", "Users", "Operate", "clients"),
      nav("Inventory", "/dashboard/inventory", "Package", "Operate", "stock gear"),
      nav("Inventory — new design", "/dashboard/inventory-new", "Sparkles", "Operate", "redesigned stock preview"),
      nav("Expenses — new design", "/dashboard/expenses-new", "Sparkles", "Money", "redesigned costs preview"),
      nav("Receipts — new design", "/dashboard/receipts-new", "Sparkles", "Money", "redesigned receipts preview"),
      nav("Suppliers", "/dashboard/suppliers", "Building2", "Operate", "vendors"),
      nav("Staff", "/dashboard/staff", "Users", "Operate", "team shifts"),

      // Money
      nav("Payments", "/dashboard/payments", "Wallet", "Money", "khata"),
      nav("Receivables", "/dashboard/receivables", "Wallet", "Money", "owed AR"),
      nav("Receipts", "/dashboard/receipts", "FileText", "Money"),
      nav("Cheque ledger", "/dashboard/pdcs", "FileText", "Money", "PDC cheques"),
      nav("Expenses", "/dashboard/expenses", "Wallet", "Money", "costs"),
      nav("Brokers", "/dashboard/brokers", "Users", "Money", "commission"),
      nav("Tax", "/dashboard/tax", "FileText", "Money", "FBR"),

      // Grow
      nav("Insights", "/dashboard/insights", "BarChart3", "Grow", "analytics"),
      nav("Reviews", "/dashboard/reviews", "Star", "Grow", "ratings"),
      nav("Promote", "/dashboard/promote", "Megaphone", "Grow", "ads boost"),

      // Settings
      nav("Settings", "/dashboard/settings", "Settings", "Settings", "preferences"),
      nav("Design gallery", "/dashboard/design-gallery", "LayoutGrid", "Settings", "components theme"),
    ]
  }, [router])
}
