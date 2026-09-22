"use client";

import { DropZone } from "./DropZone";
import { Segmented } from "./Segmented";
import { CUTOUTS, SUBJECT_NAMES, img, type Mode } from "./derive";
import type { BenchConfig, Pending } from "./types";

/**
 * INPUT — the first cell. What the mode does, the product, the real
 * product it is checked against, the image type, the upload in Upload
 * mode, and the one primary button pinned to the foot.
 *
 * ⚠ THE REAL PRODUCT LIVES HERE, NOT IN OUTPUT. The identity reference is
 * an input: it goes into every draw and every grade. Beside the candidate
 * it still reads left to right, and OUTPUT keeps its whole width for the
 * picture under review.
 *
 * ⚠ THE BUTTON IS THE CLIENT'S. Trinny London's own yellow, exactly the
 * proposal's CTA (`trinny-london.css` `.tl-turn__cta`); everything else on
 * the module is ink.
 */
export function Input({
  cfg,
  cfgError,
  mode,
  subject,
  type,
  identity,
  onSubject,
  onType,
  pending,
  onFile,
  busy,
  elapsed,
  onGo,
  error,
}: {
  cfg: BenchConfig | null;
  cfgError: string | null;
  mode: Mode;
  subject: string;
  type: string;
  identity: string | null;
  onSubject: (key: string) => void;
  onType: (key: string) => void;
  pending: Pending | null;
  onFile: (file: File) => void;
  busy: boolean;
  elapsed: number;
  onGo: () => void;
  error: string | null;
}) {
  const keys = cfg?.subjects.map((s) => s.key) ?? Object.keys(SUBJECT_NAMES);
  const current = cfg?.subjects.find((s) => s.key === subject) ?? null;
  const swatches = current
    ? current.mode === "set"
      ? current.colours
      : current.band
        ? [current.band]
        : []
    : [];
  const types = cfg?.types ?? [];
  const t = types.find((x) => x.key === type);
  const name = SUBJECT_NAMES[subject] ?? subject;
  const ready = !!cfg && !busy && (mode === "generate" || !!pending);

  let go = mode === "generate" ? "Generate and check" : "Run the checks";
  if (busy) go = `Running · ${elapsed} s`;

  let suggest = "";
  if (pending?.fromCase)
    suggest = `A case from the regression, checked as ${name}${t ? ` · ${t.name}` : ""}.`;
  else if (pending?.suggested)
    suggest = `Measured nearest: ${SUBJECT_NAMES[pending.suggested] ?? pending.suggested}${
      pending.dE != null ? ` · ΔE ${pending.dE.toFixed(1)}` : ""
    }`;
  else if (pending) suggest = "Pick the product it should be, then run the checks.";

  return (
    <div className="tb-in">
      <div className="tb-in__body">
        <div className="tb-cellhead">
          <span className="tb-label">Input</span>
        </div>
        <p className="tb-in__task">
          {mode === "generate"
            ? "Draws the product on its own packshot, then checks the draw."
            : "Checks any image against the product it should be."}
        </p>

        {cfgError && (
          <p className="tb-error">
            {`The bench could not reach its runner: ${cfgError}. Is python on PATH and the Trinny London ship beside this repo?`}
          </p>
        )}

        <div className="tb-field">
          <span className="tb-label" id="tb-product-label">
            Product
          </span>
          <div className="tb-products" role="group" aria-labelledby="tb-product-label">
            {keys.map((k) => (
              <button
                type="button"
                key={k}
                className="tb-product"
                aria-pressed={k === subject}
                aria-label={SUBJECT_NAMES[k] ?? k}
                title={SUBJECT_NAMES[k] ?? k}
                onClick={() => onSubject(k)}
                disabled={busy}
              >
                {CUTOUTS[k] && (
                  /* eslint-disable-next-line @next/next/no-img-element -- the proposal's own cut-outs, served by the site */
                  <img src={CUTOUTS[k]} alt="" width={40} height={56} />
                )}
              </button>
            ))}
          </div>
          <div className="tb-product__name">
            <span>{name}</span>
            <span className="tb-product__band" aria-hidden="true">
              {swatches.map((c, i) => (
                <i key={i} style={{ background: c.hex }} />
              ))}
            </span>
          </div>
        </div>

        <figure className="tb-real">
          <span className="tb-label">The real product</span>
          <div className="tb-real__tile">
            {identity && (
              /* eslint-disable-next-line @next/next/no-img-element -- the identity tile, through the guarded route */
              <img key={identity} src={img(identity)} alt={`${name}, its own product tile`} />
            )}
          </div>
          <figcaption>Attached to every draw and every grade. Never under review.</figcaption>
        </figure>

        <div className="tb-field">
          <span className="tb-label">Image type</span>
          {types.length > 0 ? (
            <Segmented
              kind="radio"
              label="Image type"
              options={types.map((x) => ({ value: x.key, label: x.name, disabled: busy }))}
              value={type}
              onChange={onType}
              wide
            />
          ) : (
            <span className="tb-q">…</span>
          )}
          {t && (
            <span className="tb-q">
              {t.question} · {t.channel}
            </span>
          )}
        </div>

        {mode === "upload" && (
          <div className="tb-field">
            <span className="tb-label">Your image</span>
            <DropZone onFile={onFile} disabled={busy} staged={pending} />
            {suggest && <p className="tb-suggest">{suggest}</p>}
          </div>
        )}

        {error && <p className="tb-error">{error}</p>}
      </div>

      <div className="tb-in__foot">
        <button
          type="button"
          className="tb-go"
          onClick={onGo}
          disabled={!ready}
          data-running={busy ? "1" : undefined}
        >
          <span>{go}</span>
          <span aria-hidden="true">→</span>
          {busy && <span className="tb-go__track" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
