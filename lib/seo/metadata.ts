/**
 * Page-level metadata builder. Every dynamic route's `generateMetadata` calls
 * `buildPageMetadata({...})` instead of hand-assembling Metadata objects.
 * Keeps title/description/OG/canonical/hreflang consistent across the site.
 *
 * Reference: docs/seo/00-master-seo-playbook.md §6 + §33 items 841–849.
 */

import type { Metadata } from "next";
import {
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  SITE_URL,
  DEFAULT_LOCALE,
} from "./constants";

export interface PageMetadataInput {
  /** Page-specific title fragment (will compose with site template). */
  title?: string;
  /** Override the full title — bypasses the template. Rarely needed. */
  fullTitle?: string;
  /** ≤ 155 chars. Hand-write each one; never auto-generate from page text. */
  description?: string;
  /** Path relative to site root, with leading slash, no trailing slash, no host. */
  path: string;
  /** OG image — relative or absolute. Defaults to /og-default.jpg. */
  imageUrl?: string;
  /** Whether the page should be indexed. Defaults to true. */
  index?: boolean;
  /** Whether crawlers should follow links on the page. Defaults to true. */
  follow?: boolean;
  /** OG type — 'website' (default), 'article', 'product', 'profile'. */
  ogType?: "website" | "article" | "product" | "profile";
  /** Article-specific metadata (only used when ogType === 'article'). */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  /** Locale of this page. Defaults to en-PK. */
  locale?: "en-PK" | "ur-PK";
  /** If a translated version exists, the path of the alternate. */
  alternateLocalePaths?: { "en-PK"?: string; "ur-PK"?: string };
}

function normalizePath(p: string): string {
  if (!p) return "/";
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1); // L2 no trailing slash
  return p.toLowerCase(); // L3 lowercase
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const path = normalizePath(input.path);
  const url = `${SITE_URL}${path}`;
  const description = input.description ?? SITE_DESCRIPTION;
  const imageUrl = input.imageUrl ?? "/og-default.jpg";
  const locale = input.locale ?? DEFAULT_LOCALE;
  const ogLocale = locale.replace("-", "_"); // OG uses underscore form

  // Compose title — Next.js template handles `%s | Wedding Wala` if `title` set.
  const title = input.fullTitle
    ? input.fullTitle
    : input.title
      ? input.title // template applied by parent layout
      : `${SITE_NAME} — ${SITE_TAGLINE}`;

  // Hreflang languages
  const languages: Record<string, string> = {};
  if (input.alternateLocalePaths?.["en-PK"]) {
    languages["en-PK"] = input.alternateLocalePaths["en-PK"];
    languages["x-default"] = input.alternateLocalePaths["en-PK"];
  } else if (locale === "en-PK") {
    languages["en-PK"] = path;
    languages["x-default"] = path;
  }
  if (input.alternateLocalePaths?.["ur-PK"]) {
    languages["ur-PK"] = input.alternateLocalePaths["ur-PK"];
  }

  return {
    title: input.fullTitle ?? input.title ?? undefined,
    description,
    alternates: {
      canonical: path,
      languages: Object.keys(languages).length ? languages : undefined,
    },
    openGraph: {
      type: input.ogType ?? "website",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: ogLocale,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      ...(input.ogType === "article" && input.article
        ? {
            publishedTime: input.article.publishedTime,
            modifiedTime: input.article.modifiedTime,
            authors: input.article.author ? [input.article.author] : undefined,
            section: input.article.section,
            tags: input.article.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: input.index ?? true,
      follow: input.follow ?? true,
      googleBot: {
        index: input.index ?? true,
        follow: input.follow ?? true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

/**
 * Convenience for pages that should NOT be indexed (search results, filter
 * combos with <3 results, internal account pages, etc.).
 */
export function noindexMetadata(path: string, title?: string): Metadata {
  return buildPageMetadata({
    path,
    title,
    index: false,
    follow: true, // crawl internal links but don't index this URL
  });
}
