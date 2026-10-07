/**
 * ADR-149 — the lattice lab's specimen copy is a COPY of public records, and a
 * copy is how one surface silently goes stale.
 *
 * `lib/lattice/specimen-copy.ts` carries literal strings because it is read
 * by client components (a client chunk is public, and the registries may not
 * ride on it). This test imports BOTH sides and pins every copied string
 * `toBe` the record's, so the record can be edited and the lab fails rather
 * than drifting. It also holds the two copy laws the jury's Content category
 * depends on: no lorem, and no digit in a title.
 */

import { describe, expect, it } from "vitest";

import { SERVICES, SERVICES_MASTHEAD } from "../../components/landing/home-v2/services/serviceData";
import { PROOF_CASE } from "../../lib/cases/registry";
import { SPECIMEN } from "../../lib/lattice/specimen-copy";
import { SESSIONS, sessionsSorted } from "../../lib/sessions/registry";

const service = (id: string) => {
  const s = SERVICES.find((x) => x.id === id);
  if (!s) throw new Error(`no service ${id}`);
  return s;
};
const track = (id: string) => {
  const t = PROOF_CASE.casefile.tracks.find((x) => x.id === id);
  if (!t) throw new Error(`no track ${id}`);
  return t;
};
const blocksOf = (id: string) => {
  const b = track(id).blocks;
  if (!b) throw new Error(`track ${id} has no blocks`);
  return b;
};
const segmentsText = (segs: readonly (string | { em: string })[]) =>
  segs.map((s) => (typeof s === "string" ? s : s.em)).join("");

describe("the masthead is the services masthead's", () => {
  it("kicker, the two title lines and the intro", () => {
    expect(SPECIMEN.masthead.kicker).toBe(service("embedded").kicker);
    expect([...SPECIMEN.masthead.titleLines]).toEqual(
      SERVICES_MASTHEAD.titleLines.map((l) => l.text)
    );
    expect(SPECIMEN.masthead.lede).toBe(SERVICES_MASTHEAD.intro);
  });
});

describe("the cells are the Loop casefile's own claims", () => {
  it("four from the Software for Few register, two from the studio's", () => {
    const tooling = blocksOf("tooling");
    const studio = blocksOf("studio");
    const expected = [
      tooling[0],
      tooling[1],
      tooling[2],
      tooling[3],
      studio[2], // cadence — "Two to three times faster"
      studio[3], // holdfast — "The studio owns the work"
    ];
    expect(SPECIMEN.cells.length).toBe(6);
    SPECIMEN.cells.forEach((c, i) => {
      expect(c.title).toBe(expected[i].title);
      expect(c.line).toBe(expected[i].desc);
    });
  });
});

describe("the split is the keynote, the workshop and the embedded card", () => {
  it("the two text columns", () => {
    const [k, w] = SPECIMEN.split.columns;
    const keynote = service("keynote");
    const workshop = service("workshop");
    expect(k.name).toBe(keynote.name);
    expect(k.title).toBe(keynote.tagline);
    expect(k.copy).toBe(keynote.body);
    expect(k.cta).toBe(keynote.ctaLabel);
    expect(w.name).toBe(workshop.name);
    expect(w.title).toBe(workshop.tagline);
    expect(w.copy).toBe(workshop.body);
    expect(w.cta).toBe(workshop.ctaLabel);
  });
  it("the frame beside them, with its three meta rows", () => {
    const e = service("embedded");
    expect(SPECIMEN.split.frame.name).toBe(e.name);
    expect(SPECIMEN.split.frame.title).toBe(e.tagline);
    expect(SPECIMEN.split.frame.copy).toBe(e.body);
    expect(SPECIMEN.split.frame.cta).toBe(e.ctaLabel);
    SPECIMEN.split.frame.rows.forEach((r, i) => {
      expect(r.key).toBe(e.meta[i].label);
      expect(r.value).toBe(e.meta[i].value);
    });
  });
});

describe("the instrument is the home session and its mornings", () => {
  it("the card's name, tagline, body and CTA", () => {
    const h = service("guided-build");
    expect(SPECIMEN.instrument.title).toBe(h.name);
    expect(SPECIMEN.instrument.sub).toBe(h.tagline);
    expect(SPECIMEN.instrument.lede).toBe(h.body);
    expect(SPECIMEN.instrument.cta).toBe(h.ctaLabel);
    expect(SPECIMEN.instrument.href).toBe(h.ctaHref);
  });
  it("the mornings, in calendar order, and the seats", () => {
    expect([...SPECIMEN.instrument.stops]).toEqual(sessionsSorted().map((s) => s.title));
    expect(SPECIMEN.instrument.seats).toBe(SESSIONS[0].seats);
  });
});

describe("the ledger is the services' meta rows, tagged by their verb", () => {
  it("every row traces to one service's row", () => {
    const byVerb = new Map(SERVICES.map((s) => [s.verb, s]));
    expect(SPECIMEN.ledger.length).toBe(6);
    for (const row of SPECIMEN.ledger) {
      const s = byVerb.get(row.tag);
      expect(s, `no service with verb ${row.tag}`).toBeDefined();
      const hit = s!.meta.find((m) => m.label === row.key);
      expect(hit, `${row.tag} has no ${row.key} row`).toBeDefined();
      expect(row.value).toBe(hit!.value);
    }
  });
});

describe("the head-field and the frames' sentence are the Intelligence Map row's", () => {
  it("the project, the arc title and the card lede", () => {
    const t = track("ai-transformation");
    expect(SPECIMEN.headField.kicker).toBe(t.project);
    expect(SPECIMEN.headField.title).toBe(t.arc?.title);
    expect(SPECIMEN.headField.copy).toBe(t.card?.lede);
    expect(SPECIMEN.frames.kicker).toBe(t.project);
  });
  it("the casefile brief, joined, and its state", () => {
    expect(SPECIMEN.frames.body).toBe(segmentsText(PROOF_CASE.casefile.brief));
    expect(SPECIMEN.frames.foot).toBe(PROOF_CASE.casefile.state);
  });
});

describe("the copy laws", () => {
  const titles = [
    ...SPECIMEN.masthead.titleLines,
    ...SPECIMEN.cells.map((c) => c.title),
    SPECIMEN.split.title,
    ...SPECIMEN.split.columns.map((c) => c.title),
    SPECIMEN.split.frame.title,
    SPECIMEN.instrument.title,
    SPECIMEN.instrument.sub,
    SPECIMEN.headField.title,
  ];
  it("no digit in a title", () => {
    for (const t of titles) expect(t, t).not.toMatch(/\d/);
  });
  it("no lorem anywhere", () => {
    expect(JSON.stringify(SPECIMEN)).not.toMatch(/lorem|ipsum|dolor sit/i);
  });
  it("no currency anywhere (the envelope)", () => {
    expect(JSON.stringify(SPECIMEN)).not.toMatch(/[€$£]|\b(EUR|USD|GBP)\b/);
  });
});
