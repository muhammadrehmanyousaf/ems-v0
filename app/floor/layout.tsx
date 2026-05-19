// Phase 2 #8.9 — Floor command app layout.
//
// Separate route group OUTSIDE the (dashboard) layout so the mobile
// PWA "Floor" home doesn't inherit the desktop sidebar + chrome.
// One-handed phone use is the design constraint.

import type { Metadata, Viewport } from 'next';
import ProtectedRoutes from '@/lib/protected-routes';

export const metadata: Metadata = {
  title: 'Wedding Wala — Floor',
  description:
    'Mobile-first floor command for vendor staff running an event today.',
};

export const viewport: Viewport = {
  themeColor: '#b88c4a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function FloorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoutes>
      <div className="min-h-[100dvh] bg-bridal-cream">{children}</div>
    </ProtectedRoutes>
  );
}
