import { Button } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section id="contact" className="section-spacing text-center">
      <div className="container-narrow">
        <h2 className="font-mono text-[clamp(1.5rem,3vw,2rem)] tracking-wide uppercase text-dawn mb-6">
          Begin the Navigation
        </h2>
        <p className="text-[1.0625rem] text-dawn-70 leading-relaxed max-w-[560px] mx-auto mb-10">
          The technology is here. The question is whether your team will develop
          navigation skills before convergence flattens everything into beige
          uniformity.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="solid" href="mailto:vince@thoughtform.ai">
            Reach Out
          </Button>
          <Button variant="ghost" href="#services">
            Explore Services
          </Button>
        </div>
      </div>
    </section>
  );
}

