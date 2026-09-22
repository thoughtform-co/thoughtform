"use client";

import { SUBJECT_NAMES, perFrameCount } from "./derive";
import type { BenchConfig, Regression } from "./types";

/**
 * SKILL — the skill as its folder, in Moira's grammar: a trunk, a branch
 * per entry, one line each (SKILL.md's own Files table, said short). The
 * references carry the four bands, read off each product's tile by code;
 * the anchors folder is drawn dashed because no client verdict has filled
 * it yet. The counts and the swatches are live; the lines are the page's.
 */
export function SkillView({ cfg, evals }: { cfg: BenchConfig | null; evals: Regression | null }) {
  const n = perFrameCount(cfg);
  const sum = evals?.regression?.summary;
  const subjects = cfg?.subjects ?? [];
  return (
    <div className="tb-skill">
      <span className="tb-folder">trinny-london/</span>
      <ul className="tb-tree">
        <li className="tb-file">
          <span className="tb-file__name">skill/SKILL.md</span>
          <span className="tb-file__line">
            The look in one paragraph, the rules, and the failure each rule is here for.
          </span>
        </li>
        <li className="tb-file">
          <span className="tb-file__name">skill/references/</span>
          <span className="tb-file__line">
            {`The rubric (${n || "…"} checks a frame, read at every grade), the brief every draw shares, and each product’s colour read off its own tile.`}
          </span>
          {subjects.length > 0 && (
            <div className="tb-bands">
              {subjects.map((s) => {
                const sw = s.mode === "set" ? s.colours : s.band ? [s.band] : [];
                return (
                  <div className="tb-bandrow" key={s.key}>
                    <span className="tb-bandrow__chips" aria-hidden="true">
                      {sw.map((c, i) => (
                        <i key={i} style={{ background: c.hex }} />
                      ))}
                    </span>
                    <span className="tb-bandrow__name">{SUBJECT_NAMES[s.key] ?? s.key}</span>
                    <span className="tb-bandrow__nums">
                      {s.mode === "set"
                        ? `${sw.length} colours, each matched`
                        : s.band
                          ? `L* ${Math.round(s.band.L)} · C* ${Math.round(s.band.C)} · h ${Math.round(s.band.h)}°`
                          : "–"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </li>
        <li className="tb-file" data-missing="true">
          <span className="tb-file__name">skill/assets/</span>
          <span className="tb-file__line">
            No approved anchor yet. The first client verdict writes one.
          </span>
        </li>
        <li className="tb-file">
          <span className="tb-file__name">evals/</span>
          <span className="tb-file__line">
            {sum
              ? `${sum.negatives} negatives derived in code, one change each: ${sum.held} are caught.`
              : "The negatives, derived in code, one change each."}
          </span>
        </li>
        <li className="tb-file">
          <span className="tb-file__name">bench/</span>
          <span className="tb-file__line">
            One frame at a time: draw, measure, a stranger&rsquo;s read, three grades.
          </span>
        </li>
      </ul>
    </div>
  );
}
