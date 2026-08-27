/**
 * The one list of bookable event types.
 *
 * It used to be written out three times — the booking step's fallback, the
 * venue registration "Expertise" picker, and vendor-type-config — with
 * different contents in each ("Parties", "Fashion Show", "Dinner" on one side,
 * nothing Pakistani on any of them). A vendor could not advertise a Mehndi and
 * a couple could not book one.
 *
 * The labels match `EVENT_TYPES` in ems-v0-backend/src/utils/eventTypes.js on
 * purpose. `closureGuard` reads the booking's eventType to decide whether the
 * Punjab Marriage Functions Act reaches it (10pm close, one-dish rule), and an
 * event type it does not recognise is treated as a MARRIAGE function. So a
 * label that drifts from the backend's doesn't just look untidy — it silently
 * applies a wedding law to a corporate dinner or an Aqiqa and refuses a booking
 * the venue is entitled to take. Keep the two lists in step.
 */
export const EVENT_OPTIONS: string[] = [
  // Marriage functions — the Act reaches these.
  "Mehndi",
  "Baraat",
  "Walima",
  "Nikah",
  "Mayoun",
  "Dholki",
  "Reception",
  "Engagement",
  // Everything else a banquet hall actually does.
  "Birthday",
  "Corporate",
  "Aqiqa",
  "Graduation",
  "Milaad",
  "Soyem",
  "Other",
];

/** Same list in the `{ value, label }` shape the vendor pickers take. */
export const EVENT_OPTIONS_SELECT = EVENT_OPTIONS.map((value) => ({
  value,
  label: value,
}));
