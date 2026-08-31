/**
 * generate-era-stage-mockups — image-model mockup slates for the Voidwalker
 * era stage (ADR-082) UI pass.
 *
 * The figure is settled; the PANELS are not. The owner's verdict on the live
 * stage is "a glorified PowerPoint" — SCOPE / TRANSMISSION / FACTS / ON RECORD
 * are a kicker, a hairline and some text, floating in open void with no shared
 * datum. Note the trap recorded in voidwalker-hologram.css:605 — the CURRENT
 * unboxed treatment was itself the fix for the first PowerPoint verdict
 * (bordered cards, rejected 2026-08-26). So the question is not boxes vs. bare
 * text; it is INTEGRATION — what structure ties the panels to each other and
 * to the figure, which is exactly what the Starfield reference does.
 *
 * Runs a curated slate against Gemini (Nano Banana 2 / Pro) and OpenAI
 * (GPT Image 2) using plain `fetch` on Node 20+, so no npm deps land in the
 * lockfile (npm-supply-chain-defense). Reads GEMINI_API_KEY and OPENAI_API_KEY
 * from .env.local (falling back to .env).
 *
 * Differences from the ADR-085 precedent (scripts/generate-proof-mockups.mjs),
 * all deliberate — that script is one model generation stale:
 *   — Gemini key rides the x-goog-api-key HEADER, never the query string
 *     (genai-prompting/references/execution.md: a query string leaks the key
 *     into logs, proxies and referrer headers).
 *   — Model ids verified live against models.list() on 2026-08-31:
 *     gemini-3.1-flash-image (NB2) and gemini-3-pro-image (NB Pro).
 *   — GPT Image 2 goes to /v1/images/EDITS as multipart, because references
 *     do not work on /generations. It does NOT take input_fidelity (a
 *     gpt-image-1 parameter; gpt-image-2 400s on it).
 *   — Every job carries reference images, and every prompt describes them by
 *     VISUAL CONTENT, never by position — uploads can arrive in any order.
 *   — One JSON sidecar per image. In an exploratory phase the sidecar is the
 *     eval data.
 *
 * Usage:
 *   node scripts/generate-era-stage-mockups.mjs --dry      # print the slate
 *   node scripts/generate-era-stage-mockups.mjs            # everything
 *   node scripts/generate-era-stage-mockups.mjs --only a1
 *   node scripts/generate-era-stage-mockups.mjs --slate desktop
 *   node scripts/generate-era-stage-mockups.mjs --model openai
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { dirname, resolve, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const ONLY = argOf("--only", null);
const SLATE_FILTER = argOf("--slate", null);
const MODEL_FILTER = argOf("--model", "both");
const OUT_ROOT = argOf("--out", "docs/design/era-stage-pass/slates");
const DRY = args.includes("--dry");

/* ------------------------------------------------------------------ env */

async function loadEnv() {
  const merged = {};
  for (const rel of [".env.local", ".env"]) {
    try {
      const path = resolve(ROOT, rel);
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

/* ------------------------------------------------------- reference images */

/* The stage as it stands, and the game references the owner dropped into the
   Character board this morning. Mime is MAPPED from the extension, never
   guessed — a wrong mime is a silent 400 on both APIs. */
const REF_DIR = "I:/My Drive/01_Thoughtform Branding/07_Artifacts Branding/_01_GENERAL REFERENCES";

const REFS = {
  stage: resolve(ROOT, "shots/v10-owner/1920x1247_dark_azeroth.png"),
  starfield: `${REF_DIR}/Character/starfield-character-info.png`,
  pipboy: `${REF_DIR}/Character/Fallout PIP Boy.jpg`,
  selection: `${REF_DIR}/Scifi Character Selection Screen.png`,
  cyberpunk: `${REF_DIR}/Character/cyberpunk-2077-character-database.png`,
  /* Wave-1 outputs the owner kept — wave 2 re-anchors the FIGURE to the live
     stage capture and takes only STRUCTURE from these. */
  w1band: resolve(ROOT, "docs/design/era-stage-pass/slates/desktop/a2_gpt.png"),
  w1tether: resolve(ROOT, "docs/design/era-stage-pass/slates/desktop/a4_gpt.png"),
  w1chips: resolve(ROOT, "docs/design/era-stage-pass/slates/desktop/a2_nb.png"),
  w1mobile: resolve(ROOT, "docs/design/era-stage-pass/slates/mobile/b1_gpt.png"),
  w1facts: resolve(ROOT, "docs/design/era-stage-pass/slates/panels/c1_gpt.png"),
  w1record: resolve(ROOT, "docs/design/era-stage-pass/slates/panels/c2_gpt.png"),
};

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function mimeOf(path) {
  const m = MIME[extname(path).toLowerCase()];
  if (!m) throw new Error(`unmapped reference extension: ${path}`);
  return m;
}

async function readRef(path) {
  const buf = await readFile(path);
  return { buf, mime: mimeOf(path), name: basename(path) };
}

/* ---------------------------------------------------------- brand prelude */

const BRAND = `
THOUGHTFORM TOKENS — obey exactly, these are the live CSS values:
  — Ground: warm void black #0A0908. Never pure black, never blue-black,
    never a cool grey-blue tint.
  — Ink: parchment cream #EBE3D6 for type and hairline rules, stepped down
    in opacity (70% for secondary, 40% for chrome, 25-30% for rules).
  — Accent: antique gold #CAA554, and it is WAYFINDING ONLY — the active
    era, the selected row, one index tick. Gold is never a decorative fill,
    never a panel background, never the colour of a title.
  — Type: PT Mono for all chrome (kickers, keys, codes, captions — uppercase,
    letterspaced). PP Neue Montreal for display titles and prose sentences.
    Two families, split by role. No third face, no script, no serif.
  — Geometry: ZERO corner radius anywhere. No rounded rectangles, no rounded
    avatar frames, no pills, no circles — a round indicator is a DIAMOND
    (a 45-degree square) in this system.
  — Machined housings carry a chamfer on the TOP-RIGHT and BOTTOM-LEFT
    corners only (two diagonal cuts on that one diagonal). The children of a
    chamfered housing are square-cornered.
  — Rules are 1px hairlines. Depth comes from surface progression, never from
    drop shadows, glows or blur.

BANNED, every one of these has been rejected on this surface before:
  neon cyan or magenta, purple or blue gradients, holographic sheen,
  chromatic aberration, CRT curvature, decorative scanline overlays,
  lens flare, bloom, glassmorphism, rounded cards, drop shadows, emoji,
  invented digits and fake ordinals, progress bars for things that are not
  quantities, health bars, XP meters, literal game or medical iconography,
  any visible browser chrome, window frame, cursor or operating-system UI.

This is a COMPOSITION STUDY for a section of a dark website, rendered as one
flat image. Nothing outside the artwork itself.
`.trim();

/* The record the drawing letters. An instrument draws a RECORD a reader could
   check; a drawing wearing instrument styling over invented content is a
   costume, and this house has rejected several. Every string below is the
   real Azeroth era from lib/voidwalker/characterEras.ts + voidwalkerData.ts. */
const RECORD = `
THE RECORD THIS PANEL LETTERS — use these exact strings, invent nothing:
  Era index kicker:  ERA / 03 OF 05
  Year:              2020
  Title:             The Azeroth teacher
  Motto (gold mono): Class moved into the game.
  SCOPE prose:       "COVID closed the campus, so the Online Communities
                     class moved inside World of Warcraft — Azeroth as the
                     field site — and Social Media Storytelling ran on
                     Instagram Live, Stories and DMs. Teaching is the exit
                     built into a calendar: the semester ends, the
                     capability stays."
  FACTS, four key/value rows:
                     FIELD SITE   Azeroth
                     COURSE       Online Communities
                     ALSO RAN     Social Media Storytelling
                     THE EXIT     Built into the calendar
  ON RECORD, one press item:
                     "Kids are sick of Zoom too — so their teachers are
                     getting creative"
                     MIT TECHNOLOGY REVIEW · 2020
  The five eras, newest first, for any era selector:
                     2026 ARCHITECT · 2022 LATENT LAND · 2020 AZEROTH ·
                     2018 THE EXPANSE · 2016 POKEMON GO
                     (2020 AZEROTH is the ACTIVE one.)
`.trim();

const FIGURE = `
THE FIGURE — preserve it, this is the one part that is already right:
The gold volumetric hologram of a broad-shouldered man in heavy fantasy
plate armour, standing frontally at rest, rendered as warm luminous gold
scan-lines against the void, with two small horned imp familiars flanking
him at his feet, and a flat elliptical gold projector disc glowing on the
ground beneath him. Keep this figure's colour, pose, scale and projector
disc essentially as it is. The REDESIGN is everything around it.
`.trim();

/* ---------------------------------------------------------- prompt slate */

const SLATE = [
  /* ================= SLATE A — desktop stage integration ================= */
  {
    id: "a1",
    dir: "desktop",
    slate: "desktop",
    title: "A1 · CHARACTER FILE (Starfield-close)",
    aspect: "16:9",
    refs: ["stage", "starfield"],
    prompt: `
${BRAND}

${RECORD}

${FIGURE}

REFERENCE IMAGE ROLES:
— The dark website section showing a gold armoured hologram figure between
  two columns of small cream text headings: THIS IS THE LAYOUT BEING
  REDESIGNED, and the SOURCE OF TRUTH for the figure, the gold palette and
  the void ground. Its four floating text panels are the PROBLEM — do not
  reproduce their placement.
— The dark science-fiction character screen with a spacesuited figure at
  centre, a vertical menu list at the left with one solid highlighted row,
  and a right-hand panel of section headings over full-width rules with
  icon-plus-label-plus-value readouts: STRUCTURAL REFERENCE ONLY. Adopt its
  ANATOMY — the left nav list, the single bounded right panel, the section
  heads on full-width rules, the readout grid. Do NOT adopt its colours
  (its cool blue-grey is banned here), its rounded avatar frame, its
  typefaces or any of its words.

COMPOSITION — A1 · CHARACTER FILE:
A widescreen section of a dark website. The gold hologram figure stands at
the CENTRE on its projector disc, unchanged. Everything around it is one
integrated instrument rather than floating text:

  LEFT COLUMN (about 22% of the width): the ERA REGISTER. A small PT Mono
  heading reads ERA REGISTER over a full-width hairline rule. Below it, five
  rows, one per era, each row a single line high with the year in mono at the
  left and the era name in PP Neue Montreal beside it:
      2026  ARCHITECT
      2022  LATENT LAND
      2020  AZEROTH
      2018  THE EXPANSE
      2016  POKEMON GO
  The 2020 AZEROTH row is ACTIVE: its type goes full-strength cream, a small
  filled gold diamond sits in the left margin against it, and a gold hairline
  runs under it. The other four rows sit at cream 45%. Every row shares one
  left alignment edge and one hairline rhythm so the list reads as a ladder.

  RIGHT COLUMN (about 30% of the width): ONE bounded dossier panel — a single
  machined housing with a TR+BL chamfer and a cream hairline stroke at 30%,
  running most of the section's height. It is ONE panel containing three
  stacked sections divided by full-width hairline rules, NOT three separate
  floating blocks:
     SECTION 1 — heading FACTS in PT Mono uppercase over its rule. Under it,
       the four fact rows as a readout grid: each row has a small outlined
       diamond glyph at the left, the key in mono uppercase cream 55%, and
       the value in PP Neue Montreal cream 100% right of it. Rows are evenly
       spaced on a shared baseline rhythm.
     SECTION 2 — heading SCOPE over its rule, then the motto line "Class
       moved into the game." in gold PT Mono, then the SCOPE prose paragraph
       in PP Neue Montreal cream 80%, five or six lines, generous leading.
     SECTION 3 — heading ON RECORD over its rule, then the press item: the
       outlet MIT TECHNOLOGY REVIEW and the year 2020 in small mono cream
       45% on one line, and the headline beneath it in PP Neue Montreal.

  TOP CENTRE, over the figure: the identity mast. Small mono kicker
  ERA / 03 OF 05 on the left and 2020 on the right of one narrow measure,
  then the title "The Azeroth teacher" in large PP Neue Montreal, centred.

The whole composition hangs off a shared top datum line and a shared bottom
datum line, so the left ladder, the figure and the right dossier all read as
parts of one machine. Void black ground, gold ONLY on the active era row,
its diamond, and the motto line. Calm, technical, generous with air.
`.trim(),
  },
  {
    id: "a2",
    dir: "desktop",
    slate: "desktop",
    title: "A2 · DECK SELECT (bottom era-thumbnail band)",
    aspect: "16:9",
    refs: ["stage", "selection"],
    prompt: `
${BRAND}

${RECORD}

${FIGURE}

REFERENCE IMAGE ROLES:
— The dark website section showing a gold armoured hologram figure flanked by
  small cream text headings: THIS IS THE LAYOUT BEING REDESIGNED, and the
  SOURCE OF TRUTH for the figure, the gold palette and the void ground.
— The dark character-selection screen with a large figure at centre, a name
  and ability list at the left, and a full-width horizontal strip of small
  square character portraits along the bottom with the selected one framed
  and raised: STRUCTURAL REFERENCE ONLY, for the BOTTOM SELECTOR BAND and
  the seated composition. Do NOT adopt its teal and purple palette, its
  glow, its rounded frames or any of its words.

COMPOSITION — A2 · DECK SELECT:
A widescreen section of a dark website. The gold hologram figure stands
centre on its projector disc. The integrating device is a FULL-WIDTH
SELECTOR BAND along the bottom that everything else sits on top of:

  THE BAND (bottom ~20% of the section): a full-width horizontal strip
  bounded above by a single cream hairline rule running edge to edge. Inside
  it, five equal era cells divided by short vertical hairline ticks. Each
  cell holds a small square era portrait — a gold scan-line hologram bust of
  the same man in that era's dress, about 96px square, square-cornered, no
  frame radius — with the year in PT Mono above it and the era name in mono
  below it:
      2026 ARCHITECT · 2022 LATENT LAND · 2020 AZEROTH ·
      2018 THE EXPANSE · 2016 POKEMON GO
  The AZEROTH cell is ACTIVE: its portrait sits at full gold strength while
  the other four are dimmed to cream 35% and desaturated, a gold hairline
  runs the full width of its cell directly on the band's top rule, and a
  small gold diamond sits centred above that rule. A thin vertical gold
  hairline rises from the active cell toward the projector disc, tying the
  selection to the figure.

  ABOVE THE BAND, left and right of the figure, two panels SEATED on the
  band — each one's bottom edge lands exactly on the band's top rule, so
  nothing floats:
     LEFT panel: heading SCOPE in mono over a full-width hairline; the motto
       "Class moved into the game." in gold mono; the SCOPE paragraph in PP
       Neue Montreal cream 80%. Beneath it, separated by one more hairline,
       heading TRANSMISSION with a small square film-frame placeholder and
       a mono caption reading NO FILM ON RECORD in cream 40%.
     RIGHT panel: heading FACTS in mono over a full-width hairline, then the
       four fact rows as key/value pairs on a shared baseline rhythm, keys in
       mono cream 55%, values in PP Neue Montreal. Beneath one more hairline,
       heading ON RECORD, then MIT TECHNOLOGY REVIEW · 2020 in small mono and
       the headline in PP Neue Montreal.

  TOP CENTRE: the mast — mono kicker ERA / 03 OF 05, the year 2020, and the
  title "The Azeroth teacher" in large PP Neue Montreal.

Void black ground; gold restricted to the active era cell, its rule, its
diamond and the motto. No glow around the thumbnails, no rounded corners,
no reflections. Machined and calm.
`.trim(),
  },
  {
    id: "a3",
    dir: "desktop",
    slate: "desktop",
    title: "A3 · CONSOLE BAY (one chamfered housing)",
    aspect: "16:9",
    refs: ["stage", "cyberpunk"],
    prompt: `
${BRAND}

${RECORD}

${FIGURE}

REFERENCE IMAGE ROLES:
— The dark website section showing a gold armoured hologram figure between
  floating cream text headings: THIS IS THE LAYOUT BEING REDESIGNED, and the
  SOURCE OF TRUTH for the figure, the gold palette and the void ground.
— The dark game database screen with a full-width row of icon-and-label tabs
  across the top, a column of hairline-bounded list rows at the left, and a
  character render beside a prose column at the right: STRUCTURAL REFERENCE
  ONLY, for the TOP COMMAND BAR that the layout hangs from. Do NOT adopt its
  red and cyan palette, its angled corner cuts, its glow or any of its words.

COMPOSITION — A3 · CONSOLE BAY:
A widescreen section of a dark website drawn as ONE machined console — a
single large housing with a TR+BL chamfer and a cream hairline stroke at
30%, inset from the section's edges, containing everything. Inside the
housing there are no floating boxes; the interior is DIVIDED into regions by
full-width and full-height hairline rules, the way a technical drawing
divides a plate:

  TOP BAND, running the full inner width, bounded below by one hairline:
    at the left, PT Mono uppercase VOIDWALKER / ERA 03 OF 05; centred, the
    title "The Azeroth teacher" in PP Neue Montreal; at the right, 2020 in
    mono. One continuous chrome band, not three separate labels.

  BELOW IT the interior splits into three vertical regions by two full-height
  hairline rules:
    LEFT REGION (~26%): heading SCOPE in mono at the top over a short rule,
      the motto "Class moved into the game." in gold mono, the SCOPE
      paragraph in PP Neue Montreal cream 80%. Lower in the same region,
      after one horizontal hairline, heading TRANSMISSION and a square
      film-frame placeholder with a mono caption.
    CENTRE REGION (~44%): the FIGURE BAY. The gold hologram figure stands on
      its projector disc, filling the bay, its base disc sitting just above
      the bay's floor rule. In the bay's own top-left corner a tiny mono
      label reads FIGURE / AZEROTH in cream 30%.
    RIGHT REGION (~30%): heading FACTS over a short rule, the four fact rows
      as a key/value readout with small outlined diamond glyphs; then one
      horizontal hairline; then heading ON RECORD with the outlet line in
      small mono and the headline in PP Neue Montreal.

  BOTTOM BAND, full inner width, bounded above by one hairline: the era
  selector as five text stops evenly spaced across the band —
  2026 ARCHITECT · 2022 LATENT LAND · 2020 AZEROTH · 2018 THE EXPANSE ·
  2016 POKEMON GO — in PT Mono uppercase, four at cream 40% and AZEROTH at
  full cream with a small filled gold diamond beneath it and a short gold
  hairline segment under its label.

Because the console is chamfered, every region inside it is SQUARE-cornered.
Gold appears exactly three times: the motto, the active era diamond and its
underline. Void black ground, hairlines cream 25-30%. Dense but calm, like a
machined instrument panel.
`.trim(),
  },
  {
    id: "a4",
    dir: "desktop",
    slate: "desktop",
    title: "A4 · TETHERED READOUTS (open void, connection drawn)",
    aspect: "16:9",
    refs: ["stage"],
    prompt: `
${BRAND}

${RECORD}

${FIGURE}

REFERENCE IMAGE ROLE:
— The dark website section showing a gold armoured hologram figure between
  two columns of floating cream text: THIS IS THE LAYOUT BEING REDESIGNED,
  and the SOURCE OF TRUTH for the figure, the gold palette and the void
  ground. Keep its openness and its figure; fix the floating.

COMPOSITION — A4 · TETHERED READOUTS:
A widescreen section of a dark website that KEEPS the open void of the
current design but makes the connection between the figure and its readouts
explicit, the way a technical annotation drawing does. The gold hologram
figure stands centre on its projector disc.

  THE GROUND DATUM: the elliptical projector disc extends into a single cream
  hairline that runs the FULL width of the section, edge to edge, passing
  behind the figure at the height of the disc. This one line is the datum
  every panel sits on or hangs from — nothing in the composition floats free
  of it.

  FOUR TETHERED READOUTS, two per side, each connected to the figure by a
  LEADER LINE: a thin cream hairline that leaves a small outlined diamond
  anchor placed on the figure's silhouette, runs a short distance at 45
  degrees, then turns horizontal and runs to the readout's own top rule,
  which it becomes. The leader line and the panel's heading rule are one
  continuous stroke — that is the whole point of the drawing.
     UPPER LEFT — anchor at the figure's shoulder. Heading SCOPE in PT Mono
       sitting ON the rule, the motto "Class moved into the game." in gold
       mono beneath, then the SCOPE paragraph in PP Neue Montreal cream 80%.
     LOWER LEFT — anchor at the figure's knee, above the datum. Heading
       TRANSMISSION, a square film-frame placeholder, a mono caption.
     UPPER RIGHT — anchor at the figure's opposite shoulder. Heading FACTS,
       then the four key/value rows, keys in mono cream 55%, values in PP
       Neue Montreal, each row on its own faint hairline.
     LOWER RIGHT — anchor at the figure's opposite knee. Heading ON RECORD,
       the outlet MIT TECHNOLOGY REVIEW · 2020 in small mono, the headline in
       PP Neue Montreal.

  THE ERA LADDER: at the far left, standing ON the ground datum, a vertical
  ladder of five year marks — 2026, 2022, 2020, 2018, 2016 — in PT Mono,
  each with a short horizontal tick. 2020 is ACTIVE: full cream, a filled
  gold diamond on its tick, the era name AZEROTH lettered in mono beneath it.

  TOP CENTRE: mono kicker ERA / 03 OF 05, year 2020, and the title
  "The Azeroth teacher" in large PP Neue Montreal.

The leader lines are quiet — cream at 25%, 1px, no arrowheads, no glow, no
dashes. Gold only on the active era diamond and the motto. This must read as
a surveyor's annotated plate, not as a science-fiction interface with
decorative telemetry.
`.trim(),
  },

  /* ==================== SLATE B — mobile Pip-Boy ==================== */
  {
    id: "b1",
    dir: "mobile",
    slate: "mobile",
    title: "B1 · PIPBOY DIRECT (device screen, thumbnail strip)",
    aspect: "9:16",
    refs: ["pipboy", "stage"],
    prompt: `
${BRAND}

${RECORD}

${FIGURE}

REFERENCE IMAGE ROLES:
— The vertical retro handheld-computer screen with a double hairline inner
  frame, a row of four outlined square category icons near the top, a
  hairline-ruled scrolling list in the middle, and a horizontal strip of five
  small character portrait thumbnails with names along the bottom:
  STRUCTURAL REFERENCE ONLY. Adopt its ANATOMY — the device framing, the
  outlined icon tabs, the ruled rows, and above all the BOTTOM THUMBNAIL
  STRIP. Do NOT adopt its green phosphor palette, its pixel-art rendering,
  its scratched texture, its dirt, its bezel hardware or any of its words.
— The dark website section showing a gold armoured hologram figure on a
  projector disc: SOURCE OF TRUTH for the figure, the gold palette and the
  void ground.

COMPOSITION — B1 · PIPBOY DIRECT, a single tall phone screen, 9:16:
A portrait phone screen for a dark website section. No phone hardware, no
status bar, no home indicator, no keyboard, no browser chrome — just the
screen content, edge to edge. Top to bottom:

  1. IDENTITY, inset 20px from the edges: a mono row with VOIDWALKER at the
     left and ERA / 03 OF 05 at the right, cream 45%, over a full-width
     hairline. Below it the title "The Azeroth teacher" in PP Neue Montreal,
     about 30px, and the year 2020 in gold PT Mono beneath.

  2. MODE TABS: three equal-width outlined square chits in a row, each at
     least 44px tall, divided by hairlines and bounded above and below by
     full-width rules. Each chit holds a small geometric glyph drawn from
     squares, diamonds and hairlines — no pictorial icons, no emoji — with
     its label in PT Mono uppercase beneath:
        RECORD   (glyph: a stack of three short horizontal bars)
        SCOPE    (glyph: an outlined diamond inside a square bracket)
        TRANSMISSION (glyph: a square film frame with a small solid triangle)
     RECORD is ACTIVE: its chit's outline goes gold, its glyph fills gold,
     and a gold hairline sits under its label. The other two sit in cream
     40% outlines.

  3. THE FIGURE, centred, about 38% of the screen height: the gold hologram
     of the armoured man with his two imps on the glowing elliptical
     projector disc, against void black.

  4. THE ERA THUMBNAIL STRIP, full width, bounded above and below by cream
     hairlines: five equal cells divided by short vertical ticks. Each cell
     holds a small square gold scan-line portrait bust of the man in that
     era's dress, about 56px square with zero corner radius, the year in PT
     Mono beneath it. The AZEROTH cell is ACTIVE — full gold strength, a
     gold hairline across the top of its cell, a small filled gold diamond
     centred beneath its year; the other four portraits are cream 35% and
     dimmed. No arrows on either end; the whole strip is the control.

  5. THE DOSSIER SEAT, filling the remaining height to the bottom inset: a
     machined region with a TR+BL chamfer and a cream 30% hairline stroke,
     showing the RECORD mode's content — a heading FACTS in mono over a
     full-width rule, then the four key/value fact rows with keys in mono
     cream 55% and values in PP Neue Montreal; then one hairline; then the
     heading ON RECORD, the outlet MIT TECHNOLOGY REVIEW · 2020 in small
     mono, and the headline in PP Neue Montreal. A very faint 2px scroll
     indicator hugs the seat's inner right edge.

Void black ground, cream ink, gold ONLY on the active mode chit, the active
era thumbnail and the year. Generous air: at least 16px between sections,
20px from the screen edges. Every control at least 44px tall. Crisp,
machined, readable — a precision instrument, not a game prop.
`.trim(),
  },
  {
    id: "b2",
    dir: "mobile",
    slate: "mobile",
    title: "B2 · INSTRUMENT SEAT (shipped IA, retuned)",
    aspect: "9:16",
    refs: ["stage", "pipboy"],
    prompt: `
${BRAND}

${RECORD}

${FIGURE}

REFERENCE IMAGE ROLES:
— The dark website section showing a gold armoured hologram figure on a
  glowing projector disc: SOURCE OF TRUTH for the figure, the gold palette
  and the void ground.
— The vertical retro handheld-computer screen with a bottom strip of small
  character portrait thumbnails: reference for the THUMBNAIL STRIP IDEA
  ONLY. Do NOT adopt its green palette, pixel rendering, texture, bezel or
  any of its words, and do NOT frame this screen as a physical device.

COMPOSITION — B2 · INSTRUMENT SEAT, a single tall phone screen, 9:16:
The conservative sibling of the Pip-Boy study: the SAME running order that
ships today, retuned so the seat reads as an instrument. No device framing —
the screen is the surface. No phone hardware, no status bar, no home
indicator, no browser chrome. Top to bottom:

  1. MAST: mono kicker row ERA / 03 OF 05 at the left, 2020 at the right,
     cream 45%. The title "The Azeroth teacher" in PP Neue Montreal, about
     30px, centred, on two lines at most. No rule under it — the air is the
     separation.

  2. THE FIGURE, centred, about 40% of the screen height: the gold hologram
     of the armoured man with his imps on the elliptical projector disc.

  3. THE ERA RAIL as a THUMBNAIL ROW, full width, bounded above and below by
     cream 25% hairlines: five equal cells, each with a small square gold
     scan-line portrait bust about 52px, zero radius, and the year in PT Mono
     beneath. AZEROTH is ACTIVE — full gold, a short gold tick above its
     cell and a small filled gold diamond below its year, its siblings at
     cream 35%. Triple-signalled by colour, tick and diamond; no size change,
     no weight change, no added height.

  4. MODE ROW: three text buttons on one row, equal width, each 44px tall,
     labels in PT Mono uppercase — RECORD · SCOPE · TRANSMISSION. RECORD is
     selected: full cream with a gold hairline underline; the others at
     cream 50%. TRANSMISSION is DISABLED for this era — cream 25%, with a
     small mono note NO FILM beneath it in cream 20%.

  5. THE DOSSIER SEAT, a fixed-height region filling to the bottom inset,
     marked as an instrument by FOUR GOLD CORNER BRACKETS — short 12px
     L-shaped gold hairlines at the seat's four corners, registering the
     region without closing it in a full frame. Inside, the RECORD content:
     heading FACTS in mono over a full-width cream rule, the four key/value
     rows with small outlined diamond glyphs at the left, keys in mono cream
     55%, values in PP Neue Montreal; then one hairline; heading ON RECORD;
     MIT TECHNOLOGY REVIEW · 2020 in small mono cream 45%; the headline in
     PP Neue Montreal cream 90%.

Void black ground, cream ink, gold only on the active era, the selected mode
underline and the four corner brackets. At least 16px between sections and
20px from the screen edges. Calm, legible, unmistakably the same instrument
family as the desktop stage.
`.trim(),
  },

  /* ================== SLATE C — panel close-ups ================== */
  {
    id: "c1",
    dir: "panels",
    slate: "panels",
    title: "C1 · FACTS as a readout grid",
    aspect: "1:1",
    refs: ["starfield", "stage"],
    prompt: `
${BRAND}

${RECORD}

REFERENCE IMAGE ROLES:
— The dark science-fiction character screen whose right-hand panel shows
  section headings over full-width rules with a grid of small icon,
  label and value readouts: STRUCTURAL REFERENCE ONLY, for the READOUT
  ANATOMY. Do NOT adopt its cool blue-grey palette, its typefaces, its
  rounded elements or any of its words.
— The dark website section with a gold hologram figure: SOURCE OF TRUTH for
  the palette and the void ground only. Do not draw the figure here.

COMPOSITION — C1 · THE FACTS PANEL, square crop, one panel filling the frame:
A close-up study of ONE panel from a dark website — the FACTS readout — drawn
at large scale so its internal craft is legible. This replaces a bare list of
dotted key/value rows.

  HEAD: the word FACTS in PT Mono uppercase, letterspaced, cream 100%, at the
  left; the era tag AZEROTH in smaller mono cream 40% right-aligned on the
  same baseline. Directly beneath them, one cream hairline at 30% running the
  FULL panel width — the head sits ON this rule, not floating above it.

  THE READOUT GRID: four rows, evenly distributed, each row built the same
  way and separated from the next by a cream 12% hairline:
     — At the left of each row, a small OUTLINED DIAMOND glyph about 10px
       across, cream 50%, each one containing a different minimal interior
       mark drawn only from hairlines: a dot, a short horizontal bar, two
       stacked bars, an empty centre. These are index marks, not pictograms.
     — The KEY in PT Mono uppercase, letterspaced, cream 50%, on the row's
       upper line: FIELD SITE / COURSE / ALSO RAN / THE EXIT.
     — The VALUE in PP Neue Montreal, cream 100%, on the row's lower line,
       left-aligned to the same edge as the key: Azeroth / Online Communities
       / Social Media Storytelling / Built into the calendar.
  The four rows share one baseline rhythm and one left alignment edge, so the
  column reads as a machined ladder rather than as four separate captions.

  FOOT: a single cream 12% hairline across the full width, and beneath it, in
  the panel's own margin, a small mono line at cream 30% reading
  FOUR ON RECORD.

Void black ground. NO gold anywhere in this panel — it holds no active state,
and gold is wayfinding only. Zero corner radius; if the panel shows a housing
edge at all it is a single cream hairline with a TR+BL chamfer. Generous
internal air, nothing cramped, no dotted leader lines.
`.trim(),
  },
  {
    id: "c2",
    dir: "panels",
    slate: "panels",
    title: "C2 · ON RECORD as wire dispatches",
    aspect: "1:1",
    refs: ["stage"],
    prompt: `
${BRAND}

${RECORD}

REFERENCE IMAGE ROLE:
— The dark website section with a gold hologram figure and cream text
  headings: SOURCE OF TRUTH for the palette, the type colour and the void
  ground only. Do not draw the figure here, and do not reproduce its layout.

COMPOSITION — C2 · THE ON RECORD PANEL, square crop, one panel filling the
frame:
A close-up study of ONE panel from a dark website — ON RECORD, the press
coverage — drawn at large scale. Today it is a plain paragraph of text; this
study makes each press item a checkable DISPATCH, the way a wire service
files one.

  HEAD: ON RECORD in PT Mono uppercase, letterspaced, cream 100%, at the
  left; a small mono count 01 ITEM right-aligned on the same baseline at
  cream 40%. One cream 30% hairline runs the full panel width beneath them.

  THE DISPATCH — one item, occupying most of the panel, built as three
  stacked bands against a lit left spine:
     — A LEFT SPINE: a single vertical cream hairline running the full height
       of the item, about 14px in from the panel's left edge, with a small
       filled cream diamond seated on it at the top. Every part of the item
       is left-aligned to a common edge inboard of this spine.
     — BAND 1, the dateline: a small square OUTLET CHIP — a square-cornered
       box with a cream 40% hairline stroke, holding MIT TR in tiny mono —
       followed on the same line by MIT TECHNOLOGY REVIEW in PT Mono
       uppercase letterspaced cream 55%, then a small mono middot, then 2020.
     — BAND 2, the headline: "Kids are sick of Zoom too — so their teachers
       are getting creative" in PP Neue Montreal, cream 100%, about 22px,
       three lines, generous leading. This is the largest type in the panel
       and the reason the panel exists.
     — BAND 3, the action: a small OUTLINED square button, cream 40% stroke,
       no fill, holding READ in PT Mono uppercase cream 70%, sitting at the
       item's left edge with a short cream hairline running from its right
       side to the panel's right margin.

  Beneath the dispatch, a cream 12% hairline and then generous empty void —
  the space where a second and third dispatch would seat, deliberately left
  open so the panel reads as a register with room rather than as a full box.

Void black ground. Gold appears NOWHERE in this panel. Zero corner radius on
the chip and the button. No quotation-mark ornaments, no pull-quote styling,
no italics anywhere.
`.trim(),
  },
  {
    id: "c3",
    dir: "panels",
    slate: "panels",
    title: "C3 · TRANSMISSION as a feed bay",
    aspect: "1:1",
    refs: ["stage"],
    prompt: `
${BRAND}

REFERENCE IMAGE ROLE:
— The dark website section with a gold hologram figure and cream text
  headings: SOURCE OF TRUTH for the palette, the type colour and the void
  ground only. Do not draw the figure here, and do not reproduce its layout.

COMPOSITION — C3 · THE TRANSMISSION PANEL, square crop, one panel filling the
frame:
A close-up study of ONE panel from a dark website — TRANSMISSION, the film —
drawn at large scale. Today it is a heading over a bare video thumbnail; this
study seats the film in a machined FEED BAY. The era shown is the 2018 one,
because that is the era whose record carries a film.

  HEAD: TRANSMISSION in PT Mono uppercase, letterspaced, cream 100%, at the
  left; 02:14 right-aligned on the same baseline in mono cream 40%. One cream
  30% hairline runs the full panel width beneath them.

  THE FEED LINE: directly under the head rule, a single line of small PT Mono
  uppercase at cream 45%, reading FEED · IN SERVICE 2018 — at the left and
  DOCUMENTARY at the right of the same measure.

  THE BAY: a large square-cornered region filling the middle of the panel,
  bounded by a cream 25% hairline, its content BLEEDING to the bay's inner
  edges with no inner margin — a frame is something content bleeds into,
  never a letterbox. Inside it, a dark duotoned film still rendered ONLY in
  void black and parchment cream: a wide, low-contrast frame suggesting a
  crowd of people seen from behind at a lit stage, heavily abstracted, more
  texture than picture, at about 45% strength so it never competes with the
  type. Seated in the bay's lower-left corner, in the bay's own margin, a
  small mono caption at cream 60% reads HOW THE POWER OF FANS SAVED THE
  EXPANSE.

  THE WATCH BAR: fused directly to the BOTTOM EDGE of the bay with no gap, a
  full-width horizontal bar with a cream 40% hairline top edge and no fill.
  At its left, a small solid cream triangle play mark; beside it, WATCH
  TRANSMISSION in PT Mono uppercase cream 90%; at its right, 02:14 in mono
  cream 45%. The bar and the bay read as ONE object, not as a button under a
  picture.

Void black ground. Gold appears exactly ONCE: a single short gold hairline
segment at the very left of the watch bar's top edge, about 40px long,
marking the bar as the one live control. Zero corner radius. No play-button
circle — the play mark is a bare triangle. No progress bar, no timeline
scrubber, no volume icons, no rounded overlay.
`.trim(),
  },

  /* ================= WAVE 2 — the owner's fusion, 2026-08-31 =================
     Rulings from the wave-1 review: mobile's first tab IS the avatar and the
     bottom dossier seat is deleted; desktop takes the same era-avatar band at
     the bottom while the figure stays visible across everything; the tethers
     stay ONLY if the anchor is semantically true — a line to a shoulder claims
     SCOPE belongs to the shoulder, so the anchor moves to the PROJECTOR DISC
     (the emitter of figure and readings alike) or to a shared datum. */
  {
    id: "d1",
    dir: "wave2-desktop",
    slate: "wave2",
    title: "D1 · PROJECTED READOUTS (tethers from the disc)",
    aspect: "16:9",
    refs: ["stage", "w1band", "w1tether"],
    prompt: `
${BRAND}

${RECORD}

${FIGURE}

REFERENCE IMAGE ROLES:
— The dark website section showing the gold armoured hologram between
  floating cream text columns: SOURCE OF TRUTH for the figure, the gold
  palette and the void ground.
— The widescreen mockup with five small era portrait busts in a full-width
  band along the bottom edge, the active one lit gold with a thin line rising
  toward the projector disc: STRUCTURE REFERENCE for the BOTTOM ERA BAND —
  adopt its band, its five portrait cells with years and names, and its
  active-cell treatment.
— The widescreen mockup where the four panel headings connect by thin
  diagonal hairlines to small diamond anchors pinned ON the figure's
  shoulders and knees: STRUCTURE REFERENCE for the tethered-panel drawing,
  carrying THE ONE CORRECTION THIS STUDY EXISTS TO MAKE — the lines may not
  touch the figure's body. A line to a shoulder claims the panel belongs to
  the shoulder, which is false.

COMPOSITION — D1 · PROJECTED READOUTS:
A widescreen section of a dark website. The gold hologram figure stands
centre on its elliptical projector disc. Open void — no housing, no boxes.
The drawing's one idea: THE DISC IS THE HUB. The era selection feeds INTO
the projector from below; the four readings are projected OUT of it to the
sides. Everything connects through the emitter, nothing touches the man.

  THE TETHERS: four thin cream hairlines (25% opacity, 1px, no arrowheads)
  leave the projector disc's elliptical RIM — two toward the left, two
  toward the right, each starting at a small outlined diamond seated ON the
  rim itself, well clear of the figure's feet. Each line runs outward and
  upward at 45 degrees, staying clear of the figure's silhouette, then turns
  horizontal and BECOMES the heading rule of its panel — the tether and the
  panel's underline are one continuous stroke.

  THE FOUR PANELS, unboxed, heading seated ON its rule in PT Mono uppercase:
     UPPER LEFT — SCOPE: the motto "Class moved into the game." in gold
       mono, then the SCOPE paragraph in PP Neue Montreal cream 80%.
     LOWER LEFT — TRANSMISSION: a small square film-frame placeholder and
       the mono caption NO FILM ON RECORD in cream 40%.
     UPPER RIGHT — FACTS: the four key/value rows, keys in mono cream 55%,
       values in PP Neue Montreal cream 100%, on a shared baseline rhythm.
     LOWER RIGHT — ON RECORD: MIT TECHNOLOGY REVIEW · 2020 in small mono,
       the headline beneath in PP Neue Montreal.

  THE ERA BAND, full width along the bottom, bounded above by one cream
  hairline: five equal cells divided by short vertical ticks, each holding a
  small square gold scan-line portrait bust of the man in that era's dress
  (~90px, zero radius), year in PT Mono above, era name in mono below:
  2026 ARCHITECT · 2022 LATENT LAND · 2020 AZEROTH · 2018 THE EXPANSE ·
  2016 POKEMON GO. The AZEROTH cell is ACTIVE — full gold strength while its
  siblings sit dimmed at cream 35%, a gold hairline across the top of its
  cell, and one thin GOLD hairline rising from that cell straight up to the
  UNDERSIDE of the projector disc: the selection feeding the projector.

  TOP CENTRE: the mast — mono kicker ERA / 03 OF 05 with 2020 beside it, the
  title "The Azeroth teacher" in large PP Neue Montreal.

Gold appears only as: the motto, the active era cell, its band rule and its
riser line. The four tether lines and diamonds are cream. Calm, precise,
a surveyor's plate about a projector — not decorative telemetry.
`.trim(),
  },
  {
    id: "d2",
    dir: "wave2-desktop",
    slate: "wave2",
    title: "D2 · DATUM RAILS (no tethers, framed chips)",
    aspect: "16:9",
    refs: ["stage", "w1chips"],
    prompt: `
${BRAND}

${RECORD}

${FIGURE}

REFERENCE IMAGE ROLES:
— The dark website section showing the gold armoured hologram between
  floating cream text columns: SOURCE OF TRUTH for the figure, the gold
  palette and the void ground.
— The widescreen mockup whose bottom edge carries six small hairline-FRAMED
  portrait chips seated on a full-width band, each chip holding a gold
  scan-line bust with a year lettered inside its top edge and a mono name
  beneath: STRUCTURE REFERENCE for the CHIP BAND ONLY — adopt the framed-chip
  treatment and the band, correct the roster to FIVE eras with the years and
  names from the record. Ignore that mockup's garbled labels.

COMPOSITION — D2 · DATUM RAILS:
A widescreen section of a dark website. The gold hologram figure stands
centre on its projector disc. Open void, no housing, and NO tether lines at
all — this variant makes the connection through SHARED STRUCTURE alone:

  TWO DATUM RAILS: two full-width horizontal cream hairlines at 12% opacity
  run edge to edge across the whole section, passing behind the figure — one
  at the height of the upper panels' headings, one at the height of the
  lower panels' headings. Where a rail crosses a panel's width it steps up
  to 30% opacity and IS that panel's heading rule. Four panels, one
  structure: the rails make the alignment visible, the way a technical
  drawing shares its construction lines.

  THE GROUND DATUM: the projector disc extends left and right into a single
  cream hairline running the full width at 20% — the floor the figure and
  both lower panels stand on.

  THE FOUR PANELS, unboxed, headings in PT Mono uppercase seated on the
  rails: SCOPE upper left (gold motto "Class moved into the game." + the
  scope paragraph in PP Neue Montreal cream 80%), TRANSMISSION lower left
  (square film-frame placeholder + NO FILM ON RECORD caption), FACTS upper
  right (four key/value rows on a shared baseline rhythm), ON RECORD lower
  right (MIT TECHNOLOGY REVIEW · 2020 in small mono, the headline in PP Neue
  Montreal).

  THE CHIP BAND, full width along the very bottom, a shallow recessed band
  bounded above by a cream hairline: FIVE hairline-framed square chips
  evenly spaced, each holding a gold scan-line portrait bust of the man in
  that era's dress, the year in small PT Mono lettered inside the chip's
  top-left corner, the era name in mono centred beneath the chip:
  2026 ARCHITECT · 2022 LATENT LAND · 2020 AZEROTH · 2018 THE EXPANSE ·
  2016 POKEMON GO. The AZEROTH chip is ACTIVE — its frame goes GOLD, its
  bust full strength, its name gold with a small filled gold diamond
  beneath; the other four chips keep cream 35% frames and dimmed busts.

  TOP CENTRE: the mast — mono kicker ERA / 03 OF 05 with 2020, then
  "The Azeroth teacher" in large PP Neue Montreal.

Gold only on the motto and the active chip's frame, name and diamond.
Quieter than every other direction — the discipline IS the design.
`.trim(),
  },
  {
    id: "m1",
    dir: "wave2-mobile",
    slate: "wave2",
    title: "M1 · FIGURE TAB (four stops, figure active)",
    aspect: "9:16",
    refs: ["w1mobile", "stage"],
    prompt: `
${BRAND}

${RECORD}

${FIGURE}

REFERENCE IMAGE ROLES:
— The tall phone mockup with an identity mast, a row of three heavy outlined
  icon tabs, a gold hologram figure, a five-cell era portrait strip and a
  chamfered dossier panel at the bottom: STRUCTURE REFERENCE for the mast,
  the figure treatment and the era strip. TWO CORRECTIONS this study exists
  to make: the bottom dossier panel is DELETED, and the heavy icon-chit tabs
  become one slim text tab row.
— The dark website section with the gold armoured hologram on its projector
  disc: SOURCE OF TRUTH for the figure, the palette and the void ground.

COMPOSITION — M1 · FIGURE TAB, a single tall phone screen, 9:16:
A portrait phone screen for a dark website section. No phone hardware, no
status bar, no browser chrome. The whole idea: the avatar is the FIRST TAB,
so the screen needs no second content seat — one area below the tabs swaps
between the figure and the readings. Top to bottom:

  1. IDENTITY, inset 20px: mono row VOIDWALKER left, ERA / 03 OF 05 right,
     cream 45%, over a full-width hairline. The title "The Azeroth teacher"
     in PP Neue Montreal ~30px, the year 2020 in gold PT Mono beneath.

  2. THE TAB ROW, slim and minimal: four equal text stops on one line, each
     44px tall, divided by short vertical hairline ticks, bounded above and
     below by full-width cream hairlines — no boxes, no icons:
        FIGURE · RECORD · SCOPE · TRANSMISSION
     in PT Mono uppercase. FIGURE is ACTIVE: full cream with a gold hairline
     underline; the other three sit at cream 45%.

  3. THE STAGE, the large open remainder of the screen: the gold hologram of
     the armoured man with his two imps on the glowing elliptical projector
     disc, generous and unobstructed — about 55% of the screen height,
     breathing in open void. Nothing else in this area.

  4. THE ERA STRIP, full width at the very bottom, bounded above by a cream
     hairline: five equal cells divided by short ticks, each a small square
     gold scan-line portrait bust (~54px, zero radius) with the year in PT
     Mono beneath it and the era name in tiny mono under the year:
     2026 ARCHITECT · 2022 LATENT LAND · 2020 AZEROTH · 2018 THE EXPANSE ·
     2016 POKEMON GO. AZEROTH active: full gold bust, gold hairline across
     its cell's top, small filled gold diamond beneath its name; siblings
     dimmed cream 35%.

That is the WHOLE screen — four zones, no dossier panel, no extra chrome.
Gold only on the year, the active tab underline and the active era cell.
Minimal, machined, with real air between every zone.
`.trim(),
  },
  {
    id: "m2",
    dir: "wave2-mobile",
    slate: "wave2",
    title: "M2 · RECORD TAB (same screen, content state)",
    aspect: "9:16",
    refs: ["w1mobile", "stage", "w1facts", "w1record"],
    prompt: `
${BRAND}

${RECORD}

REFERENCE IMAGE ROLES:
— The tall phone mockup with an identity mast, icon tabs, a gold hologram
  figure and a five-cell era portrait strip: STRUCTURE REFERENCE for the
  mast and the era strip only. Its bottom dossier panel is DELETED in this
  study and its icon tabs become one slim text row.
— The dark website section with the gold armoured hologram: SOURCE OF TRUTH
  for the palette and the void ground. THE FIGURE DOES NOT APPEAR in this
  study — this is the state where a content tab has replaced it.
— The square dark panel showing FACTS as four rows of outlined diamond
  glyphs, mono keys and cream values on ruled lines: STRUCTURE REFERENCE for
  the facts ladder.
— The square dark panel showing a press dispatch — outlet chip, dateline,
  large cream headline on a lit left spine: STRUCTURE REFERENCE for the
  press item.

COMPOSITION — M2 · RECORD TAB, a single tall phone screen, 9:16:
The SAME screen as the figure-tab study, in its second state: the reader
tapped RECORD, so the stage area now carries the reading instead of the
figure. No phone hardware, no status bar, no browser chrome. Top to bottom:

  1. IDENTITY, unchanged: mono row VOIDWALKER / ERA 03 OF 05 over a
     hairline; "The Azeroth teacher" in PP Neue Montreal ~30px; 2020 in
     gold PT Mono.

  2. THE TAB ROW, unchanged geometry: FIGURE · RECORD · SCOPE ·
     TRANSMISSION in PT Mono uppercase, four equal stops, 44px, hairline
     bounds, no boxes. RECORD is ACTIVE now — full cream, gold hairline
     underline; FIGURE and the others at cream 45%.

  3. THE STAGE, now the READING — the same large area the figure occupied,
     given entirely to the record at a generous scale:
       — heading FACTS in PT Mono uppercase over a full-width cream rule.
       — the four fact rows, each with a small outlined diamond glyph at the
         left, the key in mono uppercase cream 55% and the value in PP Neue
         Montreal cream 100% beneath it, rows separated by faint hairlines
         and sharing one left edge: FIELD SITE Azeroth / COURSE Online
         Communities / ALSO RAN Social Media Storytelling / THE EXIT Built
         into the calendar.
       — one full-width hairline, then heading ON RECORD with a small mono
         count 01 ITEM right-aligned.
       — the dispatch: a small square-cornered outlet chip reading MIT TR in
         tiny mono, MIT TECHNOLOGY REVIEW · 2020 in mono cream 55% beside
         it, then the headline "Kids are sick of Zoom too — so their
         teachers are getting creative" in PP Neue Montreal cream 100%,
         ~22px, three lines with generous leading.
     Everything on one left alignment edge, unboxed, air between blocks.

  4. THE ERA STRIP, unchanged at the very bottom: five bust cells with years
     and names, AZEROTH active in gold, siblings dimmed cream 35%.

Gold only on the year, the active tab underline and the active era cell.
The reading takes the stage's full generosity — big type, real air — which
is the whole argument for making the figure a tab.
`.trim(),
  },
];

/* ---------------------------------------------------------- image APIs */

/* Nano Banana. References ride as leading inline_data parts so the prompt
   reads as an instruction ABOUT them; the key rides the header. NB Pro
   (gemini-3-pro-image) draws the panel close-ups because legible text on a
   surface is its listed strength; NB2 carries the composition slates. */
async function callGemini(env, item, refs) {
  const key = env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing from env");

  const model = item.slate === "panels" ? "gemini-3-pro-image" : "gemini-3.1-flash-image";

  const parts = refs.map((r) => ({
    inline_data: { mime_type: r.mime, data: r.buf.toString("base64") },
  }));
  parts.push({ text: item.prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: item.aspect },
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`gemini ${res.status}: ${detail.slice(0, 400)}`);
  }
  const json = await res.json();
  const out = json?.candidates?.[0]?.content?.parts ?? [];
  const img = out.find(
    (p) =>
      p?.inlineData?.mimeType?.startsWith("image/") ||
      p?.inline_data?.mime_type?.startsWith("image/")
  );
  if (!img) {
    const finish = json?.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(`gemini returned no image (finish: ${finish})`);
  }
  return { buf: Buffer.from(img?.inlineData?.data ?? img?.inline_data?.data, "base64"), model };
}

/* GPT Image 2. References only work on /images/edits, which is multipart —
   /generations is text-only.
   ⚠ NO input_fidelity: it is a gpt-image-1 parameter and gpt-image-2 rejects
   it outright ("does not support the 'input_fidelity' parameter", 400,
   measured 2026-08-31). The skill reference still documents it against this
   model; the API is what is right. Reference ORDER still matters, so the
   image that most needs to survive is appended first. */
async function callOpenAI(env, item, refs) {
  const key = env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing from env");

  const model = "gpt-image-2-2026-04-21";
  const size =
    item.aspect === "9:16" ? "1024x1536" : item.aspect === "1:1" ? "1024x1024" : "1536x1024";

  const form = new FormData();
  form.append("model", model);
  form.append("prompt", item.prompt);
  form.append("size", size);
  form.append("n", "1");
  form.append("quality", "high");
  for (const r of refs) {
    form.append("image[]", new Blob([r.buf], { type: r.mime }), r.name);
  }

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`openai ${res.status}: ${detail.slice(0, 400)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("openai returned no b64_json");
  return { buf: Buffer.from(b64, "base64"), model };
}

/* ---------------------------------------------------------- driver */

const env = await loadEnv();

let runList = SLATE;
if (SLATE_FILTER) runList = runList.filter((s) => s.slate === SLATE_FILTER);
if (ONLY) runList = runList.filter((s) => s.id === ONLY);
if (runList.length === 0) {
  console.error(
    `no items matched. ids: ${SLATE.map((s) => s.id).join(", ")} | slates: desktop, mobile, panels`
  );
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
  if (MODEL_FILTER === "both" || MODEL_FILTER === "gemini")
    targets.push({ tag: "nb", fn: callGemini });
  if (MODEL_FILTER === "both" || MODEL_FILTER === "openai")
    targets.push({ tag: "gpt", fn: callOpenAI });

  if (DRY) {
    console.log(
      `[dry] ${item.id.padEnd(3)} ${item.aspect.padEnd(5)} refs=${item.refs.join("+").padEnd(20)} ${item.title}`
    );
    continue;
  }

  let refs;
  try {
    refs = await Promise.all(item.refs.map((k) => readRef(REFS[k])));
  } catch (err) {
    console.log(`  x ${item.id}: reference unreadable - ${err.message ?? err}`);
    fail += targets.length;
    continue;
  }

  for (const t of targets) {
    const stem = resolve(outRoot, item.dir, `${item.id}_${t.tag}`);
    process.stdout.write(`... ${item.id} ${t.tag.padEnd(3)} ${item.title}\n`);
    try {
      const { buf, model } = await t.fn(env, item, refs);
      await writeFile(`${stem}.png`, buf);
      await writeFile(
        `${stem}.json`,
        JSON.stringify(
          {
            id: item.id,
            title: item.title,
            slate: item.slate,
            aspect: item.aspect,
            model,
            refs: item.refs.map((k) => REFS[k]),
            bytes: buf.length,
            prompt: item.prompt,
          },
          null,
          2
        )
      );
      console.log(`  ok ${Math.round(buf.length / 1024)} KB -> ${item.dir}/${item.id}_${t.tag}.png`);
      ok += 1;
    } catch (err) {
      console.log(`  x ${err.message ?? err}`);
      fail += 1;
    }
  }
}

if (!DRY) console.log(`\ndone - ${ok} ok, ${fail} fail, root ${OUT_ROOT}/`);
