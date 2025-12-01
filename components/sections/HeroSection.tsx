"use client";

import { Button } from "@/components/ui/Button";
import { HeroCanvas } from "@/components/canvas/HeroCanvas";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <HeroCanvas />

      {/* HUD Elements */}
      <div className="absolute top-[20%] right-[10%] z-10 font-mono text-2xs uppercase tracking-wide text-dawn-30 pointer-events-none">
        <div className="text-gold-40 mb-1">// Vector Space</div>
        <div>Semantic Manifold</div>
      </div>
      <div className="absolute bottom-[25%] right-[15%] z-10 font-mono text-2xs uppercase tracking-wide text-dawn-30 pointer-events-none">
        <div className="text-gold-40 mb-1">// Status</div>
        <div>Navigating...</div>
      </div>

      <div className="container-base relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="font-mono text-[clamp(2.5rem,7vw,4.5rem)] font-normal tracking-[0.12em] uppercase text-dawn leading-none mb-8">
              THOUGHT
              <br />
              <span className="text-gold">+</span>FORM
            </h1>
            <p className="text-lg text-dawn-70 leading-relaxed mb-2 max-w-[420px]">
              Thoughtform pioneers intuitive human-AI collaboration.
            </p>
            <p className="text-base text-dawn-50 leading-relaxed mb-10 max-w-[420px]">
              We teach teams how to navigate AI for creative and strategic work.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button variant="ghost" href="#manifesto">
                Learn More
              </Button>
              <Button variant="solid" href="#contact">
                Guide Me
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-dawn-30 font-mono text-2xs uppercase tracking-widest animate-float z-10">
        <span>Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-dawn-30 to-transparent" />
      </div>
    </section>
  );
}

