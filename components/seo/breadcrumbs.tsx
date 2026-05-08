/**
 * Breadcrumbs — visual + BreadcrumbList JSON-LD in one component.
 *
 * Drop on every non-home page. Renders the visual nav AND emits the
 * structured-data block server-side, which is what the Rich Results Test
 * reads.
 *
 * Reference: docs/seo/00-master-seo-playbook.md §10 + §33 items 422–440, 893.
 *
 * Usage:
 *   <Breadcrumbs
 *     items={[
 *       { name: "Wedding Photographers", href: "/wedding-photographers" },
 *       { name: "Karachi", href: "/wedding-photographers/karachi" },
 *       { name: "SQ Photography" }, // last = current page, no href
 *     ]}
 *   />
 *
 * The "Home" item is added automatically — don't pass it.
 */

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { breadcrumbsLD, type BreadcrumbItem } from "@/lib/seo"

export interface BreadcrumbsProps {
  items: { name: string; href?: string }[]
  className?: string
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  // Build the JSON-LD list (always includes Home at position 1)
  const ldItems: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    ...items.map((it) => ({
      name: it.name,
      // For the last item without href, use the canonical of the current page.
      // We can't know that here — so pass a placeholder that JSON-LD allows
      // (Google accepts the last item without `item`/`url`, but our helper
      // requires a url). The page should pass `href` for every item including
      // the last one, OR the consumer can compute current URL and pass it.
      url: it.href ?? "#",
    })),
  ]

  return (
    <>
      {/* Visual breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className={`text-sm text-bridal-text-soft ${className}`}
      >
        <ol className="flex items-center flex-wrap gap-1.5">
          <li className="flex items-center">
            <Link
              href="/"
              aria-label="Home"
              className="inline-flex items-center hover:text-bridal-gold transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
          </li>
          {items.map((it, i) => {
            const isLast = i === items.length - 1
            return (
              <li key={`${it.name}-${i}`} className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-bridal-text-label" aria-hidden="true" />
                {isLast || !it.href ? (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className="text-bridal-charcoal font-medium"
                  >
                    {it.name}
                  </span>
                ) : (
                  <Link
                    href={it.href}
                    className="hover:text-bridal-gold transition-colors"
                  >
                    {it.name}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Structured data — Google's BreadcrumbList rich result */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLD(ldItems)) }}
      />
    </>
  )
}
