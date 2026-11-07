import type { Metadata } from "next";
import { OverseasWeddingClient } from "./OverseasWeddingClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Overseas Pakistani Wedding Cost Calculator (£ GBP / $ USD) | Wedding Wala",
  description:
    "Living in the UK, USA, UAE, Canada or Saudi Arabia & planning a wedding in Pakistan? Calculate exact 2026 venue, decor & photography costs in GBP, USD & AED!",
  alternates: {
    canonical: "/planning-tools/overseas-pakistani-wedding-planner-calculator",
  },
  openGraph: {
    title: "Overseas Pakistani Wedding Cost Calculator (£ GBP / $ USD)",
    description:
      "Plan your Pakistani wedding from abroad with live currency conversions and a 14-day arrival sprint schedule.",
    url: `${SITE_URL}/planning-tools/overseas-pakistani-wedding-planner-calculator`,
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
        name: "Overseas Pakistani Wedding Cost Calculator",
        url: `${SITE_URL}/planning-tools/overseas-pakistani-wedding-planner-calculator`,
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
            name: "How much does a 3-day Pakistani wedding cost in British Pounds (£ GBP)?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A 300-guest 3-day wedding in Lahore, Islamabad, or Mirpur (AJK) typically costs between £12,000 and £22,000 GBP (PKR 4.2 Million to 7.8 Million) covering luxury marquees, one-dish catering, high-end cinematography, and designer outfits.",
            },
          },
          {
            "@type": "Question",
            name: "How far in advance should overseas Pakistanis book wedding vendors?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "During peak 'Decemberistan' (November to February), overseas couples should lock their marquee dates, photographers, and master tailors 6 to 9 months ahead via WhatsApp video consultations.",
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
      <OverseasWeddingClient />
    </>
  );
}
