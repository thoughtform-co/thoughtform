"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Checks } from "./Checks";
import { usePasteImage } from "./DropZone";
import { EvalsView } from "./EvalsView";
import { Input } from "./Input";
import { Output } from "./Output";
import { Segmented } from "./Segmented";
import { SkillView } from "./SkillView";
import {
  blocksOf,
  caseTarget,
  img,
  joinPath,
  perFrameCount,
  phaseWord,
  type Mode,
  type View,
} from "./derive";
import type { BenchConfig, Pending, Regression } from "./types";
import { useJob } from "./useJob";

/**
 * The Trinny London brand bench as ONE module (ADR-120 Update 1): a switch
 * between generating a product image and uploading one, three views of the
 * same skill (Run · Skill · Evals), and the dark rail of checks beside
 * them, whichever view is open. Moira's workshop bench, made live.
 *
 * ⚠ ONE JOB AT A TIME, AND IT BELONGS TO A MODE. The result on screen is
 * the job whose origin matches the switch; a staged upload that has not
 * been run hides any result (an old verdict never sits beside a new,
 * unchecked picture), and so does changing the product or type after a
 * run, as changing Moira's input clears its run.
 *
 * ⚠ NO STATE IS SET IN AN EFFECT'S BODY (the lint ratchet has no headroom):
 * effects subscribe, fetch and tick; every state change happens in a
 * handler or an async callback.
 */
export function TrinnyBench({ offline, jobId }: { offline: boolean; jobId: string | null }) {
  const [cfg, setCfg] = useState<BenchConfig | null>(null);
  const [cfgError, setCfgError] = useState<string | null>(null);
  const [evals, setEvals] = useState<Regression | null>(null);
  const [mode, setMode] = useState<Mode>("generate");
  const [view, setView] = useState<View>("run");
  const [seenEvals, setSeenEvals] = useState(false);
  const [subject, setSubject] = useState("nakedambition");
  const [type, setType] = useState("H");
  const [pending, setPending] = useState<Pending | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [stale, setStale] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const urlRef = useRef<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const touchedRef = useRef(false);
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

  /* `?job=<id>` opens a job from today's session without re-running it. */
  useEffect(() => {
    if (!jobId) return;
    let live = true;
    void load(jobId).then((j) => {
      if (!live) return;
      if (!j) {
        setNotice(`No job ${jobId} in today's session.`);
        return;
      }
      setMode(j.origin === "upload" ? "upload" : "generate");
      if (j.subject) setSubject(j.subject);
      if (j.type) setType(j.type);
    });
    return () => {
      live = false;
    };
  }, [jobId, load]);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [busy]);

  const checks = useMemo(() => cfg?.checks ?? [], [cfg]);
  const blocks = useMemo(() => blocksOf(checks), [checks]);
  const runsExpected = cfg?.runs ?? 3;
  const perFrame = perFrameCount(cfg);

  /* ── staging an upload ──────────────────────────────────────────── */

  const stage = useCallback((file: File, fromCase: boolean) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    fileRef.current = file;
    setPending({
      file,
      url,
      name: file.name,
      suggested: null,
      dE: null,
      fromCase,
      submitted: false,
    });
    setOpen(null);
    setNotice(null);
  }, []);

  const onFile = useCallback(
    async (file: File) => {
      stage(file, false);
      touchedRef.current = false;
      setMode("upload");
      setView("run");
      const form = new FormData();
      form.append("file", file);
      try {
        const r = await fetch("/api/trinny-bench/suggest", { method: "POST", body: form });
        if (!r.ok) return;
        const s = (await r.json()) as { subject: string | null; delta_e00?: number };
        if (fileRef.current !== file || !s.subject) return;
        const nearest = s.subject;
        if (!touchedRef.current) setSubject(nearest);
        setPending((p) =>
          p && p.file === file ? { ...p, suggested: nearest, dE: s.delta_e00 ?? null } : p
        );
      } catch {
        /* the picker still works without a suggestion */
      }
    },
    [stage]
  );

  usePasteImage(onFile, mode === "upload" && !busy);

  const onCase = useCallback(
    async (file: string, derivedFrom: string | null) => {
      const folder = evals?.regression?.folder;
      const target = caseTarget(file, derivedFrom);
      if (!folder || !target) return;
      try {
        const r = await fetch(img(joinPath(folder, file)), { cache: "no-store" });
        if (!r.ok) throw new Error(`the case would not load (${r.status})`);
        const blob = await r.blob();
        stage(new File([blob], file, { type: blob.type || "image/png" }), true);
        touchedRef.current = true;
        setSubject(target.subject);
        setType(target.type);
        setMode("upload");
        setView("run");
      } catch (e) {
        setNotice(e instanceof Error ? e.message : String(e));
      }
    },
    [evals, stage]
  );

  /* ── running ────────────────────────────────────────────────────── */

  const clock = () => {
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
    setOpen(null);
    setStale(null);
    setNotice(null);
  };

  const generate = () => {
    clock();
    setPending((p) => (p ? { ...p, submitted: false } : p));
    void start(() =>
      fetch("/api/trinny-bench/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, type, offline }),
      })
    );
  };

  const runUpload = () => {
    if (!pending) return;
    const form = new FormData();
    form.append("file", pending.file, pending.name);
    form.append("subject", subject);
    form.append("type", type);
    if (offline) form.append("offline", "1");
    clock();
    setPending({ ...pending, submitted: true });
    void start(() => fetch("/api/trinny-bench/upload", { method: "POST", body: form }));
  };

  const onSubject = (k: string) => {
    touchedRef.current = true;
    if (job && !busy) setStale(job.id);
    setSubject(k);
  };
  const onType = (k: string) => {
    if (job && !busy) setStale(job.id);
    setType(k);
  };
  const onMode = (m: Mode) => {
    setMode(m);
    setView("run");
    setOpen(null);
  };
  const onView = (v: View) => {
    if (v === "evals") setSeenEvals(true);
    setView(v);
  };

  /* ── what is on screen ──────────────────────────────────────────── */

  const staged = mode === "upload" && !!pending && !pending.submitted;
  const matches = !!job && (job.origin ?? "generate") === mode;
  const visible = !staged && matches && job?.id !== stale ? job : null;
  const running = busy && (!job || matches);

  let src: string | null = null;
  if (mode === "upload" && pending) src = pending.url;
  else if (visible?.file) src = img(visible.file);

  const identity =
    visible?.identity ?? cfg?.subjects.find((s) => s.key === subject)?.identity_path ?? null;
  const elapsed = busy && startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;
  const live = busy || visible ? phaseWord(visible, running, runsExpected) : "";

  return (
    <>
      <div className="tb-bar">
        <Segmented
          kind="radio"
          label="Generate or upload"
          options={[
            { value: "generate", label: "Generate" },
            { value: "upload", label: "Upload" },
          ]}
          value={mode}
          onChange={onMode}
        />
        <Segmented
          kind="tabs"
          label="View"
          idBase="tb-view"
          options={[
            { value: "run", label: "Run" },
            { value: "skill", label: "Skill" },
            { value: "evals", label: "Evals" },
          ]}
          value={view}
          onChange={onView}
        />
      </div>

      <div className="tb-mod">
        <div className="tb-main">
          <section
            id="tb-view-run"
            role="tabpanel"
            aria-labelledby="tb-view-tab-run"
            className="tb-panel tb-run"
            hidden={view !== "run"}
          >
            <Input
              cfg={cfg}
              cfgError={cfgError}
              mode={mode}
              subject={subject}
              type={type}
              identity={identity}
              onSubject={onSubject}
              onType={onType}
              pending={mode === "upload" ? pending : null}
              onFile={onFile}
              busy={busy}
              elapsed={elapsed}
              onGo={mode === "generate" ? generate : runUpload}
              error={error ?? notice}
            />
            <Output
              job={visible}
              src={src}
              cfg={cfg}
              type={type}
              subject={subject}
              busy={running}
              mode={mode}
              onFile={onFile}
              blocks={blocks}
              runsExpected={runsExpected}
            />
          </section>

          <section
            id="tb-view-skill"
            role="tabpanel"
            aria-labelledby="tb-view-tab-skill"
            className="tb-panel"
            hidden={view !== "skill"}
          >
            {view === "skill" && <SkillView cfg={cfg} evals={evals} />}
          </section>

          <section
            id="tb-view-evals"
            role="tabpanel"
            aria-labelledby="tb-view-tab-evals"
            className="tb-panel"
            hidden={view !== "evals"}
          >
            {seenEvals && <EvalsView cfg={cfg} evals={evals} busy={busy} onCase={onCase} />}
          </section>
        </div>

        <Checks
          blocks={blocks}
          checks={checks}
          job={visible}
          open={open}
          onToggle={(l) => setOpen((o) => (o === l ? null : l))}
          runsExpected={runsExpected}
          perFrame={perFrame}
        />
      </div>

      <p className="tb-caption">
        Rubric {cfg?.rubric_version ?? "…"} · {perFrame || "…"} checks per frame · {runsExpected}{" "}
        runs, majority per check · {cfg?.gating ? "gating" : "reporting only"}
      </p>
      {offline ? (
        <p className="tb-caption" data-rehearsal="1">
          Rehearsal: a fake grader and no stranger; the colour is measured for real. Generate still
          draws with the real model.
        </p>
      ) : visible?.offline ? (
        <p className="tb-caption" data-rehearsal="1">
          This job was a rehearsal: its grades are a fake grader&rsquo;s; its colour was measured
          for real.
        </p>
      ) : null}
      <p className="tb-sr" role="status" aria-live="polite">
        {live}
      </p>
    </>
  );
}
