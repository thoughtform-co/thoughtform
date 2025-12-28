"use client";

import { cn } from "@/lib/utils";

export interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ label, checked, onChange, disabled = false, className }: ToggleProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-3 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative w-10 h-5 rounded-none border transition-colors duration-200",
          checked ? "bg-gold/20 border-gold" : "bg-dawn-04 border-dawn-15 hover:border-dawn-30"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 transition-all duration-200",
            checked ? "left-5 bg-gold" : "left-0.5 bg-dawn-30"
          )}
        />
      </button>
      {label && (
        <span className="font-mono text-2xs uppercase tracking-widest text-dawn-50">{label}</span>
      )}
    </label>
  );
}
