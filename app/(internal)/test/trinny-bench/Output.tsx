"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

import { useDropTarget } from "./DropZone";
import {
  SUBJECT_NAMES,
  STATE_WORD,
  arOf,
  blockState,
  boxStyle,
  highlightTone,
  labelBelow,
  phaseSteps,
  phaseWord,
  type Block,
  type Mode,
  type Tone,
} from "./derive";
import type { BenchConfig, Job, Measurement, Swatch } from "./types";

/**
 * OUTPUT — the picture under review, and what the code measured on it.
 *
 * ⚠ THE HIGHLIGHT CANNOT DRIFT. The slot takes the type's ratio while
 * empty; a loaded picture takes its own (an upload need not match its type),
 * read off the image and trusted only for the src it was read from. The
 * product box the colour layer found (`measurement.box`, normalised
 * x0 y0 x1 y1) is drawn in percent inside a wrapper with exactly that
 * ratio, so a resize moves it with the picture. No box, no outline: offline
 * rehearsals and texture frames read the whole frame, and the note says so.
 */
export function Output({
  job,
  src,
  cfg,
  type,
  subject,
  busy,
  mode,
  onFile,
  blocks,
  runsExpected,
}: {
  job: Job | null;
  src: string | null;
  cfg: BenchConfig | null;
  type: string;
  subject: string;
  busy: boolean;
  mode: Mode;
  onFile: (file: File) => void;
  blocks: Block[];
  runsExpected: number;
}) {
  const [nat, setNat] = useState<{ src: string; ar: number } | null>(null);
  const ar = nat && nat.src === src ? nat.ar : null;
  const typeAr = arOf(cfg?.types.find((t) => t.key === type)?.ar);
  const dropping = mode === "upload" && !busy;
  const { active, bind } = useDropTarget(onFile, !dropping);

  const m = job?.measurement ?? null;
  const box = boxStyle(m?.box);
  const inner = boxStyle(m?.stats?.sampled_box);
  const tone = highlightTone(blocks, job);
  const colourBlock = blocks.find((b) => b.checks.some((c) => c.computed)) ?? null;
  const fTone: Tone = colourBlock ? blockState(colourBlock, job) : "pending";
  const steps = phaseSteps(job, busy, runsExpected, mode);
  const who = SUBJECT_NAMES[job?.subject ?? subject] ?? job?.subject ?? subject;
  const de = m?.compare?.delta_e00;
  const label = `${who}${typeof de === "number" ? ` · ΔE ${de.toFixed(1)}` : ""}`;

  let note = "";
  if (src && m && !m.box)
    note = job?.offline
      ? "No product box in a rehearsal: the colour was read over the whole frame."
      : "No product box on this frame: the colour was read over the whole frame.";

  const band = cfg?.subjects.find((s) => s.key === (job?.subject ?? subject)) ?? null;

  return (
    <div className="tb-out">
      <div className="tb-cellhead">
        <span className="tb-label">Output</span>
        <span className="tb-out__phase">{phaseWord(job, busy, runsExpected)}</span>
      </div>

      <ol className="tb-steps" aria-label="The run">
        {steps.map((s) => (
          <li key={s.key} data-state={s.state}>
            <span>{s.label}</span>
            {s.seconds != null && <span className="tb-steps__s">{s.seconds.toFixed(1)} s</span>}
          </li>
        ))}
      </ol>

      <div className="tb-stage">
        <div
          className="tb-slot"
          style={{ "--ar": ar ?? typeAr } as CSSProperties}
          data-empty={src ? undefined : "1"}
          data-drop={dropping ? "1" : undefined}
          data-active={active ? "1" : undefined}
          {...bind}
        >
          {src ? (
            <div className="tb-fit" style={{ "--nat": ar ?? typeAr } as CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Drive files through a guarded route, or the person's own file in memory */}
              <img
                key={src}
                src={src}
                alt="The picture under review"
                onLoad={(e) => {
                  const i = e.currentTarget;
                  if (i.naturalWidth && i.naturalHeight)
                    setNat({ src, ar: i.naturalWidth / i.naturalHeight });
                }}
              />
              {ar && box && m && (
                <div className="tb-hl" data-tone={tone} aria-hidden="true">
                  {inner && <span className="tb-hl__inner" style={inner} />}
                  <span className="tb-hl__box" style={box}>
                    <span className="tb-hl__label" data-below={labelBelow(m.box) ? "1" : undefined}>
                      {label}
                    </span>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="tb-slot__empty">
              {busy && <span className="tb-track" aria-hidden="true" />}
              <span>
                {busy
                  ? "Drawing"
                  : mode === "upload"
                    ? "Drop an image here"
                    : "The draw lands here"}
              </span>
            </div>
          )}
        </div>
      </div>

      {note && <p className="tb-out__note">{note}</p>}

      <ColourRow m={m} band={band?.band ?? null} colours={band?.colours ?? []} tone={fTone} />
    </div>
  );
}

function Chip({ s, label }: { s: Partial<Swatch> | null | undefined; label: string }) {
  const ok = !!s && typeof s.hex === "string";
  return (
    <div className="tb-swatch" data-empty={ok ? undefined : "1"}>
      <i className="tb-swatch__fill" style={ok ? { background: s!.hex } : undefined} />
      <span className="tb-swatch__label">{label}</span>
      <span className="tb-swatch__nums">
        {ok
          ? `L* ${Math.round(s!.L ?? 0)} · C* ${Math.round(s!.C ?? 0)} · h ${Math.round(s!.h ?? 0)}°`
          : "–"}
      </span>
    </div>
  );
}

/** The band beside this frame, ΔE2000 between; a set shows each colour's
 *  pair. Before anything is measured, the band alone says what to expect. */
function ColourRow({
  m,
  band,
  colours,
  tone,
}: {
  m: Measurement | null;
  band: Swatch | null;
  colours: Swatch[];
  tone: Tone;
}) {
  const matches = m?.compare?.matches ?? [];
  const de = m?.compare?.delta_e00;
  const word = m ? (STATE_WORD[m.state] ?? m.state) : "not measured yet";
  if (matches.length > 0 || (!m && colours.length > 1)) {
    return (
      <div className="tb-colour tb-colour--set" data-tone={m ? tone : "pending"}>
        <div className="tb-pairs">
          {matches.length > 0
            ? matches.map((x, i) => (
                <span
                  className="tb-pair"
                  key={i}
                  title={`${x.name} · ΔE ${x.delta_e00.toFixed(1)}`}
                >
                  <i style={{ background: x.ref.hex }} />
                  <i style={{ background: x.candidate.hex }} />
                  <span>{x.delta_e00.toFixed(0)}</span>
                </span>
              ))
            : colours.map((c, i) => (
                <span className="tb-pair" key={i} title={c.name ?? ""}>
                  <i style={{ background: c.hex }} />
                </span>
              ))}
        </div>
        <div className="tb-colour__de">
          <span className="tb-colour__num">
            {typeof de === "number" ? `ΔE ${de.toFixed(1)}` : "ΔE –"}
          </span>
          <span className="tb-colour__word">{m ? `largest · ${word}` : word}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="tb-colour" data-tone={m ? tone : "pending"}>
      <Chip s={m?.band ?? band} label="Its band" />
      <div className="tb-colour__de">
        <span className="tb-colour__num">
          {typeof de === "number" ? `ΔE ${de.toFixed(1)}` : "ΔE –"}
        </span>
        <span className="tb-colour__word">{word}</span>
      </div>
      <Chip s={m?.stats} label="This frame" />
    </div>
  );
}
