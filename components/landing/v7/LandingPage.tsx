"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useLandingScroll } from "./hooks/useLandingScroll";
import { useRevealMotion } from "./hooks/useRevealMotion";
import { useBrandmarkJourney } from "./hooks/useBrandmarkJourney";
import { useCorridorMount } from "./hooks/useCorridorMount";
import { type BrandmarkActorHandle } from "./BrandmarkActor";
import { BrandmarkSystem } from "./BrandmarkSystem";
import { HudNav } from "./HudNav";
import { THEME_TOGGLE } from "./themeToggle";
import { useBrandmarkSingletonCheck } from "./lib/brandmarkSingletonCheck";
import { CelestialPortals } from "./CelestialConnector/CelestialPortals";
import { PhaseGlyphPortals } from "./PhaseGlyph";
import { RailManifestController } from "./RailManifest";
import { RailInstruments } from "./rail-instruments/RailInstruments";
import { SettingsCluster } from "./rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "./rail-instruments/flags";
import { AboutStagePortal } from "@/components/landing/home-v2/about/AboutStagePortal";
import { ServicesPortal } from "@/components/landing/home-v2/services";
import { useCorridorExitScroll } from "@/components/landing/home-v2/hooks/useCorridorExitScroll";
import { CelestialEditorGate } from "@/components/admin/CelestialEditor/CelestialEditorGate";
import { useCelestialDrafts } from "@/components/admin/CelestialEditor/useCelestialDrafts";
import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import type { SlotsMap } from "@/lib/celestial/schema";
import type { V7CorridorText } from "@/lib/v7-parse";

interface LandingPageProps {
  bodyHtml: string;
  bodyClass: string;
  celestialSlots?: SlotsMap;
  /** Corridor copy extracted from the v7 prototype HTML. When
   *  provided alongside `corridorMountId`, the home-v2 depth
   *  corridor is mounted into the matching placeholder inside the
   *  parsed body markup. Production passes this; legacy
   *  routes that forked LandingPage may omit it. */
  corridorText?: V7CorridorText;
  /** Element id of the corridor mount placeholder injected by
   *  `getV7Content({ removeStations })`. Defaults to
   *  `"home-corridor-mount"`. The corridor is only mounted when
   *  both `corridorText` and a matching DOM node are present. */
  corridorMountId?: string;
}

export function LandingPage({
  bodyHtml,
  bodyClass,
  celestialSlots,
  corridorText,
  corridorMountId = "home-corridor-mount",
}: LandingPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const brandmarkActorRef = useRef<BrandmarkActorHandle>(null);

  useLandingScroll(rootRef);
  useRevealMotion(rootRef);
  // Corridor-exit seam (ADR-021): watch #services to drive the
  // zoom-dissipate clock + the docked-backdrop flag while the live
  // R3F canvas hands off from the corridor epilogue into the
  // practical services copy. Replaces the retired #buildQuote
  // HandoffOrbitEmbed cover-plane sweep.
  useCorridorExitScroll(rootRef);
  // ADR-013: the brandmark journey is a single continuous transform.
  // `useBrandmarkJourney` writes the transform to `brandmarkJourneyStore`
  // every scroll frame; the global painter + R3F ringfield both read it.
  // In SVG-fallback mode (reduced motion / no WebGL) the same hook
  // pins the actor + drives dock attributes so the native SVG glyphs
  // paint via CSS gates.
  //
  // The Thoughtform / Diagnostic / Intelligence-layer stations have
  // been replaced by the home-v2 depth corridor (ADR-018) on the
  // production homepage; the corridor's `ProjectedBrandmarkActor`
  // owns the brandmark while the corridor is engaged, and the journey
  // hook below filters its keyframe table down to the live anchors
  // (rail @ #continuum, orbit @ #practice) so the global painter
  // picks back up cleanly once the corridor exits. The companion
  // hooks for those removed stations (sigil entrance scrub,
  // traveling-orbits sigil→miss morph, diagnostic pill IO) and the
  // intelligence-layer R3F portal were stripped along with the HTML
  // they targeted.
  useBrandmarkJourney(rootRef, brandmarkActorRef);
  // Dev-only invariant guard: warns in the console whenever more
  // than one brandmark instance is painting at the same scroll
  // position. Tree-shaken out of the production bundle by the
  // `process.env.NODE_ENV === "production"` early return inside
  // the hook.
  useBrandmarkSingletonCheck(rootRef);

  // Mount the reusable home-v2 corridor into the live placeholder
  // inside the parsed v7 HTML. The bfcache / HMR / Strict-Mode
  // safety valves live inside `useCorridorMount` — see that hook
  // for the full mount-lifecycle rationale.
  //
  // The retired `#buildQuote` HandoffOrbitEmbed mount used to live
  // here too (ADR-021). The corridor-exit seam is now a zoom-
  // dissipate driven by `useCorridorExitScroll` above — no separate
  // section mount is needed. The
  // `getV7Content({ removeStations: [..., "buildQuote"], ... })`
  // call in the route strips the prototype's "Make the layer useful."
  // cover section AND the now-empty `.build-quote-runway` wrapper,
  // and relocates `#services` to immediately follow the corridor
  // mount so the dissipate hands off into the practical services
  // copy.
  useCorridorMount(rootRef, corridorText, { corridorMountId, debug: false });

  // Hamburger nav was retired per the Brand Codex hero contract — no
  // `.hud__nav` / `.hud__nav__btn` markup ships in the parsed body
  // any more, so the previous toggle + smooth-scroll effect would be
  // a no-op. Section navigation now happens via in-content CTAs
  // (e.g. the hero "See the practice" link) and the brandmark journey.

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
      tagIfEmpty(heroContent.querySelector(".hero__headline"), "title");
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

    // #about (.voidwalker) reveal attributes are AUTHORED in the prototype
    // markup since the 2026-07-16 emerge rework (ADR-045): the portrait
    // clip-wipes in first, then the orbit svg / particles / corner readouts
    // stagger around it. No JS tagging here — and no parallax on
    // `.voidwalker__orbit` (retired the same day; the cluster must sit
    // welded to the bio column while the emerge plays).

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
      [".build-quote__gateway__img", 0.04],
    ];
    parallaxMap.forEach(([selector, speed]) => {
      root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (!el.hasAttribute("data-parallax")) el.setAttribute("data-parallax", String(speed));
      });
    });
  }, []);

  // Hero terminal boot (owner, 2026-07-16): the headline scramble-decodes
  // (caption kernel — the same glitch as the corridor captions + services
  // masthead), the paragraph TYPES with a block cursor, and the CTA
  // buttons UNFURL centre-out like the arc console frames.
  //
  // LCP discipline (ADR-039): the hero text must paint at FCP, so this
  // effect NEVER holds text blank before hydration — it re-decodes the
  // ALREADY-PAINTED text at hydration as a one-shot boot moment (LCP is
  // recorded on the first largest paint; post-paint mutations don't
  // retract it). Reduced motion skips the whole boot (text stays as
  // painted, buttons visible via the data-m fade path).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const headline = root.querySelector<HTMLElement>(".hero__headline");
    const desc = root.querySelector<HTMLElement>(".hero__desc");
    const cta = root.querySelector<HTMLElement>(".hero__cta");
    if (!headline || !desc || !cta) return;

    // 1. Headline lines — wrap each text node in a span (the scramble
    //    kernel writes textContent, so <br/> must stay outside), blank,
    //    then queue staggered decodes.
    const lines: HTMLElement[] = [];
    Array.from(headline.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
        const span = document.createElement("span");
        span.className = "hero__headline-line";
        span.textContent = node.textContent;
        node.replaceWith(span);
        lines.push(span);
      }
    });
    const jobs: ScrambleJob[] = [];
    const t0 = performance.now() / 1000;
    const lineTargets = lines.map((el) => el.textContent ?? "");
    lines.forEach((el) => {
      el.textContent = "";
    });

    // 2. Paragraph typewriter — mutable text node + CRT block cursor
    //    (the ServicesMasthead intro recipe).
    const descText = desc.textContent ?? "";
    desc.textContent = "";
    const descNode = document.createTextNode("");
    const cursor = document.createElement("span");
    cursor.className = "hero__type-cursor";
    cursor.textContent = "█";
    desc.append(descNode, cursor);

    // 3. Buttons — clip shut now, unfurl on cue (CSS owns the motion).
    cta.setAttribute("data-unfurl", "shut");

    const HEADLINE_START_S = 0.12;
    const HEADLINE_STAGGER_S = 0.16;
    const DESC_START_S = 0.55;
    const DESC_CHARS_PER_S = 220;
    const CTA_AT_S = DESC_START_S + descText.length / DESC_CHARS_PER_S + 0.15;

    let raf = 0;
    let booted = false;
    let ctaOpened = false;
    const tick = () => {
      const nowSec = performance.now() / 1000;
      const t = nowSec - t0;
      if (!booted) {
        booted = true;
        lines.forEach((el, i) => {
          queueScramble(jobs, el, lineTargets[i], t0 + HEADLINE_START_S + i * HEADLINE_STAGGER_S);
        });
      }
      advanceScrambles(jobs, nowSec);
      // Typewriter advance (clamped, whole chars).
      const typed = Math.max(0, Math.min(descText.length, (t - DESC_START_S) * DESC_CHARS_PER_S));
      const head = Math.floor(typed);
      if (descNode.textContent !== descText.slice(0, head)) {
        descNode.textContent = descText.slice(0, head);
      }
      if (!ctaOpened && t >= CTA_AT_S) {
        ctaOpened = true;
        cta.setAttribute("data-unfurl", "open");
      }
      const done = jobs.length === 0 && head >= descText.length && ctaOpened;
      if (done) {
        cursor.remove();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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
            // `--depth` initial only — it is written every rAF onto
            // this rootRef by `useLandingScroll`, which is the closest
            // ancestor that owns the depth channel for the parsed
            // `.gateway` / station tree.
            "--depth": 0,
            // `--hero-cover` is intentionally NOT initialised here.
            // `useLandingScroll` writes the eased value to `#hero` on
            // the first useLayoutEffect (before paint), and every
            // subsequent rAF. Setting it inline on this rootRef would
            // shadow the `#hero`-level write at `0` for the entire band
            // — the parallax drift + content fade (ADR-022 v7) would
            // freeze with the hero locked at viewport 0. The CSS rules
            // use `var(--hero-cover, 0)` everywhere, so the fallback
            // handles the undefined-pre-mount case identically to an
            // explicit 0.
          } as React.CSSProperties
        }
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      {mergedSlots && <CelestialPortals slots={mergedSlots} containerRef={rootRef} />}
      <PhaseGlyphPortals containerRef={rootRef} />
      {/* #tools + #build retired (ADR-033): the four production cases
          live at the Arc's Build park now (the ADR-035 Arc Cases
          Terminal — a fixed DOM overlay armed by the "VIEW THE CASES"
          chip under the Build title; no in-canvas cases object).
          BuildCasesPortal + ToolsPortal are gone with their stations. */}
      <ServicesPortal containerRef={rootRef} />
      {/* About deck-flip stage (ADR-047): a nested root into the
          [data-about-root] slot inside #about — the pinned transparent
          stage the WebGL card deck flips onto. The static .voidwalker
          markup in the same station stays the mobile/PRM/fallback
          surface. Same nested-root rules as ServicesPortal. */}
      <AboutStagePortal containerRef={rootRef} />
      {/* (The ADR-054 #proof decode controller retired with ADR-056: the
          client case is a mounted component inside ServicesStage now, and
          owns its own reveal off the `--svc-proof-in` stage clock.
          ProofRevealController + lib/v7-parse/proofStation stay on disk
          for rollback.) */}
      {/* The "SOURCE BUS · 04" services rail register is RETIRED (ADR-044) —
          the section masthead's intro paragraph is the services right-side
          text now. ServicesRailRegisterPortal stays on disk for rollback;
          the [data-tools-rail-root] shell in the prototype stays (empty). */}
      {/* Rail manifest (ADR-031): the left rail's station backplane —
          sockets ahead, seated modules behind, one powered slot
          (absorbing the ADR-030 station label). NOT a nested root: the
          skeleton is parse-injected and this controller mutates it in
          place. */}
      <RailManifestController containerRef={rootRef} />
      {/* The journey overview moved to the nav corner (ADR-055): the
          left/right `CorridorSectionMenu` reels are retired — they only
          existed above 1101×760, so the indicator was missing on exactly
          the laptops and phones that need it. `HudNav` now carries the
          section readout, reading the SAME `<html>` active-index bus. */}
      {/* Hero → Corridor seam (ADR-022 v7, direct parallax reveal):
          NO proxy plane. The sticky `#hero` (z:1) drifts up + gently
          fades as the live corridor mount (`.home-corridor-host` z:3)
          rises over it in normal flow and lands directly on the live
          armed parked frame (`ThoughtformCompassGate` with the
          projected brandmark centred). The duplicated "second section
          copy that suddenly disappeared" beat from the v6 cover-plane
          sweep is gone with `HeroHandoffCover`. Hero motion is owned
          by CSS reading `--hero-cover` written by `useLandingScroll`. */}
      {/* IntelligenceLayerPortal + TravelingOrbits were removed when
          the Thoughtform / Diagnostic / Intelligence-layer station
          stack was replaced by the home-v2 depth corridor (ADR-018)
          on the production homepage. Their target anchors
          (`[data-ilayer-stack-root]`, `.sigil__orbits`,
          `.miss__orbits`) no longer exist in the parsed body HTML,
          so both portals would have been no-ops. The corridor
          renders its own ring/orbit/substrate choreography inside
          `DepthGatewayScene`. */}
      {/* Single brandmark entry point. Renders one canonical
          `BrandmarkGlyph` into each `data-brand-anchor` slot via
          portal, plus one fixed `BrandmarkActor` for transit/backdrop/
          orbit passes. The actor handle is forwarded so the
          choreography hook can drive its imperative API
          (morphRects / pinToRect / hide) unchanged. */}
      <BrandmarkSystem ref={brandmarkActorRef} rootRef={rootRef} />
      {/* Top-right HUD nav: inline links in the hero that collapse into
          a right-rail-aligned hamburger once the hero scrolls away. */}
      <HudNav />
      {/* Light/dark toggle (ADR-058): the bottom-right chrome band,
          inboard of the `--br` corner bracket, pairing with the ADR-043
          bottom-left wordmark. Its own fixed overlay outside `.hud`, so
          the hero curtain never clips it. Theme state lives INSIDE the
          leaf — a subscription here would re-render LandingPage and
          orphan the nested roots above (same rationale as
          CelestialEditorGate). */}
      {/* Bottom-right (ADR-059 U1, reshaped by U2): the journey's
          DESTINATION marks and the settings controls on one line — theme
          switch plus a session mark that only an allowlisted signed-in user
          ever sees. Replaces the standalone `LightModeToggle` on this
          route; `/arcs` still mounts that directly, having no cluster to
          join. The auth and journey subscriptions both live in the
          cluster's own leaves, never here. */}
      {THEME_TOGGLE && <SettingsCluster />}
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} />}
      {/* Auth-gated admin editor. Its `useAuth` subscription lives
          inside this leaf (NOT in LandingPage) so an auth-resolve
          re-render can't replace the dangerouslySetInnerHTML markup
          and orphan the nested-root portals above (ServicesPortal /
          ServicesRailRegisterPortal). See CelestialEditorGate for the
          full rationale. */}
      <CelestialEditorGate />
    </>
  );
}
