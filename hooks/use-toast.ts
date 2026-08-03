"use client"

/**
 * Re-export ONLY. Do not paste the implementation back into this file.
 *
 * This module used to be a byte-for-byte duplicate of
 * components/ui/use-toast.ts. That implementation holds its queue in
 * module-level state (`memoryState`) with a module-level `listeners` array, so
 * two copies of the file meant two completely independent stores that could not
 * see each other.
 *
 * The only <Toaster /> mounted in app/layout.tsx imports `useToast` from
 * components/ui/use-toast, so it subscribed to THAT store — while 41 files
 * imported `toast` from here and dispatched into THIS one. Every one of those
 * calls landed in a queue that nothing rendered.
 *
 * The result was silent success AND silent failure across the product: the
 * signup error (BUG-004), "This email is already in use by another account" and
 * "Current password is incorrect" on /user/profile (BUG-041), rejected receipts
 * (BUG-015), and more. Confirmed on production — a change-password call returned
 * 400 while both toast containers stayed empty for a full 6 seconds under a
 * MutationObserver.
 *
 * Pointing this module at the same store fixes all 41 callers without touching
 * them. If toast behaviour needs to change, edit components/ui/use-toast.ts —
 * the single source of truth.
 */
export { useToast, toast } from "@/components/ui/use-toast"
