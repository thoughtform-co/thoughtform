const navLinks = [
  { href: "#manifesto", label: "Manifesto" },
  { href: "#shift", label: "The Shift" },
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#musings", label: "Musings" },
];

const socialLinks = [
  { href: "#", label: "X (Twitter)" },
  { href: "#", label: "LinkedIn" },
  { href: "#", label: "Instagram" },
  { href: "mailto:vince@thoughtform.ai", label: "Email" },
];

export function Footer() {
  return (
    <footer className="py-16 border-t border-dawn-08">
      <div className="container-base">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-12 lg:gap-16 mb-12">
          {/* Brand */}
          <div>
            <div className="font-mono text-sm tracking-[0.15em] uppercase text-dawn mb-2">
              THOUGHT<span className="text-gold">+</span>FORM
            </div>
            <div className="font-mono text-xs text-gold italic mb-4">
              Intuition is the interface.
            </div>
            <p className="text-[13px] text-dawn-50 leading-relaxed max-w-[280px]">
              Cultivating enduring AI adoption through intuitive human-AI
              collaboration.
            </p>
          </div>

          {/* Navigate */}
          <div>
            <div className="font-mono text-2xs uppercase tracking-widest text-dawn-50 mb-5">
              Navigate
            </div>
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-mono text-xs text-dawn-70 hover:text-dawn transition-colors duration-base"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <div className="font-mono text-2xs uppercase tracking-widest text-dawn-50 mb-5">
              Connect
            </div>
            <div className="flex flex-col gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="font-mono text-xs text-dawn-70 hover:text-dawn transition-colors duration-base"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-dawn-08 text-center font-mono text-2xs tracking-wide text-dawn-30">
          © 2025 Thoughtform │ Navigate courageously
        </div>
      </div>
    </footer>
  );
}

