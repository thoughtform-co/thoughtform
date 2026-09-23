import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { coordStamp as arcCoordStamp } from "@/components/arcs/chrome";
import { ROW_ARRIVE_END, ROW_ARRIVE_IN, ROW_ARRIVE_OUT, rowArrive } from "@/lib/musings/arrive";
import { MUSINGS_ROW_MAX } from "@/lib/musings/cards";
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

/**
 * The row's arrival, the head's decode, and the source ratchets (ADR-121).
 *
 * The row has NO geometry module any more — its mechanic is one transitioned
 * `flex-grow` in the sheet and one attribute the writer moves on an event —
 * so what a unit test can hold is the arrival's hysteresis, the head's clock,
 * the cover's arithmetic, and the SOURCE: that the rung is mirrored, that the
 * mechanic is the one property, that nothing 3D survived, that every card is
 * a real link, and that the writer renders nothing. The capture
 * (`scripts/capture-musings-row.mjs`) checks what the browser does with it.
 */

describe("rowArrive — the bounded burst", () => {
  it("opens after the head's own reveal, never with it", () => {
    // The owner's order: the text appears with a glitch effect, THEN the cards
    // come into view. The writer also holds `in` until the head has resolved.
    expect(ROW_ARRIVE_IN).toBeGreaterThan(HEAD_REVEAL_AT);
  });

  it("is re-solved for the ONE dwell, not the detented runway", () => {
    // ADR-119 U2 opened at 0.26 of a runway that grew a step per card; the row
    // pins for one 60svh dwell, and 0.26 of that would hold the cards shut for
    // 16svh after the head had resolved. Inside the first eighth of the dwell.
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

describe("the row's window", () => {
  it("draws at most seven — a strip costs the open card its width, not the page its length", () => {
    expect(MUSINGS_ROW_MAX).toBe(7);
  });
});

/* ── The source ratchets ───────────────────────────────────────────────── */

describe("the row is mirrored by hand between the writer and the sheet, so pin it", () => {
  const ROOT = join(__dirname, "..", "..");
  const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

  const HOOK = "components/landing/home-v2/musings/useMusingsScroll.ts";
  const SHEET = "components/landing/home-v2/musings/musings.css";
  const CARD = "components/landing/home-v2/musings/MusingCard.tsx";
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

  it("the mechanic is ONE transitioned property — flex-grow — on the row rung", () => {
    // Lighthouse HQ's row measured: `flex: 0 0 <strip>` on every card and
    // `flex-grow` transitioned on the active one. Nothing is posed, nothing
    // is measured, nothing is written per frame.
    const sheet = read(SHEET);
    const rung = rules(sheet).slice(rules(sheet).indexOf(`@media ${RUNG} {`));
    const card = bodyOf(rung, ".mu[data-mu-ready] .mu-card");
    expect(card).toMatch(/flex:\s*0 0 var\(--mu-strip\)/);
    expect(card).toMatch(/transition:\s*flex-grow var\(--mu-grow\)/);
    expect(card).not.toMatch(/transition:[^;]*(width|transform)/);
    expect(bodyOf(rung, ".mu[data-mu-ready] .mu-card[data-mu-open]")).toMatch(/flex-grow:\s*1/);
    expect(bodyOf(sheet, ".mu")).toMatch(/--mu-grow:\s*900ms cubic-bezier\(0\.19, 1, 0\.22, 1\)/);
  });

  it("nothing 3D survives — no perspective, no rotation, no 3D context, no edge fade", () => {
    // ADR-119's rack, shelf and row are all retired with the form (ADR-121).
    // A `perspective` or a `rotateX` that came back would be the jukebox
    // returning under a new name; a mask on the row would be its edge fade.
    for (const src of [read(SHEET), read(CARD), read(STATION), read(HOOK)]) {
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

  it("`data-mu-open` is rendered on the NEWEST post, and every card is a real link", () => {
    // The owner's rest state: the newest is open, no timer — rendered by React
    // so SSR / no-JS / PRM show the finished row. ⚠ And no card is hidden from
    // the keyboard: ADR-119's `tabIndex={-1}` + `aria-hidden` on cards 1..n was
    // an a11y bug on every parked rung, where the rail showed them.
    // Comments stripped: the card's own header quotes the bug it fixed.
    const card = read(CARD).replace(/\/\*[\s\S]*?\*\//g, "");
    expect(card).toContain('data-mu-open={index === 0 ? "" : undefined}');
    expect(card).toContain("href={`/musings/${post.slug}`}");
    expect(card).not.toMatch(/tabIndex/);
    expect(card).not.toMatch(/aria-hidden=\{/);
    expect(card).not.toMatch(/isFront|data-mu-front|cardRef/);
  });

  it("the open width is solved from the SAME tokens the strip and the gap use", () => {
    // ⚠ The body is laid out at the width the open card WILL have, so the text
    // never reflows during the grow; the arithmetic has to be the row's own —
    // `100cqw` of the row minus (n − 1) strips and gaps — or the two drift.
    const sheet = read(SHEET);
    const rung = rules(sheet).slice(rules(sheet).indexOf(`@media ${RUNG} {`));
    const row = bodyOf(rung, ".mu[data-mu-ready] .mu__row");
    expect(row).toMatch(/container-type:\s*inline-size/);
    expect(flat(row)).toContain(
      "--mu-open-w:calc(100cqw-(var(--mu-n,1)-1)*(var(--mu-strip)+var(--mu-gap)))"
    );
    expect(row).toMatch(/gap:\s*var\(--mu-gap\)/);
    expect(bodyOf(rung, ".mu[data-mu-ready] .mu-card__body")).toMatch(
      /width:\s*var\(--mu-open-w\)/
    );
    // And the station hands the row its count.
    expect(read(STATION)).toContain('"--mu-n": posts.length');
  });

  it("the strip YIELDS so the open card keeps its measure (ADR-121 U1)", () => {
    // ⚠ At seven posts, or on the 961–1100 rung, a fixed strip would squeeze
    // the open card under its measure and the lede past the lines its body
    // reserves. So the strip is `--mu-closed` wherever the row affords it and
    // narrows — never below the body's inset pair — so the open card holds
    // `--mu-open-min`: the measure whole plus its inset. The strip depends on
    // the row and the count, never on which card is open, so it is constant
    // through the grow; the glyph yields only with it.
    const sheet = read(SHEET);
    const rung = rules(sheet).slice(rules(sheet).indexOf(`@media ${RUNG} {`));
    const row = flat(bodyOf(rung, ".mu[data-mu-ready] .mu__row"));
    expect(row).toContain(
      "--mu-strip:clamp(2*var(--mu-body-pad-x),(100cqw-var(--mu-open-min))/max(1,var(--mu-n,1)-1)-var(--mu-gap),var(--mu-closed))"
    );
    const mu = flat(bodyOf(sheet, ".mu"));
    expect(mu).toContain("--mu-measure:calc(var(--mu-copy)*34)");
    expect(mu).toContain("--mu-open-min:calc(var(--mu-measure)+2*var(--mu-body-pad-x))");
    expect(flat(bodyOf(rung, ".mu[data-mu-ready] .mu-cover__beat"))).toContain(
      "width:min(var(--mu-glyph),var(--mu-strip)-var(--mu-body-pad-x))"
    );
    // The title and the lede share one text column: the measure.
    const column = blocks(rung).find(
      ([, s]) => flat(s) === ".mu[data-mu-ready].mu-card__title,.mu[data-mu-ready].mu-card__lede"
    );
    expect(column?.[2] ?? "").toMatch(/max-width:\s*var\(--mu-measure\)/);
  });

  it("the body is a DERIVED box and the slack is the cover's (ADR-121 U1)", () => {
    // ⚠ The open card pooled 124px of bare plate under a two-line lede at
    // 1920×1247 — the station's recorded mis-seat. On the row the body is
    // exactly its rule, its padding, one kicker line, one title line and the
    // reserved lede lines, each at the line-height its OWN rule declares, and
    // the cover takes the rest. The calc and the rules read one set of tokens,
    // so they cannot drift — which is what this pins, both halves.
    const sheet = read(SHEET);
    const mu = flat(bodyOf(sheet, ".mu"));
    expect(mu).toContain(
      "--mu-body-h:calc(var(--mu-body-rule)+var(--mu-body-pad-t)+var(--mu-chrome)*var(--mu-kicker-lh)+var(--mu-body-gap)+var(--mu-card-title)*var(--mu-title-lh)+var(--mu-body-gap)+var(--mu-copy)*var(--mu-lede-lh)*var(--mu-lede-lines)+var(--mu-body-pad-b))"
    );
    const body = flat(bodyOf(sheet, ".mu-card__body"));
    expect(body).toContain("padding:var(--mu-body-pad-t)var(--mu-body-pad-x)var(--mu-body-pad-b)");
    expect(body).toContain("row-gap:var(--mu-body-gap)");
    expect(body).toContain("border-top:var(--mu-body-rule)solidvar(--mu-rule)");
    const kicker = flat(bodyOf(sheet, ".mu-card__kicker"));
    expect(kicker).toContain("font-size:var(--mu-chrome)");
    expect(kicker).toContain("line-height:var(--mu-kicker-lh)");
    const title = flat(bodyOf(sheet, ".mu-card__title"));
    expect(title).toContain("font-size:var(--mu-card-title)");
    expect(title).toContain("line-height:var(--mu-title-lh)");
    const lede = flat(bodyOf(sheet, ".mu-card__lede"));
    expect(lede).toContain("font-size:var(--mu-copy)");
    expect(lede).toContain("line-height:var(--mu-lede-lh)");

    // On the rung: the cover row takes the rest, the body row is the derived
    // box, the cover carries NO height of its own, and the clamp is a belt at
    // exactly the capacity the body reserves.
    const rung = rules(sheet).slice(rules(sheet).indexOf(`@media ${RUNG} {`));
    expect(flat(bodyOf(rung, ".mu[data-mu-ready] .mu-card__front"))).toContain(
      "grid-template-rows:minmax(0,1fr)var(--mu-body-h)"
    );
    const cover = bodyOf(rung, ".mu[data-mu-ready] .mu-cover");
    expect(cover).toMatch(/aspect-ratio:\s*auto/);
    expect(cover).not.toMatch(/(^|[\s;])height\s*:/);
    expect(flat(bodyOf(rung, ".mu[data-mu-ready] .mu-card__lede"))).toContain(
      "-webkit-line-clamp:var(--mu-lede-lines)"
    );
    expect(sheet).not.toMatch(/--mu-cover-h/);
  });

  it("the lines the body reserves hold the registry's whole summary budget at the measure", () => {
    // Three lede lines is the BUDGET, not a guess: `musings-registry` caps a
    // summary at N characters; at PP Neue Montreal's mean advance that is
    // N × 0.45em, and three lines of the 34em measure hold 102em. The advance
    // is MEASURED (the landing's capability summary: 521px for 73 characters
    // at 16px, 0.446em), and the capture reads every live lede unclamped, so
    // this is the arithmetic and the capture is the proof. Raise the budget
    // and this fails, pointing at `--mu-lede-lines`.
    const MEAN_ADVANCE_EM = 0.45;
    const registry = read("tests/lib/musings-registry.test.ts");
    const budget = Number(/summary\.length\)\.toBeLessThanOrEqual\((\d+)\)/.exec(registry)?.[1]);
    expect(budget).toBeGreaterThan(0);
    const mu = flat(bodyOf(read(SHEET), ".mu"));
    const lines = Number(/--mu-lede-lines:(\d+);/.exec(mu)?.[1]);
    const measureEm = Number(/--mu-measure:calc\(var\(--mu-copy\)\*(\d+)\)/.exec(mu)?.[1]);
    expect(lines).toBe(3);
    expect(lines * measureEm).toBeGreaterThanOrEqual(budget * MEAN_ADVANCE_EM);
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
      "--mu-band-end:max(0px,var(--mu-tele-reach)+var(--mu-body-pad-x)-var(--band-margin))"
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
    expect(sel).toContain("html[data-rail-instruments].mu[data-mu-ready].mu__row");
    expect(flat(yield_?.[2] ?? "")).toContain(
      "margin-inline-end:calc(var(--rail-inset)+var(--mu-band-end))"
    );
  });

  it("the writer moves ONE attribute on events and holds NO React state", () => {
    // ADR-002: one writer, CSS custom properties. The row has no detent, so
    // the last `setState` ADR-119 kept (the front index) is gone with it.
    const hook = read(HOOK);
    for (const ev of ["pointerover", "pointerleave", "focusin", "focusout"])
      expect(hook).toContain(`addEventListener("${ev}"`);
    expect(hook).toContain('setAttribute("data-mu-open", "")');
    expect(hook).toContain('removeAttribute("data-mu-open")');
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

  it("the sheet gates every row rule on BOTH the rung and the stamp", () => {
    // `an absent stamp means shown` is the house's polarity law: the rest
    // state is the rail, which is what a phone, a reduced-motion reader and a
    // page whose script never ran all get. A grow on the rail would be a rail
    // whose first card is three times the width of the rest.
    const sheet = rules(read(SHEET));
    const rung = sheet.slice(sheet.indexOf(`@media ${RUNG} {`));
    for (const [, sel, body] of blocks(sheet)) {
      const s = sel.trim();
      if (/flex-grow|--mu-open-w|backdrop-filter|container-type/.test(body)) {
        expect(s, `${s} is a row rule and must carry the stamp`).toContain("[data-mu-ready]");
        expect(rung, `${s} is a row rule and must sit inside the rung`).toContain(body);
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
        expect(sel.trim()).toBe(
          '#musings[data-mu-mode="stage"] .mu[data-mu-ready] .mu-card__front'
        );
        expect(body).not.toMatch(/brightness/);
      }
    }
    expect(sheet).toMatch(/@supports \(backdrop-filter: blur\(2px\)\)/);
    const theme = rules(read(THEME));
    expect(theme).toMatch(/html\[data-theme="light"\] \.mu \{[^}]*--mu-bloom-a:/);
    const light = bodyOf(
      theme,
      'html[data-theme="light"] #musings[data-mu-mode="stage"] .mu[data-mu-ready] .mu-card__front'
    );
    expect(light).toMatch(/backdrop-filter:\s*none/);
  });

  it("the state is the ring, never a filter on the strips", () => {
    // The reference dims its inactive cards with `brightness(.82)`; a
    // large-area brightness change on every hover is the class of motion
    // ADR-097 U12 retired. The open card is told by its lip and its kicker.
    const sheet = rules(read(SHEET));
    for (const [, sel, body] of blocks(sheet)) {
      if (/\.mu-card/.test(sel)) expect(body, sel).not.toMatch(/(^|[\s;])filter\s*:/);
    }
    expect(bodyOf(sheet, ".mu-card[data-mu-open] .mu-card__front::before")).toMatch(
      /background-color:\s*var\(--gold-line\)/
    );
    expect(bodyOf(sheet, ".mu-card__front::before")).toMatch(/background-color:\s*var\(--mu-lip\)/);
  });

  it("the station renders ONE flex row with the cards as its direct children", () => {
    const station = read(STATION);
    expect(station).toContain('className="mu__row"');
    expect(station).toMatch(/<MusingCard key=\{post\.slug\} post=\{post\} index=\{i\} \/>/);
    expect(station).not.toMatch(/setCard|cardsRef|front/);
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
    expect(base).toMatch(/grid-template-rows:\s*auto auto auto/);
    expect(base).not.toMatch(/1fr/);
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
    expect(bodyOf(sheet, ".mu")).toMatch(/--mu-dwell:\s*60svh/);
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
});
