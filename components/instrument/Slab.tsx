/**
 * Slab — one isometric plate: a top face and its two side faces, on a 120×56
 * box (ADR-153, shared by ADR-154 U4).
 *
 * The leverage draws three of them as the stack a company shares and the
 * layer it writes; the instrument's organisation altitude draws the same
 * plates under its workstreams. One drawing, so the page shows one object.
 *
 * ⚠ THE HATCH PATTERN'S ID IS PER INSTANCE (`${id}-hatch`): the leverage and
 * the instrument both draw an owned slab on one page, and two patterns under
 * one id would paint each other's.
 *
 * ⚠ IT LETTERS NOTHING; the words are DOM beside it. Every class is the
 * caller's, so each sheet styles its own plates.
 */
export interface SlabProps {
  tier: "own" | "host" | "shared";
  /** The instance id; the hatch pattern is `${id}-hatch`. */
  id: string;
  className: string;
  faceClass: string;
  sideClass: string;
  hatchClass: string;
}

export function Slab({ tier, id, className, faceClass, sideClass, hatchClass }: SlabProps) {
  const hatch = `${id}-hatch`;
  return (
    <svg
      className={className}
      data-tier={tier}
      viewBox="0 0 120 56"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {tier === "own" ? (
        <defs>
          <pattern
            id={hatch}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" className={hatchClass} />
          </pattern>
        </defs>
      ) : null}
      <path className={sideClass} d="M4 22 L60 44 L60 52 L4 30 Z" />
      <path className={sideClass} d="M116 22 L60 44 L60 52 L116 30 Z" />
      <path className={faceClass} d="M4 22 L60 2 L116 22 L60 44 Z" />
      {tier === "own" ? <path d="M4 22 L60 2 L116 22 L60 44 Z" fill={`url(#${hatch})`} /> : null}
    </svg>
  );
}
