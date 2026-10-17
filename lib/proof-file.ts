/**
 * WP33 / CUSTOMER-008 - check a payment screenshot BEFORE it is uploaded: at most 8 MB, an image or a PDF. The server enforces the
 * same limits (413 FILE_TOO_LARGE / 415 UNSUPPORTED_FILE); this only says so next to the field instead of after a failed upload.
 */
export const PROOF_MAX_BYTES = 8 * 1024 * 1024

export function proofFileIssue(file: { size: number; type: string; name?: string } | null | undefined): string | null {
  if (!file) return null
  if (file.size > PROOF_MAX_BYTES) return "That file is too large (8 MB max). Send a screenshot or a smaller PDF."
  const t = String(file.type || "").toLowerCase()
  if (!(t.startsWith("image/") || t === "application/pdf")) return "Send a screenshot (image) or a PDF receipt."
  return null
}
