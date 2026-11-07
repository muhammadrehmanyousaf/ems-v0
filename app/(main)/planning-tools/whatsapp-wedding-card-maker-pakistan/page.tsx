import type { Metadata } from "next";
import { WhatsappCardMakerClient } from "./WhatsappCardMakerClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Free Pakistani WhatsApp Wedding Card Maker [Urdu & English] | Wedding Wala",
  description:
    "Create stunning Nikkah, Mehndi, Baraat & Walima digital invitations in 60 seconds! Includes Bismillah calligraphy, Urdu/English templates & WhatsApp RSVP!",
  alternates: {
    canonical: "/planning-tools/whatsapp-wedding-card-maker-pakistan",
  },
  openGraph: {
    title: "Free Pakistani WhatsApp Wedding Card Maker [Urdu & English]",
    description:
      "Design personalized digital wedding invitation cards for Nikkah, Baraat & Walima with WhatsApp RSVP.",
    url: `${SITE_URL}/planning-tools/whatsapp-wedding-card-maker-pakistan`,
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
        name: "Pakistani WhatsApp Wedding Card Maker",
        url: `${SITE_URL}/planning-tools/whatsapp-wedding-card-maker-pakistan`,
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
            name: "How do I create a free digital wedding card for WhatsApp in Pakistan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Use WeddingWala's free card generator to choose your wedding theme (Nikkah, Baraat, or Walima), type the bride and groom names, event date, venue, and etiquette badges, and instantly generate a WhatsApp-ready invitation text and digital card.",
            },
          },
          {
            "@type": "Question",
            name: "What should be written on a Pakistani digital wedding invite?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A standard Pakistani digital wedding invite begins with Bismillah calligraphy, followed by parents' invitation wording, the couple's names, event function, date, time (noting One-Dish dinner timings), venue location map link, and RSVP contacts.",
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
      <WhatsappCardMakerClient />
    </>
  );
}
