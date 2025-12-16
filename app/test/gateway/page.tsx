"use client";

import { useEffect, useState, useCallback } from "react";
import { ImageParticleGateway } from "@/components/hud/ImageParticleGateway";
import { HUDFrame } from "@/components/hud/HUDFrame";
import { Wordmark } from "@/components/hud/Wordmark";
import { useLenis } from "@/lib/hooks/useLenis";

// ═══════════════════════════════════════════════════════════════
// TEST PAGE: IMAGE-TO-PARTICLE GATEWAY EXPERIMENT
// 
// This page demonstrates the hybrid approach:
// 1. Hero image rendered as particle field
// 2. Depth map used for 3D positioning
// 3. As you scroll, particles morph into the topology manifold
// ═══════════════════════════════════════════════════════════════

export default function GatewayTestPage() {
  const [activeSection, setActiveSection] = useState("hero");
  const { scrollProgress, scrollTo } = useLenis();

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

  // Section detection
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
      {/* Image-to-Particle Gateway System */}
      <ImageParticleGateway 
        scrollProgress={scrollProgress}
        heroImageSrc="/images/gateway-hero.png"
        depthMapSrc="/images/gateway-depth.png"
      />

      {/* Fixed HUD Frame */}
      <HUDFrame
        activeSection={activeSection}
        scrollProgress={scrollProgress}
        onNavigate={handleNavigate}
      />

      {/* Scroll Container */}
      <main className="scroll-container">
        {/* Hero Section */}
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

              <p className="hero-tagline hero-tagline-gateway">
                Enter the alien terrain
                <br />
                of machine intelligence.
              </p>

              <p className="hero-description hero-description-gateway">
                Thoughtform pioneers intuitive human-AI collaboration.
                <br />
                We teach teams how to navigate AI for creative and strategic work.
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
              {/* Gateway renders in background via ImageParticleGateway */}
            </div>
          </div>
        </section>

        {/* Manifesto Section */}
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
                    Most companies struggle because they treat AI like normal software.
                  </p>
                  <p className="text text-emphasis text-v2">
                    But AI isn&apos;t a tool to command.
                  </p>
                  <p className="text text-v2">
                    It&apos;s a strange, new intelligence we must learn to{" "}
                    <em>navigate</em>. It leaps across dimensions. It hallucinates. It surprises.
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
              <span className="terminal-tag">Terrain Emerging</span>
              <span className="terminal-tag">Section 02</span>
            </div>

            <div className="terminal-frame-corners" />
          </div>
        </section>

        {/* Services Section */}
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
                <span className="meta-label">Depth:</span>
                <span className="meta-value">Topology manifold</span>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
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
                <span className="meta-label">Signal:</span>
                <span className="meta-value">Event horizon</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Gateway-specific styles */}
      <style jsx global>{`
        .hero-tagline-gateway {
          font-size: clamp(26px, 3.5vw, 36px) !important;
          line-height: 1.25 !important;
          margin-bottom: var(--space-lg) !important;
          text-shadow: 0 0 40px rgba(5, 4, 3, 0.8);
        }

        .hero-description-gateway {
          font-size: 15px !important;
          line-height: 1.7 !important;
          color: var(--dawn-60) !important;
          margin-bottom: var(--space-2xl) !important;
          text-shadow: 0 0 30px rgba(5, 4, 3, 0.9);
        }

        /* Manifesto V2 styles */
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

