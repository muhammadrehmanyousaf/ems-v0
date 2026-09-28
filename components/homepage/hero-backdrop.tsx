import { HERO_SLIDES } from "@/components/homepage/hero-sources"
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


export function HeroBackdrop() {
  return (
    <>
      {/* Only the LCP image is server-rendered and preloaded. The other six
          arrive as the crossfade reaches them — see hero-backdrop-rest.tsx.

          A plain <img>, not next/image: these are pre-generated AVIF under
          /public (see hero-sources.ts), so there is nothing for the optimizer to
          do and nothing for its exhausted quota to refuse. The preload is
          hand-written, which was explicitly NOT safe while this went through
          /_next/image — Next appends a per-deployment `dpl` token to those URLs,
          so a hardcoded link stopped matching on the next deploy and preloaded
          nothing. A static path has no token and keeps matching. */}
      <link
        rel="preload"
        as="image"
        href={HERO_SLIDES[0].src}
        imageSrcSet={HERO_SLIDES[0].srcSet}
        imageSizes="100vw"
        fetchPriority="high"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_SLIDES[0].src}
        srcSet={HERO_SLIDES[0].srcSet}
        sizes="100vw"
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <HeroBackdropRest />
    </>
  )
}
