/**
 * lib/musings/cover — a post's drawn cover (ADR-119). Pure, zero imports.
 *
 * The owner's ruling, 2026-09-22: the card carries a thumbnail, and the
 * thumbnail is DRAWN IN CODE — no photography, no image-API spend. So the
 * cover has to earn its place the way every other instrument on this site
 * does: **it draws the record.** Three readings, and nothing decorative:
 *
 *   1. **Which beat of the Arc the post belongs to** — taken from the post's
 *      own `tags`, not authored twice. `navigate` / `encode` / `build` are
 *      already the site's three proper nouns, and the three posts on disk
 *      carry exactly one of them each.
 *   2. **Where in its year it was written** — the date as a fraction along a
 *      baseline, with a lit mark on it. The arcs instrument's own idiom
 *      (ADR-118): a record plotted at its filing date.
 *   3. **A substrate** whose pitch is seeded off the slug, so two covers of
 *      the same beat are not the same picture.
 *
 * ⚠ **THE BEAT GLYPH IS A PROPER NOUN, WHICH IS WHY REUSING IT IS CORRECT
 * HERE AND WAS REFUSED ELSEWHERE.** ADR-106 declined to mount
 * `PhaseGlyphSvg` on the outcomes dial because "those glyphs MEAN Navigate /
 * Encode / Build, and a silhouette here is a proper noun" — the dial was not
 * about those three things. This cover IS about which of the three a post
 * belongs to, so the drawing means what it says. The GRAMMAR is copied
 * (24-unit box, `fill: none`, `stroke: currentColor`, 1.5 stroke) rather than
 * imported, per that same ADR: the rail's marks are authored at 16px and this
 * is drawn at ~5× that, and a rail glyph imported into a card is a dependency
 * from a station onto the frame's chrome.
 *
 * ⚠ **A POST WITH NO ARC TAG IS A REAL CASE AND DRAWS NO GLYPH.** `beat`
 * returns `null` and the cover is the field, the baseline and the mark — the
 * house diamond is NOT substituted, because a diamond that means "we had
 * nothing to say here" is worse than an honest empty field. The three
 * existing posts all carry one; an imported LinkedIn note may not.
 */

/** The Arc's three beats — the site's own proper nouns. */
export type MusingBeat = "navigate" | "encode" | "build";

const BEATS: readonly MusingBeat[] = ["navigate", "encode", "build"];

/**
 * The post's beat, from its tags.
 *
 * ⚠ THE ORDER IS THE ARC'S, NOT THE TAG ARRAY'S. A post tagged
 * `[practice, encode]` and one tagged `[encode, practice]` must draw the same
 * cover; scanning the Arc's own order rather than the author's makes the
 * result independent of how the frontmatter happened to be typed. A post
 * carrying two beats takes the earlier one and that is a content question,
 * not a rendering one.
 */
export function beatOf(tags: readonly string[]): MusingBeat | null {
  const lower = tags.map((t) => t.toLowerCase());
  return BEATS.find((b) => lower.includes(b)) ?? null;
}

/**
 * A stable 0..1 from a slug — FNV-1a, because it is four lines and has no
 * clustering on short ASCII keys.
 *
 * ⚠ IT MUST BE STABLE ACROSS BUILDS, NOT MERELY RANDOM-LOOKING. The cover is
 * rendered on the server and again on the client, and a post whose substrate
 * re-pitched on hydration would flicker once on every load.
 */
export function slugSeed(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * How far through its year the post was written, `[0, 1]`.
 *
 * ⚠ DAY-OF-YEAR FROM THE STRING, NEVER `new Date(...)`. `MusingPost.date` is
 * an ISO `YYYY-MM-DD` with no zone, so `new Date()` parses it as UTC and
 * renders it in the reader's local zone — which moves the mark by a day, and
 * across a year boundary by the whole width of the plot, for anyone west of
 * Greenwich. The registry has this trap recorded one module over (gray-matter
 * hands back a `Date`); this is the same class from the other end.
 */
export function yearFraction(date: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return 0.5;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const doy = cum[Math.min(11, Math.max(0, month - 1))] + (leap && month > 2 ? 1 : 0) + day;
  return Math.min(1, Math.max(0, (doy - 0.5) / (leap ? 366 : 365)));
}

/** Everything the cover draws, resolved. */
export interface MusingCoverSpec {
  beat: MusingBeat | null;
  /** The substrate's dot pitch in px — 9..15, seeded. */
  pitch: number;
  /** The lit mark's seat along the baseline, as a percentage. */
  markX: number;
  /** Two more marks either side, unlit — the record has neighbours. */
  ghostX: readonly number[];
}

export function coverSpec(post: {
  slug: string;
  date: string;
  tags: readonly string[];
}): MusingCoverSpec {
  const seed = slugSeed(post.slug);
  const f = yearFraction(post.date);

  /* Seated between 14% and 86% so the mark never lands under the box's own
     edge — the baseline runs the full width and a mark on the wall reads as
     a clipped drawing rather than as a plotted date. */
  const markX = 14 + f * 72;

  /* The ghosts are the plot's other filings. Their seats are seeded, never
     the record's — this cover knows about one post — and they are pushed
     clear of the lit mark so the reading stays "one of these is this one". */
  const spread = 16 + seed * 12;
  const ghostX = [markX - spread, markX + spread * 1.4].filter((x) => x > 6 && x < 94);

  return { beat: beatOf(post.tags), pitch: 9 + Math.round(seed * 6), markX, ghostX };
}
