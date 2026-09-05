"use client";

import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";

import { ClientTabs } from "@/components/landing/home-v2/services/casefile/ClientTabs";
import { Directory } from "@/components/landing/home-v2/services/casefile/Directory";
import { ServicesCasefile } from "@/components/landing/home-v2/services/casefile/ServicesCasefile";
import { TrackPanel } from "@/components/landing/home-v2/services/casefile/TrackPanel";
import { TrackProofRegister } from "@/components/landing/home-v2/services/casefile/TrackProofRegister";
import { PROOF_CASE } from "@/lib/cases/registry";
import type { CaseSegment } from "@/lib/cases/types";

import type { IkMount } from "../variants";

/**
 * The PROOF PANEL, recomposed — the casefile at the top of `#services`, drawn
 * from its own production leaves under the kit's knobs.
 *
 * ⚠ THE STAGE ATTRIBUTES ARE THE WHOLE MOUNTING RECIPE, and they are
 * any-ancestor gates rather than decoration:
 *
 *   `.services-stage`      the CLASS three blur rules key on
 *   `[data-proof-live]`    flips `.fl-case` from `visibility: hidden`
 *   `[data-proof-settled]` the console's `opacity: 0 → 1`, the map's SVG, the
 *                          backdrop blur, and `PdaConsole`'s own
 *                          `closest("[data-proof-settled]")` wheel guard
 *   `--svc-content-in: 1`  the stage-owned end state
 *
 * Without the pair the panel is a correctly-laid-out box painting nothing,
 * which looks exactly like a broken direction.
 *
 * ⚠ `.ik-stationbox` REPRODUCES `.stations`' CONTENT BOX. `.fl-case` insets
 * itself by `--instrument-inset` ALONE on the documented assumption that its
 * stage already sits inside `padding: 0 var(--hud-content-inset)`; without the
 * box every zone lands one full inset too far outboard and the comparison is
 * against a composition production never draws.
 *
 * ⚠ THE ROOT STAYS `.fl-case`. Every token the leaves read — the rail-box
 * mirror, `--fl-t6`/`--fl-t11`, the modular type scale, the reticle gradients,
 * `--fl-copy` — is declared on that class, and so are the arrival ladder, the
 * client seam and the console's own ground. A new root class would mean
 * re-declaring some thirty tokens to change nothing. The knobs re-seat the
 * composition by overriding those TOKENS from `interface-kit.css`, and restate
 * a zone rule only where production hardcodes a literal a token cannot reach.
 *
 * ⚠ AND THE ORDER BELOW IS PRODUCTION'S OWN (`ServicesCasefile.tsx`), not a
 * tidier one. The arrival ladder is positional in its `--ci-off` seats and the
 * zones are grid items of `.fl-left`; a re-ordered tree lays out correctly and
 * arrives wrong, which is the kind of difference a still cannot show.
 */

const FILE = PROOF_CASE.casefile;
const PANEL_ID = "ik-casefile-panel";

/** `<em>` is upright gold on a wash — the site sets no italics, ever. */
function renderSegment(seg: CaseSegment, i: number) {
  if (typeof seg === "string") return <span key={i}>{seg}</span>;
  return <em key={i}>{seg.em}</em>;
}

export function KitProofPanel({
  mount,
  row,
  onRow,
}: {
  mount: IkMount;
  row: string;
  onRow: (id: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const isControl = mount === "shipped";

  const track = useMemo(() => FILE.tracks.find((t) => t.id === row) ?? FILE.tracks[0], [row]);
  const trackIdx = Math.max(
    0,
    FILE.tracks.findIndex((t) => t.id === track.id)
  );

  /* ── The arrival clock ────────────────────────────────────────────────
     Written on `.fl-case`'s OWN INLINE STYLE. The reveal reads
     `root.style.getPropertyValue(...)` inside a MutationObserver on that
     element's `style` attribute — inline, on that node, never the computed
     cascade — so writing it on the stage would resolve the CSS correctly and
     drive nothing. `--svc-proof-out` stays 0: this lab judges the composition
     at rest, never mid-fold. */
  useEffect(() => {
    const host = boxRef.current?.querySelector<HTMLElement>(".fl-case");
    if (!host) return;
    host.style.setProperty("--svc-proof-in", "1");
    host.style.setProperty("--svc-proof-out", "0");
  }, [mount]);

  /* ── `?row=` on the CONTROL ───────────────────────────────────────────
     The shipped component owns its own row state, so the deep link is applied
     by clicking the real row — the production selector — rather than by
     reaching into the component. ⚠ A TASK, NOT A FRAME: rAF stalls in a hidden
     document, and a deep link that only applies while somebody is watching is
     one a capture cannot trust. */
  useEffect(() => {
    if (!isControl) return;
    const box = boxRef.current;
    if (!box) return;
    const t = window.setTimeout(() => {
      const rows = box.querySelectorAll<HTMLButtonElement>(".fl-row");
      const target = rows[trackIdx];
      if (target && !target.hasAttribute("data-on")) target.click();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isControl, trackIdx]);

  /** The control's own row clicks flow back to the URL. */
  const onControlClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isControl) return;
      const el = (e.target as HTMLElement | null)?.closest(".fl-row");
      if (!el) return;
      const rows = Array.from(boxRef.current?.querySelectorAll(".fl-row") ?? []);
      const next = FILE.tracks[rows.indexOf(el)];
      if (next) onRow(next.id);
    },
    [isControl, onRow]
  );

  return (
    <div className="ik-stationbox" ref={boxRef} onClick={onControlClick}>
      <div
        className="services-stage ik-proof-stage"
        data-proof-live
        data-proof-settled
        style={{ "--svc-content-in": "1" } as CSSProperties}
      >
        {isControl ? (
          <ServicesCasefile />
        ) : (
          <section
            className="fl-case"
            data-ik-panel=""
            aria-label={`Case file — ${PROOF_CASE.client}`}
          >
            {/* ── The housing ──────────────────────────────────────────
                ⚠ IT IS THE FRAME, SO IT CARRIES NO CLIENT MARK: a frame that
                crossfades with its own contents is a page turn (ADR-087). It
                rides the arrival ladder as chrome, at the tab strip's rung. */}
            <i
              className="fl-hz"
              data-fl-panel
              style={{ "--ci-off": 0.07 } as CSSProperties}
              aria-hidden="true"
            >
              <i className="fl-hz__bd" />
            </i>
            {/* The head is a RULE (ADR-089 U1): the band above the record is
                the client's name alone, and this is the line the name is
                underlined into. It letters nothing. */}
            <i
              className="fl-hz__head"
              data-fl-panel
              style={{ "--ci-off": 0.07, "--fl-dy": "-26px" } as CSSProperties}
              aria-hidden="true"
            />

            <div data-fl-panel style={{ "--ci-off": 0.07, "--fl-dy": "-26px" } as CSSProperties}>
              <ClientTabs
                tabs={[{ slug: PROOF_CASE.slug, ix: FILE.ix, tab: FILE.tab }]}
                activeSlug={PROOF_CASE.slug}
                onSelect={() => {}}
                controls={PANEL_ID}
              />
            </div>

            {/* The connection grammar. `.fl-split` keeps `transform: none`
                from production — at 1px a lateral tear reads as a break. */}
            <i
              className="fl-split"
              data-fl-panel
              style={{ "--ci-off": 0.14 } as CSSProperties}
              aria-hidden="true"
            />
            <i
              className="fl-seam fl-seam--register"
              data-fl-panel
              style={{ "--ci-off": 0.14 } as CSSProperties}
              aria-hidden="true"
            />
            <i
              className="fl-ret fl-ret--bl"
              data-fl-panel
              style={{ "--ci-off": 0.18, "--fl-dx": "-30px" } as CSSProperties}
              aria-hidden="true"
            />
            <i
              className="fl-ret fl-ret--tr"
              data-fl-panel
              style={{ "--ci-off": 0.18, "--fl-dx": "30px" } as CSSProperties}
              aria-hidden="true"
            />

            {/* ── The record column ───────────────────────────────────────
                ⚠ `.fl-left` IS HOUSING, NOT A PANEL (ADR-088). It carries
                neither mark: `[data-fl-panel]` takes `will-change: transform`
                under `data-proof-live`, and a promoted wrapper becomes the
                containing block for everything seated against `.fl-case`. */}
            <div className="fl-left">
              {/* ⚠ A SIBLING OF `.fl-brief`, NEVER ITS CHILD — that box is
                  height-boxed with `overflow: hidden`, so a head inside it is
                  clipped away entirely: present, measurable, painting
                  nothing. */}
              <p className="fl-cell fl-cell--brief" aria-hidden="true">
                <span className="fl-cell__l">Brief</span>
              </p>

              <div
                className="fl-brief"
                data-fl-panel
                data-fl-client-panel
                style={{ "--ci-off": 0.24, "--fl-dx": "-48px" } as CSSProperties}
              >
                <h3 className="fl-brief__title">
                  <span>{track.project}</span>
                  <b className="fl-brief__dot">.</b>
                </h3>
                <p className="fl-brief__class">{track.classification ?? FILE.classLine}</p>
                <p className="fl-brief__body">{(track.brief ?? FILE.brief).map(renderSegment)}</p>
              </div>

              {/* Seated only on the tall rung — the sheet decides. */}
              <p className="fl-cell fl-cell--register" aria-hidden="true">
                <span className="fl-cell__l">Proof</span>
                <span className="fl-cell__r">{`${track.blocks?.length ?? 4} claims`}</span>
              </p>

              <TrackProofRegister track={track} id="ik-casefile-proof" />

              {/* The register/directory seam, riding the second seam track. */}
              <i className="fl-seam fl-seam--directory" aria-hidden="true" />

              <Directory
                tracks={FILE.tracks}
                activeId={track.id}
                onSelect={onRow}
                controls={PANEL_ID}
                idPrefix={PROOF_CASE.slug}
              />
            </div>

            {/* ── The field ─────────────────────────────────────────────
                Keyed by track, exactly as production keys it: the plate's
                arrival replays and the controlled tool gallery resets to its
                first item whenever the row changes. */}
            <TrackPanel
              key={track.id}
              track={track}
              id={PANEL_ID}
              labelledBy={`${PROOF_CASE.slug}-row-${track.id}`}
            />
          </section>
        )}
      </div>
    </div>
  );
}
