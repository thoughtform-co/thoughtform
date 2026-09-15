"use client";

/* ⚠ NO `useEffect` — the LAST one went with the dead `#practice`
   choreography (ADR-105). Anything added back here re-renders the component
   that owns every nested root. */
import { useLayoutEffect, useMemo, useRef } from "react";
import { useLandingScroll } from "./hooks/useLandingScroll";
import { useRevealMotion } from "./hooks/useRevealMotion";
import { useBrandmarkJourney } from "./hooks/useBrandmarkJourney";
import { useCorridorMount } from "./hooks/useCorridorMount";
import { type BrandmarkActorHandle } from "./BrandmarkActor";
import { BrandmarkSystem } from "./BrandmarkSystem";
import { HudNav, type NavItem } from "./HudNav";
import { useHeroBoot } from "./hooks/useHeroBoot";
import { THEME_TOGGLE } from "./themeToggle";
import { useBrandmarkSingletonCheck } from "./lib/brandmarkSingletonCheck";
import { CelestialPortals } from "./CelestialConnector/CelestialPortals";
import { PhaseGlyphPortals } from "./PhaseGlyph";
import { RailManifestController } from "./RailManifest";
import { HeroThemeGlitch } from "./HeroThemeGlitch";
import { RailInstruments } from "./rail-instruments/RailInstruments";
import { SettingsCluster } from "./rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "./rail-instruments/flags";
import type { JourneyRoster } from "./rail-instruments/journeyOrder";
import { AboutStagePortal } from "@/components/landing/home-v2/about/AboutStagePortal";
import { VoidwalkerPortal } from "@/components/landing/home-v2/voidwalker/VoidwalkerPortal";
import { SiteFooterPortal } from "@/components/landing/v7/site-footer/SiteFooterPortal";
import { ServicesPortal } from "@/components/landing/home-v2/services";
import { useCorridorExitScroll } from "@/components/landing/home-v2/hooks/useCorridorExitScroll";
import { CelestialEditorGate } from "@/components/admin/CelestialEditor/CelestialEditorGate";
import { useCelestialDrafts } from "@/components/admin/CelestialEditor/useCelestialDrafts";
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
  /**
   * A homepage VARIANT's nav items and journey roster (ADR-093).
   *
   * Both are PLAIN DATA, set once by the server route and never changed —
   * which is what makes them safe here. This component may not hold a
   * subscription (its `dangerouslySetInnerHTML` body hosts nested
   * `createRoot`s that a re-render orphans), but a constant prop costs no
   * re-render at all. Omitted on `/`, where the production defaults in
   * `HudNav` and `clusters.ts` already describe the page order.
   */
  navItems?: readonly NavItem[];
  journey?: JourneyRoster;
}

export function LandingPage({
  bodyHtml,
  bodyClass,
  celestialSlots,
  corridorText,
  corridorMountId = "home-corridor-mount",
  navItems,
  journey,
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
  /* ⚠ THE #practice CHOREOGRAPHY EFFECT IS DELETED (ADR-105), AND IT HAD
     BEEN DEAD FOR LONGER THAN THAT. It drove `--practice-progress`, a phase
     focus marker around the orbit and a `data-practice-active` flag off
     `.approach__phase` — and `approach` is in `CORRIDOR_REPLACED_STATIONS`,
     so `phases.length` has been 0 and the effect has early-returned on every
     production render since ADR-021. ~185 lines of no-op reading a station
     that no longer exists. Git history is the archive. */

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

  // Hero terminal boot (owner, 2026-07-16) — the headline decodes, the
  // paragraph types, the buttons unfurl. Lifted into a hook for ADR-075
  // so `/arcs/[slug]` boots its hero identically; the constants, the LCP
  // discipline (ADR-039) and the reduced-motion bail live there.
  useHeroBoot(rootRef);

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
      {/* The through-line (ADR-074 / ADR-082 U2): a nested root into the
          [data-voidwalker-root] slot inside #voidwalker. Production renders
          the era hologram; its capable pinned stage is transparent over the
          corridor and #practice owns the ambient kill. Static fallbacks are
          solid normal-flow DOM. Same nested-root rules as ServicesPortal. */}
      <VoidwalkerPortal containerRef={rootRef} />
      {/* The page's ending (ADR-105): a nested root into the
          [data-site-footer-root] slot inside #contact, which is also the
          corridor's opaque cover. Same nested-root rules as ServicesPortal
          — and here they are what keeps the contact form's state out of
          this component, where a re-render would re-apply the innerHTML and
          orphan every other portal on the page. */}
      <SiteFooterPortal containerRef={rootRef} />
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
      <HudNav items={navItems} />
      {/* Light/dark toggle (ADR-058): the bottom-right chrome band,
          inboard of the `--br` corner bracket, pairing with the ADR-043
          bottom-left wordmark. Its own fixed overlay outside `.hud`, so
          the hero curtain never clips it. Theme state lives INSIDE the
          leaf — a subscription here would re-render LandingPage and
          orphan the nested roots above (same rationale as
          CelestialEditorGate). */}
      {/* Bottom-right (ADR-059 U1, reshaped by U2–U3): the journey's
          `contact` mark, then a session mark only an allowlisted signed-in
          user ever sees, then the theme switch — one line, with the switch
          anchoring the frame line and new icons joining to its LEFT.
          Replaces the standalone `LightModeToggle` on this route; `/arcs`
          still mounts that directly, having no cluster to join. The auth
          and journey subscriptions both live in the cluster's own leaves,
          never here. */}
      {THEME_TOGGLE && <SettingsCluster roster={journey} />}
      {/* The hero key visual's theme swap plays a glitch (ADR-060). A leaf
          by the same law as the toggle above: it subscribes to the theme
          store IMPERATIVELY and synchronously, so the canvas covering the
          outgoing plate is drawn in the same task as the flip — before the
          browser paints the new one. It owns no state here. */}
      {THEME_TOGGLE && <HeroThemeGlitch containerRef={rootRef} />}
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} roster={journey} />}
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
