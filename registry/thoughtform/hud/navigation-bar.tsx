"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { type ReactNode } from "react";

export interface NavLink {
  href: string;
  label: string;
  active?: boolean;
}

export interface NavigationBarProps {
  links?: NavLink[];
  logo?: ReactNode;
  actions?: ReactNode;
  variant?: "fixed" | "sticky" | "static";
  className?: string;
}

/**
 * NavigationBar - Top navigation with wordmark and links.
 * Thoughtform branded with gold accents and mono typography.
 */
export function NavigationBar({
  links = [],
  logo,
  actions,
  variant = "fixed",
  className,
}: NavigationBarProps) {
  const positionClasses = {
    fixed: "fixed top-0 left-0 right-0",
    sticky: "sticky top-0",
    static: "relative",
  };

  return (
    <nav
      className={cn(
        positionClasses[variant],
        "z-40 h-16",
        "bg-void/80 backdrop-blur-sm",
        "border-b border-dawn-08",
        className
      )}
    >
      <div className="h-full max-w-[1400px] mx-auto px-6 flex items-center justify-between">
        {/* Logo / Wordmark */}
        <div className="flex items-center gap-3">
          {logo || (
            <Link
              href="/"
              className="font-mono text-sm uppercase tracking-widest text-dawn hover:text-gold transition-colors"
            >
              Thoughtform
            </Link>
          )}
        </div>

        {/* Navigation Links */}
        {links.length > 0 && (
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-mono text-2xs uppercase tracking-widest",
                  "transition-colors duration-200",
                  link.active ? "text-gold" : "text-dawn-50 hover:text-dawn"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions && <div className="flex items-center gap-4">{actions}</div>}
      </div>
    </nav>
  );
}
