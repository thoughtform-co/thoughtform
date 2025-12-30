// InputGroup Molecule
// =============================================================================
// Label + Input + Addon pattern

import * as React from "react";
import { cn } from "../utils/cn";
import { gold, dawn, void_ } from "../tokens/colors";
import { fontFamily, fontSize } from "../tokens/typography";

export interface InputGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Input placeholder */
  placeholder?: string;
  /** Input value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Start addon (icon or text) */
  startAddon?: React.ReactNode;
  /** End addon (button or text) */
  endAddon?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * InputGroup - Input with optional addons
 *
 * @example
 * ```tsx
 * <InputGroup
 *   placeholder="Search..."
 *   startAddon={<span>○</span>}
 *   endAddon={<button>Go</button>}
 * />
 * ```
 */
export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  (
    {
      placeholder,
      value,
      onChange,
      startAddon,
      endAddon,
      disabled = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-stretch w-full", className)}
        style={{
          border: `1px solid ${gold[15]}`,
          background: "rgba(0, 0, 0, 0.3)",
          opacity: disabled ? 0.5 : 1,
          ...style,
        }}
        {...props}
      >
        {startAddon && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 8px 0 10px",
              borderRight: `1px solid ${gold[15]}`,
              color: dawn[30],
              fontSize: "10px",
            }}
          >
            {startAddon}
          </div>
        )}

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          style={{
            flex: 1,
            padding: "8px 10px",
            background: "transparent",
            border: "none",
            fontFamily: fontFamily.mono,
            fontSize: fontSize.xs,
            color: dawn.DEFAULT,
            outline: "none",
            minWidth: 0,
          }}
        />

        {endAddon && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 10px 0 8px",
              borderLeft: `1px solid ${gold[15]}`,
            }}
          >
            {endAddon}
          </div>
        )}
      </div>
    );
  }
);

InputGroup.displayName = "InputGroup";
