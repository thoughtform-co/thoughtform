import type { CSSProperties, ReactNode } from "react";

/**
 * The lab's chrome kit — the vocabulary every direction draws from.
 *
 * ⚠ ENCLOSURES ARE DRAWN, NOT CONTAINERS. The housing, the brackets, the
 * seams and the corner labels are DECORATIVE siblings the sheet seats
 * absolutely; they never wrap content. Two reasons, both structural:
 *
 *   · on the proof surface every zone is absolutely positioned against the
 *     `--fl-t*` ladder, so a wrapper would have to re-establish six containing
 *     blocks to change nothing;
 *   · on the era stage `.vwd` -> `.vwd__sheet` -> `.vwd__stage` is one
 *     flex/grid chain with `min-height: 0` at every link, and a wrapper
 *     inserted into it is how a composition silently stops shrinking (the
 *     datum sheet's own warning). The figure column is the one place the lab
 *     DOES add DOM, and it does it through `HoloDatumPanels`' `figure` prop.
 *
 * ⚠ EVERY PIECE CARRIES ITS OWN LADDER SEAT, AND A WRAPPER WOULD BE A BUG.
 * `casefile.css` promotes `[data-fl-panel]` with `will-change: transform`
 * under `data-proof-live`, and a promoted element is a CONTAINING BLOCK for
 * absolutely positioned descendants — so chrome wrapped in a ladder div
 * resolves `bottom` against a zero-height box and lands 800px off screen.
 * Measured, on the first render. Each piece therefore takes `panel` and puts
 * `data-fl-panel` on ITSELF, exactly as `.fl-split` and `.fl-ret` do.
 *
 * ⚠ NO ORDINALS AND NO INVENTED BEARINGS. `console.css`'s ruling is surface-
 * wide — "the label is the FUNCTION alone" — and ADR-031's is that nothing is
 * added to the rail's ladder. So a header's right slot prints a row's own
 * `meta`, never `01 / 04`, and the datum stubs carry NO label: a 21px tick in
 * the rail's own major-tick vocabulary is the rule's terminus, which is a
 * different claim from a bearing number nobody can read off anything.
 *
 * ⚠ EVERY PIECE CARRIES `data-hpl-chrome` so the capture's line ledger and its
 * control sweep can tell lab chrome from production leaves without a class
 * allow-list that would rot on the first rename.
 */

/* ── The arrival ladder seat ─────────────────────────────────────────────
   `--ci-off` staggers a panel; `--fl-dx`/`--fl-dy` give it its own arrival
   dimension. Chrome takes the FIRST rungs, which by the LIFO mirror
   (`--co-off = 0.56 - --ci-off`) also makes it the LAST to leave: the
   instrument outlives its content exactly as it preceded it. */

export interface HplPanelSeat {
  ciOff: number;
  dx?: string;
  dy?: string;
}

function seat(panel?: HplPanelSeat) {
  if (!panel) return {};
  const style: CSSProperties = { "--ci-off": panel.ciOff } as CSSProperties;
  if (panel.dx) (style as Record<string, string>)["--fl-dx"] = panel.dx;
  if (panel.dy) (style as Record<string, string>)["--fl-dy"] = panel.dy;
  return { "data-fl-panel": "", style };
}

/* ── The header band ──────────────────────────────────────────────────────
   `row`   type only, on the ladder
   `bar`   a 2px datum in the rail's own material with the row beneath it
   `fused` the same row welded to a housing's top edge (v2 only — a bar
           welded to an edge needs an edge, and the registry guard pins it) */

export type HplHeaderKind = "row" | "bar" | "fused";

export function HeaderBar({
  kind,
  left,
  centre,
  right,
  panel,
}: {
  kind: HplHeaderKind;
  /** Empty on the proof surface: the production tab strip already occupies
   *  this slot, seated flush on the rail's top line. */
  left?: ReactNode;
  centre?: ReactNode;
  right?: ReactNode;
  panel?: HplPanelSeat;
}) {
  return (
    <header className="hpl-head" data-hpl-chrome="head" data-kind={kind} {...seat(panel)}>
      {kind === "bar" ? <i className="hpl-head__datum" aria-hidden="true" /> : null}
      <span className="hpl-head__l">{left}</span>
      <span className="hpl-head__c">{centre}</span>
      <span className="hpl-head__r">{right}</span>
    </header>
  );
}

/* ── A record cell's head row ──────────────────────────────────────────────
   label left · meta right · the cell's own rule under both. The one piece of
   chrome the era stage already has (`.vwd__head`), brought to the casefile's
   record column so both surfaces answer to one grammar. */

export function CellHead({
  label,
  meta,
  zone,
  panel,
}: {
  label: string;
  meta?: string;
  /** Which zone this head belongs to — the sheet seats it. */
  zone: "brief" | "register" | "directory" | "field";
  panel?: HplPanelSeat;
}) {
  return (
    <p className="hpl-cellhead" data-hpl-chrome="cellhead" data-zone={zone} {...seat(panel)}>
      <span className="hpl-cellhead__l">{label}</span>
      {meta ? <span className="hpl-cellhead__r">{meta}</span> : null}
    </p>
  );
}

/* ── Corner labels on a field ──────────────────────────────────────────────
   Chrome at the extremes, in the field's own margin (ui-composition rule 4).
   ⚠ NEVER ALL FOUR ON THE MAP ROW: the provenance stamp already owns the
   bottom-right of that drawing and the sheets own their counts, so the SEAT
   suppresses the lower pair there rather than the component omitting them — a
   component that decided per-plate would have to know the plate. */

export function CornerLabels({
  tl,
  tr,
  bl,
  br,
}: {
  tl?: string;
  tr?: string;
  bl?: string;
  br?: string;
}) {
  return (
    <div className="hpl-corners" data-hpl-chrome="corners" aria-hidden="true">
      {tl ? <span data-c="tl">{tl}</span> : null}
      {tr ? <span data-c="tr">{tr}</span> : null}
      {bl ? <span data-c="bl">{bl}</span> : null}
      {br ? <span data-c="br">{br}</span> : null}
    </div>
  );
}

/* ── The terminus ─────────────────────────────────────────────────────────
   ⚠ ON THE ERA STAGE THIS IS NEVER A RULE AT THE RAIL'S LAST TICK. Measured:
   that tick lands 16px INSIDE the chip frames at 1280x720, 6.5px inside at
   1440x900, and exactly on the band's twice-deleted `border-top` at the
   owner's 1920x1247. Era housings are open-bottomed and the chips are the
   terminus; the `?foot=rule` knob draws a band-INSET rule for the owner to
   rule on, and nothing else. */

export function FootRow({
  kind,
  left,
  right,
  panel,
}: {
  kind: "row" | "bar";
  left?: ReactNode;
  right?: ReactNode;
  panel?: HplPanelSeat;
}) {
  return (
    <footer className="hpl-foot" data-hpl-chrome="foot" data-kind={kind} {...seat(panel)}>
      <span className="hpl-foot__l">{left}</span>
      <span className="hpl-foot__r">{right}</span>
    </footer>
  );
}

/* ── A seam between two record cells ──────────────────────────────────────
   Its OWN element rather than a border on the cell, and that is arithmetic:
   the record cells are 34.5% wide with `overflow: hidden` while the seam has
   to reach the column split at 37.5%, so a pseudo-element of the cell is
   clipped 3% short of the line it is registering against. */

export function Seam({ at, panel }: { at: "register" | "directory"; panel?: HplPanelSeat }) {
  return (
    <i
      className="hpl-seam"
      data-hpl-chrome="seam"
      data-at={at}
      aria-hidden="true"
      {...seat(panel)}
    />
  );
}

/* ── Datum stubs ──────────────────────────────────────────────────────────
   The rail's major ticks continued inboard, at the rungs the composition's
   own seams land on. 21px and 2px, the major tick's exact dimensions, in the
   rail's own `--hud-rail-line`.

   ⚠ LEFT EDGE ONLY. The right-rail telemetry seats its three readouts at
   rungs 2/12, 6/12 and 11/12 and extends INBOARD past the band's right edge —
   measured 16px inside it at 1440x800 — so a stub there would land on SECTOR
   and LOCAL.
   ⚠ AND NO LABELS. A bearing label beside a stub adds a reading to a ladder
   whose own labels are "2" and "5" (ADR-031: nothing is added to the ladder),
   and it is the half of ADR-082 U9's empty-gutter ruling that would actually
   occupy the gutter. The tick is the rule's terminus; that is the whole
   claim. */

export type HplTick = "t1" | "t6" | "t11";

export function DatumStubs({ ticks, panel }: { ticks: readonly HplTick[]; panel?: HplPanelSeat }) {
  return (
    <>
      {ticks.map((t) => (
        <i
          key={t}
          className="hpl-stub"
          data-hpl-chrome="stub"
          data-tick={t}
          aria-hidden="true"
          {...seat(panel)}
        />
      ))}
    </>
  );
}

/* ── Brackets ─────────────────────────────────────────────────────────────
   Four additive Ls. The corner law's third grammar: "framed and observed, but
   not itself a device" — the portrait treatment, which is exactly what a
   hologram of a person in a bay is. ⚠ One grammar per object: a bracketed box
   is never also chamfered, so no direction gives the figure both. */

export function Bracket() {
  return (
    <div className="hpl-bracket" data-hpl-chrome="bracket" aria-hidden="true">
      <i data-c="tl" />
      <i data-c="tr" />
      <i data-c="bl" />
      <i data-c="br" />
    </div>
  );
}

/* ── The housing ──────────────────────────────────────────────────────────
   One machined slab on the lawful TR+BL diagonal, seated by the sheet against
   the band and the rail box. Drawn, never a container (see the file header).

   ⚠ ITS CHILDREN ARE SQUARE. The corner law's rule 4 is why the casefile
   console drops its own chamfer inside `v2` — two chamfers of the same depth
   adjacent to each other is what a surface looks like when it has been
   decorated rather than built. That retires ADR-065 U2's TL+BR exception for
   this direction only, and it is the first owner ruling the lab asks for. */

export function Housing({ open, panel }: { open?: boolean; panel?: HplPanelSeat }) {
  return (
    <i
      className="hpl-housing"
      data-hpl-chrome="housing"
      /* Open-bottomed on the era stage: the walls stop at the reel's top and
         the chip frames are the terminus. */
      data-open={open || undefined}
      aria-hidden="true"
      {...seat(panel)}
    />
  );
}
