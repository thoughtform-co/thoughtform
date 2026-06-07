"use client";

import { useRef } from "react";
import { ARTIFACT_LABELS } from "@/components/landing/intelligence-artifact/artifactGeom";
import type { V7CorridorText } from "@/lib/v7-parse";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { stationById } from "@/lib/home-v2/corridorMap";
import { COPY_ANCHORS } from "./DepthGatewayScene/sceneGeom";
import { SHELL_PRIMITIVES } from "./DepthGatewayScene/shell/shellGeom";
import { useWorldDomTracker } from "./hooks/useWorldDomTracker";
import { StationTitle } from "./StationTitle";

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

/** DOM anchor origin + layout class per primitive cardinal. `center`
 *  on all four — each label centers on its midpoint anchor, sitting
 *  nicely in the gap between the compass outer ring (0.75) and the
 *  slot dock ring (`SLOT_RING_R`). */
const PRIMITIVE_ANCHOR_META: Record<
  string,
  { origin: string; layout: "north" | "east" | "south" | "west" }
> = {
  judgment: { origin: "center", layout: "north" },
  taste: { origin: "center", layout: "east" },
  craft: { origin: "center", layout: "south" },
  voice: { origin: "center", layout: "west" },
};

export function CopyAnchors({ text }: CopyAnchorsProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  // COPY_ANCHORS is text-only; the brandmark's own anchor is
  // registered by ProjectedBrandmarkActor via its own tracker call.
  useWorldDomTracker(COPY_ANCHORS, layerRef);

  // Mobile renders the Thoughtform copy as ONE vertically-centred column
  // (bridge + title + body + chevron cue) over the gate centre, with the
  // chevron scroll cue instead of the desktop "See the thesis" link. Copy
  // and the brandmark never share the frame (copy fades out in Moment 1
  // before the mark slides in for Moment 2), so the block is centred and
  // reads as one cohesive paragraph. Desktop keeps the two-column block
  // with the text CTA. (ADR-018 mobile two-moment revision.)
  const isMobile = useDeviceTier() === "mobile";

  const tf = text.thoughtform;
  // Navigate / Encode / Build section copy now lives on the corridor
  // map nodes (Navigate is the fly-through landmark inside
  // passthrough-01). The opening Thoughtform/setup copy still flows
  // through `text` (untouched).
  const nav = stationById("navigate")?.content;
  const enc = stationById("diagnostic")?.content;
  const bld = stationById("intelligence")?.content;
  const stackSourcesLabel = ARTIFACT_LABELS.find((l) => l.id === "sources");
  const stackSurfacesLabel = ARTIFACT_LABELS.find((l) => l.id === "surfaces");

  // Desktop CTA: the "See the thesis →" link to the intelligence layer.
  const cta = (
    <div className="home-v2-copy-cta-row">
      <a className="home-v2-copy-cta" href="#intelligence-layer">
        {tf.cta}{" "}
        <span className="home-v2-copy-cta__arrow" aria-hidden="true">
          →
        </span>
      </a>
    </div>
  );

  // Mobile CTA: three down-pointing chevrons that glow in sequence
  // (launch-pad runway) as a "scroll down to continue" cue into the
  // Moment-2 brandmark + diagram reveal. Tapping scrolls ~one viewport
  // forward; honours reduced-motion (instant scroll + static-lit CSS).
  const scrollForward = () => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollBy({ top: window.innerHeight, behavior: reduce ? "auto" : "smooth" });
  };
  const mobileChevrons = (
    <div className="home-v2-copy-cta-row">
      <button
        type="button"
        className="home-v2-scroll-chevrons"
        aria-label="Scroll down to continue"
        onClick={scrollForward}
      >
        <span className="home-v2-scroll-chevrons__c" />
        <span className="home-v2-scroll-chevrons__c" />
        <span className="home-v2-scroll-chevrons__c" />
      </button>
    </div>
  );

  return (
    <div ref={layerRef} className="home-v2-copy-layer" aria-hidden="false">
      {/* ─────────── THOUGHTFORM ─────────── */}
      {isMobile ? (
        // One vertically-centred copy column. Copy and the brandmark
        // never share the frame (copy fades out before the mark slides
        // in for Moment 2), so the whole block — bridge, title, body,
        // and the chevron scroll cue — reads as a single cohesive
        // paragraph centred in the viewport. (ADR-018 two-moment.)
        <div
          className="home-v2-copy-block home-v2-copy-block--thoughtform-left"
          data-world-anchor="thoughtform.leftCopy"
          data-anchor-origin="center"
        >
          <div className="home-v2-copy-bridge">{tf.bridge}</div>
          <h2 className="home-v2-copy-title" dangerouslySetInnerHTML={{ __html: tf.titleHtml }} />
          <p className="home-v2-copy-body" dangerouslySetInnerHTML={{ __html: tf.body1Html }} />
          <p className="home-v2-copy-body" dangerouslySetInnerHTML={{ __html: tf.body2Html }} />
          {mobileChevrons}
        </div>
      ) : (
        <div
          className="home-v2-copy-block home-v2-copy-block--thoughtform-left"
          data-world-anchor="thoughtform.leftCopy"
          data-anchor-origin="left-center"
        >
          <div className="home-v2-copy-bridge">{tf.bridge}</div>
          <h2 className="home-v2-copy-title" dangerouslySetInnerHTML={{ __html: tf.titleHtml }} />
          <p className="home-v2-copy-body" dangerouslySetInnerHTML={{ __html: tf.body1Html }} />
          <p className="home-v2-copy-body" dangerouslySetInnerHTML={{ __html: tf.body2Html }} />
          {cta}
        </div>
      )}

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

      {/* ─────────── NAVIGATE / ENCODE / BUILD ───────────
          Each section title STRADDLES its gate's central reticle: a
          frameless title just above + support line just below, near
          screen-centre, lit by the gold glow. No kicker (it doubled the
          title's verb), no card. The opening Thoughtform/setup
          composition above is untouched. */}
      {nav && <StationTitle content={nav} base="navigate" />}
      {enc && <StationTitle content={enc} base="diagnostic" />}

      {/* Encode primitive labels — framed tags on the four compass
          cardinals (Judgment / Taste / Way of working / Voice). */}
      {SHELL_PRIMITIVES.map((prim) => {
        const meta = PRIMITIVE_ANCHOR_META[prim.id];
        if (!meta) return null;
        return (
          <div
            key={`encode-prim-${prim.id}`}
            className={`home-v2-encode-primitive home-v2-encode-primitive--${meta.layout}`}
            data-world-anchor={`encode.primitive.${prim.id}`}
            data-anchor-origin={meta.origin}
          >
            <div className="home-v2-encode-primitive__frame">
              <span className="home-v2-encode-primitive__label">{prim.label}</span>
            </div>
          </div>
        );
      })}

      {bld && <StationTitle content={bld} base="intelligence" />}

      {/* Stack tier labels — dock with the Build funnel (Sources left,
          Surfaces right). Centre = Build title readout above. */}
      {stackSourcesLabel && (
        <div
          className="home-v2-stack-label home-v2-stack-label--sources"
          data-world-anchor="intelligence.sourcesLabel"
          data-anchor-origin="center"
        >
          <span
            className="home-v2-stack-label__leader home-v2-stack-label__leader--right"
            aria-hidden="true"
          />
          <div className="home-v2-copy-body-label">
            <span
              className="home-v2-copy-body-label__num"
              style={{ color: stackSourcesLabel.color }}
            >
              {stackSourcesLabel.ordinal}
            </span>
            <span
              className="home-v2-copy-body-label__name"
              style={{ color: stackSourcesLabel.color }}
            >
              {stackSourcesLabel.title}
            </span>
            <span className="home-v2-stack-label__sub">{stackSourcesLabel.sub}</span>
          </div>
        </div>
      )}
      {stackSurfacesLabel && (
        <div
          className="home-v2-stack-label home-v2-stack-label--surfaces"
          data-world-anchor="intelligence.surfacesLabel"
          data-anchor-origin="center"
        >
          <span
            className="home-v2-stack-label__leader home-v2-stack-label__leader--left"
            aria-hidden="true"
          />
          <div className="home-v2-copy-body-label">
            <span
              className="home-v2-copy-body-label__num"
              style={{ color: stackSurfacesLabel.color }}
            >
              {stackSurfacesLabel.ordinal}
            </span>
            <span
              className="home-v2-copy-body-label__name"
              style={{ color: stackSurfacesLabel.color }}
            >
              {stackSurfacesLabel.title}
            </span>
            <span className="home-v2-stack-label__sub">{stackSurfacesLabel.sub}</span>
          </div>
        </div>
      )}
    </div>
  );
}
