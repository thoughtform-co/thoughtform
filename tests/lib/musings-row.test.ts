import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { coordStamp as arcCoordStamp } from "@/components/arcs/chrome";
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
  ROW_ARRIVE_END,
  ROW_ARRIVE_IN,
  ROW_ARRIVE_OUT,
  ROW_DEPTH_CLEAR,
  ROW_PERSPECTIVE,
  ROW_READ,
  ROW_TILT,
  rowArrive,
  rowGeom,
  rowIndex,
  rowNearDepth,
  rowPose,
  rowReadIndex,
  rowSeat,
} from "@/lib/musings/rowMath";

/**
 * The row's arithmetic and the head's decode (ADR-119 U2).
 *
 * The row is CSS 3D driven by a scroll writer, so nothing here can be seen by a
 * DOM guard until it is already on screen — which is exactly the shape of
 * defect this house keeps finding late (ADR-069 U1: the guard measured a
 * silhouette; ADR-070 U34: the guard measured a model of the drawing). So the
 * geometry is pure and it is checked here, and the capture checks what the
 * browser does with it.
 */

const N = 5;
/** The owner's own viewport's face: 420 × 464 at 1920×1247. */
const G = rowGeom(420, 464);
/** The 961px rung's narrow, tall face — where a width-only depth would bite. */
const NARROW = rowGeom(300, 464);

const sin = (deg: number) => Math.sin((deg * Math.PI) / 180);

describe("rowPose — the row, tipped back about X", () => {
  it("stands the card being read upright on the rig's centre", () => {
    const p = rowPose(2, N, 2, G);
    expect(p.tilt).toBe(0);
    expect(p.transform).toBe(
      `perspective(${ROW_PERSPECTIVE}px) translateX(0.00px) translateZ(0.00px) rotateX(0deg)`
    );
  });

  it("tips every other card back by ROW_TILT, about X and ONLY about X", () => {
    // The owner, three passes running: the others are "rotated on the x-axis".
    // U0 turned them about Y (a copy of the services ring) and U1 turned them
    // 90° about Y (a shelf). Neither may come back through this function.
    for (let open = 0; open < N; open++) {
      for (let i = 0; i < N; i++) {
        const p = rowPose(i, N, open, G);
        expect(p.transform).not.toMatch(/rotateY|rotateZ|rotate\(/);
        expect(p.tilt).toBe(i === open ? 0 : ROW_TILT);
        expect(p.transform).toContain(`rotateX(${i === open ? 0 : ROW_TILT}deg)`);
      }
    }
    // Positive rotateX carries the card's TOP away from the reader.
    expect(ROW_TILT).toBeGreaterThan(0);
    expect(ROW_TILT).toBeLessThan(90);
  });

  it("seats the row symmetrically about the card being read", () => {
    for (let k = 1; k <= 3; k++) {
      const a = rowSeat(-k, G);
      const b = rowSeat(k, G);
      expect(a.dx).toBeCloseTo(-b.dx, 9);
      expect(a.z).toBeCloseTo(b.z, 9);
      expect(b.dx).toBeGreaterThan(0);
    }
  });

  it("recedes and spreads monotonically with the distance from the centre", () => {
    let prevDx = 0;
    let prevZ = 0;
    for (let k = 1; k <= 6; k++) {
      const s = rowSeat(k, G);
      expect(s.dx).toBeGreaterThan(prevDx);
      expect(s.z).toBeGreaterThan(prevZ);
      prevDx = s.dx;
      prevZ = s.z;
    }
  });

  it("keeps every tipped card's near edge BEHIND the upright one, so no two planes intersect", () => {
    // ⚠ A tipped card swings its bottom edge toward the reader by (h/2)·sin(tilt).
    // Across the upright card's plane the browser splits the two and the
    // neighbour prints THROUGH the card being read. The depth is floored on the
    // HEIGHT for exactly the narrow, tall face of the 961px rung.
    for (const g of [G, NARROW, rowGeom(333, 374), rowGeom(420, 336)]) {
      for (let k = 1; k <= 4; k++) {
        const near = -rowSeat(k, g).z + (g.h / 2) * sin(ROW_TILT);
        expect(near).toBeLessThanOrEqual(-ROW_DEPTH_CLEAR + 1e-9);
      }
    }
    expect(rowNearDepth(NARROW)).toBeGreaterThanOrEqual((NARROW.h / 2) * sin(ROW_TILT));
  });

  it("uses ONE function list in ONE order for both states: the eye first, the tip last", () => {
    // ⚠ A transition interpolates function by function only when the two lists
    // match; a list that changed between upright and tipped would SNAP at every
    // detent. The perspective is FIRST so every card is seen from one eye (all
    // are seated on the rig's centre), and the rotation is LAST so it turns the
    // card about its own centre at its seat.
    const shape = (t: string) => t.replace(/-?\d+(\.\d+)?/g, "#");
    const up = rowPose(1, N, 1, G).transform;
    const tipped = rowPose(3, N, 1, G).transform;
    expect(shape(up)).toBe(shape(tipped));
    for (const t of [up, tipped]) {
      expect(t.startsWith(`perspective(${ROW_PERSPECTIVE}px) `)).toBe(true);
      expect(t.indexOf("perspective(")).toBeLessThan(t.indexOf("translateX"));
      expect(t.indexOf("translateX")).toBeLessThan(t.indexOf("translateZ"));
      expect(t.indexOf("translateZ")).toBeLessThan(t.indexOf("rotateX"));
    }
  });

  it("paints the card being read over its neighbours, and each step out under the last", () => {
    expect(rowPose(2, N, 2, G).zIndex).toBeGreaterThan(rowPose(3, N, 2, G).zIndex);
    expect(rowPose(3, N, 2, G).zIndex).toBeGreaterThan(rowPose(4, N, 2, G).zIndex);
    expect(rowPose(1, N, 2, G).zIndex).toBe(rowPose(3, N, 2, G).zIndex);
  });

  it("clamps rather than throwing on an index outside the row", () => {
    expect(rowPose(-2, N, 0, G).transform).toBe(rowPose(0, N, 0, G).transform);
    expect(rowPose(99, N, 0, G).transform).toBe(rowPose(N - 1, N, 0, G).transform);
  });
});

describe("rowIndex — the detent", () => {
  it("rounds to a whole card, per the owner's ruling", () => {
    expect(rowIndex(0.49, N)).toBe(0);
    expect(rowIndex(0.5, N)).toBe(1);
    expect(rowIndex(2.7, N)).toBe(3);
  });

  it("stays on the row", () => {
    expect(rowIndex(-3, N)).toBe(0);
    expect(rowIndex(99, N)).toBe(N - 1);
    expect(rowIndex(0, 0)).toBe(0);
  });
});

describe("rowReadIndex — the reading band", () => {
  it("holds the first card through the approach and the last to the end", () => {
    expect(rowReadIndex(0, N)).toBe(0);
    expect(rowReadIndex(ROW_READ[0], N)).toBe(0);
    expect(rowReadIndex(ROW_READ[1], N)).toBeCloseTo(N - 1, 9);
    expect(rowReadIndex(1, N)).toBeCloseTo(N - 1, 9);
  });

  it("gives every card a whole step of the band", () => {
    const seen = new Set<number>();
    for (let i = 0; i <= 1000; i++) seen.add(rowIndex(rowReadIndex(i / 1000, N), N));
    expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it("advances monotonically, and is safe at one card", () => {
    let prev = -1;
    for (let i = 0; i <= 1000; i++) {
      const idx = rowReadIndex(i / 1000, N);
      expect(idx).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = idx;
    }
    expect(rowReadIndex(0.6, 1)).toBe(0);
  });
});

describe("rowArrive — the bounded burst", () => {
  it("opens after the head's own reveal, never with it", () => {
    // The owner's order: the text appears with a glitch effect, THEN the cards
    // come into view. The writer also holds `in` until the head has resolved.
    expect(ROW_ARRIVE_IN).toBeGreaterThan(HEAD_REVEAL_AT);
    expect(ROW_ARRIVE_IN).toBeGreaterThan(ROW_READ[0]);
  });

  it("holds the row open past the reading band's own end, and closes before the head leaves", () => {
    // A row that shut while the last card was being read would take the
    // reading away; a head that left before the cards would be the entry
    // played in the wrong order.
    expect(ROW_ARRIVE_END).toBeGreaterThan(ROW_READ[1]);
    expect(rowArrive("in", ROW_READ[1])).toBe("in");
    expect(ROW_ARRIVE_END).toBeLessThan(HEAD_LEAVE_AT);
  });

  it("is a hysteresis, so resting on the edge does not re-trigger it", () => {
    expect(ROW_ARRIVE_OUT).toBeLessThan(ROW_ARRIVE_IN);
    expect(rowArrive("in", (ROW_ARRIVE_IN + ROW_ARRIVE_OUT) / 2)).toBe("in");
    expect(rowArrive("await", (ROW_ARRIVE_IN + ROW_ARRIVE_OUT) / 2)).toBe("await");
  });

  it("closes on the way back and on the way past, and re-opens either way", () => {
    expect(rowArrive("in", 0.1)).toBe("out");
    expect(rowArrive("in", 0.99)).toBe("out");
    expect(rowArrive("out", 0.5)).toBe("in");
  });

  it("keeps `await` and `out` APART", () => {
    // ⚠ Both paint nothing, but `out` plays the close and `await` has never
    // been seen — collapsing them shuts the row on the way IN.
    expect(rowArrive("await", 0.1)).toBe("await");
    expect(rowArrive("await", 0.99)).toBe("await");
    expect(rowArrive("out", 0.1)).toBe("out");
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

describe("the rung is mirrored by hand, so pin it", () => {
  const ROOT = join(__dirname, "..", "..");
  const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

  const HOOK = "components/landing/home-v2/musings/useMusingsScroll.ts";
  const SHEET = "components/landing/home-v2/musings/musings.css";
  const CARD = "components/landing/home-v2/musings/MusingCard.tsx";
  const RUNG = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";

  it("the writer and the sheet name the SAME query", () => {
    // A writer and a sheet that disagree about the rung is a row posed in 3D
    // inside a box laid out as a flat rail, or a flat rail whose cards have
    // been given absolute seats. Neither errors and neither is visible in a
    // still taken at the other rung.
    expect(read(HOOK)).toContain(`MUSINGS_RACK_MEDIA = "${RUNG}"`);
    expect(read(SHEET)).toContain(`@media ${RUNG} {`);
  });

  it("the shelf's spine and yaw are GONE, from the sheet, the card and the writer", () => {
    // ADR-119 U2 — "I don't want a physical shelf or whatever". A spine that
    // came back would be a second lettered plane beside every card, and the
    // yaw a lean the symmetric row does not have.
    for (const src of [read(SHEET), read(CARD), read(HOOK)]) {
      expect(src).not.toMatch(/mu-card__spine/);
      expect(src).not.toMatch(/--mu-drift|--mu-spine|--mu-shelf-gap/);
    }
    expect(read(SHEET)).not.toMatch(/rotateY\(/);
  });

  it("seats every card on the rig's CENTRE, because that is the eye", () => {
    // ⚠ `rowPose` opens on `perspective()`, which projects about the card's own
    // transform-origin — its centre. `inset: 0; margin: auto` puts that centre
    // on the rig's centre for every card, so the row shares one view; U1's
    // `left: 0` seat would have put the row half a band out and given every
    // card its own vanishing point (U2: "the entire stack … should be centered").
    const sheet = read(SHEET);
    const rung = sheet.slice(sheet.indexOf(`@media ${RUNG} {`));
    const card = rung.match(/\.mu\[data-mu-ready\] \.mu-card \{([^}]*)\}/)?.[1] ?? "";
    expect(card).toMatch(/inset:\s*0/);
    expect(card).toMatch(/margin:\s*auto/);
    expect(card).toMatch(/transform-origin:\s*50% 50%/);
    expect(card).not.toMatch(/left:\s*(0|50%)/);
  });

  it("declares NO ancestor perspective and NO shared 3D context — each card owns its eye", () => {
    // ⚠ MEASURED: with `perspective` on `.mu__rig` over a `preserve-3d` rack,
    // the compositor inside this sticky, promoted stage painted a tipped card's
    // cover glyph ~125px right and ~140px below its own reported rect — each
    // neighbour a 30px sliver under the mid-line, every geometry gate green.
    // The perspective lives in each card's own matrix now (`rowPose`), where it
    // is resolved in one place.
    const rules = read(SHEET).replace(/\/\*[\s\S]*?\*\//g, "");
    expect(rules).not.toMatch(/(^|[\s;{])perspective\s*:/);
    expect(rules).not.toMatch(/preserve-3d/);
    expect(rowPose(0, N, 1, G).transform).toMatch(/^perspective\(\d+px\) /);
  });

  it("puts the edge fade on the window, never on the rig, the rack or a card", () => {
    // A mask hides everything outside its box and flattens what is inside it;
    // it belongs to the one box whose job is the band's edge.
    const sheet = read(SHEET);
    const blocks = [...sheet.matchAll(/([^{}]*)\{([^{}]*)\}/g)];
    for (const [, sel, body] of blocks) {
      if (/mask-image/.test(body)) expect(sel).not.toMatch(/\.mu__(rig|rack)\s*$|\.mu-card\s*$/);
    }
    expect(sheet).toMatch(/\.mu__window \{[^}]*mask-image/);
  });

  it("the pivot carries NO grouping property, on any rung", () => {
    // ⚠ `overflow` other than visible, `clip-path` other than none, an
    // `opacity` under 1 and a `filter` other than none each force
    // `transform-style: flat` on the element that declares them (CSS
    // Transforms 2 sec. 3). The face takes them; the pivot stays a transform.
    const sheet = read(SHEET);
    const pivots = [...sheet.matchAll(/([^{}]*)\{([^{}]*)\}/g)].filter(([, sel]) =>
      /(^|[\s,>])\.mu-card(\[[^\]]*\])?\s*$/.test(sel)
    );
    expect(pivots.length).toBeGreaterThanOrEqual(2);
    for (const [, , body] of pivots) {
      expect(body).not.toMatch(/(^|[\s;])overflow\s*:(?!\s*visible)/);
      expect(body).not.toMatch(/(^|[\s;])clip-path\s*:(?!\s*none)/);
      expect(body).not.toMatch(/(^|[\s;])filter\s*:(?!\s*none)/);
      expect(body).not.toMatch(/(^|[\s;])opacity\s*:/);
    }
  });

  it("the aperture carries the house's ONE pair of numbers, on all three hosts", () => {
    /* ⚠ 720ms in / 420ms out on `cubic-bezier(0.65, 0, 0.35, 1)` is ADR-097
       U12's settled pair. One host changing alone is a house grammar running a
       different clock on one surface. */
    const IN = "720ms cubic-bezier(0.65, 0, 0.35, 1)";
    const OUT = "420ms cubic-bezier(0.65, 0, 0.35, 1)";
    const hosts = [
      SHEET,
      "components/landing/home-v2/services/proof-stack/proof-stack.css",
      "app/(marketing)/arcs/trinny-london/proposal/trinny-london.css",
    ];
    for (const host of hosts) {
      const css = read(host);
      expect(css, `${host} carries the aperture's in`).toContain(IN);
      expect(css, `${host} carries the aperture's out`).toContain(OUT);
    }
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

  it("the writer publishes no opacity and no filter per card", () => {
    // The row's depth is its geometry (no shading, no material, by the owner's
    // ruling), and either as an element style would be the flattening above
    // arriving from the writer instead of the sheet.
    const hook = read(HOOK);
    expect(hook).not.toMatch(/style\.opacity\s*=/);
    expect(hook).not.toMatch(/style\.filter\s*=/);
  });

  it("the writer never asks the kernel for a frame at t = 0 — the head goes through `headFrame`", () => {
    // ⚠ The defect this pass fixed: `scrambleFrame(…, 0)` is NOT blank.
    const hook = read(HOOK);
    expect(hook).not.toMatch(/scrambleFrame\(/);
    expect(hook).toContain("headFrame(");
    expect(hook).not.toMatch(/advanceScrambles/);
  });

  it("the sheet gates every row rule on BOTH the rung and the stamp", () => {
    // `an absent stamp means shown` is the house's polarity law: the rest
    // state is the rail, which is what a phone, a reduced-motion reader and a
    // page whose script never ran all get.
    const sheet = read(SHEET);
    const rung = sheet.slice(sheet.indexOf(`@media ${RUNG} {`));
    // The edge fade and the card's absolute seat are row rules: on the rail
    // the one would fade a list and the other would stack every card on one spot.
    const fade = sheet.match(/([^{}]*)\{[^{}]*linear-gradient\(\s*90deg/)?.[1] ?? "";
    expect(fade).toContain(".mu[data-mu-ready] .mu__window");
    expect(rung).toContain(fade.trim());
    const seat = rung.match(/([^{}]*)\{[^{}]*inset:\s*0;\s*margin:\s*auto/)?.[1] ?? "";
    expect(seat).toContain(".mu[data-mu-ready] .mu-card");
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

  it("the writer holds no per-frame React state", () => {
    // ADR-002: one writer, CSS custom properties. The detent is the ONLY thing
    // that may re-render.
    const hook = read(HOOK);
    const sets = hook.match(/setState\(/g) ?? [];
    expect(sets.length).toBeLessThanOrEqual(4);
    expect(hook).toContain("frontRef");
  });
});
