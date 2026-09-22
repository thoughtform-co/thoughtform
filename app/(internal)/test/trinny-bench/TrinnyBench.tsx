"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DropZone } from "./DropZone";
import { History } from "./History";
import { Rail } from "./Rail";
import { Swatches } from "./Swatches";
import type { BenchConfig, HistoryRow, Job, Regression, Subject } from "./types";
import { VERDICT_WORDS } from "./types";
import { useJob } from "./useJob";

const img = (p: string) => `/api/trinny-bench/img?p=${encodeURIComponent(p)}`;

const SUBJECT_NAMES: Record<string, string> = {
  nakedambition: "Naked Ambition",
  overnight: "Overnight Sensation",
  beyourbest: "Be Your Best",
  discovery: "Skincare Discovery Set",
};

function statusWords(job: Job | null, cfg: BenchConfig | null): string {
  if (!job) return "ready";
  switch (job.status) {
    case "queued":
      return "queued";
    case "drawing":
      return job.origin === "upload"
        ? "placing the file in the session"
        : `drawing on ${cfg?.lanes[job.lane ?? ""] ?? job.lane ?? "the default lane"}`;
    case "measuring":
      return "measuring colour in code";
    case "grading":
      return `grading against rubric ${cfg?.rubric_version ?? ""} · run ${job.runs.length}/${cfg?.runs ?? 3}`;
    case "done":
      return job.final?.verdict ? (VERDICT_WORDS[job.final.verdict] ?? job.final.verdict) : "done";
    case "error":
      return "error";
    default:
      return job.status;
  }
}

function Verdict({ job, cfg }: { job: Job; cfg: BenchConfig | null }) {
  const f = job.final;
  if (job.status === "error") {
    return (
      <div className="tb-verdict" data-verdict="ERROR">
        <div className="tb-verdict__word">Error</div>
        <p className="tb-verdict__note">{job.error}</p>
      </div>
    );
  }
  if (!f || job.status !== "done") return null;
  const unstable = new Set((f.run_verdicts ?? []).filter(Boolean)).size > 1;
  const captions = new Map(
    (cfg?.checks ?? []).map((c) => [c.id, c.caption || c.check.replace(/\*\*/g, "")])
  );
  const fails = [...(f.failed ?? [])];
  const advisory = f.failed_advisory ?? [];
  return (
    <div className="tb-verdict" data-verdict={f.verdict}>
      <div className="tb-verdict__row">
        <div className="tb-verdict__word">{VERDICT_WORDS[f.verdict] ?? f.verdict}</div>
        <div className="tb-verdict__runs">
          {(f.run_verdicts ?? []).map((v, i) => (
            <span key={i} data-verdict={v}>
              {VERDICT_WORDS[v] ?? v}
            </span>
          ))}
          {unstable && <em className="tb-verdict__unstable">unstable across runs</em>}
        </div>
      </div>
      {fails.length > 0 && (
        <ul className="tb-verdict__fails">
          {fails.map((x) => (
            <li key={x.id} data-severity={x.severity}>
              <span className="tb-verdict__id">{x.id}</span> {captions.get(x.id) ?? x.check}
            </li>
          ))}
        </ul>
      )}
      {advisory.length > 0 && (
        <p className="tb-verdict__advisory">
          reported, not counted:{" "}
          {advisory.map((x) => `${x.id} ${captions.get(x.id) ?? ""}`.trim()).join(" · ")}
        </p>
      )}
      {(f.reads_as_stranger || job.stranger?.reads_as) && (
        <p className="tb-verdict__stranger">
          a stranger saw <em>{f.reads_as_stranger || job.stranger?.reads_as}</em>
          {job.stranger?.part_counts ? ` · ${job.stranger.part_counts}` : ""}
        </p>
      )}
      {f.worst_issue && <p className="tb-verdict__worst">worst: {f.worst_issue}</p>}
      {f.notes && <p className="tb-verdict__note">{f.notes}</p>}
      <p className="tb-verdict__foot">
        {job.offline ? "rehearsal: fake grader, real colour · " : ""}
        graded {f.runs ?? 3}× · majority per check · reporting only · the person is the gate
      </p>
    </div>
  );
}

export function TrinnyBench({ offline }: { offline: boolean }) {
  const [cfg, setCfg] = useState<BenchConfig | null>(null);
  const [cfgError, setCfgError] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>("nakedambition");
  const [type, setType] = useState<string>("H");
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [evals, setEvals] = useState<Regression | null>(null);
  const [pending, setPending] = useState<{
    file: File;
    url: string;
    suggested: string | null;
    dE: number | null;
  } | null>(null);
  const { job, error, busy, start, load } = useJob();

  useEffect(() => {
    fetch("/api/trinny-bench/config", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? `config ${r.status}`);
        return r.json() as Promise<BenchConfig>;
      })
      .then(setCfg)
      .catch((e) => setCfgError(e instanceof Error ? e.message : String(e)));
    fetch("/api/trinny-bench/evals", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Regression>) : null))
      .then((v) => v && setEvals(v))
      .catch(() => undefined);
  }, []);

  const refreshHistory = useCallback(() => {
    fetch(`/api/trinny-bench/history${offline ? "?offline=1" : ""}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<HistoryRow[]>) : []))
      .then(setHistory)
      .catch(() => undefined);
  }, [offline]);
  useEffect(refreshHistory, [refreshHistory]);
  useEffect(() => {
    if (job?.status === "done" || job?.status === "error") refreshHistory();
  }, [job?.status, refreshHistory]);

  const subjects: Subject[] = useMemo(() => cfg?.subjects ?? [], [cfg]);
  const current = useMemo(
    () => subjects.find((s) => s.key === subject) ?? null,
    [subjects, subject]
  );

  const generate = () =>
    start(() =>
      fetch("/api/trinny-bench/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, type, offline }),
      })
    );

  const onFile = async (file: File) => {
    if (pending) URL.revokeObjectURL(pending.url);
    const url = URL.createObjectURL(file);
    setPending({ file, url, suggested: null, dE: null });
    const form = new FormData();
    form.append("file", file);
    try {
      const r = await fetch("/api/trinny-bench/suggest", { method: "POST", body: form });
      if (r.ok) {
        const s = (await r.json()) as { subject: string | null; delta_e00?: number };
        if (s.subject) {
          setSubject(s.subject);
          setPending((p) =>
            p && p.file === file ? { ...p, suggested: s.subject, dE: s.delta_e00 ?? null } : p
          );
        }
      }
    } catch {
      /* the picker still works without a suggestion */
    }
  };

  const check = () => {
    if (!pending) return;
    const form = new FormData();
    form.append("file", pending.file);
    form.append("subject", subject);
    form.append("type", type);
    if (offline) form.append("offline", "1");
    const p = pending;
    setPending(null);
    URL.revokeObjectURL(p.url);
    start(() => fetch("/api/trinny-bench/upload", { method: "POST", body: form }));
  };

  const stageFile = job?.file ?? null;
  const stageIdentity = job?.identity ?? current?.identity_path ?? null;
  const perFrame = (cfg?.checks ?? []).filter((c) => !c.set_level).length;

  return (
    <>
      {/* ── 01 Run ─────────────────────────────────────────────────────── */}
      <section
        id="run"
        className="sh-sec sh-sec--split tb-sec"
        data-sh-arrangement="bench-run"
        aria-label="Run"
      >
        <div className="sh-band">
          <header className="tb-masthead">
            <div className="tb-masthead__mark">
              {/* eslint-disable-next-line @next/next/no-img-element -- the client's own mark, their grey */}
              <img
                src="/trinny-london/trinny-london-mark.svg"
                alt="Trinny London"
                width={64}
                height={64}
              />
            </div>
            <div className="tb-masthead__copy">
              <div className="tb-masthead__kicker">Trinny London · brand bench</div>
              <h1 className="tb-masthead__title">
                Generate a product image, or drop one in. The rubric checks it.
              </h1>
              <p className="tb-masthead__lede">
                Three grades, the majority per check. Colour is measured in code against the
                product&rsquo;s own tile. Nothing here decides: a person is the gate.
              </p>
            </div>
            <dl className="sh-readout tb-masthead__readout">
              <div className="sh-readout__row">
                <dt className="sh-readout__k">rubric</dt>
                <dd className="sh-readout__v">
                  {cfg ? `${cfg.rubric_version} · ${perFrame} checks per frame` : "…"}
                </dd>
              </div>
              <div className="sh-readout__row">
                <dt className="sh-readout__k">status</dt>
                <dd className="sh-readout__v">
                  {cfg ? (cfg.gating ? "gating" : "reporting only") : "…"}
                </dd>
              </div>
              <div className="sh-readout__row">
                <dt className="sh-readout__k">grades</dt>
                <dd className="sh-readout__v">{cfg ? `${cfg.runs} runs · majority` : "…"}</dd>
              </div>
              {offline && (
                <div className="sh-readout__row">
                  <dt className="sh-readout__k">mode</dt>
                  <dd className="sh-readout__v">rehearsal · fake grader</dd>
                </div>
              )}
            </dl>
          </header>

          {cfgError && (
            <p className="tb-error">
              The bench could not reach its runner: {cfgError}. Is <code>python</code> on PATH and
              the Trinny London ship beside this repo?
            </p>
          )}

          <div className="tb-run">
            {/* controls */}
            <div className="tb-controls">
              <div className="tb-controls__label">Subject</div>
              <div className="tb-subjects" role="radiogroup" aria-label="subject">
                {subjects.map((s) => (
                  <button
                    type="button"
                    key={s.key}
                    role="radio"
                    aria-checked={s.key === subject}
                    className="tb-subject"
                    data-on={s.key === subject ? "1" : undefined}
                    onClick={() => setSubject(s.key)}
                    disabled={busy}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- identity tiles from Drive */}
                    <img src={img(s.identity_path)} alt="" width={66} height={87} />
                    <span className="tb-subject__name">{SUBJECT_NAMES[s.key] ?? s.key}</span>
                    <span className="tb-subject__band">
                      {s.mode === "set"
                        ? s.colours.map((c) => <i key={c.hex} style={{ background: c.hex }} />)
                        : s.band && <i style={{ background: s.band.hex }} />}
                    </span>
                  </button>
                ))}
              </div>

              <div className="tb-controls__label">Image type</div>
              <div className="tb-types" role="radiogroup" aria-label="image type">
                {(cfg?.types ?? []).map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    role="radio"
                    aria-checked={t.key === type}
                    className="tb-type"
                    data-on={t.key === type ? "1" : undefined}
                    onClick={() => setType(t.key)}
                    disabled={busy}
                    title={t.question}
                  >
                    <span className="tb-type__key">{t.key}</span>
                    <span className="tb-type__name">{t.name}</span>
                    <span className="tb-type__q">{t.question}</span>
                  </button>
                ))}
              </div>

              <button type="button" className="tb-cta" onClick={generate} disabled={busy || !cfg}>
                {busy
                  ? statusWords(job, cfg)
                  : `Generate a ${cfg?.types.find((t) => t.key === type)?.name.toLowerCase() ?? "frame"}`}
              </button>

              <DropZone onFile={onFile} disabled={busy} />

              {pending && (
                <div className="tb-pending">
                  {/* eslint-disable-next-line @next/next/no-img-element -- the person's own file, in memory */}
                  <img src={pending.url} alt="" />
                  <div className="tb-pending__copy">
                    <div className="tb-pending__lead">
                      {pending.suggested
                        ? `Looks like ${SUBJECT_NAMES[pending.suggested] ?? pending.suggested}`
                        : "Which product is this?"}
                      {pending.dE != null && (
                        <span className="tb-pending__de">
                          {" "}
                          · ΔE {pending.dE.toFixed(1)} to its band
                        </span>
                      )}
                    </div>
                    <div className="tb-pending__hint">
                      Confirm the subject and type above, then check it. A suggestion is never a
                      substitute for your pick.
                    </div>
                    <div className="tb-pending__actions">
                      <button
                        type="button"
                        className="tb-cta tb-cta--small"
                        onClick={check}
                        disabled={busy}
                      >
                        Check as {SUBJECT_NAMES[subject] ?? subject} · {type}
                      </button>
                      <button
                        type="button"
                        className="tb-ghost"
                        onClick={() => {
                          URL.revokeObjectURL(pending.url);
                          setPending(null);
                        }}
                      >
                        discard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="tb-error">{error}</p>}
            </div>

            {/* the stage */}
            <div className="tb-stage">
              <div className="tb-stage__status" data-status={job?.status ?? "idle"}>
                <span className="tb-stage__dot" />
                {statusWords(job, cfg)}
                {job?.seconds && job.status === "done" && (
                  <span className="tb-stage__time">
                    {Object.entries(job.seconds)
                      .map(([k, v]) => `${k} ${v}s`)
                      .join(" · ")}
                  </span>
                )}
              </div>

              <div className="tb-frames">
                <figure className="tb-frame tb-frame--candidate">
                  {stageFile ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- Drive files through a guarded route */
                    <img src={img(stageFile)} alt="the candidate" />
                  ) : (
                    <div className="tb-frame__empty">{busy ? "…" : "the candidate lands here"}</div>
                  )}
                  <figcaption>
                    {stageFile ? stageFile.split(/[\\/]/).pop() : "candidate"}
                    {job?.origin === "upload"
                      ? " · dropped"
                      : job?.origin === "generate"
                        ? " · drawn"
                        : ""}
                  </figcaption>
                </figure>
                <figure className="tb-frame tb-frame--identity">
                  {stageIdentity ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- the identity tile from Drive */
                    <img src={img(stageIdentity)} alt="the identity reference" />
                  ) : (
                    <div className="tb-frame__empty">identity reference</div>
                  )}
                  <figcaption>identity reference · the truth, never under review</figcaption>
                </figure>
              </div>

              <Swatches m={job?.measurement ?? null} />
              {job && <Verdict job={job} cfg={cfg} />}
            </div>

            {/* the rail */}
            <aside className="tb-railwrap" aria-label="the rail of checks">
              <div className="tb-railwrap__head">
                The rail · {perFrame} checks per frame
                <span>{job ? statusWords(job, cfg) : "waiting for a frame"}</span>
              </div>
              <Rail checks={cfg?.checks ?? []} job={job} />
            </aside>
          </div>

          <History rows={history} currentId={job?.id ?? null} onPick={(id) => void load(id)} />
        </div>
      </section>

      {/* ── 02 Skill ───────────────────────────────────────────────────── */}
      <section
        id="skill"
        className="sh-sec tb-sec"
        data-sh-arrangement="bench-skill"
        aria-label="Skill"
      >
        <div className="sh-band">
          <div className="sh-head">
            <span className="sh-head__ord">02</span>
            <span className="sh-head__kicker">Skill</span>
          </div>
          <div className="tb-skill">
            <div className="tb-skill__intro">
              <h2 className="tb-h2">The judgment is text.</h2>
              <p className="tb-p">
                Every check below is parsed from <code>skill/references/rubric.md</code> when a
                frame is graded; the harness keeps no copy. The bands beside them were read from the
                product tiles by code and live in
                <code>colour-bands.json</code>. Change the words and the next grade changes with
                them.
              </p>
              <dl className="sh-readout">
                <div className="sh-readout__row">
                  <dt className="sh-readout__k">version</dt>
                  <dd className="sh-readout__v">{cfg?.rubric_version ?? "…"}</dd>
                </div>
                <div className="sh-readout__row">
                  <dt className="sh-readout__k">bands</dt>
                  <dd className="sh-readout__v">{cfg?.bands.status ?? "…"}</dd>
                </div>
                <div className="sh-readout__row">
                  <dt className="sh-readout__k">source</dt>
                  <dd className="sh-readout__v">{cfg?.bands.source ?? "…"}</dd>
                </div>
                <div className="sh-readout__row">
                  <dt className="sh-readout__k">lines</dt>
                  <dd className="sh-readout__v">
                    {cfg?.bands.lines
                      ? `ΔE2000 ${cfg.bands.lines.delta_e2000} · set ${cfg.bands.lines.delta_e2000_set}`
                      : "…"}
                  </dd>
                </div>
              </dl>
              <div className="tb-bands">
                {subjects.map((s) => (
                  <div className="tb-band" key={s.key}>
                    <span className="tb-band__name">{SUBJECT_NAMES[s.key] ?? s.key}</span>
                    <span className="tb-band__chips">
                      {(s.mode === "set" ? s.colours : s.band ? [s.band] : []).map((c, i) => (
                        <span
                          className="tb-band__chip"
                          key={i}
                          title={`L* ${Math.round(c.L)} C* ${Math.round(c.C)} h ${Math.round(c.h)}°`}
                        >
                          <i style={{ background: c.hex }} />
                          <b>
                            {c.name ??
                              `L* ${Math.round(c.L)} · C* ${Math.round(c.C)} · h ${Math.round(c.h)}°`}
                          </b>
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="tb-rubric">
              {groupBlocks(cfg?.checks ?? []).map(([block, rows]) => (
                <div className="tb-rubric__block" key={block}>
                  <div className="tb-rubric__blockname">{block}</div>
                  {rows.map((c) => (
                    <div
                      className="tb-rubric__row"
                      key={c.id}
                      data-severity={c.severity}
                      data-set={c.set_level ? "1" : undefined}
                    >
                      <span className="tb-rubric__id">{c.id}</span>
                      <span
                        className="tb-rubric__check"
                        dangerouslySetInnerHTML={{ __html: lead(c.check) }}
                      />
                      <span className="tb-rubric__sev">
                        {c.set_level
                          ? "set level"
                          : c.computed
                            ? `${c.severity} · in code`
                            : c.severity}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 03 Evals ───────────────────────────────────────────────────── */}
      <section
        id="evals"
        className="sh-sec tb-sec"
        data-sh-arrangement="bench-evals"
        aria-label="Evals"
      >
        <div className="sh-band">
          <div className="sh-head">
            <span className="sh-head__ord">03</span>
            <span className="sh-head__kicker">Evals</span>
          </div>
          <div className="tb-evals">
            <div className="tb-evals__intro">
              <h2 className="tb-h2">Does the instrument catch what it is for?</h2>
              <p className="tb-p">
                Each negative is a clean frame from wave 01 with one thing changed in code: the body
                hue turned twenty degrees, the coral recoloured to the plum, a claim set on the
                ground. The rubric grades each three times. A check must fire on at least two of
                three, or the change to the rubric reverts. Rates, never single verdicts.
              </p>
            </div>
            {evals?.regression ? (
              <div className="tb-regress">
                <div className="tb-regress__meta">
                  rubric {evals.regression.rubric_version} · {evals.regression.runs} runs ·{" "}
                  {evals.regression.graded_at}
                  {evals.regression.offline ? " · rehearsal (fake grader, real colour)" : ""} ·{" "}
                  {evals.regression.summary.held}/{evals.regression.summary.negatives} negatives
                  held · {evals.regression.summary.positives_clean}/
                  {evals.regression.summary.positives} positives clean
                </div>
                <table className="tb-table">
                  <thead>
                    <tr>
                      <th>negative</th>
                      <th>one change</th>
                      <th>must fail</th>
                      <th>hits</th>
                      <th>colour</th>
                      <th>held</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evals.regression.negatives.map((n) => (
                      <tr key={n.file} data-held={n.held ? "1" : "0"}>
                        <td className="tb-table__mono">{n.file.replace(/\.png$/, "")}</td>
                        <td>{n.recipe}</td>
                        <td className="tb-table__mono">{n.must_fail.join(", ")}</td>
                        <td className="tb-table__mono">
                          {n.must_fail
                            .map((id) => `${id} ${n.hits[id] ?? 0}/${evals.regression!.runs}`)
                            .join(" · ")}
                          {n.must_report.length > 0 &&
                            ` · reported: ${n.must_report.map((id) => `${id} ${n.hits[id] ?? 0}/${evals.regression!.runs}`).join(" · ")}`}
                        </td>
                        <td className="tb-table__mono">
                          {n.state ?? "—"}
                          {n.delta_e00 != null ? ` · ΔE ${n.delta_e00.toFixed(1)}` : ""}
                        </td>
                        <td className="tb-table__mono">{n.held ? "held" : "missed"}</td>
                      </tr>
                    ))}
                    {evals.regression.positives.map((p) => (
                      <tr
                        key={p.file}
                        data-positive="1"
                        data-held={p.pass_fraction >= 0.67 ? "1" : "0"}
                      >
                        <td className="tb-table__mono">{p.file.replace(/\.png$/, "")}</td>
                        <td>positive control, byte-identical</td>
                        <td className="tb-table__mono">—</td>
                        <td className="tb-table__mono">
                          passes {Math.round(p.pass_fraction * 100)}%
                          {p.flipped.length ? ` · flipped: ${p.flipped.join(", ")}` : ""}
                        </td>
                        <td className="tb-table__mono">{p.state ?? "—"}</td>
                        <td className="tb-table__mono">
                          {p.pass_fraction >= 0.67 ? "clean" : "noisy"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="tb-p tb-p--dim">
                No regression has been run for this rubric yet.{" "}
                <code>python bench/negatives.py</code> then{" "}
                <code>python bench/regression.py --runs 3</code> in the ship.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function groupBlocks<T extends { block: string }>(checks: T[]): Array<[string, T[]]> {
  const out: Array<[string, T[]]> = [];
  for (const c of checks) {
    const last = out[out.length - 1];
    if (last && last[0] === c.block) last[1].push(c);
    else out.push([c.block, [c]]);
  }
  return out;
}

/** `**lead** rest` -> `<b>lead</b> rest`, nothing else. */
function lead(check: string): string {
  const safe = check.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return safe.replace(/\*\*(.+?)\*\*/, "<b>$1</b>");
}
