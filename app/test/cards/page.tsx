"use client";

import { useState } from "react";
import { CardFrame } from "@/components/ui/CardFrame";
import { ParticleCanvasV2 } from "@/components/hud/ParticleCanvasV2";
import { HUDFrame } from "@/components/hud/HUDFrame";
import { ParticleConfigProvider, useParticleConfig } from "@/lib/contexts/ParticleConfigContext";

/**
 * Card Component Laboratory
 * 
 * Test page for experimenting with card variations in the Thoughtform context.
 * View at: /test/cards
 */

function CardLabInner() {
  const { config } = useParticleConfig();
  const [activeAccent, setActiveAccent] = useState<"none" | "top" | "left">("none");

  return (
    <>
      {/* Background */}
      <ParticleCanvasV2 scrollProgress={0} config={config} />
      
      {/* HUD Frame for context */}
      <HUDFrame 
        activeSection="lab" 
        scrollProgress={0} 
        onNavigate={() => {}} 
      />

      {/* Main Content */}
      <main className="relative z-10 min-h-screen pt-32 pb-20 px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono text-2xs text-dawn-30">{"//"}</span>
              <span className="font-mono text-2xs uppercase tracking-widest text-gold">
                Component Laboratory
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-dawn-15 to-transparent" />
            </div>
            <h1 className="font-display text-3xl uppercase tracking-wide text-dawn mb-4">
              Card Variations
            </h1>
            <p className="text-dawn-50 max-w-xl">
              Exploring different card styles for the Thoughtform design system. 
              Toggle accent styles to compare approaches.
            </p>
          </div>

          {/* Accent Toggle */}
          <div className="flex gap-4 mb-12">
            {(["none", "top", "left"] as const).map((accent) => (
              <button
                key={accent}
                onClick={() => setActiveAccent(accent)}
                className={`
                  font-mono text-xs uppercase tracking-wide px-4 py-2 border
                  transition-all duration-200
                  ${activeAccent === accent 
                    ? "bg-gold text-void border-gold" 
                    : "bg-transparent text-dawn-50 border-dawn-15 hover:border-dawn-30"
                  }
                `}
              >
                {accent === "none" ? "No Accent" : `${accent} Accent`}
              </button>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 1: Content Cards (Services Style)
              ═══════════════════════════════════════════════════════════════ */}
          <section className="mb-20">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="font-mono text-xs text-gold">01</span>
              <span className="font-mono text-xs uppercase tracking-wide text-dawn-30">
                Content Cards
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CardFrame
                tier="content"
                index={1}
                label="Keynote"
                title="AI Intuition Workshops"
                accent={activeAccent}
                accentColor="gold"
              >
                Develop the mental models that unlock creative collaboration with AI.
              </CardFrame>

              <CardFrame
                tier="content"
                index={2}
                label="Workshop"
                title="Strategic Integration"
                accent={activeAccent}
                accentColor="gold"
              >
                Design AI-augmented workflows for creative and strategic teams.
              </CardFrame>

              <CardFrame
                tier="content"
                index={3}
                label="Strategy"
                title="Custom Expeditions"
                accent={activeAccent}
                accentColor="gold"
              >
                Guided exploration of AI capabilities tailored to your domain.
              </CardFrame>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 2: Content Cards - Index Only (Minimal)
              ═══════════════════════════════════════════════════════════════ */}
          <section className="mb-20">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="font-mono text-xs text-gold">02</span>
              <span className="font-mono text-xs uppercase tracking-wide text-dawn-30">
                Index Only (No Labels)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CardFrame
                tier="content"
                index={1}
                title="Navigate"
                accent={activeAccent}
              >
                Map the AI landscape with clarity. Understand what&apos;s possible.
              </CardFrame>

              <CardFrame
                tier="content"
                index={2}
                title="Evaluate"
                accent={activeAccent}
              >
                Test what works for your specific context and constraints.
              </CardFrame>

              <CardFrame
                tier="content"
                index={3}
                title="Synthesize"
                accent={activeAccent}
              >
                Integrate AI seamlessly into existing workflows.
              </CardFrame>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 3: Terminal Frame
              ═══════════════════════════════════════════════════════════════ */}
          <section className="mb-20">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="font-mono text-xs text-gold">03</span>
              <span className="font-mono text-xs uppercase tracking-wide text-dawn-30">
                Terminal Frame
              </span>
            </div>

            <CardFrame
              tier="terminal"
              label="Manifesto"
              title="AI Isn't Software"
              footer={
                <>
                  <span className="font-mono text-2xs uppercase tracking-wide text-dawn-30 px-2 py-1 border border-dawn-08">
                    Landmark: Crystalline Tower
                  </span>
                  <span className="font-mono text-2xs uppercase tracking-wide text-dawn-30 px-2 py-1 border border-dawn-08">
                    Section 02
                  </span>
                </>
              }
            >
              <div className="max-w-xl mx-auto space-y-4">
                <p className="text-dawn-70 text-base leading-relaxed">
                  Most companies struggle because they treat AI like normal software.
                </p>
                <p className="text-dawn text-lg">
                  But AI isn&apos;t a tool to command.
                </p>
                <p className="text-dawn-70 text-base leading-relaxed">
                  It&apos;s a strange, new intelligence we must learn to{" "}
                  <em className="text-gold not-italic">navigate</em>.
                </p>
              </div>
            </CardFrame>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 4: Data Cards
              ═══════════════════════════════════════════════════════════════ */}
          <section className="mb-20">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="font-mono text-xs text-gold">04</span>
              <span className="font-mono text-xs uppercase tracking-wide text-dawn-30">
                Data Cards
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <CardFrame tier="data" label="Teams Trained" title="47">
                +12 this quarter
              </CardFrame>
              <CardFrame tier="data" label="Workshops" title="156">
                Across 8 countries
              </CardFrame>
              <CardFrame tier="data" label="Satisfaction" title="94%">
                NPS Score
              </CardFrame>
              <CardFrame tier="data" label="Signal" title="74%">
                Latent connection
              </CardFrame>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 5: Mixed Layout (Real Usage)
              ═══════════════════════════════════════════════════════════════ */}
          <section className="mb-20">
            <div className="flex items-baseline gap-4 mb-8">
              <span className="font-mono text-xs text-gold">05</span>
              <span className="font-mono text-xs uppercase tracking-wide text-dawn-30">
                Mixed Layout
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main feature card - spans 2 columns */}
              <div className="lg:col-span-2">
                <CardFrame
                  tier="content"
                  index="→"
                  label="Featured"
                  title="The Geometry of Meaning"
                  accent={activeAccent}
                  footer={
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xs text-dawn-30">
                        Feb 2025 · Keynote
                      </span>
                      <button className="font-mono text-xs uppercase tracking-wide text-gold hover:text-dawn transition-colors">
                        View Details →
                      </button>
                    </div>
                  }
                >
                  <p className="mb-4">
                    Explore how AI navigates the latent space of language—and how 
                    understanding this geometry unlocks creative collaboration.
                  </p>
                  <p className="text-dawn-30">
                    A 45-minute journey through semantic terrain.
                  </p>
                </CardFrame>
              </div>

              {/* Side stats */}
              <div className="space-y-6">
                <CardFrame tier="data" label="Duration" title="45 min">
                  Interactive session
                </CardFrame>
                <CardFrame tier="data" label="Capacity" title="200">
                  Seats remaining
                </CardFrame>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Navigation hint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <a 
          href="/"
          className="font-mono text-2xs uppercase tracking-wide text-dawn-30 hover:text-gold transition-colors"
        >
          ← Back to Home
        </a>
      </div>
    </>
  );
}

export default function CardLabPage() {
  return (
    <ParticleConfigProvider>
      <CardLabInner />
    </ParticleConfigProvider>
  );
}

