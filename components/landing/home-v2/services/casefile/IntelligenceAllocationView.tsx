import type { CaseIntelligence } from "@/lib/cases/types";

/**
 * IntelligenceAllocationView — the litmus (ADR-056 U16).
 *
 * This is the view that answers "what does the intelligence map actually
 * tell you?", and the answer is the INVERSION: the light tiers are on
 * nearly every seat and carry almost none of the consumption, while the
 * deep tiers are on far fewer seats and carry almost all of it. A reader
 * who only counts seats concludes the light tiers are the system. The draw
 * column is what corrects them, and the reads on the right say why that is
 * correct rather than wasteful.
 *
 * TWO BARS PER RUNG, not one. A single bar would make this a usage chart;
 * the pair is the argument, because the gap between them is the finding.
 * Bars are plain divs scaled by percentage width — no measurement, no
 * canvas, and no wall-clock motion (ADR-021).
 *
 * The tier names are GENERIC capability names by owner ruling: the landing
 * stays model-silent, which avoids restating the client deck's model
 * guidance and survives the next model release.
 */
export function IntelligenceAllocationView({ intelligence }: { intelligence: CaseIntelligence }) {
  const { tiers, reads, trend } = intelligence;

  return (
    <div className="fl-skills__alloc">
      <div className="fl-skills__ladder" role="group" aria-label="Reach against draw, by tier">
        {tiers.map((tier) => (
          <div className="fl-skills__rung" key={tier.name}>
            <span className="fl-skills__rung-head">
              <span className="fl-skills__rung-name">{tier.name}</span>
              {tier.note ? <span className="fl-skills__rung-note">{tier.note}</span> : null}
            </span>
            <span className="fl-skills__bars">
              {(
                [
                  ["reach", tier.reach],
                  ["draw", tier.draw],
                ] as const
              ).map(([kind, value]) => (
                <span className="fl-skills__bar-row" key={kind}>
                  <i
                    className="fl-skills__bar"
                    data-kind={kind}
                    style={{ ["--fl-bar" as string]: `${value}%` }}
                    aria-hidden="true"
                  />
                  <b className="fl-skills__bar-val">{value}%</b>
                </span>
              ))}
            </span>
          </div>
        ))}
        {trend ? (
          <p className="fl-skills__trend">
            <span className="fl-skills__trend-label">{trend.label}</span>
            {trend.points.map((p) => (
              <span className="fl-skills__trend-pt" key={p.stamp}>
                <i>{p.stamp}</i>
                {p.value}
              </span>
            ))}
          </p>
        ) : null}
      </div>

      {/* The WHY column. Without it this is a dashboard; with it, it is an
          argument that the deep draw is the work rather than waste. */}
      <div className="fl-skills__reads">
        {reads.map((read) => (
          <div className="fl-skills__read" key={read.team}>
            <span className="fl-skills__read-top">
              <span className="fl-skills__read-team">{read.team}</span>
              <span className="fl-skills__read-lens">{read.lens}</span>
            </span>
            <p className="fl-skills__read-why">{read.why}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
