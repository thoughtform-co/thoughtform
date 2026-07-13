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
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { useCorridorOverlayStore } from "@/lib/stores/corridorOverlayStore";
import { REVEAL_SKILLS, SKILLS_BY_CARDINAL, type SkillCardinal } from "./reveals/revealData";

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

  // Overlay armed state (ADR-032 U1) — drives the cardinal / Web-app
  // affordances + `aria-expanded`. Read via selectors so a re-render here
  // never re-subscribes the tracker (its effect deps are stable); the
  // tracker keeps writing position/opacity every frame regardless.
  const armed = useCorridorOverlayStore((s) => s.armed);
  const expandedCardinal = useCorridorOverlayStore((s) => s.expandedCardinal);
  const expandedSurface = useCorridorOverlayStore((s) => s.expandedSurface);

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

  // Desktop CTA: links into #services — the corridor's actual exit
  // destination on production. `#intelligence-layer` was the v7
  // prototype's original target; that station was replaced by this
  // corridor (see CORRIDOR_REPLACED_STATIONS in app/(marketing)/page.tsx)
  // and no longer exists on the page, so the old href pointed nowhere.
  const cta = (
    <div className="home-v2-copy-cta-row">
      <a className="home-v2-copy-cta" href="#services">
        {tf.cta}
        {/* Three right-pointing chevrons with a sequential launch-pad
            glow (same runway cadence as the mobile scroll cue) — the
            glow sweeps left→right toward the brandmark portal on the
            right, reading as a docking-guide "this way in". */}
        <span className="home-v2-copy-cta__chevrons" aria-hidden="true">
          <span className="home-v2-copy-cta__chev" />
          <span className="home-v2-copy-cta__chev" />
          <span className="home-v2-copy-cta__chev" />
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

      {/* Encode primitive labels — diamond marker + thin leader +
          hairline-bordered caption on the four compass cardinals
          (Taste / Expertise / Craft / Voice). The marker
          sits at the cardinal node so the label visibly belongs to
          the gimbal, with a depth cue (`gateEncodePrimitive`)
          dimming the back-side cardinals as the sphere banks.
          (2026-06-10 polish — replaces the flat black-box treatment
          that read as a sticker on a 3D object.) */}
      {SHELL_PRIMITIVES.map((prim, idx) => {
        const meta = PRIMITIVE_ANCHOR_META[prim.id];
        if (!meta) return null;
        return (
          <div
            key={`encode-prim-${prim.id}`}
            className={`home-v2-encode-primitive home-v2-encode-primitive--${meta.layout}`}
            data-world-anchor={`encode.primitive.${prim.id}`}
            data-anchor-origin={meta.origin}
            // `gateEncodePrimitive` reads this attribute to apply the
            // per-cardinal cartridge stagger (each cardinal opacity-
            // locks as its fly-in arrives, not all four together). It
            // also writes `data-locked` / `data-backside` gating clicks.
            data-encode-cardinal-idx={idx}
          >
            <span className="home-v2-encode-primitive__marker" aria-hidden="true" />
            <span className="home-v2-encode-primitive__leader" aria-hidden="true" />
            {/* Frame is a button only while armed — the CSS opts pointer-
                events in on `.is-armed`, so the unarmed corridor is inert
                and looks byte-identical to the pre-overlay cardinal (single
                label, hairline frame — no sub line, no prominence bump).
                One cardinal's cluster expands at a time. */}
            <button
              type="button"
              className={`home-v2-encode-primitive__frame${armed ? " is-armed" : ""}`}
              disabled={!armed}
              aria-expanded={expandedCardinal === prim.id}
              aria-label={`${prim.label} — show skills`}
              onClick={() =>
                useCorridorOverlayStore.getState().toggleCardinal(prim.id as SkillCardinal)
              }
            >
              <span className="home-v2-encode-primitive__label">{prim.label}</span>
            </button>
          </div>
        );
      })}

      {/* Encode skill chips (ADR-032 U1) — one per skill, world-anchored in a
          fan around its cardinal (positions + bloom in sceneGeom). Non-
          interactive proof; opacity 0 unless the cardinal is expanded. */}
      {REVEAL_SKILLS.map((skill) => {
        const cluster = SKILLS_BY_CARDINAL[skill.cardinal];
        const slot = cluster.findIndex((s) => s.id === skill.id);
        return (
          <div
            key={`encode-skill-${skill.id}`}
            className="home-v2-encode-skill"
            data-world-anchor={`encode.skill.${skill.id}`}
            data-anchor-origin="center"
            data-skill-cardinal={skill.cardinal}
            data-skill-slot={slot}
            data-skill-cluster={cluster.length}
          >
            <span className="home-v2-encode-skill__tick" aria-hidden="true" />
            <span className="home-v2-encode-skill__title">{skill.title}</span>
            <span className="home-v2-encode-skill__status">{skill.statusLabel}</span>
          </div>
        );
      })}

      {isMobile && bld && <StationTitle content={bld} base="intelligence" />}

      {/* Stack v3 (2026-06-10) — group labels become COLUMN HEADERS.
          Each one anchors at the TOP of its column (Y = +1.45 in
          shell-local) with `bottom-{left,right}` origin so the
          header text sits ABOVE the column and grows INWARD toward
          the sphere. Replaces the v2 floating-below treatment that
          broke the column flow. */}
      {stackSourcesLabel && (
        <div
          className="home-v2-stack-label home-v2-stack-label--sources home-v2-stack-label--column"
          data-world-anchor="intelligence.sourcesLabel"
          data-anchor-origin="bottom-left"
        >
          <span className="home-v2-stack-label__rule" aria-hidden="true" />
          <div className="home-v2-stack-label__body">
            <span className="home-v2-stack-label__num" style={{ color: stackSourcesLabel.color }}>
              {stackSourcesLabel.ordinal}
            </span>
            <span className="home-v2-stack-label__name" style={{ color: stackSourcesLabel.color }}>
              {stackSourcesLabel.title}
            </span>
            <span className="home-v2-stack-label__sub">{stackSourcesLabel.sub}</span>
          </div>
        </div>
      )}
      {stackSurfacesLabel && (
        <div
          className="home-v2-stack-label home-v2-stack-label--surfaces home-v2-stack-label--column"
          data-world-anchor="intelligence.surfacesLabel"
          data-anchor-origin="bottom-right"
        >
          <span className="home-v2-stack-label__rule" aria-hidden="true" />
          <div className="home-v2-stack-label__body">
            <span className="home-v2-stack-label__num" style={{ color: stackSurfacesLabel.color }}>
              {stackSurfacesLabel.ordinal}
            </span>
            <span className="home-v2-stack-label__name" style={{ color: stackSurfacesLabel.color }}>
              {stackSurfacesLabel.title}
            </span>
            <span className="home-v2-stack-label__sub">{stackSurfacesLabel.sub}</span>
          </div>
        </div>
      )}

      {/* Per-item stack labels — one per source pip / surface tip.
          World positions come from `STACK_SOURCE_ITEMS` / `STACK_SURFACE_ITEMS`
          in sceneGeom.ts, which mirror ShellStack's pip/tip arrays exactly.
          Names are representative — counts intentionally need not match
          the diamond counts; the idea reads either way. */}
      {/* Flow pass (2026-06-10) — chips follow the pipeline's
          direction. SOURCE chips anchor at the pip with `left-center`
          and extend RIGHT toward the sphere (inputs feeding in).
          SURFACE chips also anchor `left-center` but at the TIP, so
          they extend RIGHT past the arrowhead, AWAY from the sphere —
          they are the destinations of the output lines, not labels
          hung back against the flow. Surface chips therefore extend
          outward; `getStackColumnLocalX` clamps the column inside the
          frustum with enough margin that a ~130px chip never reaches
          the HUD rail on supported desktop aspects. */}
      {STACK_SOURCE_ITEMS.map((item, idx) => (
        <div
          key={`stack-source-${item.id}`}
          className="home-v2-stack-item home-v2-stack-item--source"
          data-world-anchor={`intelligence.source.${item.id}`}
          data-anchor-origin="left-center"
          // `gateStackLabel` reads side + idx to sync each label's fade
          // to its canvas pip's per-row lock snap.
          data-stack-side="sources"
          data-stack-idx={idx}
        >
          <span className="home-v2-stack-item__chip">
            <span className="home-v2-stack-item__index">{String(idx + 1).padStart(2, "0")}</span>
            <span className="home-v2-stack-item__label">{item.label}</span>
          </span>
          <span className="home-v2-stack-item__leader" aria-hidden="true" />
        </div>
      ))}
      {STACK_SURFACE_ITEMS.map((item, idx) => {
        // The Web-app surface chip becomes the Build cascade's toggle when
        // armed (ADR-032 U1); the other five stay plain labels.
        const isWebApp = item.id === "web-app";
        const index = String(idx + 1).padStart(2, "0");
        return (
          <div
            key={`stack-surface-${item.id}`}
            className="home-v2-stack-item home-v2-stack-item--surface"
            data-world-anchor={`intelligence.surface.${item.id}`}
            data-anchor-origin="left-center"
            data-stack-side="surfaces"
            data-stack-idx={idx}
          >
            <span className="home-v2-stack-item__leader" aria-hidden="true" />
            {isWebApp ? (
              <button
                type="button"
                className={`home-v2-stack-item__chip home-v2-stack-item__chip--expandable${
                  armed ? " is-armed" : ""
                }`}
                disabled={!armed}
                aria-expanded={expandedSurface}
                aria-label={`${item.label} — show tools`}
                onClick={() => useCorridorOverlayStore.getState().toggleSurface()}
              >
                <span className="home-v2-stack-item__index">{index}</span>
                <span className="home-v2-stack-item__label">{item.label}</span>
                <span className="home-v2-stack-item__expand" aria-hidden="true">
                  +
                </span>
              </button>
            ) : (
              <span className="home-v2-stack-item__chip">
                <span className="home-v2-stack-item__index">{index}</span>
                <span className="home-v2-stack-item__label">{item.label}</span>
              </span>
            )}
          </div>
        );
      })}

      {/* Build tool cascade (ADR-032 U1) — one chip per production tool,
          world-anchored branching off the Web-app chip (positions + stagger
          in sceneGeom). `right-center` origin grows each chip inward so it
          can never reach the HUD rail. Opacity 0 unless expanded. */}
      {PROJECT_CASES.map((tool, idx) => (
        <div
          key={`build-tool-${tool.id}`}
          className="home-v2-build-tool"
          data-world-anchor={`build.tool.${tool.id}`}
          data-anchor-origin="right-center"
          data-tool-idx={idx}
        >
          <span className="home-v2-build-tool__chip">
            <span className="home-v2-build-tool__index">{tool.index}</span>
            <span className="home-v2-build-tool__name">{tool.codename}</span>
            <span className="home-v2-build-tool__tagline">{tool.tagline}</span>
          </span>
          <span className="home-v2-build-tool__elbow" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
