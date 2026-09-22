"use client";

import {
  SUBJECT_NAMES,
  boldLead,
  caseTarget,
  img,
  joinPath,
  negativeResult,
  positiveResult,
  strictness,
} from "./derive";
import type { BenchConfig, Regression } from "./types";

/**
 * EVALS — Moira's two halves. On the left, how strictly each check holds:
 * the rubric's severity column read as degrees of freedom (fixed = the
 * gates, checked word for word; adapted = everything judged; free = what
 * the brief leaves open, which nobody checks on one frame). On the right,
 * the cases on file: the regression's derived negatives and positive
 * controls, each with the checks it must trip and what it got.
 *
 * "Check this one" loads a case into Upload with the subject its name
 * says, never the one its colour suggests: the plum swap is Naked Ambition.
 */
export function EvalsView({
  cfg,
  evals,
  busy,
  onCase,
}: {
  cfg: BenchConfig | null;
  evals: Regression | null;
  busy: boolean;
  onCase: (file: string, derivedFrom: string | null) => void;
}) {
  const { fixed, adapted } = strictness(cfg?.checks ?? []);
  const r = evals?.regression ?? null;
  const folder = r?.folder ?? null;

  return (
    <div className="tb-evals">
      <div className="tb-strict">
        <span className="tb-label">How strictly each check holds</span>

        <section className="tb-band" data-band="fixed">
          <div className="tb-band__head">
            <span className="tb-band__label">Fixed</span>
            <span className="tb-band__line">
              Checked word for word:
              <span className="tb-chip tb-chip--light tb-chip--mini" data-tone="pass">
                Pass
              </span>
              or
              <span className="tb-chip tb-chip--light tb-chip--mini" data-tone="fail">
                Fail
              </span>
            </span>
          </div>
          <ul className="tb-rules">
            {fixed.map((c) => (
              <li className="tb-rule" key={c.id}>
                <span className="tb-rule__line">{boldLead(c.check)}</span>
                <span className="tb-idchip">{c.id}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="tb-band" data-band="adapted">
          <div className="tb-band__head">
            <span className="tb-band__label">Adapted</span>
            <span className="tb-band__line">
              Checked with judgment:
              <span className="tb-chip tb-chip--light tb-chip--mini" data-tone="pass">
                Pass
              </span>
              or
              <span className="tb-chip tb-chip--light tb-chip--mini" data-tone="review">
                Review
              </span>
            </span>
          </div>
          <ul className="tb-rules">
            {adapted.map((b) => {
              const advisory = b.checks.every((c) => c.severity === "advisory");
              const measured = b.checks.every((c) => c.computed);
              const line = b.checks.length === 1 ? boldLead(b.checks[0].check) : b.name;
              return (
                <li className="tb-rule" key={b.letter}>
                  <span className="tb-rule__line">
                    {line}
                    {measured
                      ? ": advisory until thirty verdicted draws"
                      : advisory
                        ? ", advisory"
                        : ""}
                  </span>
                  <span className="tb-idchips">
                    {b.checks.map((c) => (
                      <span className="tb-idchip" key={c.id}>
                        {c.id}
                      </span>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="tb-band" data-band="free">
          <div className="tb-band__head">
            <span className="tb-band__label">Free</span>
            <span className="tb-band__line">Not checked. Left to the draw.</span>
          </div>
          <ul className="tb-rules">
            <li className="tb-rule">
              <span className="tb-rule__line">
                What the brief leaves open: the props, the stroke of formula, the exact composition.
                Across a set, E1 to E4 keep frames apart.
              </span>
            </li>
          </ul>
        </section>
      </div>

      <div className="tb-cases">
        <span className="tb-label">Cases on file</span>
        {r ? (
          <>
            <p className="tb-cases__sum">
              {`${r.summary.negatives} negatives, one change each: ${r.summary.held} held. ${r.summary.positives} positive controls: ${r.summary.positives_clean} clean. Rubric ${r.rubric_version}, graded ${r.runs} times each${r.offline ? ", in rehearsal" : ""}.`}
            </p>
            <div className="tb-casegrid">
              {r.negatives.map((n) => {
                const res = negativeResult(n, r.runs);
                const t = caseTarget(n.file, n.derived_from);
                return (
                  <article className="tb-case" key={n.file} data-tone={res.held ? "pass" : "fail"}>
                    <div className="tb-case__thumb">
                      {folder && (
                        /* eslint-disable-next-line @next/next/no-img-element -- the regression's own negatives, through the guarded route */
                        <img
                          src={img(joinPath(folder, n.file))}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>
                    <div className="tb-case__body">
                      <span className="tb-case__name">
                        {t ? (SUBJECT_NAMES[t.subject] ?? t.subject) : n.file}
                      </span>
                      <span className="tb-case__recipe">{n.recipe}</span>
                      <span className="tb-case__must">
                        Must fail
                        {n.must_fail.map((id) => (
                          <span className="tb-idchip" key={id}>
                            {id}
                          </span>
                        ))}
                      </span>
                      <span className="tb-case__foot">
                        <span
                          className="tb-chip tb-chip--light"
                          data-tone={res.held ? "pass" : "fail"}
                        >
                          {res.word}
                        </span>
                        <button
                          type="button"
                          className="tb-link"
                          disabled={busy || !t || !folder}
                          onClick={() => onCase(n.file, n.derived_from)}
                        >
                          Check this one <span aria-hidden="true">→</span>
                        </button>
                      </span>
                    </div>
                  </article>
                );
              })}
              {r.positives.map((p) => {
                const res = positiveResult(p, r.runs);
                const t = caseTarget(p.file, null);
                return (
                  <article
                    className="tb-case"
                    key={p.file}
                    data-tone={res.clean ? "pass" : "review"}
                  >
                    <div className="tb-case__thumb">
                      {folder && (
                        /* eslint-disable-next-line @next/next/no-img-element -- the regression's own controls, through the guarded route */
                        <img
                          src={img(joinPath(folder, p.file))}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>
                    <div className="tb-case__body">
                      <span className="tb-case__name">
                        {t ? (SUBJECT_NAMES[t.subject] ?? t.subject) : p.file}
                      </span>
                      <span className="tb-case__recipe">
                        A clean draw, unchanged: a positive control.
                      </span>
                      <span className="tb-case__must">Must pass</span>
                      <span className="tb-case__foot">
                        <span
                          className="tb-chip tb-chip--light"
                          data-tone={res.clean ? "pass" : "review"}
                        >
                          {res.word}
                        </span>
                        <button
                          type="button"
                          className="tb-link"
                          disabled={busy || !t || !folder}
                          onClick={() => onCase(p.file, null)}
                        >
                          Check this one <span aria-hidden="true">→</span>
                        </button>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <p className="tb-cases__sum">
            No regression on file for this rubric yet: <code>python bench/negatives.py</code>, then{" "}
            <code>python bench/regression.py --runs 3</code> in the ship.
          </p>
        )}
      </div>
    </div>
  );
}
