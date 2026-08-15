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
  // WWL-198 / WWL-218 / WWL-317 — these read as a different screen from the one
  // the sidebar names. A vendor should not have to work out that "Trade Ops",
  // "Trade operations" and "Trade operations hub" are the same page.
  'tax': 'Tax report',
  'trade-ops': 'Trade operations',
  'report-cards': 'Reports',
  // WWL-353 — title-casing the slug produced "Drone Noc" beside a page called
  // "Drone NOC permits". NOC is an acronym.
  'drone-noc': 'Drone NOC',
};

// BUG-017 — path segments that are grouping containers with NO index page of
// their own. Linking them 404s (e.g. every /dashboard/admin/* breadcrumb offered
// an "Admin" link to /dashboard/admin, which does not exist). We keep the label
// but drop the link so it renders as plain text.
const NON_NAVIGABLE_SEGMENTS = new Set(['admin']);

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
        // BUG-017 — container-only segments get no link so the breadcrumb
        // renders them as plain text instead of a dead 404 link.
        link: NON_NAVIGABLE_SEGMENTS.has(segment) ? '' : path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
