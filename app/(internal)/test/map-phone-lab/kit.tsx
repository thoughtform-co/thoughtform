"use client";

import type { MplStream } from "./models";

/**
 * The pieces the directions share. Each letters ONLY what `models.ts`'s
 * `lettering()` declares for it — the unit test walks that list, so a string
 * added here without it is a string no guard reads.
 */

/** The desktop cartridge's state grammar at phone size (`pdaGlyphs`'
 *  `StateMark`): a square holding a filled square is a configuration on
 *  record; a dashed, crossed square is deliberately person-led. Gold is
 *  wayfinding, so the configured mark is gold — never green, which is the
 *  human's alone. */
export function Mark({ led, size = 12 }: { led: boolean; size?: number }) {
  const s = size;
  return (
    <svg
      className="mpl-mark"
      data-led={led || undefined}
      width={s}
      height={s}
      viewBox="0 0 12 12"
      aria-hidden="true"
    >
      <rect
        className="mpl-mark__box"
        x="0.5"
        y="0.5"
        width="11"
        height="11"
        fill="none"
        strokeDasharray={led ? "2 1.5" : undefined}
      />
      {led ? (
        <path className="mpl-mark__x" d="M3 3 L9 9 M9 3 L3 9" fill="none" />
      ) : (
        <rect className="mpl-mark__in" x="3.5" y="3.5" width="5" height="5" />
      )}
    </svg>
  );
}

/** One lit segment travelling a hairline track — the rail's own spine
 *  grammar (ADR-063) as a position mark. No dots, no numbers. */
export function Position({ n, i }: { n: number; i: number }) {
  return (
    <div
      className="mpl-pos"
      aria-hidden="true"
      style={{ "--pos-n": n, "--pos-i": Math.max(0, Math.min(i, n - 1)) } as React.CSSProperties}
    >
      <i />
    </div>
  );
}

/** One stream as a SPINE — the R4 board read top to bottom: the owner (the
 *  only green thing — authority, not data), a drop to the card (the title
 *  and THE BAR, the one framed object), then its three answers. */
export function Spine({ s }: { s: MplStream }) {
  return (
    <div className="mpl-spine" data-led={s.configured ? undefined : ""}>
      <p className="mpl-spine__owner">
        <span className="mpl-k">Owner</span>
        <span className="mpl-spine__who">{s.owner}</span>
      </p>
      <div className="mpl-spine__card">
        <p className="mpl-spine__title">{s.title}</p>
        <p className="mpl-spine__bar">
          <span className="mpl-k">The bar</span>
          <span className="mpl-spine__barv">{s.bar}</span>
        </p>
      </div>
      <dl className="mpl-spine__answers">
        <div>
          <dt className="mpl-k">Runs</dt>
          <dd>
            <span>{s.runs}</span>
            {s.runsHow ? <span className="mpl-2nd">{s.runsHow}</span> : null}
          </dd>
        </div>
        <div>
          <dt className="mpl-k">Reaches</dt>
          <dd>
            <span>{s.reaches}</span>
            {s.reachesVia ? <span className="mpl-2nd">{s.reachesVia}</span> : null}
          </dd>
        </div>
        <div>
          <dt className="mpl-k">Runs in</dt>
          <dd>
            <span>{s.runsIn}</span>
            {s.runsInVia ? <span className="mpl-2nd">{s.runsInVia}</span> : null}
          </dd>
        </div>
      </dl>
    </div>
  );
}
