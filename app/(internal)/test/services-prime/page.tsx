"use client";

/**
 * /test/services-prime — design lab for the "Thoughtform Prime" signal plates
 * (collapse states, 2026-07-06 handoff).
 *
 * Renders the production `ServicesPlateCluster` UNCONTROLLED on a faux scene
 * (void + stars + gold atmosphere + a stand-in wireframe mark): clicks own the
 * accordion locally, exactly one card open at a time. Production wires the
 * same cluster to the runway scroll + the live brandmark's scan anchors; here
 * connectors are off (no anchors publish outside the corridor).
 *
 * Card styles live in `services.css` (imported below — the single source of
 * truth); this page only adds scene chrome.
 */

import { useState } from "react";

import type { PlateVariant } from "@/components/landing/home-v2/services/ServicePlateCard";
import { ServicesPlateCluster } from "@/components/landing/home-v2/services/ServicesPlateCluster";
import type { ServicePlateId } from "@/components/landing/home-v2/services/servicePlateData";

import "@/components/landing/home-v2/services/services.css";
import "./services-prime.css";

const VARIANTS: readonly PlateVariant[] = ["wireframe", "glass"];

export default function ServicesPrimeLabPage() {
  const [activeServiceId, setActiveServiceId] = useState<ServicePlateId>("keynote");
  // Look-dev toggle (ADR-025 Update 8): wireframe = the schematic seeds;
  // glass = the original look, kept as the pixel-regression reference.
  const [variant, setVariant] = useState<PlateVariant>("wireframe");

  return (
    <main className="svc-prime-lab">
      <div className="svc-prime-lab__stars" aria-hidden="true" />
      <span className="svc-prime-lab__aur" aria-hidden="true" />

      {/* Stand-in wireframe mark (production: the docked corridor brandmark). */}
      <svg className="svc-prime-lab__mark" viewBox="0 0 800 800" aria-hidden="true">
        <ellipse
          cx="400"
          cy="400"
          rx="200"
          ry="390"
          transform="rotate(20 400 400)"
          fill="none"
          stroke="rgba(236,227,214,.13)"
          strokeWidth="1"
        />
        <ellipse
          cx="400"
          cy="400"
          rx="385"
          ry="145"
          transform="rotate(-10 400 400)"
          fill="none"
          stroke="rgba(236,227,214,.11)"
          strokeWidth="1"
        />
        <circle
          cx="400"
          cy="400"
          r="250"
          fill="none"
          stroke="rgba(202,165,84,.34)"
          strokeWidth="1.2"
          strokeDasharray="1.5 7"
        />
        <ellipse
          cx="400"
          cy="400"
          rx="250"
          ry="160"
          fill="none"
          stroke="rgba(202,165,84,.22)"
          strokeWidth="1"
          strokeDasharray="1.5 8"
        />
        <ellipse
          cx="400"
          cy="400"
          rx="300"
          ry="94"
          fill="none"
          stroke="rgba(202,165,84,.24)"
          strokeWidth="1"
          strokeDasharray="1 6"
        />
        <line
          x1="400"
          y1="178"
          x2="400"
          y2="622"
          stroke="rgba(202,165,84,.5)"
          strokeWidth="5"
          strokeDasharray="2 6"
        />
        <line
          x1="178"
          y1="400"
          x2="622"
          y2="400"
          stroke="rgba(202,165,84,.5)"
          strokeWidth="5"
          strokeDasharray="2 6"
        />
        <rect
          x="396"
          y="396"
          width="8"
          height="8"
          transform="rotate(45 400 400)"
          fill="rgba(202,165,84,.9)"
        />
      </svg>

      <header className="svc-prime-lab__head">
        <p className="svc-prime-lab__title">
          Services · Signal plates <span>· collapse cluster · click a seed to open</span>
        </p>
        <div className="svc-prime-lab__variant" role="group" aria-label="Plate variant">
          {VARIANTS.map((v) => (
            <button
              key={v}
              type="button"
              data-on={variant === v || undefined}
              onClick={() => setVariant(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      <ServicesPlateCluster
        activeServiceId={activeServiceId}
        onSelectService={setActiveServiceId}
        showConnectors={false}
        plateVariant={variant}
      />
    </main>
  );
}
