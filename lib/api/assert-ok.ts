/**
 * F1 / WWL-142, 159, 312, 333, 351, 370, 416, 435, 473, 492, 503, 556, 591,
 * 605, 606 — "the write failed and the product said it worked".
 *
 * The shape of the bug, repeated across 41 findings:
 *
 *     await SomeAPI.create(payload);        // resolves on ANY 2xx
 *     toast.success("Saved");               // fires unconditionally
 *
 * Three things make that a lie rather than a race:
 *
 *  1. The backend answers `{ status: false, message }` with an HTTP 200 in a
 *     number of handlers, so axios resolves and the caller toasts success over
 *     an explicit server-side refusal.
 *  2. Until WWL-107 was fixed, EVERY unmatched path answered 200 with a banner,
 *     so a renamed route toasted success and wrote nothing.
 *  3. A handler that returns `data: null` where the caller expects a row means
 *     the UI then renders undefined fields under a success toast.
 *
 * `assertOk` closes all three. Pass it the axios response; it throws unless the
 * envelope actually says the write happened, and returns the payload so the call
 * site reads naturally:
 *
 *     const row = assertOk(await axiosInstance.post("/api/v1/things", body));
 *     toast.success("Saved");   // now only reachable on a real success
 *
 * Use `assertOkVoid` for writes with no payload (DELETE, transitions).
 */

export interface ApiEnvelope<T = unknown> {
  status?: boolean;
  message?: string;
  data?: T;
}

interface AxiosLikeResponse<T = unknown> {
  status?: number;
  data?: ApiEnvelope<T> | unknown;
}

/** Thrown when a 2xx response does not actually confirm the write. */
export class ApiWriteError extends Error {
  readonly httpStatus?: number;

  constructor(message: string, httpStatus?: number) {
    super(message);
    this.name = "ApiWriteError";
    this.httpStatus = httpStatus;
  }
}

const BANNER = "Event Planner API is running";

function envelopeOf<T>(res: AxiosLikeResponse<T>): ApiEnvelope<T> {
  const body = res?.data;
  return (body && typeof body === "object" ? body : {}) as ApiEnvelope<T>;
}

/**
 * Throw unless the response confirms the write; otherwise return `data`.
 *
 * @param res      the axios response
 * @param fallback message to use when the server didn't supply one
 */
export function assertOk<T = unknown>(
  res: AxiosLikeResponse<T>,
  fallback = "That didn't save. Please try again.",
): T {
  const env = envelopeOf<T>(res);

  // The pre-WWL-107 catch-all, and any proxy/CDN page that answers 200 with
  // something that isn't our envelope at all.
  if (env.message === BANNER) {
    throw new ApiWriteError(
      "The server didn't recognise that request, so nothing was saved.",
      res?.status,
    );
  }

  // An explicit refusal carried on a 200.
  if (env.status === false) {
    throw new ApiWriteError(env.message || fallback, res?.status);
  }

  // Neither `status` nor `data` present — not our envelope. Refuse to call it a
  // success rather than toast over an unknown response.
  if (env.status === undefined && env.data === undefined) {
    throw new ApiWriteError(fallback, res?.status);
  }

  return env.data as T;
}

/** Same guarantee for writes that return nothing meaningful. */
export function assertOkVoid(
  res: AxiosLikeResponse,
  fallback = "That didn't save. Please try again.",
): void {
  const env = envelopeOf(res);

  if (env.message === BANNER) {
    throw new ApiWriteError(
      "The server didn't recognise that request, so nothing was saved.",
      res?.status,
    );
  }
  if (env.status === false) {
    throw new ApiWriteError(env.message || fallback, res?.status);
  }
}

/**
 * The message to show a user for any thrown error, preferring the server's own
 * words over axios's English ("Request failed with status code 500"), which
 * WWL-425 and WWL-499 both caught leaking into toasts.
 */
export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (e instanceof ApiWriteError) return e.message;
  const anyErr = e as { response?: { data?: { message?: string } }; message?: string };
  const fromServer = anyErr?.response?.data?.message;
  if (typeof fromServer === "string" && fromServer.trim()) return fromServer;
  // Never surface axios's own string, or a raw Postgres/JS error, to a vendor.
  return fallback;
}
