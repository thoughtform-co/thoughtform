"use client";

import { useEffect, useState } from "react";
import { useLenis } from "@/lib/hooks/useLenis";
import { CardStack, VARIANT_CHROME, VARIANT_IDS, type VariantId } from "./CardStack";
// Shared stack mechanic + console skin live with the production section
// (ADR-030); project-cards.css keeps only the lab shell + the unshipped
// skins. Order matters: lab rules may override the shared base.
import "@/components/landing/v7/tools-cards/tools-cards.css";
import "./project-cards.css";

/**
 * /test/project-cards — scroll-stacked project cards lab.
 *
 * Five chrome directions over one sticky-sibling stack (vorszk.com
 * mechanic): card N pins, card N+1 slides over it, covered headers stay
 * peeking in a 48px cascade. Variant is deep-linkable via `?v=v1..v5`.
 *
 * Known house gap (accepted for a lab): `useLenis` keeps smoothWheel on
 * under prefers-reduced-motion; the stack itself parks its effects there.
 */

/** Lenis re-renders on scroll (internal setState); contain it in a null
 *  leaf so the stack never re-renders per frame. */
function SmoothScroll() {
  useLenis();
  return null;
}

export default function ProjectCardsLabPage() {
  // Deep-link state (?v=) read lazily — no useSearchParams, so no
  // Suspense/CSR-bailout dance (gateway-motion pattern).
  const [variant, setVariant] = useState<VariantId>(() => {
    if (typeof window === "undefined") return "v1";
    const v = new URLSearchParams(window.location.search).get("v") as VariantId | null;
    return v && VARIANT_IDS.includes(v) ? v : "v1";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("v", variant);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [variant]);

  return (
    <main className="pcl">
      <SmoothScroll />

      <nav className="pcl-switch" aria-label="Card design variant">
        {VARIANT_IDS.map((id) => (
          <button
            key={id}
            type="button"
            data-active={id === variant || undefined}
            onClick={() => setVariant(id)}
          >
            {VARIANT_CHROME[id].label}
          </button>
        ))}
      </nav>

      <header className="pcl-head">
        <p className="pcl-head__eyebrow">Cases · in production</p>
        <h1 className="pcl-head__title">
          Removing workflow bottlenecks, <em>one tool at a time.</em>
        </h1>
        <p className="pcl-head__hint" aria-hidden="true">
          Scroll
        </p>
      </header>

      <CardStack variant={variant} />

      <footer className="pcl-out">
        <p className="pcl-out__line">
          End of transmission — <em>04 / 04 cases</em>
        </p>
      </footer>
    </main>
  );
}
