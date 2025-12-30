// Button Organism
// =============================================================================
// Thoughtform button with variants

import * as React from "react";
import { cn } from "../utils/cn";
import { Frame, type CornerToken, type CornerPreset } from "../molecules/Frame";
import { gold, dawn, void_ } from "../tokens/colors";
import { fontFamily, fontSize, letterSpacing } from "../tokens/typography";

export type ButtonVariant = "ghost" | "solid" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Corner configuration */
  corners?: CornerToken;
  /** Corner preset */
  cornerPreset?: CornerPreset;
  /** Corner color */
  cornerColor?: string;
  /** Corner thickness */
  cornerThickness?: number;
  /** Show border */
  border?: boolean;
  /** Border color */
  borderColor?: string;
  /** Border thickness */
  borderThickness?: number;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Render as link */
  href?: string;
  /** Children content */
  children: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, { padding: string; fontSize: string }> = {
  sm: { padding: "6px 12px", fontSize: fontSize.xs },
  md: { padding: "10px 20px", fontSize: fontSize.xs },
  lg: { padding: "14px 28px", fontSize: fontSize.sm },
};

const variantStyles: Record<
  ButtonVariant,
  { background: string; color: string; borderColor: string }
> = {
  ghost: {
    background: "transparent",
    color: dawn[70],
    borderColor: dawn[15],
  },
  solid: {
    background: gold.DEFAULT,
    color: void_.DEFAULT,
    borderColor: gold.DEFAULT,
  },
  outline: {
    background: "transparent",
    color: gold.DEFAULT,
    borderColor: gold.DEFAULT,
  },
};

/**
 * Button - Thoughtform styled button
 *
 * @example
 * ```tsx
 * <Button variant="solid">Submit</Button>
 * <Button variant="outline" size="lg" corners="four">Learn More</Button>
 * <Button variant="ghost" href="/about">About</Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      corners = "four",
      cornerPreset = "subtle",
      cornerColor,
      cornerThickness = 1.5,
      border = true,
      borderColor,
      borderThickness = 1,
      backgroundColor,
      textColor,
      href,
      children,
      className,
      style,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    const finalBackground = backgroundColor || variantStyle.background;
    const finalColor = textColor || variantStyle.color;
    const finalBorderColor = borderColor || variantStyle.borderColor;
    const finalCornerColor = cornerColor || (variant === "solid" ? void_.DEFAULT : gold.DEFAULT);

    const buttonStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: sizeStyle.padding,
      background: finalBackground,
      color: finalColor,
      fontFamily: fontFamily.mono,
      fontSize: sizeStyle.fontSize,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: letterSpacing.wide,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "all 0.15s ease",
      textDecoration: "none",
      whiteSpace: "nowrap",
      ...(border && {
        border: `${borderThickness}px solid ${finalBorderColor}`,
      }),
      ...(!border && {
        border: "none",
      }),
      ...style,
    };

    const content = (
      <Frame
        corners={corners}
        cornerPreset={cornerPreset}
        cornerColor={finalCornerColor}
        cornerThickness={cornerThickness}
        border={false}
        surface="transparent"
        padding="none"
      >
        <span style={buttonStyle}>{children}</span>
      </Frame>
    );

    if (href) {
      return (
        <a href={href} className={cn("inline-block", className)} style={{ textDecoration: "none" }}>
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        className={cn("relative", className)}
        disabled={disabled}
        style={{ background: "transparent", border: "none", padding: 0 }}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
