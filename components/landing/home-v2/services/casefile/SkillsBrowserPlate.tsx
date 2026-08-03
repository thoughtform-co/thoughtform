"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type {
  CaseIntelligence,
  CaseRegistryGroup,
  CaseSkillEntry,
  CaseTeamDraw,
} from "@/lib/cases/types";

import { IntelligenceAllocationView } from "./IntelligenceAllocationView";
import { IntelligenceStackView } from "./IntelligenceStackView";
import { skillSymbol } from "./skillSymbol";

/**
 * SkillsBrowserPlate — the Intelligence Map plate as a LATTICE (ADR-056 U15;
 * owner: "maybe we don't need the right panel ... visualize them across
 * substrate / team like we had it in aether, and when you click on them a
 * panel appears above it that shows the content ... like the periodic table
 * of Mendeleev but not exactly").
 *
 * U14 split the plate into a map and a permanent dossier. The dossier spent
 * half of a 690×240 box on ONE record, so the map — the part that shows all
 * 47 — got 290px of it. This gives the whole box back to the lattice and
 * makes the detail transient: click a tile, a panel opens over the lattice.
 *
 * EVERY SKILL IS A TILE with its ordinal and a symbol (`skillSymbol`), so the
 * portfolio reads as a table of elements rather than a bar of anonymous
 * cells. The ordinal is the Skill's index in registry order and is STABLE
 * ACROSS AXES — it is the tile's identity, the way an atomic number is.
 *
 * TWO AXES, ONE LATTICE. `shape` gives 5 rows × up to 14 (tall tiles);
 * `team` gives 14 rows × up to 7 (short, wide tiles). Same markup, same
 * ghost-padded tracks, different reflow.
 *
 * ⚠ THE TEAM AXIS DEGRADES BELOW 900h, deliberately: 14 rows in the 240px
 * box at 1440×800 leaves ~12.5px a row, which cannot hold an 11px symbol.
 * Below that breakpoint the team view drops to thin fill-only cells (CSS
 * does it — see casefile.css) rather than clipping its bottom rows, which
 * this surface's no-silent-clipping contract forbids and the smoke enforces.
 *
 * ⚠ THE POPOVER STAYS INSIDE THE PLATE. It cannot escape: `.fl-plate` is
 * `overflow: hidden` and `.fl-case` carries the iris `clip-path`, and a
 * clipped ancestor becomes the containing block even for `position: fixed`
 * (the film lightbox portals to `document.body` for exactly this reason —
 * rules/proof.md). So it is absolutely positioned within the stage and
 * CLAMPED to it, flipping below the tile when there is no room above.
 *
 * POINTER EVENTS: `.fl-skills` is the FOURTH opt-in on the casefile host,
 * safe because the host is `visibility: hidden` until `data-proof-live`.
 */
interface SkillsBrowserPlateProps {
  groups: readonly CaseRegistryGroup[];
  skills: readonly CaseSkillEntry[];
  /** Presence turns the VIEW TABS on (ADR-056 U16). Absent = the lattice
   *  alone, which is what a second client without the data would get. */
  intelligence?: CaseIntelligence;
  /** Per-team consumption bands for the team axis. */
  teamDraw?: readonly CaseTeamDraw[];
}

type Axis = "shape" | "team";

/** The three projections of ONE dataset (ADR-056 U16). The lattice leads —
 *  the encoded-judgment portfolio is the richest read and the owner's
 *  default — with the configuration and the allocation one click away. */
type View = "skills" | "stack" | "allocation";

const VIEW_LABEL: Record<View, string> = {
  skills: "Skills",
  stack: "Stack",
  allocation: "Allocation",
};

/** Most-shipped-first: a row's solid head is what runs today. */
const STATUS_RANK: Record<string, number> = {
  Shipped: 0,
  "In use": 1,
  "In build": 2,
  Scoped: 3,
};

const STATUS_FILL: Record<string, string> = {
  Shipped: "ship",
  "In use": "use",
  "In build": "build",
  Scoped: "scoped",
};

/** Gap between the tile and the panel, and the stage's inner margin. */
const POP_GAP = 7;

interface Placed {
  skill: CaseSkillEntry;
  ordinal: number;
}

export function SkillsBrowserPlate({
  groups,
  skills,
  intelligence,
  teamDraw,
}: SkillsBrowserPlateProps) {
  const [view, setView] = useState<View>("skills");
  const [axis, setAxis] = useState<Axis>("shape");
  const [selected, setSelected] = useState<Placed | null>(null);
  const [hovered, setHovered] = useState<Placed | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  /** The tile that opened the panel — focus returns here on close. */
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  /** Ordinal is registry order and never changes with the axis. */
  const placed = useMemo<Placed[]>(
    () => skills.map((skill, i) => ({ skill, ordinal: i + 1 })),
    [skills]
  );

  const rows = useMemo(() => {
    const order =
      axis === "shape"
        ? groups.map((g) => g.name)
        : // Team order is FIRST APPEARANCE in the registry, which keeps the
          // lattice stable rather than reshuffling on a copy edit.
          [...new Set(skills.map((s) => s.team))];

    return order
      .map((name) => ({
        name,
        group: groups.find((g) => g.name === name),
        items: placed
          .filter((p) => (axis === "shape" ? p.skill.engine : p.skill.team) === name)
          .sort((a, b) => (STATUS_RANK[a.skill.status] ?? 9) - (STATUS_RANK[b.skill.status] ?? 9)),
      }))
      .filter((r) => r.items.length > 0);
  }, [axis, groups, skills, placed]);

  /** The widest row sets the shared track — see the ghost contract below. */
  const slots = useMemo(() => rows.reduce((n, r) => Math.max(n, r.items.length), 0), [rows]);

  /** Team → consumption band, for the team axis's gradient column. */
  const bandByTeam = useMemo(
    () => new Map((teamDraw ?? []).map((t) => [t.team, t.band])),
    [teamDraw]
  );

  const close = useCallback((restoreFocus = true) => {
    setSelected(null);
    if (restoreFocus) anchorRef.current?.focus();
    anchorRef.current = null;
  }, []);

  /* POSITION AFTER PAINT, not at click time: the panel's height depends on
     the summary's wrap, so clamping needs its measured box. A layout effect
     writes the offsets before the browser paints, so it never flashes at the
     wrong place. */
  useLayoutEffect(() => {
    const pop = popRef.current;
    const stage = stageRef.current;
    const tile = anchorRef.current;
    if (!selected || !pop || !stage || !tile) return;

    const sb = stage.getBoundingClientRect();
    const tb = tile.getBoundingClientRect();
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;

    const left = Math.max(0, Math.min(tb.left - sb.left + tb.width / 2 - w / 2, sb.width - w));
    const above = tb.top - sb.top - h - POP_GAP;
    const below = tb.bottom - sb.top + POP_GAP;
    const top = above >= 0 ? above : Math.min(below, Math.max(0, sb.height - h));

    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(top)}px`;
  }, [selected]);

  /* Escape closes; so does a pointer landing anywhere that is not the panel
     or its tile. Bound only while open. */
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [selected, close]);

  const focusTile = (name: string) => {
    stageRef.current
      ?.querySelector<HTMLButtonElement>(`[data-fl-skill="${CSS.escape(name)}"]`)
      ?.focus();
  };

  /* ROVING TABINDEX: one tab stop for the lattice, arrows to walk it. */
  const onTileKeyDown = (e: React.KeyboardEvent, rowIdx: number, cellIdx: number) => {
    const row = rows[rowIdx];
    if (!row) return;
    let next: Placed | undefined;

    if (e.key === "ArrowLeft") next = row.items[cellIdx - 1];
    else if (e.key === "ArrowRight") next = row.items[cellIdx + 1];
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const step = e.key === "ArrowUp" ? -1 : 1;
      const target = rows[(rowIdx + step + rows.length) % rows.length];
      next = target?.items[Math.min(cellIdx, (target?.items.length ?? 1) - 1)];
    } else if (e.key === "Home") next = row.items[0];
    else if (e.key === "End") next = row.items[row.items.length - 1];
    else return;

    e.preventDefault();
    if (!next) return;
    setHovered(next);
    focusTile(next.skill.name);
  };

  const active = hovered ?? selected;
  const activeGroup = groups.find((g) => g.name === active?.skill.engine);

  return (
    <div className="fl-plate fl-plate--registry fl-skills" data-axis={axis} data-view={view}>
      <div className="fl-skills__head">
        {/* VIEW TABS lead the head — they are the coarser control, and the
            axis toggle below is a sub-filter of the lattice only (owner:
            "substrate/team is a subcategory, a subfilter"). */}
        {intelligence ? (
          <span className="fl-skills__views" role="tablist" aria-label="Intelligence map view">
            {(["skills", "stack", "allocation"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                className="fl-skills__viewbtn"
                data-on={view === v || undefined}
                aria-selected={view === v}
                onClick={() => {
                  setView(v);
                  setSelected(null);
                  anchorRef.current = null;
                }}
              >
                {VIEW_LABEL[v]}
              </button>
            ))}
          </span>
        ) : null}

        {/* Per-view right-hand chrome. Each view gets the ONE legend that
            decodes it and nothing else; carrying all three at once is the
            overwhelm this plate is trying not to be. */}
        {view === "skills" ? (
          <>
            <span className="fl-skills__axis" role="group" aria-label="Group the lattice by">
              {(["shape", "team"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  className="fl-skills__axbtn"
                  data-on={axis === a || undefined}
                  aria-pressed={axis === a}
                  onClick={() => {
                    setAxis(a);
                    setSelected(null);
                    anchorRef.current = null;
                  }}
                >
                  {a === "shape" ? "Substrate" : "Team"}
                </button>
              ))}
            </span>
            <span className="fl-skills__key" aria-hidden="true">
              {(["Shipped", "In use", "In build", "Scoped"] as const).map((s) => (
                <span key={s} className="fl-skills__key-item">
                  <i className="fl-skills__key-sw" data-fill={STATUS_FILL[s]} />
                  {s}
                </span>
              ))}
            </span>
          </>
        ) : null}
        {view === "allocation" ? (
          <span className="fl-skills__key" aria-hidden="true">
            <span className="fl-skills__key-item">
              <i className="fl-skills__key-sw" data-kind="reach" />
              Reach
            </span>
            <span className="fl-skills__key-item">
              <i className="fl-skills__key-sw" data-kind="draw" />
              Draw
            </span>
          </span>
        ) : null}
      </div>

      {view === "stack" ? <IntelligenceStackView layers={intelligence!.stack} /> : null}
      {view === "allocation" ? <IntelligenceAllocationView intelligence={intelligence!} /> : null}

      {/* Conditionally MOUNTED, not `hidden`: the attribute's `display:
          none` loses to any `display` rule on the element, and this stage
          carries one. Losing the lattice's hover state on a view switch is
          the intended behaviour anyway — the selection is cleared with it. */}
      {view === "skills" ? (
        <div className="fl-skills__stage" ref={stageRef} onMouseLeave={() => setHovered(null)}>
          <div
            className="fl-skills__rows"
            role="group"
            aria-label={axis === "shape" ? "Skills by shape of work" : "Skills by team"}
            style={{ ["--fl-sk-slots" as string]: slots }}
          >
            {rows.map((row, rowIdx) => (
              <div
                key={row.name}
                className="fl-skills__row"
                data-on={
                  row.name === (axis === "shape" ? active?.skill.engine : active?.skill.team) ||
                  undefined
                }
              >
                <span className="fl-skills__row-name">{row.name}</span>
                <span className="fl-skills__track">
                  {row.items.map((p, cellIdx) => (
                    <button
                      key={p.skill.name}
                      type="button"
                      className="fl-skills__tile"
                      data-fl-skill={p.skill.name}
                      data-fill={STATUS_FILL[p.skill.status] ?? "scoped"}
                      data-on={p.skill.name === selected?.skill.name || undefined}
                      data-lit={p.skill.name === active?.skill.name || undefined}
                      aria-expanded={p.skill.name === selected?.skill.name}
                      aria-label={`${p.ordinal}. ${p.skill.name}. ${p.skill.engine}, ${p.skill.team}, ${p.skill.status}.`}
                      tabIndex={
                        p.skill.name === (active?.skill.name ?? rows[0]?.items[0]?.skill.name)
                          ? 0
                          : -1
                      }
                      onMouseEnter={() => setHovered(p)}
                      onFocus={() => setHovered(p)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selected?.skill.name === p.skill.name) {
                          close();
                          return;
                        }
                        anchorRef.current = e.currentTarget;
                        setSelected(p);
                      }}
                      onKeyDown={(e) => onTileKeyDown(e, rowIdx, cellIdx)}
                    >
                      <span className="fl-skills__ord">{p.ordinal}</span>
                      <span className="fl-skills__sym">{skillSymbol(p.skill.name)}</span>
                    </button>
                  ))}
                  {/* Inert spacers to the widest row, so one tile means one
                    width in every row without measuring anything. */}
                  {Array.from({ length: Math.max(0, slots - row.items.length) }, (_, i) => (
                    <i key={`ghost-${i}`} className="fl-skills__ghost" aria-hidden="true" />
                  ))}
                </span>
                <span className="fl-skills__row-count">{row.items.length}</span>
                {/* THE GRADIENT (owner: "cluster the type of teams based on
                  the work and token consumption"). Team axis only — a
                  shape has no consumption of its own, only the teams
                  running it do. Hidden by CSS below 900h, where the team
                  rows are 9px fill-only cells. */}
                {axis === "team" ? (
                  <i
                    className="fl-skills__band"
                    data-band={bandByTeam.get(row.name) ?? undefined}
                    title={`${row.name} — ${bandByTeam.get(row.name) ?? "unrated"} draw`}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            ))}
          </div>

          {selected ? (
            <div
              className="fl-skills__pop"
              ref={popRef}
              role="dialog"
              aria-label={selected.skill.name}
            >
              <p className="fl-skills__pop-top">
                <span className="fl-skills__pop-engine">{selected.skill.engine}</span>
                <span
                  className="fl-skills__pop-status"
                  data-fill={STATUS_FILL[selected.skill.status] ?? "scoped"}
                >
                  {selected.skill.status}
                </span>
                <span className="fl-skills__pop-ord">
                  {String(selected.ordinal).padStart(2, "0")} / {skills.length}
                </span>
              </p>
              <h4 className="fl-skills__pop-name">{selected.skill.name}</h4>
              <p className="fl-skills__pop-team">{selected.skill.team}</p>
              {selected.skill.summary ? (
                <p className="fl-skills__pop-body">{selected.skill.summary}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* The foot names what the hand is on, so the lattice can be READ by
          sweeping it — the tiles carry a symbol, not a name. On the other
          two views it rests on the claim that view exists to make, which
          is why ALLOCATION closes on the map's whole thesis. */}
      <p className="fl-skills__readout">
        <span className="fl-skills__readout-team">
          {view === "stack"
            ? "One configuration, four layers"
            : view === "allocation"
              ? "The work decides the model"
              : active
                ? `${String(active.ordinal).padStart(2, "0")} · ${active.skill.name}`
                : `${skills.length} Skills · ${groups.length} shapes · ${new Set(skills.map((s) => s.team)).size} teams`}
        </span>
        <i className="fl-skills__readout-ld" aria-hidden="true" />
        <span className="fl-skills__readout-status">
          {view === "stack"
            ? "Models · connectors · Skills · tools"
            : view === "allocation"
              ? "Reach is not draw"
              : active
                ? active.skill.team
                : (activeGroup?.gloss ?? "")}
        </span>
      </p>
    </div>
  );
}
