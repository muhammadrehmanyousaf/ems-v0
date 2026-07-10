'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/employee': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Employee', link: '/dashboard/employee' }
  ],
  '/dashboard/product': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Product', link: '/dashboard/product' }
  ]
  // Add more custom mappings as needed
};

// Human labels for route slugs that don't read well when naively title-cased
// (e.g. "billing-new" -> "Billing New", "pdcs" -> "Pdcs"). Keys are the raw
// path segment; values are the display label (already in the desired case).
const segmentLabels: Record<string, string> = {
  'billing-new': 'Billing',
  'pdcs': 'Cheque ledger',
  'generator-fuel': 'Generator fuel',
  'function-sheets': 'Function sheets',
  'venue-os': 'Venue OS',
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname || 0]) {
      return routeMapping[pathname || 0];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname?.split('/').filter(Boolean);
    return segments?.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title:
          segmentLabels[segment] ??
          segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
