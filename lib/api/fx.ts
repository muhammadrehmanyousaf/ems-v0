// 7.13 / A22 / UC-16 — the indicative figure a family abroad reads.
//
// ── Why every field here comes from the server ────────────────────────────
//
// The browser does NO arithmetic. Whether a figure may be shown at all is four
// separate rules — a seven-day staleness cut-off, a zero-rate refusal, the
// supported-currency list, and rounding UP against the customer's optimism —
// and all four live in `src/utils/fxDisplay.js`. Shipping a raw rate down here
// would mean re-implementing all four, and the day one of them changes on the
// server this page keeps quoting the old one.
//
// So this client asks what to display and renders the answer. `quote: null`
// means show rupees alone, which is always correct: THE VENUE IS PAID IN PKR.
import api from "@/lib/axiosConfig";

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export interface FxQuote {
  currency: string;
  symbol: string;
  /** Rounded UP to a whole unit, by the server. Never re-round it here. */
  approx: number;
  amountPkr: number;
  pkrPerUnit: number;
  /** The date the rate is from. Shown, because it is what makes this honest. */
  asOf: string;
  rateAgeDays: number;
  /** Never false. It is the whole contract of the module behind this. */
  indicative: true;
  note: string;
  caveat: string;
}

export interface FxQuoteResponse {
  /** Every currency the platform could support. */
  supported: string[];
  /**
   * The ones that would actually render right now — a rate is set AND fresh.
   * The selector is driven by this, so it can never offer a currency that then
   * shows nothing: that reads as a broken page rather than an absent courtesy.
   */
  available: string[];
  maxRateAgeDays: number;
  quote: FxQuote | null;
}

export interface FxRateRow {
  currency: string;
  pkrPerUnit: number | null;
  asOf: string | null;
  /** `false` WITH a rate present means it aged out and customers stopped seeing it. */
  showingToCustomers: boolean;
}

const BASE = "/api/v1/fx-rates";

export const fxApi = {
  /** Public. No token — the people this exists for are browsing before they sign up. */
  quote: (amountPkr: number, currency?: string | null): Promise<FxQuoteResponse> =>
    unwrap<FxQuoteResponse>(
      api.get(`${BASE}/quote`, {
        params: { amountPkr, ...(currency ? { currency } : {}) },
      }),
    ),

  /** Super-admin only. */
  list: (): Promise<{ rates: FxRateRow[]; maxRateAgeDays: number }> =>
    unwrap<{ rates: FxRateRow[]; maxRateAgeDays: number }>(api.get(BASE)),

  /** Super-admin only. `asOf` defaults to today; a future date is refused. */
  set: (currency: string, pkrPerUnit: number, asOf?: string): Promise<FxRateRow> =>
    unwrap<FxRateRow>(api.post(BASE, { currency, pkrPerUnit, ...(asOf ? { asOf } : {}) })),
};
