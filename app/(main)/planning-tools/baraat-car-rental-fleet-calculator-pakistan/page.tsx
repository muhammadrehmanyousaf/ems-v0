import type { Metadata } from "next";
import { BaraatFleetCalculatorClient } from "./BaraatFleetCalculatorClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Baraat Car Rental, Coaster & Fuel Calculator Pakistan [2026] | Wedding Wala",
  description:
    "Planning a local or out-of-city Baraat? Calculate how many cars & AC Coasters you need, plus 2026 groom luxury car rent, flower decor & fuel costs in PKR!",
  alternates: {
    canonical: "/planning-tools/baraat-car-rental-fleet-calculator-pakistan",
  },
  openGraph: {
    title: "Baraat Car Rental, Coaster & Fuel Calculator Pakistan [2026]",
    description:
      "Calculate 28-seater coaster fleets, groom luxury car rental, and motorway fuel costs for Pakistani Baraats.",
    url: `${SITE_URL}/planning-tools/baraat-car-rental-fleet-calculator-pakistan`,
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
        name: "Baraat Car Rental, Coaster & Fuel Calculator Pakistan",
        url: `${SITE_URL}/planning-tools/baraat-car-rental-fleet-calculator-pakistan`,
        applicationCategory: "TravelApplication",
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
            name: "How much does it cost to rent an AC Coaster for a Baraat in Pakistan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A 28-seater Toyota Coaster for a local 12-hour city Baraat costs PKR 18,000 to PKR 25,000. Out-of-city motorway trips typically range from PKR 35,000 to PKR 55,000 plus diesel and motorway tolls.",
            },
          },
          {
            "@type": "Question",
            name: "What are groom luxury car rental prices in Lahore, Karachi, and Islamabad?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "In 2026, renting an Audi A6 or Mercedes E-Class with a chauffeur costs PKR 25,000 to PKR 40,000 for 12 hours. A Toyota Land Cruiser V8 ZX ranges from PKR 45,000 to PKR 65,000, and Prado TXL costs PKR 28,000 to PKR 40,000.",
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
      <BaraatFleetCalculatorClient />
    </>
  );
}
