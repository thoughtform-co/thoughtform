"use client";

import { useRef } from "react";
import { ARTIFACT_LABELS } from "@/components/landing/intelligence-artifact/artifactGeom";
import type { V7CorridorText } from "@/lib/v7-parse";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { stationById } from "@/lib/home-v2/corridorMap";
import {
  COPY_ANCHORS,
  STACK_SOURCE_ITEMS,
  STACK_SURFACE_ITEMS,
} from "./DepthGatewayScene/sceneGeom";
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
          Mobile-only: world-anchored straddle (title above + support
          below the reticle) so the centred portrait composition still
          ties to the brandmark. Desktop renders these as a flat 2D
          overlay via `CorridorStationHeaders` (mounted by
          `HomeCorridor`) so they don't skew with the camera or shift
          with aspect ratio. */}
      {isMobile && nav && <StationTitle content={nav} base="navigate" />}
      {isMobile && enc && <StationTitle content={enc} base="diagnostic" />}

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

      {isMobile && bld && <StationTitle content={bld} base="intelligence" />}

      {/* Stack tier GROUP labels — sit below the Build funnel streams
          (top corners are now owned by the Linear-style station header).
          Origin `top-center` so each label hangs from its anchor point
          centred under the lane / fan. The old dashed-leader hyphen is
          dropped — the per-item labels (Snowflake / Cursor / etc.)
          carry the inventory; this group label is just a section header. */}
      {stackSourcesLabel && (
        <div
          className="home-v2-stack-label home-v2-stack-label--sources home-v2-stack-label--group"
          data-world-anchor="intelligence.sourcesLabel"
          data-anchor-origin="top-center"
        >
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
          className="home-v2-stack-label home-v2-stack-label--surfaces home-v2-stack-label--group"
          data-world-anchor="intelligence.surfacesLabel"
          data-anchor-origin="top-center"
        >
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

      {/* Per-item stack labels — one per source pip / surface tip.
          World positions come from `STACK_SOURCE_ITEMS` / `STACK_SURFACE_ITEMS`
          in sceneGeom.ts, which mirror ShellStack's pip/tip arrays exactly.
          Source labels read leftward off the pip (`right-center`); surface
          labels read rightward off the tip (`left-center`). Names are
          representative — counts intentionally need not match the diamond
          counts; the idea reads either way. */}
      {STACK_SOURCE_ITEMS.map((item) => (
        <div
          key={`stack-source-${item.id}`}
          className="home-v2-stack-item home-v2-stack-item--source"
          data-world-anchor={`intelligence.source.${item.id}`}
          data-anchor-origin="right-center"
        >
          <span className="home-v2-stack-item__label">{item.label}</span>
        </div>
      ))}
      {STACK_SURFACE_ITEMS.map((item) => (
        <div
          key={`stack-surface-${item.id}`}
          className="home-v2-stack-item home-v2-stack-item--surface"
          data-world-anchor={`intelligence.surface.${item.id}`}
          data-anchor-origin="left-center"
        >
          <span className="home-v2-stack-item__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
