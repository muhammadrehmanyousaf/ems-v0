import Link from "next/link"
import type { Metadata } from "next"
import {
  buildPageMetadata,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
} from "@/lib/seo"

/**
 * Urdu landing scaffold.
 *
 * Currently a single landing page acknowledging that full Urdu translations
 * are coming. The point of shipping this now is the routing + metadata
 * scaffold:
 *   - `/ur` returns 200 with proper `lang="ur"` + `dir="rtl"` (handled by
 *     the Page-level <html> tag is already set on root; for now we set
 *     `lang="ur"` on a wrapping div + `dir="rtl"` on the content)
 *   - hreflang `en-PK` + `ur-PK` + `x-default` annotations point both ways
 *   - The URL shape `/ur/...` matches docs/seo/03-url-conventions-LOCKED.md §L7
 *
 * When the editorial team is ready to ship Urdu translations, this page
 * grows from a landing card to a proper homepage; the routing is already
 * there.
 *
 * Reference:
 *   - docs/seo/00-master-seo-playbook.md §14 international + multilingual
 *   - docs/seo/03-url-conventions-LOCKED.md §L7 internationalisation
 */

export const metadata: Metadata = buildPageMetadata({
  fullTitle: `ویڈنگ والا — ${SITE_NAME}`,
  description:
    "پاکستان کا شادی پلیٹ فارم — جلد ہی اردو میں مکمل دستیاب ہو گا۔ The Wedding Wala marketplace coming soon in full Urdu translation.",
  path: "/ur",
  locale: "ur-PK",
  alternateLocalePaths: {
    "en-PK": "/",
    "ur-PK": "/ur",
  },
})

export default function UrduLandingPage() {
  return (
    <div lang="ur" dir="rtl" className="min-h-screen bg-gradient-to-br from-bridal-cream via-white to-bridal-cream/30 px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
          اردو
        </p>
        <h1 className="font-display italic text-[40px] sm:text-[52px] leading-tight text-bridal-charcoal" style={{ fontFamily: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" }}>
          ویڈنگ والا
        </h1>
        <p className="mt-4 font-bridal text-[16px] text-bridal-text leading-relaxed" style={{ direction: "rtl" }}>
          پاکستان کا شادی منصوبہ بندی پلیٹ فارم۔ کراچی، لاہور، اسلام آباد اور
          پاکستان بھر میں تصدیق شدہ شادی وینڈرز۔
        </p>
        <p className="mt-3 font-bridal text-[14px] text-bridal-text-soft leading-relaxed" style={{ direction: "rtl" }}>
          مکمل اردو ترجمہ جلد دستیاب ہو گا۔ فی الحال، براہ کرم انگریزی ورژن
          استعمال کریں۔
        </p>

        {/* Bilingual help line */}
        <div className="mt-8 inline-block rounded-md border border-bridal-beige bg-white px-5 py-4" style={{ direction: "ltr" }}>
          <p className="font-bridal text-[12px] uppercase tracking-[0.22em] text-bridal-gold mb-2">
            English
          </p>
          <p className="font-bridal text-[14px] text-bridal-text leading-relaxed">
            Urdu translation is on the way. For now, please use the English
            site — every page will be translated by the {SITE_NAME} editorial
            team starting with the highest-traffic surfaces (homepage,
            booking flow, top vendor categories).
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3" style={{ direction: "ltr" }}>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 h-11 rounded-full bg-bridal-gold text-white font-bridal text-[13px] font-medium hover:bg-bridal-gold-dark transition-colors"
          >
            Continue in English →
          </Link>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center justify-center px-5 h-11 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-charcoal transition-colors"
          >
            {SUPPORT_EMAIL}
          </a>
          <a
            href={SUPPORT_PHONE_TEL}
            className="inline-flex items-center justify-center px-5 h-11 font-bridal text-[13px] text-bridal-text-soft hover:text-bridal-charcoal transition-colors"
          >
            {SUPPORT_PHONE_DISPLAY}
          </a>
        </div>

        <p className="mt-12 font-bridal text-[11px] text-bridal-text-soft" style={{ direction: "ltr" }}>
          <Link href="/" className="hover:text-bridal-gold">{SITE_URL}</Link>
        </p>
      </div>
    </div>
  )
}
