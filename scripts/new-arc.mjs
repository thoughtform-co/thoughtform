/**
 * new-arc — a client page and its proposal, in one command (ADR-098).
 *
 *   node scripts/new-arc.mjs --client suri --name "Suri" --engagement proposal
 *   node scripts/new-arc.mjs --client acme --name "Acme" --dry-run
 *
 * Three registry edits and one new module:
 *
 *   lib/arcs/clients.ts             the client record, if it is missing
 *   lib/arcs/registry.ts            the import and the entry
 *   lib/arcs/content/<slug>.ts      the proposal, from the skeleton
 *
 * ⚠ EVERY EDIT IS FAIL-LOUD. `must()` throws when its needle is gone, so a
 * refactor that moves one of these files breaks this script LOUDLY rather
 * than leaving it to write half a scaffold and report success. That is the
 * deck generator's own idiom, and it is the reason this can be run
 * unattended by Armada's day-one command.
 *
 * ⚠ IT NEVER COMMITS, and it never overwrites. A slug that already exists
 * is a refusal, because standing a page up over live work is not
 * recoverable from a script.
 *
 * ⚠ TWO ROWS ARE THE PERSON'S, AND IT SAYS SO LOUDLY. `HERO_ROUTES` and
 * `LIGHT_LOCKED_ROUTES` are hand-written because nothing derives them, and
 * both are pinned `toEqual` by their own tests precisely so a route joins
 * or leaves by a reviewed hand. A scaffold that wrote the rows would have
 * to edit those two tests as well — a generator quieting its own guards —
 * so it prints them instead.
 *
 * The end-to-end run shows the contract working: the scaffolded arc
 * typechecks and 22 of 23 registry guards pass, with the one failure
 * naming the missing row. That is the guard doing its job, not a defect.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import { constantCase, proposalModule, FILL_IN } from "./new-arc/proposalTemplate.mjs";

const arg = (flag, fallback = "") => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : fallback;
};
const DRY = process.argv.includes("--dry-run");

const CLIENT = arg("--client");
const NAME = arg("--name", CLIENT);
const ENGAGEMENT = arg("--engagement", "proposal");
const KIND = arg("--kind", "production");
/* The day the engagement is filed (ADR-118) — the overview plots it. Local
   date, today unless `--date` says otherwise. */
const DATE = arg("--date", new Date().toLocaleDateString("en-CA"));

const die = (msg) => {
  console.error("\n  " + msg + "\n");
  process.exit(1);
};

const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
if (!CLIENT) die('a client slug is required: --client suri --name "Suri"');
if (!kebab.test(CLIENT)) die(`--client must be kebab-case: ${CLIENT}`);
if (!kebab.test(ENGAGEMENT)) die(`--engagement must be kebab-case: ${ENGAGEMENT}`);
if (!["keynote", "workshop", "production"].includes(KIND)) die(`unknown --kind: ${KIND}`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE)) die(`--date must be YYYY-MM-DD: ${DATE}`);

const SLUG = `${CLIENT}-${ENGAGEMENT}`;
const CONST = `${constantCase(SLUG)}_ARC`;
const MODULE = path.join("lib", "arcs", "content", `${SLUG}.ts`);

/** Replace exactly once, or throw. A needle that is gone is a moved file,
 *  and a scaffold that silently skips an edit is worse than one that stops. */
function must(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    die(`could not find the ${label} in its file. The scaffold refuses to guess; fix this script.`);
  }
  return source.replace(needle, replacement);
}

const read = (rel) => readFileSync(rel, "utf8");
const writes = [];
const plan = (rel, body) => writes.push([rel, body]);

// ── 1 · the content module ───────────────────────────────────────────────
if (existsSync(MODULE)) {
  die(`${MODULE} already exists. Standing a page up over live work is not recoverable.`);
}
plan(MODULE, proposalModule({ client: CLIENT, name: NAME, engagement: ENGAGEMENT, kind: KIND, date: DATE }));

// ── 2 · the client record, if it is missing ──────────────────────────────
const clientsRel = path.join("lib", "arcs", "clients.ts");
let clients = read(clientsRel);
const clientKnown = new RegExp(`slug:\\s*"${CLIENT}"`).test(clients);
if (!clientKnown) {
  const record = `export const ${constantCase(CLIENT)}_CLIENT: ClientDef = {
  slug: ${JSON.stringify(CLIENT)},
  name: ${JSON.stringify(NAME)},
  lede: ${JSON.stringify(`An engagement with ${NAME}.`)},
  // The year the relationship began (ADR-114) — the filing year until you say otherwise.
  since: ${JSON.stringify(DATE.slice(0, 4))},
};

`;
  clients = must(
    clients,
    "/** Every client with an engagement on the site, in the order the overview",
    record + "/** Every client with an engagement on the site, in the order the overview",
    "clients.ts record block"
  );
  clients = must(
    clients,
    "export const CLIENTS: readonly ClientDef[] = [",
    `export const CLIENTS: readonly ClientDef[] = [${constantCase(CLIENT)}_CLIENT, `,
    "CLIENTS array"
  );
  plan(clientsRel, clients);
}

// ── 3 · the registry ─────────────────────────────────────────────────────
const registryRel = path.join("lib", "arcs", "registry.ts");
let registry = read(registryRel);
if (registry.includes(CONST)) die(`${CONST} is already registered.`);
registry = must(
  registry,
  'import type { ArcDef } from "./types";',
  `import { ${CONST} } from "./content/${SLUG}";\nimport type { ArcDef } from "./types";`,
  "registry import block"
);
registry = must(
  registry,
  "export const ARCS: readonly ArcDef[] = [",
  `export const ARCS: readonly ArcDef[] = [\n  ${CONST},`,
  "ARCS array"
);
plan(registryRel, registry);

// ── report ───────────────────────────────────────────────────────────────
console.log();
console.log(`  ${NAME} · ${ENGAGEMENT}`);
for (const [rel] of writes) console.log(`  ${DRY ? "would write" : "write"}   ${rel}`);
if (clientKnown) console.log(`  client     ${CLIENT} already on file, left alone`);

if (!DRY) for (const [rel, body] of writes) writeFileSync(rel, body, "utf8");

console.log();
console.log("  TWO ROWS ARE YOURS. Until both are in, `npm run verify` fails on the guard");
console.log("  that says a locked arc needs its row, which is that guard working:");
console.log(`    lib/theme/heroPreload.ts    HERO_ROUTES         += "/arcs/${SLUG}"`);
console.log(`    lib/theme/themeLock.ts      LIGHT_LOCKED_ROUTES += "/arcs/${SLUG}"`);
console.log("    and the same row in their two pinned tests (hero-preload, theme-lock).");
console.log();
console.log("  then fill in, in this order:");
FILL_IN.forEach((what, i) => console.log(`    ${i + 1}. ${what}`));
console.log();
console.log("  then:  npm run verify");
console.log(`         node scripts/capture-arc-portfolio.mjs --slug ${SLUG} --vp 1280x720`);
console.log();
console.log(`  http://localhost:3003/arcs/${SLUG}`);
console.log(`  https://thoughtform.co/arcs/${SLUG}`);
console.log();
if (DRY) console.log("  dry run: nothing written.\n");
