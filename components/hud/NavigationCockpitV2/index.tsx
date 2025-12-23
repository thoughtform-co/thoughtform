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
  const manifestoBottomPx = -(actualContentHeight / 2); // -320px for ~640px content

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

    return {
      finalBottom,
      left: `calc(${(1 - tDefToManifesto) * 184}px + ${tDefToManifesto * 50}%)`,
      width: `${baseWidth + growthProgress * widthGrowth}px`,
      height:
        tDefToManifesto > 0
          ? `${baseHeight + growthProgress * (actualContentHeight - baseHeight)}px`
          : "auto",
      transform: `translateX(${-50 * tDefToManifesto}%)`,
      background: `rgba(10, 9, 8, ${0.5 * tDefToManifesto})`,
      backdropFilter: `blur(${8 * tDefToManifesto}px)`,
      border: `1px solid rgba(236, 227, 214, ${0.1 * tDefToManifesto})`,
      "--terminal-opacity": tDefToManifesto,
    };
  }, [
    tHeroToDef,
    tDefToManifesto,
    defBottomVh,
    defBottomPx,
    manifestoBottomPx,
    manifestoBottomVh,
    baseWidth,
    widthGrowth,
    baseHeight,
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

  // Set up section detection with IntersectionObserver
  useEffect(() => {
    const sections = document.querySelectorAll(".section[data-section]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            const sectionId = entry.target.getAttribute("data-section");
            if (sectionId) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      { threshold: [0.3, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

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

      {/* Wordmark container - slides from top to above the frame */}
      <div
        className="hero-wordmark-container"
        ref={wordmarkContainerRef}
        style={{
          // Slide from top (90px) to above the frame with consistent 24px gap
          // At t=0: top: 90px (hero position at top)
          // At t=1: top: calc(50vh - 100px) = positioned ~24px above the frame
          //   Frame is centered at ~50vh with top at ~50vh - 30px
          //   Wordmark (~40px tall) bottom at 50vh - 60px, creating ~30px gap
          // On mobile, let CSS control positioning
          top: isMobile
            ? undefined
            : `calc(${lerp(90, -100, tHeroToDef)}px + ${lerp(0, 50, tHeroToDef)}vh)`,
          // On mobile, apply centering transform
          transform: isMobile ? "translateX(-50%)" : undefined,
          // CSS variable for brandmark fade
          ["--brandmark-opacity" as string]: 1 - tHeroToDef,
          // Fade out faster - starts at 0.08, completes by 0.25
          opacity:
            scrollProgress < 0.08
              ? 1
              : scrollProgress < 0.25
                ? 1 - (scrollProgress - 0.08) / 0.17
                : 0,
          visibility: scrollProgress < 0.25 ? "visible" : "hidden",
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
        <div
          className="definition-wordmark-inner"
          ref={definitionWordmarkRef}
          style={{
            position: "absolute",
            top: 0,
            left: isMobile ? "50%" : 0,
            transform: isMobile ? "translateX(-50%)" : undefined,
            opacity: tHeroToDef > 0.75 ? (tHeroToDef - 0.75) / 0.25 : 0,
            visibility: tHeroToDef > 0.7 ? "visible" : "hidden",
          }}
        >
          <WordmarkSans color="var(--dawn)" />
        </div>
      </div>

      {/* Particle Wordmark Morph - visible during mid-transition (extended timing) */}
      <ParticleWordmarkMorph
        morphProgress={tHeroToDef < 0.15 ? 0 : tHeroToDef > 0.85 ? 1 : (tHeroToDef - 0.15) / 0.7}
        wordmarkBounds={wordmarkBounds}
        targetBounds={defWordmarkBounds}
        visible={tHeroToDef > 0.1 && tHeroToDef < 0.9}
      />

      {/* Runway arrows - transform from "› › › › › ›" in hero to ">>> SERVICES <<<" in interface section */}
      {!isMobile && (
        <RunwayArrows
          transitionProgress={tHeroToDef}
          scrollProgress={scrollProgress}
          onNavigate={() => handleNavigate("services")}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          BRIDGE FRAME - Unified text container that transitions from hero to definition
          SAME FRAME slides UP from bottom to center, only text content changes
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        ref={bridgeFrameRef}
        className="bridge-frame"
        style={
          isMobile
            ? {
                // MOBILE: Frame slides UP from bottom to below wordmark
                // At t=0: bottom: 8vh (hero position)
                // At t=1: top: 18vh (below wordmark in definition)
                bottom: tHeroToDef < 0.5 ? `${8 + tHeroToDef * 30}vh` : undefined,
                top: tHeroToDef >= 0.5 ? `${48 - (tHeroToDef - 0.5) * 60}vh` : undefined,
                // Stay visible throughout transition on mobile
                opacity: 1,
                visibility: "visible",
                pointerEvents: "auto",
                // Center horizontally
                transform: "translateX(-50%)",
                transformOrigin: "center center",
              }
            : {
                // DESKTOP: Frame moves from hero → definition → manifesto
                // Use BOTTOM positioning throughout for smooth, continuous transition
                bottom: bridgeFrameStyles.finalBottom,
                left: bridgeFrameStyles.left,
                width: bridgeFrameStyles.width,
                maxWidth: bridgeFrameStyles.width,
                height: bridgeFrameStyles.height,
                overflow: tDefToManifesto > 0 ? "hidden" : "visible",
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
        {/* Text content - hero/definition/question - ONE continuous morph */}
        {/* Question stays visible when manifesto reveals - text unfolds below */}
        <div
          className="hero-text-frame"
          style={{
            // Stay visible - question remains as header for manifesto
            opacity: 1,
            visibility: "visible",
            // Always relative - let parent bridge-frame handle positioning
            position: "relative",
            width: "100%",
            display: "flex",
            // Switch to column layout when manifesto is showing
            flexDirection: manifestoRevealProgress > 0 ? "column" : "row",
            alignItems: manifestoRevealProgress > 0 ? "flex-start" : "center",
            justifyContent: "flex-start",
            // Padding interpolates: hero/definition = 16px top, terminal = 72px top (below header with breathing room)
            padding: `${16 + 56 * tDefToManifesto}px 24px 16px 24px`,
            pointerEvents: "auto",
            cursor: "default",
            // Higher z-index so text stays on top of terminal chrome
            zIndex: 2,
            // Gradually fade out frame styling as terminal takes over
            // The bridge-frame parent already has interpolated terminal background/border
            ["--frame-opacity" as string]: 1 - tDefToManifesto,
          }}
        >
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
                position: "absolute",
                left: 0,
                top: 0,
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

      {/* Manifesto Sources - Fixed left rail, appears with manifesto text */}
      <ManifestoSources isVisible={manifestoRevealProgress > 0.1} />

      {/* Manifesto Video Stack - Fixed right side, appears with manifesto text */}
      <ManifestoVideoStack
        isVisible={manifestoRevealProgress > 0.1}
        revealProgress={manifestoRevealProgress}
      />

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

        {/* Section 4: Services */}
        <section className="section section-services" id="services" data-section="services">
          <div className="section-layout">
            <div className="section-label">
              <span className="label-number">04</span>
              <span className="label-text">Services</span>
            </div>

            <div className="section-content">
              <h2 className="headline">Navigation Training</h2>

              <div className="services-grid">
                <div className="service-card">
                  <span className="service-id">01</span>
                  <h3 className="service-title">AI Intuition Workshops</h3>
                  <p className="service-desc">
                    Develop the mental models that unlock creative collaboration with AI.
                  </p>
                </div>
                <div className="service-card">
                  <span className="service-id">02</span>
                  <h3 className="service-title">Strategic Integration</h3>
                  <p className="service-desc">
                    Design AI-augmented workflows for creative and strategic teams.
                  </p>
                </div>
                <div className="service-card">
                  <span className="service-id">03</span>
                  <h3 className="service-title">Custom Expeditions</h3>
                  <p className="service-desc">
                    Guided exploration of AI capabilities tailored to your domain.
                  </p>
                </div>
              </div>

              <div className="section-meta">
                <span className="meta-label">Landmark:</span>
                <span className="meta-value">trajectory grid / vanishing point</span>
              </div>
            </div>
          </div>
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
