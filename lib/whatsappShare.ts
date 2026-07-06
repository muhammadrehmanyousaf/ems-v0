// Phase-2 EPIC 8 · 8.4 — shared "share a card as an image to WhatsApp" helper.
//
// The WhatsApp-able design rule (doc 01 §2): every card — report cards, per-event
// P&L, BEO, customer statement — must export to a clean shareable image + Urdu
// caption in ≤1 tap. This renders a card spec to a PNG via the NATIVE Canvas API
// (zero dependency), then hands it to the Web Share API (mobile, where the PK owner
// lives) with a wa.me + download fallback on desktop.
//
// The caption builder (buildShareCaption) is pure and side-effect-free so it can be
// reused for the text-only wa.me path and reasoned about without a DOM.

import { waLink } from "./whatsapp";

export type ShareTone = "good" | "warn" | "neutral";
export interface ShareRow {
  label: string;
  value: string;
  tone?: ShareTone;
}
export interface CardShareSpec {
  title: string;
  subtitle?: string;
  rows: ShareRow[];
  footer?: string;
  brand?: string; // defaults to "Wedding Wala"
}

const BRAND = "Wedding Wala";

/** Pure: assemble the WhatsApp text caption from a card spec. Node-reasonable,
 *  no DOM. Used both as the share caption and as the text-only wa.me fallback. */
export function buildShareCaption(spec: CardShareSpec): string {
  const lines: string[] = [];
  lines.push(`*${spec.title}*`);
  if (spec.subtitle) lines.push(spec.subtitle);
  if (spec.rows.length) lines.push("");
  for (const r of spec.rows) lines.push(`${r.label}: ${r.value}`);
  if (spec.footer) {
    lines.push("");
    lines.push(spec.footer);
  }
  lines.push(`— ${spec.brand || BRAND}`);
  return lines.join("\n");
}

// ── Canvas rendering (browser only) ────────────────────────────────────────
const TONE_COLOR: Record<ShareTone, string> = {
  good: "#047857", // emerald-700
  warn: "#b45309", // amber-700
  neutral: "#111827", // gray-900
};

/** Render the card spec to a PNG Blob using the native 2D canvas. Returns null
 *  if we're not in a browser (SSR) or canvas is unavailable. */
export async function renderCardToBlob(spec: CardShareSpec): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const dpr = Math.min(3, Math.max(1, (typeof window !== "undefined" && window.devicePixelRatio) || 1));

  const W = 1080; // 1:~1 card, WhatsApp-friendly
  const padX = 72;
  const titleH = spec.subtitle ? 190 : 150;
  const rowH = 92;
  const footerH = spec.footer ? 120 : 40;
  const H = titleH + spec.rows.length * rowH + footerH + 64;

  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);

  // Background + subtle top accent bar.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0f7d5b"; // brand green
  ctx.fillRect(0, 0, W, 12);

  // Title.
  ctx.fillStyle = "#0b3d2c";
  ctx.font = "700 56px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(spec.title, padX, 56);
  if (spec.subtitle) {
    ctx.fillStyle = "#6b7280";
    ctx.font = "400 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(spec.subtitle, padX, 128);
  }

  // Rows: label left, value right (tone-coloured).
  let y = titleH;
  for (const r of spec.rows) {
    ctx.fillStyle = "#6b7280";
    ctx.font = "400 38px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(r.label, padX, y + 18);

    ctx.fillStyle = TONE_COLOR[r.tone || "neutral"];
    ctx.font = "700 42px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(r.value, W - padX, y + 14);
    ctx.textAlign = "left";

    // hairline separator
    ctx.strokeStyle = "#eef2f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, y + rowH - 6);
    ctx.lineTo(W - padX, y + rowH - 6);
    ctx.stroke();
    y += rowH;
  }

  // Footer + brand.
  if (spec.footer) {
    ctx.fillStyle = "#6b7280";
    ctx.font = "400 32px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(spec.footer, padX, y + 18);
    y += 56;
  }
  ctx.fillStyle = "#0f7d5b";
  ctx.font = "700 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText(spec.brand || BRAND, padX, y + 20);

  return await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png", 0.95),
  );
}

/**
 * Share a card: render → try the Web Share API with the image file (mobile);
 * fall back to downloading the PNG + opening wa.me with the caption (desktop /
 * unsupported). Returns how it was shared so the caller can toast appropriately.
 */
export async function shareCard(
  spec: CardShareSpec,
  opts: { phone?: string | null; caption?: string } = {},
): Promise<"shared" | "fallback"> {
  const caption = opts.caption ?? buildShareCaption(spec);
  const blob = await renderCardToBlob(spec);

  // Preferred path: native share sheet with the image (WhatsApp appears there).
  if (blob && typeof navigator !== "undefined" && "share" in navigator) {
    try {
      const file = new File([blob], `${slug(spec.title)}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
      if (!nav.canShare || nav.canShare({ files: [file] })) {
        await nav.share!({ files: [file], text: caption, title: spec.title });
        return "shared";
      }
    } catch {
      // user cancelled or unsupported → fall through to the deep-link path
    }
  }

  // Fallback: drop the image as a download (so it can be attached) + open wa.me.
  if (blob && typeof document !== "undefined") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(spec.title)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  if (typeof window !== "undefined") {
    window.open(waLink(opts.phone, caption), "_blank", "noopener,noreferrer");
  }
  return "fallback";
}

function slug(s: string): string {
  return (s || "card").toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "card";
}
