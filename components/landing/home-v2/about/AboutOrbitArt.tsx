/**
 * AboutOrbitArt — the About drawing behind the portrait, the homepage's own
 * (the orbit cluster of `AboutStage`): the four corner readouts, the rings,
 * ticks, spokes, slowly turning nodes, bearing labels and edge notes, and
 * the particle halo. One component with two readers: the homepage's About
 * stage and the proposals' About (`ArcPortrait`'s orbit layout), so the two
 * cannot drift (owner, 2026-10-11: "take the ones from the home page").
 *
 * Server-safe, no state. Styled by `landing.css`'s `.voidwalker__orbit*`
 * rules; the host is a square, relatively positioned box.
 */

/** The 12-dot particle halo — the fallback's authored `--a/--r/--o` set. */
const HALO: ReadonlyArray<{ a: number; r: number; o?: number; d?: boolean }> = [
  { a: 12, r: 46, o: 0.8 },
  { a: 38, r: 42, d: true },
  { a: 68, r: 48, o: 0.6 },
  { a: 96, r: 40, d: true },
  { a: 126, r: 45, o: 0.7 },
  { a: 158, r: 43, d: true },
  { a: 192, r: 47, o: 0.9 },
  { a: 224, r: 41, d: true },
  { a: 256, r: 46, o: 0.6 },
  { a: 288, r: 44, d: true },
  { a: 318, r: 48, o: 0.75 },
  { a: 348, r: 42, d: true },
];

export function AboutOrbitArt() {
  return (
    <>
      <div className="voidwalker__orbit__label voidwalker__orbit__label--tl">
        <span className="k">SUBJECT</span>
        <br />
        VB · 0001
      </div>
      <div className="voidwalker__orbit__label voidwalker__orbit__label--tr">
        <span className="k">BEARING</span>
        <br />N · 000 · lock
      </div>
      <div className="voidwalker__orbit__label voidwalker__orbit__label--bl">
        <span className="k">FIELD</span>
        <br />
        VOIDWALKER
      </div>
      <div className="voidwalker__orbit__label voidwalker__orbit__label--br">
        <span className="k">MODE</span>
        <br />
        navigate
      </div>

      <svg
        className="voidwalker__orbit__svg"
        viewBox="-200 -200 400 400"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <g fill="none" strokeWidth="0.7">
          <circle r="192" stroke="var(--dawn-15)" strokeDasharray="1 7" />
          <circle r="172" stroke="var(--dawn-08)" />
          <circle r="150" stroke="var(--gold)" strokeOpacity="0.18" strokeDasharray="2 8" />
          <circle r="124" stroke="var(--gold)" strokeOpacity="0.3" />
          <circle r="104" stroke="var(--gold)" strokeOpacity="0.15" strokeDasharray="1 3" />
          <circle r="82" stroke="var(--dawn-30)" strokeDasharray="1 4" />
        </g>
        <g stroke="var(--dawn-50)" strokeWidth="0.8">
          <path d="M0 -192 L0 -178" />
          <path d="M0 192 L0 178" />
          <path d="M-192 0 L-178 0" />
          <path d="M192 0 L178 0" />
        </g>
        <g stroke="var(--dawn-30)" strokeWidth="0.5">
          {[
            15, 30, 45, 60, 75, 105, 120, 135, 150, 165, 195, 210, 225, 240, 255, 285, 300, 315,
            330, 345,
          ].map((deg) => (
            <path key={deg} d="M0 -192 L0 -184" transform={`rotate(${deg})`} />
          ))}
        </g>
        <g stroke="var(--gold)" strokeOpacity="0.22" strokeWidth="0.5">
          <path d="M0 -150 L0 -82" />
          <path d="M0 150 L0 82" />
          <path d="M-150 0 L-82 0" />
          <path d="M150 0 L82 0" />
        </g>
        <g style={{ transformOrigin: "0 0", animation: "rotate 50s linear infinite" }}>
          <circle cx="0" cy="-150" r="3.5" fill="var(--gold)" />
          <rect
            x="-3"
            y="147"
            width="6"
            height="6"
            fill="var(--gold)"
            transform="rotate(45 0 150)"
          />
        </g>
        <g style={{ transformOrigin: "0 0", animation: "rotateRev 90s linear infinite" }}>
          <circle cx="172" cy="0" r="1.8" fill="var(--dawn)" opacity="0.6" />
          <circle cx="-172" cy="0" r="1.4" fill="var(--dawn)" opacity="0.4" />
        </g>
        <g style={{ transformOrigin: "0 0", animation: "rotate 120s linear infinite" }}>
          <circle cx="124" cy="0" r="1.6" fill="var(--gold)" opacity="0.7" />
        </g>
        <g
          fontFamily="var(--font-pt-mono)"
          fontSize="8"
          fill="var(--dawn-50)"
          textAnchor="middle"
          letterSpacing="1.5"
        >
          <text x="0" y="-198">
            N · 000
          </text>
          <text x="198" y="3" textAnchor="start">
            090
          </text>
          <text x="0" y="205">
            180
          </text>
          <text x="-198" y="3" textAnchor="end">
            270
          </text>
        </g>
        <g fontFamily="var(--font-pt-mono)" fontSize="6" fill="var(--dawn-30)" letterSpacing="1.2">
          <text x="-188" y="-156">
            FIG · 04a
          </text>
          <text x="120" y="-172">
            VB · FIELD MAP
          </text>
          <text x="-188" y="178">
            CH · 01 / VOIDWALKER
          </text>
          <text x="120" y="188" textAnchor="start">
            ∂ · 0.001
          </text>
        </g>
      </svg>

      <div className="voidwalker__orbit__particles">
        {HALO.map((p, i) => (
          <span
            key={i}
            className={p.d ? "d" : undefined}
            style={
              {
                "--a": `${p.a}deg`,
                "--r": `${p.r}%`,
                ...(p.o !== undefined ? { "--o": p.o } : null),
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}
