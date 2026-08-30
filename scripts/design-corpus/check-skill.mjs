#!/usr/bin/env node
/**
 * check-skill — every file the design skill NAMES must exist.
 *
 * Written against a defect that was live in three copies of this skill at once:
 * SKILL.md routed to `references/celestial-diagram-grammar.md` twice while that
 * file existed only in a different copy of the tree, and the project override
 * linked `web-hud-adaptation.md`, which it did not have either. A skill that
 * points at a missing reference does not error — it silently answers from
 * whatever it does have, which is worse than failing.
 *
 * Also checks the reverse: reference files nobody routes to. Those are not an
 * error (a file can be reached by name from a session), but an unrouted file is
 * usually one that got orphaned by a rewrite, so it is reported.
 *
 *   node scripts/design-corpus/check-skill.mjs
 *
 * Exits non-zero on a broken link.
 */
import fs from "node:fs";
import path from "node:path";

const SKILL_DIR = path.resolve(process.cwd(), ".claude/skills/thoughtform-design");

if (!fs.existsSync(SKILL_DIR)) {
  console.error(`no skill at ${SKILL_DIR} — run from the repo root`);
  process.exit(1);
}

/** Every markdown link target and backticked path in a file. */
function referencedPaths(body) {
  const out = new Set();
  // [label](target) — strip anchors and any title
  for (const m of body.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) out.add(m[1].split("#")[0]);
  // `references/foo.md`, `eval/rubric.md` — the table and prose form
  for (const m of body.matchAll(/`((?:references|eval|products)\/[A-Za-z0-9._/-]+\.md)`/g)) {
    out.add(m[1]);
  }
  return [...out].filter(Boolean);
}

let broken = 0;
let checked = 0;
const routed = new Set();

const files = [
  "SKILL.md",
  ...fs
    .readdirSync(path.join(SKILL_DIR, "references"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => `references/${f}`),
];

for (const rel of files) {
  const full = path.join(SKILL_DIR, rel);
  if (!fs.existsSync(full)) continue;
  const body = fs.readFileSync(full, "utf8");
  for (const target of referencedPaths(body)) {
    // Skip URLs and bare anchors.
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    checked++;
    const base = path.dirname(full);
    const resolved = path.resolve(base, target);
    // A reference inside the skill tree is also "routed to".
    if (resolved.startsWith(SKILL_DIR)) routed.add(path.relative(SKILL_DIR, resolved).replace(/\\/g, "/"));
    // Anything else must still exist somewhere in the repo.
    if (!fs.existsSync(resolved)) {
      console.error(`  BROKEN  ${rel} -> ${target}`);
      broken++;
    }
  }
}

const orphans = fs
  .readdirSync(path.join(SKILL_DIR, "references"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => `references/${f}`)
  .filter((f) => !routed.has(f));

console.log(`check-skill: ${checked} links checked across ${files.length} files`);
if (orphans.length) {
  console.log(`  unrouted (reachable by name, but nothing links them):`);
  for (const o of orphans) console.log(`    ${o}`);
}
if (broken) {
  console.error(`\n${broken} broken link(s) — a skill that names a file it does not have`);
  process.exit(1);
}
console.log(`  all links resolve`);
