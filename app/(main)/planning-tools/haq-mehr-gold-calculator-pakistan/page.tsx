import type { Metadata } from "next";
import { HaqMehrCalculatorClient } from "./HaqMehrCalculatorClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Haq Mehr & Bridal Gold Calculator Pakistan [2026 Tola Rate] | Wedding Wala",
  description:
    "Calculate today's Mehr-e-Fatimi value in PKR, convert Nikkah Haq Mehr cash into Gold Tolas, and estimate bridal gold set cost with jeweler wastage & making!",
  alternates: {
    canonical: "/planning-tools/haq-mehr-gold-calculator-pakistan",
  },
  openGraph: {
    title: "Haq Mehr & Bridal Gold Calculator Pakistan [2026 Tola Rate]",
    description:
      "Instant Shariah Mehr-e-Fatimi calculator and bridal gold jewellery wastage estimator for Pakistani weddings.",
    url: `${SITE_URL}/planning-tools/haq-mehr-gold-calculator-pakistan`,
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
        name: "Haq Mehr & Bridal Gold Calculator Pakistan",
        url: `${SITE_URL}/planning-tools/haq-mehr-gold-calculator-pakistan`,
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
            name: "What is the value of Mehr-e-Fatimi in Pakistani Rupees in 2026?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Mehr-e-Fatimi is canonically equivalent to 500 silver Dirhams (approximately 131.25 Tolas or 1,530.9 grams of pure silver). At current 2026 Pakistan silver rates of approximately PKR 3,350 per Tola, Mehr-e-Fatimi equals approximately PKR 439,680.",
            },
          },
          {
            "@type": "Question",
            name: "How many grams are in 1 Tola of gold in Pakistan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "In the Pakistani bullion market and Sarafa Bazars, 1 Tola is standardized at exactly 11.664 grams, which equals 12 Mashas or 96 Rattis.",
            },
          },
          {
            "@type": "Question",
            name: "How do jewelers calculate gold wastage (Ratti/Pali) in Pakistan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Jewelers add a wastage surcharge (known as Kunda, Pali, or Ratti) ranging from 2 Rattis to 10 Rattis per Tola for filigree and handcrafted bridal jewellery. 96 Rattis equal 1 Tola, so an 8 Ratti wastage adds 8.33% to the raw gold bill before making charges.",
            },
          },
          {
            "@type": "Question",
            name: "What is the difference between Haq Mehr Muajjal and Ghair-Muajjal?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Mehr Muajjal (prompt dower) is legally payable immediately at the time of the Nikkah ceremony before rukhsati. Mehr Ghair-Muajjal (deferred dower) is payable upon a specified date, demand, or upon dissolution of marriage.",
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
      <HaqMehrCalculatorClient />
    </>
  );
}
