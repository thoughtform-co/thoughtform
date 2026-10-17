import type { CSSProperties } from "react";

import type { Figure } from "../types";

/** Chrome, never content: the two verdicts' words. */
export const KEPT = "Kept";
export const SENT_BACK = "Sent back";

/**
 * Check: what was kept beside what was sent back, as two different kinds of
 * object (the kept take a full plate; the sent-back one a small struck
 * reference with its reason), never the same picture greyed out. Who checks
 * what follows as a ledger; a passed check is ink, never green.
 */
export function Pairs({ figure }: { figure: Extract<Figure, { kind: "pairs" }> }) {
  return (
    <div className="csd-pairs">
      <div className="csd-pairs__sets">
        {figure.pairs.map((p) => (
          <div key={p.label} className="csd-pair">
            <p className="csd-pair__k">{p.label}</p>
            <div className="csd-pair__kept">
              <div
                className="csd-pair__pic"
                style={{ "--r": p.kept.still.ratio.replace("/", " / ") } as CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- lab: published stills, fixed box */}
                <img
                  src={p.kept.still.src}
                  alt={p.kept.still.alt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p className="csd-pair__v">
                <b>{KEPT}</b>
                {p.kept.note}
              </p>
            </div>
            <div className="csd-pair__sent">
              <div
                className="csd-pair__pic csd-pair__pic--struck"
                style={{ "--r": p.sent.still.ratio.replace("/", " / ") } as CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- lab: published stills, fixed box */}
                <img
                  src={p.sent.still.src}
                  alt={p.sent.still.alt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p className="csd-pair__v">
                <b>{SENT_BACK}</b>
                {p.sent.why}
              </p>
            </div>
          </div>
        ))}
      </div>
      {figure.reviewers?.length ? (
        <ol className="csd-pairs__who">
          {figure.reviewers.map((r) => (
            <li key={r.who} data-ok={r.ok ? "" : undefined}>
              <span className="csd-pairs__mark" aria-label={r.ok ? "holds" : "set aside"}>
                {r.ok ? "✓" : "✕"}
              </span>
              <b>{r.who}</b>
              <span>{r.does}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
