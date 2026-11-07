import type { Metadata } from "next";
import { OneDishCheckerClient } from "./OneDishCheckerClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Punjab & Sindh One-Dish Law & Wedding Menu Checker [2026 Rules] | Wedding Wala",
  description:
    "Check if your wedding menu complies with Punjab Marriage Functions Act & Sindh 10 PM curfew regulations. Avoid Rs 50,000–2,000,000 fines and venue sealing.",
  alternates: {
    canonical: "/planning-tools/one-dish-menu-checker-pakistan",
  },
  openGraph: {
    title: "Punjab & Sindh One-Dish Law & Wedding Menu Checker [2026 Rules]",
    description:
      "Verify your wedding menu against official Pakistani marriage laws (1 main salan, 1 rice, 1 sweet). 100% legal compliance checker.",
    url: `${SITE_URL}/planning-tools/one-dish-menu-checker-pakistan`,
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
        name: "Pakistan One-Dish Wedding Menu Checker",
        url: `${SITE_URL}/planning-tools/one-dish-menu-checker-pakistan`,
        applicationCategory: "UtilityApplication",
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
            name: "What is the One-Dish rule in Pakistan for wedding functions?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Under the Punjab Marriage Functions Act 2016 and ICT / Sindh regulations, One-Dish allows: 1 main meat dish (Salan), 1 rice dish (Biryani/Pulao), 1 sweet dish (Kheer/Halwa/Zarda), along with standard roti/naan, raita, salad, and hot/cold beverages.",
            },
          },
          {
            "@type": "Question",
            name: "What are the penalties for violating the One-Dish rule in Pakistan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Section 8 of the Act imposes fines between PKR 50,000 and PKR 2,000,000, potential venue sealing, and up to one month imprisonment for both hosts and marquee owners who breach the dish restrictions or violate the 10:00 PM curfew.",
            },
          },
          {
            "@type": "Question",
            name: "Are live BBQ and salad bars allowed under the One-Dish rule?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "In Punjab and ICT, supplementary live counters (like live BBQ seekh kababs or sajji) in addition to a chicken/mutton salan are treated as a second salan and constitute a violation. In Sindh, enforcement focuses primarily on the 10 PM curfew.",
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
      <OneDishCheckerClient />
    </>
  );
}
