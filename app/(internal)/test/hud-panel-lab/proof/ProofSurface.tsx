"use client";

import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";

import { ClientTabs } from "@/components/landing/home-v2/services/casefile/ClientTabs";
import { Directory } from "@/components/landing/home-v2/services/casefile/Directory";
import { ServicesCasefile } from "@/components/landing/home-v2/services/casefile/ServicesCasefile";
import { TrackPanel } from "@/components/landing/home-v2/services/casefile/TrackPanel";
import { TrackProofRegister } from "@/components/landing/home-v2/services/casefile/TrackProofRegister";
import { PROOF_CASE } from "@/lib/cases/registry";
import type { CaseSegment } from "@/lib/cases/types";

import {
  Bracket,
  CellHead,
  CornerLabels,
  DatumStubs,
  FootRow,
  HeaderBar,
  Housing,
  Seam,
} from "../chrome/HplChrome";
import type { HplChrome, HplDirectionId } from "../variants";

/**
 * The PROOF surface — the casefile at the top of `#services`.
 *
 * ⚠ THE STAGE ATTRIBUTES ARE THE WHOLE MOUNTING RECIPE, and they are
 * any-ancestor gates rather than decoration:
 *
 *   `.services-stage`      the CLASS three blur rules key on
 *   `[data-proof-live]`    flips `.fl-case` from `visibility: hidden`
 *   `[data-proof-settled]` the console's `opacity: 0 -> 1`, the map's SVG,
 *                          the backdrop blur, and PdaConsole's own
 *                          `closest("[data-proof-settled]")` wheel guard
 *   `--svc-content-in: 1`  the stage-owned end state
 *
 * Without the pair the panel is a correctly-laid-out box painting nothing,
 * which looks exactly like a broken direction.
 *
 * ⚠ `.hpl-stationbox` REPRODUCES `.stations`' CONTENT BOX. `.fl-case` insets
 * itself by `--instrument-inset` ALONE on the documented assumption that its
 * stage is already inside `padding: 0 var(--hud-content-inset)`; without the
 * box every zone lands one full inset too far outboard and the whole
 * comparison is against a composition production never draws.
 *
 * ⚠ THE DIRECTIONS KEEP `.fl-case` AS THEIR ROOT. Every token the leaves read
 * — the rail-box mirror, `--fl-t6`/`--fl-t11`, the modular type scale, the
 * reticle gradients, `--fl-copy` — is declared on that class, and so are the
 * arrival ladder, the client seam and the console's `--con-ground`. A new root
 * class would mean re-declaring ~30 tokens to change nothing. Directions
 * re-seat the composition by overriding those TOKENS under
 * `.fl-case[data-hpl-dir]`, and only restate a zone rule where they genuinely
 * move it.
 */

const FILE = PROOF_CASE.casefile;
const PANEL_ID = "hpl-casefile-panel";

/** `<em>` is upright gold on a wash — the site sets no italics, ever. */
function renderSegment(seg: CaseSegment, i: number) {
  if (typeof seg === "string") return <span key={i}>{seg}</span>;
  return <em key={i}>{seg.em}</em>;
}

export function ProofSurface({
  chrome,
  dir,
  row,
  onRow,
  proofIn,
}: {
  chrome: HplChrome;
  dir: HplDirectionId;
  row: string;
  onRow: (id: string) => void;
  proofIn: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const isControl = dir === "v0";
  /* The listing (v6) fixes two of the hand composition's recorded defects on
     its own branch only — the brief head's seat and the foot's copy — so the
     other directions' stills stay comparable to the ones already on disk. */
  const isListing = chrome.housingKind === "listing";

  const track = useMemo(() => FILE.tracks.find((t) => t.id === row) ?? FILE.tracks[0], [row]);
  const trackIdx = Math.max(
    0,
    FILE.tracks.findIndex((t) => t.id === track.id)
  );

  /* ── The arrival clock ────────────────────────────────────────────────
     Written on `.fl-case`'s OWN INLINE STYLE. The component's reveal reads
     `root.style.getPropertyValue(...)` inside a MutationObserver on that
     element's `style` attribute — inline, on that node, never the computed
     cascade — so writing on the stage would resolve the CSS correctly and
     drive nothing. `--svc-proof-out` stays 0: this lab judges the composition
     at rest and on arrival, never mid-fold. */
  useEffect(() => {
    const host = boxRef.current?.querySelector<HTMLElement>(".fl-case");
    if (!host) return;
    host.style.setProperty("--svc-proof-in", proofIn.toFixed(4));
    host.style.setProperty("--svc-proof-out", "0");
  }, [proofIn, dir]);

  /* ── `?row=` on the CONTROL ───────────────────────────────────────────
     v0 owns its own row state, so the deep link is applied by clicking the
     real row — the production selector — rather than by reaching into the
     component. `pinBrowse` no-ops without a `.services-stage-root`, so the
     click is a plain state change there. */
  useEffect(() => {
    if (!isControl) return;
    const box = boxRef.current;
    if (!box) return;
    /* ⚠ A TASK, NOT A FRAME — rAF stalls in a hidden document, and a deep
       link that only applies while someone is watching is one a capture
       cannot trust. */
    const t = window.setTimeout(() => {
      const rows = box.querySelectorAll<HTMLButtonElement>(".fl-row");
      const target = rows[trackIdx];
      if (target && !target.hasAttribute("data-on")) target.click();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isControl, trackIdx]);

  /* ── The control's row clicks flow back to the URL ────────────────────── */
  const onControlClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isControl) return;
      const el = (e.target as HTMLElement | null)?.closest(".fl-row");
      if (!el) return;
      const rows = Array.from(boxRef.current?.querySelectorAll(".fl-row") ?? []);
      const i = rows.indexOf(el);
      const next = FILE.tracks[i];
      if (next) onRow(next.id);
    },
    [isControl, onRow]
  );

  return (
    <div className="hpl-stationbox" ref={boxRef} onClick={onControlClick}>
      <div
        className="services-stage hpl-proof-stage"
        data-proof-live
        data-proof-settled
        style={{ "--svc-content-in": "1" } as CSSProperties}
      >
        {isControl ? (
          <ServicesCasefile />
        ) : (
          <section
            className="fl-case"
            data-hpl-dir={dir}
            aria-label={`Case file — ${PROOF_CASE.client}`}
          >
            {/* ── THE HOUSING AND ITS MARKS ──────────────────────────────
                Unmarked by `data-fl-client-panel` on purpose: this is the
                FRAME the record is swapped inside, and a frame that
                crossfades with its own contents is a page turn (ADR-087).
                It rides the arrival ladder as chrome — first on, last off —
                at the tab strip's own rung. */}
            {chrome.housing ? <Housing kind={chrome.housingKind} panel={{ ciOff: 0.07 }} /> : null}
            {chrome.stubs ? (
              <DatumStubs ticks={["t1", "t6", "t11"]} panel={{ ciOff: 0.14 }} />
            ) : null}
            {/* ⚠ ONLY THE REGISTER SEAM IS SEATED HERE NOW (ADR-088). It is on
                tick 6, which is a rung of the ladder and therefore expressible
                as a token against `.fl-case`. The DIRECTORY seam is not: since
                the record column became a grid whose surplus splits 1:2, the
                directory's top is wherever its own content lands above tick 11
                — no `calc()` on `.fl-case` can reach it. It is rendered inside
                `.fl-left` instead, as a grid item in the seam track it marks. */}
            {chrome.seams ? <Seam at="register" panel={{ ciOff: 0.14 }} /> : null}

            {chrome.header !== "none" ? (
              /* ⚠ ONE STRING, ON THE RIGHT, AND THE REST OF THE BAND IS A
                 DATUM. The left slot is empty because the production tab strip
                 already seats flush on the rail's top line, which IS this
                 band — and a centre slot printed straight through the client's
                 own name on the first still. What is left is the file's STATE,
                 which nothing else on the surface says: the path belongs to
                 the directory's head, the row's figure to the row, the reading
                 to the console's rail. A third string that repeats one of them
                 is what this surface has already removed a console head, a
                 foot and a designator for. */
              <HeaderBar
                kind={chrome.header === "fused" ? "fused" : chrome.header}
                right={FILE.state}
                panel={{ ciOff: 0.07, dy: "-26px" }}
              />
            ) : null}

            {/* `data-hpl-cursor` seats v6's block cursor after the active
                client's name — a `::after` on the production `.fl-tabs__name`,
                so the tab strip gains no DOM and the decode target is untouched. */}
            <div
              data-fl-panel
              data-hpl-cursor={chrome.cursor || undefined}
              style={{ "--ci-off": 0.07, "--fl-dy": "-26px" } as CSSProperties}
            >
              <ClientTabs
                tabs={[{ slug: PROOF_CASE.slug, ix: FILE.ix, tab: FILE.tab }]}
                activeSlug={PROOF_CASE.slug}
                onSelect={() => {}}
                controls={PANEL_ID}
              />
            </div>

            {/* The connection grammar. `.fl-split` keeps `transform: none`
                from production — a 1px hairline reads a lateral tear as a
                break rather than a glitch. */}
            <i
              className="fl-split"
              data-fl-panel
              /* v6 draws the column seam DOUBLE (║); the sheet paints it. */
              data-double={chrome.double || undefined}
              style={{ "--ci-off": 0.14 } as CSSProperties}
              aria-hidden="true"
            />
            <i
              className="fl-ret fl-ret--bl"
              data-fl-panel
              style={{ "--ci-off": 0.18, "--fl-dx": "-30px" } as CSSProperties}
              aria-hidden="true"
            />
            {/* ⚠ THE TOP-RIGHT RETICLE IS AN OWNER DELETION BEING RE-ASKED.
                It is fully styled in `casefile.css` and has not rendered since
                the 2026-08-07 declutter (commit e3b33867, which removed it
                with the route diagram and the three dotted rules). Completing
                the diagonal pair is v1's cheapest claim about registration, so
                the lab draws it and the README asks for the ruling. */}
            {chrome.ladder ? (
              <i
                className="fl-ret fl-ret--tr"
                data-fl-panel
                style={{ "--ci-off": 0.18, "--fl-dx": "30px" } as CSSProperties}
                aria-hidden="true"
              />
            ) : null}

            {/* ── The record column ───────────────────────────────────────
                ⚠ `.fl-left` IS PRODUCTION'S HOUSING (ADR-088) and this hand
                composition has to mount it too, or the three zones lose the
                grid that seats them and fall back to `.fl-case`'s own. It
                carries no panel mark for the same reason production's does
                not: a promoted wrapper becomes a containing block, and the
                housing does not crossfade with the record inside it. */}
            <div className="fl-left">
              {/* ⚠ ON THE LISTING THE BRIEF'S HEAD IS A SIBLING OF `.fl-brief`,
                  NEVER ITS CHILD — production's own seat (`.fl-cell--brief`,
                  ADR-089). The brief is height-boxed with `overflow: hidden`,
                  so the in-brief seat below is clipped away entirely and has
                  never painted on v2–v5 (the README records it); the column
                  clips nothing. And NO META: the state is the fused header's,
                  and printing it here says it twice. */}
              {chrome.cellHeads && isListing ? <CellHead zone="brief" label="Brief" /> : null}
              <div
                className="fl-brief"
                data-fl-panel
                data-fl-client-panel
                style={{ "--ci-off": 0.24, "--fl-dx": "-48px" } as CSSProperties}
              >
                {chrome.cellHeads && !isListing ? (
                  <CellHead zone="brief" label="Brief" meta={FILE.state} />
                ) : null}
                <h3 className="fl-brief__title">
                  <span>{track.project}</span>
                  <b className="fl-brief__dot">.</b>
                </h3>
                <p className="fl-brief__class">{track.classification ?? FILE.classLine}</p>
                <p className="fl-brief__body">{(track.brief ?? FILE.brief).map(renderSegment)}</p>
              </div>

              {chrome.cellHeads ? (
                /* ⚠ SEATED ONLY ON THE TALL RUNG, and the sheet decides. The
                   register has FOUR pixels of slack in its box at 1280x720 and
                   the directory four in its band, so a head row there would be
                   paid for out of the copy. Above 1070h the
                   `--fl-proof-top-gap` is already 14-18px of pure air. */
                <CellHead
                  zone="register"
                  label="Proof"
                  meta={`${track.blocks?.length ?? 4} claims`}
                  panel={{ ciOff: 0.3, dx: "-48px" }}
                />
              ) : null}
              <TrackProofRegister track={track} id="hpl-casefile-proof" />

              {/* The register/directory seam, seated IN the seam it marks —
                  grid row 4, centred. See the note beside the register seam
                  above for why this one cannot be a token on `.fl-case`. */}
              {chrome.seams ? <Seam at="directory" panel={{ ciOff: 0.14 }} /> : null}

              <Directory
                tracks={FILE.tracks}
                activeId={track.id}
                onSelect={onRow}
                controls={PANEL_ID}
                idPrefix={PROOF_CASE.slug}
              />
            </div>

            {/* ── The field ─────────────────────────────────────────────── */}
            <TrackPanel
              key={track.id}
              track={track}
              id={PANEL_ID}
              labelledBy={`${PROOF_CASE.slug}-row-${track.id}`}
            />
            {/* ⚠ THE FIELD'S MARKS DO GET A SEAT ELEMENT, and it is not the
                wrapper trap above: this one is absolutely positioned by the
                sheet with BOTH `top` and `height`, so it establishes its own
                box rather than inheriting a zero-height one. */}
            {chrome.bracket ? (
              <div
                className="hpl-field-marks"
                data-fl-panel
                style={{ "--ci-off": 0.44, "--fl-dx": "48px" } as CSSProperties}
              >
                <Bracket />
              </div>
            ) : null}
            {chrome.corners ? (
              <div
                className="hpl-field-marks"
                data-fl-panel
                data-kind={track.visual.kind}
                style={{ "--ci-off": 0.44, "--fl-dx": "48px" } as CSSProperties}
              >
                {/* ⚠ THE LOWER PAIR IS SUPPRESSED ON THE MAP ROW by the sheet,
                    not here: the provenance stamp already owns that drawing's
                    bottom-right and the sheets own their counts. Passing all
                    four and letting the seat decide keeps the decision in one
                    place instead of in every caller. */}
                <CornerLabels
                  tl={track.preview}
                  tr={track.meta}
                  bl={FILE.state}
                  br={track.file.replace(/\/$/, "")}
                />
              </div>
            ) : null}

            {chrome.foot !== "none" ? (
              /* Both strings are CLIENT-level and never change with a row,
                 which is what keeps this housing rather than record. */
              <FootRow
                kind={chrome.foot === "bar" ? "bar" : "row"}
                /* The listing's terminus is the file's part number: `logCode`
                   letters nowhere else on the surface (production's own foot,
                   ADR-089). The class line and the count are both already on
                   screen — the README's said-twice defect — and the other
                   directions keep them so their stills stay comparable. */
                left={isListing ? FILE.logCode : FILE.classLine}
                right={isListing ? undefined : `${FILE.tracks.length} items`}
                panel={{ ciOff: 0.07, dy: "26px" }}
              />
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}
