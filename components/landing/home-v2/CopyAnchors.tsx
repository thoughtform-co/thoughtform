"use client";

import { useRef } from "react";
import type { V7CorridorText } from "@/lib/v7-parse";
import { COPY_ANCHORS } from "./DepthGatewayScene/sceneGeom";
import { useWorldDomTracker } from "./hooks/useWorldDomTracker";

/**
 * CopyAnchors — DOM text overlay for the home-v2 depth corridor
 * (ADR-018, world-owned model).
 *
 * Every text container in the corridor is tagged with
 * `data-world-anchor="{id}"` and positioned per frame by
 * `useWorldDomTracker`, projecting named world anchors (defined in
 * `sceneGeom.ts`'s `COPY_ANCHORS` table) through the same camera
 * path the R3F scene uses. The result: copy and labels travel with
 * their gates as the camera approaches and passes — copy at parked
 * Thoughtform reads on the left, then drifts off-screen as the
 * camera reframes onto the centred Diagnostic gate; the orbit
 * label pills ride their actual orbital pip world positions; the
 * substrate side body labels track the L/R Fibonacci spheres.
 *
 * Each container has CSS-only typography (font, color, size, max-
 * width); position + opacity are written by the tracker.
 */

interface CopyAnchorsProps {
  text: V7CorridorText;
}

export function CopyAnchors({ text }: CopyAnchorsProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  // Filter out the brandmark anchor — it's owned by ProjectedBrandmarkActor.
  const copyOnlyAnchors = COPY_ANCHORS;
  useWorldDomTracker(copyOnlyAnchors, layerRef);

  const tf = text.thoughtform;
  const dg = text.diagnostic;
  const il = text.intelligence;

  return (
    <div ref={layerRef} className="home-v2-copy-layer" aria-hidden="false">
      {/* ─────────── THOUGHTFORM ─────────── */}
      <div
        className="home-v2-copy-block home-v2-copy-block--thoughtform-left"
        data-world-anchor="thoughtform.leftCopy"
        data-anchor-origin="left-center"
      >
        <div className="home-v2-copy-bridge">{tf.bridge}</div>
        <h2 className="home-v2-copy-title" dangerouslySetInnerHTML={{ __html: tf.titleHtml }} />
        <p className="home-v2-copy-body" dangerouslySetInnerHTML={{ __html: tf.body1Html }} />
        <p className="home-v2-copy-body" dangerouslySetInnerHTML={{ __html: tf.body2Html }} />
        <div className="home-v2-copy-cta-row">
          <a className="home-v2-copy-cta" href="#intelligence-layer">
            {tf.cta}{" "}
            <span className="home-v2-copy-cta__arrow" aria-hidden="true">
              →
            </span>
          </a>
        </div>
      </div>

      {/* Phase labels — NAVIGATE / ENCODE / BUILD. Each label is a
          two-line stack (primary uppercase + secondary mixed-case)
          mirroring the v7 sigil `<text>` pairs at lines 4359-4370
          of `landing-v7-motion.html`. The COPY_ANCHORS positions
          place the label's appropriate corner at the v7 connector
          tip; `data-anchor-origin` shifts each label so that corner
          lands on the anchor (top-right for navigate/encode = v7
          `text-anchor="end"`, top-left for build = `"start"`). */}
      <div
        className="home-v2-copy-phase home-v2-copy-phase--navigate"
        data-world-anchor="thoughtform.phase.navigate"
        data-anchor-origin="top-right"
      >
        <span className="home-v2-copy-phase__label">{tf.phaseLabels.navigate}</span>
        <span className="home-v2-copy-phase__sub">See</span>
      </div>
      <div
        className="home-v2-copy-phase home-v2-copy-phase--encode"
        data-world-anchor="thoughtform.phase.encode"
        data-anchor-origin="top-right"
      >
        <span className="home-v2-copy-phase__label">{tf.phaseLabels.encode}</span>
        <span className="home-v2-copy-phase__sub">Crystallize</span>
      </div>
      <div
        className="home-v2-copy-phase home-v2-copy-phase--build"
        data-world-anchor="thoughtform.phase.build"
        data-anchor-origin="top-left"
      >
        <span className="home-v2-copy-phase__label">{tf.phaseLabels.build}</span>
        <span className="home-v2-copy-phase__sub">Ship</span>
      </div>

      {/* ─────────── DIAGNOSTIC ─────────── */}
      <div
        className="home-v2-copy-block home-v2-copy-block--diagnostic-head"
        data-world-anchor="diagnostic.headCopy"
        data-anchor-origin="bottom-center"
      >
        <p className="home-v2-copy-bridge">{dg.bridge}</p>
        <h2 className="home-v2-copy-title" dangerouslySetInnerHTML={{ __html: dg.titleHtml }} />
      </div>

      {dg.labels.map((label) => (
        <div
          key={label.id}
          className={`home-v2-copy-label home-v2-copy-label--${label.id}`}
          data-world-anchor={`diagnostic.label.${label.id}`}
          data-anchor-origin="center"
        >
          <span className="home-v2-copy-label__pip" aria-hidden="true" />
          <span className="home-v2-copy-label__n">{label.n}</span>
          <span className="home-v2-copy-label__tag">{label.tag}</span>
        </div>
      ))}

      {/* ─────────── INTELLIGENCE ─────────── */}
      <div
        className="home-v2-copy-block home-v2-copy-block--intelligence-head"
        data-world-anchor="intelligence.headCopy"
        data-anchor-origin="bottom-center"
      >
        <h2 className="home-v2-copy-title" dangerouslySetInnerHTML={{ __html: il.titleHtml }} />
        <p className="home-v2-copy-body" dangerouslySetInnerHTML={{ __html: il.ledeHtml }} />
      </div>

      <div
        className="home-v2-copy-body-label home-v2-copy-body-label--left"
        data-world-anchor="intelligence.leftLabel"
        data-anchor-origin="center"
      >
        <span className="home-v2-copy-body-label__num">01</span>
        <span className="home-v2-copy-body-label__name">{il.leftLabel}</span>
      </div>
      <div
        className="home-v2-copy-body-label home-v2-copy-body-label--right"
        data-world-anchor="intelligence.rightLabel"
        data-anchor-origin="center"
      >
        <span className="home-v2-copy-body-label__num">03</span>
        <span className="home-v2-copy-body-label__name">{il.rightLabel}</span>
      </div>
    </div>
  );
}
