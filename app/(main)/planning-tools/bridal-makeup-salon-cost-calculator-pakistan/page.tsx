import type { Metadata } from "next";
import { MakeupSalonCalculatorClient } from "./MakeupSalonCalculatorClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Bridal & Party Makeup Cost Calculator Pakistan [2026 Rates] | Wedding Wala",
  description:
    "Calculate your total salon bill for Bride + Mother + Sisters across Nikkah, Mehndi, Baraat & Walima! Compare Top Designer Salons vs Home-Service Freelancers!",
  alternates: {
    canonical: "/planning-tools/bridal-makeup-salon-cost-calculator-pakistan",
  },
  openGraph: {
    title: "Bridal & Party Makeup Cost Calculator Pakistan [2026 Rates]",
    description:
      "Estimate complete bridal look packages, family party makeups, and Dholki henna artist staffing across Pakistan.",
    url: `${SITE_URL}/planning-tools/bridal-makeup-salon-cost-calculator-pakistan`,
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
        name: "Bridal & Party Makeup Cost Calculator Pakistan",
        url: `${SITE_URL}/planning-tools/bridal-makeup-salon-cost-calculator-pakistan`,
        applicationCategory: "LifestyleApplication",
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
            name: "How much does bridal makeup cost in Pakistan in 2026?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A signature Baraat or Walima bridal look at top celebrity salons ranges from PKR 95,000 to PKR 180,000. Established senior studio artists charge between PKR 45,000 and PKR 75,000, while verified home-service bridal freelancers range from PKR 25,000 to PKR 40,000 per look.",
            },
          },
          {
            "@type": "Question",
            name: "How many Mehndi artists should be hired for a Dholki night?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The professional staffing rule in Pakistan is 1 henna artist per 20–22 female guests for a 3-hour function. For 80 female guests, you should hire 4 mehndi artists to ensure all cousins and aunts receive designs without endless queues.",
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
      <MakeupSalonCalculatorClient />
    </>
  );
}
