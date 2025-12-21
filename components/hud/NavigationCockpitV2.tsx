"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { ParticleCanvasV2 } from "./ParticleCanvasV2";
import { ThreeGateway } from "./ThreeGateway";
import { HUDFrame } from "./HUDFrame";
import { Wordmark } from "./Wordmark";
import { WordmarkSans } from "./WordmarkSans";
import { ThoughtformSigil } from "./ThoughtformSigil";
import { GlitchText } from "./GlitchText";
import { useLenis } from "@/lib/hooks/useLenis";
import {
  ParticleConfigProvider,
  useParticleConfig,
} from "@/lib/contexts/ParticleConfigContext";
import { AdminGate, ParticleAdminPanel } from "@/components/admin";
import { Stack } from "@/components/ui/Stack";
import { Typewriter } from "@/components/ui/Typewriter";

// Inner component that uses the config context
function NavigationCockpitInner() {
  const [activeSection, setActiveSection] = useState("hero");
  const { scrollProgress, scrollTo } = useLenis();
  const { config: rawConfig, isLoading } = useParticleConfig();
  
  // Refs for tracking element positions
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const definitionRef = useRef<HTMLDivElement>(null);
  const modulesRef = useRef<HTMLDivElement>(null);
  const moduleCardRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const linePathRefs = [useRef<SVGPathElement>(null), useRef<SVGPathElement>(null), useRef<SVGPathElement>(null)];
  const lineAnimationRef = useRef<number | null>(null);
  const lineTimeRef = useRef(0);
  
  // Calculate and animate line paths - using direct DOM manipulation to avoid React re-renders
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const sigilSize = rawConfig.sigil?.size ?? 220;
    
    // Generate angular segmented path from start to end
    const generateAngularPath = (startX: number, startY: number, endX: number, endY: number): string => {
      const midX = startX + (endX - startX) * 0.4;
      const midY = startY;
      return `M ${startX} ${startY} L ${midX} ${midY} L ${endX} ${endY}`;
    };
    
    // Sample particle positions within sigil bounds
    const getParticleTargets = () => {
      const sigilX = window.innerWidth / 2;
      const sigilY = window.innerHeight / 2;
      const radius = sigilSize / 2;
      const targets: Array<{ x: number; y: number }> = [];
      
      const gridSize = 8;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const u = (i + 0.5) / gridSize;
          const v = (j + 0.5) / gridSize;
          const angle = u * Math.PI * 2;
          const dist = Math.sqrt(v) * radius * 0.8;
          
          targets.push({
            x: sigilX + Math.cos(angle) * dist,
            y: sigilY + Math.sin(angle) * dist,
          });
        }
      }
      return targets;
    };
    
    let particleTargets = getParticleTargets();
    let cachedCardPositions: Array<{ x: number; y: number } | null> = [null, null, null];
    let lastPositionUpdate = 0;
    
    const updateCardPositions = () => {
      moduleCardRefs.forEach((cardRef, index) => {
        if (!cardRef.current) {
          cachedCardPositions[index] = null;
          return;
        }
        const cardRect = cardRef.current.getBoundingClientRect();
        cachedCardPositions[index] = {
          x: cardRect.left - 4,
          y: cardRect.top + cardRect.height / 2,
        };
      });
    };
    
    updateCardPositions();
    let lastTime = performance.now();
    
    const updateLines = () => {
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      lineTimeRef.current += deltaTime;
      
      // Update card positions only every 200ms
      if (now - lastPositionUpdate > 200) {
        updateCardPositions();
        lastPositionUpdate = now;
      }
      
      // Direct DOM manipulation - no React state updates
      linePathRefs.forEach((pathRef, index) => {
        if (!pathRef.current) return;
        
        const cardPos = cachedCardPositions[index];
        if (!cardPos) return;
        
        const switchInterval = 2.5;
        const targetIndex = Math.floor((lineTimeRef.current + index * 0.7) / switchInterval) % particleTargets.length;
        const currentTarget = particleTargets[targetIndex];
        const nextTargetIndex = (targetIndex + 1) % particleTargets.length;
        const nextTarget = particleTargets[nextTargetIndex];
        
        const switchProgress = ((lineTimeRef.current + index * 0.7) % switchInterval) / switchInterval;
        const transitionStart = 0.7;
        let targetX = currentTarget.x;
        let targetY = currentTarget.y;
        
        if (switchProgress > transitionStart) {
          const t = (switchProgress - transitionStart) / (1 - transitionStart);
          const easeT = t * t;
          targetX = currentTarget.x + (nextTarget.x - currentTarget.x) * easeT;
          targetY = currentTarget.y + (nextTarget.y - currentTarget.y) * easeT;
        }
        
        // Directly set path d attribute - no React re-render
        pathRef.current.setAttribute('d', generateAngularPath(cardPos.x, cardPos.y, targetX, targetY));
      });
      
      lineAnimationRef.current = requestAnimationFrame(updateLines);
    };
    
    lineAnimationRef.current = requestAnimationFrame(updateLines);
    
    const handleResize = () => {
      particleTargets = getParticleTargets();
      updateCardPositions();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (lineAnimationRef.current) {
        cancelAnimationFrame(lineAnimationRef.current);
      }
    };
  }, [rawConfig.sigil?.size]);
  
  // Determine if we should show the SVG Vector I
  const showSvgVector = scrollProgress < 0.02;
  
  // Force-disable the canvas gateway since we're using Three.js gateway
  // Also disable Lorenz attractor since it's now rendered by ParticleVectorMorph
  const config = {
    ...rawConfig,
    landmarks: rawConfig.landmarks.map(l => 
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
      <ThreeGateway scrollProgress={scrollProgress} config={rawConfig.gateway} />

      {/* Hero Logo + Text - positioned in top left */}
      {/* Hero Wordmark - top aligned with HUD line */}
      <div
        className="hero-wordmark-container"
        style={{
          opacity: scrollProgress > 0.005 ? 0 : 1,
          pointerEvents: scrollProgress > 0.005 ? 'none' : 'auto',
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
          pointerEvents: 'none',
        }}
      >
        <div className="runway-arrow runway-arrow-1">›</div>
        <div className="runway-arrow runway-arrow-2">›</div>
        <div className="runway-arrow runway-arrow-3">›</div>
        <div className="runway-arrow runway-arrow-4">›</div>
        <div className="runway-arrow runway-arrow-5">›</div>
      </div>

      {/* Hero Text - bottom aligned */}
      <div
        className="hero-text-container"
        style={{
          opacity: scrollProgress > 0.005 ? 0 : 1,
          pointerEvents: scrollProgress > 0.005 ? 'none' : 'auto',
        }}
      >
        <div className="hero-text-frame">
          <p className="hero-tagline hero-tagline-v2 hero-tagline-main">
            AI isn&apos;t software to command.<br />
            It&apos;s a strange intelligence to navigate.<br />
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

      {/* Fixed Thoughtform Sigil - appears centered during definition section, reverses when scrolling out */}
      {rawConfig.sigil?.enabled !== false && (() => {
        // Sigil appears during definition section (0.02 to 0.25), fades out after
        const sigilInStart = 0.02;
        const sigilInEnd = 0.08;
        const sigilOutStart = 0.25;
        const sigilOutEnd = 0.35;
        
        let sigilOpacity = 0;
        let sigilScrollProgress = 0;
        
        if (scrollProgress < sigilInStart) {
          // Before sigil appears
          sigilOpacity = 0;
          sigilScrollProgress = 0;
        } else if (scrollProgress >= sigilInStart && scrollProgress < sigilInEnd) {
          // Fading in during definition section
          const fadeIn = (scrollProgress - sigilInStart) / (sigilInEnd - sigilInStart);
          sigilOpacity = fadeIn;
          // Map to the emergence range that ThoughtformSigil expects (0.02 to 0.08)
          sigilScrollProgress = sigilInStart + fadeIn * (sigilInEnd - sigilInStart);
        } else if (scrollProgress >= sigilInEnd && scrollProgress < sigilOutStart) {
          // Fully visible in definition section
          sigilOpacity = 1;
          sigilScrollProgress = sigilInEnd; // Fully formed
        } else if (scrollProgress >= sigilOutStart && scrollProgress < sigilOutEnd) {
          // Fading out after definition section
          const fadeOut = (scrollProgress - sigilOutStart) / (sigilOutEnd - sigilOutStart);
          sigilOpacity = 1 - fadeOut;
          // Reverse the emergence animation by going backwards through the range
          sigilScrollProgress = sigilInEnd - fadeOut * (sigilInEnd - sigilInStart);
        } else {
          // After fade out
          sigilOpacity = 0;
          sigilScrollProgress = sigilInStart;
        }
        
        return (
          <div 
            ref={definitionRef}
            className="fixed-sigil-container"
            style={{
              opacity: sigilOpacity,
              pointerEvents: 'none',
            }}
          >
            <ThoughtformSigil
              size={rawConfig.sigil?.size ?? 220}
              particleCount={rawConfig.sigil?.particleCount ?? 500}
              color={rawConfig.sigil?.color ?? "202, 165, 84"}
              scrollProgress={sigilScrollProgress}
              particleSize={rawConfig.sigil?.particleSize ?? 1.0}
              opacity={rawConfig.sigil?.opacity ?? 1.0}
              wanderStrength={rawConfig.sigil?.wanderStrength ?? 1.0}
              pulseSpeed={rawConfig.sigil?.pulseSpeed ?? 1.0}
              returnStrength={rawConfig.sigil?.returnStrength ?? 1.0}
            />
          </div>
        );
      })()}

      {/* Scroll Container - Content Sections */}
      <main className="scroll-container">
        {/* Section 1: Hero - Simplified */}
        <section
          className="section section-hero"
          id="hero"
          data-section="hero"
        >
          <div className="hero-layout">
            {/* Definition content - fades in during scroll */}
            <div 
              className="hero-tagline-frame"
              style={{
                opacity: scrollProgress < 0.08 ? 0 : scrollProgress < 0.18 ? 1 : Math.max(0, 1 - (scrollProgress - 0.18) * 8),
                visibility: scrollProgress < 0.08 ? 'hidden' : 'visible',
                pointerEvents: scrollProgress > 0.25 || scrollProgress < 0.08 ? 'none' : 'auto',
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

            {/* Module cards on the right - pointing to sigil */}
            {/* Connecting lines from module cards to sigil - animated angular paths */}
            <svg
              className="module-connection-lines"
              style={{
                opacity: scrollProgress < 0.08 ? 0 : scrollProgress < 0.18 ? 1 : Math.max(0, 1 - (scrollProgress - 0.18) * 8),
                visibility: scrollProgress < 0.08 ? 'hidden' : 'visible',
                pointerEvents: 'none',
              }}
            >
              <path
                ref={linePathRefs[0]}
                fill="none"
                stroke="rgba(202, 165, 84, 0.3)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="module-line module-line-1"
              />
              <path
                ref={linePathRefs[1]}
                fill="none"
                stroke="rgba(202, 165, 84, 0.3)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="module-line module-line-2"
              />
              <path
                ref={linePathRefs[2]}
                fill="none"
                stroke="rgba(202, 165, 84, 0.3)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="module-line module-line-3"
              />
            </svg>

            <div 
              ref={modulesRef}
              className="definition-modules"
              style={{
                opacity: scrollProgress < 0.08 ? 0 : scrollProgress < 0.18 ? 1 : Math.max(0, 1 - (scrollProgress - 0.18) * 8),
                visibility: scrollProgress < 0.08 ? 'hidden' : 'visible',
                pointerEvents: scrollProgress > 0.25 || scrollProgress < 0.08 ? 'none' : 'auto',
              }}
            >
              <div ref={moduleCardRefs[0]} className="module-card">
                <div className="module-connect" />
                <div className="module-header">
                  <span className="module-id">MOD_01</span>
                </div>
                <h3 className="module-title">Navigate Intelligence</h3>
                <p className="module-desc">Chart a course through the latent space. Identify high-value coordinates amidst the noise.</p>
              </div>

              <div ref={moduleCardRefs[1]} className="module-card">
                <div className="module-connect" />
                <div className="module-header">
                  <span className="module-id">MOD_02</span>
                </div>
                <h3 className="module-title">Steer from Mediocrity</h3>
                <p className="module-desc">Force the model away from the average. Displace the probable to find the exceptional.</p>
              </div>

              <div ref={moduleCardRefs[2]} className="module-card">
                <div className="module-connect" />
                <div className="module-header">
                  <span className="module-id">MOD_03</span>
                </div>
                <h3 className="module-title">Leverage Hallucinations</h3>
                <p className="module-desc">Errors are not bugs; they are creative vectors. Use the glitch to break linear thinking.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Definition - The Semantic Core with Sigil */}
        <section
          className="section section-definition"
          id="definition"
          data-section="definition"
        >
          {/* Placeholder for layout */}
          <div className="sigil-placeholder" />
        </section>

        {/* Section 3: Manifesto - Elimar-inspired text-based layout */}
        <section
          className="section section-manifesto"
          id="manifesto"
          data-section="manifesto"
        >
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
                  Most companies struggle with their AI adoption because they treat AI like normal software.
                </p>

                <p>
                  But AI isn&apos;t a tool to command. It&apos;s a strange, new intelligence we have to learn how to{" "}
                  <em>navigate</em>. It leaps across dimensions we can&apos;t fathom.
                  It hallucinates. It surprises.
                </p>

                <p>
                  In technical work, that strangeness must be constrained.
                  But in creative and strategic work? It&apos;s the source of truly
                  novel ideas.
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
        <section
          className="section section-services"
          id="services"
          data-section="services"
        >
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
                    Develop the mental models that unlock creative collaboration
                    with AI.
                  </p>
                </div>
                <div className="service-card">
                  <span className="service-id">02</span>
                  <h3 className="service-title">Strategic Integration</h3>
                  <p className="service-desc">
                    Design AI-augmented workflows for creative and strategic
                    teams.
                  </p>
                </div>
                <div className="service-card">
                  <span className="service-id">03</span>
                  <h3 className="service-title">Custom Expeditions</h3>
                  <p className="service-desc">
                    Guided exploration of AI capabilities tailored to your
                    domain.
                  </p>
                </div>
              </div>

              <div className="section-meta">
                <span className="meta-label">Landmark:</span>
                <span className="meta-value">
                  trajectory grid / vanishing point
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Contact */}
        <section
          className="section section-contact"
          id="contact"
          data-section="contact"
        >
          <div className="section-layout">
            <div className="section-label">
              <span className="label-number">05</span>
              <span className="label-text">Contact</span>
            </div>

            <div className="section-content section-content-centered">
              <h2 className="headline">Plot Your Course</h2>

              <p className="text text-center">
                Ready to navigate intelligence with your team?
              </p>

              <a
                href="mailto:hello@thoughtform.co"
                className="btn btn-primary btn-large"
              >
                Initiate Contact
              </a>

              <div className="contact-email">hello@thoughtform.co</div>

              <div className="section-meta">
                <span className="meta-label">Landmark:</span>
                <span className="meta-value">
                  event horizon / destination lock
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* V2 Specific Styles */}
      <style jsx global>{`
        /* Hero section and layout */
        .section-hero {
          position: relative;
          min-height: 100vh;
          height: 100vh;
        }

        .hero-layout {
          position: relative;
          width: 100%;
          height: 100vh;
        }

        /* Hero main container - Logo + Text in Stack */
        /* Hero wordmark container - top aligned with HUD line */
        .hero-wordmark-container {
          position: fixed;
          top: 90px;
          left: calc(var(--rail-width) + 120px);
          z-index: 10;
          transition: opacity 0.3s ease-out;
        }

        .hero-wordmark-topleft {
          width: 220px;
        }

        .hero-wordmark-topleft svg {
          width: 100%;
          height: auto;
        }

        /* Hero text container - vertically centered */
        .hero-text-container {
          position: fixed;
          top: 50%;
          left: calc(var(--rail-width) + 120px);
          transform: translateY(-50%);
          z-index: 10;
          transition: opacity 0.3s ease-out;
        }

        /* Runway arrows pointing to gateway - bottom aligned */
        .hero-runway-arrows {
          position: fixed;
          bottom: 90px;
          left: calc(var(--rail-width) + 120px);
          display: flex;
          gap: 24px;
          z-index: 10;
          transition: opacity 0.3s ease-out;
        }

        .runway-arrow {
          font-size: 28px;
          color: var(--gold, #caa554);
          opacity: 0.3;
          animation: runway-pulse 2s ease-in-out infinite;
        }

        .runway-arrow-1 { animation-delay: 0s; }
        .runway-arrow-2 { animation-delay: 0.15s; }
        .runway-arrow-3 { animation-delay: 0.3s; }
        .runway-arrow-4 { animation-delay: 0.45s; }
        .runway-arrow-5 { animation-delay: 0.6s; }

        @keyframes runway-pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.7;
          }
        }

        /* Transparent frame around hero text */
        .hero-text-frame {
          position: relative;
          padding: 20px 24px;
          border: 1px solid rgba(236, 227, 214, 0.1);
          background: rgba(10, 9, 8, 0.25);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        /* Gold corner accents for hero text frame */
        .hero-text-frame::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          width: 10px;
          height: 10px;
          border-top: 1px solid var(--gold, #caa554);
          border-left: 1px solid var(--gold, #caa554);
        }

        .hero-text-frame::after {
          content: '';
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 10px;
          height: 10px;
          border-bottom: 1px solid var(--gold, #caa554);
          border-right: 1px solid var(--gold, #caa554);
        }

        /* Hero tagline - vertically centered on left, no frame */
        .hero-tagline-frame {
          position: fixed;
          top: calc(50% + 30px);
          left: calc(var(--rail-width) + 120px);
          transform: translateY(-50%);
          max-width: 500px;
          padding: 0;
          z-index: 10;
          transition: opacity 0.3s ease-out;
        }

        /* Hero V2 - Cleaner, more focused */
        .hero-tagline-v2 {
          font-size: clamp(20px, 2.5vw, 28px) !important;
          line-height: 1.4 !important;
          margin: 0 !important;
          color: var(--dawn) !important;
          font-weight: 300 !important;
        }

        .hero-description-v2 {
          font-size: 16px !important;
          line-height: 1.6 !important;
          color: var(--dawn-70) !important;
          margin-bottom: var(--space-2xl) !important;
        }

        /* ═══════════════════════════════════════════════════════════════
           MANIFESTO - Text-based layout like Services section
           ═══════════════════════════════════════════════════════════════ */
        .section-manifesto {
          /* Use same padding as default .section (which Services uses) */
          padding: 100px calc(var(--hud-padding) + var(--rail-width) + 120px) !important;
          padding-top: 180px !important; /* Extra top padding so it starts later */
          padding-right: 18% !important;
          justify-content: flex-start !important;
          align-items: flex-start !important;
        }

        .manifesto-layout-text {
          width: 100%;
          max-width: 640px;
          margin: 0;
          margin-right: auto;
        }

        /* Content area with vertical line on left */
        .manifesto-content-area {
          border-left: 1px solid var(--dawn-15);
          padding-left: var(--space-xl);
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        /* Large title - only this is big */
        .manifesto-title-large {
          font-family: var(--font-display);
          font-size: clamp(48px, 6vw, 72px);
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: 0.01em;
          color: var(--dawn);
          margin: 0;
        }

        /* Body text - all paragraphs same size */
        .manifesto-body-text {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .manifesto-body-text p {
          font-family: var(--font-body);
          font-size: clamp(17px, 2vw, 20px);
          font-weight: 300;
          line-height: 1.7;
          color: var(--dawn-80);
          margin: 0;
          max-width: 540px;
        }

        .manifesto-body-text em {
          color: var(--gold);
          font-style: normal;
        }

        .manifesto-body-text strong {
          font-weight: 500;
          color: var(--dawn);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .manifesto-title-large {
            font-size: clamp(36px, 8vw, 48px);
          }

          .manifesto-body-text p {
            font-size: 17px;
          }
        }

        /* ═══════════════════════════════════════════════════════════════
           FIXED SIGIL - Appears centered during scroll
           ═══════════════════════════════════════════════════════════════ */
        .fixed-sigil-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: opacity 0.3s ease-out;
        }

        /* Wordmark above the definition text */
        .definition-wordmark {
          width: 100%;
          max-width: 380px;
        }

        .definition-wordmark svg {
          width: 100%;
          height: auto;
        }

        .definition-frame {
          /* No frame styling - just layout */
        }

        .definition-phonetic {
          font-family: var(--font-data, 'PT Mono', monospace);
          font-size: 16px;
          color: rgba(202, 165, 84, 0.6);
          letter-spacing: 0.05em;
        }

        /* ═══════════════════════════════════════════════════════════════
           MODULE CONNECTION LINES - Lines from cards to sigil
           ═══════════════════════════════════════════════════════════════ */
        .module-connection-lines {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          z-index: 4;
          pointer-events: none;
        }

        .module-line {
          transition: opacity 0.3s ease-out;
        }

        /* ═══════════════════════════════════════════════════════════════
           MODULE CARDS - Right side pointing to sigil
           ═══════════════════════════════════════════════════════════════ */
        .definition-modules {
          position: fixed;
          right: calc(var(--rail-width, 60px) + 120px);
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 36px;
          z-index: 10;
          transition: opacity 0.3s ease-out, visibility 0.3s ease-out;
        }

        .module-card {
          position: relative;
          background: rgba(10, 9, 8, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(236, 227, 214, 0.1);
          padding: 20px 24px;
          max-width: 280px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .module-card:hover {
          background: rgba(20, 18, 16, 0.7);
          border-color: var(--gold, #caa554);
          transform: translateX(-5px);
        }

        /* Technical corner accents */
        .module-card::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          width: 10px;
          height: 10px;
          border-top: 1px solid var(--gold, #caa554);
          border-left: 1px solid var(--gold, #caa554);
        }

        .module-card::after {
          content: '';
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 10px;
          height: 10px;
          border-bottom: 1px solid var(--gold, #caa554);
          border-right: 1px solid var(--gold, #caa554);
        }

        /* Connection point - dot on left edge */
        .module-connect {
          position: absolute;
          left: -4px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: var(--gold, #caa554);
          border-radius: 50%;
        }

        .module-header {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }

        .module-id {
          font-family: var(--font-data, 'PT Mono', monospace);
          font-size: 10px;
          color: var(--gold, #caa554);
          letter-spacing: 0.1em;
        }

        .module-icon {
          font-size: 16px;
          color: rgba(236, 227, 214, 0.5);
        }

        .module-title {
          font-family: var(--font-body, system-ui);
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--dawn, #ECE3D6);
          margin-bottom: 8px;
        }

        .module-desc {
          font-family: var(--font-body, system-ui);
          font-size: 12px;
          line-height: 1.5;
          color: rgba(236, 227, 214, 0.5);
        }

        /* ═══════════════════════════════════════════════════════════════
           DEFINITION SECTION - Placeholder for layout flow
           ═══════════════════════════════════════════════════════════════ */
        .section-definition {
          position: relative;
          min-height: 100vh !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          padding: 30px calc(var(--rail-width) + 60px) 80px !important;
        }

        .sigil-placeholder {
          width: 220px;
          height: 220px;
        }

        /* Responsive adjustments */
        @media (max-width: 1100px) {
          .section-definition {
            padding: 60px var(--hud-padding) !important;
          }
        }

        /* ═══════════════════════════════════════════════════════════════
           INFO CARD SYSTEM (Kriss.ai inspired - for Services, etc.)
           ═══════════════════════════════════════════════════════════════ */
        .info-card {
          position: relative;
          background: rgba(10, 9, 8, 0.94);
          border: 1px solid var(--dawn-15);
          padding: 32px;
          max-width: 340px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Corner brackets */
        .card-corner {
          position: absolute;
          width: 16px;
          height: 16px;
          pointer-events: none;
        }

        .card-corner-tl {
          top: -1px;
          left: -1px;
          border-top: 2px solid var(--gold);
          border-left: 2px solid var(--gold);
        }

        .card-corner-tr {
          top: -1px;
          right: -1px;
          border-top: 2px solid var(--gold);
          border-right: 2px solid var(--gold);
        }

        .card-corner-bl {
          bottom: -1px;
          left: -1px;
          border-bottom: 2px solid var(--gold);
          border-left: 2px solid var(--gold);
        }

        .card-corner-br {
          bottom: -1px;
          right: -1px;
          border-bottom: 2px solid var(--gold);
          border-right: 2px solid var(--gold);
        }

        /* Card header */
        .card-header {
          display: flex;
          align-items: center;
        }

        .card-label {
          font-family: var(--font-data);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--gold);
        }

        /* Card title */
        .card-title {
          font-family: var(--font-display);
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 400;
          letter-spacing: 0.02em;
          color: var(--dawn);
          line-height: 1.2;
          margin: 0;
        }

        /* Card description */
        .card-description {
          color: var(--dawn-70);
          font-size: 14px;
          line-height: 1.65;
        }

        .card-description p {
          margin: 0;
        }

        .card-description em {
          color: var(--gold);
          font-style: normal;
        }

        /* Feature list */
        .card-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 8px;
        }

        .features-label {
          font-family: var(--font-data);
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--dawn-30);
        }

        .features-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .features-list li {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .feature-icon {
          font-size: 12px;
          color: var(--gold);
          width: 16px;
          text-align: center;
        }

        .feature-text {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 400;
          color: var(--dawn);
          letter-spacing: 0.01em;
        }

        /* Card CTA */
        .card-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid var(--dawn-08);
          text-decoration: none;
          color: var(--gold);
          font-family: var(--font-data);
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.04em;
          transition: color 0.15s ease;
          cursor: pointer;
        }

        .card-cta:hover {
          color: var(--dawn);
        }

        .cta-arrow {
          font-size: 14px;
          transition: transform 0.15s ease;
        }

        .card-cta:hover .cta-arrow {
          transform: translateX(4px);
        }

        /* Gradient overlay at bottom */
        .card-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(
            to top,
            rgba(202, 165, 84, 0.06) 0%,
            transparent 100%
          );
          pointer-events: none;
        }

        /* Responsive adjustments */
        @media (max-width: 900px) {
          .info-card {
            padding: 24px;
            max-width: 100%;
          }

          .card-title {
            font-size: clamp(22px, 5vw, 28px);
          }

          .card-description {
            font-size: 13px;
          }

          .feature-text {
            font-size: 12px;
          }
        }
      `}</style>
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

