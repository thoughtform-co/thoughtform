"use client";

import { useMemo, useState } from "react";

import type { CaseRegistryGroup, CaseSkillEntry } from "@/lib/cases/types";

/**
 * SkillsBrowserPlate — the Intelligence Map plate as a browsable portfolio
 * (ADR-056 U13; owner: "a minimalistic system à la aether /claude-adoption
 * with an overview of the different skills where users can click on").
 *
 * Three bands inside the plate box:
 *   · ENGINE TABS — the five shapes, each carrying its skill count. This is
 *     where the U12 weighted overview LIVES ON: the counts sum to the 47+
 *     the foot prints, and a reader can now verify them by clicking.
 *   · CHIPS — the selected engine's skills by name. Max 14 (Pattern), which
 *     is what makes the browser fit where 47 chips at once measurably did
 *     not (a full cloud ran ~228px against a 181px box at 720p).
 *   · READOUT — the selected skill's provenance: team, dotted leader,
 *     lifecycle. The one line of detail the public page carries; owners and
 *     internal workflow copy stay in the client's own tooling.
 *
 * STATE LIVES HERE, not in TrackVisual — the switch stays a pure dispatch
 * (the ToolGallery precedent, minus the panel-foot coupling that forced
 * that one's state up into TrackPanel; nothing outside this plate reads
 * the selection).
 *
 * POINTER EVENTS: `.fl-skills` is the FOURTH opt-in on the casefile host
 * (after the tabs, the directory rows and `.fl-film` — rules/proof.md).
 * Safe for the same reason the film plate is: the host is
 * `visibility: hidden` until `data-proof-live`, so these buttons cannot
 * shadow the ring's hit anchors once the casefile has left.
 */
interface SkillsBrowserPlateProps {
  groups: readonly CaseRegistryGroup[];
  skills: readonly CaseSkillEntry[];
}

export function SkillsBrowserPlate({ groups, skills }: SkillsBrowserPlateProps) {
  const [engine, setEngine] = useState(groups[0]?.name ?? "");
  const engineSkills = useMemo(() => skills.filter((s) => s.engine === engine), [skills, engine]);
  const [skillName, setSkillName] = useState<string | null>(null);
  const active = engineSkills.find((s) => s.name === skillName) ?? engineSkills[0];

  return (
    <div className="fl-plate fl-plate--registry fl-skills">
      <div className="fl-skills__tabs" role="tablist" aria-label="Shapes of work">
        {groups.map((g) => (
          <button
            key={g.name}
            type="button"
            role="tab"
            aria-selected={g.name === engine}
            className="fl-skills__tab"
            data-on={g.name === engine || undefined}
            onClick={() => {
              setEngine(g.name);
              setSkillName(null);
            }}
          >
            <span className="fl-skills__tab-name">{g.name}</span>
            {g.count ? <span className="fl-skills__tab-count">{g.count}</span> : null}
          </button>
        ))}
      </div>

      {/* The selected engine's definition — the gloss the taxonomy has
          always carried, now serving as the tab strip's caption. */}
      <p className="fl-skills__gloss">{groups.find((g) => g.name === engine)?.gloss}</p>

      <ul className="fl-skills__cloud">
        {engineSkills.map((s) => (
          <li key={s.name}>
            <button
              type="button"
              className="fl-skills__chip"
              aria-pressed={s.name === active?.name}
              data-on={s.name === active?.name || undefined}
              onClick={() => setSkillName(s.name)}
            >
              {s.name}
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <p className="fl-skills__readout">
          <span className="fl-skills__readout-team">{active.team}</span>
          <i className="fl-skills__readout-ld" aria-hidden="true" />
          <span className="fl-skills__readout-status">{active.status}</span>
        </p>
      ) : null}
    </div>
  );
}
