"use client";

import { cn } from "@/lib/utils";
import { type LabelHTMLAttributes } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
}

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label
      className={cn("font-mono text-2xs uppercase tracking-widest text-dawn-50", className)}
      {...props}
    >
      {children}
    </label>
  );
}
