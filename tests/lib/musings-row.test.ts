import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { coordStamp as arcCoordStamp } from "@/components/arcs/chrome";
import { ROW_ARRIVE_END, ROW_ARRIVE_IN, ROW_ARRIVE_OUT, rowArrive } from "@/lib/musings/arrive";
import { MUSINGS_LIST_MAX } from "@/lib/musings/cards";
import { beatOf, coverSpec, slugSeed, yearFraction } from "@/lib/musings/cover";
import {
  HEAD_LEAVE_AT,
  HEAD_LINE_STAGGER_S,
  HEAD_REARM_BELOW,
  HEAD_RETURN_BELOW,
  HEAD_REVEAL_AT,
  headFrame,
  headRunEnd,
  headRunLive,
  headSpan,
  headTarget,
  typedCount,
  type HeadRun,
} from "@/lib/musings/headDecode";
import {
  MUSINGS_COORDS,
  MUSINGS_MASTHEAD,
  MUSINGS_TITLE_TEXT,
  coordStamp,
} from "@/lib/musings/mastheadData";
import {
  ORBIT_HALF,
  ORBIT_HALO,
  ORBIT_QUARTER_R,
  ORBIT_QUARTERS,
  ORBIT_RIM,
  ORBIT_RINGS,
  dayOfYear,
  orbitPoint,
  orbitSpec,
} from "@/lib/musings/orbit";
import { VOIDWALKER_HOLOGRAM_EXIT_WINDOW } from "@/lib/voidwalker/voidwalkerHologramClock";

/**
 * The list's arrival, the head's decode, and the source ratchets (ADR-121 →
 * ADR-122).
 *
 * The list has NO geometry module — its rows are solved from the count in the
 * sheet and one attribute the writer moves on an event opens a note — so what
 * a unit test can hold is the arrival's hysteresis, the head's clock, the
 * drawing's arithmetic, and the SOURCE: that the rung is mirrored, that the
 * open note grows on its two transitions, that the sign is solved onto the
 * cover's floor, that the arrival is a line that unfolds, that nothing 3D
 * survived, that every note is a real link, and that the writer renders
 * nothing. The capture (`scripts/capture-musings-row.mjs`) checks what the
 * browser does with it. (The file keeps its name: the station was a row when
 * it was written, and every pin below that survived is still its.)
 */

describe("rowArrive — the bounded burst", () => {
  it("opens after the head's own reveal, never with it", () => {
    // The owner's order: the text appears with a glitch effect, THEN the cards
    // come into view. The writer also holds `in` until the head has resolved.
    expect(ROW_ARRIVE_IN).toBeGreaterThan(HEAD_REVEAL_AT);
  });

  it("is re-solved for the ONE dwell, not the detented runway", () => {
    // ADR-119 U2 opened at 0.26 of a runway that grew a step per card; the
    // station pins for ONE dwell (120svh since ADR-122 U1, 60 before), and 0.26
    // of that would hold the notes shut for ~31svh after the head had resolved.
    // Inside the first eighth of the dwell; 0.05 is the old 6svh, re-solved.
    expect(ROW_ARRIVE_IN).toBeGreaterThanOrEqual(0.05);
    expect(ROW_ARRIVE_IN).toBeLessThanOrEqual(0.125);
  });

  it("closes at 0.95, before the head leaves, so the exit is the entry backwards", () => {
    expect(ROW_ARRIVE_END).toBe(0.95);
    expect(ROW_ARRIVE_END).toBeLessThan(HEAD_LEAVE_AT);
    expect(rowArrive("in", 0.94)).toBe("in");
    expect(rowArrive("in", 0.95)).toBe("out");
  });

  it("is a hysteresis, so resting on the edge does not re-trigger it", () => {
    expect(ROW_ARRIVE_OUT).toBeLessThan(ROW_ARRIVE_IN);
    expect(rowArrive("in", (ROW_ARRIVE_IN + ROW_ARRIVE_OUT) / 2)).toBe("in");
    expect(rowArrive("await", (ROW_ARRIVE_IN + ROW_ARRIVE_OUT) / 2)).toBe("await");
  });

  it("closes on the way back and on the way past, and re-opens either way", () => {
    expect(rowArrive("in", 0.01)).toBe("out");
    expect(rowArrive("in", 0.99)).toBe("out");
    expect(rowArrive("out", 0.5)).toBe("in");
  });

  it("keeps `await` and `out` APART", () => {
    // ⚠ Both paint nothing, but `out` plays the close and `await` has never
    // been seen — collapsing them shuts the row on the way IN.
    expect(rowArrive("await", 0.01)).toBe("await");
    expect(rowArrive("await", 0.99)).toBe("await");
    expect(rowArrive("out", 0.01)).toBe("out");
  });

  it("seeds `in` on a deep reload past the threshold, never `await`", () => {
    expect(rowArrive(null, 0.5)).toBe("in");
    expect(rowArrive(null, 0)).toBe("await");
  });

  it("leaves the state alone on a non-finite reading", () => {
    expect(rowArrive("await", Number.NaN)).toBe("await");
    expect(rowArrive("in", Number.POSITIVE_INFINITY)).toBe("in");
  });
});

/* ── The head (ADR-119 U2) ─────────────────────────────────────────────── */

const RUNS: HeadRun[] = [
  { text: MUSINGS_MASTHEAD.desigTitle, mode: "scramble", order: 0 },
  { text: MUSINGS_MASTHEAD.titleLines[0].text, mode: "scramble", order: 0 },
  { text: MUSINGS_MASTHEAD.titleLines[1].text, mode: "scramble", order: 1 },
  { text: MUSINGS_MASTHEAD.state, mode: "scramble", order: 0 },
  { text: MUSINGS_MASTHEAD.brief, mode: "type", order: 0 },
];
const SPAN = headSpan(RUNS);
/** A deterministic glyph source, so a frame is comparable. */
const rng = () => 0.37;

describe("headFrame — the decode, frame by frame", () => {
  it("is EMPTY at level 0, for every run — the regression this pass exists for", () => {
    // ⚠ U1 asked the kernel for its frame at t = 0 and got the first three or
    // four characters of every run as random glyphs (`F-ZO` / `TSJ`), because
    // the shuffle window opens before a character resolves. The head was never
    // blank, so text rode the stage in and out of the frame.
    for (const run of RUNS) {
      expect(headFrame(run, 0, SPAN, rng)).toBe("");
      expect(headFrame(run, -1, SPAN, rng)).toBe("");
      expect(headFrame(run, Number.NaN, SPAN, rng)).toBe("");
    }
  });

  it("is the whole string at level 1", () => {
    for (const run of RUNS) expect(headFrame(run, 1, SPAN, rng)).toBe(run.text);
  });

  it("types the paragraph monotonically, from its first character", () => {
    const para = RUNS[4];
    let prev = 0;
    for (let i = 0; i <= 400; i++) {
      const s = headFrame(para, i / 400, SPAN, rng);
      expect(para.text.startsWith(s)).toBe(true);
      expect(s.length).toBeGreaterThanOrEqual(prev);
      prev = s.length;
    }
    expect(prev).toBe(para.text.length);
  });

  it("staggers the second title line behind the first, by the services number", () => {
    const [, l1, l2] = RUNS;
    expect(headRunEnd(l2) - headRunEnd(l1)).toBeGreaterThan(0);
    // At the moment line 2 is due to start, it has painted nothing yet.
    const t = HEAD_LINE_STAGGER_S * 0.99;
    expect(headFrame(l2, t / SPAN, SPAN, rng).trim()).toBe("");
    expect(headFrame(l1, t / SPAN, SPAN, rng).trim()).not.toBe("");
  });

  it("resolves everything by the span's end, and nothing before its own end", () => {
    for (const run of RUNS) {
      const end = headRunEnd(run) / SPAN;
      expect(end).toBeLessThanOrEqual(1 + 1e-9);
      if (run.text.length > 1) expect(headFrame(run, end * 0.9, SPAN, rng)).not.toBe(run.text);
    }
  });

  it("finishes inside the services masthead's own window", () => {
    // ~0.9s is what the services decode reads as; a slower head would be a
    // different effect wearing the same glyphs.
    expect(SPAN).toBeGreaterThan(0.4);
    expect(SPAN).toBeLessThanOrEqual(1);
  });

  it("lights the cursor only while a run is still resolving", () => {
    const [, l1] = RUNS;
    expect(headRunLive(l1, 0, SPAN)).toBe(false);
    expect(headRunLive(l1, 1, SPAN)).toBe(false);
    expect(headRunLive(l1, 0.2 / SPAN, SPAN)).toBe(true);
  });
});

describe("headTarget — where the head is going", () => {
  it("is NEVER shown on a stage that is not parked", () => {
    // The masthead motion law: copy never travels. Unparked, the answer is 0
    // whatever the progress and whatever it was.
    for (const p of [0, 0.02, 0.5, 0.95, 1]) {
      expect(headTarget(1, p, false)).toBe(0);
      expect(headTarget(null, p, false)).toBe(0);
    }
  });

  it("reveals just past the pin and leaves just before the release", () => {
    expect(headTarget(0, HEAD_REVEAL_AT, true)).toBe(1);
    expect(headTarget(0, 0.5, true)).toBe(1);
    expect(headTarget(1, HEAD_LEAVE_AT, true)).toBe(0);
    expect(headTarget(1, HEAD_REARM_BELOW - 0.001, true)).toBe(0);
  });

  it("is a hysteresis at both ends", () => {
    expect(HEAD_REARM_BELOW).toBeLessThan(HEAD_REVEAL_AT);
    expect(HEAD_RETURN_BELOW).toBeLessThan(HEAD_LEAVE_AT);
    const low = (HEAD_REARM_BELOW + HEAD_REVEAL_AT) / 2;
    const high = (HEAD_RETURN_BELOW + HEAD_LEAVE_AT) / 2;
    expect(headTarget(1, low, true)).toBe(1);
    expect(headTarget(0, low, true)).toBe(0);
    expect(headTarget(1, high, true)).toBe(1);
    expect(headTarget(0, high, true)).toBe(0);
  });

  it("shows the head whole on a deep reload parked inside the band", () => {
    expect(headTarget(null, 0.5, true)).toBe(1);
    expect(headTarget(null, 0.99, true)).toBe(0);
  });

  it("leaves the state alone on a non-finite reading", () => {
    expect(headTarget(1, Number.NaN, true)).toBe(1);
    expect(headTarget(0, Number.NaN, true)).toBe(0);
  });

  it("leaves AFTER the row has closed, so the exit is the entry backwards", () => {
    expect(HEAD_LEAVE_AT).toBeGreaterThan(ROW_ARRIVE_END);
    expect(HEAD_REVEAL_AT).toBeLessThan(ROW_ARRIVE_IN);
  });
});

describe("typedCount", () => {
  it("shows the first character the instant the run opens", () => {
    // A typewriter that stands on an empty line reads as a stall, not as typing.
    expect(typedCount(40, 0)).toBe(0);
    expect(typedCount(40, 0.12)).toBe(0);
    expect(typedCount(40, 0.1201)).toBe(1);
    expect(typedCount(40, 10)).toBe(40);
  });

  it("is monotonic and clamped", () => {
    let prev = -1;
    for (let i = 0; i <= 200; i++) {
      const n = typedCount(37, i / 100 - 0.5);
      expect(n).toBeGreaterThanOrEqual(prev);
      expect(n).toBeLessThanOrEqual(37);
      prev = n;
    }
    expect(typedCount(0, 1)).toBe(0);
  });
});

describe("the masthead", () => {
  it("carries the two designations, one state chip and a two-line title", () => {
    // The services masthead's own anatomy: one gold survey element, the em on
    // the SECOND line. More than one gold thing is the ration broken.
    expect(MUSINGS_MASTHEAD.titleLines).toHaveLength(2);
    expect(MUSINGS_MASTHEAD.titleLines.filter((l) => l.em)).toHaveLength(1);
    expect(MUSINGS_MASTHEAD.titleLines[1].em).toBe(true);
    expect(MUSINGS_MASTHEAD.state).toBe("OPEN");
  });

  it("authors every display string UPPERCASE, because the sheet transforms none", () => {
    // ⚠ ADR-092: `text-transform: uppercase` on a PP Neue Montreal element is
    // a finding the type ratchet fails, so the case lives in the record — the
    // way `SERVICES_MASTHEAD` carries its own.
    for (const line of MUSINGS_MASTHEAD.titleLines) expect(line.text).toBe(line.text.toUpperCase());
    expect(MUSINGS_MASTHEAD.desigTitle).toBe(MUSINGS_MASTHEAD.desigTitle.toUpperCase());
    expect(MUSINGS_MASTHEAD.desigBrief).toBe(MUSINGS_MASTHEAD.desigBrief.toUpperCase());
    // The brief is PROSE and stays sentence case — it is the one run that types.
    expect(MUSINGS_MASTHEAD.brief).not.toBe(MUSINGS_MASTHEAD.brief.toUpperCase());
  });

  it("letters no digit but the designations' own index", () => {
    // The copy law: a station's brief makes no claim the station cannot show,
    // and a count of posts is a number that goes stale on the next commit.
    expect(MUSINGS_MASTHEAD.brief).not.toMatch(/\d/);
    expect(MUSINGS_TITLE_TEXT).not.toMatch(/\d/);
  });

  it("stamps the same coordinates the arcs' own chrome would", () => {
    // ⚠ `coordStamp` is COPIED rather than imported (the landing's import
    // doctrine), so the two arithmetics are pinned against each other.
    for (const salt of [1, 2, 7])
      expect(coordStamp("musings", salt)).toBe(arcCoordStamp("musings", salt));
    expect(MUSINGS_COORDS).toEqual([coordStamp("musings", 1), coordStamp("musings", 2)]);
    for (const c of MUSINGS_COORDS) expect(c).toMatch(/^\d{4} \/ \d{4}$/);
  });
});

describe("cover — the drawn record", () => {
  it("reads the beat off the tags in the ARC's order, not the author's", () => {
    expect(beatOf(["navigate", "practice"])).toBe("navigate");
    expect(beatOf(["practice", "encode"])).toBe("encode");
    expect(beatOf(["build", "practice"])).toBe("build");
    // Two beats: the earlier one wins, deterministically either way round.
    expect(beatOf(["build", "navigate"])).toBe("navigate");
    expect(beatOf(["navigate", "build"])).toBe("navigate");
  });

  it("draws no glyph for a post with no Arc tag", () => {
    expect(beatOf(["practice"])).toBeNull();
    expect(beatOf([])).toBeNull();
    expect(coverSpec({ slug: "x", date: "2026-01-01", tags: ["practice"] }).beat).toBeNull();
  });

  it("is case-insensitive on the tag", () => {
    expect(beatOf(["Encode"])).toBe("encode");
  });

  it("seeds stably from the slug", () => {
    expect(slugSeed("navigate-the-intelligence")).toBe(slugSeed("navigate-the-intelligence"));
    expect(slugSeed("a")).not.toBe(slugSeed("b"));
    for (const s of ["a", "b", "encode-the-context", ""]) {
      const v = slugSeed(s);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("plots the date from the STRING, so no reader's time zone moves the mark", () => {
    expect(yearFraction("2026-01-01")).toBeCloseTo(0.5 / 365, 4);
    expect(yearFraction("2026-12-31")).toBeCloseTo(364.5 / 365, 4);
    expect(yearFraction("2026-07-02")).toBeCloseTo(0.5, 2);
    // A leap year divides by 366 and shifts everything past February.
    expect(yearFraction("2024-03-01")).toBeCloseTo(60.5 / 366, 4);
    expect(yearFraction("2026-03-01")).toBeCloseTo(59.5 / 365, 4);
  });

  it("falls back to the middle on an unparseable date rather than throwing", () => {
    expect(yearFraction("nonsense")).toBe(0.5);
  });

  it("seats every mark clear of the box's own edges", () => {
    for (const date of ["2026-01-01", "2026-06-15", "2026-12-31"]) {
      const spec = coverSpec({ slug: "s", date, tags: ["encode"] });
      expect(spec.markX).toBeGreaterThanOrEqual(14);
      expect(spec.markX).toBeLessThanOrEqual(86);
      for (const g of spec.ghostX) {
        expect(g).toBeGreaterThan(6);
        expect(g).toBeLessThan(94);
      }
      expect(spec.pitch).toBeGreaterThanOrEqual(9);
      expect(spec.pitch).toBeLessThanOrEqual(15);
    }
  });

  it("gives two posts of one beat different substrates", () => {
    const a = coverSpec({
      slug: "navigate-the-intelligence",
      date: "2026-09-14",
      tags: ["navigate"],
    });
    const b = coverSpec({ slug: "encode-the-context", date: "2026-09-07", tags: ["encode"] });
    expect(a.markX).not.toBeCloseTo(b.markX, 3);
  });
});

describe("the list's window", () => {
  it("draws at most five — the owner's number", () => {
    // "maybe we can show more, maybe 5 in total" (2026-09-24). The rows are
    // solved from the count inside the frame, so a sixth shrinks every title.
    expect(MUSINGS_LIST_MAX).toBe(5);
  });
});

describe("orbit — the About drawing, re-seated for a note (ADR-122)", () => {
  it("reads the day of the year off the STRING, never through a Date", () => {
    expect(dayOfYear("2026-01-01")).toBe(1);
    expect(dayOfYear("2026-09-14")).toBe(257);
    expect(dayOfYear("2024-03-01")).toBe(61);
    expect(dayOfYear("2026-03-01")).toBe(60);
    expect(Number.isNaN(dayOfYear("nonsense"))).toBe(true);
  });

  it("plots the note on its own day and the year's OTHER notes, never itself or another year's", () => {
    const posts = [
      { slug: "a", date: "2026-09-14" },
      { slug: "b", date: "2026-03-01" },
      { slug: "c", date: "2025-12-31" },
    ];
    const spec = orbitSpec(posts[0], posts);
    expect(spec.lit).toBeCloseTo(yearFraction("2026-09-14") * 360, 6);
    expect(spec.others).toHaveLength(1);
    expect(spec.others[0]).toBeCloseTo(yearFraction("2026-03-01") * 360, 6);
    expect(spec.month).toBe(8);
    expect(spec.day).toBe("Day 257");
    expect(spec.year).toBe("2026");
  });

  it("keeps every ring inside the rim, the halo outside it, and the quarter months inside the crop", () => {
    // ⚠ THE CROP CARRIES THE LABELS' ROOM: the lab's first still printed "ICT"
    // and "API" at a 240 crop. A quarter month is seated on its radius and
    // centred on it, so its centre must leave half a label of air.
    for (const r of ORBIT_RINGS) expect(r.r).toBeLessThanOrEqual(ORBIT_RIM);
    expect(ORBIT_HALO).toBeGreaterThan(ORBIT_RIM);
    expect(ORBIT_QUARTER_R).toBeGreaterThan(ORBIT_HALO);
    for (const [, deg] of ORBIT_QUARTERS) {
      const p = orbitPoint(deg, ORBIT_QUARTER_R);
      expect(Math.abs(p.x)).toBeLessThanOrEqual(ORBIT_HALF - 30);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(ORBIT_HALF - 30);
    }
    // The thumbnail keeps the gold track and the inner ring, and only those.
    expect(ORBIT_RINGS.filter((r) => !r.detail).map((r) => r.ink)).toEqual(["gold", "line"]);
  });
});

/* ── The source ratchets ───────────────────────────────────────────────── */

describe("the row is mirrored by hand between the writer and the sheet, so pin it", () => {
  const ROOT = join(__dirname, "..", "..");
  const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

  const HOOK = "components/landing/home-v2/musings/useMusingsScroll.ts";
  const SHEET = "components/landing/home-v2/musings/musings.css";
  const NOTE = "components/landing/home-v2/musings/MusingNote.tsx";
  const ORBIT = "components/landing/home-v2/musings/MusingOrbit.tsx";
  const STATION = "components/landing/home-v2/musings/MusingsStation.tsx";
  const THEME = "components/landing/v7/theme.css";
  const RUNG = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";

  /** The sheet with its comments stripped — a comment quoting a banned word is not a rule. */
  const rules = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
  /** Every `selector { body }` pair in a sheet, comments stripped. */
  const blocks = (css: string) => [...rules(css).matchAll(/([^{}]*)\{([^{}]*)\}/g)];
  /** The body of the first block whose selector, trimmed, is `sel`. */
  const bodyOf = (css: string, sel: string) =>
    blocks(css).find(([, s]) => s.trim() === sel)?.[2] ?? "";
  /** Whitespace removed — so a derived `calc()` is pinned whatever way Prettier wraps it. */
  const flat = (s: string) => s.replace(/\s+/g, "");

  it("the writer and the sheet name the SAME query", () => {
    // A writer and a sheet that disagree about the rung is a row of strips
    // nothing will ever open, or a rail whose cards have been given a grow.
    // Neither errors and neither is visible in a still taken at the other rung.
    expect(read(HOOK)).toContain(`MUSINGS_ROW_MEDIA = "${RUNG}"`);
    expect(read(SHEET)).toContain(`@media ${RUNG} {`);
  });

  it("the open note grows on TWO transitions and one clock — the cover column and the excerpt's row", () => {
    // v17's mechanic: the cover is ONE element whose column widens from the
    // thumbnail to the feature, and the excerpt unrolls 0fr → 1fr. Nothing is
    // posed, measured or written per frame; the writer moves one attribute.
    const sheet = read(SHEET);
    const note = bodyOf(sheet, ".mu-note");
    expect(flat(note)).toContain("grid-template-columns:minmax(0,1fr)var(--mu-note-col)");
    expect(flat(note)).toContain("--mu-note-col:var(--mu-note-thumb)");
    expect(note).toMatch(/transition:\s*grid-template-columns var\(--mu-note-grow\)/);
    expect(bodyOf(sheet, ".mu-note[data-mu-open]")).toMatch(
      /--mu-note-col:\s*var\(--mu-note-open\)/
    );
    expect(bodyOf(sheet, ".mu-note__open")).toMatch(/grid-template-rows:\s*0fr/);
    expect(bodyOf(sheet, ".mu-note[data-mu-open] .mu-note__open")).toMatch(
      /grid-template-rows:\s*1fr/
    );
    expect(bodyOf(sheet, ".mu")).toMatch(
      /--mu-note-grow:\s*560ms cubic-bezier\(0\.16, 1, 0\.3, 1\)/
    );
    // ADR-121's row mechanic is gone with the row.
    expect(rules(sheet)).not.toMatch(/flex-grow|--mu-strip|--mu-open-w|--mu-closed/);
  });
  it("nothing 3D survives — no perspective, no rotation, no 3D context, no edge fade", () => {
    // ADR-119's rack, shelf and row are all retired with the form (ADR-121).
    // A `perspective` or a `rotateX` that came back would be the jukebox
    // returning under a new name; a mask on the row would be its edge fade.
    for (const src of [read(SHEET), read(NOTE), read(ORBIT), read(STATION), read(HOOK)]) {
      const s = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
      expect(s).not.toMatch(/perspective/);
      expect(s).not.toMatch(/rotate[XYZ]?\(/);
      expect(s).not.toMatch(/translateZ|preserve-3d|transform-style/);
      expect(s).not.toMatch(/mu__window|mu__rig|mu__rack|data-mu-tilt|muTilt|data-mu-front/);
      expect(s).not.toMatch(/--mu-step|--mu-tail|--mu-i\b|data-mu-card/);
      expect(s).not.toMatch(/rowMath|rowPose|rowGeom/);
    }
    // The only mask left in the sheet is the masthead's own dot-grid lift.
    for (const [, sel, body] of blocks(read(SHEET))) {
      if (/mask-image/.test(body)) expect(sel.trim()).toBe(".mu__grid");
    }
    // And the writer assigns no per-card style at all.
    expect(read(HOOK)).not.toMatch(/style\.(transform|zIndex|opacity|filter)\s*=/);
  });

  it("`data-mu-open` is rendered on the NEWEST note, and every note is a real link", () => {
    // The owner's rest state: the newest is open, no timer — rendered by React
    // so SSR / no-JS / PRM show the finished list. ⚠ And no note is hidden from
    // the keyboard: ADR-119's `tabIndex={-1}` + `aria-hidden` on cards 1..n was
    // an a11y bug on every parked rung. Comments stripped: the header quotes it.
    const note = read(NOTE).replace(/\/\*[\s\S]*?\*\//g, "");
    expect(note).toContain('data-mu-open={index === 0 ? "" : undefined}');
    expect(note).toContain("const href = `/musings/${post.slug}`;");
    expect(note).toMatch(/className="mu-note__row" href=\{href\}/);
    expect(note).not.toMatch(/tabIndex/);
    expect(note).not.toMatch(/isFront|data-mu-front|cardRef/);
    // The only thing hidden from assistive tech is the drawing.
    expect(note.match(/aria-hidden="true"/g)?.length ?? 0).toBeGreaterThan(0);
    expect(note).toContain('className="mu-note__cover" aria-hidden="true"');
  });
  it("the rows are solved from the COUNT inside the frame, on the pinned rung", () => {
    // ⚠ The open card's floor is paid for first, then the way out; the closed
    // rows share what is left at v4's 8.6svh where they can, never under 64px;
    // the open cover takes what the rows then leave, up to 240px. `100cqh` is
    // the notes' box — the one size container above the rows.
    const sheet = read(SHEET);
    const rung = rules(sheet).slice(rules(sheet).indexOf(`@media ${RUNG} {`));
    const notes = flat(bodyOf(rung, ".mu[data-mu-ready] .mu__notes"));
    expect(notes).toContain("container-type:size");
    expect(notes).toContain(
      "--mu-note-row:clamp(64px,min(8.6svh,calc((100cqh-var(--mu-note-open-min)-var(--mu-foot-h))/var(--mu-n,3)-var(--mu-note-gap))),108px)"
    );
    expect(notes).toContain(
      "--mu-note-open:clamp(var(--mu-note-open-min),calc(100cqh-var(--mu-n,3)*(var(--mu-note-row)+var(--mu-note-gap))-var(--mu-foot-h)),240px)"
    );
    // The way out's row is the term the arithmetic subtracts.
    expect(bodyOf(sheet, ".mu__foot")).toMatch(/height:\s*var\(--mu-foot-h\)/);
    // And the station hands the list its count.
    expect(read(STATION)).toContain('"--mu-n": posts.length');
  });
  it("the byline and the way in sit on the COVER's floor (the owner's ask)", () => {
    // "the call to action and the author should be aligned to the bottom of that
    // visual". The cover spans both rows from 10px down; the detail's height is
    // solved so its content box ends where the cover does, and the sign is
    // pushed to that line. Both halves of the arithmetic are pinned.
    const sheet = read(SHEET);
    const cover = flat(bodyOf(sheet, ".mu-note__cover"));
    expect(cover).toContain("grid-row:1/3");
    expect(cover).toContain("aspect-ratio:1");
    expect(cover).toContain("margin-top:10px");
    expect(cover).not.toMatch(/border:|background:/);
    const detail = flat(bodyOf(sheet, ".mu-note__detail"));
    expect(detail).toContain(
      "height:calc(var(--mu-note-open)+10px+var(--mu-note-inset)-var(--mu-note-row))"
    );
    expect(detail).toContain("padding:00var(--mu-note-inset)");
    expect(bodyOf(sheet, ".mu-note__sign")).toMatch(/margin-top:\s*auto/);
  });
  it("the title is v4's scale, set whole on one line", () => {
    // "what I like about v4 still is the big title size". The cap is what the
    // row leaves above the meta line, so a short row sets a smaller title
    // rather than a clipped one — and the ellipsis is a belt the capture fails.
    const sheet = read(SHEET);
    expect(flat(bodyOf(sheet, ".mu"))).toContain(
      "--mu-note-title:min(clamp(22px,2.5vw,48px),calc((var(--mu-note-row)-26px)*0.9))"
    );
    const title = flat(bodyOf(sheet, ".mu-note__title"));
    expect(title).toContain("font-size:var(--mu-note-title)");
    expect(title).toContain("white-space:nowrap");
    expect(title).toContain("font-family:var(--font-pp-neue-montreal)");
  });
  it("three lines of the excerpt's measure hold the registry's whole budget, and the gap above the sign is a MINIMUM", () => {
    // ⚠ At a 28px gap a three-line excerpt (the live "Encode the context")
    // pushed the sign 7.9px under the cover's floor at 1920×1247; the sign's
    // `margin-top: auto` is what seats it, the gap only bounds how close.
    const MEAN_ADVANCE_EM = 0.45;
    const registry = read("tests/lib/musings-registry.test.ts");
    const budget = Number(/summary\.length\)\.toBeLessThanOrEqual\((\d+)\)/.exec(registry)?.[1]);
    expect(budget).toBeGreaterThan(0);
    const measureEm = Number(
      /max-width:\s*(\d+)em/.exec(bodyOf(read(SHEET), ".mu-note__lede"))?.[1]
    );
    expect(measureEm).toBe(34);
    expect(3 * measureEm).toBeGreaterThanOrEqual(budget * MEAN_ADVANCE_EM);
    expect(bodyOf(read(SHEET), ".mu-note__detail")).toMatch(/gap:\s*12px/);
  });
  it("the band's end is DERIVED from the frame's own geometry, and zero where it need not be", () => {
    // ⚠ ADR-121 shipped a row whose last card ran 25.4px UNDER the right
    // rail's SECTOR readout at 1280×720 (13.7px at 1440×800). The readouts'
    // width is a constant of the frame — fixed-size type — so it is re-derived
    // HERE from `rail-instruments.css`'s own declarations, and the musings
    // token must equal it: if the frame's readout grows, this fails before
    // the capture's live gate does.
    const tele = rules(read("components/landing/v7/rail-instruments/rail-instruments.css"));
    const px = (s: string | undefined) => Number(/(\d+(?:\.\d+)?)px/.exec(s ?? "")?.[1]);
    const em = (s: string | undefined) => Number(/(\d+(?:\.\d+)?)em/.exec(s ?? "")?.[1]);
    const decl = (sel: string, prop: string) =>
      new RegExp(`${prop}:\\s*([^;]+);`).exec(bodyOf(tele, sel))?.[1];
    expect(flat(decl(".rin-tele", "right") ?? "")).toBe("calc(var(--hud-rail-guide-inset)+8px)");
    const PT_MONO_ADVANCE = 0.6; // a monospace face: every glyph is 600/1000 em
    const keyPx = px(decl(".rin-tele__k", "font-size"));
    const keyTrack = em(decl(".rin-tele__k", "letter-spacing"));
    const valPx = px(decl(".rin-tele__v", "font-size"));
    const valTrack = em(decl(".rin-tele__v", "letter-spacing"));
    const rule = px(decl(".rin-tele__rule", "width"));
    const gap = px(decl(".rin-tele", "gap"));
    // The three readouts, by their own formats (RailInstruments.tsx /
    // useJourneyMarks.ts): a 3-digit bearing, `NN/NN` sector, `toFixed(2)` local.
    const width = (key: string, valueChars: number) =>
      key.length * keyPx * (PT_MONO_ADVANCE + keyTrack) +
      2 * gap +
      rule +
      valueChars * valPx * (PT_MONO_ADVANCE + valTrack);
    const widest = Math.max(width("BEARING", 3), width("SECTOR", 5), width("LOCAL", 4));
    expect(widest).toBeCloseTo(107.4, 6);

    // The 3px is half the page's declared scrollbar: the 100vw station is
    // centred across it, the fixed rail is not.
    const scrollbar = px(
      /::-webkit-scrollbar\s*\{[^}]*width:\s*([^;]+);/.exec(
        rules(read("components/landing/v7/landing.css"))
      )?.[1]
    );
    expect(scrollbar / 2).toBe(3);

    const mu = flat(bodyOf(read(SHEET), ".mu"));
    expect(mu).toContain(
      "--mu-tele-reach:calc(var(--hud-margin)+var(--hud-rail-guide-inset)+8px+107.4px+3px)"
    );
    // Zero wherever the band already ends short of the readouts (the owner's
    // 1920 included): a `max(0px, …)`, never a fixed inset.
    expect(mu).toContain(
      "--mu-band-end:max(0px,var(--mu-tele-reach)+var(--mu-note-inset)-var(--band-margin))"
    );
    // Head and row take the same edge, only where the readouts are drawn, and
    // only on the row's rung.
    const sheet = read(SHEET);
    const rung = rules(sheet).slice(rules(sheet).indexOf(`@media ${RUNG} {`));
    const yield_ = blocks(rung).find(
      ([, , b]) => /--mu-band-end/.test(b) && /margin-inline-end/.test(b)
    );
    expect(yield_).toBeDefined();
    const sel = flat(yield_?.[1] ?? "");
    expect(sel).toContain("html[data-rail-instruments].mu[data-mu-ready].mu__head");
    expect(sel).toContain("html[data-rail-instruments].mu[data-mu-ready].mu__notes");
    expect(flat(yield_?.[2] ?? "")).toContain(
      "margin-inline-end:calc(var(--rail-inset)+var(--mu-band-end))"
    );
  });

  it("the writer moves ONE attribute on events, leaves it where the reader left it, and holds NO React state", () => {
    // ADR-002: one writer, CSS custom properties. ⚠ No `pointerleave` /
    // `focusout` restore (ADR-122): a list whose open card is taller than the
    // rest would move every note below it under a hand travelling to them.
    const hook = read(HOOK);
    for (const ev of ["pointerover", "focusin"]) expect(hook).toContain(`addEventListener("${ev}"`);
    for (const ev of ["pointerleave", "focusout"])
      expect(hook).not.toContain(`addEventListener("${ev}"`);
    expect(hook).toContain('setAttribute("data-mu-open", "")');
    expect(hook).toContain('removeAttribute("data-mu-open")');
    expect(hook).toContain(":scope > .mu-note");
    expect((hook.match(/setState\(/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(hook).not.toMatch(/useState/);
  });
  it("the writer never asks the kernel for a frame at t = 0 — the head goes through `headFrame`", () => {
    // ⚠ The defect ADR-119 U2 fixed: `scrambleFrame(…, 0)` is NOT blank.
    const hook = read(HOOK);
    expect(hook).not.toMatch(/scrambleFrame\(/);
    expect(hook).toContain("headFrame(");
    expect(hook).not.toMatch(/advanceScrambles/);
  });

  it("the notes arrive as a LINE that unfolds down — and the aperture stays the house's on its two hosts", () => {
    /* ⚠ The owner: "I don't think we should use the scan line effect … the
       cards should first be a line and then unfold downwards." The centre-out
       aperture (720ms / 420ms on `cubic-bezier(0.65, 0, 0.35, 1)`, ADR-097
       U12's settled pair) LEAVES this station and stays the proof card's and
       the Trinny route's — one of those changing alone is still a house grammar
       on a different clock. */
    const IN = "720ms cubic-bezier(0.65, 0, 0.35, 1)";
    const OUT = "420ms cubic-bezier(0.65, 0, 0.35, 1)";
    for (const host of [
      "components/landing/home-v2/services/proof-stack/proof-stack.css",
      "app/(marketing)/arcs/trinny-london/proposal/trinny-london.css",
    ]) {
      const css = read(host);
      expect(css, `${host} carries the aperture's in`).toContain(IN);
      expect(css, `${host} carries the aperture's out`).toContain(OUT);
    }
    const sheet = rules(read(SHEET));
    expect(sheet).not.toMatch(/mu-aperture/);
    // The unfold: across first (the first 40 %), then down; five points a frame.
    const unfold = /@keyframes mu-unfold \{([\s\S]*?)\n\}/.exec(sheet)?.[1] ?? "";
    expect(flat(unfold)).toContain("0%{clip-path:polygon(00,00,01px,01px,01px);}");
    expect(flat(unfold)).toContain(
      "40%{clip-path:polygon(00,calc(100%-var(--mu-ch))0,100%1px,100%1px,01px);}"
    );
    // ⚠ Geometry only — no opacity curve in the arrival, no filter (ADR-097 U12).
    expect(unfold).not.toMatch(/opacity|filter/);
    const mu = flat(bodyOf(read(SHEET), ".mu"));
    expect(mu).toContain("--mu-unfold-in:820mscubic-bezier(0.65,0,0.35,1)");
    expect(mu).toContain("--mu-unfold-out:420mscubic-bezier(0.65,0,0.35,1)");
    // One after another: the note carries its slot, the delay reads it, and the
    // fill is `backwards` (a waiting note is a zero-width line; the last frame
    // is the cascade's own silhouette).
    expect(read(NOTE)).toContain('"--mu-slot": index');
    const rung = sheet.slice(sheet.lastIndexOf(`@media ${RUNG} {`));
    expect(flat(bodyOf(rung, '.mu[data-mu-ready][data-mu-arrive="in"] .mu-note'))).toContain(
      "animation:mu-unfoldvar(--mu-unfold-in)calc(var(--mu-slot,0)*var(--mu-unfold-step))backwards"
    );
  });
  it("gates every aperture rule on the stamp AND the rung", () => {
    const sheet = read(SHEET);
    for (const m of sheet.matchAll(/\[data-mu-arrive="(await|out|in)"\]/g)) {
      const before = sheet.slice(0, m.index ?? 0);
      expect(before.lastIndexOf(`@media ${RUNG} {`)).toBeGreaterThan(-1);
      expect(before).toContain("[data-mu-ready]");
    }
    expect(read(HOOK)).toContain('removeAttribute("data-mu-arrive")');
  });

  it("the sheet gates every pinned-list rule on BOTH the rung and the stamp", () => {
    // `an absent stamp means shown` is the house's polarity law: the rest
    // state is the list with its newest note open, which is what a phone, a
    // reduced-motion reader and a page whose script never ran all get. The
    // glass, the rows solved from the frame and the arrival need the pin.
    const sheet = rules(read(SHEET));
    const rung = sheet.slice(sheet.indexOf(`@media ${RUNG} {`));
    for (const [, sel, body] of blocks(sheet)) {
      const s = sel.trim();
      // (The orbit's dial reads `100cqh` too — against the COVER's container,
      // which exists on every rung — so the pinned-list rule is named by its
      // own token, not by the unit.)
      if (/backdrop-filter|--mu-note-open-min|animation:\s*mu-(un)?fold/.test(body)) {
        expect(s, `${s} is a pinned-list rule and must carry the stamp`).toContain(
          "[data-mu-ready]"
        );
        expect(rung, `${s} is a pinned-list rule and must sit inside the rung`).toContain(body);
      }
    }
  });

  it("the glass is on the STAGE rung only, and light drops it in theme.css BLOCK 4g", () => {
    // ⚠ A blur over an opaque station re-snapshots every frame to frost its
    // own stars; the plate only blurs where the corridor is alive behind it.
    // Light has no bed to separate from, so the frost goes there too — with
    // a selector that OUT-RANKS the sheet's (1,4,0), or it loses silently.
    const sheet = rules(read(SHEET));
    for (const [, sel, body] of blocks(sheet)) {
      if (/backdrop-filter/.test(body)) {
        expect(sel.trim()).toBe('#musings[data-mu-mode="stage"] .mu[data-mu-ready] .mu-note');
        expect(body).not.toMatch(/brightness/);
      }
    }
    expect(sheet).toMatch(/@supports \(backdrop-filter: blur\(2px\)\)/);
    const theme = rules(read(THEME));
    expect(theme).toMatch(/html\[data-theme="light"\] \.mu \{[^}]*--mu-bloom-a:/);
    const light = bodyOf(
      theme,
      'html[data-theme="light"] #musings[data-mu-mode="stage"] .mu[data-mu-ready] .mu-note'
    );
    expect(light).toMatch(/backdrop-filter:\s*none/);
  });

  it("the state is the ring, never a filter on the notes", () => {
    // A large-area brightness change on every hover is the class of motion
    // ADR-097 U12 retired. The open note is told by its lip, its ink and its chip.
    const sheet = rules(read(SHEET));
    for (const [, sel, body] of blocks(sheet)) {
      if (/\.mu-note/.test(sel)) expect(body, sel).not.toMatch(/(^|[\s;])filter\s*:/);
    }
    expect(bodyOf(sheet, ".mu-note[data-mu-open]::before")).toMatch(
      /background-color:\s*var\(--gold-line\)/
    );
    expect(bodyOf(sheet, ".mu-note::before")).toMatch(/background-color:\s*var\(--mu-lip\)/);
  });

  it("the station renders ONE list with the notes as its direct children", () => {
    const station = read(STATION);
    expect(station).toContain('className="mu__list"');
    expect(station).toMatch(
      /<MusingNote key=\{post\.slug\} post=\{post\} posts=\{posts\} index=\{i\} \/>/
    );
    // `MusingCardData` is the record's type and stays; the COMPONENT went.
    expect(station).not.toMatch(/mu__row|<MusingCard\b|from "\.\/MusingCard"/);
    expect(station).not.toMatch(/setCard|cardsRef|front/);
  });

  it("the `gallery` slot is a LAB seam — production never fills it", () => {
    // `/test/musings-gallery` mounts the REAL station with a direction in
    // place of the row and the way out. The landing mounts it through the
    // portal with posts alone, so the slot is empty there by construction —
    // and if a second caller ever appears it has to answer this pin first.
    const portal = read("components/landing/home-v2/musings/MusingsPortal.tsx");
    expect(portal).toContain("root.render(<MusingsStation posts={posts} />);");
    expect(portal).not.toMatch(/gallery=/);
    // `!== undefined`, never `??`: a `null` direction draws nothing and must
    // stay distinct from no direction at all.
    const station = read(STATION);
    expect(station).toContain("gallery !== undefined ?");
    expect(station).not.toMatch(/gallery\s*\?\?/);
  });

  it("the pinned head hangs from the SERVICES line, and the base rows stay content-height (ADR-121 U2)", () => {
    // ⚠ The owner's read: the title and the paragraph sit "more down" than
    // services' "AI CAPABILITY / YOUR TEAM OWNS.". The group was centred, so
    // the head landed wherever the cards below it left room (~287px of a
    // 1247px frame against services' 136). Pinned, it hangs from `--band-top`.
    const sheet = rules(read(SHEET));
    const rung = sheet.slice(sheet.indexOf(`@media ${RUNG} {`));
    const stage = bodyOf(rung, ".mu[data-mu-ready] .mu__stage");
    expect(stage).toMatch(/align-content:\s*start/);
    expect(stage).toMatch(/padding-block-start:\s*var\(--band-top\)/);
    // ADR-119's composition law survives: no `1fr` track to pool slack in.
    const base = bodyOf(sheet, ".mu__stage");
    expect(base).toMatch(/grid-template-rows:\s*auto auto;/);
    expect(base).not.toMatch(/1fr/);
    // Pinned, the notes take everything from the head to the rails' last tick.
    expect(flat(stage)).toContain("grid-template-rows:autominmax(0,1fr)");
    expect(stage).toMatch(/padding-block-end:\s*var\(--hud-rail-y-end\)/);
    // Services seats both blocks on one `top`; the brief carries no offset.
    expect(bodyOf(sheet, ".mu__head-brief")).not.toMatch(/padding-top/);
    // ⚠ THE OTHER HALF OF THE LINK. Services hangs from `--band-top` plus a
    // trim that is 0 today; a trim there would split the one shared line in
    // silence, so it is pinned from this side.
    const svc = blocks(read("components/landing/home-v2/services/services.css"))
      .filter(([, s]) => s.trim() === ".services-masthead")
      .map(([, , b]) => flat(b))
      .find((b) => b.includes("--masthead-top:"));
    expect(svc).toBeDefined();
    expect(svc).toMatch(/--masthead-top:calc\(var\(--band-top,/);
    expect(svc).toContain("--masthead-top-trim:0px");
  });

  it("the runway is ONE dwell, and the dwell is the dial", () => {
    const sheet = rules(read(SHEET));
    expect(bodyOf(sheet, ".mu[data-mu-ready] .mu__runway")).toMatch(
      /height:\s*calc\(100svh \+ var\(--mu-dwell\)\)/
    );
    // 120svh since ADR-122 U1 (owner: "it scrolls too quickly into the next
    // section"); 60svh held the list for ~6 wheel steps at 1247px.
    expect(bodyOf(sheet, ".mu")).toMatch(/--mu-dwell:\s*120svh/);
  });

  it("the writer clears the footer's stamp on every path that stops writing", () => {
    // ⚠ `#contact` is `position: sticky; bottom: 0` while `data-ft-reveal` is
    // present, and a sticky-bottom box is pulled UP to the frame's floor from
    // anywhere above its seat. Three exits have to clear it: the inert rung,
    // unmount, and scrolling back above the row.
    const hook = read(HOOK);
    const clears = hook.match(/removeAttribute\("data-ft-reveal"\)/g) ?? [];
    expect(clears.length).toBeGreaterThanOrEqual(3);
    expect(hook).toContain('setAttribute("data-ft-reveal"');
  });

  /* ── The weld (ADR-121 U3) ─────────────────────────────────────────── */

  it("the station is welded one viewport over the era stage, on the stage rung ONLY", () => {
    // ⚠ The owner's read: "it takes a few scrolls to get to the elements". A
    // sticky stage pins only once its top reaches the frame's top and the head
    // is blank until then, so the reader scrolled one whole viewport of
    // transparent stage rising behind an emptied era stage. The weld takes
    // that viewport back, and it is keyed on the stage stamp: an opaque
    // station pulled over a static era section would cover its content.
    const sheet = rules(read(SHEET));
    expect(bodyOf(sheet, "#musings.station")).toMatch(/--mu-weld:\s*100svh/);
    const weld = flat(bodyOf(sheet, '#musings[data-mu-mode="stage"].station'));
    expect(weld).toContain("margin-top:calc(-1*var(--mu-weld))");
    // ⚠ The `flex-grow | --mu-open-w | backdrop-filter | container-type`
    // ratchet cannot see a margin, so every negative `margin-top` in the sheet
    // is walked and must carry the stage key.
    for (const [, sel, body] of blocks(sheet)) {
      if (/margin-top:\s*(-|calc\(\s*-1)/.test(body)) {
        expect(sel, `an unkeyed weld: ${sel.trim()}`).toContain('[data-mu-mode="stage"]');
      }
    }
  });

  it("the weld equals the era stage's height, and the era's content is gone before the head decodes", () => {
    // ⚠ ARITHMETIC, NOT A LITERAL. The era station is `.vw--hologram`'s runway
    // with `.vwd` sticky inside it; its content is off-frame at the exit
    // window's end. The musings stage pins when its runway's top reaches the
    // frame's top — the weld puts that frame at the era's release — and the
    // head decodes at `HEAD_REVEAL_AT` of the dwell after it. Larger than the
    // era stage pins two stages at once; smaller restores dead viewport.
    const num = (s: string | undefined, re: RegExp) => Number(re.exec(s ?? "")?.[1]);
    const vw = rules(read("components/landing/home-v2/voidwalker/voidwalker.css"));
    const vwd = rules(read("components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css"));
    const runway = num(
      bodyOf(vw, '#voidwalker[data-vw-mode="hologram"] .vw--hologram'),
      /min-height:\s*(\d+)svh/
    );
    const stageBody = blocks(vwd)
      .filter(([, s]) => s.trim() === ".vwd")
      .map(([, , b]) => b)
      .find((b) => /height:\s*\d+svh/.test(b));
    const stage = num(stageBody, /(?:^|[^-])height:\s*(\d+)svh/);
    const sheet = rules(read(SHEET));
    const weld = num(bodyOf(sheet, "#musings.station"), /--mu-weld:\s*(\d+)svh/);
    const dwell = num(bodyOf(sheet, ".mu"), /--mu-dwell:\s*(\d+)svh/);
    expect(runway).toBe(260);
    expect(stage).toBe(100);
    expect(weld).toBe(stage);
    const exitEnd = VOIDWALKER_HOLOGRAM_EXIT_WINDOW[1];
    // svh from the era's content leaving to the musings head decoding.
    const seam = (1 - exitEnd) * (runway - stage) - (stage - weld) + HEAD_REVEAL_AT * dwell;
    expect(seam).toBeGreaterThan(0);
    expect(seam).toBeLessThan(12); // 7.6 today — the era's own tail plus 1.2svh
  });

  it("the welded station is hit-transparent, and the band and the arrived runway take their hits back", () => {
    // ⚠ A transparent box still takes the click: from era p ≈ 0.45 the station's
    // box covers the era's band tablist, live until the era goes inert at
    // 0.92. `pointer-events` inherits, so one `none` and two `auto` restores.
    const sheet = rules(read(SHEET));
    expect(bodyOf(sheet, '#musings[data-mu-mode="stage"].station')).toMatch(
      /pointer-events:\s*none/
    );
    expect(bodyOf(sheet, '#musings[data-mu-mode="stage"] .mu__band')).toMatch(
      /pointer-events:\s*auto/
    );
    expect(
      bodyOf(
        sheet,
        '#musings[data-mu-mode="stage"] .mu[data-mu-ready][data-mu-arrive="in"] .mu__runway'
      )
    ).toMatch(/pointer-events:\s*auto/);
    // Never `visibility: hidden` on the stage — the head decodes during `await`.
    expect(bodyOf(sheet, '#musings[data-mu-mode="stage"].station')).not.toMatch(/visibility/);
  });

  it("the readouts flip at the PIN while the station is welded, and the labs weld nothing", () => {
    // ⚠ Welded, the station's top crosses the viewport's middle 8svh before
    // the era's exit begins, so the corner would read MUSINGS over the last
    // era's content. The writer stamps the edge WITH the mode and clears it
    // on every path the mode is cleared; the landing hook and the rail's
    // LOCAL both read it.
    const hook = read(HOOK);
    expect(hook).toContain('setAttribute("data-station-edge", "pin")');
    const clears = hook.match(/removeAttribute\("data-station-edge"\)/g) ?? [];
    expect(clears.length).toBeGreaterThanOrEqual(3);
    const landing = read("components/landing/v7/hooks/useLandingScroll.ts");
    expect(landing).toContain('stationEdge === "pin"');
    expect(landing).toContain("scrollY + 0.5");
    expect(landing).toContain('position === "sticky"');
    const marks = read("components/landing/v7/rail-instruments/useJourneyMarks.ts");
    expect(marks).toContain('getAttribute("data-active-station")');
    expect(marks).toContain('stationEdge === "pin"');
    // The labs mount the station over a hidden era marker and have nothing to
    // overlap: the weld would put the station at document y 0.
    expect(flat(read("app/(internal)/test/musings-row/musings-row-lab.css"))).toContain(
      "[data-mrl]#musings.station{--mu-weld:0px;}"
    );
  });
});
