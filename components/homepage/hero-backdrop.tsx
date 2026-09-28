import Image from "next/image"
import { HeroBackdropRest } from "@/components/homepage/hero-backdrop-rest"

/**
 * The hero's background images — a SERVER component, deliberately.
 *
 * WW-PERF. Lighthouse on production put 1,801ms of the homepage's LCP into
 * "Load Delay": the time between the page arriving and the browser even
 * starting to fetch the image that IS the largest paint. The cause was that
 * `hero-section.tsx` is `"use client"`, and `next/image`'s `priority` only
 * emits a `<link rel="preload" as="image">` into <head> when it renders on the
 * server. The served HTML had four font preloads and one image preload — for
 * the 40x40 logo — and nothing for the hero.
 *
 * Rendering the images here, in a server component passed to the client hero as
 * a prop, gets the preload emitted with the correct `imagesrcset`. Hardcoding a
 * preload URL instead was not an option: Next appends a per-deployment `dpl`
 * token to every /_next/image URL, so a hand-written link would silently stop
 * matching on the next deploy and preload nothing.
 *
 * The crossfade is CSS (see tailwind.config `hero-fade`): seven stacked images,
 * each visible for a slice of one cycle. Only the first is eager and priority —
 * it is the LCP element. `motion-reduce:hidden` leaves a still image for anyone
 * who asks for less motion.
 */

export const HERO_IMAGES = [
  "/images/home/spotlight/spotlight.jpg", // grand floral stage
  "/images/home/hero/h2.jpg", // mehndi hands + bangles
  "/images/home/hero/h3.jpg", // floral stage decor
  "/images/home/hero/h4.jpg", // henna + jewellery hands
  "/images/home/partners/venue.jpg", // modest bride at decorated venue
  "/images/home/hero/h6.jpg", // modest bride, gold veil
  "/images/home/hero/h7.jpg", // draped stage, red & gold flowers
]

export function HeroBackdrop() {
  return (
    <>
      {/* Only the LCP image is server-rendered and preloaded. The other six
          arrive after the browser goes idle — see hero-backdrop-rest.tsx.
          Rendering all seven here cost 310kb on arrival for a 40kb paint. */}
      <Image
        src={HERO_IMAGES[0]}
        alt=""
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="object-cover"
      />
      <HeroBackdropRest />
    </>
  )
}
