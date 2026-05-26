/**
 * Share a planning tool — used by the budget / checklist / guest-list /
 * timeline pages. Tries the native Web Share sheet (mobile), falls back to
 * copying the page link to the clipboard. The planning tools are
 * localStorage-backed, so this shares the tool link (not the private data).
 *
 * Returns 'shared' (native sheet used or user cancelled it), 'copied'
 * (clipboard fallback), or 'failed' so the caller can toast appropriately.
 */
export async function shareCurrentTool(opts: {
  title: string;
  text: string;
}): Promise<'shared' | 'copied' | 'failed'> {
  const url = typeof window !== 'undefined' ? window.location.href : '';

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: opts.title, text: opts.text, url });
      return 'shared';
    } catch (e) {
      // User dismissed the native sheet — treat as a no-op, don't also copy.
      if ((e as { name?: string })?.name === 'AbortError') return 'shared';
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(`${opts.text} — ${url}`.trim());
      return 'copied';
    } catch {
      /* fall through */
    }
  }

  return 'failed';
}
