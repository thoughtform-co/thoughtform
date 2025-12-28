"use client";

import { cn } from "@/lib/utils";
import { type InputHTMLAttributes } from "react";

export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  valueFormat?: (value: number) => string;
  className?: string;
}

export function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  showValue = true,
  valueFormat = (v) => v.toFixed(2),
  className,
  ...props
}: SliderProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="font-mono text-2xs uppercase tracking-widest text-dawn-50">
              {label}
            </label>
          )}
          {showValue && (
            <span className="font-mono text-2xs text-gold tabular-nums">{valueFormat(value)}</span>
          )}
        </div>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "w-full h-1.5 appearance-none cursor-pointer",
          "bg-dawn-08 rounded-none",
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:w-3",
          "[&::-webkit-slider-thumb]:h-3",
          "[&::-webkit-slider-thumb]:bg-gold",
          "[&::-webkit-slider-thumb]:border-none",
          "[&::-webkit-slider-thumb]:cursor-pointer",
          "[&::-webkit-slider-thumb]:transition-transform",
          "[&::-webkit-slider-thumb]:hover:scale-125",
          "[&::-moz-range-thumb]:w-3",
          "[&::-moz-range-thumb]:h-3",
          "[&::-moz-range-thumb]:bg-gold",
          "[&::-moz-range-thumb]:border-none",
          "[&::-moz-range-thumb]:cursor-pointer"
        )}
        {...props}
      />
    </div>
  );
}
