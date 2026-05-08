/**
 * SEO library barrel — import from "@/lib/seo" anywhere.
 *
 * Reference: docs/seo/00-master-seo-playbook.md
 */

export * from "./constants";
export * from "./jsonld";
export * from "./metadata";
export * from "./hreflang";
export {
  parseVendorSlugAndId,
  buildVendorCanonicalPath,
  slugifyName,
} from "./fetch-vendor";
export type { VendorDetail } from "./fetch-vendor";
