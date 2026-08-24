import { describe, expect, it } from "vitest";

import {
  VOIDWALKER_BEATS,
  VOIDWALKER_HEAD,
  vwPlain,
  type VoidwalkerBeat,
} from "@/lib/voidwalker/voidwalkerData";
import { VW_WIRE_IDS, VW_WIRE_LABELS } from "@/lib/voidwalker/voidwalkerWireLabels";

/**
 * The VOIDWALKER record (ADR-074): the nine beats that led up to
 * Thoughtform, on the public landing. The facts are at LOCK — the crowd
 * figures, the petition, the upvotes, the press — and the budgets are
 * MEASURED against the section's columns (the `lib/cases` discipline).
 *
 * ⚠ "100,000" is a sourced figure on this surface, so the thousands-
 * separator ban the cases registry carries is deliberately NOT applied
 * here; the CURRENCY ban is, and so is a rounding ban (no "1,000", no
 * "16k", no "100,000+").
 */

const BUDGET = {
  storyTitle: 28,
  waypointTitle: 32,
  storyBody: 300,
  waypointBody: 170,
  lede: 130,
  foot: 120,
  artefact: 24,
  headline: 110,
} as const;

/** The names the surface may print beside a beat. */
const OUTLETS = new Set([
  "Gazet van Antwerpen",
  "De Standaard",
  "Newsweek",
  "CNN",
  "MIT Technology Review",
  "De Tijd",
  "HLN",
]);

/** The map's and the casefile's public-surface rule, carried over: the
 *  model vendor is a capability lane, never a name. */
const MODEL_FAMILIES = /\b(opus|sonnet|haiku|fable|gpt|gemini|llama|mistral|claude)\b/i;

const textOf = (b: VoidwalkerBeat) =>
  [vwPlain(b.title), vwPlain(b.body), b.artefact ?? "", b.press?.headline ?? ""].join(" ");

const everything = [
  VOIDWALKER_HEAD.title,
  vwPlain(VOIDWALKER_HEAD.lede),
  vwPlain(VOIDWALKER_HEAD.foot),
  VOIDWALKER_HEAD.next.label,
  ...VOIDWALKER_BEATS.map(textOf),
].join("\n");

const byId = (id: string) => {
  const b = VOIDWALKER_BEATS.find((x) => x.id === id);
  if (!b) throw new Error(`no beat "${id}"`);
  return b;
};

describe("voidwalker record — shape", () => {
  it("runs REVERSE-chronological: nine beats, one film, newest first", () => {
    // Nine beats plus the interlude.
    expect(VOIDWALKER_BEATS).toHaveLength(10);
    const ids = VOIDWALKER_BEATS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    // ⚠ NON-INCREASING, not non-decreasing (U2). The rail is read downward
    // and the reader starts at the current seat.
    for (let i = 1; i < VOIDWALKER_BEATS.length; i++) {
      expect(VOIDWALKER_BEATS[i]!.sortYear).toBeLessThanOrEqual(VOIDWALKER_BEATS[i - 1]!.sortYear);
    }
    const kinds = VOIDWALKER_BEATS.map((b) => b.kind);
    expect(kinds.filter((k) => k === "story")).toHaveLength(6);
    expect(kinds.filter((k) => k === "interlude")).toHaveLength(1);
    // The current seat and the practice open it; the origin closes it.
    expect(kinds[0]).toBe("waypoint");
    expect(kinds[1]).toBe("waypoint");
    expect(kinds[9]).toBe("waypoint");
    // It opens on the seat the owner asked to lead with.
    expect(VOIDWALKER_BEATS[0]!.id).toBe("loop");
    expect(vwPlain(VOIDWALKER_BEATS[0]!.title)).toBe("Intelligence Architect");
  });

  it("seats the film directly under the beat it belongs to", () => {
    const at = VOIDWALKER_BEATS.findIndex((b) => b.kind === "interlude");
    expect(VOIDWALKER_BEATS[at - 1]!.id, "the film follows the Expanse beat").toBe("expanse");
    const film = VOIDWALKER_BEATS[at]!.film!;
    expect(film).toBeTruthy();
    // The id is what `youtube-nocookie.com/embed/{id}` is built from — a
    // full URL here would silently produce a broken player.
    expect(film.youtubeId).toMatch(/^[\w-]{11}$/);
    expect(film.duration).toMatch(/^\d{1,2}:\d{2}$/);
    expect(film.title.length).toBeLessThanOrEqual(60);
    // First-party: the channel is this section's own name, which is why the
    // plate letters it rather than implying a neutral source.
    expect(film.channel).toBe("Voidwalker");
    // An interlude is not a beat in the run: no plate, no press, no chip.
    expect(VOIDWALKER_BEATS[at]!.wire).toBeUndefined();
    expect(VOIDWALKER_BEATS[at]!.press).toBeUndefined();
    expect(VOIDWALKER_BEATS[at]!.artefact).toBeUndefined();
    // ...and nothing else carries a film.
    expect(VOIDWALKER_BEATS.filter((b) => b.film)).toHaveLength(1);
  });

  it("letters the year with an en dash, never a hyphen", () => {
    for (const b of VOIDWALKER_BEATS) {
      // `2016` | `2014–17` | `07/2016` — the MM/YYYY form is accepted now so
      // supplying the four missing months is a data edit and nothing else.
      expect(b.year, b.id).toMatch(/^(\d{2}\/)?\d{4}(–\d{2})?$/);
    }
  });

  it("every story carries a plate (artefact · press · wire); waypoints carry none", () => {
    for (const b of VOIDWALKER_BEATS) {
      if (b.kind === "interlude") continue;
      if (b.kind === "story") {
        expect(b.artefact, `${b.id} artefact`).toBeTruthy();
        expect(b.press, `${b.id} press`).toBeTruthy();
        expect(b.wire, `${b.id} wire`).toBeTruthy();
        expect(VW_WIRE_IDS, `${b.id} wire "${b.wire}" is in the registry`).toContain(b.wire);
      } else {
        expect(b.artefact, `${b.id} has no artefact`).toBeUndefined();
        expect(b.wire, `${b.id} has no wire`).toBeUndefined();
      }
    }
    // Every drawing is used exactly once.
    const used = VOIDWALKER_BEATS.flatMap((b) => (b.wire ? [b.wire] : []));
    expect([...used].sort()).toEqual([...VW_WIRE_IDS].sort());
  });
});

describe("voidwalker record — budgets (measured)", () => {
  it("titles fit the 5fr title column", () => {
    for (const b of VOIDWALKER_BEATS) {
      // The interlude letters the film's title on its bar, not a beat
      // title in the column — its budget is pinned with the film above.
      if (b.kind === "interlude") continue;
      const cap = b.kind === "story" ? BUDGET.storyTitle : BUDGET.waypointTitle;
      expect(vwPlain(b.title).length, `${b.id} title`).toBeLessThanOrEqual(cap);
    }
  });

  it("bodies fit the 7fr body column", () => {
    for (const b of VOIDWALKER_BEATS) {
      if (b.kind === "interlude") continue;
      const cap = b.kind === "story" ? BUDGET.storyBody : BUDGET.waypointBody;
      expect(vwPlain(b.body).length, `${b.id} body`).toBeLessThanOrEqual(cap);
    }
  });

  it("masthead, foot, artefact and headline budgets", () => {
    expect(vwPlain(VOIDWALKER_HEAD.lede).length).toBeLessThanOrEqual(BUDGET.lede);
    expect(vwPlain(VOIDWALKER_HEAD.foot).length).toBeLessThanOrEqual(BUDGET.foot);
    for (const b of VOIDWALKER_BEATS) {
      if (b.artefact)
        expect(b.artefact.length, `${b.id} artefact`).toBeLessThanOrEqual(BUDGET.artefact);
      if (b.press) {
        expect(b.press.headline.length, `${b.id} headline`).toBeLessThanOrEqual(BUDGET.headline);
      }
    }
  });
});

describe("voidwalker record — envelope", () => {
  it("smuggles no markup or emphasis into strings", () => {
    expect(everything).not.toMatch(/<[a-z]/i);
    expect(everything).not.toMatch(/[*_]{1,2}\w/);
  });

  it("carries no currency", () => {
    expect(everything).not.toMatch(/[$€£¥]/);
  });

  it("names no model family", () => {
    expect(everything).not.toMatch(MODEL_FAMILIES);
  });

  it("press outlets are the sourced set, and hrefs are public https", () => {
    for (const b of VOIDWALKER_BEATS) {
      if (!b.press) continue;
      expect(OUTLETS.has(b.press.outlet), `${b.id} outlet "${b.press.outlet}"`).toBe(true);
      if (b.press.href) expect(b.press.href, `${b.id} href`).toMatch(/^https:\/\//);
      if (b.press.date) expect(b.press.date, `${b.id} date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("says 'Voidwalker' in the title and nowhere in the prose (owner, ADR-074)", () => {
    expect(VOIDWALKER_HEAD.title).toBe("VOIDWALKER");
    const prose = [
      vwPlain(VOIDWALKER_HEAD.lede),
      vwPlain(VOIDWALKER_HEAD.foot),
      ...VOIDWALKER_BEATS.map(textOf),
    ].join("\n");
    expect(prose).not.toMatch(/voidwalker/i);
  });
});

describe("voidwalker record — facts at LOCK", () => {
  it("pins the sourced figures as written", () => {
    const hunt = vwPlain(byId("pokemon-go").body);
    expect(hunt).toMatch(/about a thousand/);
    expect(hunt).toMatch(/sixteen thousand/);
    const expanse = vwPlain(byId("expanse").body);
    expect(expanse).toMatch(/100,000 signatures/);
    expect(expanse).toMatch(/three more seasons/);
    const coins = vwPlain(byId("coins").body);
    expect(coins).toMatch(/100,000 upvotes/);
    expect(coins).toMatch(/over a million/);
  });

  it("never rounds a sourced figure into a new claim", () => {
    // "a thousand" / "sixteen thousand" are the CV's words; "1,000", "16k"
    // and "100,000+" would be the site's own arithmetic.
    expect(everything).not.toMatch(/\b1[,.]?000\b|\b16[,.]?000\b|\b\d+k\b|\b100[,.]?000\+/i);
  });

  it("the terminus hands to a section that exists in production", () => {
    // `#practice` is an empty breather (its body is stripped at parse time),
    // so the foot may not point there.
    expect(VOIDWALKER_HEAD.next.href).toBe("#contact");
  });
});

describe("voidwalker drawings — what they letter", () => {
  it("each label set is ≤8, ≥3, unique, digit-free and currency-free", () => {
    for (const id of VW_WIRE_IDS) {
      const labels = VW_WIRE_LABELS[id];
      expect(labels.length, `${id} count`).toBeLessThanOrEqual(8);
      expect(labels.length, `${id} count`).toBeGreaterThanOrEqual(3);
      expect(new Set(labels).size, `${id} unique`).toBe(labels.length);
      for (const l of labels) {
        expect(l, `${id} "${l}" carries a figure`).not.toMatch(/\d/);
        expect(l, `${id} "${l}" carries currency`).not.toMatch(/[$€£¥]/);
        expect(l.trim().length, `${id} "${l}" empty`).toBeGreaterThan(0);
      }
    }
  });
});
