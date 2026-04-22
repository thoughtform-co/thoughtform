import type { LinePattern } from "@/lib/celestial/schema";

interface LinesSvgProps {
  pattern: LinePattern;
  position: "top" | "bot";
}

/**
 * Transit lines rendered above/below the diagram.
 * Patterns are expressed in a 1200×120 viewBox, stretched to fill width.
 */
export function LinesSvg({ pattern, position }: LinesSvgProps) {
  if (pattern === "none") return null;

  const cls = `celestial-connector__lines celestial-connector__lines--${position}`;

  return (
    <svg className={cls} viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
      {renderPattern(pattern, position)}
    </svg>
  );
}

function renderPattern(pattern: LinePattern, position: "top" | "bot") {
  const isTop = position === "top";

  switch (pattern) {
    case "v-converge":
      return (
        <>
          <g stroke="var(--gold)" strokeOpacity="0.35" strokeWidth="0.8" fill="none">
            {isTop ? (
              <>
                <path d="M260 0 L600 120" />
                <path d="M600 0 L600 120" />
                <path d="M940 0 L600 120" />
              </>
            ) : (
              <>
                <path d="M600 0 L260 120" />
                <path d="M600 0 L600 120" />
                <path d="M600 0 L940 120" />
              </>
            )}
          </g>
          <g stroke="var(--dawn-15)" strokeWidth="0.4" fill="none" strokeDasharray="1 4">
            {isTop ? (
              <>
                <path d="M260 0 L260 60 L600 88" />
                <path d="M940 0 L940 60 L600 88" />
              </>
            ) : (
              <>
                <path d="M260 120 L260 60 L600 32" />
                <path d="M940 120 L940 60 L600 32" />
              </>
            )}
          </g>
          <circle cx={600} cy={isTop ? 120 : 0} r={3} fill="var(--gold)" />
        </>
      );

    case "v-diverge":
      return (
        <>
          <g stroke="var(--gold)" strokeOpacity="0.35" strokeWidth="0.8" fill="none">
            {isTop ? (
              <>
                <path d="M600 0 L260 120" />
                <path d="M600 0 L600 120" />
                <path d="M600 0 L940 120" />
              </>
            ) : (
              <>
                <path d="M260 0 L600 120" />
                <path d="M600 0 L600 120" />
                <path d="M940 0 L600 120" />
              </>
            )}
          </g>
          <g stroke="var(--dawn-15)" strokeWidth="0.4" fill="none" strokeDasharray="1 4">
            {isTop ? (
              <>
                <path d="M260 120 L260 60 L600 30" />
                <path d="M940 120 L940 60 L600 30" />
              </>
            ) : (
              <>
                <path d="M260 0 L260 60 L600 90" />
                <path d="M940 0 L940 60 L600 90" />
              </>
            )}
          </g>
          <circle cx={600} cy={isTop ? 0 : 120} r={3} fill="var(--gold)" />
        </>
      );

    case "parallel-3":
      return (
        <>
          <g stroke="var(--gold)" strokeOpacity="0.35" strokeWidth="0.8" fill="none">
            <path d="M320 0 L320 120" />
            <path d="M600 0 L600 120" />
            <path d="M880 0 L880 120" />
          </g>
          <g fill="var(--gold)">
            {isTop ? (
              <>
                <path d="M320 120 L316 112 L324 112 Z" />
                <path d="M600 120 L596 112 L604 112 Z" />
                <path d="M880 120 L876 112 L884 112 Z" />
              </>
            ) : (
              <>
                <path d="M320 0 L316 8 L324 8 Z" />
                <path d="M600 0 L596 8 L604 8 Z" />
                <path d="M880 0 L876 8 L884 8 Z" />
              </>
            )}
          </g>
        </>
      );

    case "single":
      return (
        <g stroke="var(--gold)" strokeOpacity="0.35" strokeWidth="0.8" fill="none">
          <path d="M600 0 L600 120" />
        </g>
      );

    default:
      return null;
  }
}
