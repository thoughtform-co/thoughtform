"use client";

import { AttractorCanvas } from "@/components/canvas/AttractorCanvas";

export function QuoteSection() {
  return (
    <section className="section-spacing-compact relative overflow-hidden">
      <AttractorCanvas />

      <div className="container-narrow relative z-10 text-center">
        <blockquote className="text-[clamp(1.125rem,2.5vw,1.5rem)] leading-relaxed text-dawn max-w-[700px] mx-auto mb-6 italic">
          "By simply using AI you get an intuition. And as AI continues to
          improve, that intuition becomes stronger. At the end of the day, no
          amount of essays and explanations can compete with our own senses."
        </blockquote>
        <cite className="font-mono text-2xs uppercase tracking-widest text-gold not-italic">
          Ilya Sutskever, Co-Founder OpenAI
        </cite>
      </div>
    </section>
  );
}

