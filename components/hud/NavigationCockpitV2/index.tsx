"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ParticleCanvasV2 } from "../ParticleCanvasV2";
import { ThreeGateway } from "../ThreeGateway";
import { HUDFrame } from "../HUDFrame";
import { Wordmark } from "../Wordmark";
import { WordmarkSans } from "../WordmarkSans";
import { GlitchText } from "../GlitchText";
import { ParticleWordmarkMorph } from "../ParticleWordmarkMorph";
import type { ParticlePosition } from "../ThoughtformSigil";
import { useLenis } from "@/lib/hooks/useLenis";
import { ParticleConfigProvider, useParticleConfig } from "@/lib/contexts/ParticleConfigContext";
import { AdminGate, ParticleAdminPanel } from "@/components/admin";

// Extracted components
import { ModuleCards } from "./ModuleCards";
import { ConnectorLines } from "./ConnectorLines";
import { SigilSection } from "./SigilSection";
import { HeroBackgroundSigil } from "./HeroBackgroundSigil";
import { cockpitStyles } from "./styles";

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

  // Refs for tracking element positions
  const wordmarkContainerRef = useRef<HTMLDivElement>(null);
  const wordmarkSvgRef = useRef<HTMLDivElement>(null); // For brandmark origin calculation
  const definitionWordmarkRef = useRef<HTMLDivElement>(null);
  const definitionRef = useRef<HTMLDivElement>(null);
  const modulesRef = useRef<HTMLDivElement>(null);
  const moduleCardRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

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
      <ParticleCanvasV2 scrollProgress={scrollProgress} config={config} />

      {/* Hero Background Sigil - fully formed in the distance, behind gateway */}
      <HeroBackgroundSigil scrollProgress={scrollProgress} config={rawConfig.sigil} />

      {/* Three.js Gateway Overlay - only in hero section, fades out on scroll */}
      <ThreeGateway scrollProgress={scrollProgress} config={rawConfig.gateway} />

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
          // Wordmark top at t=1: calc(50vh - 100px) = balanced spacing
          top: `calc(${lerp(90, 0, tHeroToDef)}px + ${lerp(0, 50, tHeroToDef)}vh - ${lerp(0, 100, tHeroToDef)}px)`,
          // CSS variable for brandmark fade
          ["--brandmark-opacity" as string]: 1 - tHeroToDef,
          // Fade out as we scroll to next section (same timing as sigil/cards)
          // Wordmark should ONLY fade, not close inward
          opacity:
            scrollProgress < 0.15
              ? 1
              : scrollProgress < 0.22
                ? 1 - (scrollProgress - 0.15) / 0.07
                : 0,
          visibility: scrollProgress < 0.22 ? "visible" : "hidden",
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
            left: 0,
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

      {/* Runway arrows pointing to gateway - fade out during early transition */}
      <div
        className="hero-runway-arrows"
        style={{
          opacity: tHeroToDef < 0.05 ? 1 : tHeroToDef < 0.3 ? 1 - (tHeroToDef - 0.05) / 0.25 : 0,
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={`runway-arrow runway-arrow-${i + 1}`}>
            ›
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BRIDGE FRAME - Unified text container that transitions from hero to definition
          SAME FRAME slides UP from bottom to center, only text content changes
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="bridge-frame"
        style={{
          // Frame slides UP from bottom (90px) to below wordmark
          // At t=0: bottom: 90px (hero position at bottom)
          // At t=1: Frame below wordmark, aligned with rail marker 5 (~50vh)
          // Frame bottom edge at t=1: calc(50vh - 120px) = balanced spacing
          // This positions frame below the wordmark with comfortable spacing
          bottom: `calc(${90 * (1 - tHeroToDef)}px + ${tHeroToDef * 50}vh - ${tHeroToDef * 120}px)`,
          // Fade out as we scroll to next section (same timing as sigil/cards/wordmark)
          opacity:
            scrollProgress < 0.15
              ? 1
              : scrollProgress < 0.22
                ? 1 - (scrollProgress - 0.15) / 0.07
                : 0,
          visibility: scrollProgress < 0.22 ? "visible" : "hidden",
          pointerEvents: tHeroToDef > 0.95 || tHeroToDef < 0.05 ? "auto" : "none",
          // Close inward effect - scale down proportionately (borders scale too)
          transform:
            scrollProgress >= 0.15
              ? `scale(${1 - Math.min(1, (scrollProgress - 0.15) / 0.07)})`
              : "scale(1)",
          transformOrigin: "center center",
        }}
      >
        <div className="hero-text-frame">
          {/* Glitch text transition - hero text morphs into definition text */}
          <div className="hero-tagline hero-tagline-v2 hero-tagline-main">
            <GlitchText
              initialText={`AI isn't software to command.
It's a strange intelligence to navigate.
Thoughtform teaches how.`}
              finalText={`(θɔːtfɔːrm / THAWT-form)
the interface for human-AI collaboration`}
              progress={tHeroToDef}
              className="bridge-content-glitch"
            />
          </div>
        </div>
      </div>

      {/* Fixed HUD Frame - Navigation Cockpit */}
      <HUDFrame
        activeSection={activeSection}
        scrollProgress={scrollProgress}
        onNavigate={handleNavigate}
      />

      {/* Admin Panel - Only visible to authorized users */}
      <AdminGate>
        <ParticleAdminPanel />
      </AdminGate>

      {/* Fixed Thoughtform Sigil - appears centered during definition section
          Animates from brandmark origin (in hero wordmark) to center */}
      <SigilSection
        ref={definitionRef}
        scrollProgress={scrollProgress}
        config={rawConfig.sigil}
        onParticlePositions={sigilParticlesRef}
        originPos={brandmarkOrigin}
        transitionProgress={tHeroToDef}
      />

      {/* Scroll Container - Content Sections */}
      <main className="scroll-container">
        {/* Section 1: Hero - Simplified */}
        <section className="section section-hero" id="hero" data-section="hero">
          <div className="hero-layout">
            {/* Connecting lines from module cards to sigil */}
            <ConnectorLines
              scrollProgress={scrollProgress}
              transitionProgress={tHeroToDef}
              cardRefs={moduleCardRefs}
              sigilParticlesRef={sigilParticlesRef}
            />

            {/* Module cards on the right - pointing to sigil */}
            <ModuleCards
              ref={modulesRef}
              scrollProgress={scrollProgress}
              transitionProgress={tHeroToDef}
              cardRefs={moduleCardRefs}
            />
          </div>
        </section>

        {/* Section 2: Definition - The Semantic Core with Sigil */}
        <section className="section section-definition" id="definition" data-section="definition">
          {/* Placeholder for layout */}
          <div className="sigil-placeholder" />
        </section>

        {/* Section 3: Manifesto - Elimar-inspired text-based layout */}
        <section className="section section-manifesto" id="manifesto" data-section="manifesto">
          <div className="manifesto-layout-text">
            {/* Section label - horizontal like Services */}
            <div className="section-label">
              <span className="label-number">03</span>
              <span className="label-text">Manifesto</span>
            </div>

            {/* Content with vertical line */}
            <div className="manifesto-content-area">
              {/* Large title */}
              <h2 className="manifesto-title-large">AI Isn&apos;t Software.</h2>

              {/* Body text - all same size */}
              <div className="manifesto-body-text">
                <p>
                  Most companies struggle with their AI adoption because they treat AI like normal
                  software.
                </p>

                <p>
                  But AI isn&apos;t a tool to command. It&apos;s a strange, new intelligence we have
                  to learn how to <em>navigate</em>. It leaps across dimensions we can&apos;t
                  fathom. It hallucinates. It surprises.
                </p>

                <p>
                  In technical work, that strangeness must be constrained. But in creative and
                  strategic work? It&apos;s the source of truly novel ideas.
                </p>

                <p>
                  Thoughtform teaches teams to think <strong>with</strong> that
                  intelligence—navigating its strangeness for creative breakthroughs.
                </p>
              </div>
            </div>
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

      {/* V2 Specific Styles */}
      <style jsx global>
        {cockpitStyles}
      </style>
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
