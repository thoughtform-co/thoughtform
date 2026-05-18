"use client";

import { useEffect } from "react";
import gsap from "gsap";
import {
  buildKeyframes,
  computeBrandmarkTransform,
  type BrandmarkKeyframe,
  type BrandmarkTransform,
  type JourneyContext,
  type KeyframeId,
} from "@/lib/brandmark/journey";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";
import { probeWebGL } from "@/lib/webgl/probe";
import type { BrandmarkActorHandle } from "../BrandmarkActor";

/**
 * useBrandmarkJourney — the scroll-driven journey hook for the v7
 * brandmark (ADR-013).
 *
 * Each scroll frame:
 *
 *   1. Resolve the live `JourneyContext` (root element, practice
 *      section, intelligence-layer section, reduced-motion).
 *   2. Call `computeBrandmarkTransform(scrollY, keyframes, ctx)` —
 *      a pure function that returns the brandmark's full state.
 *   3. Write the transform into `useBrandmarkJourneyStore`. Painters
 *      (`BrandmarkParticleStation`, `OrbitField`) read it
 *      imperatively via `getState()` inside `useFrame`.
 *   4. In SVG fallback mode (reduced motion or no WebGL), also pin
 *      the SVG `BrandmarkActor` to the transform's rect and write
 *      the `data-brand-on-*="parked"` dock attributes so the native
 *      source-owned dock glyphs (`.miss__brand-slot img` etc.) can
 *      paint via CSS gates at their parked positions.
 *
 * No CSS attribute writes per frame in particle mode. In particle
 * mode the global painter owns the brandmark cloud throughout the
 * journey; the native dock SVGs stay hidden by the
 * `[data-brandmark-mode="particle"]` CSS gate.
 */

export function useBrandmarkJourney(
  rootRef: React.RefObject<HTMLElement | null>,
  actorRef?: React.RefObject<BrandmarkActorHandle | null>
): void {
  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;
    if (typeof window === "undefined") return;

    // === Mode probe ===
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particleModeOK = !reduceMotion && probeWebGL();

    const store = useBrandmarkJourneyStore.getState();
    store.setMode(particleModeOK ? "particle" : "svg");

    // Set the global mode attribute ONCE. The CSS dock-visibility
    // rules read this to hide native dock glyphs in particle mode
    // (`[data-brandmark-mode="particle"] .tf-brandmark { opacity: 0 }`)
    // and show them in SVG mode when their parked attribute is set.
    document.documentElement.setAttribute(
      "data-brandmark-mode",
      particleModeOK ? "particle" : "svg"
    );

    // === Context closure resolver ===
    const resolveContext = (): JourneyContext => ({
      rootEl,
      practiceEl: rootEl.querySelector<HTMLElement>("#practice"),
      intelligenceEl:
        rootEl.querySelector<HTMLElement>("#intelligence-layer") ??
        rootEl.querySelector<HTMLElement>("#asking-gap"),
      reduceMotion,
    });

    let ctx = resolveContext();
    const keyframes = buildKeyframes(ctx);

    // === SVG-mode dock-attribute writers ===
    // Memoised so we don't churn setAttribute every scroll frame for
    // unchanged values.
    let lastBrandOnMissing: string | null = null;
    let lastBrandOnRail: string | null = null;
    let lastOrbitDocked: string | null = null;

    const setBrandOnMissing = (state: "false" | "parked") => {
      if (lastBrandOnMissing === state) return;
      lastBrandOnMissing = state;
      document.documentElement.setAttribute("data-brand-on-missing", state);
    };
    const setBrandOnRail = (state: "false" | "parked") => {
      if (lastBrandOnRail === state) return;
      lastBrandOnRail = state;
      document.documentElement.setAttribute("data-brand-on-rail", state);
    };
    const setOrbitDocked = (docked: boolean) => {
      const v = docked ? "true" : "false";
      if (lastOrbitDocked === v) return;
      lastOrbitDocked = v;
      const approach =
        rootEl.querySelector<HTMLElement>("#approach") ??
        rootEl.querySelector<HTMLElement>(".approach");
      approach?.setAttribute("data-orbit-docked", v);
    };

    // === Particle-mode parked handoff writers ===
    // `data-brand-parked-at="<keyframeId>"` on documentElement drives
    // the CSS gate that reveals the portal'd dock glyph at the
    // matching anchor (sigil / miss / substrate / rail / orbit) and
    // simultaneously fades out the fixed BrandmarkVectorActor. The
    // attribute is only set while the journey is fully parked at a
    // keyframe (`parkedAt !== null && opacity > 0.99`) — bookend
    // fades (sigil entrance, post-orbit exit) keep the actor as the
    // painter so the opacity ramp reads as one continuous animation.
    //
    // `--brandmark-shape-blend` mirrors `transform.shapeBlend` so the
    // substrate's stacked full + ring portal'd glyphs can crossfade
    // via CSS without any JS per-frame writes on each glyph.
    let lastBrandParkedAt: string | null = null;
    let lastBrandShapeBlend = -1;
    let lastBrandVectorOpacity = -1;

    const PARKED_OPACITY_THRESHOLD = 0.99;

    const setBrandParkedAt = (parkedAt: string | null) => {
      if (lastBrandParkedAt === parkedAt) return;
      lastBrandParkedAt = parkedAt;
      if (parkedAt == null) {
        document.documentElement.removeAttribute("data-brand-parked-at");
      } else {
        document.documentElement.setAttribute("data-brand-parked-at", parkedAt);
      }
    };

    const setBrandShapeBlend = (value: number) => {
      const rounded = Math.round(value * 1000) / 1000;
      if (Math.abs(rounded - lastBrandShapeBlend) < 0.001) return;
      lastBrandShapeBlend = rounded;
      document.documentElement.style.setProperty("--brandmark-shape-blend", rounded.toFixed(3));
    };

    // ADR-014 v5: mirror `transform.vectorOpacity` to a CSS variable
    // so the substrate-anchor portal'd dock glyphs (which use a
    // pure-CSS crossfade between full + ring topologies via
    // `--brandmark-shape-blend`) can also be dimmed by the HANDOFF
    // ramp. Without this, the substrate-ring dock glyph stays visible
    // at opacity 1 throughout the substrate window, fighting the new
    // R3F OrbitalCluster mid pillar.
    const setBrandVectorOpacity = (value: number) => {
      const rounded = Math.round(value * 1000) / 1000;
      if (Math.abs(rounded - lastBrandVectorOpacity) < 0.001) return;
      lastBrandVectorOpacity = rounded;
      document.documentElement.style.setProperty("--brandmark-vector-opacity", rounded.toFixed(3));
    };

    // === Sigil → miss orbital morph driver ===
    // The section 2 sigil's perfect concentric rings deform into the
    // section 3 elliptical orbits as the visitor scrolls from
    // #definition into #missing-layer. We write a single CSS variable
    // (`--orbit-morph`) on the landing root each frame; the
    // `.sigil__ring` rule interpolates each circle from identity to
    // its paired orbit's target (scaleX, scaleY, rotate) against this
    // value. See lib/celestial/orbits.ts for the canonical geometry
    // and the SIGIL_RING_MORPHS / MISS_ORBITS pairing.
    //
    // The morph is bidirectional: scrolling back up to #definition
    // ramps the rings back to concentric, so the compass re-forms.
    const sigilKf: BrandmarkKeyframe | undefined = keyframes.find((kf) => kf.id === "sigil");
    const missKf: BrandmarkKeyframe | undefined = keyframes.find((kf) => kf.id === "miss");

    const keyframeCentreY = (kf: BrandmarkKeyframe | undefined): number | null => {
      if (!kf) return null;
      const rect = kf.resolveRect(ctx);
      if (!rect || rect.width <= 0 || rect.height <= 0) return null;
      const frac = kf.parkViewportFrac ?? 0.5;
      return window.scrollY + rect.top + rect.height / 2 - window.innerHeight * frac;
    };

    let lastOrbitMorph = -1;
    const setOrbitMorph = (value: number) => {
      const clamped = value < 0 ? 0 : value > 1 ? 1 : value;
      const rounded = Math.round(clamped * 1000) / 1000;
      if (Math.abs(rounded - lastOrbitMorph) < 0.001) return;
      lastOrbitMorph = rounded;
      rootEl.style.setProperty("--orbit-morph", rounded.toFixed(3));
    };

    // === Sigil ring → diagnostic orbit STYLE morph ===
    // Companion to `--orbit-morph`. Whereas `--orbit-morph` deforms
    // the sigil rings INTO the orbit shapes (transform: scale/rotate),
    // `--orbit-style-morph` interpolates each ring's STROKE IDENTITY
    // — dash pattern, color, weight — from the sigil-side starting
    // style to the miss-side target style declared per ring in
    // landing.css (canonical tokens in lib/celestial/orbitStyles.ts).
    //
    // The style morph runs on a slightly delayed easing relative to
    // the geometry morph so the rings first reshape (geometry) and
    // then settle into the diagnostic dash identity (style). Without
    // the delay, the dash array and stroke colour change while the
    // ring is still mid-transform and the eye reads two simultaneous
    // animations instead of one continuous evolution.
    //
    // smoothstep(0.15, 0.95, t) — the eased curve: identity-pinned
    // for the first ~15% of the leg, ease in toward target across the
    // middle ~80%, full target at >= 95%.
    let lastOrbitStyleMorph = -1;
    const setOrbitStyleMorph = (value: number) => {
      const clamped = value < 0 ? 0 : value > 1 ? 1 : value;
      const rounded = Math.round(clamped * 1000) / 1000;
      if (Math.abs(rounded - lastOrbitStyleMorph) < 0.001) return;
      lastOrbitStyleMorph = rounded;
      rootEl.style.setProperty("--orbit-style-morph", rounded.toFixed(3));
    };

    const smoothstep = (t: number, start: number, end: number): number => {
      if (end <= start) return t >= end ? 1 : 0;
      if (t <= start) return 0;
      if (t >= end) return 1;
      const u = (t - start) / (end - start);
      return u * u * (3 - 2 * u);
    };

    const easeOrbitStyleMorph = (geometry: number): number => smoothstep(geometry, 0.15, 0.95);

    // === Halo -> orbit handoff scalars ===
    // Phased curves derived from the same geometry progress that drives
    // `--orbit-morph`. They split the conversion window into a halo
    // collapse phase and an orbit emergence phase so only one system
    // is visually dominant at a time:
    //
    //   geometry 0.00 .. 0.55  -> halo visible, particles drifting onto
    //                             4 elliptical lanes
    //   geometry 0.45 .. 0.95  -> orbit strokes emerge (pre-handoff)
    //   geometry 0.55 .. 1.00  -> anchor pips acquire
    //   geometry 0.65 .. 1.00  -> label pills resolve in
    //
    // The halo geometry morph itself runs the full 0..1 leg so by the
    // time it fades out its dots are already aligned with the ellipses
    // the orbit strokes are drawing on. Visitors below `geometry < 0.45`
    // see only the halo; above `geometry > 0.6` only the orbit system.
    const writeNumberVar = (() => {
      const last = new Map<string, number>();
      return (name: string, value: number) => {
        const clamped = value < 0 ? 0 : value > 1 ? 1 : value;
        const rounded = Math.round(clamped * 1000) / 1000;
        if (Math.abs(rounded - (last.get(name) ?? -1)) < 0.001) return;
        last.set(name, rounded);
        rootEl.style.setProperty(name, rounded.toFixed(3));
      };
    })();

    const applyHandoffMorph = (geometry: number) => {
      const haloFade = 1 - smoothstep(geometry, 0.0, 0.55);
      const missOrbitEmerge = smoothstep(geometry, 0.45, 0.95);
      const missAnchorEmerge = smoothstep(geometry, 0.55, 1.0);
      const missLabelEmerge = smoothstep(geometry, 0.65, 1.0);
      writeNumberVar("--halo-fade", haloFade);
      writeNumberVar("--miss-orbit-emerge", missOrbitEmerge);
      writeNumberVar("--miss-anchor-emerge", missAnchorEmerge);
      writeNumberVar("--miss-label-emerge", missLabelEmerge);
    };

    const applyOrbitMorph = (transform: BrandmarkTransform) => {
      // Hard-pin shortcuts at the bookends.
      const parked = transform.parkedAt;
      if (parked === "sigil") {
        setOrbitMorph(0);
        setOrbitStyleMorph(0);
        applyHandoffMorph(0);
        return;
      }
      if (parked === "miss" || parked === "substrate" || parked === "rail" || parked === "orbit") {
        setOrbitMorph(1);
        setOrbitStyleMorph(1);
        applyHandoffMorph(1);
        return;
      }
      // In transit. Read sigil + miss centres and interpolate against
      // the live scroll position.
      const sigilC = keyframeCentreY(sigilKf);
      const missC = keyframeCentreY(missKf);
      if (sigilC == null || missC == null || missC <= sigilC) {
        // First paint or anchors not yet measurable. Leave the var at
        // its last known value rather than thrashing.
        return;
      }
      const scrollY = window.scrollY;
      if (scrollY <= sigilC) {
        setOrbitMorph(0);
        setOrbitStyleMorph(0);
        applyHandoffMorph(0);
        return;
      }
      if (scrollY >= missC) {
        setOrbitMorph(1);
        setOrbitStyleMorph(1);
        applyHandoffMorph(1);
        return;
      }
      const geometry = (scrollY - sigilC) / (missC - sigilC);
      setOrbitMorph(geometry);
      setOrbitStyleMorph(easeOrbitStyleMorph(geometry));
      applyHandoffMorph(geometry);
    };

    const applyParticleMode = (transform: BrandmarkTransform) => {
      if (!particleModeOK) return;
      const parkedAt = transform.parkedAt;
      const isSectionOwnedDock = parkedAt === "sigil" || parkedAt === "miss";
      const fullyParked =
        parkedAt != null && (isSectionOwnedDock || transform.opacity > PARKED_OPACITY_THRESHOLD);
      setBrandParkedAt(fullyParked ? transform.parkedAt : null);
      setBrandShapeBlend(transform.shapeBlend);
      setBrandVectorOpacity(transform.vectorOpacity);
    };

    /** Apply SVG-mode side effects: pin the actor + write dock attrs.
     *  In particle mode this is a no-op (the global painter owns the
     *  visual; CSS hides docks via `data-brandmark-mode="particle"`). */
    const applySvgMode = (transform: BrandmarkTransform) => {
      if (particleModeOK) return;

      const parked = transform.parkedAt;

      // Dock attributes — drive the CSS gates that show native dock
      // SVGs at their parked positions.
      setBrandOnMissing(parked === "miss" ? "parked" : "false");
      setBrandOnRail(parked === "rail" ? "parked" : "false");
      setOrbitDocked(parked === "orbit");

      // Actor pin — the SVG actor paints during transit and at
      // stations without a native dock (orbit). For native-owned
      // stations (sigil/miss/rail) the CSS gate hides the actor
      // when parked, so the rect is still set but visually the
      // native SVG owns the paint.
      const actor = actorRef?.current;
      if (!actor) return;
      if (!transform.visible) {
        actor.hide();
        return;
      }
      // Convert RectLike → DOMRect for the actor's API (it expects
      // a real DOMRect).
      const r = transform.rect;
      const domRect = new DOMRect(r.left, r.top, r.width, r.height);
      // Hide the actor when parked at a native-owned dock so the
      // native SVG paints alone (Principle: one painter per pixel).
      // Orbit has no native dock — actor paints there.
      const useActor =
        transform.parkedAt === null || // transit
        transform.parkedAt === "orbit" || // orbit (no native dock)
        transform.parkedAt === "substrate"; // substrate (R3F in particle, actor in svg)
      if (useActor) {
        actor.pinToRect(domRect, transform.opacity, 1);
      } else {
        // Pin the actor to the rect at opacity 0 so it can re-emerge
        // instantly for the next transit (preserves the actor's
        // position state without painting it).
        actor.pinToRect(domRect, 0, 1);
      }
    };

    // === Per-frame computer ===
    let rafId = 0;
    const compute = () => {
      rafId = 0;
      ctx = resolveContext();
      const transform = computeBrandmarkTransform(window.scrollY, keyframes, ctx);
      if (transform == null) return;
      useBrandmarkJourneyStore.getState().setTransform(transform);
      applyParticleMode(transform);
      applySvgMode(transform);
      applyOrbitMorph(transform);
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(compute);
    };

    // === Event hookups ===
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") schedule();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) schedule();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);

    // Retry timers — portal'd glyphs mount after the React root
    // commits; anchor rects may not be measurable on first paint.
    const retryTimers = [
      window.setTimeout(schedule, 250),
      window.setTimeout(schedule, 1200),
      window.setTimeout(schedule, 3000),
    ];

    // Layout observers — re-compute when major sections resize
    // (font swap, late image load, dev-tools resize crossing the
    // mobile breakpoint).
    let roDebounce = 0;
    const ro = new ResizeObserver(() => {
      if (roDebounce) clearTimeout(roDebounce);
      roDebounce = window.setTimeout(schedule, 120);
    });
    const observeIfPresent = (selector: string) => {
      const el = rootEl.querySelector<HTMLElement>(selector);
      if (el) ro.observe(el);
    };
    observeIfPresent("#definition");
    observeIfPresent("#missing-layer");
    observeIfPresent("#intelligence-layer");
    observeIfPresent("#continuum");
    observeIfPresent("#practice");

    // === Initial compute ===
    schedule();

    // === Dev-only parity tracer ===
    let parityFrameCounter = 0;
    const parityUnsubscribe =
      process.env.NODE_ENV === "development"
        ? useBrandmarkJourneyStore.subscribe((state) => {
            parityFrameCounter++;
            if (parityFrameCounter % 30 !== 0) return;
            const t = state.transform;
            if (!t.visible) return;
            console.debug(
              "[brandmarkJourney]",
              `scrollY=${Math.round(window.scrollY)}`,
              `parked=${t.parkedAt ?? "transit"}`,
              `rect=${Math.round(t.rect.left)},${Math.round(t.rect.top)} ${Math.round(t.rect.width)}x${Math.round(t.rect.height)}`,
              `density=${t.density.toFixed(2)}`,
              `disp=${t.dispersion.toFixed(2)}`,
              `rotY=${(t.rotationY * 57.2958).toFixed(1)}deg`,
              `rings=${t.ringsActive ? "on" : "off"}`,
              `ringP=${t.ringProgress.toFixed(2)}`
            );
          })
        : null;

    // === Suppress GSAP warnings — actor pin uses gsap.set in SVG mode ===
    // gsap is already loaded by useSigilEntranceScrub; this is just
    // here to keep the import non-tree-shaken if SVG mode never runs.
    void gsap;

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", schedule);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      retryTimers.forEach((id) => clearTimeout(id));
      if (roDebounce) clearTimeout(roDebounce);
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      parityUnsubscribe?.();
      useBrandmarkJourneyStore.getState().reset();
      document.documentElement.removeAttribute("data-brandmark-mode");
      document.documentElement.removeAttribute("data-brand-on-missing");
      document.documentElement.removeAttribute("data-brand-on-rail");
      document.documentElement.removeAttribute("data-brand-parked-at");
      document.documentElement.style.removeProperty("--brandmark-shape-blend");
      document.documentElement.style.removeProperty("--brandmark-vector-opacity");
      rootEl.style.removeProperty("--orbit-morph");
      rootEl.style.removeProperty("--orbit-style-morph");
      rootEl.style.removeProperty("--halo-fade");
      rootEl.style.removeProperty("--miss-orbit-emerge");
      rootEl.style.removeProperty("--miss-anchor-emerge");
      rootEl.style.removeProperty("--miss-label-emerge");
      const approach =
        rootEl.querySelector<HTMLElement>("#approach") ??
        rootEl.querySelector<HTMLElement>(".approach");
      approach?.removeAttribute("data-orbit-docked");
      actorRef?.current?.hide();
    };
  }, [rootRef, actorRef]);
}

// Re-export keyframe type for consumers that need it.
export type { KeyframeId };
