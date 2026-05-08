/**
 * "Save to Pinterest" button.
 *
 * Pinterest is the #1 wedding visual-search surface globally. Pakistani
 * couples + diaspora couples planning back home use Pinterest heavily for
 * mehndi inspiration, decor moodboards, bridal-wear shoots, and venue
 * styling. Every shareable image on Wedding Wala (real-wedding recaps,
 * blog posts, vendor heros) should expose a save-to-Pinterest affordance.
 *
 * Reference: docs/seo/00-master-seo-playbook.md §16 item 560 + §25 item 709.
 *
 * Usage:
 *   <PinterestSaveButton
 *     imageUrl="https://weddingwala.pk/blog/sample.jpg"
 *     description="Pakistani bridal mehndi designs — 2026 trends"
 *     pageUrl="https://weddingwala.pk/blog/photography/mehndi-designs"
 *   />
 *
 * Renders a small branded button that opens Pinterest's pin-creation
 * dialog in a popup. Pinterest auto-fills imageUrl + description + pageUrl.
 */

"use client"

import Link from "next/link"

interface PinterestSaveButtonProps {
  /** Absolute URL of the image to pin. Must be a public, indexable URL. */
  imageUrl: string
  /** Pin description / caption — keyword-rich, ≤500 chars. */
  description: string
  /** Absolute URL of the page the pin links back to. */
  pageUrl: string
  /** Visual variant. */
  size?: "sm" | "md"
  /** Override the button label. */
  label?: string
  className?: string
}

const PINTEREST_RED = "#E60023"

export function PinterestSaveButton({
  imageUrl,
  description,
  pageUrl,
  size = "md",
  label = "Save to Pinterest",
  className = "",
}: PinterestSaveButtonProps) {
  const href = buildPinterestHref({ imageUrl, description, pageUrl })

  const sizeStyles = size === "sm" ? "h-8 px-3 text-[12px]" : "h-9 px-4 text-[12.5px]"

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-pin-do="buttonPin"
      data-pin-custom="true"
      aria-label="Save this to Pinterest"
      className={`inline-flex items-center gap-1.5 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal font-medium text-bridal-charcoal hover:text-bridal-gold transition-colors ${sizeStyles} ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={PINTEREST_RED}
        aria-hidden="true"
      >
        <path d="M12 0a12 12 0 0 0-4.4 23.16c-.06-.94-.13-2.4.03-3.43.14-.93 1.34-5.94 1.34-5.94s-.34-.69-.34-1.7c0-1.6.92-2.78 2.07-2.78.97 0 1.45.73 1.45 1.6 0 .98-.62 2.45-.94 3.8-.27 1.14.57 2.07 1.7 2.07 2.04 0 3.6-2.15 3.6-5.25 0-2.74-1.97-4.66-4.78-4.66-3.26 0-5.18 2.45-5.18 4.97 0 .98.38 2.04.85 2.62.1.11.11.21.08.32-.09.36-.28 1.14-.32 1.3-.05.21-.17.26-.39.16-1.46-.68-2.37-2.81-2.37-4.52 0-3.69 2.68-7.07 7.72-7.07 4.05 0 7.2 2.89 7.2 6.74 0 4.03-2.54 7.27-6.06 7.27-1.18 0-2.3-.61-2.68-1.34l-.73 2.78c-.27 1.02-.99 2.3-1.47 3.08A12 12 0 1 0 12 0z" />
      </svg>
      {label}
    </Link>
  )
}

interface BuildArgs {
  imageUrl: string
  description: string
  pageUrl: string
}

/**
 * Build the Pinterest pin-creation URL.
 * Doc: https://developers.pinterest.com/docs/web-features/save-button/
 */
export function buildPinterestHref({ imageUrl, description, pageUrl }: BuildArgs): string {
  const params = new URLSearchParams({
    url: pageUrl,
    media: imageUrl,
    description: description.slice(0, 500),
  })
  return `https://www.pinterest.com/pin/create/button/?${params.toString()}`
}
