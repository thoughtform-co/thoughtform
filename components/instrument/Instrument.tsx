import type { CSSProperties } from "react";

import { ribbonPaths } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import {
  ALTITUDE_WORDS,
  PLUGIN_ORDER,
  STATION_PARTS,
  type StationPart,
  WORK_CARD,
  WORK_PITCH,
  WORK_VB,
  WORK_WIRES,
  plateRect,
  rectVars,
  sideOf,
  workRun,
} from "@/lib/instrument/layout";
import {
  altitudesOf,
  type Altitude,
  type InstrumentPart,
  type InstrumentRecord,
  type PartId,
  type PartState,
} from "@/lib/instrument/types";

import { InstrumentPicker } from "./InstrumentPicker";

/** The five stations' words: chrome, never content (ADR-148). */
export const STATION_WORDS: Record<StationPart, string> = {
  interface: "You ask",
  model: "Claude picks the skill",
  context: "It follows the steps",
  evals: "It checks itself",
  owner: "You decide",
};

/** The word a plate carries at the plugin altitude: the folder it is. */
const PLUGIN_WORDS: Record<PartId, string> = {
  context: "The skills",
  evals: "The evals",
  data: "The connectors",
  owner: "The owner",
  model: "The account",
  interface: "The interfaces",
};

export const CHECK_WORDS = {
  pass: "Pass",
  review: "Review",
  block: "Block",
  "not-run": "Not run yet",
} as const;

export interface InstrumentKnobs {
  housing: "lip" | "seam";
  panel: "strip" | "bare";
  ribbon: "eight" | "four";
  ground: "dots" | "void";
  zoom: "css" | "flip" | "anime";
}

export const INSTRUMENT_HOUSE: InstrumentKnobs = {
  housing: "lip",
  panel: "strip",
  ribbon: "eight",
  ground: "dots",
  zoom: "css",
};

interface InstrumentProps {
  record: InstrumentRecord;
  altitude: Altitude;
  /** The proposal law: one lit thing. A part id lights that part alone. */
  focus?: PartId;
  /** Present ⇒ the breadcrumb is a picker. Only altitudes the record carries. */
  picker?: readonly Altitude[];
  knobs?: Partial<InstrumentKnobs>;
  /** The figure's DOM id; the picker and the measure find it by this. */
  id?: string;
  className?: string;
}

/**
 * Instrument — one record, drawn at one altitude (ADR-154).
 *
 * ⚠ ONE DOM FOR EVERY ALTITUDE. The six parts are rendered ONCE and placed
 * by `[data-altitude]` in CSS; every altitude's chrome (the ribbons, the
 * stations' words, the frames) is in the markup and shown by the same
 * attribute. That is what lets a pick move the SAME nodes between their seats
 * (the Flip and anime engines) and what lets the CSS engine be a cut: nothing
 * is re-rendered, an attribute changes.
 *
 * ⚠ SERVER, NO STATE. The picker is the one island, and it writes one
 * attribute. Without JS the authored altitude renders whole and the picker's
 * buttons are inert.
 *
 * ⚠ THE HOUSING IS `.lat-frame` (the lattice's one chamfered housing); its
 * children are square (ADR-065 rule 4). Gold is the lit plates and the chip;
 * green is the owner and nothing else.
 */
export function Instrument({
  record,
  altitude,
  focus,
  picker,
  knobs: k,
  id,
  className,
}: InstrumentProps) {
  const knobs = { ...INSTRUMENT_HOUSE, ...k };
  const offered = altitudesOf(record);
  const figId = id ?? `ins-${record.id}`;
  const wires = knobs.ribbon === "four" ? WORK_WIRES / 2 : WORK_WIRES;

  const stateOf = (p: InstrumentPart): PartState => {
    if (!focus) return p.state;
    if (p.state === "human") return "human";
    return p.id === focus ? "lit" : "quiet";
  };

  const parts = record.parts.map((p) => ({ ...p, state: stateOf(p) }));
  const mother = record.plugin?.skills.find((s) => s.reads);
  const father = record.plugin?.skills.find((s) => s.sorts);
  const skills = record.plugin?.skills.filter((s) => !s.reads && !s.sorts) ?? [];

  return (
    <figure
      id={figId}
      className={`ins lat-frame${className ? ` ${className}` : ""}`}
      data-ins={record.id}
      data-altitude={altitude}
      data-ins-housing={knobs.housing}
      data-ins-panel={knobs.panel}
      data-ins-ground={knobs.ground}
      data-ins-focus={focus}
      data-cut="tr-bl"
      data-ch="plate-fluid"
      data-line={knobs.housing === "seam" ? "seam" : "lip-lit"}
      data-ground="plate"
      role="group"
      aria-label={record.alt[altitude] ?? record.alt.work}
      {...Object.fromEntries(
        offered.map((a) => [`data-alt-${a}`, record.alt[a] ?? record.alt.work])
      )}
    >
      <header className="lat-frame__head ins__head">
        <span className="ins__desig">INS · {record.id}</span>
        {picker ? (
          <InstrumentPicker
            figureId={figId}
            altitudes={picker.filter((a) => offered.includes(a))}
            initial={altitude}
            engine={knobs.zoom}
            words={ALTITUDE_WORDS}
          />
        ) : (
          <span className="ins__crumb" aria-label="Altitude">
            {offered.map((a) => (
              <span key={a} className="ins__crumb-at" data-on={a === altitude || undefined}>
                {ALTITUDE_WORDS[a]}
              </span>
            ))}
          </span>
        )}
        <span className="ins__tag">{record.tag}</span>
      </header>

      <div className="lat-frame__body ins__body">
        <div className="ins__stage" data-ins-stage="">
          {/* The ground: the dot grid under the wiring. */}
          <i className="ins-ground" aria-hidden="true" />

          {/* The ribbons: the work altitude's wiring, SVG, nothing else. */}
          <svg
            className="ins-wires"
            viewBox={`0 0 ${WORK_VB.w} ${WORK_VB.h}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {parts.map((p) => {
              const { side, i } = sideOf(p.id);
              return (
                <g key={p.id} className="ins-wire" data-ins-state={p.state}>
                  {ribbonPaths(workRun(side, i), wires, WORK_PITCH).map((d) => (
                    <path key={d} d={d} />
                  ))}
                </g>
              );
            })}
          </svg>

          {/* The frames: a frame around a group at one altitude, under the parts. */}
          {record.plugin ? (
            <div
              className="ins-frame"
              data-at="plugin"
              data-ins-id="frame-plugin"
              aria-hidden="true"
            >
              <span className="ins-frame__label">
                {record.plugin.label} · {record.plugin.name}
              </span>
            </div>
          ) : null}
          {record.org ? (
            <div className="ins-frame" data-at="org" data-ins-id="frame-org" aria-hidden="true">
              <span className="ins-frame__label">
                {record.org.label} · {record.org.name}
              </span>
            </div>
          ) : null}

          {/* The nodes outside the housing's centre: above the plugin, the socket under the org. */}
          {record.plugin?.above.map((n, i) => (
            <div key={n.label} className="ins-node" data-at="plugin" data-ins-id={`above-${i + 1}`}>
              <span className="ins-node__label">{n.label}</span>
              <span className="ins-node__name">{n.name}</span>
              {n.line ? <span className="ins-node__line">{n.line}</span> : null}
            </div>
          ))}
          {record.org?.socket ? (
            <div className="ins-node" data-at="org" data-ins-id="socket">
              <span className="ins-node__label">{record.org.socket.label}</span>
              <span className="ins-node__name">{record.org.socket.name}</span>
            </div>
          ) : null}

          {/* THE CHIP: the one filled object, what the altitude is about. */}
          <div
            className="ins-chip lat-frame"
            data-ins-id="chip"
            data-cut="tr"
            data-ch="seed"
            data-line="lip-lit"
            data-ground="none"
            style={rectVars(WORK_CARD) as CSSProperties}
          >
            <span className="ins-chip__at" data-at="org">
              <span className="ins-chip__label">{record.org?.os.name}</span>
              <span className="ins-chip__name">{record.org?.os.line}</span>
              <ul className="ins-chip__list">
                {record.org?.workstreams.map((w) => (
                  <li key={w.id} data-lit={w.lit?.length ? "" : undefined}>
                    {w.name}
                  </li>
                ))}
              </ul>
            </span>
            <span className="ins-chip__at" data-at="plugin">
              <span className="ins-chip__label">{"Reads every skill's work"}</span>
              <span className="ins-chip__name">{mother?.name ?? record.plugin?.name}</span>
              <span className="ins-chip__line">The mother. Never makes, never approves.</span>
            </span>
            <span className="ins-chip__at" data-at="work">
              <span className="ins-chip__label">{record.work.label}</span>
              <span className="ins-chip__name">{record.work.name}</span>
              <span className="ins-chip__line">{record.work.line}</span>
              <span className="ins-chip__bar">
                <b>{record.work.bar.label}</b> {record.work.bar.line}
              </span>
            </span>
            <span className="ins-chip__at" data-at="run">
              <span className="ins-chip__label">{record.work.name} · one run</span>
              <span className="ins-chip__name">“{record.run?.ask}”</span>
            </span>
            <span className="ins-chip__at" data-at="check">
              <span className="ins-chip__label">Station 4, opened</span>
              <span className="ins-chip__name">{record.run?.skill.name} checks itself</span>
            </span>
          </div>

          {/* THE SIX, once. */}
          {parts.map((p) => {
            const { side, i } = sideOf(p.id);
            const station = (STATION_PARTS as readonly PartId[]).indexOf(p.id);
            return (
              <section
                key={p.id}
                className="ins-panel"
                data-ins-part={p.id}
                data-ins-state={p.state}
                data-ins-order={PLUGIN_ORDER.indexOf(p.id)}
                aria-label={p.title}
                style={rectVars(plateRect(side, i)) as CSSProperties}
              >
                <header className="ins-panel__head">
                  <span className="ins-panel__label">
                    <span data-at="work org check">{p.title}</span>
                    <span data-at="plugin">{PLUGIN_WORDS[p.id]}</span>
                    <span data-at="run">
                      {station >= 0
                        ? `${station + 1} · ${STATION_WORDS[p.id as StationPart]}`
                        : "The tools"}
                    </span>
                  </span>
                  {p.state === "lit" ? <span className="ins-panel__chip">{record.tag}</span> : null}
                  {p.state === "pending" ? <span className="ins-panel__chip">Soon</span> : null}
                </header>
                <div className="ins-panel__body">
                  {/* work and org: the question and its answer */}
                  <span className="ins-panel__at" data-at="work org">
                    <span className="ins-panel__name">{p.question}</span>
                    <span className="ins-panel__line">{p.answer}</span>
                  </span>
                  {/* plugin: the folder, and what it answers */}
                  <span className="ins-panel__at" data-at="plugin">
                    {p.id === "context" ? (
                      <ul className="ins-panel__list">
                        {skills.map((s) => (
                          <li key={s.id}>{s.name}</li>
                        ))}
                      </ul>
                    ) : p.id === "evals" ? (
                      <ul className="ins-panel__list">
                        <li>cases, with and without</li>
                        {father ? (
                          <li data-lit="">{father.name} · the father sorts every remark</li>
                        ) : null}
                      </ul>
                    ) : p.id === "model" ? (
                      <span className="ins-panel__line">
                        {record.plugin?.above[1].line ?? p.answer}
                      </span>
                    ) : p.id === "interface" ? (
                      <span className="ins-panel__line">{record.plugin?.bar.line ?? p.answer}</span>
                    ) : (
                      <span className="ins-panel__line">{p.answer}</span>
                    )}
                    <span className="ins-panel__tie">answers · {p.title.toLowerCase()}</span>
                  </span>
                  {/* run: the station's content */}
                  <span className="ins-panel__at" data-at="run">
                    {p.id === "interface" ? (
                      <span className="ins-panel__line">{record.run?.ask}</span>
                    ) : p.id === "model" ? (
                      <span className="ins-panel__line">
                        <code>{record.run?.skill.name}</code>
                        {record.run?.skill.also?.length
                          ? ` + ${record.run.skill.also.join(", ")}`
                          : ""}
                      </span>
                    ) : p.id === "context" ? (
                      <ol className="ins-panel__list" data-numbered="">
                        {record.run?.steps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    ) : p.id === "evals" ? (
                      <span className="ins-panel__line">
                        {record.checks?.length ?? 0} checks,{" "}
                        {record.checks?.filter((c) => c.gate).length ?? 0} gates
                      </span>
                    ) : p.id === "owner" ? (
                      <span className="ins-panel__line">
                        <b>{record.run?.decide.who}.</b> {record.run?.decide.line}
                      </span>
                    ) : (
                      <span className="ins-panel__line">{p.answer}</span>
                    )}
                  </span>
                  {/* check: the evaluations opened */}
                  <span className="ins-panel__at" data-at="check">
                    {p.id === "evals" ? (
                      <ul className="ins-panel__checks">
                        {record.checks?.map((c) => (
                          <li
                            key={c.id}
                            data-check={c.state}
                            data-gate={c.gate ? "" : undefined}
                            data-case={c.code ? "" : undefined}
                          >
                            <span className="ins-check__mark" aria-hidden="true" />
                            <span className="ins-check__label">
                              {c.code ? <code>{c.label}</code> : c.label}
                            </span>
                            <span className="ins-check__state">
                              {c.figure ? `${c.figure} · ` : c.gate ? "Gate · " : ""}
                              {CHECK_WORDS[c.state]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : p.id === "owner" ? (
                      <span className="ins-panel__line">
                        <b>{record.run?.decide.who}.</b> {record.run?.decide.line}
                      </span>
                    ) : (
                      <span className="ins-panel__line">{p.answer}</span>
                    )}
                    {p.id === "evals" && record.checksNote ? (
                      <span className="ins-panel__note">{record.checksNote}</span>
                    ) : null}
                  </span>
                </div>
              </section>
            );
          })}

          {/* The return path: feedback back to the owner, dashed. */}
          <i className="ins-return" data-at="check" aria-hidden="true">
            <b>a remark · the owner decides</b>
          </i>
        </div>
      </div>

      <footer className="lat-frame__foot ins__foot">
        <span className="ins__foot-at">
          {altitudesOf(record).map((a) => (
            <span key={a} data-at={a}>
              {ALTITUDE_WORDS[a]}
            </span>
          ))}
        </span>
        <span className="ins__legend">
          <i data-ins-state="lit" /> what the team writes
          <i data-ins-state="human" /> a person
        </span>
      </footer>
    </figure>
  );
}
