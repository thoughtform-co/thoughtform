const logos = ["ACC Belgium", "Tool", "Thomas More", "Voka", "Loop Earplugs"];

export function ProofSection() {
  return (
    <section className="py-[60px] md:py-[80px] text-center">
      <div className="container-base">
        <div className="font-mono text-2xs uppercase tracking-[0.15em] text-dawn-30 mb-8">
          Trusted By
        </div>
        <div className="flex items-center justify-center gap-12 flex-wrap">
          {logos.map((logo) => (
            <span
              key={logo}
              className="font-mono text-xs text-dawn-30 hover:text-dawn-50 transition-colors duration-base"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

