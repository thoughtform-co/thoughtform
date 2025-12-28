"use client";

import { cn } from "@/lib/utils";
import { type SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Select({ label, options, value, onChange, className, ...props }: SelectProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="font-mono text-2xs uppercase tracking-widest text-dawn-50">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2",
          "font-mono text-xs text-dawn",
          "bg-surface-1 border border-dawn-15",
          "cursor-pointer appearance-none",
          "transition-colors duration-200",
          "hover:border-dawn-30",
          "focus:outline-none focus:border-gold",
          // Custom arrow
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23d4af37%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]",
          "bg-no-repeat bg-[right_0.75rem_center]",
          "pr-8"
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
