"use client";

import { CARDINAL_TAG, REVEAL_SKILLS } from "./revealData";

/**
 * EncodeSkillsList — the Encode reveal's content: a flat list of genericized
 * skill examples (ADR-032), each row tagged with the cardinal it sits under
 * (JDG / TST / CRF / VOC), echoing the JUDGMENT/TASTE/CRAFT/VOICE cardinals
 * on the sphere. Data (and the confidentiality note) lives in `revealData.ts`.
 */
export function EncodeSkillsList() {
  return (
    <ul className="reveal-skills">
      {REVEAL_SKILLS.map((skill) => (
        <li key={skill.id} className="reveal-skills__row" data-cardinal={skill.cardinal}>
          <div className="reveal-skills__head">
            <span className="reveal-skills__title">{skill.title}</span>
            <span className="reveal-skills__status">{skill.statusLabel}</span>
            <span className="reveal-skills__tag">{CARDINAL_TAG[skill.cardinal]}</span>
          </div>
          <p className="reveal-skills__body">{skill.body}</p>
        </li>
      ))}
    </ul>
  );
}
