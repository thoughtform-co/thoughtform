/**
 * LEGACY - NavigationCockpit (V1)
 *
 * This component has been superseded by NavigationCockpitV2.
 * Archived for reference. Do not use in new development.
 *
 * Original location: components/hud/NavigationCockpit.tsx
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ParticleCanvas } from "./ParticleCanvas";
import { HUDFrame } from "@/components/hud/HUDFrame";
import { Wordmark } from "@/components/hud/Wordmark";
import { useLenis } from "@/lib/hooks/useLenis";

export function NavigationCockpit() {
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
      {/* Fixed Background - 3D Latent Engine */}
      <ParticleCanvas scrollProgress={scrollProgress} />

      {/* Fixed HUD Frame - Navigation Cockpit */}
      <HUDFrame
        activeSection={activeSection}
        scrollProgress={scrollProgress}
        onNavigate={handleNavigate}
      />

      {/* Scroll Container - Content Sections */}
      <main className="scroll-container">
        {/* Section 1: Hero */}
        <section className="section section-hero" id="hero" data-section="hero">
          <div className="hero-layout">
            <div className="hero-content">
              <div className="wordmark">
                <Wordmark />
              </div>

              <p className="hero-tagline">Navigate the alien terrain of machine intelligence.</p>

              <p className="hero-description">
                Thoughtform pioneers intuitive human-AI collaboration. We teach teams to think{" "}
                <em>with</em> AI—navigating its latent space for creative breakthroughs.
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
                  Begin Navigation
                </a>
              </div>

              <div className="hero-meta">
                <span className="meta-label">Landmark:</span>
                <span className="meta-value">semantic terrain / latent topology</span>
              </div>
            </div>

            <div className="hero-visualization">
              {/* Landmark 1 canvas renders in background */}
            </div>
          </div>
        </section>

        {/* Section 2: Manifesto - The Commandment */}
        <section className="section section-manifesto" id="manifesto" data-section="manifesto">
          <div className="terminal-frame">
            <div className="terminal-header">
              <div className="terminal-icon" />
              <span className="terminal-title">Manifesto</span>
            </div>

            <div className="terminal-frame-inner">
              <div className="terminal-content">
                <h2 className="headline">AI Isn&apos;t Software</h2>

                <div className="text-block">
                  <p className="text">
                    Most companies struggle because they treat AI like normal software.
                  </p>
                  <p className="text text-emphasis">But AI isn&apos;t a tool to command.</p>
                  <p className="text">
                    It&apos;s a strange, new intelligence we must learn to <em>navigate</em>. It
                    leaps across dimensions. It hallucinates. It surprises.
                  </p>
                  <p className="text">
                    In technical work, that strangeness must be constrained.
                    <br />
                    In creative work? <strong>It&apos;s the source of truly novel ideas.</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="terminal-footer">
              <span className="terminal-tag">Landmark: Crystalline Tower</span>
              <span className="terminal-tag">Section 02</span>
            </div>

            {/* Bottom corner brackets */}
            <div className="terminal-frame-corners" />
          </div>
        </section>

        {/* Section 3: Services */}
        <section className="section section-services" id="services" data-section="services">
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
                <span className="meta-label">Landmark:</span>
                <span className="meta-value">trajectory grid / vanishing point</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Contact */}
        <section className="section section-contact" id="contact" data-section="contact">
          <div className="section-layout">
            <div className="section-label">
              <span className="label-number">04</span>
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
