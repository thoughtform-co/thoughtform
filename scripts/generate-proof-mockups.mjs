/**
 * generate-proof-mockups — image-model mockup slates for the proof pass.
 *
 * Runs a curated prompt manifest against Gemini (Nano Banana 2) and OpenAI
 * (gpt-image-2) using plain `fetch` on Node 20+, so no npm deps land in the
 * lockfile (npm-supply-chain-defense). Reads GEMINI_API_KEY and OPENAI_API_KEY
 * from .env.local (falling back to .env). Writes PNGs into
 * docs/design/proof-pass/slates/**.
 *
 * Usage:
 *   node scripts/generate-proof-mockups.mjs                  # all directions, both models
 *   node scripts/generate-proof-mockups.mjs --only r01a      # single id
 *   node scripts/generate-proof-mockups.mjs --model gemini   # only NB2
 *   node scripts/generate-proof-mockups.mjs --model openai   # only gpt-image-2
 *
 * Prompts are grounded in the Thoughtform token set (void black, parchment
 * ink, antique gold, PT Mono chrome, PP Neue Montreal prose, chamfered TR+BL
 * housings, zero radius, hairline rules) and the reference set the owner
 * supplied (Cyberpunk 2077 panels, Returnal status HUD, Destiny/Starfield
 * star-charts, Genshin character sheet, Evangelion cascade). Mockups are
 * COMPOSITION STUDIES — production copy comes from lib/cases/ (ADR-083).
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const ONLY = argOf("--only", null);
const MODEL_FILTER = argOf("--model", "both");
const OUT_ROOT = argOf("--out", "docs/design/proof-pass/slates");
const DRY = args.includes("--dry");

/* ------------------------------------------------------------------ env */

async function loadEnv() {
  const files = [".env.local", ".env"];
  const merged = {};
  for (const rel of files) {
    const path = resolve(ROOT, rel);
    try {
      await access(path, FS.R_OK);
      const raw = await readFile(path, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        let [, k, v] = m;
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
        if (!(k in merged)) merged[k] = v;
      }
    } catch {
      /* absent is fine */
    }
  }
  return merged;
}

/* ---------------------------------------------------------- brand prelude */

const BRAND_PRELUDE = `
BRAND TOKENS (obey exactly):
  — Ground: void black background, #0A0908 (a warm near-black, not pure black).
  — Ink: parchment cream, #EBE3D6, used for primary type and hairline rules.
  — Accent: antique gold, #CAA554, used ONLY for wayfinding — active state,
    selected row, index tick — never as decorative fill.
  — Type: PT Mono for chrome / captions / codes; PP Neue Montreal for titles.
    Everything uppercase in chrome. No script fonts, no neon glow, no
    holographic sheen, no chromatic aberration.
  — Geometry: zero corner radius. Housings carry a machined TR+BL chamfer
    (two diagonal cuts on top-right and bottom-left corners). Children of a
    chamfered housing are square. No rounded rectangles anywhere.
  — Rules: 1px hairlines, cream at ~30% opacity for chrome, at ~10% for grid.
  — NO ordinals invented for effect, NO invented digits, NO scanlines, NO
    dot-matrix decoration, NO CRT curvature, NO literal Cyberpunk branding
    or medical semantics, NO neon cyan/magenta.

REFERENCE POSTURE (patterns, not styling):
  — Cyberpunk 2077 shard/database panels — dense chrome labels, one clear
    hero region, ledger-style rows, one hairline underline for active tab.
  — Returnal status HUD — sharp rectilinear panels, restrained accents,
    machined corners, one active row lit gold.
  — Destiny/Starfield star charts — sparse nodes over dark field with
    concentric hairline orbits, a right-side travel-data rail.
  — Evangelion cascade / MAGI panels — heavy left-to-right chain of modules
    on a bus spine.

This is a COMPOSITION STUDY for a Next.js site, rendered as a single dark
PNG with no browser chrome around it. Nothing outside the artifact.
`.trim();

/* ---------------------------------------------------------- prompt slate */

const SLATE = [
  /* ---------- READING 01 — THE WORK ---------- */
  {
    id: "r01a",
    dir: "reading-01",
    title: "Reading 01 · A · LEDGER + HERO",
    aspect: "16:9",
    /* Ledger + hero: a left column of small rows names the workstreams, one
       is selected and expanded into a large detail cartridge on the right. */
    prompt: `
${BRAND_PRELUDE}

COMPOSITION — READING 01, VARIATION A · LEDGER + HERO:
A widescreen interior panel from a retro-futuristic PDA console. The panel is
divided into TWO regions by a single vertical hairline rule:

  LEFT (about 42% of the width): a vertical LEDGER. A small uppercase heading
  in PT Mono at the top reads INDEX · STREAMS BY TEAM · 20 / 27. Below that,
  a scrolling list of 20 rows grouped under five uppercase district labels
  (CREATIVE + STUDIO, ECOMM + MARKETPLACE, LEGAL + RISK, FINANCE, DESIGN).
  Each row is one line high, with a small filled diamond glyph on the left
  (parchment cream), a stream code in mono, a stream title in a compact PP
  Neue Montreal, and a lane tag (EVERYDAY, FAST, DEEP, PERSON-LED) right-
  aligned. One row is SELECTED — a subtle gold underline runs beneath it and
  a small gold caret sits at its right edge, pointing into the hero.

  RIGHT (about 58% of the width): the HERO cartridge — one large machined
  card, TR+BL chamfer, dense but calm. Header row shows: a small state glyph,
  the district code CRE, and the stream code W-021. The title CREATIVE
  BRIEFING sits below in PP Neue Montreal, roughly 2× the ledger's title
  weight. Under that, a four-line meta cluster (LANE · DEEP, AUTONOMY ·
  PERSON-LED, VOLUME · 4× WEEKLY, MASS · MEDIUM). Under that, a horizontal
  four-cell LANE METER — four small square cells laid in a row, the first
  two lit in cream at ~85% and the last two at ~15%, with the tier name FAST
  lettered below in mono. At the bottom-right corner, a small gold badge
  reading OPEN → sits over the chamfer.

Overall type feels calm and readable — the ledger is at a comfortable
reading size, the hero title is prominent, no label is under 10 pixels.
Ambient panel background is warm void black. Rendered as a single high-
resolution image, no browser or OS chrome, no drop shadows.
`.trim(),
  },
  {
    id: "r01b",
    dir: "reading-01",
    title: "Reading 01 · B · SHEET PAGER",
    aspect: "16:9",
    /* Sheet pager: 8 large cartridges laid out in a 4×2 sheet, with a small
       pager chrome band along the bottom. */
    prompt: `
${BRAND_PRELUDE}

COMPOSITION — READING 01, VARIATION B · SHEET PAGER:
A widescreen interior panel from a retro-futuristic PDA console showing a
SHEET of 8 large workstream cartridges in a 4-column × 2-row grid. The
cartridges breathe — generous gutters (roughly 20px) between them; nothing
touches the outer frame closer than 24px.

Each cartridge has a TR+BL chamfered housing, hairline stroke in cream at
~35%, and inside:
  — Header row: small state glyph on the left, district code (three letters
    in mono, e.g. CRE, ECM, LEG, FIN), and stream code (W-021 etc.) on the
    right; a single hairline rule under the header.
  — Title in PP Neue Montreal uppercase, up to two lines, ~14px effective.
  — A short compact caption line in mono (e.g. "AD VARIANT SETS", "NDA
    REVIEW"), ~10px.
  — Foot: a four-cell LANE METER on the left, lane name on the right
    (EVERYDAY, FAST, DEEP, PERSON-LED). No filled color badges — a lit cell
    in cream reads as active.

Along the BOTTOM of the panel: a slim pager chrome band with the label
SHEET · 01 / 03 in mono on the left, five dot marks in the centre with the
first lit in gold, and small ← / → glyphs on the right. Above the pager, a
tiny meta strip reads INDEX · STREAMS BY TEAM · SHOWN 8 OF 27.

Void black ground, parchment ink, restrained gold on the ACTIVE pager dot
only. No holograms, no glow, no scanlines. Machined, technical, calm.
`.trim(),
  },
  {
    id: "r01c",
    dir: "reading-01",
    title: "Reading 01 · C · DISTRICT STACKS",
    aspect: "16:9",
    /* District stacks: five vertical bands (one per team/district), each
       band holds a stack of 4-5 workstream cards fanned open. */
    prompt: `
${BRAND_PRELUDE}

COMPOSITION — READING 01, VARIATION C · DISTRICT STACKS:
A widescreen interior panel from a retro-futuristic PDA console divided
into FIVE vertical bands by four hairline rules. Each band represents a
team district and is labelled at the top in mono, all uppercase:
CREATIVE + STUDIO · ECOMM + MARKETPLACE · LEGAL + RISK · FINANCE · DESIGN.
Beside each label is a small count (e.g. 04 / 20).

Inside each band, a STACK of 3–5 workstream cards is fanned open vertically,
one under the next, each card slightly overlapping the top of the one below
by ~8px so the stack reads as a physical bundle of cards on a shelf. Cards
have TR+BL chamfers and are square-cornered otherwise. Each card shows:
  — A one-line header: district code + stream code (small mono, cream 60%).
  — A one-line uppercase title in PP Neue Montreal, ~13px effective.
  — A four-cell lane meter along the foot, with the active tier lit cream.

One card in one band is SELECTED — pulled up and out of its stack by
~14px, its stroke goes cream at 100%, and a gold hairline underline runs
its full width. Every other card sits at parchment ~35% stroke.

At the top of the panel, a slim meta strip reads INDEX · STREAMS BY TEAM ·
20 / 27. Void black ground. No glows, no gradients, no shadows past the
subtle card-overlap seam. Machined and calm.
`.trim(),
  },

  /* ---------- READING 03 — THE SUBSTRATE (replace the pie) ---------- */
  {
    id: "r03a",
    dir: "reading-03",
    title: "Reading 03 · A · REGISTRY BANDS",
    aspect: "16:9",
    /* Registry bands: 5 horizontal shape bands, 47 skill plates seated in
       rows, area proportional to skill count. */
    prompt: `
${BRAND_PRELUDE}

COMPOSITION — READING 03, VARIATION A · REGISTRY BANDS:
A widescreen interior panel from a retro-futuristic PDA console showing
the "substrate" of 47 named skills. The panel is divided top-to-bottom into
FIVE horizontal bands by four 1-unit hairline rules (grout, not gutters).
The bands' heights are proportional to their skill counts, so a band with
14 skills is taller than one with 5:

  1. PATTERN — 14 skills (largest band, top)
  2. JUDGMENT — 12 skills
  3. VALIDATION — 9 skills
  4. VOICE — 7 skills
  5. STAKEHOLDER — 5 skills (smallest band, bottom)

Each band shows, on the LEFT, a short vertical head:
  — Shape name in PP Neue Montreal uppercase (e.g. PATTERN), ~16px.
  — Small mono count "14 SKILLS", ~10px.
  — A single sentence caption in PP Neue Montreal, ≤96 characters,
    describing what the shape MEANS (e.g. "the reflex the studio keeps
    reusing across every brief").

The REMAINING width of each band is a dense grid of small NAMED SKILL
plates. Each plate is a square-cornered mini-cartridge with a hairline
stroke, no chamfer, holding a single 2-word skill name in mono, uppercase,
~9.5px (e.g. FEEDBACK, LOCALIZATION, SUPPLIER QA, ASSET BRIEFS). Plates
tile with a 4px gap in a wrapping grid that fills the band. The active
band (PATTERN) has its plates lit at cream 100%; the other four bands
sit at cream 40%.

Optional: a light-material physics field peeks through the plate spacing
in each band, hinting at the material the skill was extracted from
(honeycomb for pattern, dashed cross for validation, etc.) — kept faint,
~5% opacity, never dominant. No pie, no dial, no radial anything. This is
a REGISTRY — rectilinear, editorial, sortable.

Void black ground, hairlines cream 30%, no gold except in the ACTIVE band's
left-edge tick. Machined, tabular, calm.
`.trim(),
  },
  {
    id: "r03b",
    dir: "reading-03",
    title: "Reading 03 · B · CONSTELLATION FIELD",
    aspect: "16:9",
    /* Constellation: nodes over a dark starfield, with a right-side travel-
       data readout like Starfield/Destiny star maps. */
    prompt: `
${BRAND_PRELUDE}

COMPOSITION — READING 03, VARIATION B · CONSTELLATION FIELD:
A widescreen interior panel from a retro-futuristic PDA console showing
the "substrate" of skills as a sparse CONSTELLATION FIELD over dark space,
with a right-side data rail — the composition posture of a Destiny star
map or a Starfield sector chart, but stripped of neon colour and rendered
in Thoughtform tokens.

LEFT / CENTRE (about 68% of the width): a dark void black field lightly
grained with a 5% cream noise. Five diffuse "shape halos" arranged in a
loose spread — each halo is a very faint (~8% opacity) cream ring circle
about 220px across, labelled at its top with the shape name in mono
(PATTERN · JUDGMENT · VALIDATION · VOICE · STAKEHOLDER). Inside each halo,
scattered NODES (small filled cream diamonds, 4–6px each) represent the
skills inside that shape — 14 in PATTERN, 12 in JUDGMENT, 9 in VALIDATION,
7 in VOICE, 5 in STAKEHOLDER. Nodes never touch. Two or three nodes across
the whole field carry a thin cream hairline connecting them to a neighbour
in a different halo — hinting at cross-shape links, sparse and quiet.

One node in PATTERN is SELECTED. It is drawn a touch larger and given a
short gold hairline TICK pointing to a small labelled callout in mono
above it: PATTERN · FEEDBACK.

RIGHT (about 32% of the width): a machined TRAVEL DATA rail, cream hairline
housing with TR+BL chamfer. Inside, a small heading in mono reads SELECTED
· PATTERN · FEEDBACK. Below that, four data rows on hairline underlines:
  SHAPE            PATTERN
  ENCODED ONCE     LOOP · CREATIVE  
  TAPPED BY        5 STREAMS
  MATERIAL         HONEYCOMB
Under those rows, one paragraph of PP Neue Montreal prose, ≤2 short lines,
naming what the shape MEANS in the studio's language. At the very bottom,
one small square gold CTA-style button: OPEN STREAM (uppercase mono).

Overall the panel reads as an atlas: dark, quiet, one thing lit, one thing
read. No stars beyond the diffuse noise; no swirl, no bloom, no aurora.
`.trim(),
  },
  {
    id: "r03c",
    dir: "reading-03",
    title: "Reading 03 · C · BACKPLANE RACK",
    aspect: "16:9",
    /* Backplane rack: five shape modules seated on one bus spine, using
       reading 02's PCB grammar so 02 reads as a zoom-in of 03. */
    prompt: `
${BRAND_PRELUDE}

COMPOSITION — READING 03, VARIATION C · BACKPLANE RACK:
A widescreen interior panel from a retro-futuristic PDA console showing
the "substrate" of five skill shapes as MODULES seated on a shared BUS
SPINE — the drawing language of a technical schematic (Evangelion MAGI
cascade meets a rack diagram), and a deliberate visual rhyme with the
reading 02 configuration board so the two panels read as ZOOM levels of
the same machine.

A single horizontal BUS SPINE runs across the panel about 1/3 of the way
down from the top — a thick cream rail with 8 hairline conductor lines
inside it (like a ribbon cable). Five square-cornered MODULES sit UNDER
the bus, each ~180px wide, connected to the bus by a short 2-lane ribbon
lane. From left to right:

  PATTERN · JUDGMENT · VALIDATION · VOICE · STAKEHOLDER

Each module is a small technical cartridge:
  — TR+BL chamfered housing, hairline stroke in cream 40%.
  — Header row: shape name in PP Neue Montreal uppercase; small mono count
    "14 SK". A single hairline rule under the header.
  — Body: a dense array of 6–14 small square-cornered SKILL PADS (4×3 or
    similar), each pad labelled with a 2-word skill name in mono, ~8px.
    Pads have hairline strokes and no chamfer. The active band's pads sit
    at cream 100%; the others at cream 45%.
  — Foot: one short caption in PP Neue Montreal, ≤48 characters, describing
    the module's meaning. Under the caption, a small connector footprint
    (three little squares) indicating the module's bus takeoff.

Above the bus spine and to the left, a small MODULE HEAD stub reads:
SUBSTRATE · 47 SKILLS · 5 SHAPES. To the right of the bus, above the last
module, a small gold TICK marks the ACTIVE module.

Below the bus, in the empty gutter between the modules, a very faint
material field (~6% opacity) hints at each shape's substrate (honeycomb,
dashed cross, etc.).

The palette is void black + parchment cream, gold on the ACTIVE tick and
nothing else. This must FEEL like the same hand drew reading 02 — same
PCB posture, same ribbons, same square skill pads, same hairline discipline.
`.trim(),
  },

  /* ---------- MOBILE — seat interior polish studies (IA fixed) ---------- */
  {
    id: "m01",
    dir: "mobile",
    title: "Mobile · A · MAP SEAT AS DESIGNED CARD",
    aspect: "9:16",
    /* Mobile — designed map seat (map track ARTIFACT view) */
    prompt: `
${BRAND_PRELUDE}

COMPOSITION — MOBILE PHONE SCREEN, 9:16, ~390×844:
A single tall phone screen for a retro-futuristic PDA-style casefile. The
information architecture is FIXED (ADR-083) and must be honoured — this
study is only about the SEAT INTERIOR quality for the map track. Top to
bottom:

  1. PROOF / LOOP EARPLUGS — a slim mono header row, hairline rule under.
     Right side reads CASE / 01 OF 04 in mono. Cream 60% ink.
  2. INTELLIGENCE MAP. — big PP Neue Montreal display type, uppercase,
     tightly kerned. Below it in mono, cream 70%: AI ADOPTION · MARKETING
     → COMPANY-WIDE · 2024 — ACTIVE.
  3. BRIEF · PROOF · ARTIFACT — three text buttons on a single row,
     equal-width, each 44px tall. ARTIFACT is selected — a gold hairline
     UNDERLINE sits under its label; the other two are cream 50%.
  4. THE SEAT (this is the study). A machined rectangular content region,
     TR+BL chamfer, hairline stroke, roughly 340px tall. Inside, a compact
     mobile version of the "streams by team" register:
       — A small head row: INDEX · STREAMS BY TEAM · 20 / 27, mono.
       — 3 tappable district accordions, each a horizontal band ~72px tall.
         Each band header: a small filled diamond glyph, district code
         (CREATIVE + STUDIO, ECOMM + MARKETPLACE, LEGAL + RISK), stream
         count on the right (05, 05, 03), and a small chevron.
       — One district is EXPANDED (CREATIVE + STUDIO) — it reveals a mini
         table of its streams as rows: title in PP Neue Montreal, lane tag
         in mono on the right (EVERYDAY / FAST / DEEP / PERSON-LED).
       — One row inside CREATIVE + STUDIO is SELECTED — gold hairline
         underline, small caret at right.
     The seat's interior scrolls locally — a very faint 2-unit scroll
     indicator sits on the right edge inside the seat.
  5. Meta strip: 27 MODULES · 47 SKILLS · 19 / 24 REUSED, mono, ~10px,
     hairline rule above and below.
  6. Case rail — a horizontal bar with left/right arrow glyphs and four
     equal-width case stops: 01 · 02 · 03 · 04. The current stop (01) is
     highlighted with a small gold TICK below it, its label a touch heavier.

Void black ground; every hairline in cream at 30–40%; gold only on the
active mode underline and the case-rail tick. No shadows, no gradients, no
scanlines, no glow. Everything crisp and machined, but with real air —
minimum 12px between sections, minimum 16px inset from the phone edge.
`.trim(),
  },
  {
    id: "m02",
    dir: "mobile",
    title: "Mobile · B · TOOLS SEAT AS DOSSIER",
    aspect: "9:16",
    /* Mobile — tools track ARTIFACT view, one-tool-at-a-time dossier */
    prompt: `
${BRAND_PRELUDE}

COMPOSITION — MOBILE PHONE SCREEN, 9:16, ~390×844:
A single tall phone screen for the same casefile, but this time on the
TOOLS track (case 02). Top-to-bottom structure identical to ADR-083:

  1. PROOF / LOOP EARPLUGS header, CASE / 02 OF 04 right-aligned.
  2. Case title in PP Neue Montreal display: SOFTWARE STACK.
     Sub-line in mono: FOUR TOOLS · IN-HOUSE · SHIPPED 2024–2025.
  3. BRIEF · PROOF · ARTIFACT — ARTIFACT selected (gold underline).
  4. THE SEAT (this is the study). A TR+BL chamfered content region ~440px
     tall carrying a ONE-TOOL DOSSIER. Its interior:
       — A slim tool switcher along the seat's top: four labels
         MIMIR · VESPER · BABYLON · HEIMDALL. VESPER is selected — a gold
         hairline tick underneath.
       — Below the switcher, the DOSSIER for Vesper:
         Column 1 (left, ~55% wide): a small authored WIREFRAME sketch of
           the Vesper interface — a card labelled PROMPT with an image
           glyph, and a composer row with the placeholder "Loop Switch,
           golden hour" and a small square button reading GENERATE. All
           in cream hairlines against void black, no fills.
         Column 2 (right, ~45% wide): a small technical INDEX — four data
           rows on hairline underlines, mono uppercase, cream 70%:
             PROGRAM     PAID SOCIAL RENDERER
             MODEL       NANO BANANA
             AUTONOMY    PERSON-LED
             SHIPPED     Q3 2024
         Under the index, one small paragraph of PP Neue Montreal prose,
         ≤2 short lines, describing what Vesper actually does.
  5. Meta strip: 4 TOOLS · 12 CAPABILITIES · 3 IN PROD, mono.
  6. Case rail as before, this time 02 is the current stop.

Same tokens: void black, cream ink, gold ONLY on the tool-switch tick and
the case-rail tick. Real air between sections. Compact but readable.
`.trim(),
  },
];

/* ---------------------------------------------------------- image APIs */

async function callGemini(env, item) {
  const key = env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing from env");

  const model = "gemini-2.5-flash-image";
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
    `?key=${encodeURIComponent(key)}`;

  const aspectHint =
    item.aspect === "9:16"
      ? "Portrait orientation, 9:16 aspect ratio."
      : "Landscape orientation, 16:9 aspect ratio.";

  const body = {
    contents: [
      {
        parts: [{ text: `${item.prompt}\n\n${aspectHint}` }],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: item.aspect === "9:16" ? "9:16" : "16:9",
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`gemini ${res.status}: ${detail.slice(0, 400)}`);
  }
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find(
    (p) => p?.inlineData?.mimeType?.startsWith("image/") || p?.inline_data?.mime_type?.startsWith("image/")
  );
  if (!imgPart) {
    const finish = json?.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(`gemini returned no image (finish: ${finish})`);
  }
  const b64 = imgPart?.inlineData?.data ?? imgPart?.inline_data?.data;
  return Buffer.from(b64, "base64");
}

async function callOpenAI(env, item) {
  const key = env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing from env");

  const size = item.aspect === "9:16" ? "1024x1536" : "1536x1024";
  const body = {
    model: "gpt-image-1",
    prompt: item.prompt,
    size,
    n: 1,
    quality: "high",
    output_format: "png",
  };

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`openai ${res.status}: ${detail.slice(0, 400)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("openai returned no b64_json");
  return Buffer.from(b64, "base64");
}

/* ---------------------------------------------------------- driver */

const env = await loadEnv();
const model = MODEL_FILTER;

const runList = SLATE.filter((s) => !ONLY || s.id === ONLY);
if (runList.length === 0) {
  console.error(`no items matched --only ${ONLY}. Ids: ${SLATE.map((s) => s.id).join(", ")}`);
  process.exit(1);
}

const outRoot = resolve(ROOT, OUT_ROOT);
for (const dir of new Set(runList.map((s) => s.dir))) {
  await mkdir(resolve(outRoot, dir), { recursive: true });
}

let ok = 0;
let fail = 0;

for (const item of runList) {
  const targets = [];
  if (model === "both" || model === "gemini") targets.push({ tag: "nb2", fn: callGemini });
  if (model === "both" || model === "openai") targets.push({ tag: "gpt", fn: callOpenAI });

  for (const t of targets) {
    const outPath = resolve(outRoot, item.dir, `${item.id}_${t.tag}.png`);
    const label = `${item.id} ${t.tag.padEnd(3)} ${item.title}`;
    if (DRY) {
      console.log(`[dry] ${label} → ${outPath}`);
      continue;
    }
    process.stdout.write(`… ${label}\n`);
    try {
      const buf = await t.fn(env, item);
      await writeFile(outPath, buf);
      const kb = Math.round(buf.length / 1024);
      console.log(`  ✓ ${kb} KB → ${outPath.replace(outRoot + "\\", "").replace(outRoot + "/", "")}`);
      ok += 1;
    } catch (err) {
      console.log(`  ✗ ${err.message ?? err}`);
      fail += 1;
    }
  }
}

console.log(`\ndone — ${ok} ok, ${fail} fail, root ${OUT_ROOT}/`);
