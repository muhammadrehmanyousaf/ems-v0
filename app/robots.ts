import { MetadataRoute } from 'next'

// Must match SITE_URL in lib/seo/constants.ts and the hostname Vercel
// actually serves the site at. www is primary; apex 307s here.
const SITE_URL = 'https://www.weddingwala.pk'

// AI crawler allowlist — Wedding Wala wants to be cited in AI answers.
// Citation visibility on ChatGPT / Perplexity / Claude / Gemini directly
// translates to brand visibility in 2026 search behavior.
// Reference: docs/seo/00-master-seo-playbook.md §1 item 26, §21 GEO.
const AI_CRAWLERS = [
  'GPTBot',          // OpenAI training crawler
  'OAI-SearchBot',   // ChatGPT Search
  'ChatGPT-User',    // ChatGPT browsing on user request
  'PerplexityBot',   // Perplexity index
  'Perplexity-User', // Perplexity browsing on user request
  'ClaudeBot',       // Anthropic training crawler
  'Claude-Web',      // Claude browsing on user request
  'Google-Extended', // Gates Bard/Gemini training without affecting Google Search
  'Applebot',        // Apple Spotlight + Siri
  'Applebot-Extended', // Apple AI training
  'Bingbot',         // Bing + Copilot
  'DuckDuckBot',     // DuckDuckGo (uses Bing index)
  'YandexBot',       // Yandex
  'CCBot',           // Common Crawl (used by many LLMs)
  'cohere-ai',       // Cohere
  'anthropic-ai',    // legacy Anthropic crawler name
  'FacebookBot',     // Meta AI
  'Meta-ExternalAgent',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/user/',
          '/_next/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/business-registration',
          '/booking/',          // post-payment confirmation; not for indexing
          '/checkout-callback',
          '/*?*sort=',          // sort variants
          '/*?*page=',          // pagination canonicalizes to base
          '/*?utm_*',
          '/*?fbclid=',
          '/*?gclid=',
        ],
      },
      // Be permissive with AI crawlers — only block private surfaces.
      ...AI_CRAWLERS.map((bot) => ({
        userAgent: bot,
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/user/', '/login', '/register'],
      })),
    ],
    // Only /sitemap.xml exists (a flat sitemap). The sharded /sitemap/N.xml
    // URLs were planned but never generated, so advertising them made crawlers
    // fetch 4 dead URLs. Re-add shards here only once they actually resolve.
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
