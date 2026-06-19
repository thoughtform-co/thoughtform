"use client";

import { useEffect, type RefObject } from "react";
import { corridorExitSpeedRamp } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/** Corridor `epilogueProgress` at/after which the live sphere docks as
 *  a fixed backdrop for the corridor-exit zoom-dissipate (ADR-021).
 *  Chosen so the BILLIONS title is essentially up (TITLE_IN ends 0.74)
 *  and the camera has all but landed before the instrument is held.
 *  Inherited verbatim from the retired cover-plane sweep
 *  (`DOCK_ENGAGE_EP` in `HandoffOrbitEmbed`) so the dwell at the landed
 *  sphere stays identical — the only thing that changed at the seam is
 *  what plays AFTER the dwell, not when the dwell starts. */
const DOCK_ENGAGE_EP = 0.72;
/** Scroll runway (in viewports) over which the dissipate clock fills.
 *  Widened 1.58 → 2.0 (2026-06-16, ADR-021 follow-up) now that
 *  #services holds a re-centring brandmark instead of header/cards/CTA:
 *  the longer runway lets the welded brandmark recentre lerp resolve
 *  ~1.3 viewports past the section's first reveal instead of right at
 *  it, so the mark doesn't "appear too soon" off the BILLIONS beat. */
const DISSIPATE_SCROLL_SPAN_VH = 2.0;
/** `data-services-brandmark="fade"` ramp window in `continuum.top /
 *  vh` units. At 0.5 the gate is still "hold" (full opacity); at 0.1
 *  the brandmark has fully faded as the next section approaches the
 *  top of the viewport. Tuned around the 200svh #services length so
 *  the hold lasts ~0.5vh of scroll and the fade ~0.4vh — long enough
 *  to read as a deliberate beat, short enough that a fast scroll
 *  still completes the fade before #continuum is fully in. */
const CONTINUUM_FADE_HOLD = 0.5;
const CONTINUUM_FADE_END = 0.1;
/** Eased `dockProgress` at/after which the welded brandmark recentre
 *  has reached the viewport centre. MUST mirror `DOCK_RECENTRE_FRAC`
 *  in `ProjectedBrandmarkActor.tsx` — that component lerps the welded
 *  mark to centre over `smoothstep(dissipate / DOCK_RECENTRE_FRAC)`,
 *  so the mark is fully centred once `dockProgress >= this`. The seam
 *  pixel morph must not open before this point or the canvas (which
 *  paints at the fixed viewport centre) would mismatch the still-
 *  travelling welded SVG. */
const MARK_CENTRED_DOCK_PROGRESS = 0.85;
/** `#continuum.top / vh` at which the seam pixel morph BEGINS. The
 *  brandmark re-centres while the dock is still engaged (around
 *  `continuum.top ≈ 2vh` for the 200svh runway), so opening the morph
 *  here lets the dissolve start the instant the mark "shows itself"
 *  and run a long, elegant runway down to `#continuum`'s arrival —
 *  rather than a late burst in the final fade band. Slightly below the
 *  recentre-complete `continuum.top` so there is a brief settled-mark
 *  beat before the dissolve. */
const SEAM_MORPH_START_VH = 1.9;
/** `#continuum.top / vh` at which the seam pixel morph COMPLETES
 *  (fully dispersed). Aligned with `CONTINUUM_FADE_END` so the pixel
 *  field finishes exactly as the next section takes the viewport. */
const SEAM_MORPH_END_VH = CONTINUUM_FADE_END;
/** Engage the fixed dock slightly BEFORE #services physically enters
 *  the viewport. If we wait until `services.top < vh`, the corridor
 *  sticky cell has already started releasing (`sticky.top < 0`), and
 *  promoting the canvas from absolute-in-sticky to fixed-at-viewport
 *  shifts the visible sphere. Preloading the dock while
 *  `services.top` is still ~0.25vh below the viewport keeps sticky.top
 *  at 0 at the promotion moment; `rawDissipate` remains 0 until the
 *  section actually enters, so the fly-in / scatter clock is unchanged. */
const DOCK_PRELOAD_VH = 0.25;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep01(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

/**
 * useCorridorExitScroll — single rAF scroll watcher for the
 * production corridor → Services seam (ADR-021).
 *
 * Replaces the retired `useEmbeddedServicesScroll` from
 * `HandoffOrbitEmbed`. Watches the `#services` section's live rect
 * and writes:
 *
 *   - `--corridor-dissipate` (0..1) on `<html>` — the dissipate
 *     clock. CSS gates (canvas fade, services leading-edge
 *     transparency) read this var.
 *   - `data-corridor-docked` attribute on `<html>` — promotes
 *     `.home-v2-stage__canvas` (and `.home-v2-projected-brandmark`)
 *     to fixed full-viewport backdrops so the live R3F scene + the
 *     re-centring brandmark persist across the seam.
 *   - `depthGatewayStore.transform.docked` + `dockProgress` —
 *     `dockProgress` IS the dissipate clock; the camera rig +
 *     substrate painters read it to fly into the sphere + scatter
 *     the particles. `ProjectedBrandmarkActor` also reads this to
 *     lerp the welded brandmark into the Services centre across
 *     most of the dissipate clock (ADR-021 follow-up).
 *   - `data-services-brandmark` attribute on `<html>` — once the
 *     dock disengages, this gate flips to `"hold"` (mark held fixed-
 *     centred in #services via CSS) and then `"fade"` as #continuum
 *     enters. `--services-brandmark` (0..1) drives the fade opacity
 *     on the FALLBACK path (reduced-motion / mobile / no-WebGL).
 *     `ProjectedBrandmarkActor` reads the gate to release the
 *     element to CSS — it stops writing inline transform/opacity
 *     when the gate is `"hold"` or `"fade"`.
 *   - `data-services-pixelate` attribute + `--services-pixelate`
 *     (0..1) on `<html>` and `transform.seamMorph` in the depth-
 *     gateway store — the seam pixel-field morph clock (capable path
 *     only). OPENS the instant the welded brandmark has re-centred
 *     into the viewport (while the dock is still engaged — see
 *     `MARK_CENTRED_DOCK_PROGRESS`) and ramps 0 → 1 across a long
 *     runway driven by `#continuum`'s approach
 *     (`SEAM_MORPH_START_VH` → `SEAM_MORPH_END_VH`). 0 = brandmark
 *     assembled, 1 = pixels fully scattered. `CorridorSeamPixelField`
 *     reads `seamMorph` to paint the dissolve; the
 *     `data-services-pixelate` attribute hides the SVG glyph (so the
 *     pixels are the only visible mark) and shows the canvas. Never
 *     set on the fallback path, so the SVG `--services-brandmark`
 *     fade still owns that path.
 *   - `data-services-ambient` attribute + `--services-ambient` (0..1)
 *     on `<html>` and `transform.servicesAmbient` /
 *     `transform.servicesAmbientLevel` in the depth-gateway store —
 *     the "inside the sphere" ambient hold (ADR-021 addendum, capable
 *     path only). Engages alongside the brandmark hold/fade gate
 *     (after the dock has released) and keeps the R3F canvas fixed
 *     so `ShellSubstrateGyro`'s interior particle cloud + the static
 *     starfield keep painting as a warm haze behind the centred mark.
 *     `--services-ambient` holds at 1 across the hold band, ramps to
 *     0 across the continuum-approach fade, then both flags clear
 *     and the normal-station opaque void shield re-takes ownership.
 *   - `--corridor-exit-veil` (0..1) on `<html>` — the alpha for the
 *     fixed `body::before` veil. Tracks `--corridor-dissipate` while
 *     docked (capped at `VEIL_AMBIENT_CAP` so the canvas stays
 *     visible through it), holds at the cap across the ambient hold,
 *     and ramps back to 0 with `--services-ambient` as `#continuum`
 *     approaches. Replaced the older `var(--corridor-dissipate)`
 *     direct read so the late-dissipate alpha-1 cover does not hide
 *     the ambient-hold canvas painting underneath.
 *
 * 2026-06-16 (ADR-021 follow-up): the per-element reveal vars
 * (`--services-header-in`, `--services-grid-in`, `--services-cta-in`)
 * are GONE. Their DOM targets (`.exec__header`, `.exec__grid`,
 * `.practice-cta--funnel`) were stripped from #services in the v7
 * prototype; #services is now a runway for the welded brandmark
 * re-centre. Restore the per-element reveal channels only if those
 * elements come back in a later content pass.
 *
 * Engages off the corridor's own `epilogueProgress >= DOCK_ENGAGE_EP`
 * (NOT off `#services`'s rect alone) so the dwell at the landed
 * sphere opens BEFORE the user scrolls into the section — the
 * instrument is held the moment the landing resolves, and the
 * subsequent #services scroll then ramps the dissipate clock against
 * a stable backdrop. Disengages once the section has fully covered
 * the viewport (dissipate ≥ 0.999) so the R3F frameloop can idle
 * behind the opaque services surface.
 *
 * Single-writer rule (ADR-021 invariant): this hook is the ONLY
 * writer of `docked` / `dockProgress`. `useDepthScroll` stays the
 * sole writer of `progress` / `paintProgress` / `epilogueProgress`;
 * the substrate painters + camera rig read `dockProgress` as the
 * dissipate clock themselves. Two rAF loops writing the same channel
 * fought every frame and made the sphere jitter (see
 * `sentinel/BEST-PRACTICES.md` "Cross-writer scroll state needs an
 * owner and a release guard"); this hook honours the same contract
 * the retired sweep recipe established.
 *
 * Fallback gate (`dockCapable`): on mobile, reduced-motion, or
 * WebGL-fallback the dock never engages — the page reads as a
 * sequential dark cut from the corridor epilogue to the Services
 * section. Mirrors the retired sweep's `dockCapable` so any future
 * recipe that reuses this seam keeps a single fallback contract.
 */
export function useCorridorExitScroll(rootRef: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    let frame = 0;
    let disposed = false;

    const write = () => {
      frame = 0;
      if (disposed) return;

      const root = rootRef.current;
      if (!root) return;

      const services = root.querySelector<HTMLElement>("#services");
      if (!services) return;

      const vh = window.innerHeight || 1;
      const servicesRect = services.getBoundingClientRect();
      const reducedMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      const mobile = window.matchMedia?.("(max-width: 960px)").matches ?? false;
      const corridorFallback =
        document.querySelector<HTMLElement>(".home-v2-stage")?.dataset.fallback === "true";
      const dockCapable = !reducedMotion && !mobile && !corridorFallback;

      // Dissipate clock: 0 when #services's top is at the viewport
      // bottom, 1 after the section has risen through a deliberately
      // longer-than-one-viewport runway. ToyFight's feel comes from
      // a smoothed scroll runtime; here we preserve native scroll/R3F
      // timing and instead stretch/ease only this seam's single clock.
      const rawDissipate = clamp01((vh - servicesRect.top) / (vh * DISSIPATE_SCROLL_SPAN_VH));
      const dissipate = corridorExitSpeedRamp(rawDissipate);
      const sectionNearDock =
        servicesRect.top < vh * (1 + DOCK_PRELOAD_VH) && servicesRect.bottom > 0;

      // Dock OFF the corridor epilogue (sphere landed + BILLIONS title
      // up), not off this section's scroll position. See the function
      // docstring + ADR-021 for the rationale.
      const ep = useDepthGatewayStore.getState().transform.epilogueProgress;
      const docked = dockCapable && ep >= DOCK_ENGAGE_EP && sectionNearDock && rawDissipate < 0.999;

      services.style.setProperty("--corridor-dissipate", dissipate.toFixed(4));
      document.documentElement.style.setProperty("--corridor-dissipate", dissipate.toFixed(4));
      if (docked) {
        document.documentElement.setAttribute("data-corridor-docked", "true");
      } else {
        document.documentElement.removeAttribute("data-corridor-docked");
      }

      // Resolve #continuum once — both the actor-lifecycle gate and
      // the pixel-field morph clock key off its distance to the
      // viewport top. The continuum slot used to live here (it was
      // dropped at the seam — `dropTrailingConnectorSlot:
      // "practice-to-about"` in the page route — so #continuum is the
      // next station after #services).
      const continuum = root.querySelector<HTMLElement>("#continuum");
      const continuumRect = continuum?.getBoundingClientRect() ?? null;
      const continuumTopVh = continuumRect ? continuumRect.top / vh : Number.POSITIVE_INFINITY;

      // ── Services brandmark gate (actor lifecycle) ──────────────
      // Drives `ProjectedBrandmarkActor`'s release-to-CSS + the
      // FALLBACK SVG opacity fade. On the capable path the SVG is
      // hidden by `data-services-pixelate` (below) and the pixel
      // field owns the visible mark — so here the gate only governs
      // the actor's fixed-centre positioning + clean release. The
      // gate is mutually exclusive with `data-corridor-docked` so the
      // post-active rAF in the actor can branch on either flag.
      //
      // States:
      //   - (no attribute) : not in services context yet, OR
      //     `data-corridor-docked` owns the mark.
      //   - "hold" : dock released, mark fixed-centred.
      //   - "fade" : #continuum approaching; `--services-brandmark`
      //     ramps opacity 1 → 0 (FALLBACK SVG path only).
      let servicesGate: "hold" | "fade" | null = null;
      let servicesBrandmarkOpacity = 1;
      if (!docked && dockCapable && rawDissipate >= 0.999) {
        if (!continuumRect || continuumTopVh >= CONTINUUM_FADE_HOLD) {
          servicesGate = "hold";
          servicesBrandmarkOpacity = 1;
        } else if (continuumTopVh <= CONTINUUM_FADE_END) {
          // Fully past; the next section owns the viewport now.
          // Releasing the gate lets `.home-v2-projected-brandmark`
          // drop back to its `position: absolute` default so it
          // doesn't keep a fixed layer alive past its usefulness.
          servicesGate = null;
          servicesBrandmarkOpacity = 0;
        } else {
          const t =
            (continuumTopVh - CONTINUUM_FADE_END) / (CONTINUUM_FADE_HOLD - CONTINUUM_FADE_END);
          servicesGate = "fade";
          servicesBrandmarkOpacity = clamp01(t);
        }
      }
      if (servicesGate) {
        document.documentElement.setAttribute("data-services-brandmark", servicesGate);
        document.documentElement.style.setProperty(
          "--services-brandmark",
          servicesBrandmarkOpacity.toFixed(4)
        );
      } else {
        document.documentElement.removeAttribute("data-services-brandmark");
        document.documentElement.style.removeProperty("--services-brandmark");
      }

      // ── Seam pixelate morph (capable path only) ────────────────
      // The brandmark rides out with the planet and re-centres into
      // the viewport centre during the dock (the welded recentre
      // completes once `dissipate >= MARK_CENTRED_DOCK_PROGRESS`).
      // From the moment it has shown itself centred, scrolling should
      // progressively DISSOLVE it into the pixel field across a long
      // runway — not hold it static until #continuum is near. We
      // therefore open the morph WHILE STILL DOCKED (the mark is
      // already pinned at centre) and drive it off #continuum's
      // approach from `SEAM_MORPH_START_VH` down to
      // `SEAM_MORPH_END_VH`. The canvas paints over the dissipating
      // planet and keeps painting seamlessly across the dock release
      // (the morph clock is independent of `docked`).
      //
      // `data-services-pixelate="true"` hides the SVG glyph (CSS) so
      // the pixels are the only visible mark, and shows the seam
      // canvas. Never set on the fallback path, so the SVG
      // `--services-brandmark` fade still owns that path.
      const markCentred = docked ? dissipate >= MARK_CENTRED_DOCK_PROGRESS : rawDissipate >= 0.999;
      const pixelateActive =
        dockCapable && sectionNearDock && markCentred && continuumTopVh < SEAM_MORPH_START_VH;
      const seamMorph = pixelateActive
        ? smoothstep01(
            (SEAM_MORPH_START_VH - continuumTopVh) / (SEAM_MORPH_START_VH - SEAM_MORPH_END_VH)
          )
        : 0;
      if (pixelateActive) {
        document.documentElement.setAttribute("data-services-pixelate", "true");
        document.documentElement.style.setProperty("--services-pixelate", seamMorph.toFixed(4));
      } else {
        document.documentElement.removeAttribute("data-services-pixelate");
        document.documentElement.style.removeProperty("--services-pixelate");
      }

      // ── Services ambient hold (ADR-021 addendum) ───────────────
      // After the camera has flown into the sphere and the dock has
      // released, the brandmark sits centred in `#services` for a
      // ~1-viewport hold beat before `#continuum` enters. Without
      // anything else painting, the user's eye drops onto a flat
      // void rectangle. The ambient hold extends the R3F canvas
      // through this beat so the `ShellSubstrateGyro` interior
      // particle volume keeps reading as a warm "inside the sphere"
      // haze behind the welded mark — the corridor's narrative read
      // ("we flew into our own intelligence layer") continues into
      // the hold rather than collapsing the instant the dock
      // releases.
      //
      // Surface geometry (dotted shell, globe grid, equator,
      // atmosphere rim, accretion shell, in-canvas brandmark core)
      // is fully scattered/faded by `dissipateOp` already; the
      // ambient gate keeps ONLY the interior cloud painting and
      // suppresses the surface multiplier on the capable painters.
      //
      // Engages once the dock-release/hold gate is set (servicesGate
      // != null) and the capable path is in use. `--services-ambient`
      // (0..1) is held at 1 across the hold and ramps to 0 across
      // the same `CONTINUUM_FADE_HOLD -> CONTINUUM_FADE_END` window
      // the brandmark fade uses, so the haze and the brandmark fade
      // together as `#continuum` enters.
      const servicesAmbient = dockCapable && servicesGate != null;
      const servicesAmbientLevel = servicesAmbient
        ? servicesGate === "fade"
          ? servicesBrandmarkOpacity
          : 1
        : 0;
      if (servicesAmbient) {
        document.documentElement.setAttribute("data-services-ambient", "true");
        document.documentElement.style.setProperty(
          "--services-ambient",
          servicesAmbientLevel.toFixed(4)
        );
      } else {
        document.documentElement.removeAttribute("data-services-ambient");
        document.documentElement.style.removeProperty("--services-ambient");
      }

      // ── Corridor-exit body veil ────────────────────────────────
      // The fixed `body::before` veil (home-v2.css) was previously
      // gated on `data-corridor-exit` alone and read
      // `--corridor-dissipate` directly. Two problems for the
      // ambient hold:
      //
      //   1. At dissipate 1 the veil reaches alpha 1, so the
      //      services-ambient particles painted on the canvas
      //      underneath would be hidden — defeating the purpose.
      //   2. The legacy attribute was also flipped off the moment
      //      `docked` cleared, leaving the canvas un-fixed during
      //      the hold.
      //
      // Split the veil into its own var (`--corridor-exit-veil`) and
      // keep `data-corridor-exit` active across BOTH the dock and the
      // ambient hold (so `#services` stays transparent +
      // `content-visibility: visible` throughout). During dock the
      // veil tracks the dissipate clock UP TO a low cap so the
      // canvas remains visible through it. During the ambient hold
      // the veil sits at that cap, then ramps back to 0 as the
      // haze fades, so the canvas can paint cleanly under it. The
      // normal-station opaque void shield re-takes ownership the
      // moment both flags clear (release at the bottom of the hook).
      const VEIL_AMBIENT_CAP = 0.45;
      let veilAlpha = 0;
      if (docked) {
        veilAlpha = Math.min(VEIL_AMBIENT_CAP, dissipate * VEIL_AMBIENT_CAP);
      } else if (servicesAmbient) {
        veilAlpha = VEIL_AMBIENT_CAP * servicesAmbientLevel;
      }
      const corridorExit = docked || servicesAmbient;
      if (corridorExit) {
        document.documentElement.setAttribute("data-corridor-exit", "true");
        document.documentElement.style.setProperty("--corridor-exit-veil", veilAlpha.toFixed(4));
      } else {
        document.documentElement.removeAttribute("data-corridor-exit");
        document.documentElement.style.removeProperty("--corridor-exit-veil");
      }

      // ONLY own the dock + seam + ambient channels. The corridor's
      // `useDepthScroll` remains the sole writer of progress /
      // paintProgress / epilogueProgress (single-writer rule). The
      // painters read `dockProgress` (the dissipate clock),
      // `seamMorph` (the pixelate clock), and `servicesAmbient` /
      // `servicesAmbientLevel` (the ambient hold) and hold a fixed
      // pose themselves, so we never need to overwrite the epilogue
      // scrub here.
      const store = useDepthGatewayStore.getState();
      const prev = store.transform;
      const nextDockProgress = docked ? dissipate : 0;
      const dockChanged =
        prev.docked !== docked || Math.abs(prev.dockProgress - nextDockProgress) > 0.0005;
      const seamChanged = Math.abs(prev.seamMorph - seamMorph) > 0.0005;
      const ambientChanged =
        prev.servicesAmbient !== servicesAmbient ||
        Math.abs(prev.servicesAmbientLevel - servicesAmbientLevel) > 0.0005;
      if (dockChanged || seamChanged || ambientChanged) {
        store.setTransform({
          ...prev,
          docked,
          dockProgress: nextDockProgress,
          seamMorph,
          servicesAmbient,
          servicesAmbientLevel,
        });
      }
    };

    const requestWrite = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      document.documentElement.removeAttribute("data-corridor-docked");
      document.documentElement.removeAttribute("data-corridor-exit");
      document.documentElement.removeAttribute("data-services-brandmark");
      document.documentElement.removeAttribute("data-services-pixelate");
      document.documentElement.removeAttribute("data-services-ambient");
      document.documentElement.style.removeProperty("--corridor-dissipate");
      document.documentElement.style.removeProperty("--corridor-exit-veil");
      document.documentElement.style.removeProperty("--services-brandmark");
      document.documentElement.style.removeProperty("--services-pixelate");
      document.documentElement.style.removeProperty("--services-ambient");
      const store = useDepthGatewayStore.getState();
      store.setTransform({
        ...store.transform,
        docked: false,
        dockProgress: 0,
        seamMorph: 0,
        servicesAmbient: false,
        servicesAmbientLevel: 0,
      });
    };
  }, [rootRef]);
}
