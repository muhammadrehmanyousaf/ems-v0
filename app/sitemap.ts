import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ajoint.pk'

  const staticPages = [
    '',
    '/about',
    '/contact',
    '/help',
    '/search',
    '/venues',
    '/photographers',
    '/catering',
    '/decor',
    '/makeup-artists',
    '/henna-artists',
    '/bridal-wear',
    '/car-rental',
    '/wedding-stationery',
    '/planning-tools',
    '/planning-tools/budget',
    '/planning-tools/checklist',
    '/planning-tools/guest-list',
    '/planning-tools/timeline',
    '/login',
    '/register',
    '/business-registration',
  ]

  return staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
