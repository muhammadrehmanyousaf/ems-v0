import type { Metadata } from "next";
import { MarqueeHiddenCostClient } from "./MarqueeHiddenCostClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Marquee Per-Head & Hidden Cost Calculator Pakistan [2026] | Wedding Wala",
  description:
    "Quoted PKR 2,200/head? See your TRUE marquee bill after PRA/SRB tax, generator fuel, AC hours, stage decor & waiter tips. Don't sign before checking this!",
  alternates: {
    canonical: "/planning-tools/marquee-hidden-cost-calculator-pakistan",
  },
  openGraph: {
    title: "Marquee Per-Head & Hidden Cost Calculator Pakistan [2026]",
    description:
      "Find out your true Pakistani marriage hall bill after hidden generator, AC, tax, and waiter surcharges.",
    url: `${SITE_URL}/planning-tools/marquee-hidden-cost-calculator-pakistan`,
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Marquee Per-Head & Hidden Cost Calculator Pakistan",
        url: `${SITE_URL}/planning-tools/marquee-hidden-cost-calculator-pakistan`,
        applicationCategory: "FinanceApplication",
        operatingSystem: "All",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "PKR",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What are the common hidden charges in Pakistani marquees?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The most common unquoted charges include AC/Chiller hourly fees (PKR 25,000–45,000/hr), generator diesel fuel surcharges during power outages, mandatory in-house stage decor upgrades, sound/DJ electricity surcharges, provincial services tax (PRA/SRB), and venue waiter tip (bakhshish) demands.",
            },
          },
          {
            "@type": "Question",
            name: "What is the tax rate on marriage halls in Punjab and Sindh in 2026?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "In Punjab, the Punjab Revenue Authority (PRA) levies a services sales tax (typically 5% on active taxpayers or up to 16%). In Sindh, the Sindh Revenue Board (SRB) levies 13% services sales tax on banquet and marriage lawn bookings.",
            },
          },
          {
            "@type": "Question",
            name: "How much extra does a quoted PKR 2,000 per head rate actually cost?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "When factoring in 4 hours of AC chiller runtime, basic floral stage upgrades, generator fuel, taxes, and waiter tips, a quoted PKR 2,000 per-head rate typically translates into a true bill of PKR 2,650 to PKR 3,100 per head.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarqueeHiddenCostClient />
    </>
  );
}
