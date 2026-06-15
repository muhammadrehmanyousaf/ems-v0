/**
 * PURE DATA — event-by-event notes (blueprint block B8). The multi-function
 * Pakistani-wedding reality (mehndi · barat · walima · mayun · nikkah) that
 * generic AI-spun competitor pages ignore. Each note says what changes for
 * that function, per vendor type.
 *
 * Only "event-eligible" types carry notes (photography, venue, catering,
 * decor, makeup, mehndi). ZERO runtime deps. The getter returns [] for any
 * type without notes, so the section is omitted gracefully.
 *
 * Slugs MUST match VENDOR_TYPES in ./constants.ts. Authored so far:
 *   wedding-photographers (flagship). Remaining types added at rollout.
 */

export interface EventNote {
  event: string;
  note: string;
}

export const VENDOR_TYPE_EVENT_NOTES: Record<string, EventNote[]> = {
  "wedding-photographers": [
    {
      event: "Mehndi",
      note: "Vibrant, candid and low-light — string lights, dholki energy and yellow palettes. Ask for fast prime lenses and disciplined flash so colours pop without washing out faces.",
    },
    {
      event: "Barat",
      note: "The bride's entrance and rukhsati — the emotional peak of the shaadi. Confirm two shooters so neither the stage nor the family farewell moments are missed.",
    },
    {
      event: "Walima",
      note: "Formal and posed under hotel-ballroom lighting — couple portraits and family group shots. Agree a shot-list so every relative combination is covered.",
    },
    {
      event: "Mayun & Dholki",
      note: "Intimate at-home functions — ubtan, close family, warm tones. A documentary, fly-on-the-wall style captures these best.",
    },
    {
      event: "Nikkah",
      note: "Quieter and ceremonial — the signing, the prayers, the first look. Ask for discreet coverage and a silent shutter where the maulvi requests it.",
    },
  ],
};

/** SAFE getter — never throws; returns [] for unknown/unauthored slugs. */
export function getVendorTypeEventNotes(slug: string): EventNote[] {
  return VENDOR_TYPE_EVENT_NOTES[slug] ?? [];
}
