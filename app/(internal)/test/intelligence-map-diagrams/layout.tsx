/**
 * /test/intelligence-map-diagrams — internal look-dev route.
 *
 * URL contract:
 *   /test/intelligence-map-diagrams          the instrument, level 01, dark
 *   ?theme=light                             handled by the root pre-paint
 *                                            bootstrap (theme.css imported)
 *
 * Levels and selection are in-page state (terminal display switching — the
 * instrument never zooms). Dev-only; proxy.ts 404s /test/* in production.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intelligence Map Diagrams (Internal)",
  robots: { index: false, follow: false },
};

export default function IntelligenceMapDiagramsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
