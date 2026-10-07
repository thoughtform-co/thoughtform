import type { JSX, ReactNode } from "react";

/**
 * The lattice's twelve-column grid on its own (ADR-149 §3), for a box that
 * is not a section body. Gutter zero by law — seams, not gutters; `air` puts
 * `--lat-air` between TEXT columns only. A server component; it paints nothing.
 */
export type GridProps = {
  as?: keyof JSX.IntrinsicElements;
  air?: boolean;
  className?: string;
  children?: ReactNode;
};

export function Grid({ as = "div", air = false, className, children }: GridProps) {
  // Typed as "div" so the attributes stay the HTML set; the tag itself is `as`.
  const Tag = as as "div";
  return (
    <Tag className={`lat-grid${className ? ` ${className}` : ""}`} data-air={air ? "" : undefined}>
      {children}
    </Tag>
  );
}
