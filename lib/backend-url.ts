// Backend URL — read from NEXT_PUBLIC_BACKEND_URL on Vercel, fall back to
// localhost for dev. Trailing slash MUST be present because callers
// concatenate as `${BACKEND_URL}api/v1/...`.
const raw = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/"
export const BACKEND_URL = raw.endsWith("/") ? raw : `${raw}/`
