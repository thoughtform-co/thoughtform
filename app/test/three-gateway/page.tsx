"use client";

import { useEffect, useState, useCallback } from "react";
import { ParticleCanvasV2 } from "@/components/hud/ParticleCanvasV2";
import { ThreeGateway } from "@/components/hud/ThreeGateway";
import { HUDFrame } from "@/components/hud/HUDFrame";
import { Wordmark } from "@/components/hud/Wordmark";
import { useLenis } from "@/lib/hooks/useLenis";
import { DEFAULT_CONFIG } from "@/lib/particle-config";

// ═══════════════════════════════════════════════════════════════
// TEST PAGE: HYBRID - Original Manifold + Three.js Gateway
// 
// - Original ParticleCanvasV2 for the manifold/terrain
// - Three.js gateway overlay for the hero portal (fades out on scroll)
// ═══════════════════════════════════════════════════════════════

export default function ThreeGatewayTestPage() {
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

  // Modify config to disable the canvas gateway (we're using Three.js for that)
  const configWithoutGateway = {
    ...DEFAULT_CONFIG,
    landmarks: DEFAULT_CONFIG.landmarks.map(l => 
      l.shape === "gateway" ? { ...l, enabled: false } : l
    ),
  };

  return (
    <>
      {/* Original Manifold (canvas) - terrain and landmarks */}
      <ParticleCanvasV2 scrollProgress={scrollProgress} config={configWithoutGateway} />
      
      {/* Three.js Gateway Overlay - only in hero, fades out */}
      <ThreeGateway scrollProgress={scrollProgress} />

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

              <p className="hero-tagline" style={{ textShadow: "0 0 40px rgba(5,4,3,0.9)" }}>
                Enter the alien terrain
                <br />
                of machine intelligence.
              </p>

              <p className="hero-description" style={{ textShadow: "0 0 30px rgba(5,4,3,0.9)" }}>
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
                </div>
              </div>
            </div>

            <div className="terminal-footer terminal-footer-v2">
              <span className="terminal-tag">Three.js Gateway</span>
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
            </div>
          </div>
        </section>
      </main>

      {/* Styles */}
      <style jsx global>{`
        .section-manifesto-v2 {
          padding: 60px calc(var(--hud-padding) + var(--rail-width) + 80px) !important;
        }
        .terminal-frame-v2 {
          max-width: 880px !important;
          padding: var(--space-3xl) !important;
        }
        .headline-v2 {
          font-size: clamp(36px, 5vw, 52px) !important;
          margin-bottom: var(--space-2xl) !important;
        }
        .text-v2 {
          font-size: 18px !important;
          line-height: 1.7 !important;
          margin-bottom: var(--space-lg) !important;
        }
      `}</style>
    </>
  );
}

