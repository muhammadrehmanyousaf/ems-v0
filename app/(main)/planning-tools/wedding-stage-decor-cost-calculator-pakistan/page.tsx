import type { Metadata } from "next";
import { StageDecorCalculatorClient } from "./StageDecorCalculatorClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Wedding Stage & Nikkah Decor Cost Calculator Pakistan [2026] | Wedding Wala",
  description:
    "How much should you pay a decorator in 2026? Calculate exact prices for Nikkah floral partitions, Home Mayun setups & Baraat stages (Fresh vs Silk flowers)!",
  alternates: {
    canonical: "/planning-tools/wedding-stage-decor-cost-calculator-pakistan",
  },
  openGraph: {
    title: "Wedding Stage & Nikkah Decor Cost Calculator Pakistan [2026]",
    description:
      "Estimate stage decor, floral partition, and home Mayun decoration prices across Pakistani cities.",
    url: `${SITE_URL}/planning-tools/wedding-stage-decor-cost-calculator-pakistan`,
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
        name: "Wedding Stage & Nikkah Decor Cost Calculator Pakistan",
        url: `${SITE_URL}/planning-tools/wedding-stage-decor-cost-calculator-pakistan`,
        applicationCategory: "DesignApplication",
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
            name: "How much does a wedding stage cost in Pakistan in 2026?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A standard 24-30ft marquee stage with artificial silk flowers costs PKR 85,000 to PKR 150,000. Premium hybrid or 100% fresh flower stages with imported roses, hydrangeas, and custom lighting range from PKR 250,000 to PKR 650,000+.",
            },
          },
          {
            "@type": "Question",
            name: "What is the cost of a fresh floral Nikkah partition?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A freestanding floral partition wall for segregated Nikkahs using fresh Motia strings and white roses ranges from PKR 45,000 to PKR 120,000 depending on height, length, and floral density.",
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
      <StageDecorCalculatorClient />
    </>
  );
}
