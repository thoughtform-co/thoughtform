"use client";

import { cn } from "@/lib/utils";
import { useState, createContext, useContext, type ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════
// ACCORDION CONTEXT
// ═══════════════════════════════════════════════════════════════════

interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (id: string) => void;
  type: "single" | "multiple";
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════
// ACCORDION ROOT
// ═══════════════════════════════════════════════════════════════════

export interface AccordionProps {
  children: ReactNode;
  type?: "single" | "multiple";
  defaultOpen?: string[];
  className?: string;
}

export function Accordion({
  children,
  type = "single",
  defaultOpen = [],
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen));

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (type === "single") {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggle, type }}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ACCORDION ITEM
// ═══════════════════════════════════════════════════════════════════

export interface AccordionItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function AccordionItem({ id, children, className }: AccordionItemProps) {
  return (
    <div
      className={cn("border-b border-dawn-08 last:border-b-0", className)}
      data-state={useAccordion().openItems.has(id) ? "open" : "closed"}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ACCORDION TRIGGER
// ═══════════════════════════════════════════════════════════════════

export interface AccordionTriggerProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function AccordionTrigger({ id, children, className }: AccordionTriggerProps) {
  const { openItems, toggle } = useAccordion();
  const isOpen = openItems.has(id);

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      className={cn(
        "w-full flex items-center justify-between py-3 px-1",
        "font-mono text-xs uppercase tracking-widest text-dawn-70",
        "transition-colors duration-200",
        "hover:text-dawn",
        className
      )}
      aria-expanded={isOpen}
    >
      <span>{children}</span>
      <svg
        className={cn(
          "w-3 h-3 text-gold transition-transform duration-200",
          isOpen && "rotate-180"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="square" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ACCORDION CONTENT
// ═══════════════════════════════════════════════════════════════════

export interface AccordionContentProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function AccordionContent({ id, children, className }: AccordionContentProps) {
  const { openItems } = useAccordion();
  const isOpen = openItems.has(id);

  if (!isOpen) return null;

  return (
    <div
      className={cn("pb-4 px-1", "animate-in slide-in-from-top-2 fade-in duration-200", className)}
    >
      {children}
    </div>
  );
}
