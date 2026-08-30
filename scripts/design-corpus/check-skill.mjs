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

/**
 * Backticked SOURCE paths — `components/…/Foo.tsx`, `lib/…/bar.ts`, `app/…/x.css`.
 *
 * A separate pass because these are prose, not links, and the rot that motivated
 * it took exactly that form: `useSigilChoreography.ts` stayed named in three
 * places after ADR-013 deleted it, and a link-only check saw none of them.
 *
 * ⚠ ADVISORY, NEVER FATAL — and that is not timidity, it is the truth about what
 * this check can know. **This skill is PORTABLE across Thoughtform products**, so
 * a large share of the paths it names are the Astrolabe's implementation
 * (`app/brand-system/**`, `components/hud/**`, `lib/navigation/rail-contract.ts`)
 * and correctly do not resolve from this repo. Failing on those would report ~25
 * false positives, and a guard that cries wolf is one nobody reads — which is
 * strictly worse than not having it.
 *
 * So: the list is printed for a human to scan, and only the MARKDOWN LINKS fail
 * the run. Links are relative and intra-tree by construction, so a broken one is
 * unambiguously broken.
 */
function referencedSources(body) {
  const out = new Set();
  const re =
    /`((?:components|lib|app|scripts|public|supabase|sentinel)\/[A-Za-z0-9._/-]+\.(?:tsx?|css|mjs|md|html))`/g;
  for (const m of body.matchAll(re)) out.add(m[1]);
  return [...out];
}

let broken = 0;
let checked = 0;
const routed = new Set();
/** Source paths named in prose that do not resolve HERE — advisory, see below. */
const unresolvedSources = [];

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

  // Backticked source paths, resolved from the REPO ROOT (that is how prose
  // states them — `components/landing/v7/BrandmarkActor.tsx`, not a relative hop).
  // Collected, not failed — see referencedSources().
  for (const src of referencedSources(body)) {
    if (!fs.existsSync(path.resolve(process.cwd(), src))) {
      unresolvedSources.push({ rel, src });
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
if (unresolvedSources.length) {
  console.log(
    `\n  ${unresolvedSources.length} source path(s) named in prose do not resolve in THIS repo.`
  );
  console.log(
    `  Most are the Astrolabe's implementation and are correct — this skill is portable.`
  );
  console.log(`  Scan for anything that should be here and has rotted:`);
  const byFile = new Map();
  for (const { rel, src } of unresolvedSources) {
    if (!byFile.has(rel)) byFile.set(rel, []);
    byFile.get(rel).push(src);
  }
  for (const [rel, srcs] of byFile) console.log(`    ${rel}: ${srcs.join(", ")}`);
}
if (broken) {
  console.error(`\n${broken} broken link(s) — a skill that names a file it does not have`);
  process.exit(1);
}
console.log(`  all links resolve`);
