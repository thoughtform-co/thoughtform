import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { coordStamp as arcCoordStamp } from "@/components/arcs/chrome";
import * as ARRIVE from "@/lib/musings/arrive";
import { ROW_ARRIVE_IN, ROW_ARRIVE_OUT, rowArrive } from "@/lib/musings/arrive";
import { MUSINGS_LIST_MAX } from "@/lib/musings/cards";
import { beatOf, coverSpec, slugSeed, yearFraction } from "@/lib/musings/cover";
import * as HEAD from "@/lib/musings/headDecode";
import {
  HEAD_LINE_STAGGER_S,
  HEAD_REARM_BELOW,
  HEAD_REVEAL_AT,
  headFrame,
  headParked,
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
  ORBIT_CORE,
  ORBIT_HALF,
  ORBIT_PATH,
  ORBIT_RIM,
  ORBIT_RINGS,
  orbitDrift,
  orbitEllipse,
  orbitEllipsePoint,
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

  it("has NO exit at the bottom — the footer covering the list is the exit (ADR-105 U4)", () => {
    // ⚠ Until U4 the list folded at p 0.95, before the release. The footer
    // rises OVER the pinned stage now, and a list that folded first would leave
    // it rising over an empty frame — the dead space the owner named. `p`
    // saturates at 1 through the rise (the writer's clock is the dwell), so the
    // list must stay `in` at 1, and the retired constant may not come back.
    for (const p of [0.94, 0.95, 0.99, 1]) expect(rowArrive("in", p)).toBe("in");
    expect("ROW_ARRIVE_END" in ARRIVE).toBe(false);
  });

  it("is a hysteresis, so resting on the edge does not re-trigger it", () => {
    expect(ROW_ARRIVE_OUT).toBeLessThan(ROW_ARRIVE_IN);
    expect(rowArrive("in", (ROW_ARRIVE_IN + ROW_ARRIVE_OUT) / 2)).toBe("in");
    expect(rowArrive("await", (ROW_ARRIVE_IN + ROW_ARRIVE_OUT) / 2)).toBe("await");
  });

  it("closes on the way back up, and re-opens from there", () => {
    expect(rowArrive("in", 0.01)).toBe("out");
    expect(rowArrive("out", 0.5)).toBe("in");
  });

  it("keeps `await` and `out` APART", () => {
    // ⚠ Both paint nothing, but `out` plays the close and `await` has never
    // been seen — collapsing them shuts the row on the way IN.
    expect(rowArrive("await", 0.01)).toBe("await");
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

  it("reveals just past the pin, and stays whole under the rising footer", () => {
    // ⚠ ADR-105 U4: no leave at the bottom. The footer covering the head IS the
    // exit; `p` saturates at 1 through the rise and the stage stays parked.
    expect(headTarget(0, HEAD_REVEAL_AT, true)).toBe(1);
    expect(headTarget(0, 0.5, true)).toBe(1);
    for (const p of [0.965, 0.99, 1]) expect(headTarget(1, p, true)).toBe(1);
    expect(headTarget(1, HEAD_REARM_BELOW - 0.001, true)).toBe(0);
    expect("HEAD_LEAVE_AT" in HEAD).toBe(false);
    expect("HEAD_RETURN_BELOW" in HEAD).toBe(false);
  });

  it("is a hysteresis at the top", () => {
    expect(HEAD_REARM_BELOW).toBeLessThan(HEAD_REVEAL_AT);
    const low = (HEAD_REARM_BELOW + HEAD_REVEAL_AT) / 2;
    expect(headTarget(1, low, true)).toBe(1);
    expect(headTarget(0, low, true)).toBe(0);
  });

  it("shows the head whole on a deep reload parked inside the dwell or the rise", () => {
    expect(headTarget(null, 0.5, true)).toBe(1);
    expect(headTarget(null, 1, true)).toBe(1);
  });

  it("is parked while the runway covers the frame, and NOT on the approach or a bare release", () => {
    const vh = 1247;
    expect(headParked(0, vh, vh, 0)).toBe(true);
    expect(headParked(0.5, vh - 0.5, vh, 0)).toBe(true);
    expect(headParked(-600, vh + 400, vh, vh)).toBe(true); // mid-dwell, a rise declared
    expect(headParked(1, vh + 1000, vh, 0)).toBe(false); // the approach
    // The labs: no rise, the stage travels out in view — blank (the masthead law).
    expect(headParked(-1, vh - 1, vh, 0)).toBe(false);
    expect(headParked(-300, vh - 300, vh, 0)).toBe(false);
  });

  it("stays parked UNDER the footer past the runway's end (ADR-105 U4)", () => {
    // 1280×720: the footer is 307px taller than the frame, so the document runs
    // past the runway's end and the stage travels up under a footer whose top
    // (`bottom − rise`) is already at or above the frame's top. Blanking it there
    // was invisible; the return re-pinned under a covered frame and burst a
    // 0.7s decode that a flick uncovered mid-shuffle. Whole under the footer.
    const vh = 720;
    expect(headParked(-1, vh - 1, vh, vh)).toBe(true);
    expect(headParked(-307, vh - 307, vh, vh)).toBe(true); // the document's end
    expect(headParked(-2000, vh - 307, vh, vh)).toBe(true); // a deep reload there
    // ⚠ The test is the FOOTER's top, not `rise === vh`: a rise retuned shorter
    // than the frame would expose a strip of travelling stage, and the snap
    // must come back there.
    expect(headParked(-1, vh - 1, vh, 0.8 * vh)).toBe(false);
    expect(headParked(-200, vh - 200, vh, 0.8 * vh)).toBe(true); // once the footer's top passes 0
  });

  it("leaves the state alone on a non-finite reading", () => {
    expect(headTarget(1, Number.NaN, true)).toBe(1);
    expect(headTarget(0, Number.NaN, true)).toBe(0);
  });

  it("decodes BEFORE the list arrives (the owner's order)", () => {
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

describe("orbit — the field behind the portrait, carrying a note's year (ADR-122 U2)", () => {
  it("plots the note at its own year fraction and the year's OTHER notes, never itself or another year's", () => {
    const posts = [
      { slug: "a", date: "2026-09-14" },
      { slug: "b", date: "2026-03-01" },
      { slug: "c", date: "2025-12-31" },
    ];
    const spec = orbitSpec(posts[0], posts);
    expect(spec.f).toBeCloseTo(yearFraction("2026-09-14"), 9);
    expect(spec.others).toHaveLength(1);
    expect(spec.others[0]).toBeCloseTo(yearFraction("2026-03-01"), 9);
  });

  it("is a FIELD, not an instrument: every ring inside the rim, nothing graduated, nothing lettered", () => {
    // ⚠ The owner's read (2026-09-25): "less like a compass". What made the
    // first cut one was its BEARING vocabulary — a graduated rim, cardinal
    // stubs, spokes, a hand and quarter-month labels. None of that exists now,
    // so the ring ladder is all the geometry module publishes, and the crop
    // only has to hold the rings and the dust just outside them.
    for (const r of ORBIT_RINGS) expect(r.r).toBeLessThanOrEqual(ORBIT_RIM);
    expect(ORBIT_RINGS).toHaveLength(6);
    expect(ORBIT_HALF).toBeGreaterThan(ORBIT_RIM);
    // About's own ladder, radius for radius, and all three gold rungs quiet.
    expect(ORBIT_RINGS.map((r) => r.r)).toEqual([192, 172, 150, 124, 104, 82]);
    expect(ORBIT_RINGS.filter((r) => r.ink === "gold" || r.ink === "soft")).toHaveLength(3);
  });

  it("gives two notes their own orbit, and neither one's shape is its date", () => {
    // ⚠ TWO SEEDS. Tilt and flattening off one number move together, so every
    // cover would sit on one line through the family. And neither is the date:
    // the date is already the arc's length and the body's seat.
    const a = orbitEllipse("encode-the-context");
    const b = orbitEllipse("the-vibe-is-different");
    expect(a.deg).not.toBeCloseTo(b.deg, 3);
    expect(a.ry).not.toBeCloseTo(b.ry, 3);
    for (const e of [a, b]) {
      expect(e.rx).toBe(ORBIT_PATH);
      expect(e.ry).toBeGreaterThan(ORBIT_PATH * 0.25);
      expect(e.ry).toBeLessThan(ORBIT_PATH * 0.47);
      expect(Math.abs(e.deg)).toBeLessThanOrEqual(34);
    }
    // Stable across a render on the server and one on the client.
    expect(orbitEllipse("encode-the-context")).toEqual(a);
  });

  it("seats the year clockwise from the orbit's own twelve o'clock, and inside the crop", () => {
    const e = { rx: ORBIT_PATH, ry: ORBIT_PATH * 0.34, deg: 0 };
    const jan = orbitEllipsePoint(e, 0);
    expect(jan.x).toBeCloseTo(0, 9);
    expect(jan.y).toBeCloseTo(-e.ry, 9);
    // A quarter of the year later the body is to the RIGHT — clockwise.
    expect(orbitEllipsePoint(e, 0.25).x).toBeCloseTo(e.rx, 9);
    // And every seat on every real orbit stays inside the crop, with the
    // body's corona (r 14) clear of the wall.
    for (const slug of ["a", "navigate-the-intelligence", "the-model-has-a-dialect"]) {
      const o = orbitEllipse(slug);
      for (let i = 0; i <= 64; i++) {
        const p = orbitEllipsePoint(o, i / 64);
        expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(ORBIT_HALF - 14);
      }
    }
  });

  it("scatters the drift in an ANNULUS, never a box", () => {
    // ⚠ A square scatter puts motes in the corners, where this crop has no
    // field and the eye reads them as dirt on the glass.
    const drift = orbitDrift("navigate-the-intelligence");
    expect(drift.length).toBeGreaterThan(8);
    for (const m of drift) {
      const r = Math.hypot(m.x, m.y);
      expect(r).toBeGreaterThanOrEqual(ORBIT_CORE - 21);
      expect(r).toBeLessThanOrEqual(ORBIT_RIM + 13);
      expect(m.o).toBeGreaterThan(0.2);
      expect(m.o).toBeLessThan(0.7);
    }
    expect(orbitDrift("navigate-the-intelligence")).toEqual(drift);
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

  it("the open note grows on ONE transition and one clock — the feature's own row", () => {
    // ⚠ v10's mechanic (ADR-122 U2): the note is a ruled LINE and the feature
    // unrolls under it, 0fr → 1fr. v17's second transition went with the cover
    // column — there is no thumbnail to grow from, because the drawing lives
    // INSIDE the feature. Nothing is posed, measured or written per frame; the
    // writer moves one attribute.
    const sheet = read(SHEET);
    const note = flat(bodyOf(sheet, ".mu-note"));
    expect(note).toContain("grid-template-rows:var(--mu-note-row)auto");
    expect(bodyOf(sheet, ".mu-note__open")).toMatch(/grid-template-rows:\s*0fr/);
    expect(bodyOf(sheet, ".mu-note[data-mu-open] .mu-note__open")).toMatch(
      /grid-template-rows:\s*1fr/
    );
    expect(bodyOf(sheet, ".mu")).toMatch(
      /--mu-note-grow:\s*560ms cubic-bezier\(0\.16, 1, 0\.3, 1\)/
    );
    // ⚠ AND THE COVER COLUMN IS GONE, NOT MERELY UNUSED: `--mu-note-col` and
    // `--mu-note-thumb` are what a half-reverted promotion would leave behind,
    // resolving to nothing and collapsing the cover to zero in silence.
    expect(rules(sheet)).not.toMatch(/--mu-note-col|--mu-note-thumb/);
    // ADR-121's row mechanic is gone with the row.
    expect(rules(sheet)).not.toMatch(/flex-grow|--mu-strip|--mu-open-w|--mu-closed/);
  });

  it("the ledger's line is five cells, and every one but the title is a constant of the TYPE", () => {
    // ⚠ v10 (owner, 2026-09-25: "make V10 the design for the musing section").
    // The date and the length are PT Mono columns, so every title starts and
    // ends on one line down the whole list however long a note's name is.
    const sheet = read(SHEET);
    const row = flat(bodyOf(sheet, ".mu-note__row"));
    expect(row).toContain(
      "grid-template-columns:12pxvar(--mu-note-date)minmax(0,1fr)autovar(--mu-note-len)"
    );
    const markup = read(NOTE);
    for (const cls of ["__mark", "__date", "__title", "__chip", "__len"]) {
      expect(markup).toContain(`className="mu-note${cls}"`);
    }
    // ⚠ THE STATE IS FOUR SMALL MARKS, NEVER A FILL OR A FILTER (ADR-097 U12's
    // photosensitivity ruling): the diamond fills, the date and the chip go
    // gold-ink, the row's ink comes up. Nothing large-area changes value.
    expect(bodyOf(sheet, ".mu-note[data-mu-open] .mu-note__mark")).toMatch(
      /background:\s*var\(--gold-line\)/
    );
    expect(bodyOf(sheet, ".mu-note[data-mu-open] .mu-note__date")).toMatch(
      /color:\s*var\(--gold-ink\)/
    );
    expect(bodyOf(sheet, ".mu-note[data-mu-open] .mu-note__chip")).toMatch(
      /color:\s*var\(--gold-ink\)/
    );
  });
  it("nothing 3D survives — no perspective, no 3D rotation, no 3D context, no edge fade", () => {
    // ADR-119's rack, shelf and row are all retired with the form (ADR-121).
    // A `perspective` or a `rotateX` that came back would be the jukebox
    // returning under a new name; a mask on the row would be its edge fade.
    // ⚠ THE BAN IS ON THE 3D FORMS, AND THE ONE 2D ROTATION IS NAMED BELOW —
    // the ledger's 8px state diamond is the house's own mark (the rail's
    // detent, the console's station), and a blanket `rotate(` ban would have
    // made it unwritable rather than made the station safer.
    for (const src of [read(SHEET), read(NOTE), read(ORBIT), read(STATION), read(HOOK)]) {
      const s = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
      expect(s).not.toMatch(/perspective/);
      expect(s).not.toMatch(/rotate[XYZ]\(|rotate3d\(/);
      expect(s).not.toMatch(/translateZ|preserve-3d|transform-style/);
      expect(s).not.toMatch(/mu__window|mu__rig|mu__rack|data-mu-tilt|muTilt|data-mu-front/);
      expect(s).not.toMatch(/--mu-step|--mu-tail|--mu-i\b|data-mu-card/);
      expect(s).not.toMatch(/rowMath|rowPose|rowGeom/);
    }
    // The only mask left in the sheet is the masthead's own dot-grid lift.
    for (const [, sel, body] of blocks(read(SHEET))) {
      if (/mask-image/.test(body)) expect(sel.trim()).toBe(".mu__grid");
      // And the only rotation anywhere in it is the state diamond's 45°.
      if (/rotate\(/.test(body)) expect(sel.trim()).toBe(".mu-note__mark");
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
    // ⚠ The open feature's floor is paid for first, then the way out; the
    // closed rows share what is left at the ledger's 6.4svh where they can,
    // never under 44px; the feature takes what the rows then leave, up to
    // 260px. `100cqh` is the notes' box — the one size container above the
    // rows. ⚠ THE PER-ROW TERM IS 1px, not a gap: the ledger's rows TOUCH and
    // each carries its own top rule (ADR-122 U2).
    const sheet = read(SHEET);
    const rung = rules(sheet).slice(rules(sheet).indexOf(`@media ${RUNG} {`));
    const notes = flat(bodyOf(rung, ".mu[data-mu-ready] .mu__notes"));
    expect(notes).toContain("container-type:size");
    expect(notes).toContain(
      "--mu-note-row:clamp(44px,min(6.4svh,calc((100cqh-var(--mu-note-open-min)-var(--mu-foot-h))/var(--mu-n,3)-1px)),68px)"
    );
    expect(notes).toContain(
      "--mu-note-open:clamp(var(--mu-note-open-min),calc(100cqh-var(--mu-n,3)*(var(--mu-note-row)+1px)-1px-var(--mu-foot-h)),260px)"
    );
    // The way out's row is the term the arithmetic subtracts.
    expect(bodyOf(sheet, ".mu__foot")).toMatch(/height:\s*var\(--mu-foot-h\)/);
    // And the station hands the list its count.
    expect(read(STATION)).toContain('"--mu-n": posts.length');
  });
  it("the cover is UNFRAMED, square, and ends on the feature's floor", () => {
    // ⚠ The owner, 2026-09-25: "the visual / diagram on the right should not
    // have a frame around it just the diagram." No border, no ground, no
    // notch, no well — a square at the feature's end, at its full height. The
    // capture measures the same two declarations live.
    const sheet = read(SHEET);
    const cover = flat(bodyOf(sheet, ".mu-note__cover"));
    expect(cover).toContain("grid-column:2");
    expect(cover).toContain("justify-self:end");
    expect(cover).toContain("aspect-ratio:1");
    expect(cover).toContain("height:100%");
    // ⚠ Declaration-level, not a substring: `box-sizing: border-box` contains
    // the word "border" and a blunt regex passes it for a border it never had.
    for (const prop of ["border", "border-top", "background", "background-color", "clip-path"]) {
      expect(cover, prop).not.toMatch(new RegExp(`(^|;)${prop}:`));
    }
    // ⚠ AND THE FOLDER SKIN IS GONE FROM THE NOTE ITSELF — the plate, the ring,
    // the bloom, the scanline, the notch and the frost all went with v17. A
    // half-reverted promotion leaves one of them painting on a ruled row.
    const note = flat(bodyOf(sheet, ".mu-note"));
    expect(note).toContain("border-top:1pxsolidvar(--mu-rule)");
    expect(note).not.toMatch(/clip-path|backdrop-filter|--mu-plate|--mu-lip/);
    expect(bodyOf(sheet, ".mu-note::before")).toBe("");
    expect(rules(sheet)).not.toMatch(/--mu-plate|--mu-lip|--mu-blur|--mu-glass-a|--mu-bloom-a/);
    // The feature's copy column is seated at its TOP (the ledger's own round-
    // four ruling); the air falls below it, where it is the row's.
    expect(bodyOf(sheet, ".mu-note__copy")).toMatch(/justify-content:\s*flex-start/);
    const detail = flat(bodyOf(sheet, ".mu-note__detail"));
    expect(detail).toContain("height:var(--mu-note-open)");
    expect(detail).toContain("grid-template-columns:minmax(0,1fr)var(--mu-note-open)");
    // ⚠ AND THE COPY IS INDENTED ONTO THE TITLE'S OWN COLUMN — the mark, the
    // date column and the two gaps — so the ledger reads as one ruled table.
    expect(detail).toContain("calc(12px+var(--mu-note-date)+2*var(--mu-note-cgap))");
  });
  it("the title rides its ROW, set whole on one line", () => {
    // ⚠ The ledger's row is shorter than v17's card, so the cap is `row × .58`
    // against a 32px ceiling rather than v4's 48: a shorter row (more notes, a
    // shorter frame) sets a smaller title rather than a clipped one, and the
    // ellipsis is a belt the capture fails.
    const sheet = read(SHEET);
    expect(flat(bodyOf(sheet, ".mu"))).toContain(
      "--mu-note-title:min(clamp(20px,1.7vw,32px),calc(var(--mu-note-row)*0.58))"
    );
    const title = flat(bodyOf(sheet, ".mu-note__title"));
    expect(title).toContain("font-size:var(--mu-note-title)");
    expect(title).toContain("white-space:nowrap");
    expect(title).toContain("font-family:var(--font-pp-neue-montreal)");
  });
  it("three lines of the excerpt's measure hold the registry's whole budget, inside the feature", () => {
    // ⚠ The feature's height is a fixed `--mu-note-open` box, so the question
    // is whether the longest approved summary, the stack's gap and the way in
    // fit it at its FLOOR. At 190px: three lines of 19px copy at 1.45 (82.7),
    // the stack's 28px ceiling, the 38px button and the detail's 22px bottom
    // padding come to 170.7.
    const MEAN_ADVANCE_EM = 0.45;
    const sheet = read(SHEET);
    const registry = read("tests/lib/musings-registry.test.ts");
    const budget = Number(/summary\.length\)\.toBeLessThanOrEqual\((\d+)\)/.exec(registry)?.[1]);
    expect(budget).toBeGreaterThan(0);
    const measureEm = Number(/max-width:\s*(\d+)em/.exec(bodyOf(sheet, ".mu-note__lede"))?.[1]);
    expect(measureEm).toBe(36);
    expect(3 * measureEm).toBeGreaterThanOrEqual(budget * MEAN_ADVANCE_EM);
    const floorPx = 190;
    const lede = bodyOf(sheet, ".mu-note__lede");
    const ledeMax = Number(/font-size:\s*clamp\([^)]*?,\s*([\d.]+)px\)/.exec(lede)?.[1]);
    const lead = Number(/line-height:\s*([\d.]+)/.exec(lede)?.[1]);
    const gapMax = Number(
      /gap:\s*clamp\([^)]*?,\s*(\d+)px\)/.exec(bodyOf(sheet, ".mu-note__copy"))?.[1]
    );
    const button = Number(/min-height:\s*(\d+)px/.exec(bodyOf(sheet, ".mu-note__read"))?.[1]);
    const pad = Number(
      /padding:\s*0 0 clamp\([^)]*?,\s*(\d+)px\)/.exec(bodyOf(sheet, ".mu-note__detail"))?.[1]
    );
    expect(3 * ledeMax * lead + gapMax + button + pad).toBeLessThan(floorPx);
    // And the floor the arithmetic is measured against is the one declared.
    expect(flat(bodyOf(sheet, ".mu"))).toContain(`--mu-note-open:clamp(${floorPx}px,22svh,260px)`);
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
    // The unfold: across first (the first 40 %), then down. ⚠ AN `inset` SINCE
    // ADR-122 U2 — the ledger's note is a rectangle, so the notched polygon
    // pair is deleted rather than kept with a zero cut, and `--mu-ch` goes
    // with it (a silhouette term nothing draws is one a later pass restores).
    const unfold = /@keyframes mu-unfold-rect \{([\s\S]*?)\n\}/.exec(sheet)?.[1] ?? "";
    expect(flat(unfold)).toContain("0%{clip-path:inset(0100%calc(100%-1px)0);}");
    expect(flat(unfold)).toContain("40%{clip-path:inset(00calc(100%-1px)0);}");
    expect(flat(unfold)).toContain("100%{clip-path:inset(0);}");
    expect(sheet).not.toMatch(/@keyframes mu-unfold \{|@keyframes mu-fold \{/);
    // ⚠ `\b` after `ch`, or the ban also fails on `--mu-chrome`.
    expect(sheet).not.toMatch(/--mu-ch\b|--mu-chi\b/);
    // ⚠ Geometry only — no opacity curve in the arrival, no filter (ADR-097 U12).
    expect(unfold).not.toMatch(/opacity|filter/);
    // The line, lit while it IS a line: the note's own top rule, which is why
    // the rule sits on the note's top rather than on its bottom.
    const edge = /@keyframes mu-unfold-edge \{([\s\S]*?)\n\}/.exec(sheet)?.[1] ?? "";
    expect(flat(edge)).toContain("0%,40%{border-top-color:var(--gold-line);}");
    const mu = flat(bodyOf(read(SHEET), ".mu"));
    expect(mu).toContain("--mu-unfold-in:820mscubic-bezier(0.65,0,0.35,1)");
    expect(mu).toContain("--mu-unfold-out:420mscubic-bezier(0.65,0,0.35,1)");
    // One after another: the note carries its slot, the delay reads it, and the
    // fill is `backwards` (a waiting note is a zero-width line; the last frame
    // is the cascade's own silhouette).
    expect(read(NOTE)).toContain('"--mu-slot": index');
    // The arrival's rung block — the LAST one before the drift's `@supports`
    // block (ADR-105 U4), which carries a rung of its own.
    const rung = sheet.slice(
      sheet.lastIndexOf(`@media ${RUNG} {`, sheet.indexOf("@supports (animation-timeline: view())"))
    );
    const inRule = flat(bodyOf(rung, '.mu[data-mu-ready][data-mu-arrive="in"] .mu-note'));
    expect(inRule).toContain(
      "mu-unfold-rectvar(--mu-unfold-in)calc(var(--mu-slot,0)*var(--mu-unfold-step))backwards"
    );
    expect(inRule).toContain(
      "mu-unfold-edgevar(--mu-unfold-in)calc(var(--mu-slot,0)*var(--mu-unfold-step))backwards"
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

  it("there is NO glass, and nothing on the station frosts anything (ADR-122 U2)", () => {
    // ⚠ ADR-121's frost existed because the note was a PLATE over a live
    // corridor and had to be told from it. The ledger's note is a hairline and
    // its copy on the station's own ground, exactly as the masthead above it
    // — a `backdrop-filter` on a box with no fill frosts nothing and costs a
    // per-frame snapshot anyway (ADR-056's measurement). Deleted, not zeroed:
    // a `blur(0)` still snapshots. The theme's BLOCK 4g half goes with it.
    const sheet = rules(read(SHEET));
    expect(sheet).not.toMatch(/backdrop-filter/);
    const theme = rules(read(THEME));
    expect(theme).not.toMatch(/#musings\[data-mu-mode="stage"\][^{]*\.mu-note/);
    expect(theme).not.toMatch(/--mu-bloom-a|--mu-glass-a|--mu-plate|--mu-lip/);
    // What light still re-derives on this station: the quietest ink rung
    // (BLOCK 4e) and the cover's one gold FILL, which takes the LINE rung at
    // 5.5px on parchment (ADR-063 U2).
    expect(bodyOf(theme, 'html[data-theme="light"] .mu')).toMatch(/--mu-ink-3:/);
    expect(bodyOf(theme, 'html[data-theme="light"] .mu-orbit__lit')).toMatch(
      /fill:\s*var\(--gold-line\)/
    );
  });

  it("the state is four small marks, never a fill and never a filter", () => {
    // A large-area brightness or value change on every hover is the class of
    // motion ADR-097 U12 retired. The open note is told by its 8px diamond,
    // its date, its chip and the row's ink — and by nothing with an area.
    const sheet = rules(read(SHEET));
    for (const [, sel, body] of blocks(sheet)) {
      if (/\.mu-note/.test(sel)) {
        expect(body, sel).not.toMatch(/(^|[\s;])filter\s*:/);
        // ⚠ The note itself may not take a ground in ANY state: that is what
        // the folder plate was, and the ledger's row is a hairline and its ink.
        if (/^\.mu-note(\[[^\]]*\])?$/.test(sel.trim()))
          expect(body, sel).not.toMatch(/(^|[\s;])background(-color|-image)?\s*:/);
      }
    }
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

  it("the runway is ONE dwell plus the RISE, and the dwell is the dial", () => {
    const sheet = rules(read(SHEET));
    expect(flat(bodyOf(sheet, ".mu[data-mu-ready] .mu__runway"))).toContain(
      "height:calc(100svh+var(--mu-dwell)+var(--mu-rise))"
    );
    // 120svh since ADR-122 U1 (owner: "it scrolls too quickly into the next
    // section"); 60svh held the list for ~6 wheel steps at 1247px.
    expect(bodyOf(sheet, ".mu")).toMatch(/--mu-dwell:\s*120svh/);
  });

  /* ── The rise: the footer over the list (ADR-105 U4) ─────────────────── */

  const FOOTER = "components/landing/v7/site-footer/site-footer.css";

  it("the rise IS the footer's weld — ONE declaration on the stations' parent, read by both", () => {
    // ⚠ ONE NUMBER, ONE DECLARATION. The stage stays pinned for `--mu-rise` after
    // the dwell and `#contact` is pulled up by `--ft-weld`: equal, the footer's
    // top enters the floor at the end of the dwell and reaches the frame's top
    // exactly as the runway releases. Larger, the stage unpins uncovered;
    // smaller, the footer arrives early over the dwell. Neither station can
    // read the other's custom properties, but both inherit `.stations`', so the
    // weld is declared THERE, once, and the musings station aliases it. The
    // first cut declared it twice and pinned the pair by arithmetic — two edits
    // and a test for what one declaration says. A second `--ft-weld:` anywhere
    // is that pair coming back.
    const sheet = rules(read(SHEET));
    const footer = rules(read(FOOTER));
    expect(bodyOf(sheet, "#musings.station")).toMatch(/--mu-rise:\s*0px/);
    expect(flat(bodyOf(sheet, "#musings.station:has(~ #contact.station)"))).toContain(
      "--mu-rise:var(--ft-weld,0px)"
    );
    expect(bodyOf(footer, ".stations")).toMatch(/--ft-weld:\s*100svh/);
    expect(bodyOf(footer, "#contact.station")).not.toMatch(/--ft-weld\s*:/);
    expect(sheet.match(/--ft-weld\s*:/g) ?? []).toHaveLength(0);
    expect(footer.match(/--ft-weld\s*:/g) ?? []).toHaveLength(1);
  });

  it("the footer is welded on the list's own stamp, promoted, and never sticky", () => {
    // One stamp (`data-mu-ready`) turns on the runway's rise AND the footer's
    // weld, so the two cannot disagree. z 8 is above the corridor's canvas host
    // (z 3) and the promoted musings stage (z 6/7) — the footer is the cover.
    const footer = rules(read(FOOTER));
    const weld = flat(bodyOf(footer, "#musings:has(.mu[data-mu-ready]) ~ #contact.station"));
    expect(weld).toContain("margin-top:calc(-1*var(--ft-weld))");
    expect(weld).toContain("position:relative");
    expect(weld).toContain("z-index:8");
    // ⚠ U3's bed is DELETED — a sticky footer would be held under the list it
    // now rises over, and its stamp may not come back on any file.
    expect(footer).not.toMatch(/position:\s*sticky/);
    for (const f of [HOOK, SHEET, FOOTER, STATION])
      expect(read(f), `${f} still names the bed`).not.toMatch(
        /setAttribute\("data-ft-reveal"|html\[data-ft-reveal\]/
      );
  });

  it("the writer's clock is the DWELL — the rise is subtracted, so no threshold moved", () => {
    const hook = read(HOOK);
    expect(hook).toContain("runway.offsetHeight - vh - rise");
    // The rise is read off a probe sized by the property (a custom property is
    // a string until something lays it out), and the probe is cleaned up.
    expect(hook).toContain("height:var(--mu-rise,0px)");
    expect(hook).toContain("riseProbe?.remove()");
  });

  it("the writer stamps data-mu-ready BEFORE it measures, so the first tick reads the pinned layout", () => {
    // The runway's height and the footer's weld both key on the stamp. Read
    // before it, the rect is the FLOWING list's: on the first tick after a deep
    // reload `travel` was max(1, rest − vh − rise) = 1, `p` saturated, and the
    // head was seeded off a layout nobody sees.
    const hook = read(HOOK);
    const tick = hook.slice(hook.indexOf("const tick = () =>"));
    const stamp = tick.indexOf('setAttribute("data-mu-ready"');
    expect(stamp).toBeGreaterThan(-1);
    expect(stamp).toBeLessThan(tick.indexOf("runway.getBoundingClientRect()"));
    expect(stamp).toBeLessThan(tick.indexOf("risePx()"));
    expect(stamp).toBeLessThan(tick.indexOf("runway.offsetHeight"));
  });

  it("the head is shown while parked OR covered by the footer — never on a stage seen moving", () => {
    // The writer asks `headParked` (pinned, or past the runway's end under a
    // footer whose top is at or above the frame's top) and blanks the head on
    // any other frame; a bare `pinned` re-armed a decode under the footer.
    const hook = read(HOOK);
    expect(hook).toContain("headParked(rect.top, rect.bottom, vh, rise)");
    expect(hook).toMatch(/const want = headTarget\(headWant, p, parked\)/);
    expect(hook).toMatch(/if \(!parked\) \{/);
  });

  it("the veil under the rising footer paints ABOVE every layer in the stage", () => {
    // The stage is a stacking context (sticky, and transformed while it
    // drifts). The title and the brief sit at z 1 and the notes' ring at 2, so
    // a veil at `z-index: auto` dimmed the list and left the head at full ink —
    // and the capture's veil gate, reading the pseudo-element's OPACITY,
    // passed. The veil takes one rung above the sheet's highest interior z.
    const sheet = rules(read(SHEET));
    const sup = sheet.slice(sheet.indexOf("@supports (animation-timeline: view())"));
    const veil = bodyOf(
      sup,
      "#musings:has(~ #contact.station) .mu[data-mu-ready] .mu__stage::after"
    );
    const veilZ = Number(/z-index:\s*(\d+)/.exec(veil)?.[1]);
    expect(veilZ).toBe(3);
    // Every other z-index in the sheet — the stage's interior — stays under it.
    const others = [...sheet.replace(veil, "").matchAll(/z-index:\s*(\d+)/g)].map((m) =>
      Number(m[1])
    );
    expect(others.length).toBeGreaterThan(0);
    expect(Math.max(...others)).toBeLessThan(veilZ);
  });

  it("the list drifts and dims under the footer on the COMPOSITOR, behind @supports", () => {
    // ⚠ A main-thread writer posing the stage against a compositor scroll lands
    // one wheel step behind it (the Trinny hero curtain). So the drift is a
    // scroll timeline — the runway's own — windowed on the rise, and the whole
    // block is inside `@supports`, without which a browser lacking timelines
    // runs the keyframes on the document timeline.
    const sheet = rules(read(SHEET));
    const sup = sheet.slice(sheet.indexOf("@supports (animation-timeline: view())"));
    expect(sup).toContain(`@media ${RUNG} {`);
    const stageSel = "#musings:has(~ #contact.station) .mu[data-mu-ready] .mu__stage";
    const stage = flat(bodyOf(sup, stageSel));
    expect(stage).toContain("animation:mu-underlinearboth");
    expect(stage).toContain("animation-timeline:--mu-run");
    expect(stage).toContain("animation-range:containcalc(100%-var(--mu-rise))contain100%");
    // ⚠ NEVER opacity on the stage — the notes are glass and a translucent
    // ancestor blinds their backdrop-filter (ADR-097). The dim is the veil.
    expect(stage).not.toMatch(/opacity/);
    expect(flat(bodyOf(sup, `${stageSel}::after`))).toContain("animation:mu-under-veillinearboth");
    expect(flat(bodyOf(sup, ".mu[data-mu-ready] .mu__runway"))).toContain(
      "view-timeline:--mu-runblock"
    );
    expect(flat(sheet)).toContain("transform:translateY(calc(-0.25*var(--mu-rise)))");
  });

  it("the footer's key visual glides at 0.75x on its own view timeline, behind @supports", () => {
    // inversa.com's footer, measured: the box travels 1:1 and its wordmark at
    // ~0.72x. The picture is `--ft-par` taller than its plate and slides from
    // −par to 0 over the footer's entry; the plate already clips.
    const footer = rules(read(FOOTER));
    const sup = footer.slice(footer.indexOf("@supports (animation-timeline: view())"));
    expect(sup).toContain(`@media ${RUNG} {`);
    expect(flat(bodyOf(sup, ".ft-foot"))).toContain("view-timeline:--ftblock");
    const img = flat(bodyOf(sup, ".ft-foot__plate-img"));
    expect(img).toContain("height:calc(100%+var(--ft-par,0px))");
    expect(img).toContain("animation-timeline:--ft");
    expect(img).toContain("animation-range:entry0%entry100%");
    expect(flat(bodyOf(footer, ".ft-foot"))).toContain("--ft-par:25svh");
    expect(flat(bodyOf(footer, ".ft-foot__plate"))).toContain("overflow:hidden");
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

  it("the welded station is hit-transparent, and the arrived runway takes its hits back", () => {
    // ⚠ A transparent box still takes the click: from era p ≈ 0.45 the station's
    // box covers the era's band tablist, live until the era goes inert at
    // 0.92. `pointer-events` inherits, so one `none` and one `auto` restore
    // (the band's restore went with the band, ADR-105 U4).
    const sheet = rules(read(SHEET));
    expect(bodyOf(sheet, '#musings[data-mu-mode="stage"].station')).toMatch(
      /pointer-events:\s*none/
    );
    expect(sheet).not.toMatch(/mu__band/);
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
