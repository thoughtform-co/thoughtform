import type { ArcHead, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { arcTitleText, coordStamp, padIndex } from "./chrome";
import { CircuitDrawing } from "./circuit/CircuitDrawing";
import { circuitGeom, type CircuitState } from "./circuit/circuitLayout";
import { CircuitScene, type CircuitHeadText } from "./circuit/CircuitScene";

interface ArcCircuitProps {
  section: ArcSectionOf<"circuit">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcCircuit — THE CIRCUIT (ADR-133): the client's intelligence configuration
 * drawn once and TRAVELLING through three beats — the studio today and one
 * configured piece of work; the teams it gives time back to; the larger
 * machine it plugs into.
 *
 * TWO RENDERINGS OF ONE RECORD, and the sheet shows exactly one:
 *   · THE SCENE (`CircuitScene`) — a runway with a sticky stage, one drawing
 *     posed three ways, the head decoding in place. It arms itself on a
 *     desktop frame with motion allowed (`data-circuit-scene`).
 *   · THE FLOW — the three beats as ordinary frames, each drawn at rest by the
 *     same component, and on a phone as three short lists instead (a 1400-unit
 *     drawing at 390px paints its type at 4px). No script, reduced motion,
 *     ≤960px and print all read this, and it is what the page fails open to.
 *
 * ⚠ ONE SECTION, ONE ID (`today`), so the chapter link, the corner readout and
 * the drawer see one beat; the beats inside it are not sections.
 */
export function ArcCircuit({ section, index, motion = "reveal" }: ArcCircuitProps) {
  const geom = circuitGeom(section);
  const heads: Record<CircuitState, ArcHead> = {
    a: section.head,
    b: section.people.head,
    c: section.machine.head,
  };
  const text = (h: ArcHead): CircuitHeadText => ({
    eyebrow: h.eyebrow ?? "",
    title: h.title,
    sub: h.sub ?? "",
  });
  const labels: Record<CircuitState, string> = section.alts;
  const beats: CircuitState[] = ["a", "b", "c"];

  return (
    <ArcBeat
      id={section.id}
      kind="circuit"
      className="arc-section arc-sec arc-sec--circuit"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <CircuitScene
        heads={{ a: text(heads.a), b: text(heads.b), c: text(heads.c) }}
        brief={`ARC / BRIEF · ${padIndex(index)}`}
        coords={[coordStamp(section.id, 1), coordStamp(section.id, 2)]}
        drawing={
          <figure
            className="arc-cir arc-cir--live arc-reveal"
            data-cir-state="a"
            role="group"
            aria-label={labels.a}
          >
            <CircuitDrawing geom={geom} uid={`${section.id}-live`} label={labels.a} />
          </figure>
        }
      />
      <div className="arc-cir-flow">
        {beats.map((b) => (
          <div key={b} className="arc-cir-beat" data-cir-beat={b}>
            <div className="arc-band">
              <ArcSectionHead
                head={heads[b]}
                kind="circuit"
                index={index}
                sectionId={b === "a" ? section.id : `${section.id}-${b}`}
                motion={motion}
              />
            </div>
            <div className="arc-band">
              <figure className="arc-cir arc-cir--static arc-reveal" data-cir-state={b}>
                <CircuitDrawing geom={geom} uid={`${section.id}-${b}`} label={labels[b]} />
              </figure>
              <CircuitList section={section} beat={b} />
            </div>
          </div>
        ))}
      </div>
    </ArcBeat>
  );
}

/**
 * The phone's reading of one beat — the same record as short ruled lists, in
 * the order the drawing reads it. Hidden above 960px, where the drawing is
 * legible.
 */
function CircuitList({ section, beat }: { section: ArcSectionOf<"circuit">; beat: CircuitState }) {
  if (beat === "a") {
    return (
      <div className="arc-cir-list" data-cir-list="a">
        <dl className="arc-cir-list__rows">
          <div>
            <dt>The work</dt>
            <dd>
              <strong>{section.work.name}</strong> · {section.work.good}
            </dd>
          </div>
          {section.questions.map((q) => (
            <div key={q.id} data-cir-q={q.id}>
              <dt>{q.key}</dt>
              <dd>
                {q.answer}
                <span className="arc-cir-list__was">Today: {q.today}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
  if (beat === "b") {
    const names = new Map(section.machine.configs.map((c) => [c.id, c.name]));
    return (
      <div className="arc-cir-list" data-cir-list="b">
        {section.people.teams.map((t) => (
          <section key={t.id} className="arc-cir-list__team" aria-label={t.name}>
            <h3>{t.name}</h3>
            <p className="arc-cir-list__hand">{t.hand}</p>
            <ul>
              {t.configs.map((id) => (
                <li key={id}>{names.get(id) ?? id}</li>
              ))}
            </ul>
            <p className="arc-cir-list__freed">
              <span>{section.people.freedKey}</span> {t.freed}
            </p>
          </section>
        ))}
      </div>
    );
  }
  return (
    <div className="arc-cir-list" data-cir-list="c">
      <ul className="arc-cir-list__configs">
        {section.machine.configs.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
      <p className="arc-cir-list__layer">
        <strong>{section.machine.layer.name}</strong> · {section.machine.layer.line}
      </p>
      <dl className="arc-cir-list__rows">
        {section.machine.sockets.map((s) => (
          <div key={s.id} data-cir-future={s.future ? "" : undefined}>
            <dt>{s.key}</dt>
            <dd>{s.name}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
