"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type CardTier = "content" | "terminal" | "data";
export type AccentPosition = "top" | "left" | "none";
export type AccentColor = "gold" | "dawn" | "verde";

export interface CardFrameProps {
  tier?: CardTier;
  index?: string | number;
  label?: string;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  accent?: AccentPosition;
  accentColor?: AccentColor;
  className?: string;
  onClick?: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// CONTENT CARD (default)
// ═══════════════════════════════════════════════════════════════════

function ContentCard({
  index,
  label,
  title,
  children,
  footer,
  accent = "none",
  accentColor = "gold",
  className,
  onClick,
}: CardFrameProps) {
  const accentColors: Record<AccentColor, string> = {
    gold: "bg-gold",
    dawn: "bg-dawn",
    verde: "bg-verde",
  };

  return (
    <article
      className={cn(
        "relative bg-surface-1 border border-dawn-08",
        "transition-all duration-300",
        "hover:border-dawn-15",
        onClick && "cursor-pointer hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
    >
      {accent === "top" && (
        <div className={cn("absolute top-0 left-0 right-0 h-[3px]", accentColors[accentColor])} />
      )}

      {accent === "left" && (
        <div className={cn("absolute top-0 left-0 bottom-0 w-[3px]", accentColors[accentColor])} />
      )}

      <div className="p-8">
        {index && (
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-2xs uppercase tracking-widest text-gold">
              {typeof index === "number" ? String(index).padStart(2, "0") : index}
            </span>
            {label && (
              <>
                <span className="text-dawn-15">·</span>
                <span className="font-mono text-2xs uppercase tracking-widest text-dawn-30">
                  {label}
                </span>
              </>
            )}
          </div>
        )}

        {title && <h3 className="font-mono text-[15px] text-dawn mb-2 leading-snug">{title}</h3>}

        {children && <div className="text-sm text-dawn-50 leading-relaxed">{children}</div>}

        {footer && <div className="mt-6 pt-4 border-t border-dawn-08">{footer}</div>}
      </div>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TERMINAL CARD (corner brackets)
// ═══════════════════════════════════════════════════════════════════

function TerminalCard({ label, title, children, footer, className }: CardFrameProps) {
  return (
    <article className={cn("relative bg-void/85 border border-dawn-15", "p-12", className)}>
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold" />

      {label && (
        <div className="flex items-center gap-2 mb-8 pl-4">
          <div className="w-2.5 h-2.5 bg-gold" />
          <span className="font-mono text-2xs uppercase tracking-widest text-dawn-50">{label}</span>
        </div>
      )}

      <div className="text-center px-6">
        {title && (
          <h2 className="font-display text-[clamp(28px,4vw,42px)] uppercase tracking-wide text-dawn mb-8">
            {title}
          </h2>
        )}
        {children}
      </div>

      {footer && (
        <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-dawn-08">
          {footer}
        </div>
      )}
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DATA CARD (compact stats)
// ═══════════════════════════════════════════════════════════════════

function DataCard({ label, title, children, className }: CardFrameProps) {
  return (
    <article className={cn("bg-surface-1 border border-dawn-08 p-6", className)}>
      {label && (
        <p className="font-mono text-2xs uppercase tracking-widest text-dawn-30 mb-2">{label}</p>
      )}

      {title && <p className="font-mono text-2xl text-gold tracking-tight mb-1">{title}</p>}

      {children && <div className="font-mono text-xs text-dawn-50">{children}</div>}
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════

export function CardFrame(props: CardFrameProps) {
  const { tier = "content" } = props;

  switch (tier) {
    case "terminal":
      return <TerminalCard {...props} />;
    case "data":
      return <DataCard {...props} />;
    default:
      return <ContentCard {...props} />;
  }
}

export { ContentCard, TerminalCard, DataCard };
