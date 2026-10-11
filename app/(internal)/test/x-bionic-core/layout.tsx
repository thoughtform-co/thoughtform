import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/x-bionic-core — the X-Bionic proposal's two core sections rebuilt
 * from scratch beside the page (owner, 2026-10-11): the offering (where
 * Thoughtform plugs in) and the layer (how adoption and automation
 * connect), each in two or three routes, inside the real arc shell so they
 * read as the site. Nothing here touches the production page or its
 * records. Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "X-Bionic core · Thoughtform",
  robots: { index: false, follow: false },
};

export default function XBionicCoreLayout({ children }: { children: ReactNode }) {
  return children;
}
