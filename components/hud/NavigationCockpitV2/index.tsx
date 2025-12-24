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
import { AdminGate, ParticleAdminPanel } from "@/components/admin";

// Extracted components
import { ModuleCards } from "./ModuleCards";
import { MobileModuleTabs } from "./MobileModuleTabs";
import { ConnectorLines } from "./ConnectorLines";
import { SigilSection } from "./SigilSection";
import { HeroBackgroundSigil } from "./HeroBackgroundSigil";
import { ManifestoTerminal } from "./ManifestoTerminal";
import { ManifestoSources } from "./ManifestoSources";
import { ManifestoVideoStack } from "./ManifestoVideoStack";
import { RunwayArrows } from "./RunwayArrows";
import { useScrollCapture } from "./hooks/useScrollCapture";
// Styles consolidated into app/globals.css

// ═══════════════════════════════════════════════════════════════════
// HERO → DEFINITION TRANSITION
// ═══════════════════════════════════════════════════════════════════

// Fixed scroll thresholds for hero→definition transition
const HERO_END = 0; // Transition starts immediately on scroll
const DEF_START = 0.12; // Transition completes by 12% of total scroll

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
  const { config: rawConfig } = useParticleConfig();
  const isMobile = useIsMobile();

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

  // State for manifesto reveal progress (scroll-capture based)
  const [manifestoRevealProgress, setManifestoRevealProgress] = useState(0);
  const [manifestoComplete, setManifestoComplete] = useState(false);

  // Calculate scroll progress within manifesto section
  // Only calculate when manifesto is complete (for geometric shapes animation)
  // Throttle to avoid expensive getBoundingClientRect calls
  useEffect(() => {
    if (!manifestoRef.current || !manifestoComplete) return;

    let rafId: number | null = null;
    let lastProgress = manifestoScrollProgress;

    const updateManifestoProgress = () => {
      const element = manifestoRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;

      // Calculate progress: 0 = section top at viewport center, 1 = section scrolled through
      const viewportCenter = windowHeight * 0.5;
      const sectionTop = rect.top;
      const scrollRange = sectionHeight + windowHeight;
      const scrollDistance = viewportCenter - sectionTop;
      const progress = Math.max(0, Math.min(1, scrollDistance / scrollRange));

      // Only update if progress changed significantly (throttle)
      if (Math.abs(progress - lastProgress) > 0.01) {
        setManifestoScrollProgress(progress);
        lastProgress = progress;
      }
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
    updateManifestoProgress(); // Initial calculation

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- manifestoScrollProgress used for init only, adding would cause infinite loop
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

  // Scroll capture: when terminal is visible and question is shown, capture scroll to reveal manifesto
  const shouldCaptureScroll = tDefToManifesto > 0.95 && !manifestoComplete;
  // Keep manifesto terminal layout active for the whole manifesto phase so the question text
  // doesn't render in the "card" layout and then jump when we flip to terminal.
  const isManifestoTerminalMode = scrollProgress >= DEF_TO_MANIFESTO_START;

  useScrollCapture({
    isActive: shouldCaptureScroll,
    progress: manifestoRevealProgress,
    onProgressChange: setManifestoRevealProgress,
    scrollSpeed: 0.0015, // Slower for comfortable reading
    onComplete: () => setManifestoComplete(true),
  });

  // Reset manifesto progress when scrolling back up (leaving terminal view)
  useEffect(() => {
    if (tDefToManifesto < 0.9 && (manifestoRevealProgress > 0 || manifestoComplete)) {
      setManifestoRevealProgress(0);
      setManifestoComplete(false);
    }
  }, [tDefToManifesto, manifestoRevealProgress, manifestoComplete]);

  // ═══════════════════════════════════════════════════════════════════
  // MANIFESTO → SERVICES TRANSITION PROGRESS
  // Terminal slides from center to right, sources/videos fade out
  // Only activates after manifesto reveal is complete
  // Uses same easing pattern as other transitions for consistent feel
  // Delayed by one scroll action (starts at 15% scroll progress)
  // ═══════════════════════════════════════════════════════════════════
  const tManifestoToServices = useMemo(() => {
    if (!manifestoComplete) return 0;
    // Delay start by ~30% of scroll range (two scroll actions buffer)
    const DELAY_START = 0.3;
    const delayedProgress = Math.max(0, manifestoScrollProgress - DELAY_START) / (1 - DELAY_START);
    const rawProgress = Math.min(1, delayedProgress);
    // Apply same easeInOutCubic as other transitions for consistent motion
    return easeInOutCubic(rawProgress);
  }, [manifestoComplete, manifestoScrollProgress]);

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
  const widthGrowth = 200; // 500px → 700px
  const baseHeight = 100;
  const heightGrowth = 300; // 100px → 400px (min-height)
  // Note: Actual content height is ~720px to fit question + manifesto text
  // Use actual content height for centering calculation
  const actualContentHeight = 720;

  // Manifesto CENTERED position: bottom = 50vh - (actualHeight/2)
  // This keeps the frame vertically centered based on actual content
  const manifestoBottomVh = 50;
  const manifestoBottomPx = -(actualContentHeight / 2); // -360px for ~720px content

  // Hero→definition bottom calculation (for definition state)
  const heroBottomPx = 90 * (1 - tHeroToDef);
  const heroBottomVh = tHeroToDef * defBottomVh;
  const heroBottomOffsetPx = tHeroToDef * defBottomPx;

  // Definition position (when tDefToManifesto = 0)
  const definitionBottomPx = heroBottomPx + heroBottomOffsetPx;
  const definitionBottomVh = heroBottomVh;

  // Apply smoother easing to growth for more subtle animation
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const growthProgress = easeOutCubic(tDefToManifesto);

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
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const growthProgress = easeOutCubic(tDefToManifesto);

    const manifestoBottomPxCurrent =
      definitionBottomPx + (manifestoBottomPx - definitionBottomPx) * tDefToManifesto;
    const manifestoBottomVhCurrent =
      definitionBottomVh + (manifestoBottomVh - definitionBottomVh) * tDefToManifesto;

    // Final bottom position: smooth transition to centered position
    const finalBottom = `calc(${manifestoBottomPxCurrent}px + ${manifestoBottomVhCurrent}vh)`;

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
    // During definition state (tDefToManifesto = 0), content needs ~280px (wordmark + text + button + padding)
    // During manifesto transition, grow to actualContentHeight (720px)
    const definitionContentHeight = 280; // Approximate height needed for definition content
    const frameHeight =
      tDefToManifesto > 0
        ? `${definitionContentHeight + growthProgress * (actualContentHeight - definitionContentHeight)}px`
        : "auto";

    // ═══════════════════════════════════════════════════════════════════
    // MANIFESTO → SERVICES: Terminal slides from center to right
    // Manifesto: left: 50%, transform: translateX(-50%) → centered
    // Services: right side with margin from edge
    // tManifestoToServices is already eased, no double-easing needed
    // ═══════════════════════════════════════════════════════════════════

    // Base manifesto left position (centered)
    const manifestoLeftPct = tDefToManifesto * 50; // 0% → 50%
    const manifestoLeftPx = (1 - tDefToManifesto) * 184; // 184px → 0px

    // Services position: slide from center (50%) to right (75%)
    // This puts the terminal on the right ~25% from right edge
    const servicesLeftPct = manifestoLeftPct + tManifestoToServices * 25; // 50% → 75%

    // Transform: manifesto is translateX(-50%) for centering
    // Services: translateX(-50%) stays same since we're adjusting left%
    const transformX = -50 * tDefToManifesto;

    return {
      finalBottom,
      left: `calc(${manifestoLeftPx}px + ${servicesLeftPct}%)`,
      width: `${baseWidth + growthProgress * widthGrowth}px`,
      height: frameHeight,
      transform: `translateX(${transformX}%)`,
      background: `rgba(10, 9, 8, ${finalBgOpacity})`,
      backdropFilter: `blur(${8 * Math.max(tHeroToDef > 0.7 ? ((tHeroToDef - 0.7) / 0.3) * 4 : 0, tDefToManifesto * 8)}px)`,
      border: `1px solid rgba(202, 165, 84, ${finalBorderOpacity})`,
      "--terminal-opacity": tDefToManifesto,
    };
  }, [
    tHeroToDef,
    tDefToManifesto,
    tManifestoToServices,
    defBottomVh,
    defBottomPx,
    manifestoBottomPx,
    manifestoBottomVh,
    baseWidth,
    widthGrowth,
    actualContentHeight,
  ]);

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
    } else if (scrollProgress < 0.75) {
      // Services section
      newSection = "services";
    } else {
      // Contact section
      newSection = "contact";
    }

    setActiveSection(newSection);
  }, [scrollProgress]);

  return (
    <>
      {/* Fixed Background - V2 Particle System (Manifold) */}
      <CanvasErrorBoundary>
        <ParticleCanvasV2 scrollProgress={scrollProgress} config={config} />
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
        className={`bridge-frame${isMobile && tDefToManifesto > 0.5 ? " manifesto-active" : ""}`}
        style={
          isMobile
            ? {
                // MOBILE: Frame slides UP from bottom to below wordmark
                // At t=0: bottom: 8vh (hero position)
                // At t=1: top: 12vh (moved up for better positioning with wordmark inside)
                // During manifesto: frame extends from top to bottom
                ...(tDefToManifesto > 0.5
                  ? {
                      // Manifesto state: fit content, positioned near top
                      top: "10vh",
                      bottom: "auto",
                      height: "auto",
                    }
                  : {
                      // Definition state: positioned from top/bottom
                      bottom: tHeroToDef < 0.5 ? `${8 + tHeroToDef * 30}vh` : undefined,
                      top: tHeroToDef >= 0.5 ? `${48 - (tHeroToDef - 0.5) * 72}vh` : undefined,
                    }),
                // Stay visible throughout transition on mobile
                opacity: 1,
                visibility: "visible",
                pointerEvents: "auto",
                // Center horizontally
                transform: "translateX(-50%)",
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
                // DESKTOP: Frame moves from hero → definition → manifesto
                // Use BOTTOM positioning throughout for smooth, continuous transition
                bottom: bridgeFrameStyles.finalBottom,
                left: bridgeFrameStyles.left,
                width: bridgeFrameStyles.width,
                maxWidth: bridgeFrameStyles.width,
                height: bridgeFrameStyles.height,
                minHeight: tDefToManifesto > 0 ? bridgeFrameStyles.height : undefined,
                overflow: tDefToManifesto > 0.1 ? "hidden" : "visible", // Delay overflow hidden slightly
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
        {/* Card corner brackets - visible during definition state, fade during manifesto */}
        {/* Show on both desktop and mobile */}
        {tHeroToDef > 0.7 && (
          <>
            <div
              className="card-corner card-corner-tl"
              style={{
                position: "absolute",
                top: -1,
                left: -1,
                width: "16px",
                height: "16px",
                borderTop: `1px solid rgba(202, 165, 84, ${cardOpacity * 0.6})`,
                borderLeft: `1px solid rgba(202, 165, 84, ${cardOpacity * 0.6})`,
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
                borderBottom: `1px solid rgba(202, 165, 84, ${cardOpacity * 0.6})`,
                borderRight: `1px solid rgba(202, 165, 84, ${cardOpacity * 0.6})`,
                pointerEvents: "none",
                zIndex: 5,
              }}
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
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            // Padding: 24px when card visible, transitions to terminal padding
            padding: `${24 + 48 * tDefToManifesto}px 24px ${24 - 8 * tDefToManifesto}px 24px`,
            pointerEvents: "auto",
            cursor: "default",
            zIndex: 2,
            ["--frame-opacity" as string]: 1 - tDefToManifesto,
            gap: "20px", // Increased gap for better spacing between elements
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
                width: isMobile ? "100%" : "320px",
                maxWidth: isMobile ? "100%" : "320px",
                marginBottom: "4px", // Reduced since gap handles spacing
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
Thoughtform teaches how.`}
                finalText={`(θɔːtfɔːrm / THAWT-form)
the interface for human-AI collaboration`}
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
the interface for human-AI collaboration`}
                finalText={`But why is AI so different?`}
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
          {tDefToManifesto > 0.95 && manifestoRevealProgress > 0 && (
            <div
              style={{
                marginTop: "24px",
                width: "100%",
              }}
            >
              <ManifestoTerminal
                revealProgress={manifestoRevealProgress}
                isActive={true}
                onComplete={() => setManifestoComplete(true)}
              />
            </div>
          )}
        </div>

        {/* Interface CTAs - outside the main frame, aligned to the same width */}
        {tHeroToDef > 0.75 && tDefToManifesto < 1 && !isManifestoTerminalMode && (
          <div
            className="interface-cta-row"
            style={{
              // Position below the frame so it doesn't extend the frame's background panel
              // (only the logo/pronunciation frame should have the dark background)
              position: "absolute",
              left: 0,
              top: isMobile ? "calc(100% + 10px)" : "calc(100% + 14px)",
              opacity: cardOpacity,
              visibility: cardOpacity > 0 ? "visible" : "hidden",
              width: "100%",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              // More breathing room between CTAs on desktop
              gap: isMobile ? "10px" : "22px",
              zIndex: 2,
              pointerEvents: "auto",
            }}
          >
            {/* Primary CTA */}
            <button
              ref={frameButtonRef}
              className="card-journey-btn"
              onClick={() => handleNavigate("services")}
              style={{
                flex: "1 1 auto",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                background:
                  "linear-gradient(135deg, rgba(202, 165, 84, 0.15) 0%, rgba(202, 165, 84, 0.05) 50%, rgba(202, 165, 84, 0.1) 100%)",
                border: "1px solid rgba(202, 165, 84, 0.3)",
                borderRadius: "2px",
                padding: isMobile ? "12px 16px" : "14px 18px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-data, 'PT Mono', monospace)",
                fontSize: isMobile ? "12px" : "13px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--gold, #caa554)",
                lineHeight: 1,
                whiteSpace: "nowrap",
                width: "100%",
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
                  fontSize: isMobile ? "14px" : "16px",
                  lineHeight: 1,
                  background:
                    "linear-gradient(135deg, rgba(202, 165, 84, 0.9) 0%, rgba(202, 165, 84, 0.6) 50%, rgba(202, 165, 84, 0.8) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  // Only show after morph completes
                  visibility: tHeroToDef < 0.8 ? "hidden" : "visible",
                }}
              >
                ›››
              </span>
              <span>START YOUR JOURNEY</span>
              <span
                data-role="journey-arrows-right"
                className="journey-arrow-pulse journey-arrow-pulse-right"
                style={{
                  fontSize: isMobile ? "14px" : "16px",
                  lineHeight: 1,
                  background:
                    "linear-gradient(135deg, rgba(202, 165, 84, 0.9) 0%, rgba(202, 165, 84, 0.6) 50%, rgba(202, 165, 84, 0.8) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  // Only show after morph completes
                  visibility: tHeroToDef < 0.8 ? "hidden" : "visible",
                }}
              >
                ‹‹‹
              </span>
            </button>

            {/* Secondary CTA - semantic dawn frame */}
            <button
              type="button"
              onClick={() => handleNavigate("contact")}
              style={{
                flex: isMobile ? "1 1 auto" : "0 0 172px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: isMobile ? "12px 16px" : "14px 14px",
                borderRadius: "2px",
                background: "rgba(10, 9, 8, 0.35)",
                border: "1px solid rgba(236, 227, 214, 0.28)",
                color: "var(--dawn, #ece3d6)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-data, 'PT Mono', monospace)",
                fontSize: isMobile ? "12px" : "13px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                lineHeight: 1,
                whiteSpace: "nowrap",
                width: "100%",
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
            pointerEvents: manifestoRevealProgress > 0 ? "auto" : "none",
          }}
        >
          {/* Gold corner accents */}
          <div className="terminal-corner terminal-corner-tl"></div>
          <div className="terminal-corner terminal-corner-br"></div>

          {/* Terminal window frame */}
          <div className="terminal-header">
            <span className="terminal-title">thoughtform@manifesto:~</span>
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

      {/* Admin Panel - Only visible to authorized users */}
      <AdminGate>
        <ParticleAdminPanel />
      </AdminGate>

      {/* Manifesto Sources - Fixed left rail, appears with manifesto text, fades out quickly at services start */}
      <div
        style={{
          // Fade out 3x faster - complete by 33% of transition
          opacity: Math.max(0, 1 - tManifestoToServices * 3),
          visibility: tManifestoToServices < 0.35 ? "visible" : "hidden",
        }}
      >
        <ManifestoSources isVisible={manifestoRevealProgress > 0.1} />
      </div>

      {/* Manifesto Video Stack - Fixed right side, appears with manifesto text, fades out quickly at services start */}
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

      {/* Services Section Text - appears on left as terminal slides right (desktop only) */}
      {!isMobile && tManifestoToServices > 0 && (
        <div
          className="services-text-container"
          style={{
            position: "fixed",
            left: "calc(var(--rail-width, 64px) + 120px)",
            top: "50%",
            transform: "translateY(-50%)",
            maxWidth: "500px",
            opacity: tManifestoToServices,
            visibility: tManifestoToServices > 0 ? "visible" : "hidden",
            zIndex: 10,
            pointerEvents: tManifestoToServices > 0.5 ? "auto" : "none",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans, 'EB Garamond', serif)",
              fontSize: "clamp(24px, 3.5vw, 32px)",
              fontWeight: 400,
              lineHeight: 1.4,
              color: "var(--dawn, #ece3d6)",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            We help teams develop the intuition
            <br />
            to navigate AI collaboration.
          </p>
          <p
            style={{
              fontFamily: "var(--font-data, 'PT Mono', monospace)",
              fontSize: "13px",
              fontWeight: 400,
              lineHeight: 1.6,
              color: "var(--dawn, #ece3d6)",
              opacity: 0.7,
              marginTop: "24px",
              maxWidth: "400px",
            }}
          >
            Strategic workshops. Custom integrations.
            <br />
            Guided expeditions into possibility space.
          </p>
        </div>
      )}

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

        {/* Section 5: Contact */}
        <section className="section section-contact" id="contact" data-section="contact">
          <div className="section-layout">
            <div className="section-label">
              <span className="label-number">05</span>
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
      <NavigationCockpitInner />
    </ParticleConfigProvider>
  );
}
