"use client";

import { useEffect, useRef } from "react";

import { ArcCards } from "@/components/arcs/ArcCards";
import { ArcConfiguration } from "@/components/arcs/ArcConfiguration";
import { ArcFlow } from "@/components/arcs/ArcFlow";
import { ArcListGroups } from "@/components/arcs/ArcListGroups";
import type { ArcSection } from "@/lib/arcs/types";

/**
 * TrinnyBeats — the arcs' own section components, mounted into this page's
 * stations (ADR-094 U9, extended by ADR-099).
 *
 * TWO ROOTS USE IT: `#proposition` mounts the configuration alone, `#offer`
 * mounts the seven beats after it. One renderer either way, so a fix to the
 * plates, the ledger or the head's datum lands on both surfaces and on
 * `/arcs/suri-proposal` at the same time.
 *
 * ⚠ NOT `ArcSectionRenderer`. That dispatch statically imports every kind,
 * the dossier console and the holo program's three.js mount among them; the
 * landing-performance doctrine keeps `three` off this route's graph. A
 * page-local switch over the four kinds this page uses is the whole cost of
 * that, and the `never` fallthrough keeps it honest — a beat authored in
 * another kind renders nothing, which `trinny-offer.test.ts` fails on.
 *
 * ⚠ NOT `ArcShell` either: that injects the HUD chrome, the theme lock, the
 * hero boot and the scroll writer, all of which this page already has from
 * `LandingPage`. What IS copied from it is the reveal opt-in — the class and
 * the observer added TOGETHER, so "hidden but never revealed" stays
 * unreachable (ADR-057's rule), and reduced motion lights everything at
 * once. `.arc-reveal` is visible without JS, which is the no-JS contract.
 *
 * ⚠ `startIndex` IS THE DESIGNATOR'S SEAT, NOT A COSMETIC. `ArcSectionHead`
 * letters `ARC / BRIEF · NN` off the index it is given, and the two roots are
 * two React trees that each count from zero — so without the offset the
 * configuration and the phases would both print `01` on one page. The offer
 * starts where the configuration left off.
 *
 * `data-arc-format="proposal"` scopes ADR-079's one-beat-per-screen padding,
 * ADR-098 U1's interstitial size and ADR-099's head datum to this root, as
 * `ArcShell` does on a real arc.
 */
export function TrinnyBeats({
  sections,
  startIndex = 0,
  className,
}: {
  sections: readonly ArcSection[];
  startIndex?: number;
  className?: string;
}) {
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
  }, [sections]);

  return (
    <div
      ref={rootRef}
      className={`arc-root${className ? ` ${className}` : ""}`}
      data-arc-format="proposal"
    >
      {sections.map((section, i) => (
        <TrinnyBeat key={section.id} section={section} index={startIndex + i} />
      ))}
    </div>
  );
}

function TrinnyBeat({ section, index }: { section: ArcSection; index: number }) {
  switch (section.kind) {
    case "list-groups":
      return <ArcListGroups section={section} index={index} />;
    case "cards":
      return <ArcCards section={section} index={index} />;
    case "configuration":
      return <ArcConfiguration section={section} index={index} />;
    case "flow":
      return <ArcFlow section={section} index={index} />;
    default:
      return null;
  }
}
