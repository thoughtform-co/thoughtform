import { SectionHeader } from "@/components/ui/SectionHeader";

export function AboutSection() {
  return (
    <section id="about" className="section-spacing bg-void">
      <div className="container-base">
        <SectionHeader label="About" />

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-12 lg:gap-16 items-start">
          {/* Portrait placeholder */}
          <div className="aspect-[4/5] bg-surface-1 border border-dawn-08" />

          <div>
            <h2 className="font-mono text-[clamp(1.25rem,2.5vw,1.75rem)] tracking-wide uppercase text-dawn mb-2">
              Vince Buyssens
            </h2>
            <div className="font-mono text-xs uppercase tracking-wide text-gold mb-8">
              // Voidwalker
            </div>
            <div className="text-base leading-[1.8] text-dawn-70 space-y-5">
              <p>
                Thoughtform was founded by creative technologist Vincent
                Buyssens, who has been navigating the currents of digital change
                for over a decade—from viral campaigns that convinced Jeff Bezos
                to save The Expanse, to pioneering AI adoption at Loop Earplugs.
              </p>
              <p>
                Vincent believes AI's true potential isn't unlocked through
                rigid approaches, but through intuition—learning to think with
                machine intelligence rather than just using it. Through
                Thoughtform, he helps teams cultivate that sense, turning AI
                from productivity tool into cognitive force multiplier.
              </p>
              <p>Based in Brussels. Speaking and workshopping across Europe.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

