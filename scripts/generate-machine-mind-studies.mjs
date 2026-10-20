/**
 * generate-machine-mind-studies — round six of the machine-mind lab, as image
 * studies before any build: six routes for a brain that is a housing around
 * the swarm's particle plates, left hemisphere the company's floors, right
 * hemisphere Claude Enterprise's chip stack.
 *
 * Each route has two takes (whole, and parted) and each take runs on Nano
 * Banana Pro and GPT Image 2: 6 × 2 × 2 = 24 stills. The swarm's own plates
 * ride first as the object reference; the route's style references follow.
 *
 * Keys are read from --env <file> (else .env.local, then .env). They are never
 * printed and never copied into the repo.
 *
 *   node scripts/generate-machine-mind-studies.mjs --env ~/Downloads/.env.txt
 *     [--wave 2]            wave 2: the thoughtform shapes in the owner's picks
 *     [--wave 3]            wave 3: storyboards, each frame an edit of the last
 *     [--wave 4]            wave 4: the centre rethought from the brand mark
 *     [--wave 5]            wave 5: C4 refined, a chain of one-change edits
 *                           (a step's file present = kept; delete it to redo it)
 *     [--wave 6]            wave 6: from the solid drum, floors and the mark's depth
 *     [--only a1,b2]        take ids
 *     [--model gemini|openai|both]
 *     [--seed 2]            a re-roll, written as <id>_<tag>-<seed>.png
 *     [--out docs/design/machine-mind/round-06/studies]
 *     [--dry]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const ONLY = argOf("--only", null)?.split(",");
const MODEL_FILTER = argOf("--model", "both");
const WAVE_ARG = argOf("--wave", "1");
const OUT_ROOT = argOf("--out", WAVE_ARG === "1" ? "docs/design/machine-mind/round-06/studies" : `docs/design/machine-mind/round-06/wave-${WAVE_ARG}`);
const SEED = argOf("--seed", null);
const ENV_FILE = argOf("--env", null)?.replace(/^~/, homedir());
const DRY = args.includes("--dry");

/* ------------------------------------------------------------------ env */

async function loadEnv() {
  const merged = {};
  const files = ENV_FILE ? [ENV_FILE] : [".env.local", ".env"].map((rel) => resolve(ROOT, rel));
  for (const path of files) {
    try {
      const raw = await readFile(path, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        let [, k, v] = m;
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
        if (!(k in merged)) merged[k] = v;
      }
    } catch {
      if (ENV_FILE) throw new Error(`--env file unreadable: ${path}`);
    }
  }
  return merged;
}

/* ------------------------------------------------------- reference images */

const REF_DIR = resolve(ROOT, "docs/design/machine-mind/round-06/refs");
const REFS = {
  plates: `${REF_DIR}/00-swarm-stack-plates.png`,
  d3: `${REF_DIR}/02-d3-glass-housing.png`,
  cerebral: `${REF_DIR}/03-cerebral-circuit-brain.png`,
  split: `${REF_DIR}/04-circuit-organic-split.png`,
  glass: `${REF_DIR}/06-glass-machine-brain.png`,
  capsule: `${REF_DIR}/07-capsule-cutaway.png`,
  satellite: `${REF_DIR}/08-satellite-wireframe.png`,
  hand: `${REF_DIR}/09-gits-hand-hud.png`,
  skull: `${REF_DIR}/10-halftone-skull-hud.png`,
  kv: `${REF_DIR}/11-key-visual-thought-form.jpg`,
  /* wave 2: the owner's three picks from wave 1, used as the style */
  pickE1: resolve(ROOT, "docs/design/machine-mind/round-06/studies/e1_gpt.png"),
  pickE2: resolve(ROOT, "docs/design/machine-mind/round-06/studies/e2_nb.png"),
  pickF1: resolve(ROOT, "docs/design/machine-mind/round-06/studies/f1_gpt.png"),
  /* wave 3: the Mind Ring the storyboards start from, and the brand mark */
  ring: resolve(ROOT, "docs/design/machine-mind/round-06/wave-2/s1e1_gpt.png"),
  mark: `${REF_DIR}/13-brandmark-gold.png`,
  /* wave 4: the owner's two favourites from wave 2 */
  favRing: resolve(ROOT, "docs/design/machine-mind/round-06/wave-2/s2e2_gpt.png"),
  favCells: resolve(ROOT, "docs/design/machine-mind/round-06/wave-2/s3f1_nb.png"),
};

/* How each reference is named to the model: by what it shows, never by
   position, and with its role, so a style reference is not redrawn. */
const ROLE = {
  plates:
    "a stack of three isometric plates drawn entirely in small square dots on near-black: a green speckled plate on top, a dense gold plate in the middle, a sparse bone-white plate at the bottom. OBJECT REFERENCE: these three dot plates are the core of the new picture. Keep their dot language, their isometric angle and their three colours exactly; they sit inside the brain.",
  d3: "a translucent glass brain shell with stacked boards standing inside it. STYLE REFERENCE ONLY for the see-through housing idea. Do not copy its circuit boards, heatsinks or cables.",
  cerebral:
    "a white line-art brain made of circuit traces on black. STYLE REFERENCE ONLY for clean single-weight line on black and a brain read as two hemispheres. Do not copy the traces.",
  split:
    "a brain drawn half as circuit traces, half as engraved organic tissue. CONCEPT REFERENCE ONLY for one silhouette whose two halves are filled differently. Do not copy either fill.",
  glass:
    "a transparent glass brain with machinery inside, on black. STYLE REFERENCE ONLY for a see-through shell with structure visible inside. Do not copy the photoreal glass or the machinery.",
  capsule:
    "a green line-art exploded cutaway of a space capsule, its sections separated along one axis with leader lines. STYLE REFERENCE ONLY for the exploded technical-drawing grammar. Do not copy the capsule or its words.",
  satellite:
    "a satellite and a planet drawn as green wireframe rings over a grid. STYLE REFERENCE ONLY for concentric wireframe rings and a hologram feel. Do not copy the satellite, the grid or the numeral.",
  hand: "an anime hologram of a robotic hand in green wireframe with coloured rings around the wrist. STYLE REFERENCE ONLY for HUD rings wrapping a subject. Do not copy the hand, the chart or any text.",
  skull:
    "a skull rendered as a field of glowing scan-line dots with HUD callouts. STYLE REFERENCE ONLY for a form built from halftone dots, hollow where it is dark. Do not copy the skull, the red colour or any text.",
  kv: "a photographic key visual: a marble head with closed eyes tearing into horizontal raster lines, under a broken stone ring. CONCEPT REFERENCE ONLY for a thought (the head dissolving into lines) meeting a form (the ring, a gateway). Do not copy the head, the face, the sand, the stone or the photographic look.",
  pickE1:
    "a brain drawn front-on as stacked contour slices in bone-white hairline, office floor plans with dot people on the left half, gold chip floorplans on the right, three dot plates at the core. STYLE REFERENCE: match its line weight, its etched plans, its palette and its sparseness exactly. Do not copy its brain silhouette.",
  pickE2:
    "a brain in isometric view, parted down the middle, built from thick stacked contour rings in bone-white line, office interiors with people on the left, gold circuit floorplans on the right, a column of dots between the halves. STYLE REFERENCE: match its stacked-ring construction, line weight and palette exactly. Do not copy its brain silhouette.",
  pickF1:
    "a brain drawn front-on in small square dots and dash characters like a terminal display, rows of dashes with tiny pin marks on the left, packed filled cells on the right, three dot plates at the core, CRT corner brackets. STYLE REFERENCE: match its dot-cell construction, its density and its palette exactly. Do not copy its brain silhouette.",
  ring: "a thick ring drawn as stacked thin contour slices in bone-white hairline, split into a left and a right half, office floor plans etched on the left half, gold chip floorplans on the right, three dot plates in its opening. OBJECT REFERENCE: this ring is the subject. Keep its construction, line weight, palette and its two halves.",
  mark: "a gold emblem on black: an open circle broken at the upper right, crossed by a level bar and a steep slanted bar that meet in a small stepped block. OBJECT REFERENCE: this is the Thoughtform brand mark. Reproduce its shape exactly, engraved into the top face of the central gold dot plate, lying flat on the plate and foreshortened with it.",
  favRing:
    "a mind drawn as a ring of stacked thin contour slices in bone-white hairline, seen in isometric from slightly above, office interiors with tiny people cut into its left half, gold circuit floorplans in its right half, its upper left fraying into raster lines and dots, square dot plates at its core. STYLE AND FORM REFERENCE: match its silhouette family, construction, line weight and palette. Do NOT copy its centre: the square plates at its core are exactly what must be replaced.",
  favCells:
    "a rounded mind built from small square dots on a terminal grid, office floors with tiny desks and figures stepping down its left side, packed gold die blocks and transistors on its right, its top fraying into long horizontal raster lines in green and gold, CRT corner brackets, square dot plates at its core. STYLE AND FORM REFERENCE: match its silhouette family, construction, density and palette. Do NOT copy its centre: the square plates at its core are exactly what must be replaced.",
  prev: "the previous frame of this storyboard. BASE IMAGE: edit it as instructed; everything the instruction does not change stays exactly as it is.",
};

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
async function readRef(key) {
  const path = REFS[key];
  const mime = MIME[extname(path).toLowerCase()];
  if (!mime) throw new Error(`unmapped reference extension: ${path}`);
  return { key, buf: await readFile(path), mime, name: basename(path) };
}

/* ------------------------------------------------------------ the prompts */

const BRAND = `
THE BRIEF. A single abstract brain, a machine mind, drawn as a technical hologram for the website of Thoughtform, an AI design studio. It must belong to the same visual world as the dotted plates: a low-fidelity interface on a spaceship console, data drawn as dots and hairlines, never a rendered object.

WHAT IT MEANS. The brain is a housing wrapped around the three dot plates. Its left hemisphere is the client's company and its teams: abstract floors of an office building, stacked floor plates, people as single dots. Its right hemisphere is Claude Enterprise, the AI platform the teams build on: abstract stacked layers of a silicon wafer or chip die. Both halves share one brain silhouette, one line weight and one camera; only what fills them differs. The three dot plates sit in the middle, held inside the brain where the two hemispheres meet.

CAMERA. True isometric, the same 30-degree angle as the dot plates, seen corner-on from slightly above. The brain fills about 60 percent of a square frame, centred, with generous black around it.

PALETTE. Near-black ground (#0A0908). Bone white (#EBE3D6) for structure and outlines. Muted gold (#CAA554) as the one accent. Sage green (#7A9E6A) for the living signal. Nothing else: no blue, no red, no purple, no gradients of colour.

FIDELITY. Abstract and sparse: tens of parts, not hundreds. It should read at thumbnail size as a brain with layers inside. Flat graphic drawing with thin even lines and square dots. No photorealism, no glossy 3D render, no realistic folds of brain tissue, no chip pins, no cables, no faces or eyes, no background scenery. No words or letters anywhere; at most a few tiny tick marks and short index numerals like 01 02 03 at the edges.
`.trim();

const ROUTES = [
  {
    id: "a",
    name: "Glass Floors",
    refs: ["plates", "d3", "glass"],
    route: `ROUTE: GLASS FLOORS. The brain is a clear holographic glass shell, drawn only as a hairline bone-white outline with a faint inner glow along its edge; the inside is fully see-through. In the left hemisphere, five or six thin floor slabs of a building stand stacked one above another, open plan, a few square dots on each floor for people, edges lit in green. In the right hemisphere, a stack of thin wafer layers on a small interposer, each layer edge-lit in gold. The three dot plates float in the centre between them.`,
  },
  {
    id: "b",
    name: "Blueprint Exploded",
    refs: ["plates", "capsule"],
    route: `ROUTE: BLUEPRINT EXPLODED. The brain is cut into five horizontal sections and the sections are pulled apart vertically, one above another, like an exploded engineering drawing, joined by thin dotted alignment lines. Each section is drawn as a thin outline slice of the brain's shape. On the left half of every section, a simple architectural floor plan (rooms and corridors) in bone-white hairline. On the right half of every section, a simple chip floorplan (rectangular blocks and buses) in gold hairline. The middle three sections are replaced by the three dot plates themselves. A few short leader ticks end in tiny numerals at the sides.`,
  },
  {
    id: "c",
    name: "Hologram Rings",
    refs: ["plates", "hand", "satellite"],
    route: `ROUTE: HOLOGRAM RINGS. The brain is a hollow wireframe made of horizontal contour rings, like a hologram scan, bone-white on the left hemisphere and sage green on the right, with a few vertical meridians. Two or three broad gold HUD rings orbit the brain at different tilts, segmented like dials with tick marks. Small registration crosses at the four corners of the frame. Inside, the left hemisphere's rings are spaced like floors of a building and the right hemisphere's rings are packed tight like layers of a chip. The three dot plates glow inside at the core.`,
  },
  {
    id: "d",
    name: "Halftone Shell",
    refs: ["plates", "skull"],
    route: `ROUTE: HALFTONE SHELL. The brain's shell is made of the same small square dots as the plates, on the same isometric dot lattice: dense where a surface faces the light, thinning to nothing where it turns away, so the form is built from dot density like a halftone print. It is hollow: the inside is black. The left hemisphere is drawn as wide horizontal bands of dots with gaps between them, like the floors of a building; the right hemisphere as many thin tightly packed bands, like layers of a wafer. The three dot plates sit inside at the core and are the brightest part.`,
  },
  {
    id: "e",
    name: "Section Stack",
    refs: ["plates", "cerebral", "split"],
    route: `ROUTE: SECTION STACK. The brain is built as a stack of about twelve thin horizontal contour slices, like an MRI section stack drawn in isometric, each slice a single bone-white hairline outline of the brain at that height with small even gaps between slices. On the left hemisphere the slices are etched with simple floor plans of an office (rooms, desks as dots). On the right hemisphere the slices are etched with simple chip floorplans (blocks and buses in gold). Three slices in the middle of the stack are the three dot plates themselves, in their green, gold and bone dots.`,
  },
  {
    id: "f",
    name: "Terminal Cell",
    refs: ["plates", "skull"],
    route: `ROUTE: TERMINAL CELL. The brain is drawn as if on a monochrome terminal: its shell is made of monospace character cells on a grid, glowing like phosphor, with faint horizontal scanlines across the frame and thin CRT corner brackets. The left hemisphere is drawn with rows of long dash characters stacked like floors of a building; the right hemisphere with tight rows of small filled square characters stacked like a chip die. The characters fade toward the edges of the shell. The three dot plates sit at the core inside it, unchanged.`,
  },
];

const TAKES = [
  { n: 1, take: "TAKE: WHOLE. The brain is whole and closed; the plates are seen through it at its core." },
  {
    n: 2,
    take: "TAKE: PARTED. The two hemispheres are pulled a little apart sideways, left to the left and right to the right, leaving a clear gap down the middle where the three dot plates hang, fully visible, between the two halves.",
  },
];

const JOBS = ROUTES.flatMap((r) =>
  TAKES.map((t) => ({
    id: `${r.id}${t.n}`,
    route: r.id,
    title: `${r.name} · ${t.n === 1 ? "whole" : "parted"}`,
    refs: r.refs,
    aspect: "1:1",
    prompt: [
      "REFERENCE IMAGE ROLES:",
      ...r.refs.map((k) => `— ${ROLE[k]}`),
      "",
      BRAND,
      "",
      r.route,
      t.take,
    ].join("\n"),
  }))
);

/* Wave 2: not a brain but a thoughtform, a thought given form. The owner
   kept E1 (gpt), E2 (nb) and F1 (gpt) for their drawing; the silhouette moves
   off the anatomy toward the key visual's thought (the head tearing into
   raster lines) and form (the ring, the gateway). 4 shapes × 3 styles. */
const BRAND2 = `
THE BRIEF. A thoughtform: a thought given form. This is the visual symbol of Thoughtform, an AI design studio, for its website. It must keep only a faint memory of a mind (two halves, soft lobed contours) and must NOT read as an anatomical brain: no hemispheres in brain shape, no brain stem, no cerebellum, no gyri. It belongs to the same visual world as the dotted plates: a low-fidelity interface on a spaceship console, data drawn as dots and hairlines, never a rendered object.

WHAT IT MEANS. The form has two halves. The left half is the human side, the client's company and its teams: office floor plans, floors, people as single dots. The right half is the machine side, Claude Enterprise, the AI platform the teams build on: chip floorplans, die layers. One outline, one line weight, one camera; only what fills each half differs. The three dot plates sit at the core of the form, held where the two halves meet.

PALETTE. Near-black ground (#0A0908). Bone white (#EBE3D6) for structure and outlines. Muted gold (#CAA554) as the one accent. Sage green (#7A9E6A) for the living signal. Nothing else: no blue, no red, no purple.

FIDELITY. Abstract and sparse. Flat graphic drawing with thin even lines and square dots, centred in a square frame with generous black around it. No photorealism, no glossy 3D render, no faces, no words or letters; at most a few tiny tick marks and index numerals like 01 02 03 at the edges.
`.trim();

const SHAPES = [
  {
    id: "s1",
    name: "Mind Ring",
    shape: `SHAPE: MIND RING. The overall form is a thick ring, a gateway, standing upright, whose outer edge swells into two soft lobes across the top so it faintly recalls a mind without being one. The ring's opening is the core: the three dot plates hang in it, centred. The left half of the ring is the human side, the right half the machine side.`,
  },
  {
    id: "s2",
    name: "Gateway",
    shape: `SHAPE: GATEWAY. The overall form is a thick ring, a monumental gateway standing on edge in three-quarter view. At one point on its upper left the ring breaks open and its layers fray away into fine horizontal raster lines and loose dots, like a thought escaping. The three dot plates float inside the opening, at its centre. The left half of the ring is the human side, the right half the machine side.`,
  },
  {
    id: "s3",
    name: "Thought Taking Form",
    shape: `SHAPE: THOUGHT TAKING FORM. The overall form is an abstract rounded volume with a few soft lobes, closer to a seed or a cloud than to a brain. Its lower layers are solid and fully drawn; toward the top and the upper left the layers fray apart into fine horizontal raster lines and scattered dots streaming away, like a thought still becoming a form. A narrow gap down the middle splits it into a left human half and a right machine half, and the three dot plates sit at its core, seen through the gap.`,
  },
  {
    id: "s4",
    name: "Arc over the Mind",
    shape: `SHAPE: ARC OVER THE MIND. Two parts. A rounded, softly lobed volume (the thought) rests low in the frame, split by a narrow gap into a left human half and a right machine half, with the three dot plates inside the gap. A broken half-ring (the form, a gateway) arcs up and over it from behind, its upper end fraying into raster lines and dots. The arc is drawn in the same construction as the volume.`,
  },
];

const STYLES = [
  { id: "e1", pick: "pickE1", style: "STYLE: exactly the construction of the front-on contour-slice reference: stacked thin slices in bone-white hairline, each etched with a plan." },
  { id: "e2", pick: "pickE2", style: "STYLE: exactly the construction of the isometric stacked-ring reference: thick stacked contour rings in bone-white line, seen from slightly above in isometric, interiors etched with plans." },
  { id: "f1", pick: "pickF1", style: "STYLE: exactly the construction of the dot-cell terminal reference: everything built from small square dots and dash characters on a cell grid, with thin CRT corner brackets." },
];

const JOBS2 = SHAPES.flatMap((s) =>
  STYLES.map((st) => ({
    id: `${s.id}${st.id}`,
    route: s.id,
    title: `${s.name} · ${st.id.toUpperCase()} style`,
    refs: [st.pick, "plates", "kv"],
    aspect: "1:1",
    prompt: ["REFERENCE IMAGE ROLES:", ...[st.pick, "plates", "kv"].map((k) => `— ${ROLE[k]}`), "", BRAND2, "", s.shape, st.style].join("\n"),
  }))
);

/* Wave 3: storyboards. The ring and the stack are one object: the ring's left
   half is the team plate, its right half the agents plate, and the gold layer
   with the Thoughtform mark sits in the opening. Each frame is an EDIT of the
   frame before it (the previous frame rides first, as the base), so the
   object stays itself; each frame loses detail (hero → section → deep).
   One hero, two routes of three frames, per model. */
const KEEP = `Keep exactly: the camera, the near-black ground, the palette (bone white, muted gold, sage green only), the hairline line weight, the square-dot language of the plates, and the gold central plate with the engraved Thoughtform mark in the same place and size. No words or letters anywhere.`;

const HERO = {
  id: "h0",
  title: "Hero · the Mind Ring, the mark at its centre",
  refs: ["ring", "plates", "mark"],
  prompt: [
    "REFERENCE IMAGE ROLES:",
    ...["ring", "plates", "mark"].map((k) => `— ${ROLE[k]}`),
    "",
    BRAND2,
    "",
    "FRAME 1 OF 4, THE HERO. Redraw the ring as a single object seen in true isometric from slightly above, the same 30-degree angle as the dot plates, so it reads as a solid ring of stacked slices standing upright with depth. Its left half is the human side (office floor plans, people as dots), its right half the machine side (gold chip floorplans). In the ring's opening floats ONE plate only: the gold dot plate with the Thoughtform mark engraved on its top face. This is the richest frame: the etched plans are fully drawn. Wide landscape frame, the ring centred, generous black around it.",
  ].join("\n"),
};

const ROUTES3 = [
  {
    id: "r1",
    name: "The ring lies down into the stack",
    frames: [
      `FRAME 2 OF 4. Edit the base image. ${KEEP} Change one thing: the two halves of the ring begin to fold flat around the central gold plate, the left half swinging up and over to lie horizontally ABOVE the gold plate, the right half swinging down to lie horizontally BELOW it; they are caught halfway, tilted at about 45 degrees. As they fold, their etched floor plans and chip plans thin out and start to break into square dots.`,
      `FRAME 3 OF 4. Edit the base image. ${KEEP} Change one thing: the fold is complete. The left half has become a flat square plate of sage green dots lying ABOVE the gold plate; the right half has become a flat square plate of bone-white dots lying BELOW it. The three plates now form a stack exactly like the dot plates reference: green on top, the gold mark plate in the middle, bone at the bottom, evenly spaced, in the same isometric view. Only two faint hairline arcs remain where the ring was, as a ghost of it.`,
      `FRAME 4 OF 4, THE DEEP VIEW. Edit the base image. ${KEEP} Change one thing: the ghost arcs are gone and the three plates pull apart vertically, far apart, joined by thin dotted vertical lines; from the top plate thin dotted lines run out to the left edge, from the bottom plate thin dotted lines run out to the right edge, each ending in a small empty square outline. Sparse and calm: this is the simplest frame.`,
    ],
  },
  {
    id: "r2",
    name: "The halves open like doors",
    frames: [
      `FRAME 2 OF 4. Edit the base image. ${KEEP} Change one thing: the two halves of the ring swing apart sideways like a pair of doors, the left half pivoting out to the left and the right half to the right, about halfway open, so the gold mark plate now stands clear in the widening gap between them. Their etched plans start to thin out.`,
      `FRAME 3 OF 4. Edit the base image. ${KEEP} Change one thing: the halves are fully open, moved out to the far left and far right of the frame and turned to face the viewer as two tall curved panels; their etched plans reorganise into neat horizontal rows of dots. The gold mark plate stands alone at the centre, now the largest and brightest thing in the frame.`,
      `FRAME 4 OF 4, THE DEEP VIEW. Edit the base image. ${KEEP} Change one thing: the left panel resolves into a neat column of four small outlined rectangles each holding a tiny green dot; the right panel resolves into a column of four small outlined rectangles each holding a tiny bone-white dot; thin dotted lines run from the left column into the gold mark plate and from the plate out to the right column. The curved panels are gone. Sparse and calm: this is the simplest frame.`,
    ],
  },
];

/* Wave 4: the centre rethought. The owner: "we're still treating that
   Thoughtform layer like a square … I don't want to put it in a square."
   The halves stay (people left, transistors right, from his two favourites);
   the plates go; the centre is Thoughtform, drawn from the brand mark as the
   guiding star that connects the halves. 5 centres × 2 styles. */
const BRAND4 = `
THE BRIEF. A machine mind: the inner brain of an intelligence, not of a person. It is the visual symbol of Thoughtform, a studio that configures intelligence for companies, for its website. It may recall a brain, freely and artistically, but it is an instrument of thought, not anatomy.

WHAT IT MEANS. Its left half is the people: office floors, desks, tiny figures as dots. Its right half is the machine: transistors, chip dies, gold traces. Between them, at the centre, is Thoughtform itself, drawn from the Thoughtform brand mark (an open circle broken at the upper right, crossed by a level bar and a steep slanted bar that meet in a small stepped block): the guiding star that connects both halves. There is NO square plate, no stack of square plates and no chip-like square anywhere at the centre.

PALETTE. Near-black ground (#0A0908). Bone white (#EBE3D6) for structure. Muted gold (#CAA554) as the accent and for the mark. Sage green (#7A9E6A) for the living signal. Nothing else.

FIDELITY. Elegant, clean and sparse, more restrained than the style reference: fewer parts, more black. Thin even lines and square dots, centred in a square frame with generous black around it. No photorealism, no glossy render, no faces, no words or letters; at most a few tiny tick marks and index numerals at the edges.
`.trim();

const CENTRES = [
  { id: "c1", name: "Guiding Star", text: `CENTRE: GUIDING STAR. At the centre, in the gap between the halves, hangs a small, intensely bright point of light, a star. The brand mark is drawn around it at small scale in fine gold line, flat to the viewer, like a sighting reticle around the star. Fine straight rays of dotted light run from the star out to both halves, touching the floors on the left and the transistors on the right, as if the star were what both halves orient by.` },
  { id: "c2", name: "Armillary", text: `CENTRE: ARMILLARY. At the centre, the brand mark becomes a three-dimensional instrument: its open circle becomes two or three thin gold rings set at different angles like an armillary sphere or a gyroscope, broken at one point as the mark's circle is; its level bar and its steep slanted bar become the axles that pass through the rings and reach out to touch the left and the right halves. Fine and delicate, floating in the gap, a navigation instrument holding the two halves together.` },
  { id: "c3", name: "Nucleus", text: `CENTRE: NUCLEUS. At the centre floats a sphere made of particles: a loose cloud of small square dots in gold, green and bone, densest at its heart, its outer dots streaming outward into both halves as thin dotted threads. Inside the sphere the brand mark shows as a shape cut out of the dots, like a seed inside a nucleus.` },
  { id: "c4", name: "The Mark is the Mind", text: `CENTRE: THE MARK IS THE MIND. There is no object at the centre. Instead the whole mind is organised by the brand mark at full scale: the gap between the two halves runs along the mark's steep slanted bar, a thin level gap crosses it at the middle like the mark's level bar, and a thin gold orbit traces the mark's open circle around the entire mind, broken at the upper right. Where the two gaps cross, one small gold point of light.` },
  { id: "c5", name: "Beam", text: `CENTRE: BEAM. Through the gap between the halves rises one slender column of light made of fine gold dots, at the steep slant of the brand mark's bar, and a thin level plane of light crosses it at the middle where the two halves meet. Where beam and plane cross, the mark's small stepped block glows. Above the mind the beam frays into raster lines.` },
];

const STYLES4 = [
  { id: "a", fav: "favRing", text: "STYLE: the construction of the ring-of-slices reference: stacked thin contour slices in bone-white hairline, seen in isometric from slightly above, office interiors with tiny people in the left half, gold circuit floorplans in the right half, the upper left fraying into raster lines." },
  { id: "b", fav: "favCells", text: "STYLE: the construction of the dot-cell reference: small square dots on a terminal grid, office floors with tiny desks and figures on the left, gold die blocks and transistors on the right, the top fraying into long horizontal raster lines, thin CRT corner brackets." },
];

const JOBS4 = CENTRES.flatMap((c) =>
  STYLES4.map((s) => ({
    id: `${c.id}${s.id}`,
    route: c.id,
    title: `${c.name} · style ${s.id.toUpperCase()}`,
    refs: [s.fav, "mark"],
    aspect: "1:1",
    prompt: ["REFERENCE IMAGE ROLES:", `— ${ROLE[s.fav]}`, `— ${ROLE.mark.replace(/, engraved into the top face of the central gold dot plate, lying flat on the plate and foreshortened with it/, " as the centre describes")}`, "", BRAND4, "", c.text, s.text].join("\n"),
  }))
);

/* Wave 5: refine the owner's pick, C4 · ring (wave-4/c4a_gpt), "the mark is
   the mind". A chain of edits, one change per step, each step's output the
   next step's base, every step kept so a regression can be rolled back. */
const W5_BASE = resolve(ROOT, "docs/design/machine-mind/round-06/wave-4/c4a_gpt.png");
const W5_KEEP = `the camera, the near-black ground, the palette (bone white, muted gold, sage green only), the hairline line weight, the offices with people in the left sectors, the gold circuits in the right sectors, and the raster lines fraying away at the upper left`;
const W5_STEPS = [
  {
    id: "s1",
    name: "The mark exact",
    aspect: "1:1",
    text: `Edit the base image. Change ONE thing: the gold structure must match the Thoughtform brand mark in the second image exactly in its geometry. The thin gold outer circle becomes the mark's crescent: noticeably thicker along the lower left, tapering thin toward the top, and broken open at the upper right where the steep slanted gap leaves it. The level gap runs out past the circle on the right, as the mark's level bar does, and the circle has a short break there. The notched, stepped block where the two gaps cross keeps its shape. Keep exactly: ${W5_KEEP}, and everything inside the four sectors. No words or letters.`,
  },
  {
    id: "s2",
    name: "One solid",
    aspect: "1:1",
    text: `Edit the base image. Change ONE thing: the four sectors become four parts of one solid drum built of stacked thin contour slices. Every sector gets the same outer wall of stacked slices, the same height and the same number of slices, seen from the same slightly-above isometric view, so the right-hand sectors gain the wall the left-hand sectors already have. The tops of the sectors keep their etched contents. Keep exactly: the gold crescent, the two gaps, the stepped block and the point of light where they are, and ${W5_KEEP}. No words or letters.`,
  },
  {
    id: "s3",
    name: "Restraint",
    aspect: "1:1",
    text: `Edit the base image. Change ONE thing: halve the amount of detail. On the left, keep the office walls and desks but show people only as single tiny bone-white dots, and remove every green tree and plant. On the right, keep fewer and cleaner gold circuit traces and only a few die blocks, with more black between them. Neither emptier than a sketch nor as busy as the base. Keep exactly: the silhouette, the drum walls, the gold crescent, the two gaps, the stepped block, the fraying at the upper left, the palette and the camera. No words or letters.`,
  },
  {
    id: "s4",
    name: "The star",
    aspect: "1:1",
    text: `Edit the base image. Change ONE thing: the stepped block where the two gaps cross becomes the one lit thing in the picture. It glows warm gold-white with a small soft halo, and a few fine dotted rays run a short way along the two gaps. Nothing else becomes brighter. Keep exactly everything else: the silhouette, the walls, the crescent, the sectors and their contents, the fraying, the palette and the camera. No words or letters.`,
  },
  {
    id: "s5",
    name: "The hero frame",
    aspect: "3:2",
    text: `Edit the base image. Change ONE thing: set the object in a wide landscape frame with generous black on both sides. The object stays exactly as it is, the same shape, detail, proportions and lighting, centred in the frame and filling about 70 percent of the frame's height. No words or letters.`,
  },
];

async function runWave5(env, targets, outRoot) {
  const readPath = async (path) => ({ key: "prev", buf: await readFile(path), mime: "image/png", name: basename(path) });
  await Promise.all(
    targets.map(async ([, tag, fn]) => {
      let prev = W5_BASE;
      for (const step of W5_STEPS) {
        const stem = `${step.id}_${tag}`;
        const out = resolve(outRoot, `${stem}.png`);
        try {
          await readFile(out);
          console.log(`  =  ${stem} (kept)`);
          prev = out;
          continue;
        } catch {}
        if (ONLY && !ONLY.includes(step.id)) return;
        const job = { id: step.id, title: step.name, aspect: step.aspect, prompt: `REFERENCE IMAGE ROLES:\n— ${ROLE.prev}\n— ${ROLE.mark.replace(/, engraved into the top face of the central gold dot plate, lying flat on the plate and foreshortened with it/, "")}\n\n${step.text}` };
        try {
          const { buf, model } = await fn(env, job, [await readPath(prev), await readRef("mark")]);
          await writeFile(out, buf);
          await writeFile(resolve(outRoot, `${stem}.json`), JSON.stringify({ id: step.id, title: step.name, model, base: prev.replace(ROOT + "/", ""), prompt: job.prompt }, null, 2));
          console.log(`  ok ${stem}  ${Math.round(buf.length / 1024)} KB`);
          prev = out;
        } catch (err) {
          console.log(`  x  ${stem}  ${err.message ?? err}`);
          return;
        }
      }
    })
  );
}

/* Wave 6: back to wave 5's step 2 (the solid drum, where the owner says the
   floors still read), fix what slipped, then branch: the left as floors, and
   the mark given depth "without making it too overwhelming". */
const W6_BASE = resolve(ROOT, "docs/design/machine-mind/round-06/wave-5/s2_gpt.png");
const W6_KEEP = `the drum of stacked slices and its walls, the four sectors and their contents (offices with people on the left, gold circuits on the right), the gold crescent, the two gaps and the stepped block, the fraying raster lines at the upper left, the camera, the near-black ground, the palette (bone white, muted gold, sage green only) and the hairline line weight`;
const W6_A = {
  id: "a0",
  name: "The clean base",
  text: `Edit the base image. Change only these three small things, nothing else: (1) the level gap runs out past the circle on the right as the brand mark's level bar does, with a short break in the crescent there; (2) the stepped block where the two gaps cross glows softly warm gold-white, the one lit point, with a small halo; (3) the small green trees and plants are removed. Keep exactly: ${W6_KEEP}, and the amount of detail in the offices. No words or letters.`,
};
const W6_VARIANTS = [
  { id: "o1", name: "Floors in section", text: `Change ONE thing: the faces of the drum that are exposed along the two gaps show the drum in cross-section. On the left sectors the cut face reveals the floors of an office building, one floor per slice, each floor a thin slab with tiny standing people and desks seen in section. On the right sectors the cut face reveals the layers of a chip die in section, thin gold layers with vias between them. The tops keep their contents.` },
  { id: "o2", name: "Floors as terraces", text: `Change ONE thing: the tops of the two left sectors become open-plan office floors stepping down like terraces, each slice a full floor plate with desks, meeting tables and tiny people, clearly legible as the floors of an office building. The right sectors stay as they are.` },
  { id: "d1", name: "Crescent band", text: `Change ONE thing: give the brand mark depth through its crescent. The gold crescent becomes a band that wraps the drum's outer wall, as tall as the drum, with a visible top edge and a thin lit rim, thicker along the lower left as the mark is, broken at the upper right. The bars and the stepped block stay as they are. Restrained: no glow beyond a thin rim light.` },
  { id: "d2", name: "Blades", text: `Change ONE thing: give the brand mark depth through its bars. The two gaps each hold a thin gold blade standing upright, as tall as the drum, with a visible top edge and side; the level blade and the slanted blade meet in a small stepped gold pillar at the crossing, its top the lit point. The crescent stays as it is. Restrained: fine metal edges, no glow beyond the lit point.` },
  { id: "d3", name: "Channels", text: `Change ONE thing: give the brand mark depth by cutting it into the drum. The two gaps become channels sunk into the drum, with visible inner walls made of the stacked slices and a fine gold line running along each channel floor; the stepped block is a sunken, stepped well at the crossing with the lit point at its bottom. The crescent gains a slight thickness, like a gold rim on the drum's top edge. Restrained.` },
  { id: "d4", name: "Light", text: `Change ONE thing: give the brand mark depth with light, not geometry. A soft warm gold light rises out of the two gaps from inside the drum, faintly lighting their inner walls and fading upward into the black, strongest at the crossing. The crescent catches a thin highlight along its upper edge. Subtle: the light stays inside and just above the gaps, never a bloom over the sectors.` },
];

async function runWave6(env, outRoot) {
  const readPath = async (path) => ({ key: "prev", buf: await readFile(path), mime: "image/png", name: basename(path) });
  const roles = `REFERENCE IMAGE ROLES:\n— ${ROLE.prev}\n— ${ROLE.mark.replace(/, engraved into the top face of the central gold dot plate, lying flat on the plate and foreshortened with it/, "")}\n\n`;
  const aPath = resolve(outRoot, `${W6_A.id}_gpt.png`);
  try {
    await readFile(aPath);
    console.log(`  =  ${W6_A.id}_gpt (kept)`);
  } catch {
    const job = { id: W6_A.id, aspect: "1:1", prompt: roles + W6_A.text };
    const { buf, model } = await callOpenAI(env, job, [await readPath(W6_BASE), await readRef("mark")]);
    await writeFile(aPath, buf);
    await writeFile(resolve(outRoot, `${W6_A.id}_gpt.json`), JSON.stringify({ id: W6_A.id, title: W6_A.name, model, base: W6_BASE.replace(ROOT + "/", ""), prompt: job.prompt }, null, 2));
    console.log(`  ok ${W6_A.id}_gpt`);
  }
  const jobs = W6_VARIANTS.filter((v) => !ONLY || ONLY.includes(v.id)).flatMap((v) => [1, 2].map((n) => ({ v, n })));
  await Promise.all(
    jobs.map(async ({ v, n }) => {
      const stem = `${v.id}_gpt-${n}`;
      const job = { id: v.id, aspect: "1:1", prompt: `${roles}Edit the base image. ${v.text} Keep exactly everything else: ${W6_KEEP}. No words or letters.` };
      try {
        const { buf, model } = await callOpenAI(env, job, [await readPath(aPath), await readRef("mark")]);
        await writeFile(resolve(outRoot, `${stem}.png`), buf);
        await writeFile(resolve(outRoot, `${stem}.json`), JSON.stringify({ id: v.id, title: v.name, model, base: aPath.replace(ROOT + "/", ""), prompt: job.prompt }, null, 2));
        console.log(`  ok ${stem}`);
      } catch (err) {
        console.log(`  x  ${stem}  ${err.message ?? err}`);
      }
    })
  );
}

async function runWave3(env, targets, outRoot) {
  const readPath = async (path) => ({ key: "prev", buf: await readFile(path), mime: "image/png", name: basename(path) });
  const write = async (stem, job, buf, model, refs) => {
    await writeFile(resolve(outRoot, `${stem}.png`), buf);
    await writeFile(resolve(outRoot, `${stem}.json`), JSON.stringify({ id: job.id, title: job.title, model, refs, prompt: job.prompt }, null, 2));
    console.log(`  ok ${stem}  ${Math.round(buf.length / 1024)} KB`);
  };
  await Promise.all(
    targets.map(async ([, tag, fn]) => {
      const heroStem = `${HERO.id}_${tag}`;
      const heroPath = resolve(outRoot, `${heroStem}.png`);
      try {
        await readFile(heroPath);
        console.log(`  =  ${heroStem} (kept)`);
      } catch {
        const refs = await Promise.all(HERO.refs.map(readRef));
        const { buf, model } = await fn(env, { ...HERO, aspect: "3:2" }, refs);
        await write(heroStem, HERO, buf, model, HERO.refs);
      }
      await Promise.all(
        ROUTES3.filter((r) => !ONLY || ONLY.includes(r.id)).map(async (r) => {
          let prev = heroPath;
          for (const [i, text] of r.frames.entries()) {
            const job = { id: `${r.id}f${i + 2}`, title: `${r.name} · frame ${i + 2}`, aspect: "3:2", prompt: `REFERENCE IMAGE ROLES:\n— ${ROLE.prev}\n— ${ROLE.mark}\n\n${text}` };
            const stem = `${job.id}_${tag}`;
            try {
              const refs = [await readPath(prev), await readRef("mark")];
              const { buf, model } = await fn(env, job, refs);
              await write(stem, job, buf, model, [prev.replace(ROOT + "/", ""), "mark"]);
              prev = resolve(outRoot, `${stem}.png`);
            } catch (err) {
              console.log(`  x  ${stem}  ${err.message ?? err}`);
              return;
            }
          }
        })
      );
    })
  );
}

/* ------------------------------------------------------------- the models */

async function callGemini(env, job, refs) {
  const key = env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing from env");
  const model = "gemini-3-pro-image";
  const parts = refs.map((r) => ({ inline_data: { mime_type: r.mime, data: r.buf.toString("base64") } }));
  parts.push({ text: job.prompt });
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: job.aspect } },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text().catch(() => "")).slice(0, 400)}`);
  const json = await res.json();
  const img = (json?.candidates?.[0]?.content?.parts ?? []).find(
    (p) => p?.inlineData?.mimeType?.startsWith("image/") || p?.inline_data?.mime_type?.startsWith("image/")
  );
  if (!img) throw new Error(`gemini returned no image (finish: ${json?.candidates?.[0]?.finishReason ?? "unknown"})`);
  return { buf: Buffer.from(img?.inlineData?.data ?? img?.inline_data?.data, "base64"), model };
}

/* gpt-image-2 rejects input_fidelity; reference order carries the weight, so
   the plates go first. */
async function callOpenAI(env, job, refs) {
  const key = env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing from env");
  const model = "gpt-image-2-2026-04-21";
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", job.prompt);
  form.append("size", job.aspect === "3:2" ? "1536x1024" : "1024x1024");
  form.append("n", "1");
  form.append("quality", "high");
  for (const r of refs) form.append("image[]", new Blob([r.buf], { type: r.mime }), r.name);
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text().catch(() => "")).slice(0, 400)}`);
  const b64 = (await res.json())?.data?.[0]?.b64_json;
  if (!b64) throw new Error("openai returned no b64_json");
  return { buf: Buffer.from(b64, "base64"), model };
}

/* ---------------------------------------------------------------- driver */

if (WAVE_ARG === "6") {
  if (DRY) {
    console.log(`[dry] ${W6_A.id}_gpt  base=wave-5/s2  ${W6_A.name}`);
    for (const v of W6_VARIANTS) console.log(`[dry] ${v.id}_gpt-1,2  base=${W6_A.id}  ${v.name}`);
    process.exit(0);
  }
  const out6 = resolve(ROOT, OUT_ROOT);
  await mkdir(out6, { recursive: true });
  await runWave6(await loadEnv(), out6);
  console.log(`\ndone -> ${OUT_ROOT}/`);
  process.exit(0);
}

if (WAVE_ARG === "5") {
  const targets5 = [
    ["gemini", "nb", callGemini],
    ["openai", "gpt", callOpenAI],
  ].filter(([m]) => MODEL_FILTER === "both" || MODEL_FILTER === m);
  if (DRY) {
    for (const [, tag] of targets5) W5_STEPS.forEach((s) => console.log(`[dry] ${s.id}_${tag}  ${s.aspect}  base=prev+mark  ${s.name}`));
    process.exit(0);
  }
  const out5 = resolve(ROOT, OUT_ROOT);
  await mkdir(out5, { recursive: true });
  await runWave5(await loadEnv(), targets5, out5);
  console.log(`\ndone -> ${OUT_ROOT}/`);
  process.exit(0);
}

if (WAVE_ARG === "3") {
  const targets3 = [
    ["gemini", "nb", callGemini],
    ["openai", "gpt", callOpenAI],
  ].filter(([m]) => MODEL_FILTER === "both" || MODEL_FILTER === m);
  if (DRY) {
    for (const [, tag] of targets3) {
      console.log(`[dry] ${HERO.id}_${tag}  refs=${HERO.refs.join("+")}  ${HERO.title}`);
      for (const r of ROUTES3) r.frames.forEach((_, i) => console.log(`[dry] ${r.id}f${i + 2}_${tag}  refs=prev+mark  ${r.name} · frame ${i + 2}`));
    }
    process.exit(0);
  }
  const out3 = resolve(ROOT, OUT_ROOT);
  await mkdir(out3, { recursive: true });
  await runWave3(await loadEnv(), targets3, out3);
  console.log(`\ndone -> ${OUT_ROOT}/`);
  process.exit(0);
}

const WAVE = WAVE_ARG === "4" ? JOBS4 : WAVE_ARG === "2" ? JOBS2 : JOBS;
const jobs = ONLY ? WAVE.filter((j) => ONLY.includes(j.id)) : WAVE;
if (jobs.length === 0) {
  console.error(`no jobs matched. ids: ${WAVE.map((j) => j.id).join(", ")}`);
  process.exit(1);
}
const targets = [
  ["gemini", "nb", callGemini],
  ["openai", "gpt", callOpenAI],
].filter(([m]) => MODEL_FILTER === "both" || MODEL_FILTER === m);

if (DRY) {
  for (const j of jobs)
    for (const [, tag] of targets) console.log(`[dry] ${j.id}_${tag}  refs=${j.refs.join("+").padEnd(24)} ${j.title}`);
  console.log(`\n${jobs.length * targets.length} jobs`);
  process.exit(0);
}

const env = await loadEnv();
const outRoot = resolve(ROOT, OUT_ROOT);
await mkdir(outRoot, { recursive: true });

/* every job in flight at once, a few at a time per model */
const queue = jobs.flatMap((j) => targets.map(([, tag, fn]) => ({ j, tag, fn })));
let ok = 0;
let fail = 0;
async function worker() {
  for (let q = queue.shift(); q; q = queue.shift()) {
    const { j, tag, fn } = q;
    const stem = `${j.id}_${tag}${SEED ? `-${SEED}` : ""}`;
    try {
      const refs = await Promise.all(j.refs.map(readRef));
      const { buf, model } = await fn(env, j, refs);
      await writeFile(resolve(outRoot, `${stem}.png`), buf);
      await writeFile(
        resolve(outRoot, `${stem}.json`),
        JSON.stringify({ id: j.id, route: j.route, title: j.title, model, refs: j.refs.map((k) => REFS[k].replace(ROOT + "/", "")), prompt: j.prompt }, null, 2)
      );
      console.log(`  ok ${stem}  ${Math.round(buf.length / 1024)} KB`);
      ok += 1;
    } catch (err) {
      console.log(`  x  ${stem}  ${err.message ?? err}`);
      fail += 1;
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`\ndone - ${ok} ok, ${fail} fail -> ${OUT_ROOT}/`);
