import type {
  CardFaceVariant,
  CardFigure,
  CardFigureInk,
  CardTitleStyle,
} from "@/components/landing/home-v2/services/hologram/ServicesCardRing";

/**
 * The directions under judgement.
 *
 * A card is THREE components (owner, 2026-08-30): a title, a paragraph, and a
 * visualization. `face` feeds `ServicesCardRing`'s `faceVariant` prop, so v0
 * bakes the shipped stack byte-identically — the reference has to be the real
 * thing or the comparison is worthless. `openPlate` gates the DOM spec plate.
 *
 * ⚠ EVERY ROW BELOW USES A DIFFERENT VISUALIZATION LANGUAGE. The first pass
 * shipped one dot-lattice under six names with the title moved twice, and the
 * owner called it lazy — correctly: those were re-anchorings of one design, not
 * six designs. The rule for adding a row is that it must differ from every
 * other in WHAT IS DRAWN, not only in where the words sit.
 *
 * Each language reads a specific card on the Brand Codex reference board, named
 * in its `provenance`.
 */
export interface FaceVariant {
  id: string;
  label: string;
  face: CardFaceVariant;
  openPlate: boolean;
  thesis: string;
  provenance: string;
  /**
   * The treatment this row PINS, if it pins one (`FaceComposition.pin`).
   *
   * ⚠ Declared here as well so the console can say so. The chips stay live and
   * keep driving every other row, so a console that went on reading "Title ·
   * STAMP" over a card that is ignoring the chips would be lying about the one
   * row it matters most on.
   */
  pinnedTitle?: CardTitleStyle;
  /**
   * The row bakes the RE-CUT four (`serviceRecut.ts`: Keynote · Workshop ·
   * Embedded with Advisory folded in · Home session) instead of production's
   * record. The 2026-09-19 material rows carry it; every earlier row keeps
   * the shipped copy so the survey stays what it was.
   */
  recut?: boolean;
  /** An in-canvas figure over the face — V · Volume's point cloud, or one of
   *  the lattice families. */
  figure?: CardFigure;
  /** The figure's default ink on this row (the console's INK chips override). */
  figureInk?: CardFigureInk;
}

export const FACE_VARIANTS: readonly FaceVariant[] = [
  {
    id: "v0",
    label: "V0 · Shipped",
    face: "full",
    openPlate: false,
    thesis:
      "The current bake: chip, includes row, title, lede and CTA over the photo. Five elements, two of them headline weight — the read the owner called overwhelming.",
    provenance: "ADR-029 §4 · reference only",
  },
  {
    id: "v1",
    label: "V1 · Tight face",
    face: "tight",
    openPlate: false,
    thesis:
      "Chip + title + lede + a subtle OPEN chit. The dense meta row and the full-width CTA slab are gone; the paragraph stays, but the title now leads it instead of competing at near-equal size.",
    provenance: "ADR-050 candidate · rest state",
  },
  {
    id: "v2",
    label: "V2 · Tight + spec",
    face: "tight",
    openPlate: true,
    thesis:
      "The tight face, plus the plate that grows out of the card's own rect: 01 / WHAT (lede + breakdown), 02 / HOW (duration, participants, format, language, what they keep). Click the front card.",
    provenance: "ADR-050 candidate · full beat",
  },
  {
    id: "v3",
    label: "V3 · Halftone",
    face: "halftone",
    openPlate: false,
    thesis:
      "The photograph KEPT, re-screened into square halftone cells after the tone pass. It answers the portrait question the other way: still you, but read as material the system processed rather than a headshot dropped into a card. Title top-left, paragraph at the foot — the shipped anchors, so the only change is the treatment.",
    provenance: "The Marketing Memory Co. — the dithered runner",
  },
  {
    id: "v4",
    label: "V4 · Constellation",
    face: "constellation",
    openPlate: false,
    thesis:
      "A GRAPH — and FOUR graphs. The node positions are IDENTICAL on all four cards, because they stand for the same estate of work; what changes is the structure drawn over it, which is what a service does. Keynote is a RADIANT (one source reaches a room that is not wired to itself yet). Workshop is a ROUTE (one workflow walked end to end, both ends marked). Embedded is a MESH (a body that holds itself up, marks seated inside it). Advisory is a SURVEY (five regions, a dashed gold traverse across their marks, and nodes joined to nothing — the person-led work). Title centred at the head, paragraph centred at the foot.",
    provenance: "Indent — 'Your intelligent co-worker' · four figures, one vocabulary",
  },
  {
    id: "v5",
    label: "V5 · Dendrite",
    face: "dendrite",
    openPlate: false,
    thesis:
      "GROWTH: a recursive branching figure built by a rule rather than placed — six primaries from the centre, each forking into finer generations, a junction mark at every branch point and the signal carried at the tips. Title centred at the head, paragraph centred at the foot. The figure is different for every service because the rule runs on its own seed.",
    provenance: "'We're manufacturing biology' — the red dendrite",
  },
  {
    id: "v6",
    label: "V6 · Meridian",
    face: "meridian",
    openPlate: false,
    thesis:
      "A BODY in fine section: twenty-six longitude arcs sweeping pole to pole, crowding at the silhouette exactly as they do on a globe, with one brighter waist ring. The one language here built from curves — and deliberately, because it is the site's OWN armillary vocabulary rather than a borrowed one. Title centred, paragraph centred at the foot.",
    provenance: "'The brain is an unexplored canvas' — the orange sphere",
  },
  {
    id: "v7",
    label: "V7 · Nebula",
    face: "nebula",
    openPlate: false,
    thesis:
      "DENSITY as the subject. No outline anywhere: a lobe emerges only because the marks are denser inside it, and falls off past the rim. The title sits LOW and large over the field with NO paragraph at all — the card carries one claim and a picture, which is the most confident arrangement on the board and the one that gives up the most information.",
    provenance: "'This isn't space, it's your brain'",
  },
  {
    /* ⚠ THIS ROW GAVE UP THE `v8` SLOT (owner, 2026-08-30: "build V8 based on
       the Meridian"). Panel keeps its name and loses its number — a survey
       ordinal marks a position in a survey, and once the survey has a winner it
       is a label pretending to be an order. `?v=panel` reads better anyway. */
    id: "panel",
    label: "Panel",
    face: "panel",
    openPlate: false,
    thesis:
      "NO imagery whatsoever — hairlines divide the field into asymmetric panels and exactly ONE cell is filled, which is the accent's entire budget on the card. The most restrained language on the board and the closest to what this house already draws elsewhere (the intelligence map's divided plate). Title top-left, paragraph at the foot.",
    provenance: "Adaptive — 'Automatically take action across every inbox'",
  },
  {
    id: "v9",
    label: "V9 · Glyph",
    face: "glyph",
    openPlate: false,
    thesis:
      "The ENCODED: a bilaterally symmetric block mark on a coarse lattice — symmetry is what separates a glyph from noise — with a dither spray eroding its edge into the field it was read from. The drawing takes the upper band and the title and paragraph stack together, centred, at the foot.",
    provenance: "The Marketing Memory Co. — the blue block glyph",
  },
];

/**
 * The TITLE treatments — a second, independent axis.
 *
 * ⚠ Worth knowing before judging these: ALMOST NO CARD ON THE REFERENCE BOARD
 * FRAMES ITS TITLE. TALON, Droidrun, Thereby, Indent, Adaptive and both brain
 * cards set theirs as plain type — the title reads as a title because of SIZE
 * and POSITION, not because it is in a box. The frame is a Thoughtform
 * invention (owner, 2026-08-29), which is exactly why it is worth seeing
 * against the alternatives rather than assumed.
 */
export const TITLE_STYLES = ["framed", "chip", "bare", "display", "band", "stamp"] as const;

export const TITLE_NOTE: Record<string, string> = {
  framed:
    "The shipped treatment — a hairline Tensor Gold frame with the leading diamond, 40px. Reads as a labelled key on a device.",
  chip: "The ADR-029 original — a SOLID Tensor Gold stamp with the ink knocked out of it, 34px. The loudest of the six and the only one that spends the accent as a fill rather than a line; ink on gold measures ~8.2:1.",
  bare: "No box, no mark, same 40px. What the reference board does by default: the title is a title because of where it sits, not because it is enclosed.",
  display:
    "No box, 62px. Size alone carries the hierarchy — TALON's move, and the one that makes the card read as a poster rather than a component.",
  band: "44px over a full-width gold rule. The Heading Indicator grammar applied to the title: an active state is a directional edge, never a fill.",
  stamp:
    "36px under a hairline, wide-tracked — the '// LABEL' bearing convention with its ordinal dropped (no ordinals survive on this surface).",
};

/**
 * The HOUSE INSTRUMENTS — appended 2026-08-30 on the owner's brief to "tap into
 * our particle system, our glyphs, whatever, our diagrams".
 *
 * All three take MERIDIAN's approved arrangement (title centred at the head,
 * paragraph centred at the foot) and differ only in the drawing, so choosing
 * between them is a choice about the visual and nothing else.
 */
export const HOUSE_VARIANTS: readonly FaceVariant[] = [
  {
    id: "h1",
    label: "H1 · Sigil",
    face: "sigil",
    openPlate: false,
    thesis:
      "The BRANDMARK ITSELF as a stratified point cloud — not a picture of the mark, the mark: sampleShape hit-tests the real BRANDMARK_FULL_PATHS with the same sampler the corridor's particle painter runs, so this cloud and the landing's brandmark are one artifact at two densities. Each service takes a different density tier off ADR-011's own ladder, so the mark resolves for one and disperses for another. The shape never changes, because it is the brandmark.",
    provenance: "lib/brandmark/sampleShape.ts · ADR-011 density tiers",
  },
  {
    id: "h2",
    label: "H2 · Armillary",
    face: "armillary",
    openPlate: false,
    thesis:
      "The celestial-connector vocabulary composed into one instrument: the five-radius ring ladder with its per-ring dashes, a 36-tick graduated rim, two tilted orbital paths carrying diamond nodes, and the reticle at the centre on its own opaque disc so the orbits pass behind the mark. This is the diagram language the site already speaks between sections, at card scale.",
    provenance: "CelestialConnector/shapes — Rings · BearingTicks · OrbitalNodes · Reticle",
  },
  {
    id: "h3",
    label: "H3 · Crystal",
    face: "crystal",
    openPlate: false,
    thesis:
      "The faceted skill symbol: an outer N-gon, a rotated inner N-gon at half a step, and a facet line from every outer vertex to its two nearest inner ones. The most minimal drawing the house owns — its own primitive calls it 'sharp geometry, diamonds not circles, zero border-radius'. The per-service variable is the FACET COUNT (4 · 5 · 6 · 8), so each card is a different SOLID rather than a different noise.",
    provenance: "CelestialConnector/shapes/CrystalFacet.tsx",
  },
];

/**
 * THE PROPOSAL — the one row that is answering rather than asking.
 *
 * Every row above is a reference read off the board, crossed against six
 * settings of the name and judged side by side. This one is the composition the
 * owner chose, finished: the constellation drawing on the Meridian arrangement,
 * with the two open questions closed.
 *
 * ⚠ IT PINS ITS TITLE TREATMENT, so the treatment chips do not reach it. That
 * is the difference between a proposal and a survey row, and it is deliberate
 * that pressing DISPLAY / FRAMED / STAMP visibly changes twelve cards and not
 * this one.
 *
 * ⚠ AND IT REUSES A LANGUAGE, which the rule above forbids for a survey row and
 * requires here. "Every row is a different drawing" is what stops an exploration
 * from being one design with the text moved; a proposal is the opposite job — it
 * takes the drawing that WON and composes it properly. If this row invented a
 * thirteenth figure it would be a thirteenth question.
 */
export const CANDIDATE_VARIANTS: readonly FaceVariant[] = [
  {
    id: "v8",
    label: "V8 · Service card",
    face: "card",
    openPlate: false,
    pinnedTitle: "display",
    thesis:
      "THE PROPOSAL. The constellation drawing on the Meridian arrangement — title centred at the head, paragraph centred at the foot — with both open questions closed. The title treatment is PINNED to display (a card that changes when you press a chip has not been decided). The drawing's band is SOLVED rather than picked: centred in the space the type leaves at its worst case across all four services, 100 units of clearance at each end, so no card is composed at another card's expense. And the title's datum is measured off the expand chit — a centred title cannot share the chit's centre line the way a top-left one does, so the answer is the opposite of alignment: clear it far enough to read as its own band. The chit itself does not move; the type does.",
    provenance: "Meridian arrangement · constellation drawing · owner 2026-08-30",
  },
];

/**
 * THE THREE MATERIALS (owner, 2026-09-19: "holographic ASCII … explore some
 * different directions … JavaScript, three.js, SVGs"), on the RE-CUT four.
 *
 * ⚠ ONE FIGURE RECORD, THREE MATERIALS. Every row draws the same subject —
 * `lib/services-ring/serviceFigures`: one estate of work, a structure per
 * service (RADIANT · ROUTE · MESH with the person-led nodes left open · THE
 * TABLE) — and differs ONLY in what it is made of. The composition is V8's,
 * held fixed. That is the opposite of the survey's rule above and it is
 * deliberate: the survey asked WHAT to draw and V8 answered; these rows ask
 * what to draw it IN, and a question about material is only readable when
 * nothing else moves.
 */
export const MATERIAL_VARIANTS: readonly FaceVariant[] = [
  {
    id: "raster",
    label: "R · Raster",
    face: "raster",
    openPlate: false,
    pinnedTitle: "display",
    recut: true,
    thesis:
      "CANVAS. The figure re-screened as a character grid: PT Mono glyphs on a fixed pitch, one per cell, chosen off a density ramp (· − + = # @) by how much of the structure the cell covers, alpha by the same, every third row losing light as a scan cadence. A near node letters @, a far one ·; the marks stay diamonds. Static bake, zero per-frame cost; the phone takes it unchanged.",
    provenance:
      "HORSE 2026 (figma × крона) · the dot-matrix horse · ASCII portraits on the design rack",
  },
  {
    id: "volume",
    label: "V · Volume",
    face: "volume",
    figure: "volume",
    openPlate: false,
    pinnedTitle: "display",
    recut: true,
    thesis:
      "THREE.JS. The same figure given its third dimension back — the cloud is a sphere and the constellation projected it flat. Nodes as PT Mono glyph sprites at their own depth over the band, chords as hairlines, the near hemisphere protruding in front of the face. Nothing animates it: it is geometry inside the card's group, so the ring's turn and the rig's pointer-look give it real parallax, which is what makes a hologram read as one. The face bakes the type alone.",
    provenance:
      "The particle body on its platform · the wireframe orbits · ADR-021's card-content clause",
  },
  {
    id: "wire",
    label: "W · Wire",
    face: "wire",
    openPlate: false,
    pinnedTitle: "display",
    recut: true,
    thesis:
      "SVG. The figure as line work on the house ring register — the About drawing's rings on their dash ladder, the rim graduated every 15° off the cardinals, four stubs — emitted ONCE as path data and rendered twice: rasterised into this bake through Path2D, and as the inline SVG strip below, which is the future mobile plate. A technical illustrated line object, not a brighter additive glow.",
    provenance: "The wireframe device · ADR-106's dial (copied, never imported) · ADR-025 U4",
  },
];

/**
 * THE RASTER'S SHAPE FAMILIES (owner, 2026-09-19, on reading the first
 * sheet: "make some variants of the raster … find different shapes … like
 * volumetric shape, so no lines as in workshop").
 *
 * All three ride ONE renderer (`cardViz.ts` §The volumetric raster): a ray
 * march per cell over an implicit body, shaded from one light, faded with
 * depth, lettered through the glyph ramp. The line figures are gone; every
 * card is a solid that reads through its shading. What differs between the
 * rows is which bodies, and each row keeps one family with four members so
 * the set still reads as a set.
 */
export const RASTER_VARIANTS: readonly FaceVariant[] = [
  {
    id: "bodies",
    label: "R2 · Bodies",
    face: "raster-bodies",
    openPlate: false,
    pinnedTitle: "display",
    recut: true,
    thesis:
      "THE RECORD AS FUSED VOLUMES. The same four structures, every one of them turned into a body: the radiant's source a large ball with its room as small ones; the route a worm of fused balls along the walk, no line anywhere; the mesh's reached nodes one lumpy body, the person-led nodes small balls that touch nothing; the table eight balls fused into a ring. Metaballs, shaded from one light, faded with depth. The marks are the record's own.",
    provenance: "serviceFigures · the HORSE's shaded form · the particle body",
  },
  {
    id: "solids",
    label: "R3 · Solids",
    face: "raster-solids",
    openPlate: false,
    pinnedTitle: "display",
    recut: true,
    thesis:
      "FOUR PRIMITIVE BODIES, each the structure's claim as a solid: keynote a sphere under one light (one source, the room lit from it, the terminator the frame's reach); workshop a torus (one loop walked end to end); embedded the house's own chamfered slab, TR + BL (a configuration is a machined object); home session eight spheres fused into a ring (the table). No diagram, no line — a form and its shading.",
    provenance: "The wireframe device · the corner law's own slab · the armillary rings",
  },
  {
    id: "knots",
    label: "R4 · Knots",
    face: "raster-knots",
    openPlate: false,
    pinnedTitle: "display",
    recut: true,
    thesis:
      "ONE FAMILY, FOUR MEMBERS: a torus knot per service — (1,3) · (2,3) · (3,4) · (2,7) — as a thick tube shaded from one light. The loop is the house's own canon; the crossings are the variable, and the four read as a set because the vocabulary is one tube at one thickness. The most 'object' of the three rows, and the least tied to what a service does.",
    provenance: "The Arc as a loop · the wireframe orbits · the gold armillary",
  },
];

/**
 * THE LATTICE FAMILIES (owner, 2026-09-19, round three, on reading the
 * raster's bodies: "continue a bit with volume, where they protrude a bit …
 * use a bit of the raster and have them protrude … not from the back of the
 * card, only from the front, like some sort of hologram … the original
 * holograms folder … Dendrite is also quite interesting … try different
 * shapes and also try a bit with our Tensor Gold color").
 *
 * One material: a body voxelised on the raster's own cell grid, every
 * surface cell a glyph off the shaded ramp, every cell a sprite at its cell's
 * size — from the front the raster, under the ring's turn a volume. The
 * body's back is seated on the face plane and all of it protrudes toward the
 * viewer; nothing goes through the card. The rows differ in which bodies
 * (`lib/services-ring/figureFields.ts`), and default to Tensor Gold; the
 * console's INK chips flip any of them to the face's ink.
 */
export const LATTICE_VARIANTS: readonly FaceVariant[] = [
  {
    id: "lattice",
    label: "V2 · Lattice",
    face: "volume",
    figure: "lattice",
    figureInk: "gold",
    openPlate: false,
    pinnedTitle: "display",
    recut: true,
    thesis:
      "THE SOLIDS, THROWN UP FROM THE CARD. The same four bodies as the raster's R3 — a sphere under one light, a torus, the house's chamfered slab, eight spheres fused into a ring — voxelised on the raster's grid and floated in front of the face as a lattice of glyph sprites. Head-on it reads as the character matrix; as the ring turns the depth opens. The wireframe orbit sphere and the device box from the reference folder, in this house's material.",
    provenance:
      "The holograms folder · figureFields.solidBody · cardFigureVolume.buildLatticeGeometry",
  },
  {
    id: "dendrite3d",
    label: "V3 · Dendrite",
    face: "volume",
    figure: "dendrite",
    figureInk: "gold",
    openPlate: false,
    pinnedTitle: "display",
    recut: true,
    thesis:
      "V5's growth rule, grown OUT of the card: every root on the face, every branch leaning toward the viewer, forking by generation, the tips lettered in gold. Keynote one root fanning six primaries wide (the radiant as growth); workshop one vine with short side buds (the route); embedded eight primaries, dense (the mesh); home session eight short shrubs on a ring (the table). The particle body on its platform, as a tree.",
    provenance: "V5 · Dendrite (2026-08-30) · the teleport figure · figureFields.dendriteBody",
  },
  {
    id: "relief",
    label: "V4 · Relief",
    face: "volume",
    figure: "relief",
    figureInk: "gold",
    openPlate: false,
    pinnedTitle: "display",
    recut: true,
    thesis:
      "A HEIGHTFIELD ON THE CARD — the isometric terrain reference's grammar. Keynote one peak with radial ridges; workshop a broad ridge winding across and rising toward its exit; embedded a plateau with three mounds where the seats sit; home session a crater rim around a flat floor. Protrudes by construction: a relief only ever stands on its ground.",
    provenance: "The ZERO terrain still · figureFields.reliefBody",
  },
  {
    id: "knots3d",
    label: "V5 · Knots",
    face: "volume",
    figure: "knots",
    figureInk: "gold",
    openPlate: false,
    pinnedTitle: "display",
    recut: true,
    thesis:
      "The raster's torus knots as a lattice in front of the card — the row that most needs the depth, since a knot is a knot only when its crossings are seen to cross.",
    provenance: "R4 · Knots · figureFields.knotBody",
  },
];

/**
 * THE PORTRAIT RASTER (owner, 2026-09-19, round four, on reading the
 * lattice: "I don't think I want the extrusion effect. What I actually want is
 * a variant of raster that fills in most of the card but doesn't make the
 * title and the bottom paragraph illegible … when you hover over it, it
 * reveals the photos. In v0 shipped, we had photos of myself. Maybe we can
 * restore that, but only have them revealed when you hover over it, with some
 * sort of pixelated effect"; asked what the rest raster is made of: "the
 * photograph itself, as glyphs").
 *
 * ⚠ THIS ROW RE-OPENS ADR-086's PHOTO REMOVAL, on one lab row, by his word.
 * The defence is the reference board's own second move — V3 Halftone's
 * reading: the person stays as MATERIAL (processed into the grammar,
 * recognisable, not a headshot), and the photograph proper appears only under
 * the hand. All three of ADR-086's silent consumers are consumers again here:
 * the fetch fires, the veil plane is repurposed, the `full` band scrims.
 */
export const PORTRAIT_VARIANTS: readonly FaceVariant[] = [
  {
    id: "portrait",
    label: "R5 · Portrait",
    face: "raster-photo",
    openPlate: false,
    pinnedTitle: "display",
    recut: true,
    thesis:
      "THE PHOTOGRAPH ITSELF, AS GLYPHS. At rest the whole card is the raster's character matrix lettering the portrait — 78 × 76 PT Mono cells, each a glyph off the shaded ramp by the toned plate's luminance under it, normalised to the plate's own range, every third row losing light — held to a quarter of its alpha under the title band and the paragraph band so the type stays legible over it, the scrims stacked on top. HOVER resolves the photograph proper out of it: the veil plane carries the same composition baked without the glyph pass, and cells of a fixed 42 × 68 grid pop in as a damped level rises, the mosaic under them refining from 24 × 39 to full resolution — the type bands cross-fade crisp on the same clock, so the title and the paragraph never move. One subject at two densities; a resolve, not a swap. Pointer-driven and damped, the veil's own class of motion; desktop only.",
    provenance:
      "HORSE 2026 · V3 Halftone's reading of ADR-086 · the veil plane (ADR-050 U3), repurposed",
  },
];

/** The two inks the console offers on any figure row. */
export const FIGURE_INKS = ["ink", "gold"] as const;
