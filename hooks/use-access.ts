"use client"

/**
 * useAccess(): the single reader of the access store. Every gate, banner, chip and the Wall go through this, so there is
 * exactly one answer to "is this viewer locked, and why".
 *
 * `known` is false until the server has spoken (status or a 402). Unknown is treated as OPEN everywhere: a failed lookup
 * never locks a vendor out (the server's own 402 does that when it is real).
 */

import { useAccessStore } from "@/lib/plans/access-store"
import { isLockedState, type Access } from "@/lib/plans/access"

export interface AccessView {
  known: boolean
  access: Access | null
  locked: boolean
  staff: boolean
  trialing: boolean
  pastDue: boolean
  cancelling: boolean
}

export function useAccess(): AccessView {
  const access = useAccessStore((s) => s.access)
  const state = access?.state
  return {
    known: access !== null,
    access,
    locked: isLockedState(state),
    staff: access?.staff === true,
    trialing: state === "trialing",
    pastDue: state === "past_due",
    cancelling: state === "cancelling",
  }
}
