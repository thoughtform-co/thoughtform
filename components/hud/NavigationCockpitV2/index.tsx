"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const [manifestoScrollProgress, setManifestoScrollProgress] = useState(0);
  const [manifestoInView, setManifestoInView] = useState(false);
  const [manifestoFullyVisible, setManifestoFullyVisible] = useState(false);
  const [transmissionAcknowledged, setTransmissionAcknowledged] = useState(false);

  // Calculate scroll progress within manifesto section
  useEffect(() => {
    if (!manifestoRef.current) return;

    const updateManifestoProgress = () => {
      const element = manifestoRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;

      // Calculate progress: 0 = section top at viewport center, 1 = section scrolled through
      // Start when section top reaches viewport center
      const viewportCenter = windowHeight * 0.5;
      const sectionTop = rect.top;

      // Progress from 0 to 1 as section scrolls from center to bottom
      // We want the full section height to scroll through viewport center
      const scrollRange = sectionHeight + windowHeight; // Full section + viewport
      const scrollDistance = viewportCenter - sectionTop; // Distance from center

      const progress = Math.max(0, Math.min(1, scrollDistance / scrollRange));

      setManifestoScrollProgress(progress);

      // Terminal appears immediately when section is in viewport
      const isInView = rect.top < windowHeight && rect.bottom > 0;
      setManifestoInView(isInView);

      // Terminal is "fully visible" when section is centered or well into viewport
      // This means the section top is above viewport center and bottom is below it
      const isFullyVisible = rect.top < viewportCenter && rect.bottom > viewportCenter;
      setManifestoFullyVisible(isFullyVisible);
    };

    const handleScroll = () => {
      requestAnimationFrame(updateManifestoProgress);
    };

    // Listen to scroll events
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    updateManifestoProgress(); // Initial calculation

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

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
  useEffect(() => {
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
    // Also update on scroll since positions may change
    const scrollUpdate = () => requestAnimationFrame(updateBounds);
    window.addEventListener("scroll", scrollUpdate, { passive: true });
    return () => {
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", scrollUpdate);
    };
  }, []);

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
  // Note: Actual content height is ~640px due to terminal content
  // Use actual content height for centering calculation
  const actualContentHeight = 640;

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
  const manifestoBottomPxCurrent =
    definitionBottomPx + (manifestoBottomPx - definitionBottomPx) * tDefToManifesto;
  const manifestoBottomVhCurrent =
    definitionBottomVh + (manifestoBottomVh - definitionBottomVh) * tDefToManifesto;

  // Final bottom position: smooth transition to centered position
  const finalBottom = `calc(${manifestoBottomPxCurrent}px + ${manifestoBottomVhCurrent}vh)`;

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
          // Slide from top (90px) to above the frame
          // At t=0: top: 90px (hero position at top)
          // At t=1: Wordmark above frame, aligned with rail marker 5 (~50vh)
          // Wordmark top at t=1: calc(50vh - 125px) = tighter spacing to frame
          // On mobile, let CSS control positioning
          top: isMobile
            ? undefined
            : `calc(${lerp(90, 0, tHeroToDef)}px + ${lerp(0, 50, tHeroToDef)}vh - ${lerp(0, 125, tHeroToDef)}px)`,
          // On mobile, apply centering transform
          transform: isMobile ? "translateX(-50%)" : undefined,
          // CSS variable for brandmark fade
          ["--brandmark-opacity" as string]: 1 - tHeroToDef,
          // Fade out - sync with sigil exit animation (0.15 to 0.40)
          // Wordmark starts fading when sigil starts moving toward navbar
          opacity:
            scrollProgress < 0.15
              ? 1
              : scrollProgress < 0.4
                ? 1 - (scrollProgress - 0.15) / 0.25
                : 0,
          visibility: scrollProgress < 0.4 ? "visible" : "hidden",
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

      {/* Runway arrows pointing to gateway - fade out quickly during transition */}
      {/* Only visible in hero section on desktop, hidden on mobile */}
      {!isMobile && (
        <div
          className="hero-runway-arrows"
          style={{
            opacity: tHeroToDef < 0.02 ? 1 : tHeroToDef < 0.08 ? 1 - (tHeroToDef - 0.02) / 0.06 : 0,
            visibility: tHeroToDef < 0.1 ? "visible" : "hidden",
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className={`runway-arrow runway-arrow-${i + 1}`}>
              ›
            </div>
          ))}
        </div>
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
                bottom: finalBottom,

                // Left position: ALWAYS apply interpolated value for smooth transition
                // Definition: left = 184px (rail + 120px)
                // Manifesto: left = 50% (centered)
                // At tDefToManifesto=0: calc(184px + 0%) = 184px
                // At tDefToManifesto=1: calc(0px + 50%) = 50%
                left: `calc(${(1 - tDefToManifesto) * 184}px + ${tDefToManifesto * 50}%)`,

                // Width grows subtly: 500px → 700px (40% increase) with smooth easing
                // ALWAYS apply to avoid jump
                width: `${baseWidth + growthProgress * widthGrowth}px`,
                maxWidth: `${baseWidth + growthProgress * widthGrowth}px`,

                // Height: auto during hero/definition, then controlled during manifesto transition
                // Only apply fixed height + overflow:hidden when transitioning to manifesto
                // This prevents cutting off hero/definition text while controlling manifesto growth
                height:
                  tDefToManifesto > 0
                    ? `${baseHeight + growthProgress * (actualContentHeight - baseHeight)}px`
                    : "auto",
                overflow: tDefToManifesto > 0 ? "hidden" : "visible",

                opacity: 1,
                visibility: "visible",
                pointerEvents:
                  tHeroToDef > 0.95 || tHeroToDef < 0.05 || tDefToManifesto > 0 ? "auto" : "none",

                // Transform for horizontal centering - ALWAYS apply for smooth transition
                // At tDefToManifesto=0: translateX(0%) = no transform
                // At tDefToManifesto=1: translateX(-50%) = centered
                transform: `translateX(${-50 * tDefToManifesto}%)`,
                transformOrigin: "center",

                // Terminal styling - smooth transition (interpolate from 0)
                ["--terminal-opacity" as string]: tDefToManifesto,
                background: `rgba(10, 9, 8, ${0.5 * tDefToManifesto})`,
                backdropFilter: `blur(${8 * tDefToManifesto}px)`,
                border: `1px solid rgba(236, 227, 214, ${0.1 * tDefToManifesto})`,

                transition: "none", // We're animating via scroll, not CSS transitions
              }
        }
      >
        {/* Text content - hero/definition/question - ONE continuous morph */}
        <div
          className="hero-text-frame"
          style={{
            // Stay visible throughout transition - no fading until click
            opacity: transmissionAcknowledged ? 0 : 1,
            visibility: transmissionAcknowledged ? "hidden" : "visible",
            // Always relative - let parent bridge-frame handle positioning
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            // Padding interpolates: hero/definition = 16px top, terminal = 72px top (below header with breathing room)
            padding: `${16 + 56 * tDefToManifesto}px 24px 16px 24px`,
            pointerEvents: transmissionAcknowledged ? "none" : "auto",
            cursor: tDefToManifesto > 0.9 ? "pointer" : "default",
            // Higher z-index so text stays on top of terminal chrome
            zIndex: 2,
            // Gradually fade out frame styling as terminal takes over
            // The bridge-frame parent already has interpolated terminal background/border
            ["--frame-opacity" as string]: 1 - tDefToManifesto,
          }}
          onClick={
            tDefToManifesto > 0.9 && !transmissionAcknowledged
              ? () => setTransmissionAcknowledged(true)
              : undefined
          }
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
              {/* Pulsing block cursor - only visible at end of manifesto transition */}
              {tDefToManifesto > 0.9 && !transmissionAcknowledged && (
                <span className="terminal-block-cursor"></span>
              )}
            </span>
          </div>
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
            // Lower z-index so text stays on top
            zIndex: 1,
            // Don't constrain height - let content flow naturally within overflow:hidden parent
            pointerEvents: transmissionAcknowledged ? "auto" : "none",
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

            {/* Manifesto content after click - fades out as you scroll */}
            {transmissionAcknowledged && (
              <div
                className="terminal-question hero-tagline hero-tagline-v2"
                style={{
                  opacity: Math.max(0, 1 - manifestoScrollProgress * 3),
                }}
              >
                But why is AI so different?
              </div>
            )}

            {/* Typed manifesto content - reveals progressively after click */}
            <div
              className="manifesto-typed-content"
              style={{
                opacity: transmissionAcknowledged ? 1 : 0,
                transition: "opacity 0.3s ease-out",
                pointerEvents: transmissionAcknowledged ? "auto" : "none",
              }}
            >
              <div
                className="typed-title"
                style={{
                  opacity: transmissionAcknowledged ? Math.min(1, manifestoScrollProgress * 2) : 0,
                  transition: "opacity 0.3s ease-out",
                }}
              >
                AI ISN&apos;T SOFTWARE.
              </div>

              <div className="typed-body">
                <p
                  className="typed-line line-1"
                  style={{
                    opacity: transmissionAcknowledged
                      ? Math.min(1, Math.max(0, (manifestoScrollProgress - 0.1) * 3))
                      : 0,
                    transition: "opacity 0.3s ease-out",
                  }}
                >
                  Most companies struggle with AI adoption because they treat it like normal
                  software.
                </p>

                <p
                  className="typed-line line-2"
                  style={{
                    opacity: transmissionAcknowledged
                      ? Math.min(1, Math.max(0, (manifestoScrollProgress - 0.25) * 2.5))
                      : 0,
                    transition: "opacity 0.3s ease-out",
                  }}
                >
                  But AI isn&apos;t a tool to command. It&apos;s a strange, new intelligence we have
                  to learn how to <em>navigate</em>. It leaps across dimensions we can&apos;t
                  fathom. It hallucinates. It surprises.
                </p>

                <p
                  className="typed-line line-3"
                  style={{
                    opacity: transmissionAcknowledged
                      ? Math.min(1, Math.max(0, (manifestoScrollProgress - 0.4) * 2.5))
                      : 0,
                    transition: "opacity 0.3s ease-out",
                  }}
                >
                  In technical work, that strangeness must be constrained. But in creative and
                  strategic work? It&apos;s the source of truly novel ideas.
                </p>

                <p
                  className="typed-line line-4"
                  style={{
                    opacity: transmissionAcknowledged
                      ? Math.min(1, Math.max(0, (manifestoScrollProgress - 0.55) * 2.5))
                      : 0,
                    transition: "opacity 0.3s ease-out",
                  }}
                >
                  Thoughtform teaches teams to think <strong>with</strong> that
                  intelligence—navigating its strangeness for creative breakthroughs.
                </p>
              </div>

              <div
                className="terminal-cursor"
                style={{
                  opacity: transmissionAcknowledged && manifestoScrollProgress > 0.7 ? 1 : 0,
                  transition: "opacity 0.3s ease-out",
                }}
              >
                <span className="prompt">$</span>
                <span className="cursor">_</span>
              </div>
            </div>
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
                opacity: transmissionAcknowledged
                  ? Math.min(1, Math.max(0, (manifestoScrollProgress - 0.1) * 2))
                  : 0,
              }}
            ></div>
            <div
              className="geo-shape geo-shape-2"
              style={{
                opacity: transmissionAcknowledged
                  ? Math.min(1, Math.max(0, (manifestoScrollProgress - 0.2) * 2))
                  : 0,
              }}
            ></div>
            <div
              className="geo-shape geo-shape-3"
              style={{
                opacity: transmissionAcknowledged
                  ? Math.min(1, Math.max(0, (manifestoScrollProgress - 0.3) * 2))
                  : 0,
              }}
            ></div>
            <div
              className="geo-grid"
              style={{
                opacity: transmissionAcknowledged
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
