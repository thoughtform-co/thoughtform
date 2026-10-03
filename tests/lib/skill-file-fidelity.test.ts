import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ARCS } from "@/lib/arcs/registry";

/**
 * THE SKILL FILE BEAT QUOTES A REAL FILE (ADR-139).
 *
 * `skill-file` draws a Skill's own `SKILL.md` with three lines marked, and
 * the beat's whole claim — the one that makes it worth a screen — is that a
 * room is looking at a file that exists, in its own words. The head says so
 * out loud: "This is a real one, shortened."
 *
 * ⚠ THIS GUARD EXISTS BECAUSE THE CLAIM DECAYED ONCE ALREADY. The first cut
 * drew four lines that were not in any file: a lede paraphrased out of the
 * front matter, a clause invented at the end of a rule, a quoted pair turned
 * into a definition, and a description re-voiced into the first person. Every
 * one of them was true ABOUT the skill and none of them was IN it, which is
 * exactly the failure a reader cannot see and the page cannot survive.
 *
 * ⚠ IT MEASURES OVERLAP, NOT EQUALITY, and that is deliberate: a drawn line
 * is allowed to shorten (the site's copy law bans the em dash the source
 * files use for asides) and to join two sentences from different parts of
 * one file. What it cannot do is arrive from nowhere. Four-word shingles
 * catch a whole invented sentence; they do NOT catch a short clause bolted
 * onto a real one, so this is a floor, not a proof.
 *
 * ⚠ IT WALKS CLAIMS, NOT LABELS. A heading is skipped: the real ones carry
 * code spans and ellipses the page cannot letter (`### The `[NEEDS: …]`
 * protocol: a hard rule`), so a shortened heading scores zero against its own
 * source while saying exactly what it says. What a reader is asked to believe
 * is in the body lines, and those are walked in full.
 *
 * ⚠ IT SKIPS WHEN THE SOURCE IS NOT ON DISK. The Skills live in a sibling
 * repository, not in this one, so anywhere that repository is absent this
 * cannot run — and a guard that failed on every other checkout would be
 * turned off within a week.
 */

const SKILLS_DIR = join(
  __dirname,
  "..",
  "..",
  "..",
  "00_thoughtform-plugins",
  "plugins",
  "thoughtform",
  "skills"
);

/**
 * Skills that live in ANOTHER repository than the practice's plugins, by the
 * name the beat draws (ADR-143 U1): the third house cut quotes Loop's
 * `motion-design`, kept in `tensalir/loop-ai-studio`. `LOOP_AI_STUDIO_DIR`
 * points at a checkout of it; the sibling folder is the default. Absent, the
 * Skill is skipped like any other source that is not on disk.
 */
const LOOP_AI_STUDIO_DIR =
  process.env.LOOP_AI_STUDIO_DIR ?? join(__dirname, "..", "..", "..", "loop-ai-studio");
const ELSEWHERE: Record<string, string> = {
  "motion-design": join(
    LOOP_AI_STUDIO_DIR,
    "plugins",
    "ai-studio-motion",
    "skills",
    "motion-design",
    "SKILL.md"
  ),
};

/** The file a beat's Skill is read from, and whether this checkout has it. */
function sourceOf(skill: string): { file: string; external: boolean } {
  const other = ELSEWHERE[skill];
  if (other) return { file: other, external: true };
  return { file: join(SKILLS_DIR, skill, "SKILL.md"), external: false };
}

/** Strip the markdown the source uses and the page does not. */
const norm = (s: string) =>
  s
    .replace(/[*`_>[\]"'“”‘’·]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

function shingles(s: string, n = 4): string[] {
  const w = norm(s).split(" ").filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i <= w.length - n; i++) out.push(w.slice(i, i + n).join(" "));
  return out;
}

/** Measured floor: the lowest a legitimate shortening scores today is 0.56
 *  (a short rule that joins two places in one file). Anything under this is
 *  a line that is not in the file it says it is in. */
const FLOOR = 0.5;

describe("a skill-file beat quotes a file that exists (ADR-139)", () => {
  const panels = ARCS.flatMap((arc) =>
    arc.sections
      .filter((s) => s.kind === "skill-file")
      .map((s) => ({ arc: arc.slug, section: s as Extract<typeof s, { kind: "skill-file" }> }))
  );

  it("draws at least one, and every one names a Skill on disk", () => {
    expect(panels.length, "no skill-file beat is registered").toBeGreaterThan(0);
    for (const { arc, section } of panels) {
      const skill = section.path.split(" / ")[0];
      const { file, external } = sourceOf(skill);
      // The repository that holds it is not checked out here.
      if (external ? !existsSync(LOOP_AI_STUDIO_DIR) : !existsSync(SKILLS_DIR)) continue;
      expect(
        existsSync(file),
        `${arc}#${section.id}: ${skill} is drawn as a real Skill but is not on disk`
      ).toBe(true);
    }
  });

  it("every line it draws is in that Skill's own file", () => {
    const faults: string[] = [];
    for (const { arc, section } of panels) {
      const skill = section.path.split(" / ")[0];
      const { file } = sourceOf(skill);
      if (!existsSync(file)) continue;
      const source = new Set(shingles(readFileSync(file, "utf8")));
      for (const line of section.lines) {
        if (line.as === "h1" || line.as === "h2") continue; // a label, not a claim
        const sh = shingles(line.text);
        if (sh.length < 3) continue; // a front-matter marker
        const hit = sh.filter((x) => source.has(x)).length;
        const ratio = hit / sh.length;
        if (ratio < FLOOR) {
          faults.push(
            `${arc}#${section.id} / ${line.id}: only ${hit} of ${sh.length} phrases are in ${skill}/SKILL.md — ${line.text.slice(0, 80)}`
          );
        }
      }
    }
    expect(faults, "a drawn line is not in the file the beat says it is").toEqual([]);
  });
});
