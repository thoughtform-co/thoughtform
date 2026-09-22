"use client";

import type { Measurement, Swatch } from "./types";

const STATE_WORD: Record<string, string> = {
  within: "within the band",
  off: "outside the band",
  other_sku: "another product's band",
  not_applied: "not compared",
};

function Chip({ s, label }: { s: Swatch | Partial<Swatch> | null | undefined; label: string }) {
  if (!s || typeof s.hex !== "string") {
    return (
      <div className="tb-swatch tb-swatch--empty">
        <span className="tb-swatch__fill" />
        <span className="tb-swatch__label">{label}</span>
        <span className="tb-swatch__nums">—</span>
      </div>
    );
  }
  return (
    <div className="tb-swatch">
      <span className="tb-swatch__fill" style={{ background: s.hex }} />
      <span className="tb-swatch__label">{label}</span>
      <span className="tb-swatch__nums">
        L* {Math.round(s.L ?? 0)} · C* {Math.round(s.C ?? 0)} · h {Math.round(s.h ?? 0)}°
      </span>
    </div>
  );
}

/**
 * Reference beside candidate, the numbers under each, the distance between.
 * Everything shown here is exactly what the grader was handed in words.
 */
export function Swatches({ m }: { m: Measurement | null }) {
  if (!m) {
    return (
      <div className="tb-colour tb-colour--waiting">
        <div className="tb-colour__head">Colour, measured in code</div>
        <div className="tb-colour__pairs">
          <Chip s={null} label="the band" />
          <span className="tb-colour__delta">
            <span className="tb-colour__deltanum">—</span>
          </span>
          <Chip s={null} label="this frame" />
        </div>
      </div>
    );
  }
  const cmp = m.compare;
  const word = STATE_WORD[cmp.state] ?? cmp.state;
  if (m.mode === "set" && cmp.matches) {
    return (
      <div className="tb-colour" data-state={cmp.state}>
        <div className="tb-colour__head">
          Colour, measured in code <span className="tb-colour__word">{word}</span>
        </div>
        {cmp.matches.map((x) => (
          <div className="tb-colour__pairs" key={x.name}>
            <Chip s={x.ref} label={x.name} />
            <span className="tb-colour__delta" data-within={x.within ? "1" : "0"}>
              <span className="tb-colour__deltanum">ΔE {x.delta_e00.toFixed(1)}</span>
            </span>
            <Chip s={x.candidate} label="nearest in frame" />
          </div>
        ))}
        <p className="tb-colour__line">{cmp.line}</p>
      </div>
    );
  }
  const stats = m.stats && !m.stats.suspect ? m.stats : null;
  return (
    <div className="tb-colour" data-state={cmp.state}>
      <div className="tb-colour__head">
        Colour, measured in code <span className="tb-colour__word">{word}</span>
      </div>
      <div className="tb-colour__pairs">
        <Chip s={m.band} label="the band" />
        <span className="tb-colour__delta">
          <span className="tb-colour__deltanum">
            {cmp.delta_e00 == null ? "—" : `ΔE ${cmp.delta_e00.toFixed(1)}`}
          </span>
          {cmp.hue_distance != null && (
            <span className="tb-colour__deltasub">hue {cmp.hue_distance}°</span>
          )}
          {cmp.state === "other_sku" && cmp.nearest_subject && (
            <span className="tb-colour__deltasub">nearer to {cmp.nearest_subject}</span>
          )}
        </span>
        <Chip s={stats} label="this frame" />
      </div>
      <p className="tb-colour__line">{cmp.line}</p>
      {m.stats?.method && (
        <p className="tb-colour__method">
          {m.stats.method}
          {m.box ? "" : " · no product box"}
        </p>
      )}
    </div>
  );
}
