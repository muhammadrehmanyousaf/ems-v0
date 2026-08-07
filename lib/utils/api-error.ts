/**
 * WWL-425 — every module in the product writes the same fallback chain:
 *
 *     server message, then e.message, then the module's own wording
 *
 * The priority order is right and the middle term is a trap. `e.message` on a
 * failed axios call is axios's OWN English — "Network Error", "timeout of
 * 0ms exceeded", "Request failed with status code 500" — and it is always
 * populated, so the module's carefully written fallback is unreachable
 * whenever the server said nothing. Driven under injected failure, the promote
 * dialog toasted "Network Error" at a Pakistani venue owner.
 *
 * The server's own message is still preferred: it is written for this product
 * and often names the exact refusal. What changes is the middle term — axios's
 * internal strings are recognised and replaced with something a vendor can act
 * on, and anything unrecognised falls through to the caller's own wording
 * rather than to a stack-trace fragment.
 */

const AXIOS_NOISE = [
  /^network error$/i,
  /^request failed with status code/i,
  /^timeout of \d+ms exceeded$/i,
  /^timeout exceeded$/i,
  /^canceled$/i,
  /^ECONNABORTED$/i,
  /^Request aborted$/i,
];

type ApiErrorLike = {
  message?: string;
  code?: string;
  response?: { status?: number; data?: { message?: string } };
};

/**
 * The sentence to show a vendor when a request failed.
 *
 * @param error    whatever the catch block received
 * @param fallback the module's own wording, used when nothing better is known
 */
export function errorMessage(error: unknown, fallback: string): string {
  const e = (error ?? {}) as ApiErrorLike;

  // 1. The server said something. That is always the most specific answer.
  const fromServer = e.response?.data?.message;
  if (typeof fromServer === "string" && fromServer.trim()) return fromServer.trim();

  // 2. The request never reached a server. Say that, in the product's voice —
  //    it is a genuinely different situation from a refusal and the vendor's
  //    next action ("check your connection and try again") differs too.
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  const isNetwork =
    offline ||
    e.code === "ERR_NETWORK" ||
    (typeof e.message === "string" && /^network error$/i.test(e.message));
  if (isNetwork) {
    return "No connection — nothing was sent. Check your internet and try again.";
  }

  const isTimeout =
    e.code === "ECONNABORTED" ||
    (typeof e.message === "string" && /timeout/i.test(e.message));
  if (isTimeout) {
    return "The server took too long to answer. It may or may not have gone through — check before retrying.";
  }

  // 3. A status with no message of its own.
  const status = e.response?.status;
  if (status === 401) return "Your session has expired. Sign in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "That record no longer exists.";
  if (status === 409) return "That conflicts with something that already exists.";
  if (status === 429) return "Too many requests just now — wait a moment and try again.";
  if (typeof status === "number" && status >= 500) {
    return "Something went wrong on our side. Nothing was saved — please try again.";
  }

  // 4. A message that is genuinely the app's, not axios's plumbing.
  if (typeof e.message === "string" && e.message.trim()) {
    const raw = e.message.trim();
    if (!AXIOS_NOISE.some((re) => re.test(raw))) return raw;
  }

  return fallback;
}

export default errorMessage;
