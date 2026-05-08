/**
 * Hreflang helper — emits the en-PK / ur-PK / x-default annotations as plain
 * <link> elements when needed outside the Metadata API (e.g. to inline in a
 * page that uses `generateMetadata` returning partial alternates).
 *
 * Most pages should set hreflang via `buildPageMetadata({ alternateLocalePaths })`
 * in lib/seo/metadata.ts — that's the canonical path. This file is for the
 * occasional case where a page composes its own <head> manually.
 *
 * Reference: docs/seo/03-url-conventions-LOCKED.md §L7 + SEO playbook §14.
 */

import { SITE_URL } from "./constants";

export interface HreflangPair {
  locale: "en-PK" | "ur-PK";
  path: string;
}

export interface HreflangAlternates {
  enPath: string; // canonical English path (becomes x-default + en-PK)
  urPath?: string; // optional Urdu path
}

/**
 * Returns the JSX-ready array of `<link rel="alternate">` props.
 * Use in a page's <head> when you can't go through `buildPageMetadata`.
 */
export function hreflangLinks({ enPath, urPath }: HreflangAlternates) {
  const links = [
    { hreflang: "en-PK", href: `${SITE_URL}${enPath}` },
    { hreflang: "x-default", href: `${SITE_URL}${enPath}` },
  ];
  if (urPath) {
    links.push({ hreflang: "ur-PK", href: `${SITE_URL}${urPath}` });
  }
  return links;
}

/**
 * Returns the languages map shape that `Metadata.alternates.languages` expects.
 * Use when programmatically building Metadata.
 */
export function hreflangLanguages({ enPath, urPath }: HreflangAlternates): Record<string, string> {
  return {
    "en-PK": enPath,
    "x-default": enPath,
    ...(urPath ? { "ur-PK": urPath } : {}),
  };
}
