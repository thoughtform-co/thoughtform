"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLandingScroll } from "./hooks/useLandingScroll";
import { useRevealMotion } from "./hooks/useRevealMotion";
import { useBrandmarkJourney } from "./hooks/useBrandmarkJourney";
import { useSigilEntranceScrub } from "./hooks/useSigilEntranceScrub";
import { type BrandmarkActorHandle } from "./BrandmarkActor";
import { BrandmarkSystem } from "./BrandmarkSystem";
import { useBrandmarkSingletonCheck } from "./lib/brandmarkSingletonCheck";
import { CelestialPortals } from "./CelestialConnector/CelestialPortals";
import { PhaseGlyphPortals } from "./PhaseGlyph";
import { BuildCasesPortal } from "./build-cases";
import { IntelligenceLayerPortal } from "./intelligence-layer";
import { CelestialEditorOverlay } from "@/components/admin/CelestialEditor";
import { useCelestialDrafts } from "@/components/admin/CelestialEditor/useCelestialDrafts";
import type { SlotsMap } from "@/lib/celestial/schema";

interface LandingPageProps {
  bodyHtml: string;
  bodyClass: string;
  celestialSlots?: SlotsMap;
}

export function LandingPage({ bodyHtml, bodyClass, celestialSlots }: LandingPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const brandmarkActorRef = useRef<BrandmarkActorHandle>(null);
  const [navOpen, setNavOpen] = useState(false);

  useLandingScroll(rootRef);
  useRevealMotion(rootRef);
  // ADR-013: the brandmark journey is a single continuous transform.
  // `useBrandmarkJourney` writes the transform to `brandmarkJourneyStore`
  // every scroll frame; the global painter + R3F ringfield both read it.
  // In SVG-fallback mode (reduced motion / no WebGL) the same hook
  // pins the actor + drives dock attributes so the native SVG glyphs
  // paint via CSS gates.
  // `useSigilEntranceScrub` owns the section-02 diagram entrance
  // animation (orbits, halo, cap, legend, tri-left) — a separate
  // concern from the brandmark journey.
  useBrandmarkJourney(rootRef, brandmarkActorRef);
  useSigilEntranceScrub(rootRef);
  // Dev-only invariant guard: warns in the console whenever more
  // than one brandmark instance is painting at the same scroll
  // position. Tree-shaken out of the production bundle by the
  // `process.env.NODE_ENV === "production"` early return inside
  // the hook.
  useBrandmarkSingletonCheck(rootRef);

  // Hamburger toggle — wire imperatively since the nav markup comes from HTML
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const navEl = root.querySelector<HTMLElement>(".hud__nav");
    const navBtn = root.querySelector<HTMLButtonElement>(".hud__nav__btn");
    if (!navEl || !navBtn) return;

    const toggle = () => {
      navEl.classList.toggle("is-open");
    };
    navBtn.addEventListener("click", toggle);

    // Smooth scroll on nav links
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("#hudNav a"));
    const handlers: Array<[HTMLAnchorElement, (e: MouseEvent) => void]> = [];
    for (const link of links) {
      const handler = (event: MouseEvent) => {
        const href = link.getAttribute("href");
        if (!href) return;
        const target = root.querySelector<HTMLElement>(href);
        if (!target) return;
        event.preventDefault();
        navEl.classList.remove("is-open");
        window.scrollTo({ top: target.offsetTop - 20, behavior: "smooth" });
      };
      link.addEventListener("click", handler);
      handlers.push([link, handler]);
    }

    return () => {
      navBtn.removeEventListener("click", toggle);
      for (const [link, handler] of handlers) {
        link.removeEventListener("click", handler);
      }
    };
  }, []);

  // Practice section choreography. Three coupled layers, all driven
  // from a single rAF-throttled scroll handler:
  //
  //   (1) section observer — toggles `data-practice-active` on the root
  //       element while `#practice` is engaged with the viewport. CSS
  //       reads this to crossfade the bottom-left HUD brandmark from
  //       its filled rendering to the dawn-toned outline asset.
  //
  //   (2) phase selector — on each scroll frame picks the
  //       `.approach__phase` whose center is closest to ~40% of the
  //       viewport (the natural reading focus) and writes
  //       `data-active-phase` on `.approach` plus `data-active` on each
  //       phase. CSS uses these to drive the cumulative orbit-glyph
  //       ladder (compass / crystal / armature stack with decaying
  //       opacity) and the orbit-lane / label / readout highlights.
  //       This pattern avoids IntersectionObserver dead zones that
  //       leave the active phase stale on mobile, where each phase is
  //       100vh tall and may never cross a fixed ratio band.
  //
  //   (3) telemetry tick — on the same frame, writes scroll progress
  //       through #practice (0..1) to `--practice-progress` on
  //       `.approach`, the active phase's compass position to
  //       `--focus-x` / `--focus-y` on `.approach__orbit__focus`, and
  //       updates the BRG / DPT / TGT readout text. CSS reads the
  //       progress var to rotate the scanner sweep; the focus marker's
  //       transition smooths the snap to each phase position.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const phases = Array.from(root.querySelectorAll<HTMLElement>(".approach__phase"));
    const approach = root.querySelector<HTMLElement>(".approach");
    const practice = root.querySelector<HTMLElement>("#practice");

    if (!phases.length || !approach) return;

    // Compass positions in the orbit's SVG coord system (viewBox
    // -180,-180,360,360). These match the existing pillar labels in
    // the orbit SVG so the focus marker glides between them as phases
    // change. Values are unit-less for SVG `transform: translate(x y)`.
    const PHASE_FOCUS: Record<string, { x: number; y: number; n: string }> = {
      navigate: { x: -100, y: -100, n: "01" },
      encode: { x: -50, y: 100, n: "02" },
      build: { x: 80, y: -18, n: "03" },
    };

    // Lazy queries — these elements live inside the dangerouslySetInnerHTML
    // body and may be replaced on Fast Refresh / Strict Mode double-mount,
    // so we resolve them per call instead of capturing once. CSS handles
    // the transition smoothing, so per-call DOM lookups are cheap. We set
    // `transform` directly because Chromium does not always recalc the
    // computed `transform` when only a custom property in
    // `transform: translate(var(--x), var(--y))` changes on an SVG
    // element. Inline transform invalidates correctly.
    const setFocusPosition = (phase: string | null) => {
      if (!phase) return;
      const focusEl = root.querySelector<SVGGElement>(".approach__orbit__focus");
      if (!focusEl) return;
      const pos = PHASE_FOCUS[phase];
      if (!pos) return;
      focusEl.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    };

    const setReadoutText = (selector: string, value: string) => {
      const el = root.querySelector<HTMLElement>(selector);
      if (el && el.textContent !== value) el.textContent = value;
    };

    const setActivePhase = (target: HTMLElement | null) => {
      if (!target) return;
      const phase = target.getAttribute("data-phase");
      if (!phase) return;
      // The attribute / focus / readout writes are idempotent and cheap
      // (each compares the current value before writing), so we run them
      // unconditionally. Gating on a phase change would skip the writes
      // on Strict Mode's second mount where `data-active-phase` is
      // already set from the first mount but the focus marker / readout
      // text were never written.
      if (approach.getAttribute("data-active-phase") !== phase) {
        approach.setAttribute("data-active-phase", phase);
      }
      setFocusPosition(phase);
      setReadoutText(
        '.approach__stage__telemetry [data-readout="target"]',
        PHASE_FOCUS[phase]?.n ?? "01"
      );
      phases.forEach((p) => {
        const next = p === target ? "true" : "false";
        if (p.getAttribute("data-active") !== next) {
          p.setAttribute("data-active", next);
        }
      });
    };

    const quoteIsActive = () => {
      const quote = root.querySelector<HTMLElement>("#buildQuote");
      if (!quote) return false;
      const r = quote.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    const pickActivePhase = () => {
      const vh = window.innerHeight;
      // 40% from viewport top is the natural reading focus on this layout.
      const focusY = vh * 0.4;
      let bestPhase: HTMLElement | null = null;
      let bestDist = Infinity;
      for (const p of phases) {
        const r = p.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= vh) continue;
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - focusY);
        if (dist < bestDist) {
          bestDist = dist;
          bestPhase = p;
        }
      }
      if (bestPhase) {
        setActivePhase(bestPhase);
        return;
      }
      // Nothing in viewport — fall back to the phase nearest the
      // viewport above/below so entering #practice from continuum
      // immediately reads as Navigate, and entering from About on
      // upward scroll lands on Build.
      let nearest: HTMLElement | null = null;
      let nearestDist = Infinity;
      for (const p of phases) {
        const r = p.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - focusY);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = p;
        }
      }
      setActivePhase(nearest);
    };

    const updateOrbitTelemetry = () => {
      if (!practice) return;
      const r = practice.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height + vh;
      // Progress = 0 when the section's top edge meets the viewport
      // bottom (just entering); 1 when the section's bottom edge meets
      // the viewport top (just leaving). Clamped to [0, 1].
      const progress = Math.max(0, Math.min(1, (vh - r.top) / total));
      approach.style.setProperty("--practice-progress", progress.toFixed(4));

      // Scanner rotation — set directly via inline transform (same
      // Chromium quirk as the focus marker). One-and-a-half sweeps
      // (0..540deg) over the section.
      const scanner = root.querySelector<SVGGElement>(".approach__orbit__scanner");
      if (scanner) {
        scanner.style.transform = `rotate(${(progress * 540).toFixed(2)}deg)`;
      }

      setReadoutText(
        '.approach__stage__telemetry [data-readout="bearing"]',
        Math.round((progress * 540) % 360)
          .toString()
          .padStart(3, "0")
      );
      setReadoutText(
        '.approach__stage__telemetry [data-readout="depth"]',
        (progress * 10).toFixed(2)
      );
    };

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (quoteIsActive()) {
          setActivePhase(root.querySelector<HTMLElement>('.approach__phase[data-phase="build"]'));
          return;
        }
        pickActivePhase();
        updateOrbitTelemetry();
      });
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    pickActivePhase();
    updateOrbitTelemetry();

    let practiceIO: IntersectionObserver | null = null;
    if (practice) {
      // Activation band: shrink the viewport root by 15% top and bottom
      // so the brandmark only flips when #practice is solidly engaged,
      // not at the section boundaries where the user is still reading
      // the connector or the outgoing through-line.
      practiceIO = new IntersectionObserver(
        ([entry]) => {
          root.setAttribute("data-practice-active", entry?.isIntersecting ? "true" : "false");
        },
        { rootMargin: "-15% 0px -15% 0px", threshold: 0 }
      );
      practiceIO.observe(practice);
    }

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
      practiceIO?.disconnect();
      root.removeAttribute("data-practice-active");
    };
  }, []);

  // Tag motion roles on first mount (replaces the imperative tagging from initV7Runtime).
  // MUST be useLayoutEffect: runs before useRevealMotion's useEffect so the
  // IntersectionObserver sees all [data-m] elements. Otherwise auto-tagged
  // titles/bodies stay at opacity:0 until a reflow triggers them.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const tagIfEmpty = (el: Element | null, role: string) => {
      if (el && !el.hasAttribute("data-m")) el.setAttribute("data-m", role);
    };

    root.querySelectorAll<HTMLElement>(".station").forEach((station) => {
      if (!station.hasAttribute("data-m-group")) station.setAttribute("data-m-group", "");
      tagIfEmpty(station.querySelector(":scope > .station__idx"), "eyebrow");
      tagIfEmpty(station.querySelector(":scope > .station__title"), "title");
      tagIfEmpty(station.querySelector(":scope > .station__lede"), "body");
    });

    const heroContent = root.querySelector<HTMLElement>(".hero__content");
    if (heroContent) {
      heroContent.setAttribute("data-m-group", "");
      tagIfEmpty(heroContent.querySelector(".hero__wordmark"), "title");
      tagIfEmpty(heroContent.querySelector(".hero__tagline"), "body");
      tagIfEmpty(heroContent.querySelector(".hero__desc"), "body");
      tagIfEmpty(heroContent.querySelector(".hero__cta"), "body");
    }

    const tri = root.querySelector<HTMLElement>(".tri");
    if (tri) {
      tri.setAttribute("data-m-group", "");
      tagIfEmpty(tri.querySelector(".tri__left"), "body");
      tagIfEmpty(tri.querySelector(".tri__center"), "instrument");
    }
    tagIfEmpty(root.querySelector(".crail--large"), "instrument");
    tagIfEmpty(root.querySelector(".continuum__close"), "body");

    [".exec__grid", ".about__stats"].forEach((sel) => {
      root.querySelectorAll<HTMLElement>(sel).forEach((grid) => {
        grid.setAttribute("data-m-group", "");
        Array.from(grid.children).forEach((child) => tagIfEmpty(child, "frame"));
      });
    });

    const voidwalker = root.querySelector<HTMLElement>(".voidwalker");
    if (voidwalker) {
      voidwalker.setAttribute("data-m-group", "");
      const orbit = voidwalker.querySelector(".voidwalker__orbit");
      if (orbit) orbit.setAttribute("data-m", "instrument");
      const copy = voidwalker.querySelector(".voidwalker__copy");
      if (copy) tagIfEmpty(copy, "body");
    }

    const contact = root.querySelector<HTMLElement>(".contact");
    if (contact) {
      contact.setAttribute("data-m-group", "");
      tagIfEmpty(contact.querySelector(".station__idx"), "eyebrow");
      tagIfEmpty(contact.querySelector(".contact__title"), "title");
      tagIfEmpty(contact.querySelector(".contact__desc"), "body");
      tagIfEmpty(contact.querySelector(".contact__cta"), "body");
      tagIfEmpty(contact.querySelector(".contact__email"), "body");
    }

    // Set parallax speeds on decorative elements. The single motion
    // channel for these elements is the global `[data-parallax]` CSS
    // rule, which applies `translate: 0 var(--py, 0px)`. The
    // useLandingScroll hook writes --py per scroll frame. Do NOT also
    // apply `transform: translate3d(...)` on these elements — that
    // doubles the motion and breaks the parallax/cover composition.
    const parallaxMap: Array<[string, number]> = [
      [".hero__video", 0.03],
      [".tri__center", 0.04],
      [".voidwalker__orbit", 0.06],
      [".build-quote__gateway__img", 0.04],
    ];
    parallaxMap.forEach(([selector, speed]) => {
      root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (!el.hasAttribute("data-parallax")) el.setAttribute("data-parallax", String(speed));
      });
    });
  }, []);

  // Merge admin drafts over the persisted slot configs so the page
  // live-previews editor changes before they are saved.
  const drafts = useCelestialDrafts((s) => s.drafts);
  const mergedSlots = useMemo<SlotsMap | undefined>(() => {
    if (!celestialSlots) return undefined;
    const hasDrafts = Object.keys(drafts).length > 0;
    if (!hasDrafts) return celestialSlots;

    const merged = { ...celestialSlots };
    for (const [slotId, draftConfig] of Object.entries(drafts)) {
      if (merged[slotId]) {
        merged[slotId] = { ...merged[slotId], config: draftConfig };
      } else {
        merged[slotId] = {
          slot_id: slotId,
          config: draftConfig,
          orientation: "horizontal",
          enabled: true,
        };
      }
    }
    return merged;
  }, [celestialSlots, drafts]);

  return (
    <>
      <div
        ref={rootRef}
        className={bodyClass}
        data-theme="dark"
        style={
          {
            position: "relative",
            minHeight: "100vh",
            "--depth": 0,
            "--hero-cover": 0,
          } as React.CSSProperties
        }
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      {mergedSlots && <CelestialPortals slots={mergedSlots} containerRef={rootRef} />}
      <PhaseGlyphPortals containerRef={rootRef} />
      <BuildCasesPortal containerRef={rootRef} />
      {/* Intelligence-layer 3D stack (ADR-012 v2). Mounts the R3F
          canvas into `[data-ilayer-stack-root]` and owns the
          scroll-progress trigger that drives the rotate-and-split
          choreography. Mounted before `BrandmarkSystem` so the
          substrate dock anchor's grid placement settles before the
          choreography hook reads its rect on first measure. */}
      <IntelligenceLayerPortal containerRef={rootRef} />
      {/* Single brandmark entry point. Renders one canonical
          `BrandmarkGlyph` into each `data-brand-anchor` slot via
          portal, plus one fixed `BrandmarkActor` for transit/backdrop/
          orbit passes. The actor handle is forwarded so the
          choreography hook can drive its imperative API
          (morphRects / pinToRect / hide) unchanged. */}
      <BrandmarkSystem ref={brandmarkActorRef} rootRef={rootRef} />
      <CelestialEditorOverlay />
    </>
  );
}
