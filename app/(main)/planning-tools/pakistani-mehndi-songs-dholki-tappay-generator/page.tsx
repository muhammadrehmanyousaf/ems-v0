import type { Metadata } from "next";
import { MehndiSongsClient } from "./MehndiSongsClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Pakistani Mehndi Songs, Bridal Entry & Dholki Tappay [2026] | Wedding Wala",
  description:
    "Generate the ultimate 2026 Mehndi dance playlist, emotional Bridal Entry tracks, Groom Dhol mixes & printable Punjabi/Urdu Dholki Tappay lyrics in 1 click!",
  alternates: {
    canonical: "/planning-tools/pakistani-mehndi-songs-dholki-tappay-generator",
  },
  openGraph: {
    title: "Pakistani Mehndi Songs, Bridal Entry & Dholki Tappay [2026]",
    description:
      "2026 curated Pakistani wedding songs, bridal entry tracks, and personalized Dholki Tappay lyrics generator.",
    url: `${SITE_URL}/planning-tools/pakistani-mehndi-songs-dholki-tappay-generator`,
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
        name: "Pakistani Mehndi Songs & Dholki Tappay Generator",
        url: `${SITE_URL}/planning-tools/pakistani-mehndi-songs-dholki-tappay-generator`,
        applicationCategory: "EntertainmentApplication",
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
            name: "What are the top trending Pakistani bridal entry songs for 2026?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Trending emotional and royal bridal entry songs in 2026 include 'Din Shagna Da', 'Afreen Afreen (Acoustic)', 'Kala Sha Kala (Modern Fusion)', 'Madhanya', and bespoke instrumental sitar/flute renditions.",
            },
          },
          {
            "@type": "Question",
            name: "What are traditional Punjabi Dholki Tappay lyrics?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Dholki Tappay are rhyming couplets sung with a dholak and steel spoon rhythm, typically starting with 'Bari Barsi Khatan Gaya Si' and playfully teasing maternal and paternal family members during Mayun and Mehndi nights.",
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
      <MehndiSongsClient />
    </>
  );
}
