import type { JSX, ReactNode } from "react";

/**
 * The lattice's ONE chamfered housing (ADR-149 §2). A server component that
 * emits the classes and the knob attributes and paints nothing: the classes
 * are the contract and `lattice.css` is the recipe. Every knob is a `data-*`
 * so a still is traceable; a prop left undefined emits NO attribute, because
 * the absence IS the house default (the TR + BL pair, plate-fluid depth, the
 * lip, the plate ground). There is no `tl-br` (ADR-089 retired it).
 */
export type FrameCut = "tr-bl" | "tr" | "bl" | "none";
export type FrameCh = "plate" | "seed" | "card" | "plate-fluid" | "chrome";
export type FrameLine = "seam" | "lip" | "lip-lit" | "rule";
export type FrameGround = "plate" | "thin" | "none";

export type FrameProps = {
  as?: keyof JSX.IntrinsicElements;
  cut?: FrameCut;
  ch?: FrameCh;
  line?: FrameLine;
  ground?: FrameGround;
  /** A box with something hanging outside it: the ring sits proud, the ground moves to `::after`. */
  overflow?: "visible";
  head?: ReactNode;
  /** The gold wash band with its 2px rule stopping at the cut (`.arc-plate__head`'s grammar). */
  headWash?: boolean;
  foot?: ReactNode;
  className?: string;
  id?: string;
  children?: ReactNode;
};

export function Frame({
  as = "div",
  cut,
  ch,
  line,
  ground,
  overflow,
  head,
  headWash = false,
  foot,
  className,
  id,
  children,
}: FrameProps) {
  // Typed as "div" so the attributes stay the HTML set; the tag itself is `as`.
  const Tag = as as "div";
  return (
    <Tag
      id={id}
      className={`lat-frame${className ? ` ${className}` : ""}`}
      data-cut={cut}
      data-ch={ch}
      data-line={line}
      data-ground={ground}
      data-overflow={overflow}
    >
      {head !== undefined && head !== null ? (
        <div className="lat-frame__head" data-head={headWash ? "wash" : undefined}>
          {head}
        </div>
      ) : null}
      <div className="lat-frame__body">{children}</div>
      {foot !== undefined && foot !== null ? <div className="lat-frame__foot">{foot}</div> : null}
    </Tag>
  );
}
