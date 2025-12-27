"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { ParticleCanvasV2 } from "../ParticleCanvasV2";
import { ThreeGateway } from "../ThreeGateway";
import { CanvasErrorBoundary } from "../CanvasErrorBoundary";
import { HUDFrame, NavigationBarHandle } from "../HUDFrame";
import { Wordmark } from "../Wordmark";
import { WordmarkSans } from "../WordmarkSans";
import { GlitchText } from "../GlitchText";
import { ParticleWordmarkMorph } from "../ParticleWordmarkMorph";
import type { ParticlePosition } from "../ThoughtformSigil";
import { useLenis } from "@/lib/hooks/useLenis";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { ParticleConfigProvider, useParticleConfig } from "@/lib/contexts/ParticleConfigContext";
import { SigilConfigProvider, useSigilConfig } from "@/lib/contexts/SigilConfigContext";
import { AdminGate, ParticleAdminPanel, AdminTools } from "@/components/admin";
import { useAuth } from "@/components/auth/AuthProvider";

// Extracted components
import { ModuleCards } from "./ModuleCards";
import { MobileModuleTabs } from "./MobileModuleTabs";
import { ConnectorLines } from "./ConnectorLines";
import { SigilSection } from "./SigilSection";
import { HeroBackgroundSigil } from "./HeroBackgroundSigil";
import { ManifestoTerminal } from "./ManifestoTerminal";
import { ManifestoSources } from "./ManifestoSources";
import { ManifestoVideoStack } from "./ManifestoVideoStack";
import { ManifestoMobileTabs, type ManifestoMobileTabId } from "./ManifestoMobileTabs";
import { RunwayArrows } from "./RunwayArrows";
import { MorphingCTAButtons } from "./MorphingCTAButtons";
import {
  ServicesDeck,
  SERVICES_CARD_WIDTH,
  SERVICES_CARD_GAP,
  SERVICES_DATA,
  DEFAULT_SIGIL_CONFIGS,
} from "./ServicesDeck";
import { ServicesStackMobile } from "./ServicesStackMobile";
import { SigilCanvas, type SigilConfig, DEFAULT_SIGIL_SIZE } from "./SigilCanvas";
import { SigilEditorPanel } from "./SigilEditorPanel";
// Styles consolidated into app/globals.css

// ═══════════════════════════════════════════════════════════════════
// HERO → DEFINITION TRANSITION
// ═══════════════════════════════════════════════════════════════════

// Fixed scroll thresholds for hero→definition transition
const HERO_END = 0; // Transition starts immediately on scroll
const DEF_START = 0.12; // Transition completes by 12% of total scroll

// Services card target height (the manifesto frame shrinks down into this)
const SERVICES_CARD_HEIGHT = 480;

// Easing function for smooth transition
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Linear interpolation helper
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Inner component that uses the config context
function NavigationCockpitInner() {
  const [activeSection, setActiveSection] = useState("hero");
  const { scrollProgress, scrollTo } = useLenis();
  const { config: rawConfig, hasChanges: hasParticleChanges } = useParticleConfig();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const isAdmin = !!user?.id;
  const { configs: sigilConfigsContext, updateConfig: updateSigilConfig } = useSigilConfig();
  const sigilConfigs: SigilConfig[] =
    sigilConfigsContext.length === 3
      ? (sigilConfigsContext as SigilConfig[])
      : (DEFAULT_SIGIL_CONFIGS as SigilConfig[]);
  const [editingServiceSigilIndex, setEditingServiceSigilIndex] = useState<number | null>(null);
  const [isBridgeHovered, setIsBridgeHovered] = useState(false);
  const [isParticleAdminOpen, setIsParticleAdminOpen] = useState(false);
  const [mobileManifestoTab, setMobileManifestoTab] = useState<ManifestoMobileTabId>("manifesto");

  const handleOpenSigilEditor = useCallback((cardIndex: number) => {
    setEditingServiceSigilIndex(cardIndex);
  }, []);

  const handleCloseSigilEditor = useCallback(() => {
    setEditingServiceSigilIndex(null);
  }, []);

  const handleSaveSigilEditor = useCallback(
    (updates: Partial<SigilConfig>) => {
      if (editingServiceSigilIndex === null) return;
      updateSigilConfig(editingServiceSigilIndex, updates);
    },
    [editingServiceSigilIndex, updateSigilConfig]
  );

  // Right-most service content (the bridge-frame morphs into this card)
  const rightService = SERVICES_DATA[2];
  // Read the CSS-driven rail width so the bridge frame stays aligned with the
  // same left axis as the wordmark + runway arrows across responsive breakpoints.
  const [railWidthPx, setRailWidthPx] = useState<number>(() => {
    if (typeof window === "undefined") return 60;
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--rail-width").trim();
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 60;
  });
  const hudSideInsetPx = railWidthPx + 120; // Matches: calc(var(--rail-width) + 120px)
  const definitionHeightRef = useRef<number>(280);
  const lastDefinitionHeightMeasureTsRef = useRef(0);

  // Keep rail width in sync on resize (media queries can change --rail-width).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const readRailWidth = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--rail-width")
        .trim();
      const parsed = Number.parseFloat(raw);
      setRailWidthPx(Number.isFinite(parsed) ? parsed : 60);
    };
    readRailWidth();
    window.addEventListener("resize", readRailWidth);
    return () => window.removeEventListener("resize", readRailWidth);
  }, []);

  // Refs for tracking element positions
  const wordmarkContainerRef = useRef<HTMLDivElement>(null);
  const wordmarkSvgRef = useRef<HTMLDivElement>(null); // For brandmark origin calculation
  const definitionWordmarkRef = useRef<HTMLDivElement>(null);
  const definitionRef = useRef<HTMLDivElement>(null);
  const modulesRef = useRef<HTMLDivElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const bridgeFrameRef = useRef<HTMLDivElement>(null);
  const moduleCardRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  // Ref for frame button to get its actual position
  const frameButtonRef = useRef<HTMLButtonElement>(null);
  const contactButtonRef = useRef<HTMLButtonElement>(null);

  // Ref for navbar logo (sigil destination)
  const navbarLogoRef = useRef<NavigationBarHandle>(null);

  // Ref to receive particle positions from ThoughtformSigil
  const sigilParticlesRef = useRef<ParticlePosition[]>([]);

  // State for wordmark bounds (for particle morph positioning)
  const [wordmarkBounds, setWordmarkBounds] = useState<DOMRect | null>(null);
  const [defWordmarkBounds, setDefWordmarkBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // State for navbar logo position (sigil destination when leaving definition section)
  const [navbarLogoPos, setNavbarLogoPos] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // State for manifesto scroll progress (0-1 within manifesto section)
  // Only used for geometric shapes animation after manifesto is complete
  const [manifestoScrollProgress, setManifestoScrollProgress] = useState(0);
  // When the manifesto finishes revealing, we snapshot the current scroll progress
  // within the manifesto section so the subsequent "manifesto → services" transition
  // can start from 0 (avoids the terminal sliding early if progress is already > 0).
  const manifestoCompleteProgressStartRef = useRef<number | null>(null);
  // Services transition should be paced by actual scroll distance (not the bounded section progress)
  // to avoid compressed/jumpy motion when the manifesto section is viewport-sized.
  const servicesStartScrollYRef = useRef<number | null>(null);

  // Manifesto reveal is driven by natural page scroll (no wheel capture / no camera intervention).
  const manifestoRevealProgress = useMemo(() => {
    // Reveal across the manifesto segment of the global scroll range.
    // 0.35 is where the terminal/question is fully "ready"; 0.50 is where services begins.
    const REVEAL_START = 0.35;
    const REVEAL_END = 0.5;
    const t = (scrollProgress - REVEAL_START) / (REVEAL_END - REVEAL_START);
    return Math.max(0, Math.min(1, t));
  }, [scrollProgress]);
  const manifestoComplete = manifestoRevealProgress >= 1;

  // Calculate scroll progress within manifesto section
  // Only calculate when manifesto is complete (for geometric shapes animation)
  // Throttle to avoid expensive getBoundingClientRect calls
  useEffect(() => {
    if (!manifestoRef.current || !manifestoComplete) {
      manifestoCompleteProgressStartRef.current = null;
      return;
    }

    let rafId: number | null = null;
    let lastProgress = manifestoScrollProgress;

    const computeManifestoProgress = (): {
      progress: number;
      rectTop: number;
      rectHeight: number;
      windowHeight: number;
      scrollRange: number;
      scrollDistance: number;
    } | null => {
      const element = manifestoRef.current;
      if (!element) return null;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;

      // Calculate progress: 0 = section top at viewport center, 1 = section scrolled through
      const viewportCenter = windowHeight * 0.5;
      const sectionTop = rect.top;
      const scrollRange = sectionHeight + windowHeight;
      const scrollDistance = viewportCenter - sectionTop;
      const progress = Math.max(0, Math.min(1, scrollDistance / scrollRange));
      return {
        progress,
        rectTop: rect.top,
        rectHeight: rect.height,
        windowHeight,
        scrollRange,
        scrollDistance,
      };
    };

    const updateManifestoProgress = (force = false): number | null => {
      const details = computeManifestoProgress();
      if (details === null) return null;
      const progress = details.progress;

      // Only update if progress changed significantly (throttle).
      // This value directly drives the manifesto→services transition, so keep it smooth.
      // (0.01 felt steppy/janky; 0.002 keeps motion continuous without spamming renders.)
      const EPS = 0.002;
      if (force || Math.abs(progress - lastProgress) > EPS) {
        setManifestoScrollProgress(progress);
        lastProgress = progress;
      }
      return progress;
    };

    const handleScroll = () => {
      if (rafId !== null) return; // Throttle to one RAF per scroll
      rafId = requestAnimationFrame(() => {
        updateManifestoProgress();
        rafId = null;
      });
    };

    // Only listen when manifesto is complete
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    // Initial calculation + snapshot baseline for post-reveal transitions
    const initial = updateManifestoProgress(true);
    if (typeof initial === "number") {
      manifestoCompleteProgressStartRef.current = initial;
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- manifestoScrollProgress used for init only, adding would cause infinite loop
  }, [manifestoComplete]);

  // Snapshot the scrollY when services becomes eligible (manifesto fully revealed).
  // This is used to pace the services transition over a consistent scroll distance.
  useEffect(() => {
    if (!manifestoComplete) {
      servicesStartScrollYRef.current = null;
      return;
    }
    if (servicesStartScrollYRef.current === null && typeof window !== "undefined") {
      servicesStartScrollYRef.current = window.scrollY;
    }
  }, [manifestoComplete]);

  // ═══════════════════════════════════════════════════════════════════
  // BRANDMARK ORIGIN CALCULATION
  // The brandmark (compass) is embedded in the "O" of THOUGHTFORM
  // Position: approximately x = 27%, y = 44% of the wordmark container
  // ═══════════════════════════════════════════════════════════════════
  const brandmarkOrigin = wordmarkBounds
    ? {
        x: wordmarkBounds.left + wordmarkBounds.width * 0.27,
        y: wordmarkBounds.top + wordmarkBounds.height * 0.44,
      }
    : null;

  // Measure wordmark bounds on mount and resize
  // Only update on scroll during hero→definition transition (when positions actually change)
  useEffect(() => {
    let rafId: number | null = null;
    let lastScrollProgress = scrollProgress;

    const updateBounds = () => {
      if (wordmarkSvgRef.current) {
        setWordmarkBounds(wordmarkSvgRef.current.getBoundingClientRect());
      }
      if (definitionWordmarkRef.current) {
        const rect = definitionWordmarkRef.current.getBoundingClientRect();
        setDefWordmarkBounds({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
      // Get navbar logo position for sigil destination
      if (navbarLogoRef.current) {
        const logoPos = navbarLogoRef.current.getLogoPosition();
        if (logoPos) {
          setNavbarLogoPos(logoPos);
        }
      }
    };

    updateBounds();
    window.addEventListener("resize", updateBounds);

    // Only update on scroll during hero→definition transition (0-0.12)
    // This avoids expensive getBoundingClientRect calls during manifesto section
    const scrollUpdate = () => {
      // Only update if we're in the transition range where positions change
      const inTransitionRange = scrollProgress >= 0 && scrollProgress <= 0.15;
      const scrollChanged = Math.abs(scrollProgress - lastScrollProgress) > 0.001;

      if (inTransitionRange && scrollChanged) {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updateBounds);
        lastScrollProgress = scrollProgress;
      }
    };

    window.addEventListener("scroll", scrollUpdate, { passive: true });
    return () => {
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", scrollUpdate);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [scrollProgress]);

  // Ensure the navbar logo destination position is correct after hydration / breakpoint changes.
  // On initial SSR/hydration, media-query hooks may render a different navbar layout first,
  // so we re-measure once the client has resolved the real viewport.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    raf = window.requestAnimationFrame(() => {
      if (!navbarLogoRef.current) return;
      const logoPos = navbarLogoRef.current.getLogoPosition();
      if (logoPos) setNavbarLogoPos(logoPos);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isMobile]);

  // Determine if we should show the SVG Vector I
  const showSvgVector = scrollProgress < 0.02;

  // Force-disable the canvas gateway since we're using Three.js gateway
  // Also disable Lorenz attractor since it's now rendered by ParticleVectorMorph
  const config = {
    ...rawConfig,
    landmarks: rawConfig.landmarks.map((l) =>
      l.shape === "gateway" || l.shape === "lorenz" ? { ...l, enabled: false } : l
    ),
  };

  // ═══════════════════════════════════════════════════════════════════
  // HERO → DEFINITION TRANSITION PROGRESS
  // Single normalized value (0→1) driving all transition animations
  // ═══════════════════════════════════════════════════════════════════
  const rawT = Math.max(0, Math.min(1, (scrollProgress - HERO_END) / (DEF_START - HERO_END)));
  const tHeroToDef = easeInOutCubic(rawT);

  // ═══════════════════════════════════════════════════════════════════
  // DEFINITION → MANIFESTO TRANSITION PROGRESS
  // Frame transforms from definition position to manifesto terminal
  // Synced with sigil exit animation (0.15 → 0.40)
  // ═══════════════════════════════════════════════════════════════════
  const DEF_TO_MANIFESTO_START = 0.15; // Start transforming at 15% (synced with sigil exit)
  const DEF_TO_MANIFESTO_END = 0.4; // Complete transformation by 40% (synced with sigil arrival)
  const rawTDefToManifesto = Math.max(
    0,
    Math.min(
      1,
      (scrollProgress - DEF_TO_MANIFESTO_START) / (DEF_TO_MANIFESTO_END - DEF_TO_MANIFESTO_START)
    )
  );
  const tDefToManifesto = easeInOutCubic(rawTDefToManifesto);

  // NOTE: Scroll capture intentionally disabled — manifesto reveal is scroll-driven and the
  // manifold/camera must never pause.
  const shouldCaptureScroll = false;
  // Keep manifesto terminal layout active for the whole manifesto phase so the question text
  // doesn't render in the "card" layout and then jump when we flip to terminal.
  const isManifestoTerminalMode = scrollProgress >= DEF_TO_MANIFESTO_START;

  // ═══════════════════════════════════════════════════════════════════
  // MANIFESTO → SERVICES TRANSITION PROGRESS
  // Terminal slides from center to right, sources/videos fade out
  // Only activates after manifesto reveal is complete
  // Uses same easing pattern as other transitions for consistent feel
  // Delayed by one scroll action (starts at 15% scroll progress)
  // ═══════════════════════════════════════════════════════════════════
  const tManifestoToServices = useMemo(() => {
    if (!manifestoComplete) return 0;
    if (typeof window === "undefined") return 0;

    // Pace by scroll distance so the transition isn't hypersensitive to section-relative progress.
    const startY = servicesStartScrollYRef.current ?? window.scrollY;
    const dy = Math.max(0, window.scrollY - startY);

    // Delay the start slightly (feels like “two scroll actions” buffer), then ramp over ~1.2 viewport heights.
    const delayPx = Math.max(80, window.innerHeight * 0.12);
    const durationPx = Math.max(1, window.innerHeight * 1.2);
    const rawProgress = Math.max(0, Math.min(1, (dy - delayPx) / durationPx));

    return easeInOutCubic(rawProgress);
  }, [manifestoComplete, scrollProgress]);

  // Services card emergence should feel like the Interface→Manifesto morph:
  // slightly delayed, slower ramp, no abrupt "pop".
  // Use exponential smoothing to eliminate jumps from scroll events.
  const tServicesCardsTarget = useMemo(() => {
    const raw = Math.max(0, Math.min(1, (tManifestoToServices - 0.08) / 0.92)); // Reduced delay: 0.12 → 0.08
    return easeInOutCubic(raw);
  }, [tManifestoToServices]);

  // Smooth tServicesCards with exponential interpolation via RAF to eliminate abrupt jumps
  const tServicesCardsSmoothedRef = useRef<number>(0);
  const [tServicesCards, setTServicesCards] = useState<number>(0);

  useEffect(() => {
    if (!manifestoComplete) {
      tServicesCardsSmoothedRef.current = 0;
      setTServicesCards(0);
      return;
    }

    let rafId: number | null = null;
    const smoothing = 0.85; // Slightly more responsive: 0.88 → 0.85 (lower = faster catch-up)

    const smooth = () => {
      const target = tServicesCardsTarget;
      const current = tServicesCardsSmoothedRef.current;
      const smoothed = current + (target - current) * (1 - smoothing);
      tServicesCardsSmoothedRef.current = smoothed;
      setTServicesCards(smoothed);

      // Continue smoothing if there's still a meaningful difference
      if (Math.abs(target - smoothed) > 0.001) {
        rafId = requestAnimationFrame(smooth);
      }
    };

    rafId = requestAnimationFrame(smooth);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [manifestoComplete, tServicesCardsTarget]);

  // Calculate frame position values for manifesto transition
  // Use BOTTOM positioning throughout for smooth, continuous transition
  //
  // CSS bottom positioning: larger value = frame higher up (closer to top of viewport)
  // To CENTER a frame: bottom = 50vh - (height/2)
  //
  // Definition state: bottom = 50vh - 70px, height = 100px
  // Manifesto state: bottom = 50vh - 200px, height = 400px (centered)
  const defBottomVh = 50;
  const defBottomPx = -70;

  // Frame growth values - define first since used in position calculations
  const baseWidth = 500;
  const widthGrowth = 280; // 500px → 780px (increased from 200 for wider manifesto panel)
  const baseHeight = 100;
  const heightGrowth = 300; // 100px → 400px (min-height)
  // Note: Actual content height is ~720px to fit question + manifesto text
  // Use actual content height for centering calculation
  const actualContentHeight = 720;

  // Manifesto CENTERED position: bottom = 50vh - (actualHeight/2)
  // This keeps the frame vertically centered based on actual content
  const manifestoBottomVh = 50;
  // NOTE: the px component is computed dynamically (inside `bridgeFrameStyles`) so the terminal
  // frame can "unroll" with the manifesto text reveal and fold back on reverse scroll.

  // Hero→definition bottom calculation (for definition state)
  const heroBottomPx = 90 * (1 - tHeroToDef);
  const heroBottomVh = tHeroToDef * defBottomVh;
  const heroBottomOffsetPx = tHeroToDef * defBottomPx;

  // Definition position (when tDefToManifesto = 0)
  const definitionBottomPx = heroBottomPx + heroBottomOffsetPx;
  const definitionBottomVh = heroBottomVh;

  // Apply smoother easing to growth for more subtle animation
  const growthProgress = tDefToManifesto;

  // Calculate current height during transition
  const currentHeight = baseHeight + growthProgress * heightGrowth;

  // Interpolate BOTTOM position for manifesto transition
  // As frame grows, adjust bottom to keep frame CENTERED (not pushed to top)
  // Dynamic center: bottom = 50vh - (currentHeight / 2)
  // Definition: 50vh - 70px (slightly off-center for small frame)
  // Manifesto: 50vh - 200px (centered for 400px frame)
  //
  // Interpolate from definition position to manifesto centered position
  // Memoize expensive calculations - recalculate only when transition progress changes
  // Card visibility: appears when frame is clearly visible (frame background is visible)
  // Frame background starts at tHeroToDef > 0.7, but button should wait until frame is more visible
  // Delay button appearance until tHeroToDef > 0.75 to ensure frame is clearly in view
  const cardOpacity =
    tHeroToDef > 0.75 ? Math.min(1, (tHeroToDef - 0.75) / 0.25) * (1 - tDefToManifesto) : 0;

  const bridgeFrameStyles = useMemo(() => {
    // Recalculate dependent values inside memo
    const heroBottomPx = 90 * (1 - tHeroToDef);
    const heroBottomVh = tHeroToDef * defBottomVh;
    const heroBottomOffsetPx = tHeroToDef * defBottomPx;
    const definitionBottomPx = heroBottomPx + heroBottomOffsetPx;
    const definitionBottomVh = heroBottomVh;
    const growthProgress = tDefToManifesto;

    // Frame height should keep unrolling while the manifesto text reveals (and fold back on reverse scroll),
    // otherwise the text collapses but the terminal frame stays fully expanded.
    //
    // Stage A: Definition → Terminal (question-only) height (driven by tDefToManifesto)
    // Stage B: Terminal height expands as manifesto text reveals (driven by manifestoRevealProgress)
    const definitionContentHeight = Math.max(
      160,
      Math.min(actualContentHeight, definitionHeightRef.current)
    );
    const terminalCollapsedHeightPx = Math.max(definitionContentHeight, 400);
    const terminalRevealT = Math.max(0, Math.min(1, manifestoRevealProgress));
    const terminalRevealHeightPx =
      terminalCollapsedHeightPx +
      terminalRevealT * (actualContentHeight - terminalCollapsedHeightPx);

    const manifestoBottomPxTarget = -(terminalRevealHeightPx / 2);
    const manifestoBottomPxCurrent =
      definitionBottomPx + (manifestoBottomPxTarget - definitionBottomPx) * tDefToManifesto;
    const manifestoBottomVhCurrent =
      definitionBottomVh + (manifestoBottomVh - definitionBottomVh) * tDefToManifesto;

    // Services: vertically center the cards (bottom = 50vh - cardHeight/2)
    // Interpolate from manifesto position to centered position
    const servicesBottomVh = 50;
    const servicesBottomPx = -SERVICES_CARD_HEIGHT / 2; // -210px to center 420px card
    const finalBottomPx =
      manifestoBottomPxCurrent +
      tManifestoToServices * (servicesBottomPx - manifestoBottomPxCurrent);
    const finalBottomVh =
      manifestoBottomVhCurrent +
      tManifestoToServices * (servicesBottomVh - manifestoBottomVhCurrent);

    // Final bottom position: smooth transition to centered position
    const finalBottom = `calc(${finalBottomPx}px + ${finalBottomVh}vh)`;

    // Card styling: visible during definition state, transitions to terminal
    // Card background appears when entering definition (tHeroToDef > 0.7)
    const cardBgOpacity = tHeroToDef > 0.7 ? Math.min(0.85, ((tHeroToDef - 0.7) / 0.3) * 0.85) : 0;
    // Blend to terminal background during manifesto transition
    const finalBgOpacity = cardBgOpacity + (0.5 - cardBgOpacity) * tDefToManifesto;

    // Border: card border during definition, terminal border during manifesto
    const cardBorderOpacity =
      tHeroToDef > 0.7 ? Math.min(0.2, ((tHeroToDef - 0.7) / 0.3) * 0.2) : 0;
    const finalBorderOpacity = cardBorderOpacity + (0.1 - cardBorderOpacity) * tDefToManifesto;

    // Calculate frame height
    // During definition state (tDefToManifesto = 0), use the measured definition height (avoids snap
    // when switching `height: auto` → fixed).
    // During manifesto, grow to the question-only terminal height, then continue "unrolling" as the
    // manifesto text reveals (terminalRevealHeightPx).
    const manifestoHeightPx =
      definitionContentHeight + growthProgress * (terminalRevealHeightPx - definitionContentHeight);
    const servicesTargetHeightPx = SERVICES_CARD_HEIGHT;
    const heightPx =
      manifestoHeightPx - tManifestoToServices * (manifestoHeightPx - servicesTargetHeightPx);
    const frameHeight = tDefToManifesto > 0 ? `${heightPx}px` : "auto";

    // ═══════════════════════════════════════════════════════════════════
    // MANIFESTO → SERVICES: Terminal slides from center to right
    // Manifesto: left: 50%, transform: translateX(-50%) → centered
    // Services: right: calc(var(--rail-width) + 120px) to match ModuleCards
    // tManifestoToServices is already eased, no double-easing needed
    // ═══════════════════════════════════════════════════════════════════

    // Base manifesto left position (centered)
    // Hero/Definition: left aligns to the same CSS axis as wordmark + runway arrows:
    //   left = calc(var(--rail-width) + 120px)
    // Manifesto: left transitions to 50% (centered)
    const heroLeftPx = hudSideInsetPx;
    const manifestoLeftPct = tDefToManifesto * 50; // 0% → 50%
    const manifestoLeftPx = (1 - tDefToManifesto) * heroLeftPx; // 180px → 0px (matches wordmark position)

    // Frame width for position calculations
    // During manifesto: grows from 500px → 700px
    // During services transition: shrinks from 700px → SERVICES_CARD_WIDTH
    const manifestoFrameWidth = baseWidth + growthProgress * widthGrowth;
    const servicesTargetWidth = SERVICES_CARD_WIDTH;
    const frameWidth =
      manifestoFrameWidth - tManifestoToServices * (manifestoFrameWidth - servicesTargetWidth);

    // ═══════════════════════════════════════════════════════════════════
    // CENTER THE 3-CARD DECK
    // The right card (bridge-frame) + 2 side cards should form a centered group.
    // Total deck width = 3 * cardWidth + 2 * gap = 1260px
    // Right card left edge = deck center + (deckWidth/2 - cardWidth) = center + 210px
    // ═══════════════════════════════════════════════════════════════════
    const deckTotalWidth = 3 * SERVICES_CARD_WIDTH + 2 * SERVICES_CARD_GAP; // 1260px
    // Offset from viewport center to right card's center
    const centeringOffset = deckTotalWidth / 2 - frameWidth / 2;

    // Keep a single positioning strategy (left + transform) the whole time
    // to avoid any 1-frame jump when switching between left/right positioning.
    //
    // When manifesto is centered: left=50%, transform=-50% (so center at 50vw)
    // When services: transform shifts right so the 3-card deck is centered
    const baseTransformPct = -50 * tDefToManifesto;
    const servicesDx =
      tManifestoToServices === 0 ? "0px" : `${tManifestoToServices * centeringOffset}px`;

    // Left positioning: during hero/definition, align to wordmark position
    // Use CSS calc for proper alignment: calc(var(--rail-width) + 120px)
    const leftPosition =
      tDefToManifesto < 0.001
        ? "calc(var(--rail-width) + 120px)" // Hero/Definition: align with wordmark and arrows
        : `calc(${manifestoLeftPx}px + ${manifestoLeftPct}%)`; // Manifesto: transition to center

    // Services phase styling: deepen the glass + border for the service card mode
    const servicesBgOpacity = 0.85;
    const bgOpacity = finalBgOpacity + (servicesBgOpacity - finalBgOpacity) * tManifestoToServices;
    const servicesBorderOpacity = 0.15;
    const borderOpacity =
      finalBorderOpacity + (servicesBorderOpacity - finalBorderOpacity) * tManifestoToServices;
    const baseBlurPx =
      8 * Math.max(tHeroToDef > 0.7 ? ((tHeroToDef - 0.7) / 0.3) * 4 : 0, tDefToManifesto * 8);
    const servicesBlurPx = 12;
    const blurPx = baseBlurPx + (servicesBlurPx - baseBlurPx) * tManifestoToServices;

    // Calculate scale factor for ManifestoTerminal content to shrink with frame
    // Scale from 1.0 (full size) down to frameWidth/manifestoFrameWidth as frame shrinks
    const contentScale = tManifestoToServices > 0 ? frameWidth / manifestoFrameWidth : 1;

    return {
      finalBottom,
      left: leftPosition,
      width: `${frameWidth}px`,
      height: frameHeight,
      transform: `translateX(calc(${baseTransformPct}% + ${servicesDx}))`,
      background: `rgba(10, 9, 8, ${bgOpacity})`,
      backdropFilter: `blur(${blurPx}px)`,
      border: `1px solid rgba(202, 165, 84, ${borderOpacity})`,
      "--terminal-opacity": tDefToManifesto,
      contentScale, // Scale factor for terminal content
    };
  }, [
    tHeroToDef,
    tDefToManifesto,
    tManifestoToServices,
    manifestoRevealProgress,
    hudSideInsetPx,
    defBottomVh,
    defBottomPx,
    manifestoBottomVh,
    baseWidth,
    widthGrowth,
    actualContentHeight,
    SERVICES_CARD_HEIGHT,
  ]);

  // Measure the definition frame height right before the manifesto transition starts.
  // This prevents the initial "auto → fixed height" snap from feeling sudden.
  useEffect(() => {
    if (isMobile) return;
    if (tHeroToDef < 0.9) return;
    // Measure only while we're still in definition (before the manifesto transition begins).
    if (scrollProgress < 0.12 || scrollProgress > 0.15) return;
    if (!bridgeFrameRef.current) return;

    const now = Date.now();
    if (now - lastDefinitionHeightMeasureTsRef.current < 250) return;
    lastDefinitionHeightMeasureTsRef.current = now;

    requestAnimationFrame(() => {
      const el = bridgeFrameRef.current;
      if (!el) return;
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) definitionHeightRef.current = h;
    });
  }, [isMobile, tHeroToDef, scrollProgress]);

  // Handle navigation
  const handleNavigate = useCallback(
    (sectionId: string) => {
      const element = document.getElementById(sectionId);
      if (element) {
        scrollTo(element);
      }
    },
    [scrollTo]
  );

  // Set up section detection based on scroll progress (matches visual transitions)
  // This is more accurate than IntersectionObserver because the visual content
  // is driven by scroll progress, not actual section positions
  useEffect(() => {
    // Determine active section based on scroll progress thresholds
    // These thresholds match the visual transitions
    let newSection = "hero";

    if (scrollProgress < 0.08) {
      // Hero section - initial state before any transition
      newSection = "hero";
    } else if (scrollProgress < 0.15) {
      // Definition/Interface section - after hero transition completes
      newSection = "definition";
    } else if (scrollProgress < 0.5) {
      // Manifesto section - after definition→manifesto transition starts
      newSection = "manifesto";
    } else if (scrollProgress < 0.82) {
      // Keep "manifesto" active until the terminal actually begins sliding to services.
      // This avoids accidental section changes while the manifesto is still being read.
      newSection = tManifestoToServices > 0.02 ? "services" : "manifesto";
    } else if (scrollProgress < 0.94) {
      // About section (extra scroll runway so contact doesn't appear too quickly)
      newSection = "about";
    } else {
      // Contact section
      newSection = "contact";
    }

    setActiveSection(newSection);
  }, [scrollProgress, tManifestoToServices]);

  return (
    <>
      {/* Fixed Background - V2 Particle System (Manifold) */}
      <CanvasErrorBoundary>
        <ParticleCanvasV2
          scrollProgress={scrollProgress}
          config={config}
          manifestoRevealProgress={manifestoRevealProgress}
          manifestoComplete={manifestoComplete}
          lockScrollProgress={shouldCaptureScroll}
        />
      </CanvasErrorBoundary>

      {/* Hero Background Sigil - fully formed in the distance, behind gateway */}
      <HeroBackgroundSigil scrollProgress={scrollProgress} config={rawConfig.sigil} />

      {/* Three.js Gateway Overlay - only in hero section, fades out on scroll */}
      <CanvasErrorBoundary>
        <ThreeGateway scrollProgress={scrollProgress} config={rawConfig.gateway} />
      </CanvasErrorBoundary>

      {/* ═══════════════════════════════════════════════════════════════════
          WORDMARK TRANSITION SYSTEM
          Phase 1 (t=0-0.25): Solid hero Wordmark fades out
          Phase 2 (t=0.10-0.90): ParticleWordmarkMorph animates
          Phase 3 (t=0.75-1): Solid WordmarkSans fades in
          ═══════════════════════════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════════════════════════
          WORDMARK - Slides from top-left (hero) to mid-left (above frame)
          Content morphs: Wordmark → particles → WordmarkSans
          ═══════════════════════════════════════════════════════════════════ */}

      {/* Wordmark container - slides from top, fades out when card appears */}
      <div
        className="hero-wordmark-container"
        ref={wordmarkContainerRef}
        style={{
          // Slide from top (90px) during hero transition
          // On mobile, let CSS control positioning
          top: isMobile
            ? undefined
            : `calc(${lerp(90, -100, tHeroToDef)}px + ${lerp(0, 50, tHeroToDef)}vh)`,
          // On mobile, apply centering transform
          transform: isMobile ? "translateX(-50%)" : undefined,
          // CSS variable for brandmark fade
          ["--brandmark-opacity" as string]: 1 - tHeroToDef,
          // Fade out when card appears (tHeroToDef > 0.7) - card has its own wordmark
          opacity:
            tHeroToDef < 0.7
              ? scrollProgress < 0.08
                ? 1
                : scrollProgress < 0.15
                  ? 1 - (scrollProgress - 0.08) / 0.07
                  : 0
              : 0,
          visibility: tHeroToDef < 0.7 && scrollProgress < 0.15 ? "visible" : "hidden",
        }}
      >
        {/* Hero Wordmark - stays visible until particles fully take over */}
        <div
          className="hero-wordmark-topleft"
          ref={wordmarkSvgRef}
          style={{
            // Keep visible until particles are fully visible (t=0.15)
            // Then fade out gradually as particles take over
            opacity: tHeroToDef < 0.15 ? 1 : tHeroToDef < 0.35 ? 1 - (tHeroToDef - 0.15) / 0.2 : 0,
            visibility: tHeroToDef > 0.35 ? "hidden" : "visible",
          }}
        >
          <Wordmark hideVectorI={!showSvgVector} />
        </div>

        {/* Definition Wordmark - fades in at end of transition (slower) */}
        {/* On mobile, hide this since wordmark is now inside the frame */}
        {!isMobile && (
          <div
            className="definition-wordmark-inner"
            ref={definitionWordmarkRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              opacity: tHeroToDef > 0.75 ? (tHeroToDef - 0.75) / 0.25 : 0,
              visibility: tHeroToDef > 0.7 ? "visible" : "hidden",
            }}
          >
            <WordmarkSans color="var(--dawn)" />
          </div>
        )}
      </div>

      {/* Particle Wordmark Morph - visible during mid-transition, cross-fades with wordmark in frame */}
      <ParticleWordmarkMorph
        morphProgress={tHeroToDef < 0.15 ? 0 : tHeroToDef > 0.85 ? 1 : (tHeroToDef - 0.15) / 0.7}
        wordmarkBounds={wordmarkBounds}
        targetBounds={defWordmarkBounds}
        visible={tHeroToDef > 0.1 && tHeroToDef < 1.05}
        opacity={
          // Fade out particles as wordmark in frame fades in (cross-fade)
          // Wordmark starts at 0.7, full at 1.0
          // Particles stay at full opacity until 0.7, then fade out to 0 by 1.0
          tHeroToDef < 0.7 ? 1 : tHeroToDef < 1.0 ? 1 - (tHeroToDef - 0.7) / 0.3 : 0
        }
      />

      {/* Runway arrows - show during hero transition and definition section, hide when manifesto starts */}
      {!isMobile && tDefToManifesto < 1 && (
        <RunwayArrows
          transitionProgress={tHeroToDef}
          tDefToManifesto={tDefToManifesto}
          frameButtonRef={frameButtonRef}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          BRIDGE FRAME - Unified text container that transitions from hero to definition
          SAME FRAME slides UP from bottom to center, only text content changes
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        ref={bridgeFrameRef}
        className={`bridge-frame${isMobile && tDefToManifesto > 0.5 ? " manifesto-active" : ""}${isMobile && manifestoComplete && tManifestoToServices > 0 ? " mobile-services-active" : ""}`}
        onMouseEnter={() => setIsBridgeHovered(true)}
        onMouseLeave={() => setIsBridgeHovered(false)}
        style={
          isMobile
            ? {
                // Smoothly re-center the frame as we enter manifesto on mobile.
                // Starts near the definition position (~12vh) and eases toward a true center (50vh + translateY(-50%)).
                ...(typeof tDefToManifesto === "number" && {
                  // Ease in a bit after the transition begins to avoid jumpy motion.
                  ["--manifesto-center-t" as string]: Math.min(
                    1,
                    Math.max(0, (tDefToManifesto - 0.15) / 0.85)
                  ),
                }),
                // MOBILE: Frame slides UP from bottom to below wordmark
                // At t=0: bottom: 8vh (hero position)
                // At t=1: top: 12vh (moved up for better positioning with wordmark inside)
                // During manifesto: frame extends from top to bottom
                ...(tHeroToDef < 0.5
                  ? {
                      // Hero→Definition: bottom-based positioning
                      bottom: `${8 + tHeroToDef * 30}vh`,
                      top: undefined,
                    }
                  : {
                      // Definition→Manifesto: top-based positioning (interpolates toward center)
                      bottom: "auto",
                      top: `calc(${46 - (tHeroToDef - 0.5) * 72}vh + (50vh - ${
                        46 - (tHeroToDef - 0.5) * 72
                      }vh) * var(--manifesto-center-t, 0))`,
                    }),
                // Stay visible throughout transition on mobile
                opacity: 1,
                visibility: "visible",
                pointerEvents: "auto",
                // Center horizontally
                transform: `translate(-50%, calc(-50% * var(--manifesto-center-t, 0)))`,
                transformOrigin: "center center",
                // Mobile background/border - same calculation as desktop
                // Background opacity: 0.85 during definition, 0.9 during manifesto (slightly darker)
                background: `rgba(10, 9, 8, ${
                  tDefToManifesto > 0.5
                    ? 0.92 // Manifesto: solid dark background
                    : tHeroToDef > 0.7
                      ? Math.min(0.85, ((tHeroToDef - 0.7) / 0.3) * 0.85) // Definition: fade in
                      : 0 // Hero: transparent
                })`,
                backdropFilter: `blur(${
                  tDefToManifesto > 0.5
                    ? 12 // Manifesto: full blur
                    : tHeroToDef > 0.7
                      ? ((tHeroToDef - 0.7) / 0.3) * 12 // Definition: fade in blur
                      : 0
                }px)`,
                WebkitBackdropFilter: `blur(${
                  tDefToManifesto > 0.5
                    ? 12
                    : tHeroToDef > 0.7
                      ? ((tHeroToDef - 0.7) / 0.3) * 12
                      : 0
                }px)`,
                border: `1px solid rgba(202, 165, 84, ${
                  tDefToManifesto > 0.5
                    ? 0.25 // Manifesto: visible gold border
                    : tHeroToDef > 0.7
                      ? Math.min(0.2, ((tHeroToDef - 0.7) / 0.3) * 0.2) // Definition: fade in border
                      : 0
                })`,
              }
            : {
                // DESKTOP: Frame moves from hero → definition → manifesto → services
                // Use BOTTOM positioning throughout for smooth, continuous transition
                bottom: bridgeFrameStyles.finalBottom,
                left: bridgeFrameStyles.left,
                width: bridgeFrameStyles.width,
                maxWidth: bridgeFrameStyles.width,
                height: bridgeFrameStyles.height,
                minHeight: tDefToManifesto > 0 ? bridgeFrameStyles.height : undefined,
                // Manifesto: keep clipped. Services: allow sigil particles to spill beyond the card.
                overflow:
                  tManifestoToServices > 0.12
                    ? "hidden"
                    : tDefToManifesto > 0.1
                      ? "hidden"
                      : "visible",
                opacity: 1,
                visibility: "visible",
                pointerEvents:
                  tHeroToDef > 0.95 || tHeroToDef < 0.05 || tDefToManifesto > 0 ? "auto" : "none",
                transform: bridgeFrameStyles.transform,
                transformOrigin: "center",
                ["--terminal-opacity" as string]: bridgeFrameStyles["--terminal-opacity"],
                background: bridgeFrameStyles.background,
                backdropFilter: bridgeFrameStyles.backdropFilter,
                border: bridgeFrameStyles.border,
                transition: "none", // We're animating via scroll, not CSS transitions
              }
        }
      >
        {/* Gold corner brackets - visible during hero and definition states */}
        {/* Hero state: full opacity gold corners (like terminal corners) */}
        {/* Definition state: card-style corners that fade during manifesto */}
        {/* Show on both desktop and mobile */}
        <>
          {/* Hero state corners - visible immediately on page load (before any scroll) */}
          {tHeroToDef < 0.7 && (
            <>
              <div
                className="terminal-corner terminal-corner-tl"
                style={{
                  position: "absolute",
                  top: -1,
                  left: -1,
                  width: "20px",
                  height: "20px",
                  borderTop: `2px solid rgba(202, 165, 84, 1)`,
                  borderLeft: `2px solid rgba(202, 165, 84, 1)`,
                  pointerEvents: "none",
                  zIndex: 50,
                }}
              />
              <div
                className="terminal-corner terminal-corner-br"
                style={{
                  position: "absolute",
                  bottom: -1,
                  right: -1,
                  width: "20px",
                  height: "20px",
                  borderBottom: `2px solid rgba(202, 165, 84, 1)`,
                  borderRight: `2px solid rgba(202, 165, 84, 1)`,
                  pointerEvents: "none",
                  zIndex: 50,
                }}
              />
            </>
          )}

          {/* Definition state card corners - fade during manifesto */}
          {tHeroToDef > 0.7 && (
            <>
              {/*
                Fade the card corners out much faster once the manifesto transition starts
                to avoid overlapping "frame" cues (card corners + terminal corners + outer border).
              */}
              <div
                className="card-corner card-corner-tl"
                style={{
                  position: "absolute",
                  top: -1,
                  left: -1,
                  width: "16px",
                  height: "16px",
                  borderTop: `1px solid rgba(202, 165, 84, ${
                    cardOpacity * 0.6 * Math.max(0, 1 - tDefToManifesto * 6)
                  })`,
                  borderLeft: `1px solid rgba(202, 165, 84, ${
                    cardOpacity * 0.6 * Math.max(0, 1 - tDefToManifesto * 6)
                  })`,
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              />
              <div
                className="card-corner card-corner-br"
                style={{
                  position: "absolute",
                  bottom: -1,
                  right: -1,
                  width: "16px",
                  height: "16px",
                  borderBottom: `1px solid rgba(202, 165, 84, ${
                    cardOpacity * 0.6 * Math.max(0, 1 - tDefToManifesto * 6)
                  })`,
                  borderRight: `1px solid rgba(202, 165, 84, ${
                    cardOpacity * 0.6 * Math.max(0, 1 - tDefToManifesto * 6)
                  })`,
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              />
            </>
          )}
        </>

        {/* Services card corners - fade in as manifesto transitions to services */}
        {!isMobile && tManifestoToServices > 0 && (
          <>
            <div
              className="service-card__corner service-card__corner--tl"
              style={{ opacity: tServicesCards }}
            />
            <div
              className="service-card__corner service-card__corner--br"
              style={{ opacity: tServicesCards }}
            />
          </>
        )}

        {/* Card content: Wordmark (top) + Definition text + Services button (bottom) */}
        {/* During manifesto transition: wordmark & services fade out, text morphs to question */}
        <div
          className="hero-text-frame"
          style={{
            opacity: 1,
            visibility: "visible",
            position: "relative",
            width: "100%",
            // Once the frame height becomes fixed (manifesto/services), lock inner layout to 100%
            // so the services overlay doesn't inherit the (still-in-DOM) manifesto content height.
            height: tDefToManifesto > 0 ? "100%" : "auto",
            display: "flex",
            flexDirection: "column",
            // Mobile: center content in hero state, left-align in manifesto
            // Desktop: center content in manifesto state for better visual balance
            alignItems:
              isMobile && tDefToManifesto < 0.5
                ? "center"
                : tDefToManifesto > 0.5
                  ? "center"
                  : "flex-start",
            justifyContent:
              isMobile && tDefToManifesto < 0.5
                ? "center"
                : tDefToManifesto > 0.5
                  ? "center"
                  : "flex-start",
            textAlign:
              isMobile && tDefToManifesto < 0.5
                ? "center"
                : tDefToManifesto > 0.5
                  ? "center"
                  : "left",
            // Padding: 24px when card visible, transitions to terminal padding
            // Services mode pulls padding back to the tighter service-card layout.
            padding: isMobile
              ? `${20 + 28 * tDefToManifesto}px ${24 - 4 * tDefToManifesto}px`
              : `${24 + 48 * tDefToManifesto * (1 - tManifestoToServices)}px 24px ${
                  24 - 8 * tDefToManifesto * (1 - tManifestoToServices)
                }px 24px`,
            pointerEvents: "auto",
            cursor: "default",
            zIndex: 2,
            ["--frame-opacity" as string]: 1 - tDefToManifesto,
            gap: isMobile ? "16px" : "20px",
            // Restore frame border and background during hero state (before bridge-frame has its own styling)
            // Only show when bridge-frame doesn't have its own border/background yet (tHeroToDef < 0.7)
            // Match opacity/transparency of other sections (same as terminal frame)
            border:
              tHeroToDef < 0.7
                ? `1px solid rgba(236, 227, 214, ${0.1 * (1 - tDefToManifesto)})`
                : undefined,
            background:
              tHeroToDef < 0.7 ? `rgba(10, 9, 8, ${0.25 * (1 - tDefToManifesto)})` : undefined,
            backdropFilter: tHeroToDef < 0.7 ? `blur(${8 * (1 - tDefToManifesto)}px)` : undefined,
            WebkitBackdropFilter:
              tHeroToDef < 0.7 ? `blur(${8 * (1 - tDefToManifesto)}px)` : undefined,
          }}
        >
          {/* Fade out the manifesto/definition content as we morph into services */}
          <div
            style={{
              opacity: 1 - tServicesCards,
              pointerEvents: tServicesCards > 0.05 ? "none" : "auto",
              transition: "none",
              ...(isMobile && tDefToManifesto > 0.95 && manifestoRevealProgress > 0
                ? {
                    // Mobile manifesto: make this wrapper a real flex column that fills the fixed-height frame,
                    // so the manifesto tab content can scroll while the CTA stays pinned.
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    minHeight: 0,
                    width: "100%",
                  }
                : {}),
            }}
          >
            {/* Wordmark inside card - appears when entering definition, fades during manifesto */}
            {/* Show on both desktop and mobile */}
            {tHeroToDef > 0.7 && tDefToManifesto < 1 && !isManifestoTerminalMode && (
              <div
                className="card-wordmark"
                style={{
                  opacity: cardOpacity,
                  visibility: cardOpacity > 0 ? "visible" : "hidden",
                  width: isMobile ? "min(210px, 70vw)" : "320px",
                  maxWidth: isMobile ? "min(210px, 70vw)" : "320px",
                  marginBottom: isMobile ? "12px" : "16px", // Space between logo and pronunciation
                }}
              >
                <WordmarkSans color="var(--dawn)" />
              </div>
            )}
            <div
              className="hero-tagline hero-tagline-v2 hero-tagline-main"
              style={{
                // Container for overlapping text - relative positioning
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
              }}
            >
              {/* Two-stage glitch transformation:
                Stage 1 (tHeroToDef): Hero text → Definition text  
                Stage 2 (tDefToManifesto): Definition text → Question text
                Pure opacity cross-fade - both elements overlap */}

              {/* Definition text - visible during hero and definition sections */}
              <span
                style={{
                  opacity: 1 - tDefToManifesto,
                  visibility: tDefToManifesto >= 1 ? "hidden" : "visible",
                  ...(isManifestoTerminalMode
                    ? {
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "100%",
                      }
                    : {}),
                }}
              >
                <GlitchText
                  initialText={`AI isn't software to command.
It's a strange intelligence to navigate.
Thoughtform is the interface.`}
                  finalText={`(θɔːtfɔːrm / THAWT-form)
the interface for navigating
human-AI collaboration.`}
                  progress={tHeroToDef}
                  className="bridge-content-glitch"
                />
              </span>

              {/* Question text - fades in during manifesto transition, positioned absolute to overlap */}
              <span
                style={{
                  position: isManifestoTerminalMode ? "relative" : "absolute",
                  ...(isManifestoTerminalMode
                    ? {}
                    : {
                        left: 0,
                        top: 0,
                      }),
                  opacity: tDefToManifesto,
                  visibility: tDefToManifesto <= 0 ? "hidden" : "visible",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <GlitchText
                  initialText={`(θɔːtfɔːrm / THAWT-form)
the interface for navigating
human-AI collaboration.`}
                  finalText={`AI ISN'T SOFTWARE`}
                  progress={tDefToManifesto}
                  className="bridge-content-glitch question-morph"
                />
                {/* Pulsing block cursor - only visible when terminal ready but manifesto not started */}
                {tDefToManifesto > 0.9 && manifestoRevealProgress === 0 && (
                  <span className="terminal-block-cursor"></span>
                )}
              </span>
            </div>

            {/* Manifesto content - appears below question when scrolling */}
            {/* Desktop: Simple terminal. Mobile: Tabbed interface with sources/voices */}
            {tDefToManifesto > 0.95 && manifestoRevealProgress > 0 && (
              <div
                style={{
                  marginTop: isMobile ? "16px" : "24px",
                  width: "100%",
                  transform: isMobile ? undefined : `scale(${bridgeFrameStyles.contentScale})`,
                  transformOrigin: "top left",
                  opacity: Math.max(0, 1 - tManifestoToServices * 3), // Fade out as services card appears
                  pointerEvents: tManifestoToServices > 0.3 ? "none" : "auto",
                  // Mobile: fill available space for tabbed content
                  ...(isMobile && {
                    flex: 1,
                    display: "flex",
                    flexDirection: "column" as const,
                    minHeight: 0,
                  }),
                }}
              >
                {isMobile ? (
                  <ManifestoMobileTabs
                    revealProgress={manifestoRevealProgress}
                    isVisible={true}
                    activeTab={mobileManifestoTab}
                    onStartJourney={() => handleNavigate("services")}
                  />
                ) : (
                  <ManifestoTerminal revealProgress={manifestoRevealProgress} isActive={true} />
                )}
              </div>
            )}
          </div>

          {/* Services card content (right-most card) */}
          {!isMobile && tManifestoToServices > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                gap: 0,
                opacity: tServicesCards,
                pointerEvents: tServicesCards > 0.5 ? "auto" : "none",
                overflow: "hidden",
                // GPU acceleration for smooth scroll-driven animation
                willChange: "opacity",
                backfaceVisibility: "hidden",
              }}
            >
              {/* Terminal-style header */}
              <div className="service-card__header">
                <span className="service-card__header-text">THOUGHTFORM@MANIFESTO:~</span>
              </div>

              {/* Admin edit icon (right card) - top-right, only on hover */}
              {isAdmin && (
                <button
                  className={`service-card__edit-btn ${isBridgeHovered ? "service-card__edit-btn--visible" : ""}`}
                  onClick={() => handleOpenSigilEditor(2)}
                  type="button"
                  aria-label="Edit sigil"
                  title="Edit sigil"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </button>
              )}

              <div className="service-card__content">
                <h3 className="service-card__title">{rightService.title}</h3>
                <p className="service-card__body">{rightService.body}</p>
              </div>

              <div className="service-card__sigil">
                <div
                  style={{
                    transform: `translate(${(sigilConfigs[2] ?? DEFAULT_SIGIL_CONFIGS[2]).offsetX ?? 0}%, ${(sigilConfigs[2] ?? DEFAULT_SIGIL_CONFIGS[2]).offsetY ?? 0}%)`,
                  }}
                >
                  <SigilCanvas
                    config={sigilConfigs[2] ?? DEFAULT_SIGIL_CONFIGS[2]}
                    size={(sigilConfigs[2] ?? DEFAULT_SIGIL_CONFIGS[2]).size ?? DEFAULT_SIGIL_SIZE}
                    seed={(sigilConfigs[2] ?? DEFAULT_SIGIL_CONFIGS[2]).seed ?? 42 + 2 * 1000}
                    allowSpill={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mobile Services Stack - rendered inside bridge-frame during services transition */}
          {isMobile && manifestoComplete && tManifestoToServices > 0 && (
            <div
              className="mobile-services-overlay"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                opacity: tServicesCards,
                pointerEvents: tServicesCards > 0.3 ? "auto" : "none",
                // GPU acceleration
                willChange: "opacity",
                backfaceVisibility: "hidden",
              }}
            >
              <ServicesStackMobile
                progress={tServicesCards}
                sigilConfigs={sigilConfigs}
                isVisible={tServicesCards > 0}
              />
            </div>
          )}
        </div>

        {/* Interface CTAs - original buttons (morph overlay takes over as soon as tDefToManifesto > 0) */}
        {/* Removed !isManifestoTerminalMode to allow smooth transition */}
        {tHeroToDef > 0.75 && tDefToManifesto < 0.7 && (
          <div
            className="interface-cta-row"
            style={{
              position: "absolute",
              left: 0,
              top: isMobile ? "calc(100% + 10px)" : "calc(100% + 14px)",
              // Keep in DOM for measurement, but hide + disable interaction once morph begins
              opacity: tDefToManifesto > 0 ? 0 : cardOpacity,
              visibility: cardOpacity > 0 ? "visible" : "hidden",
              width: "100%",
              display: "flex",
              flexDirection: "row",
              gap: isMobile ? "8px" : "22px",
              zIndex: 2,
              pointerEvents: tDefToManifesto > 0 ? "none" : "auto",
            }}
          >
            {/* Primary CTA */}
            <button
              ref={frameButtonRef}
              className="card-journey-btn"
              onClick={() => handleNavigate("services")}
              style={{
                flex: isMobile ? "65 1 0" : "1 1 auto",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? "6px" : "10px",
                background:
                  "linear-gradient(135deg, rgba(202, 165, 84, 0.15) 0%, rgba(202, 165, 84, 0.05) 50%, rgba(202, 165, 84, 0.1) 100%)",
                border: "1px solid rgba(202, 165, 84, 0.3)",
                borderRadius: "2px",
                padding: isMobile ? "10px 12px" : "14px 18px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-data, 'PT Mono', monospace)",
                fontSize: isMobile ? "9px" : "13px",
                fontWeight: 700,
                letterSpacing: isMobile ? "0.06em" : "0.15em",
                textTransform: "uppercase",
                color: "var(--gold, #caa554)",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(202, 165, 84, 0.25) 0%, rgba(202, 165, 84, 0.12) 50%, rgba(202, 165, 84, 0.2) 100%)";
                  e.currentTarget.style.borderColor = "rgba(202, 165, 84, 0.5)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(202, 165, 84, 0.15) 0%, rgba(202, 165, 84, 0.05) 50%, rgba(202, 165, 84, 0.1) 100%)";
                  e.currentTarget.style.borderColor = "rgba(202, 165, 84, 0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span
                data-role="journey-arrows-left"
                className="journey-arrow-pulse journey-arrow-pulse-left"
                style={{
                  fontSize: isMobile ? "10px" : "16px",
                  lineHeight: 1,
                  background:
                    "linear-gradient(135deg, rgba(202, 165, 84, 0.9) 0%, rgba(202, 165, 84, 0.6) 50%, rgba(202, 165, 84, 0.8) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  visibility: tHeroToDef < 0.8 ? "hidden" : "visible",
                  // Fade out faster during morph
                  opacity: 1 - tDefToManifesto * 3,
                }}
              >
                ›››
              </span>
              <span>START YOUR JOURNEY</span>
              <span
                data-role="journey-arrows-right"
                className="journey-arrow-pulse journey-arrow-pulse-right"
                style={{
                  fontSize: isMobile ? "10px" : "16px",
                  lineHeight: 1,
                  background:
                    "linear-gradient(135deg, rgba(202, 165, 84, 0.9) 0%, rgba(202, 165, 84, 0.6) 50%, rgba(202, 165, 84, 0.8) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  visibility: tHeroToDef < 0.8 ? "hidden" : "visible",
                  // Fade out faster during morph
                  opacity: 1 - tDefToManifesto * 3,
                }}
              >
                ‹‹‹
              </span>
            </button>

            {/* Secondary CTA - semantic dawn frame */}
            <button
              type="button"
              ref={contactButtonRef}
              onClick={() => handleNavigate("contact")}
              style={{
                flex: isMobile ? "35 1 0" : "0 0 172px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: isMobile ? "10px 12px" : "14px 14px",
                borderRadius: "2px",
                background: "rgba(10, 9, 8, 0.35)",
                border: "1px solid rgba(236, 227, 214, 0.28)",
                color: "var(--dawn, #ece3d6)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-data, 'PT Mono', monospace)",
                fontSize: isMobile ? "10px" : "13px",
                fontWeight: 700,
                letterSpacing: isMobile ? "0.08em" : "0.15em",
                textTransform: "uppercase",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = "rgba(236, 227, 214, 0.06)";
                  e.currentTarget.style.borderColor = "rgba(236, 227, 214, 0.45)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = "rgba(10, 9, 8, 0.35)";
                  e.currentTarget.style.borderColor = "rgba(236, 227, 214, 0.28)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              CONTACT
            </button>
          </div>
        )}

        {/* Terminal frame elements - appear during manifesto transition (behind text) */}
        <div
          className="terminal-content-wrapper"
          style={{
            // Cross-fade in during transition
            opacity: tDefToManifesto,
            visibility: tDefToManifesto > 0 ? "visible" : "hidden",
            // Keep absolute positioning - frame height is controlled by parent's height style
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            // Lower z-index until manifesto starts revealing, then bring to front
            zIndex: manifestoRevealProgress > 0 ? 3 : 1,
            // Don't constrain height - let content flow naturally within overflow:hidden parent
            // IMPORTANT: this layer is purely decorative (frame + scanlines). It must never
            // intercept pointer events, otherwise it can block clicking the Strategies sigil editor.
            pointerEvents: "none",
          }}
        >
          {/* Gold corner accents */}
          <div className="terminal-corner terminal-corner-tl"></div>
          <div className="terminal-corner terminal-corner-br"></div>

          {/* Terminal window frame */}
          <div
            className="terminal-header"
            style={{
              // This overlay layer is pointer-events:none, but we need the tab buttons clickable on mobile.
              pointerEvents:
                isMobile && tDefToManifesto > 0.95 && manifestoRevealProgress > 0 ? "auto" : "none",
            }}
          >
            <span className="terminal-title">thoughtform@manifesto:~</span>
            {isMobile && tDefToManifesto > 0.95 && manifestoRevealProgress > 0 && (
              <div className="terminal-tabs" aria-label="Manifesto tabs">
                <button
                  type="button"
                  className={`terminal-tab ${mobileManifestoTab === "manifesto" ? "active" : ""}`}
                  aria-pressed={mobileManifestoTab === "manifesto"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileManifestoTab("manifesto");
                  }}
                >
                  MANIFESTO
                </button>
                <button
                  type="button"
                  className={`terminal-tab ${mobileManifestoTab === "sources" ? "active" : ""}`}
                  aria-pressed={mobileManifestoTab === "sources"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileManifestoTab("sources");
                  }}
                >
                  SOURCES
                </button>
                <button
                  type="button"
                  className={`terminal-tab ${mobileManifestoTab === "voices" ? "active" : ""}`}
                  aria-pressed={mobileManifestoTab === "voices"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileManifestoTab("voices");
                  }}
                >
                  VOICES
                </button>
              </div>
            )}
          </div>

          {/* Terminal content */}
          <div className="terminal-body">
            {/* Scanlines overlay */}
            <div className="terminal-scanlines"></div>
          </div>
        </div>
      </div>

      {/* Fixed HUD Frame - Navigation Cockpit */}
      <HUDFrame
        ref={navbarLogoRef}
        activeSection={activeSection}
        scrollProgress={scrollProgress}
        onNavigate={handleNavigate}
      />

      {/* Morphing CTA Buttons - Evolve from full buttons to compact terminal-style menu
          Buttons appear in Interface section, then smoothly morph and move to bottom-left corner */}
      {!isMobile && (
        <MorphingCTAButtons
          tHeroToDef={tHeroToDef}
          tDefToManifesto={tDefToManifesto}
          isMobile={isMobile}
          onNavigate={handleNavigate}
          journeyButtonRef={frameButtonRef}
          contactButtonRef={contactButtonRef}
        />
      )}

      {/* Admin Tools - Only visible to authorized users */}
      <AdminGate>
        <AdminTools
          isParticleOpen={isParticleAdminOpen}
          onParticleToggle={setIsParticleAdminOpen}
          hasParticleChanges={hasParticleChanges}
        />
        <ParticleAdminPanel
          isOpen={isParticleAdminOpen}
          onClose={() => setIsParticleAdminOpen(false)}
        />
        {editingServiceSigilIndex !== null && (
          <SigilEditorPanel
            config={
              sigilConfigs[editingServiceSigilIndex] ??
              DEFAULT_SIGIL_CONFIGS[editingServiceSigilIndex]
            }
            onSave={handleSaveSigilEditor}
            onClose={handleCloseSigilEditor}
            cardIndex={editingServiceSigilIndex}
          />
        )}
      </AdminGate>

      {/* Manifesto Sources - Fixed left rail, appears with manifesto text, fades out quickly at services start */}
      {/* Desktop only - mobile shows sources in tabbed interface */}
      {!isMobile && (
        <div
          style={{
            // Fade out 3x faster - complete by 33% of transition
            opacity: Math.max(0, 1 - tManifestoToServices * 3),
            visibility: tManifestoToServices < 0.35 ? "visible" : "hidden",
          }}
        >
          <ManifestoSources isVisible={manifestoRevealProgress > 0.1} />
        </div>
      )}

      {/* Manifesto Video Stack - Fixed right side, appears with manifesto text, fades out quickly at services start */}
      {/* Desktop only - mobile shows voices in tabbed interface */}
      {!isMobile && (
        <div
          style={{
            // Fade out 3x faster - complete by 33% of transition
            opacity: Math.max(0, 1 - tManifestoToServices * 3),
            visibility: tManifestoToServices < 0.35 ? "visible" : "hidden",
          }}
        >
          <ManifestoVideoStack
            isVisible={manifestoRevealProgress > 0.1}
            revealProgress={manifestoRevealProgress}
          />
        </div>
      )}

      {/* Services Deck - Three service cards that fan out (desktop only) */}
      {!isMobile && (
        <ServicesDeck
          enabled={manifestoComplete}
          progress={tServicesCards}
          anchorBottom={bridgeFrameStyles.finalBottom}
          anchorLeft={bridgeFrameStyles.left}
          anchorTransform={bridgeFrameStyles.transform}
          cardWidthPx={Number.parseFloat(bridgeFrameStyles.width) || SERVICES_CARD_WIDTH}
          cardHeightPx={Number.parseFloat(bridgeFrameStyles.height) || SERVICES_CARD_HEIGHT}
          sigilConfigs={sigilConfigs}
          isAdmin={isAdmin}
          onEditClick={handleOpenSigilEditor}
          editingCardIndex={editingServiceSigilIndex}
        />
      )}

      {/* Mobile Services Stack is now rendered inside the bridge-frame above */}

      {/* Fixed Thoughtform Sigil - appears centered during definition section
          Animates from brandmark origin (in hero wordmark) to center,
          then to navbar logo when leaving definition section */}
      <SigilSection
        ref={definitionRef}
        scrollProgress={scrollProgress}
        config={rawConfig.sigil}
        onParticlePositions={sigilParticlesRef}
        originPos={brandmarkOrigin}
        destinationPos={navbarLogoPos}
        transitionProgress={tHeroToDef}
        onParticlesArrived={() => {
          // Trigger logo glow when particles arrive at navbar
          navbarLogoRef.current?.triggerLogoGlow();
        }}
        onParticlesReset={() => {
          // Reset logo color when scrolling back up
          navbarLogoRef.current?.resetLogoColor();
        }}
      />

      {/* Mobile Module Tabs - shown at bottom on mobile only */}
      {isMobile && (
        <MobileModuleTabs scrollProgress={scrollProgress} transitionProgress={tHeroToDef} />
      )}

      {/* Scroll Container - Content Sections */}
      <main className="scroll-container">
        {/* Section 1: Hero - Simplified */}
        <section className="section section-hero" id="hero" data-section="hero">
          <div className="hero-layout">
            {/* Connecting lines from module cards to sigil - desktop only */}
            {!isMobile && (
              <ConnectorLines
                scrollProgress={scrollProgress}
                transitionProgress={tHeroToDef}
                cardRefs={moduleCardRefs}
                sigilParticlesRef={sigilParticlesRef}
              />
            )}

            {/* Module cards on the right - desktop only */}
            {!isMobile && (
              <ModuleCards
                ref={modulesRef}
                scrollProgress={scrollProgress}
                transitionProgress={tHeroToDef}
                cardRefs={moduleCardRefs}
              />
            )}
          </div>
        </section>

        {/* Section 2: Definition - The Semantic Core with Sigil */}
        <section className="section section-definition" id="definition" data-section="definition">
          {/* Placeholder for layout */}
          <div className="sigil-placeholder" />
        </section>

        {/* Section 3: Manifesto - Cinematic sci-fi terminal sequence */}
        <section
          ref={manifestoRef}
          className="section section-manifesto"
          id="manifesto"
          data-section="manifesto"
        >
          {/* Background geometric shapes that appear during typing */}
          <div className="manifesto-bg-shapes">
            <div
              className="geo-shape geo-shape-1"
              style={{
                opacity: manifestoComplete
                  ? Math.min(1, Math.max(0, (manifestoScrollProgress - 0.1) * 2))
                  : 0,
              }}
            ></div>
            <div
              className="geo-shape geo-shape-2"
              style={{
                opacity: manifestoComplete
                  ? Math.min(1, Math.max(0, (manifestoScrollProgress - 0.2) * 2))
                  : 0,
              }}
            ></div>
            <div
              className="geo-shape geo-shape-3"
              style={{
                opacity: manifestoComplete
                  ? Math.min(1, Math.max(0, (manifestoScrollProgress - 0.3) * 2))
                  : 0,
              }}
            ></div>
            <div
              className="geo-grid"
              style={{
                opacity: manifestoComplete
                  ? Math.min(1, Math.max(0, (manifestoScrollProgress - 0.15) * 2))
                  : 0,
              }}
            ></div>
          </div>
        </section>

        {/* Section 4: Services - Content rendered as fixed overlay above */}
        <section className="section section-services" id="services" data-section="services">
          {/* Scroll anchor - actual content is fixed positioned and animated */}
        </section>

        {/* Section 5: About - spacer section to extend runway before contact */}
        <section className="section section-about" id="about" data-section="about">
          <div className="section-layout">
            <div className="section-label">
              <span className="label-number">05</span>
              <span className="label-text">About</span>
            </div>

            <div className="section-content">
              <div className="section-meta">
                <span className="meta-label">Landmark:</span>
                <span className="meta-value">continuum drift / story field</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Contact */}
        <section className="section section-contact" id="contact" data-section="contact">
          <div className="section-layout">
            <div className="section-label">
              <span className="label-number">06</span>
              <span className="label-text">Contact</span>
            </div>

            <div className="section-content section-content-centered">
              <h2 className="headline">Plot Your Course</h2>

              <p className="text text-center">Ready to navigate intelligence with your team?</p>

              <a href="mailto:hello@thoughtform.co" className="btn btn-primary btn-large">
                Initiate Contact
              </a>

              <div className="contact-email">hello@thoughtform.co</div>

              <div className="section-meta">
                <span className="meta-label">Landmark:</span>
                <span className="meta-value">event horizon / destination lock</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// Main component with provider wrapper
export function NavigationCockpitV2() {
  return (
    <ParticleConfigProvider>
      <SigilConfigProvider>
        <NavigationCockpitInner />
      </SigilConfigProvider>
    </ParticleConfigProvider>
  );
}
