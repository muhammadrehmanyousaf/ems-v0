"use client"

import { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

import { BridalBadge } from "@/components/bridal/bridal-badge"
import { FloralDivider } from "@/components/bridal/floral-divider"
import { FloatingPetals } from "@/components/bridal/floating-petals"

// Curated Pakistani-wedding photography per route. Each auth screen gets
// its own cinematic frame so the suite never feels recycled.
const ASIDE_PHOTOS = {
  login:
    "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1600",
  register:
    "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1600",
  forgot:
    "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=1600",
  reset:
    "https://images.pexels.com/photos/1456613/pexels-photo-1456613.jpeg?auto=compress&cs=tinysrgb&w=1600",
} as const

export type AuthShellVariant = keyof typeof ASIDE_PHOTOS

interface AuthShellProps {
  variant?: AuthShellVariant
  /** Custom hero photo URL — overrides `variant` if provided. */
  asidePhoto?: string
  asideAlt?: string
  asideBadge?: { icon?: ReactNode; label: string }
  asideTitle: ReactNode
  asideSubtitle: ReactNode
  /** Optional decorative block under the divider (e.g. testimonial, stat tiles). */
  asideExtra?: ReactNode
  /** Right-panel form content. */
  children: ReactNode
  /** Mobile crest icon shown above the form when the aside is hidden. */
  mobileCrestIcon?: ReactNode
  /** Visual width of the form column (defaults to 460px — register width). */
  formMaxWidth?: number
}

/**
 * Shared bridal frame for all authentication screens.
 *
 * Locks to a single viewport (`h-screen overflow-hidden`); if the form ever
 * grows past the viewport on a tiny laptop, only the form panel scrolls
 * internally — the page itself never gets a scrollbar.
 *
 *   <AuthShell
 *     variant="login"
 *     asideBadge={{ icon: <Heart />, label: "Pakistan's Wedding Platform" }}
 *     asideTitle={<>Where every <em>love story</em> finds its setting.</>}
 *     asideSubtitle="Trusted by families across Pakistan…"
 *     asideExtra={<TestimonialBlock />}
 *   >
 *     <YourForm />
 *   </AuthShell>
 */
export function AuthShell({
  variant = "login",
  asidePhoto,
  asideAlt = "Pakistani wedding",
  asideBadge,
  asideTitle,
  asideSubtitle,
  asideExtra,
  children,
  // eslint-disable-next-line @next/next/no-img-element
  mobileCrestIcon = <img src="/icon-mark.png" alt="Wedding Wala" className="w-7 h-7" />,
  formMaxWidth = 460,
}: AuthShellProps) {
  const photoSrc = asidePhoto ?? ASIDE_PHOTOS[variant]

  return (
    <div className="h-screen bridal-surface relative overflow-hidden">
      {/* Decorative warm wash + Mughal jaal + floating petals */}
      <div className="absolute inset-0 bg-bridal-hero" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 bg-bridal-wash opacity-95"
      />
      <FloatingPetals className="z-0" />

      <div className="relative z-10 flex h-full">
        {/* ── Left editorial panel ── */}
        <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <Image
            src={photoSrc}
            alt={asideAlt}
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
          {/* Warm gradient veil */}
          <div className="absolute inset-0 bg-gradient-to-br from-bridal-charcoal/40 via-bridal-mauve/25 to-bridal-blush/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/85 via-transparent to-transparent" />

          {/* Editorial copy */}
          <div className="relative z-10 flex flex-col justify-end p-10 xl:p-16 text-bridal-ivory w-full">
            {asideBadge && (
              <BridalBadge
                variant="rose"
                className="self-start mb-6 backdrop-blur-sm bg-bridal-blush/95"
              >
                {asideBadge.icon}
                {asideBadge.label}
              </BridalBadge>
            )}

            <h2 className="font-display italic text-4xl xl:text-5xl leading-[1.1] mb-4 max-w-md">
              {asideTitle}
            </h2>
            <p className="font-bridal text-base xl:text-lg text-bridal-ivory/85 max-w-md leading-relaxed">
              {asideSubtitle}
            </p>

            {asideExtra && (
              <>
                <FloralDivider
                  className="my-8 [&>svg]:opacity-80"
                  width={220}
                />
                {asideExtra}
              </>
            )}
          </div>
        </aside>

        {/* ── Right form panel ── */}
        <main className="flex-1 h-full overflow-y-auto flex items-center justify-center px-4 sm:px-6 lg:px-12 py-10">
          <div
            className="w-full animate-stagger-fade-up"
            style={{ maxWidth: `${formMaxWidth}px` }}
          >
            {/* Mobile crest — replaces the photo aside under lg */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-bridal-gold/15 border border-bridal-gold/40 flex items-center justify-center">
                {mobileCrestIcon}
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * Aside testimonial block — couple quote with a gold-circle initial avatar.
 * Used by the login screen.
 */
export function AuthAsideTestimonial({
  quote,
  name,
  meta,
  initial,
}: {
  quote: string
  name: string
  meta?: string
  initial: string
}) {
  return (
    <div className="max-w-md">
      <p className="font-display italic text-lg text-bridal-ivory/90 leading-relaxed">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-bridal-gold/90 flex items-center justify-center text-bridal-charcoal font-bridal font-semibold">
          {initial}
        </div>
        <div>
          <p className="font-bridal text-sm text-bridal-ivory">{name}</p>
          {meta && (
            <p className="font-bridal text-[11px] uppercase tracking-[0.2em] text-bridal-rose">
              {meta}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Aside stat-tile grid — used by the register and reset screens. */
export function AuthAsideStatTiles({
  tiles,
}: {
  tiles: {
    icon: ReactNode
    value: ReactNode
    label: string
  }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3 max-w-md">
      {tiles.map((t, i) => (
        <div
          key={i}
          className="rounded-md border border-bridal-gold/30 bg-bridal-charcoal/30 backdrop-blur-md px-4 py-4"
        >
          <span className="text-bridal-gold mb-2 block">{t.icon}</span>
          <p className="font-display italic text-2xl text-bridal-ivory leading-none">
            {t.value}
          </p>
          <p className="font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-rose/90 mt-1">
            {t.label}
          </p>
        </div>
      ))}
    </div>
  )
}

/** Aside checklist — used by the reset-password screen. */
export function AuthAsideChecklist({
  items,
}: {
  items: { icon: ReactNode; label: string }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3 max-w-md">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-md border border-bridal-gold/30 bg-bridal-charcoal/30 backdrop-blur-md px-3 py-2.5 flex items-center gap-2"
        >
          <span className="w-4 h-4 text-bridal-gold flex-shrink-0 inline-flex items-center justify-center">
            {item.icon}
          </span>
          <span className="font-bridal text-[12px] text-bridal-ivory/90">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
