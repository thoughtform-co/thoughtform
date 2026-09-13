"use client";

import { useEffect, useRef } from "react";

import { ArcCards } from "@/components/arcs/ArcCards";
import { ArcListGroups } from "@/components/arcs/ArcListGroups";
import type { ArcSection } from "@/lib/arcs/types";

import { TRINNY_OFFER_SECTIONS } from "./offerSections";

/**
 * TrinnyOffer — the proposal's offer beats, mounted into the pitch page's
 * `#offer` station by `TrinnyPortals` (ADR-094 U9).
 *
 * The arcs' own section components over `TRINNY_OFFER_SECTIONS`, inside an
 * `.arc-root` so the ADR-077 ramp, the beat rhythm and the light
 * re-derivation all apply exactly as they do on `/arcs/suri-proposal` —
 * ONE renderer for both surfaces, which is what makes a fix to the plates
 * or the ledger land on both.
 *
 * ⚠ NOT `ArcSectionRenderer`. That dispatch statically imports every kind,
 * the dossier console and the holo program's three.js mount among them; the
 * landing-performance doctrine keeps `three` off this route's graph, and
 * the offer only ever draws lists and cards. A page-local switch over the
 * two kinds it uses is the whole cost of that.
 *
 * ⚠ NOT `ArcShell` either: that injects the HUD chrome, the theme lock, the
 * hero boot and the scroll writer, all of which this page already has from
 * `LandingPage`. What IS copied from it is the reveal opt-in — the class
 * and the observer added TOGETHER, so "hidden but never revealed" stays
 * unreachable (ADR-057's rule), and reduced motion lights everything at
 * once. `.arc-reveal` is visible without JS, which is the no-JS contract.
 *
 * `data-arc-format="proposal"` scopes ADR-079's one-beat-per-screen padding
 * and ADR-098 U1's interstitial size to this root, as `ArcShell` does.
 */
export default function TrinnyOffer() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add("is-arc-js");
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(".arc-reveal"));
    if (nodes.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="arc-root tl-offer__root" data-arc-format="proposal">
      {TRINNY_OFFER_SECTIONS.map((section, index) => (
        <OfferSection key={section.id} section={section} index={index} />
      ))}
    </div>
  );
}

function OfferSection({ section, index }: { section: ArcSection; index: number }) {
  switch (section.kind) {
    case "list-groups":
      return <ArcListGroups section={section} index={index} />;
    case "cards":
      return <ArcCards section={section} index={index} />;
    default:
      return null;
  }
}
