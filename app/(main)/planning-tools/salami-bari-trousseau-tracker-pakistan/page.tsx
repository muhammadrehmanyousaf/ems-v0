import type { Metadata } from "next";
import { SalamiBariTrackerClient } from "./SalamiBariTrackerClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Pakistani Shaadi Salami Tracker & Bridal Bari Checklist | Wedding Wala",
  description:
    "Digitize your family's Salami (Neundra) cash envelope register & plan Bridal Bari / Trousseau shopping (suits, shoes, gifts) without missing a single item!",
  alternates: {
    canonical: "/planning-tools/salami-bari-trousseau-tracker-pakistan",
  },
  openGraph: {
    title: "Pakistani Shaadi Salami Tracker & Bridal Bari Checklist",
    description:
      "Digital cash envelope ledger and complete Pakistani bridal bari packing checklist with WhatsApp sharing.",
    url: `${SITE_URL}/planning-tools/salami-bari-trousseau-tracker-pakistan`,
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
        name: "Pakistani Shaadi Salami Tracker & Bridal Bari Checklist",
        url: `${SITE_URL}/planning-tools/salami-bari-trousseau-tracker-pakistan`,
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
            name: "What is Salami or Neundra in Pakistani weddings?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Salami (or Neundra/Tambol in Punjab) is the traditional cash gift given by guests to the bride, groom, or their parents inside envelopes during the wedding reception. Families maintain careful written registers to return equal or higher cash gifts at future family weddings.",
            },
          },
          {
            "@type": "Question",
            name: "How much extra Salami should you return at the next family wedding?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "In Pakistani family tradition, returning the exact same cash amount after 2–5 years is considered poor etiquette due to inflation. Adding 20% to 30% on top of the previously received Salami amount is standard Pakistani custom.",
            },
          },
          {
            "@type": "Question",
            name: "What is included in a traditional Pakistani Bridal Bari?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A traditional Bari gifted by the groom's family includes 7 to 21 formal and semi-formal unstitched or designer suits, matching footwear, clutches, perfumes, makeup hampers, traditional jewelry sets, and token gift suits for the bride's close maternal and paternal relatives.",
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
      <SalamiBariTrackerClient />
    </>
  );
}
