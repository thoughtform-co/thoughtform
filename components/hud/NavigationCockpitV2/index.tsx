"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ParticleCanvasV2 } from "../ParticleCanvasV2";
import { ThreeGateway } from "../ThreeGateway";
import { HUDFrame } from "../HUDFrame";
import { Wordmark } from "../Wordmark";
import { WordmarkSans } from "../WordmarkSans";
import type { ParticlePosition } from "../ThoughtformSigil";
import { useLenis } from "@/lib/hooks/useLenis";
import { ParticleConfigProvider, useParticleConfig } from "@/lib/contexts/ParticleConfigContext";
import { AdminGate, ParticleAdminPanel } from "@/components/admin";
import { Stack } from "@/components/ui/Stack";
import { Typewriter } from "@/components/ui/Typewriter";

// Extracted components
import { ModuleCards } from "./ModuleCards";
import { ConnectorLines } from "./ConnectorLines";
import { SigilSection } from "./SigilSection";
import { HeroSigil } from "./HeroSigil";
import { cockpitStyles } from "./styles";

// Inner component that uses the config context
function NavigationCockpitInner() {
  const [activeSection, setActiveSection] = useState("hero");
  const { scrollProgress, scrollTo } = useLenis();
  const { config: rawConfig } = useParticleConfig();

  // Refs for tracking element positions
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const definitionRef = useRef<HTMLDivElement>(null);
  const modulesRef = useRef<HTMLDivElement>(null);
  const moduleCardRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  // Ref to receive particle positions from ThoughtformSigil
  const sigilParticlesRef = useRef<ParticlePosition[]>([]);

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

      {/* Three.js Gateway Overlay - only in hero section, fades out on scroll */}
      <ThreeGateway scrollProgress={scrollProgress} config={rawConfig.gateway}>
        {/* Hero Sigil - positioned in front of gateway, flows into it on scroll */}
        <HeroSigil scrollProgress={scrollProgress} config={rawConfig.sigil} />
      </ThreeGateway>

      {/* Hero Logo + Text - positioned in top left */}
      {/* Hero Wordmark - top aligned with HUD line */}
      <div
        className="hero-wordmark-container"
        style={{
          opacity: scrollProgress > 0.005 ? 0 : 1,
          pointerEvents: scrollProgress > 0.005 ? "none" : "auto",
        }}
      >
        <div className="hero-wordmark-topleft" ref={wordmarkRef}>
          <Wordmark hideVectorI={!showSvgVector} />
        </div>
      </div>

      {/* Runway arrows pointing to gateway */}
      <div
        className="hero-runway-arrows"
        style={{
          opacity: scrollProgress > 0.005 ? 0 : 1,
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={`runway-arrow runway-arrow-${i + 1}`}>
            ›
          </div>
        ))}
      </div>

      {/* Hero Text - bottom aligned */}
      <div
        className="hero-text-container"
        style={{
          opacity: scrollProgress > 0.005 ? 0 : 1,
          pointerEvents: scrollProgress > 0.005 ? "none" : "auto",
        }}
      >
        <div className="hero-text-frame">
          <p className="hero-tagline hero-tagline-v2 hero-tagline-main">
            AI isn&apos;t software to command.
            <br />
            It&apos;s a strange intelligence to navigate.
            <br />
            Thoughtform teaches how.
          </p>
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

      {/* Fixed Thoughtform Sigil - appears centered during definition section */}
      <SigilSection
        ref={definitionRef}
        scrollProgress={scrollProgress}
        config={rawConfig.sigil}
        onParticlePositions={sigilParticlesRef}
      />

      {/* Scroll Container - Content Sections */}
      <main className="scroll-container">
        {/* Section 1: Hero - Simplified */}
        <section className="section section-hero" id="hero" data-section="hero">
          <div className="hero-layout">
            {/* Definition content - fades in during scroll */}
            <div
              className="hero-tagline-frame"
              style={{
                opacity:
                  scrollProgress < 0.08
                    ? 0
                    : scrollProgress < 0.18
                      ? 1
                      : Math.max(0, 1 - (scrollProgress - 0.18) * 8),
                visibility: scrollProgress < 0.08 ? "hidden" : "visible",
                pointerEvents: scrollProgress > 0.25 || scrollProgress < 0.08 ? "none" : "auto",
              }}
            >
              <Stack gap={20} className="definition-frame">
                <div className="definition-wordmark">
                  <WordmarkSans />
                </div>
                <span className="definition-phonetic">(θɔːtfɔːrm / THAWT-form)</span>
                <p className="hero-tagline hero-tagline-v2">
                  <Typewriter
                    text="the practice of intuitive human-AI collaboration"
                    active={scrollProgress > 0.08}
                    startDelay={200}
                    speed={15}
                    speedVariation={8}
                    glitch={true}
                    glitchIterations={1}
                  />
                </p>
              </Stack>
            </div>

            {/* Connecting lines from module cards to sigil */}
            <ConnectorLines
              scrollProgress={scrollProgress}
              cardRefs={moduleCardRefs}
              sigilParticlesRef={sigilParticlesRef}
            />

            {/* Module cards on the right - pointing to sigil */}
            <ModuleCards
              ref={modulesRef}
              scrollProgress={scrollProgress}
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
