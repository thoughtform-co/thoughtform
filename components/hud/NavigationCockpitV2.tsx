"use client";

import { useEffect, useState, useCallback } from "react";
import { ParticleCanvasV2 } from "./ParticleCanvasV2";
import { ThreeGateway } from "./ThreeGateway";
import { HUDFrame } from "./HUDFrame";
import { Wordmark } from "./Wordmark";
import { useLenis } from "@/lib/hooks/useLenis";
import {
  ParticleConfigProvider,
  useParticleConfig,
} from "@/lib/contexts/ParticleConfigContext";
import { AdminGate, ParticleAdminPanel } from "@/components/admin";

// Inner component that uses the config context
function NavigationCockpitInner() {
  const [activeSection, setActiveSection] = useState("hero");
  const { scrollProgress, scrollTo } = useLenis();
  const { config: rawConfig, isLoading } = useParticleConfig();
  
  // Force-disable the canvas gateway since we're using Three.js gateway
  const config = {
    ...rawConfig,
    landmarks: rawConfig.landmarks.map(l => 
      l.shape === "gateway" ? { ...l, enabled: false } : l
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

      {/* Scroll Container - Content Sections */}
      <main className="scroll-container">
        {/* Section 1: Hero - Simplified */}
        <section
          className="section section-hero"
          id="hero"
          data-section="hero"
        >
          <div className="hero-layout">
            <div className="hero-content">
              <div className="wordmark">
                <Wordmark />
              </div>

              <p className="hero-tagline hero-tagline-v2">
                Thoughtform pioneers intuitive
                <br />
                human-AI collaboration.
              </p>

              <p className="hero-description hero-description-v2">
                We teach teams how to navigate AI
                <br />
                for creative and strategic work.
              </p>

              <div className="hero-cta">
                <a
                  href="#manifesto"
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate("manifesto");
                  }}
                >
                  Enter the Gateway
                </a>
              </div>
            </div>

            <div className="hero-visualization">
              {/* Gateway renders in background via ParticleCanvasV2 */}
            </div>
          </div>
        </section>

        {/* Section 2: Manifesto - LARGER */}
        <section
          className="section section-manifesto section-manifesto-v2"
          id="manifesto"
          data-section="manifesto"
        >
          <div className="terminal-frame terminal-frame-v2">
            <div className="terminal-header terminal-header-v2">
              <div className="terminal-icon" />
              <span className="terminal-title">Manifesto</span>
            </div>

            <div className="terminal-frame-inner">
              <div className="terminal-content terminal-content-v2">
                <h2 className="headline headline-v2">AI Isn&apos;t Software</h2>

                <div className="text-block text-block-v2">
                  <p className="text text-v2">
                    Most companies struggle because they treat AI like normal
                    software.
                  </p>
                  <p className="text text-emphasis text-v2">
                    But AI isn&apos;t a tool to command.
                  </p>
                  <p className="text text-v2">
                    It&apos;s a strange, new intelligence we must learn to{" "}
                    <em>navigate</em>. It leaps across dimensions. It
                    hallucinates. It surprises.
                  </p>
                  <p className="text text-v2">
                    In technical work, that strangeness must be constrained.
                    <br />
                    In creative work?{" "}
                    <strong>It&apos;s the source of truly novel ideas.</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="terminal-footer terminal-footer-v2">
              <span className="terminal-tag">Landmark: Crystalline Tower</span>
              <span className="terminal-tag">Section 02</span>
            </div>

            {/* Bottom corner brackets */}
            <div className="terminal-frame-corners" />
          </div>
        </section>

        {/* Section 3: Services */}
        <section
          className="section section-services"
          id="services"
          data-section="services"
        >
          <div className="section-layout">
            <div className="section-label">
              <span className="label-number">03</span>
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

        {/* Section 4: Contact */}
        <section
          className="section section-contact"
          id="contact"
          data-section="contact"
        >
          <div className="section-layout">
            <div className="section-label">
              <span className="label-number">04</span>
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
        /* Hero V2 - Cleaner, more focused */
        .hero-tagline-v2 {
          font-size: clamp(24px, 3vw, 32px) !important;
          line-height: 1.3 !important;
          margin-bottom: var(--space-lg) !important;
        }

        .hero-description-v2 {
          font-size: 16px !important;
          line-height: 1.6 !important;
          color: var(--dawn-70) !important;
          margin-bottom: var(--space-2xl) !important;
        }

        /* Manifesto V2 - LARGER */
        .section-manifesto-v2 {
          padding: 60px calc(var(--hud-padding) + var(--rail-width) + 80px) !important;
        }

        .terminal-frame-v2 {
          max-width: 880px !important;
          padding: var(--space-3xl) !important;
        }

        .terminal-header-v2 {
          margin-bottom: var(--space-xl) !important;
        }

        .terminal-content-v2 {
          padding: var(--space-xl) 0 !important;
        }

        .headline-v2 {
          font-size: clamp(36px, 5vw, 52px) !important;
          margin-bottom: var(--space-2xl) !important;
        }

        .text-block-v2 {
          max-width: 700px !important;
        }

        .text-v2 {
          font-size: 18px !important;
          line-height: 1.7 !important;
          margin-bottom: var(--space-lg) !important;
        }

        .text-v2.text-emphasis {
          font-size: 20px !important;
        }

        .terminal-footer-v2 {
          margin-top: var(--space-2xl) !important;
          padding-top: var(--space-lg) !important;
        }

        /* Responsive adjustments */
        @media (max-width: 900px) {
          .headline-v2 {
            font-size: clamp(28px, 4vw, 40px) !important;
          }

          .text-v2 {
            font-size: 16px !important;
          }

          .terminal-frame-v2 {
            padding: var(--space-2xl) !important;
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
