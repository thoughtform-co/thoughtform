import { describe, expect, it } from "vitest";

import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { SERVICE_PLATES } from "@/components/landing/home-v2/services/servicePlateData";
import {
  BACK_BULLET_INDENT,
  BACK_COL_W,
  BACK_CONTENT_LIMIT,
  BACK_MAX_W,
  BACK_RUNGS,
  backFaceLayout,
  modelMeasure,
} from "@/lib/services-ring/backFace";
import {
  LEDE_MAX_CH,
  ledeLength,
  plateCopyStrings,
  serviceCopyStrings,
  servicesCopyViolations,
} from "@/lib/services-ring/servicesCopyLaw";

/**
 * The four services (ADR-112, owner, 2026-09-19): Keynote · Workshop ·
 * Embedded (with Advisory folded in) · Home session — and since 2026-09-26
 * (owner) EMBEDDED LEADS the ring: Embedded · Keynote · Workshop · Home session. The records were the lab's
 * `serviceRecut` module until the owner read them live on the portrait row
 * and promoted them; this test walked them THERE first and walks production
 * now — the FIT and the COPY LAW are asserted on the strings the site serves
 * (`.claude/rules/services-ring.md`: the phone back's fit is solved before
 * the string is written).
 */
describe("the four services (ADR-112)", () => {
  it("keeps the four slot ids, in the ring's order, on both records", () => {
    expect(SERVICE_PLATES.map((p) => p.id)).toEqual([
      "embedded",
      "keynote",
      "workshop",
      "guided-build",
    ]);
    expect(SERVICES.map((s) => s.id)).toEqual(SERVICE_PLATES.map((p) => p.id));
  });

  it("names the merged offer EMBEDDED and carries the title ADR-124 U1 ruled", () => {
    const e = SERVICE_PLATES[0];
    expect(e.id).toBe("embedded");
    expect(e.chip).toBe("Embedded");
    expect(e.title).toBe("A setup your team runs itself.");
    // The leadership altitude entered, once on the plate (the bullet and the
    // includes name it; nothing else may).
    expect(plateCopyStrings(e).filter((s) => /leadership/i.test(s))).toHaveLength(2);
    expect(SERVICES[0].name).toBe("Embedded");
    expect(serviceCopyStrings(SERVICES[0]).some((s) => /leadership/i.test(s))).toBe(true);
  });

  it("puts the home session on the guided-build slot, on the table photograph, with no digit", () => {
    const h = SERVICE_PLATES[3];
    expect(h.id).toBe("guided-build");
    expect(h.chip).toBe("Home session");
    // The slot's own asset — the one shot at a table — with an alt that says
    // what the picture shows, not what the old service was.
    expect(h.photo?.jpg).toBe("/images/services/strategic.jpg");
    expect(h.photo?.alt).not.toMatch(/advisory/i);
    // Ops prices this one per seat; a card may not. No digit anywhere on its
    // COPY — the feed label's ordinal is the slot's (mobile chrome), not an
    // amount, and is the one string let through.
    for (const s of plateCopyStrings(h)) {
      if (s === h.feedLabel) continue;
      expect(s, `digit on the home session: ${s}`).not.toMatch(/\d/);
    }
    for (const s of serviceCopyStrings(SERVICES[3])) expect(s).not.toMatch(/\d/);
    expect(SERVICES[3].id).toBe("guided-build");
    expect(SERVICES[3].name).toBe("Home session");
    expect(SERVICES[3].verb).toBe("HOME SESSION");
    /* ADR-114: the seat is reserved on its own page, not at the landing's
       contact foot. Both records, because the ring and the phone read
       different ones and a CTA that lands two places is a defect. */
    expect(SERVICES[3].ctaHref).toBe("/home-sessions");
    expect(h.ctaHref).toBe("/home-sessions");
  });

  it("carries no trace of the folded service", () => {
    for (const p of SERVICE_PLATES) {
      for (const s of plateCopyStrings(p)) expect(s).not.toMatch(/advisory/i);
    }
    for (const svc of SERVICES) {
      for (const s of serviceCopyStrings(svc)) expect(s).not.toMatch(/advisory/i);
    }
  });

  it("solves every record's back to fit above the CTA, every line inside its measure", () => {
    for (const plate of SERVICE_PLATES) {
      const L = backFaceLayout(plate, modelMeasure);
      expect(L.contentBottom, `${plate.id} runs into the CTA`).toBeLessThanOrEqual(
        BACK_CONTENT_LIMIT
      );
      expect(L.titleLines.length, `${plate.id} title wraps past two lines`).toBeLessThanOrEqual(2);
      for (const line of L.titleLines) {
        expect(modelMeasure(line, BACK_RUNGS.title, "sans", -0.02)).toBeLessThanOrEqual(BACK_MAX_W);
      }
      for (const bullet of L.bullets) {
        expect(bullet.lines.length).toBeGreaterThan(0);
        for (const line of bullet.lines) {
          expect(modelMeasure(line, BACK_RUNGS.bullet, "sans", 0)).toBeLessThanOrEqual(
            BACK_MAX_W - BACK_BULLET_INDENT
          );
        }
      }
      expect(L.cells).toHaveLength(5);
      for (const cell of L.cells) {
        const measure = (cell.wide ? BACK_MAX_W : BACK_COL_W) - 24;
        for (const line of cell.lines) {
          expect(modelMeasure(line, BACK_RUNGS.dd, "sans", 0)).toBeLessThanOrEqual(measure);
        }
      }
      expect(L.ctaBaseline).toBeGreaterThan(L.contentBottom);
    }
  });

  it("keeps every lede under the title band's ceiling", () => {
    for (const plate of SERVICE_PLATES) {
      expect(ledeLength(plate), `${plate.id} lede`).toBeLessThanOrEqual(LEDE_MAX_CH);
    }
  });

  it("obeys the services copy law on every record", () => {
    const violations = [
      ...SERVICE_PLATES.flatMap((p) =>
        servicesCopyViolations(`plate/${p.id}`, plateCopyStrings(p))
      ),
      ...SERVICES.flatMap((s) => servicesCopyViolations(`service/${s.id}`, serviceCopyStrings(s))),
    ];
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
