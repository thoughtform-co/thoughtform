"use client";

import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#manifesto", label: "Manifesto" },
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#musings", label: "Musings" },
  { href: "#contact", label: "Contact" },
];

export function Navigation() {
  return (
    <nav
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-8",
        "px-6 py-3",
        "bg-void/90 backdrop-blur-xl",
        "border border-dawn-08",
        "font-mono text-2xs uppercase tracking-widest"
      )}
    >
      {navLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="text-dawn-50 hover:text-dawn transition-colors duration-base ease-out"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

