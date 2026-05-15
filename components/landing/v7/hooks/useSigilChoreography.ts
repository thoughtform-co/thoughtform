"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { BrandmarkActorHandle } from "../BrandmarkActor";
import {
  DEFAULT_TINT,
  useBrandmarkParticleStore,
  type StationKind as ParticleStationKind,
  type StationSnapshot,
} from "@/lib/stores/brandmarkParticleStore";

gsap.registerPlugin(ScrollTrigger);

/** Per-station particle defaults (ADR-011 density tiers).
 *
 *  - Dock stations (sigil / miss / rail / orbit) run at full
 *    density and zero dispersion: every particle paints, every
 *    particle sits exactly on its sampled home position. At the
 *    small dock-rect sizes (rail ≈ 56px, miss / orbit ≈ 140px,
 *    sigil ≈ live diagram) the rendered point size (3px) overlaps
 *    enough that the cloud reads as a filled mark — visually
 *    indistinguishable from the SVG within a few pixels.
 *
 *  - Backdrop (asking-gap) runs at the sparse "diagnostic" tier:
 *    fewer visible particles, organic dispersion. The brandmark
 *    dissolves into atmosphere so the Benedict Evans quote reads
 *    as the foreground.
 *
 *  Tune these in `/test/brandmark-particle` and update both this
 *  table and ADR-011 together when you change them. */
const PARTICLE_STATION_DEFAULTS: Record<ParticleStationKind, Omit<StationSnapshot, "rect">> = {
  sigil: { opacity: 1, density: 1, dispersion: 0, tint: DEFAULT_TINT as [number, number, number] },
  miss: { opacity: 1, density: 1, dispersion: 0, tint: DEFAULT_TINT as [number, number, number] },
  backdrop: {
    opacity: 1,
    density: 0.22,
    dispersion: 0.42,
    tint: DEFAULT_TINT as [number, number, number],
  },
  rail: { opacity: 1, density: 1, dispersion: 0, tint: DEFAULT_TINT as [number, number, number] },
  orbit: { opacity: 1, density: 1, dispersion: 0, tint: DEFAULT_TINT as [number, number, number] },
};

/** Probe WebGL feasibility. Used to gate the store into `"particle"`
 *  mode; if WebGL is unavailable the SVG fallback paints unchanged. */
function probeWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const ctx =
      c.getContext("webgl2") ?? c.getContext("webgl") ?? c.getContext("experimental-webgl");
    return ctx != null;
  } catch {
    return false;
  }
}

/**
 * useSigilChoreography — Continuous scroll-driven brandmark journey
 *
 * One physical brandmark traverses five stations as the user scrolls:
 *
 *   Hero (hidden) → SIGIL → MISS → BACKDROP → RAIL → ORBIT → (fade) → Hidden
 *
 * Two render modes:
 *   - DOCK (parked): at sigil / miss / rail (native source-owned), the
 *     native DOM dock paints; the fixed `BrandmarkActor` stays
 *     positioned at the dock's rect but is hidden via CSS opacity
 *     (`[data-brand-on-missing="parked"]` / `[data-brand-on-rail=
 *     "parked"]` rules in `landing.css`). The visible brandmark rides
 *     inside the section's DOM so it scrolls naturally — no fixed-
 *     position jiggle while the visitor reads.
 *   - LIFT (transit / backdrop / orbit): the fixed actor paints at a
 *     rect that interpolates between two live anchor rects. Opacity
 *     ramps via the same lerp. Backdrop and orbit are technically
 *     "dock" states but have no native paint, so the actor owns the
 *     visible mark there directly.
 *
 * The journey is driven by a single rAF-throttled scroll handler that
 * computes the brandmark's state from `scrollY` and live anchor rects
 * every frame. There are no per-leg `ScrollTrigger` windows — the
 * journey is a pure function of where the user is in the document.
 * This replaces the previous v3 multi-trigger choreography (sigil →
 * miss, miss → backdrop, etc.) with one journey function whose dock
 * attributes and actor opacity are deterministic from `scrollY`.
 *
 * Invariants preserved from ADR-010 v3:
 *   1. Section 02 source-owned (native `.sigil__mark` paints during
 *      reading; actor stays opacity 0).
 *   2. Source-owned park stations (`.sigil__mark`, `.miss__brand-slot`,
 *      `.crail__brand`) — CSS gates `[data-brand-on-X="parked"]` on
 *      the attribute written by this hook on BOTH `rootRef` and
 *      `documentElement` (the fixed actor is rendered as a sibling of
 *      the v7 root).
 *   3. Live rects per frame for moving / sticky targets — same as
 *      before. The orbit's sticky engagement is handled naturally
 *      because we read `getBoundingClientRect()` every frame.
 *   4. Hero refresh guard — `scrollY < 4` short-circuits the journey
 *      so a refresh on the hero never pins to a downstream station.
 *   5. `#hudBrandmark` is no longer a destination — unchanged.
 *
 * Changes from ADR-010 v3 (ADR-010 v4 to follow):
 *   - The five per-leg GSAP timelines (`missTl`, `backdropTl`,
 *     `railEntryTl`, `practiceEntryTl`, `practiceExitTl`) collapse
 *     into one continuous scroll handler. `onLeave` / `onLeaveBack`
 *     settlers disappear — fast scroll cannot outrun the journey
 *     because the journey is recomputed from `scrollY` directly each
 *     frame.
 *   - `scrub: 0.4` lag is gone. The brandmark tracks scroll without
 *     easing latency. A small CSS `transition: opacity 120ms` on
 *     `.tf-brandmark-actor` smooths the dock ↔ transit crossfade
 *     when the parked-attribute CSS gate flips.
 *   - The state-flag soup (`missArmed`, `parkedAtMiss`, etc.) is
 *     replaced by the implicit state encoded in `scrollY` relative
 *     to the live station centers.
 *
 * The entrance scrub for the sigil's internal diagram elements
 * (`.sigil__orbits`, `.sigil__halo`, `.sigil__mark`, `.sigil__cap`,
 * `.sigil__legend`, `.tri__left`) is preserved as a separate
 * `ScrollTrigger` — it animates the diagram's reveal, which is a
 * different concern from the brandmark's position on the journey.
 */

type StationKind = "sigil" | "miss" | "backdrop" | "rail" | "orbit";

interface Station {
  kind: StationKind;
  /** Lazily resolved anchor element. Re-queried each call because
   *  React portals (BrandmarkSystem) may re-mount glyphs into the
   *  anchor slots after the parser has stripped raster placeholders. */
  anchor: () => HTMLElement | null;
  /** Opacity when parked at this station. */
  opacity: number;
  /** Whether a native source-owned dock paints while parked here.
   *  When true, CSS hides the fixed actor via
   *  `[data-brand-on-<kind>="parked"]` so the native element inside
   *  the anchor slot paints; the fixed actor stays positioned at the
   *  anchor's rect for an instant takeover when the next transit
   *  arms. When false, the actor itself paints (backdrop, orbit). */
  nativeOwns: boolean;
}

/** Park zone occupies this fraction of each inter-station segment at
 *  each end. With `0.32`, the breakdown per segment is:
 *
 *      0.00 ─ 0.32  parked at `from`         (reading the prev section)
 *      0.32 ─ 0.68  transit                  (visible travel between)
 *      0.68 ─ 1.00  parked at `to`           (reading the next section)
 *
 *  Tuned so the user gets a comfortable reading window at each
 *  section AND a noticeable transit beat between sections.
 */
const PARK_FRAC = 0.32;

/** Pre-first-station fade-in window and post-last-station fade-out
 *  window, expressed as a fraction of viewport height. */
const FADE_IN_FRAC = 0.6;
const FADE_OUT_FRAC = 0.6;

/** Hero short-circuit threshold. Any `scrollY < HERO_GUARD_PX` is
 *  treated as the hero state — brandmark hidden, native sigil owns
 *  per the entrance scrub. */
const HERO_GUARD_PX = 4;

export function useSigilChoreography(
  rootRef: React.RefObject<HTMLElement | null>,
  actorRef: React.RefObject<BrandmarkActorHandle | null>
) {
  useEffect(() => {
    const docEl = rootRef.current;
    if (!docEl) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // === Brandmark particle mode probe ===
    // Set the store's render mode at hook init. The mode flag drives
    // two things:
    //   - whether `BrandmarkParticleCanvas` mounts inside
    //     `BrandmarkSystem` (it only mounts when mode === "particle");
    //   - whether this hook writes per-station snapshots to the store
    //     (skipped entirely in "svg" mode so the existing SVG actor
    //     paints exactly as it did pre-ADR-011).
    // Probe is one-shot — WebGL availability and reduced-motion
    // preference don't typically change during a session.
    const particleModeOK = !reduceMotion && probeWebGL();
    const particleStore = useBrandmarkParticleStore.getState();
    particleStore.setMode(particleModeOK ? "particle" : "svg");

    // === DOM resolution ===
    const defEl = docEl.querySelector<HTMLElement>("#definition");
    const missEl = docEl.querySelector<HTMLElement>("#missing-layer");
    const askEl = docEl.querySelector<HTMLElement>("#asking-gap");
    const contEl = docEl.querySelector<HTMLElement>("#continuum");
    const practiceEl = docEl.querySelector<HTMLElement>("#practice");
    const approachEl =
      docEl.querySelector<HTMLElement>("#approach") ??
      docEl.querySelector<HTMLElement>(".approach");

    // Sigil internals (entrance scrub — separate from the journey)
    const sigilOrbits = docEl.querySelector<HTMLElement>(".sigil__orbits");
    const sigilHalo = docEl.querySelector<HTMLElement>(".sigil__halo");
    const sigilMark = docEl.querySelector<HTMLElement>(".sigil__mark");
    const sigilCap = docEl.querySelector<HTMLElement>(".sigil__cap");
    const sigilLegend = docEl.querySelector<HTMLElement>(".sigil__legend");
    const triLeft = docEl.querySelector<HTMLElement>(".tri__left");

    if (!defEl || !contEl || !sigilMark || !practiceEl) return;

    // Brandmark anchors — lazily resolved so the journey works after
    // late layout (admin overlays, portal re-mounts, etc.)
    const getMissBrand = () => missEl?.querySelector<HTMLElement>(".miss__brand-slot") ?? null;
    const getAskAnchor = () => askEl?.querySelector<HTMLElement>(".ask__brandmark-anchor") ?? null;
    const getCrailBrand = () => contEl.querySelector<HTMLElement>(".crail__brand") ?? null;
    const getOrbitMark = (): HTMLElement | null =>
      approachEl?.querySelector<HTMLElement>(".approach__orbit__mark") ??
      docEl.querySelector<HTMLElement>(".approach__orbit__mark");

    const actor = () => actorRef.current;

    // === Station list (ordered along the journey) ===
    const stations: Station[] = [
      { kind: "sigil", anchor: () => sigilMark, opacity: 1, nativeOwns: true },
      { kind: "miss", anchor: getMissBrand, opacity: 1, nativeOwns: true },
      { kind: "backdrop", anchor: getAskAnchor, opacity: 0.08, nativeOwns: false },
      { kind: "rail", anchor: getCrailBrand, opacity: 1, nativeOwns: true },
      { kind: "orbit", anchor: getOrbitMark, opacity: 1, nativeOwns: false },
    ];

    // === Dock attribute writers ===
    // Tri-state attrs on BOTH the v7 root AND `documentElement` so the
    // descendant selectors in `landing.css` reach the fixed actor
    // (which is rendered as a sibling of the v7 root, not a
    // descendant). Memoised so we don't trigger a setAttribute every
    // scroll frame for unchanged values.
    let lastBrandOnRail: string | null = null;
    let lastBrandOnMissing: string | null = null;
    let lastOrbitDocked: string | null = null;

    const setBrandOnRail = (state: "false" | "true" | "parked") => {
      if (lastBrandOnRail === state) return;
      lastBrandOnRail = state;
      docEl.setAttribute("data-brand-on-rail", state);
      document.documentElement.setAttribute("data-brand-on-rail", state);
    };
    const setBrandOnMissing = (state: "false" | "true" | "parked") => {
      if (lastBrandOnMissing === state) return;
      lastBrandOnMissing = state;
      docEl.setAttribute("data-brand-on-missing", state);
      document.documentElement.setAttribute("data-brand-on-missing", state);
    };
    const setOrbitDocked = (docked: boolean) => {
      const v = docked ? "true" : "false";
      if (lastOrbitDocked === v) return;
      lastOrbitDocked = v;
      approachEl?.setAttribute("data-orbit-docked", v);
    };

    // === Particle gate attributes ===
    // Three CSS gates set on documentElement coordinate the SVG, the
    // particle field, and the SVG actor:
    //
    //   - `data-brandmark-mode="particle"` — global flag set when
    //     the store mode resolves to particle. CSS reads this to
    //     hide the native dock glyphs (sigil / miss / rail / orbit)
    //     at their parked states by default.
    //   - `data-brand-particle-backdrop="true"` — set when the
    //     particle canvas wrapper should be visible (fade 0 → 1).
    //     True for every painted moment (every station + every
    //     transit + every fade-in/out window).
    //   - `data-brand-svg-dock="<kind>"` — set when the choreography
    //     is parked at a full-density dock (density ≥
    //     `SVG_DOCK_THRESHOLD`). CSS reads this to OVERRIDE the
    //     particle-mode hide and re-show the portal'd SVG glyph at
    //     that anchor. The particle station's `opacity` is
    //     simultaneously written to 0 so the cloud doesn't
    //     double-paint with the SVG. Below the threshold the SVG
    //     stays hidden and the particle field paints.
    //
    // This SVG-overlay-at-full-density approach makes dock states
    // truly pixel-perfect (it's literally the SVG file). The
    // particle field handles every other moment — entrance, transit,
    // backdrop, and post-orbit fade-out — where its texture is the
    // point of the visual.
    //
    // All three attribute writes are memoised so we don't
    // setAttribute every scroll frame for unchanged values.
    let lastBrandmarkMode: string | null = null;
    const setBrandmarkMode = (mode: "particle" | "svg") => {
      if (lastBrandmarkMode === mode) return;
      lastBrandmarkMode = mode;
      document.documentElement.setAttribute("data-brandmark-mode", mode);
    };
    setBrandmarkMode(particleModeOK ? "particle" : "svg");

    let lastBackdropGate: string | null = null;
    const setParticleBackdropGate = (active: boolean) => {
      const v = active ? "true" : "false";
      if (lastBackdropGate === v) return;
      lastBackdropGate = v;
      document.documentElement.setAttribute("data-brand-particle-backdrop", v);
    };

    /** SVG glyph crossover threshold. When a parked station's density
     *  meets or exceeds this, the choreography hands the paint off to
     *  the portal'd SVG glyph at that anchor (pixel-perfect at rest)
     *  and silences the particle station. Set just below 1.0 so the
     *  swap is robust to floating-point noise in lerped density. */
    const SVG_DOCK_THRESHOLD = 0.95;

    let lastSvgDock: string | null = null;
    /** Anchor key for the portal'd glyph (BrandmarkSystem.tsx
     *  `[data-brand-anchor]`). The "missing" station uses anchor
     *  key "missing"; everything else matches its station kind. */
    const svgDockAnchorKey = (kind: ParticleStationKind | null): string => {
      if (kind === "miss") return "missing";
      return kind ?? "none";
    };
    const setSvgDock = (kind: ParticleStationKind | null) => {
      const v = kind == null ? "none" : svgDockAnchorKey(kind);
      if (lastSvgDock === v) return;
      lastSvgDock = v;
      if (v === "none") {
        document.documentElement.removeAttribute("data-brand-svg-dock");
      } else {
        document.documentElement.setAttribute("data-brand-svg-dock", v);
      }
    };

    /** Last station the particle field painted, so we can clear it
     *  when the journey moves on. Phase B replaces the simpler
     *  "backdrop only" flag from Phase A. */
    let lastParticleStation: ParticleStationKind | null = null;

    /** Write or clear a station snapshot in the particle store. The
     *  shared `BrandmarkParticleCanvas` reads each station's
     *  snapshot every rAF (via `getState()`) and projects the
     *  particles into the given rect. Skipped when the mode probe
     *  rejected particles — in that case the SVG actor + native
     *  dock glyphs remain the only painters.
     *
     *  `particleOpacityOverride` lets the dock-park caller silence
     *  the particle render (opacity 0) while still pinning the rect,
     *  so the SVG glyph at the same anchor can paint cleanly without
     *  a particle cloud overlapping it. The mesh's
     *  `VISIBILITY_EPSILON` check makes opacity 0 a true no-draw on
     *  the GPU side. */
    const writeStationSnapshot = (
      kind: ParticleStationKind,
      rect: DOMRect | null,
      particleOpacityOverride?: number
    ) => {
      if (!particleModeOK) return;
      const store = useBrandmarkParticleStore.getState();
      // Clear the previous station's snapshot if we're switching.
      if (lastParticleStation && lastParticleStation !== kind) {
        store.setStation(lastParticleStation, null);
      }
      if (!rect) {
        store.setStation(kind, null);
        lastParticleStation = null;
        setParticleBackdropGate(false);
        return;
      }
      const defaults = PARTICLE_STATION_DEFAULTS[kind];
      const snap: StationSnapshot = {
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        ...defaults,
        opacity: particleOpacityOverride !== undefined ? particleOpacityOverride : defaults.opacity,
      };
      store.setStation(kind, snap);
      lastParticleStation = kind;
      // The canvas wrapper's CSS fade is keyed off the backdrop gate
      // attribute. Set it true whenever ANY station is painting via
      // particles so the canvas is visible across all parked docks
      // (sigil / miss / backdrop / rail / orbit) — not just backdrop.
      setParticleBackdropGate(true);
    };

    /** Convenience: clear all station snapshots (transit, hero,
     *  post-orbit fade). */
    const clearAllStationSnapshots = () => {
      if (!particleModeOK) return;
      const store = useBrandmarkParticleStore.getState();
      store.clearStations();
      lastParticleStation = null;
      setParticleBackdropGate(false);
      setSvgDock(null);
    };

    /** Set the dock attribute cluster to match a parked station (or
     *  none, for transit / sigil / backdrop). `data-brand-on-missing`
     *  and `data-brand-on-rail` are written together so only the
     *  correct dock's CSS gate is active. */
    const setDockAttrs = (parkedKind: StationKind | null) => {
      if (parkedKind === "miss") {
        setBrandOnMissing("parked");
        setBrandOnRail("false");
        setOrbitDocked(false);
      } else if (parkedKind === "rail") {
        setBrandOnRail("parked");
        setBrandOnMissing("false");
        setOrbitDocked(false);
      } else if (parkedKind === "orbit") {
        setOrbitDocked(true);
        setBrandOnRail("false");
        setBrandOnMissing("false");
      } else {
        // Sigil / backdrop / transit / hidden: no dock CSS gate
        setBrandOnRail("false");
        setBrandOnMissing("false");
        setOrbitDocked(false);
      }
    };

    // === Native sigil opacity (managed separately from the actor) ===
    // The sigil is part of section 02's diagram. The entrance scrub
    // animates its opacity during the reveal; the journey takes over
    // by setting it to 0 when transiting away, and back to 1 when
    // parked at sigil after a reverse-scroll.
    let lastSigilOpacity: number | null = null;
    const setSigilVisible = (visible: boolean) => {
      const target = visible ? 1 : 0;
      if (lastSigilOpacity === target) return;
      lastSigilOpacity = target;
      gsap.set(sigilMark, { opacity: target, "--frame-opacity": target });
    };

    // === Math helpers ===
    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpRect = (a: DOMRect, b: DOMRect, t: number): DOMRect =>
      new DOMRect(
        lerp(a.left, b.left, t),
        lerp(a.top, b.top, t),
        lerp(a.width, b.width, t),
        lerp(a.height, b.height, t)
      );
    /** power3.inOut equivalent — gentle ease at both ends. */
    const easeInOut = (t: number) => {
      if (t < 0.5) return 4 * t * t * t;
      const f = 2 * t - 2;
      return 0.5 * f * f * f + 1;
    };

    /** Read a station's unscaled rect. For the sigil we mirror the v3
     *  `readSigilRect` logic — vertical from the live rect's centre,
     *  horizontal from the (untransformed) parent — so the entrance
     *  `scale` tween on the sigil internals doesn't wobble the actor
     *  rect at the start of the journey. Other anchors don't have an
     *  entrance scale tween, so a plain `getBoundingClientRect` is
     *  sufficient. */
    const readStationRect = (s: Station): DOMRect | null => {
      const el = s.anchor();
      if (!el) return null;
      const liveRect = el.getBoundingClientRect();
      if (liveRect.width <= 0 || liveRect.height <= 0) return null;
      if (s.kind === "sigil") {
        const sigilH = el.offsetHeight;
        const sigilW = el.offsetWidth;
        if (sigilH <= 0 || sigilW <= 0) return liveRect;
        const verticalCentre = liveRect.top + liveRect.height / 2;
        const unscaledTop = verticalCentre - sigilH / 2;
        const parent = el.parentElement;
        let unscaledLeft = liveRect.left;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          if (parentRect.width > 0) {
            unscaledLeft = parentRect.left + (parentRect.width - sigilW) / 2;
          }
        }
        return new DOMRect(unscaledLeft, unscaledTop, sigilW, sigilH);
      }
      return liveRect;
    };

    /** Compute the scrollY at which a station's anchor centre sits at
     *  viewport centre. For non-sticky anchors this is a stable scroll
     *  position; for sticky anchors (the orbit's sticky parent) the
     *  return value advances with `scrollY` during sticky engagement,
     *  which keeps the journey "parked at orbit" across the entire
     *  practice section — correct behaviour. */
    const stationCenterY = (s: Station): number | null => {
      const el = s.anchor();
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
    };

    /** Park the brandmark at a station: pin the actor at the anchor's
     *  rect with the station's parked opacity, sync dock attributes,
     *  and adjust the native sigil opacity if this is (or isn't) the
     *  sigil station. */
    const parkAt = (s: Station) => {
      const a = actor();
      if (!a) return;
      const rect = readStationRect(s);
      if (!rect) return;

      a.pinToRect(rect, s.opacity, 1);
      a.setHudOutline(false);

      // Native sigil owns the paint when (and only when) parked at sigil.
      setSigilVisible(s.kind === "sigil");

      // Dock CSS gate: only set parked attr for native-owns stations.
      // Backdrop and orbit don't have native docks, so no attr to set
      // (the actor's inline opacity paints).
      setDockAttrs(s.nativeOwns ? s.kind : s.kind === "orbit" ? "orbit" : null);

      // Particle snapshot + SVG dock handoff.
      //
      // Two cases:
      //
      //   - Full-density dock (sigil / miss / rail / orbit, density
      //     1.0): hand off to the portal'd SVG glyph at this anchor
      //     so the dock state is pixel-perfect. The particle station
      //     is silenced (opacity 0) so it doesn't double-paint.
      //
      //   - Low-density park (backdrop, density 0.22): particles are
      //     the visual — write the snapshot as usual, clear the SVG
      //     dock attribute so no SVG glyph paints behind the cloud.
      //
      // The crossover is governed by `SVG_DOCK_THRESHOLD`. A 200ms
      // CSS opacity transition on the portal'd glyphs smooths the
      // particle → SVG crossfade at park entry.
      const defaults = PARTICLE_STATION_DEFAULTS[s.kind];
      if (defaults.density >= SVG_DOCK_THRESHOLD) {
        setSvgDock(s.kind);
        writeStationSnapshot(s.kind, rect, /* particleOpacityOverride */ 0);
      } else {
        setSvgDock(null);
        writeStationSnapshot(s.kind, rect);
      }
    };

    /** Mid-transit lerp between two stations at journey-local t in
     *  [0, 1]. Native sigil is hidden (actor paints alone), dock
     *  attrs cleared so neither parked CSS gate steals the paint. */
    const transit = (from: Station, to: Station, t: number) => {
      const a = actor();
      if (!a) return;
      const fromRect = readStationRect(from);
      const toRect = readStationRect(to);
      if (!fromRect || !toRect) return;

      const eased = easeInOut(t);
      const rect = lerpRect(fromRect, toRect, eased);
      const opacity = lerp(from.opacity, to.opacity, eased);

      a.pinToRect(rect, opacity, 1);
      a.setHudOutline(false);

      // Sigil is offscreen / replaced; actor owns the paint here.
      setSigilVisible(false);
      // No dock parked attr during transit; transit-state attrs
      // ("true") tell the rail reticle and miss native dock to hide
      // so the actor's lerp owns the visible mark.
      if (from.kind === "miss" || to.kind === "miss") {
        setBrandOnMissing("true");
      } else {
        setBrandOnMissing("false");
      }
      if (from.kind === "rail" || to.kind === "rail") {
        setBrandOnRail("true");
      } else {
        setBrandOnRail("false");
      }
      setOrbitDocked(false);
      // Transit always uses the particle field — never the SVG glyph
      // — because dispersion makes the cloud scatter mid-flight,
      // which the static SVG can't represent.
      setSvgDock(null);
      // Phase C: write a TRANSIT snapshot to the `to` station's
      // slot so particles keep painting through the whole segment.
      // The rect lerps linearly between from / to (already eased
      // via `lerpRect(fromRect, toRect, eased)` above), and the
      // density / dispersion interpolate between the two stations'
      // ADR-011 tier defaults. We also add a bell-curve dispersion
      // bump peaking at t=0.5 so the cloud "scatters" mid-flight
      // and re-coheres at the destination — the visual dispersion
      // choreography promised in ADR-011 § Phase C.
      if (particleModeOK) {
        const fromDefaults = PARTICLE_STATION_DEFAULTS[from.kind];
        const toDefaults = PARTICLE_STATION_DEFAULTS[to.kind];
        // Bell curve peaks at t=0.5, returns to 0 at t=0 and t=1.
        // Combined with the lerped per-station baseline so the
        // transit-into-backdrop already starts loosening before
        // the cloud arrives at the parked-at-backdrop density tier.
        const bump = Math.sin(Math.PI * t) * 0.45;
        const baseDispersion = lerp(fromDefaults.dispersion, toDefaults.dispersion, eased);
        const transitSnap: StationSnapshot = {
          rect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          },
          opacity: 1,
          density: lerp(fromDefaults.density, toDefaults.density, eased),
          dispersion: Math.min(1.5, baseDispersion + bump),
          tint: fromDefaults.tint,
        };
        const store = useBrandmarkParticleStore.getState();
        if (lastParticleStation && lastParticleStation !== to.kind) {
          store.setStation(lastParticleStation, null);
        }
        store.setStation(to.kind, transitSnap);
        lastParticleStation = to.kind;
        setParticleBackdropGate(true);
      }
    };

    /** Hide the brandmark entirely (hero, pre-sigil fade-in zone,
     *  post-orbit fade-out zone). Returns the native sigil to its
     *  default visible state so the entrance scrub can own its
     *  opacity in section 02 reading state. */
    const hideBrandmark = () => {
      actor()?.hide();
      // Don't touch sigil opacity — the entrance scrub owns it in the
      // pre-sigil zone, and after entrance completes the sigil is at
      // opacity 1 naturally.
      setDockAttrs(null);
      // Hero / pre-sigil / post-orbit zones don't paint particles
      // either; `clearAllStationSnapshots` also clears the SVG dock
      // attribute so the portal'd glyph fades out in lockstep.
      clearAllStationSnapshots();
    };

    /** The continuous journey function. Called from a rAF-throttled
     *  scroll handler. Computes brandmark state from `scrollY` alone;
     *  no state-flag soup, no race conditions between triggers. */
    const applyJourney = (scrollY: number) => {
      // Hero guard — never pin to a downstream station while at the
      // very top of the page (handles refresh-with-restored-scroll
      // and first-paint race where ScrollTrigger.refresh() fires
      // before the user has scrolled).
      if (scrollY < HERO_GUARD_PX) {
        hideBrandmark();
        return;
      }

      const centers = stations.map(stationCenterY);
      // Bail if any anchor isn't measurable yet. The retry timers
      // (250 / 1200 / 3000ms) and ResizeObserver will call back once
      // the layout settles.
      if (centers.some((c) => c == null)) return;
      const c = centers as number[];
      const vh = window.innerHeight;

      // === Reduced motion: hard-pin to the nearest station ===
      if (reduceMotion) {
        let nearest = 0;
        let bestDist = Math.abs(scrollY - c[0]);
        for (let k = 1; k < stations.length; k++) {
          const d = Math.abs(scrollY - c[k]);
          if (d < bestDist) {
            bestDist = d;
            nearest = k;
          }
        }
        // Pre-sigil and post-orbit zones still hide (no point pinning
        // off-screen).
        if (scrollY < c[0] - vh * FADE_IN_FRAC) {
          hideBrandmark();
          return;
        }
        if (scrollY > c[stations.length - 1] + vh * FADE_OUT_FRAC) {
          hideBrandmark();
          return;
        }
        parkAt(stations[nearest]);
        return;
      }

      // === Pre-first-station zone ===
      if (scrollY < c[0]) {
        const fadeStart = c[0] - vh * FADE_IN_FRAC;
        if (scrollY < fadeStart) {
          hideBrandmark();
          return;
        }
        // Fade-in window into the sigil dock.
        //
        // In SVG mode the native sigil source paints, animated 0 → 1 by
        // the entrance scrub (a separate GSAP timeline tied to
        // `#definition top 85% → top 35%`), so we just keep the actor
        // hidden and let the diagram's own opacity drive the visual.
        //
        // In particle mode the entrance scrub still runs (it owns the
        // halo / orbits / cap / legend reveal), but the
        // `[data-brandmark-mode="particle"]` CSS gate forces the
        // `.sigil__mark > svg` portal'd glyph to opacity 0 by default
        // so the particle field can paint instead.
        //
        // ADR-011 amendment (2026-05-15): hand off to the canonical
        // SVG glyph during the entrance fade-in band as well, rather
        // than writing a sigil snapshot with a per-particle opacity
        // ramp. The original design had particles "assemble" the
        // mark here, but alpha-blending overlapping particles at
        // intermediate opacities produces visible stipple — at
        // density 1.0 + dispersion 0 the cloud should read as the
        // filled silhouette, but `gl_FragColor.a < 1` makes each
        // grain individually visible. The diagram's own entrance
        // scrub (`#definition top 85% → top 35%`) already animates
        // `.sigil__mark` opacity 0 → 1 smoothly, so flipping the
        // SVG dock attribute on is enough to render a clean vector
        // fade-in. Particle motion is now reserved for transit
        // between stations (where dispersion is the visible story);
        // within-section entries always use the SVG.
        if (particleModeOK) {
          const rect = readStationRect(stations[0]);
          if (rect) {
            setSvgDock("sigil");
            // Clear any leftover particle station so the field
            // doesn't double-paint behind the SVG.
            if (lastParticleStation) {
              const store = useBrandmarkParticleStore.getState();
              store.setStation(lastParticleStation, null);
              lastParticleStation = null;
            }
            setParticleBackdropGate(false);
            // Actor stays hidden; the entrance scrub owns the
            // `.sigil__mark` wrapper's opacity through this band.
            actor()?.hide();
            // Don't force `setSigilVisible` either way — the GSAP
            // entrance scrub is scrubbing `.sigil__mark` opacity
            // 0 → 1 across `#definition top 85% → top 35%`. Setting
            // it to 1 here would override the scrub and pop the
            // mark in instantly; setting it to 0 would override the
            // scrub the other way and hide the mark we want to
            // show. Leaving it alone lets the scrub own the band.
            setDockAttrs(null);
          } else {
            hideBrandmark();
          }
          return;
        }
        // SVG-mode fallback: hide the actor; the entrance scrub paints
        // the native sigil source.
        hideBrandmark();
        return;
      }

      // === Post-last-station zone ===
      const lastIdx = stations.length - 1;
      if (scrollY > c[lastIdx]) {
        const fadeEnd = c[lastIdx] + vh * FADE_OUT_FRAC;
        if (scrollY > fadeEnd) {
          hideBrandmark();
          return;
        }
        // Fade-out window: stay pinned at the orbit anchor with
        // declining opacity. The orbit has no native dock so the
        // actor paints this. In particle mode the particle field
        // mirrors the fade via the orbit station's snapshot.
        const ft = clamp01((scrollY - c[lastIdx]) / (fadeEnd - c[lastIdx]));
        const opacity = (1 - ft) * stations[lastIdx].opacity;
        const rect = readStationRect(stations[lastIdx]);
        if (rect) {
          actor()?.pinToRect(rect, opacity, 1);
          actor()?.setHudOutline(false);
        }
        setSigilVisible(false);
        setDockAttrs(null);
        if (particleModeOK) {
          // Fade-out always uses particles (the SVG dock would
          // snap-disappear at the threshold). Clear the SVG dock
          // attribute so the portal'd glyph fades back out to 0
          // while the particles handle the visible fade ramp.
          setSvgDock(null);
          if (opacity <= 0.005) {
            clearAllStationSnapshots();
          } else {
            const defaults = PARTICLE_STATION_DEFAULTS.orbit;
            const snap: StationSnapshot = {
              rect: {
                left: rect!.left,
                top: rect!.top,
                width: rect!.width,
                height: rect!.height,
              },
              opacity,
              density: defaults.density,
              dispersion: defaults.dispersion,
              tint: defaults.tint,
            };
            const store = useBrandmarkParticleStore.getState();
            if (lastParticleStation && lastParticleStation !== "orbit") {
              store.setStation(lastParticleStation, null);
            }
            store.setStation("orbit", snap);
            lastParticleStation = "orbit";
            setParticleBackdropGate(true);
          }
        }
        return;
      }

      // === Bracketed (inside a segment) ===
      let i = 0;
      while (i + 1 < stations.length && c[i + 1] <= scrollY) i++;
      if (i + 1 >= stations.length) {
        parkAt(stations[lastIdx]);
        return;
      }

      const from = stations[i];
      const to = stations[i + 1];
      const span = Math.max(1, c[i + 1] - c[i]);
      const rawT = (scrollY - c[i]) / span;

      if (rawT <= PARK_FRAC) {
        parkAt(from);
        return;
      }
      if (rawT >= 1 - PARK_FRAC) {
        parkAt(to);
        return;
      }
      // Transit, remapped so the inner [PARK_FRAC, 1-PARK_FRAC] slice
      // of the raw t becomes a full [0, 1] transit progression.
      const tt = (rawT - PARK_FRAC) / (1 - 2 * PARK_FRAC);
      transit(from, to, tt);
    };

    // === Initial sigil reveal setup ===
    // Disable any baked-in IO motion on the sigil internals so the
    // entrance scrub is the only thing animating them.
    const section2Els = [sigilOrbits, sigilHalo, sigilMark, sigilCap, sigilLegend, triLeft].filter(
      (el): el is HTMLElement => el !== null
    );
    section2Els.forEach((el) => {
      el.removeAttribute("data-m");
      el.classList.add("is-in");
    });

    // === Entrance scrub (sigil diagram reveal) ===
    // Animates the sigil's internal diagram (orbits, halo, mark, cap,
    // legend, tri-left) as the user enters section 02. This is a
    // SEPARATE concern from the brandmark journey — the brandmark is
    // "at sigil" during section 02 reading state; this scrub polishes
    // how the diagram comes in.
    const ctx = gsap.context(() => {
      gsap.set([sigilOrbits, sigilHalo].filter(Boolean), {
        opacity: 0,
        scale: 0.6,
        rotation: -8,
      });
      gsap.set(sigilMark, { opacity: 0, scale: 0.7 });
      gsap.set([sigilCap, sigilLegend, triLeft].filter(Boolean), { opacity: 0, y: 16 });

      const entranceTl = gsap.timeline({
        scrollTrigger: {
          trigger: defEl,
          start: "top 85%",
          end: "top 35%",
          scrub: 0.6,
        },
      });
      entranceTl
        .to(
          [sigilOrbits, sigilHalo].filter(Boolean),
          { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: "power3.out" },
          0
        )
        .to(sigilMark, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }, 0.15)
        .to(
          [sigilCap, sigilLegend].filter(Boolean),
          { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", stagger: 0.06 },
          0.3
        )
        .to(
          [triLeft].filter(Boolean),
          { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" },
          0.25
        );
    }, docEl);

    // === rAF-throttled scroll handler ===
    let rafId = 0;
    const queueUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        applyJourney(window.scrollY);
      });
    };

    // === Event hookups ===
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") queueUpdate();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) queueUpdate();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);

    // Retry sequence — anchors may not be measurable on first paint
    // (portal'd glyphs mount after the React root commits).
    const refreshTimers = [
      window.setTimeout(queueUpdate, 250),
      window.setTimeout(queueUpdate, 1200),
      window.setTimeout(queueUpdate, 3000),
    ];
    window.addEventListener("load", queueUpdate);

    let roDebounce = 0;
    const ro = new ResizeObserver(() => {
      if (roDebounce) clearTimeout(roDebounce);
      roDebounce = window.setTimeout(queueUpdate, 120);
    });
    if (practiceEl) ro.observe(practiceEl);
    if (defEl) ro.observe(defEl);
    if (contEl) ro.observe(contEl);
    if (askEl) ro.observe(askEl);
    if (missEl) ro.observe(missEl);

    // Initial computation (covers the case where the page loads with
    // restored scrollY).
    queueUpdate();

    return () => {
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      window.removeEventListener("load", queueUpdate);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      refreshTimers.forEach((id) => clearTimeout(id));
      if (roDebounce) clearTimeout(roDebounce);
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      ctx.revert();

      // Clear state attributes
      approachEl?.removeAttribute("data-orbit-docked");
      docEl.removeAttribute("data-brand-on-rail");
      docEl.removeAttribute("data-brand-on-missing");
      document.documentElement.removeAttribute("data-brand-on-rail");
      document.documentElement.removeAttribute("data-brand-on-missing");
      document.documentElement.removeAttribute("data-brand-particle-backdrop");
      document.documentElement.removeAttribute("data-brandmark-mode");
      document.documentElement.removeAttribute("data-brand-svg-dock");
      // Clear particle store snapshots so a remount with the same
      // store instance (Fast Refresh, navigation) starts from a clean
      // state.
      useBrandmarkParticleStore.getState().clearStations();
      actor()?.hide();
    };
  }, [rootRef, actorRef]);
}
