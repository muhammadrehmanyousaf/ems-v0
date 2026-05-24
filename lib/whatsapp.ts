// Reusable WhatsApp helpers — the free wa.me approach (decision D3). No backend,
// no WhatsApp Business API. One-click opens WhatsApp with a pre-filled message;
// the vendor taps send. Pakistani-number aware.

/** Normalize a Pakistani number to E.164 digits for wa.me. */
export function normalizePkPhone(raw: string | null | undefined): string {
  let d = (raw || "").replace(/[^\d]/g, "");
  if (!d) return "";
  if (d.startsWith("0092")) d = d.slice(2);           // 0092xxxxxxxxxx -> 92...
  else if (d.startsWith("92")) {/* already E.164-ish */}
  else if (d.startsWith("0")) d = "92" + d.slice(1);  // 03xxxxxxxxx -> 923xxxxxxxxx
  else if (d.length === 10 && d.startsWith("3")) d = "92" + d; // 3xxxxxxxxx -> 923...
  return d;
}

/** Build a wa.me deep link (opens WhatsApp with the chat + pre-filled text). */
export function waLink(phone: string | null | undefined, text: string): string {
  const num = normalizePkPhone(phone);
  const t = encodeURIComponent(text || "");
  return num ? `https://wa.me/${num}?text=${t}` : `https://wa.me/?text=${t}`;
}

export interface WaTemplate { key: string; label: string; body: string }

// Placeholders: {{name}} {{vendor}} {{amount}} {{date}} {{reviewLink}}
export const WA_TEMPLATES: WaTemplate[] = [
  {
    key: "confirm",
    label: "Booking confirmation",
    body:
      "Assalam o Alaikum {{name}},\nYour booking with {{vendor}} for {{date}} is confirmed. JazakAllah Khair! 🌟",
  },
  {
    key: "reminder",
    label: "Payment reminder",
    body:
      "Assalam o Alaikum {{name}},\nGentle reminder: a balance of Rs {{amount}} is due for your {{date}} event with {{vendor}}. Please clear at your convenience. Shukriya!",
  },
  {
    key: "eventday",
    label: "Event-day reminder",
    body:
      "Assalam o Alaikum {{name}},\nLooking forward to your event on {{date}}! The {{vendor}} team is all set. Koi bhi detail ho to zaroor bata dijiyega.",
  },
  {
    key: "thanks",
    label: "Thank you / review request",
    body:
      "Assalam o Alaikum {{name}},\nIt was an honour serving you! Agar aap khush thay, ek chhota sa review humare liye bohat maeyne rakhta hai. JazakAllah!",
  },
  { key: "blank", label: "Blank / custom", body: "" },
];

/** Replace {{placeholders}} with provided values (leaves unknown ones intact). */
export function fillTemplate(
  body: string,
  vars: Record<string, string | undefined>,
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
