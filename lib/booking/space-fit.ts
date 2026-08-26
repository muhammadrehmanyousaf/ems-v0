/**
 * 10.13 / 10.16 — what the space knows, said before the booking is made.
 *
 * ── Why this file exists ──────────────────────────────────────────────────
 *
 * `SubVenue.genderMode` (MIXED / MARDANA / ZENANA / SEGREGABLE) has been on
 * every space on the platform since the venue-hierarchy work, and nothing ever
 * compared it to what the customer wanted — because no screen asked the
 * customer what they wanted. A family booking a zenana function into a MIXED
 * hall found out when the guests arrived. For a lot of Pakistani households
 * that decides whether the women of the family attend at all.
 *
 * The server now accepts `requestedGenderMode` and returns the verdict on the
 * booking response. But the booking response arrives AFTER the booking is made,
 * and by then the useful moment has passed: the family needs to know while
 * they can still pick a different hall or ask for a partition.
 *
 * ── Why a mirror ──────────────────────────────────────────────────────────
 *
 * At the date step the booking does not exist yet, so there is no server
 * response to read the verdict from — it has to be derived client-side from the
 * space tree the page already fetched. This is a deliberate mirror of
 * `src/utils/spaceRequirements.js`, kept honest by
 * `scripts/space-fit-parity.mts`, which drives BOTH implementations over the
 * same inputs and fails on any divergence, wording included.
 *
 * The server remains the authority: it re-runs the same check at booking time
 * and its answer is what lands on the booking. This only moves the same
 * sentence earlier, to when it can still change a decision.
 */

/** Spaces the weather can reach. Mirrors the server's `OPEN_AIR_KINDS`. */
export const OPEN_AIR_KINDS = ["LAWN", "ROOFTOP"] as const

/** What a space can host. Mirrors `SubVenue.genderMode`. */
export const GENDER_MODES = ["MIXED", "MARDANA", "ZENANA", "SEGREGABLE"] as const

export type GenderMode = (typeof GENDER_MODES)[number]

export const GENDER_LABELS: Record<string, string> = {
  MIXED: "mixed",
  MARDANA: "men only (mardana)",
  ZENANA: "women only (zenana)",
  SEGREGABLE: "separate mardana and zenana sides",
}

/**
 * The same four values read in two grammatical slots, so they need two forms.
 *
 * One label set was doing both jobs and only fit one: "You've asked for a
 * SEGREGABLE function" rendered as "You've asked for a separate mardana and
 * zenana sides function" — shown to a family at the moment they are deciding
 * whether the women of the household can attend. Broken English there does not
 * read as a typo; it reads as a venue that did not understand the question.
 *
 * Mirrors REQUEST_LABELS / SPACE_LABELS in src/utils/spaceRequirements.js.
 */
export const REQUEST_LABELS: Record<string, string> = {
  MIXED: "a mixed function",
  MARDANA: "a men-only (mardana) function",
  ZENANA: "a women-only (zenana) function",
  SEGREGABLE: "separate mardana and zenana sides",
}

/** The predicate form: the space name followed by "is ___". */
export const SPACE_LABELS: Record<string, string> = {
  MIXED: "mixed",
  MARDANA: "men only (mardana)",
  ZENANA: "women only (zenana)",
  SEGREGABLE: "able to be partitioned",
}

/**
 * What the CUSTOMER is asked, which is not the same as what the column stores.
 *
 * The column's vocabulary is the venue's ("this hall is SEGREGABLE"). A family
 * does not describe their own function that way, so the question is phrased
 * from their side and mapped onto the same four values.
 */
export const ARRANGEMENT_CHOICES: Array<{ value: GenderMode; label: string; hint: string }> = [
  { value: "MIXED", label: "Everyone together", hint: "Men and women in the same hall" },
  { value: "SEGREGABLE", label: "Separate sides", hint: "One hall, partitioned mardana and zenana" },
  { value: "ZENANA", label: "Ladies only (zenana)", hint: "Women's function" },
  { value: "MARDANA", label: "Men only (mardana)", hint: "Men's function" },
]

const norm = (v: unknown): string | null =>
  v == null ? null : String(v).toUpperCase().trim() || null

export type SpaceLike = {
  id?: number
  name?: string | null
  kind?: string | null
  genderMode?: string | null
  backupSubVenueId?: number | null
} | null | undefined

export type GenderFit = {
  status: "fits" | "mismatch" | "unknown"
  reason: string | null
}

export type BackupPlan = {
  exposed: boolean
  hasPlan: boolean | null
  backupSubVenueId?: number | null
  message: string | null
}

/** Is this space exposed to the weather? */
export function isWeatherExposed(space: SpaceLike): boolean {
  const kind = norm(space?.kind)
  return kind ? (OPEN_AIR_KINDS as readonly string[]).includes(kind) : false
}

/**
 * Can this space host the function the customer asked for?
 *
 * Three states, not two. A customer who stated no requirement has not been
 * checked, and returning "fits" would be a claim nobody made.
 */
export function checkGenderFit(requested: unknown, space: SpaceLike): GenderFit {
  const want = norm(requested)
  const has = norm(space?.genderMode)

  // Nothing asked for — nothing to check. Never "fits".
  if (!want || !(GENDER_MODES as readonly string[]).includes(want)) {
    return { status: "unknown", reason: null }
  }
  if (!has || !(GENDER_MODES as readonly string[]).includes(has)) {
    return {
      status: "unknown",
      reason: "This space hasn't said whether it can be arranged mardana or zenana. Ask the venue.",
    }
  }

  if (want === has) return { status: "fits", reason: null }

  /**
   * A SEGREGABLE space can be partitioned, so it hosts anything. That is the
   * whole reason the value exists — a hall with a partition is the normal
   * Pakistani answer to "can you do a zenana side", and treating it as a
   * mismatch would refuse the venues most able to help.
   */
  if (has === "SEGREGABLE") return { status: "fits", reason: null }

  /**
   * A MIXED space is not a zenana space. The direction matters: a family asking
   * for zenana and being given mixed is the failure this exists for.
   */
  return {
    status: "mismatch",
    reason: `You've asked for ${REQUEST_LABELS[want]}, and ${space?.name || "this space"} is ${SPACE_LABELS[has]}. Ask the venue whether another space or a partition is possible.`,
  }
}

/**
 * The wet-weather plan for a space, or the absence of one.
 *
 * Stated as a QUESTION for the venue, not a warning about them: a venue with no
 * recorded backup usually has one anyway, and phrasing this as a defect would
 * penalise them for a field that did not exist until now.
 */
export function describeBackupPlan(space: SpaceLike, backup: SpaceLike): BackupPlan {
  if (!isWeatherExposed(space)) return { exposed: false, hasPlan: null, message: null }

  if (backup?.name) {
    return {
      exposed: true,
      hasPlan: true,
      backupSubVenueId: backup.id ?? null,
      message: `${space!.name} is open-air. If the weather turns, the venue moves your function to ${backup.name}.`,
    }
  }

  return {
    exposed: true,
    hasPlan: false,
    backupSubVenueId: null,
    message: `${space!.name} is open-air and no wet-weather plan is recorded. Ask the venue what happens if it rains.`,
  }
}
