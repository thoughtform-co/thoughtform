// NavigationBar Organism
// =============================================================================
// Top navigation with logo and links

import * as React from "react";
import { cn } from "../utils/cn";
import { Frame, type CornerToken, type CornerPreset } from "../molecules/Frame";
import { gold, dawn, void_ } from "../tokens/colors";
import { fontFamily, fontSize, letterSpacing } from "../tokens/typography";

export interface NavItem {
  /** Link label */
  label: string;
  /** Link href */
  href: string;
  /** Is active */
  active?: boolean;
}

export interface NavigationBarProps extends React.HTMLAttributes<HTMLElement> {
  /** Logo element */
  logo?: React.ReactNode;
  /** Navigation items */
  items?: NavItem[];
  /** Corner configuration */
  corners?: CornerToken;
  /** Corner preset */
  cornerPreset?: CornerPreset;
  /** Corner color */
  cornerColor?: string;
  /** Show border */
  border?: boolean;
  /** Border color */
  borderColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Show glass effect */
  glass?: boolean;
}

/**
 * NavigationBar - Top navigation component
 *
 * @example
 * ```tsx
 * <NavigationBar
 *   logo={<Logo />}
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'About', href: '/about' },
 *   ]}
 *   glass
 * />
 * ```
 */
export function NavigationBar({
  logo,
  items = [],
  corners = "four",
  cornerPreset = "subtle",
  cornerColor = gold.DEFAULT,
  border = true,
  borderColor = dawn["08"],
  backgroundColor,
  glass = true,
  className,
  style,
  ...props
}: NavigationBarProps) {
  const bgColor = backgroundColor || (glass ? "rgba(10, 9, 8, 0.25)" : void_.DEFAULT);

  return (
    <nav
      className={cn("relative", className)}
      style={{
        display: "flex",
        alignItems: "center",
        height: "44px",
        background: bgColor,
        ...(glass && {
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }),
        ...(border && {
          border: `1px solid ${borderColor}`,
        }),
        ...style,
      }}
      {...props}
    >
      {/* Logo section */}
      {logo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 14px",
            height: "100%",
            borderRight: `1px solid ${dawn["08"]}`,
          }}
        >
          {logo}
        </div>
      )}

      {/* Navigation items */}
      {items.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            padding: "0 20px",
          }}
        >
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href}
              style={{
                fontFamily: fontFamily.mono,
                fontSize: fontSize.xs,
                textTransform: "uppercase",
                letterSpacing: letterSpacing.wide,
                color: item.active ? gold.DEFAULT : dawn[50],
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
