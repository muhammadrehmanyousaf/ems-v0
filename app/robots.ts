import { MetadataRoute } from 'next'

const SITE_URL = 'https://weddingwala.pk'

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
    // Pointing at the sitemap index AND every shard explicitly.
    // Google + Bing follow the index just fine, but smaller crawlers
    // (Yandex, Naver, Seznam, IndexNow consumers, AI bots) sometimes
    // skip the index and look for direct sitemap URLs in robots.txt.
    // Reference: https://www.sitemaps.org/protocol.html#sitemapXMLExample
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap/0.xml`, // core
      `${SITE_URL}/sitemap/1.xml`, // programmatic (city × vendor-type)
      `${SITE_URL}/sitemap/2.xml`, // vendors (dynamic)
      `${SITE_URL}/sitemap/3.xml`, // images
    ],
    host: SITE_URL,
  }
}
