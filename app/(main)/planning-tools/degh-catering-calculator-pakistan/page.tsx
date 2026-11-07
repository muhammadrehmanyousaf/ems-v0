import type { Metadata } from "next";
import { DeghCalculatorClient } from "./DeghCalculatorClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Shaadi Degh & Catering Calculator Pakistan [2026 Food Math] | Wedding Wala",
  description:
    "How many deghs & kg of mutton/chicken do you need for 100–1000 wedding guests? Calculate exact Biryani, Qorma, Naan & sweet dish quantities + PKR costs free!",
  alternates: {
    canonical: "/planning-tools/degh-catering-calculator-pakistan",
  },
  openGraph: {
    title: "Shaadi Degh & Catering Calculator Pakistan [2026 Food Math]",
    description:
      "Calculate exact Biryani, Mutton, Chicken, Naan & Degh quantities for your Pakistani wedding or home dholki in 1 click!",
    url: `${SITE_URL}/planning-tools/degh-catering-calculator-pakistan`,
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
        name: "Shaadi Degh & Catering Calculator Pakistan",
        url: `${SITE_URL}/planning-tools/degh-catering-calculator-pakistan`,
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
            name: "How many guests does 1 standard wedding degh serve in Pakistan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A standard 12kg meat and 12kg rice Biryani degh comfortably serves 85 to 90 guests if served as the main dish, or up to 100–110 guests if paired with chicken qorma, naan, and a sweet dish.",
            },
          },
          {
            "@type": "Question",
            name: "How much mutton is needed for 300 wedding guests?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "For 300 wedding guests in Pakistan, caterers typically calculate 23 kg of raw mutton per 100 guests, which equals approximately 69 kg to 72 kg of raw mutton for a standard one-dish mutton qorma or kunna.",
            },
          },
          {
            "@type": "Question",
            name: "What is the average cost of a wedding degh in 2026?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "In 2026, a standard chicken biryani degh costs between PKR 32,000 and PKR 42,000 including ghee, spices, and pakwan center labour. A premium mutton degh ranges from PKR 68,000 to PKR 85,000 depending on daily meat mandi rates.",
            },
          },
          {
            "@type": "Question",
            name: "How many naans should be ordered per guest?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The Pakistani catering golden rule is 1.75 naans or taftans per guest. For 200 guests, order 350 naans to account for family refills and catering staff.",
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
      <DeghCalculatorClient />
    </>
  );
}
