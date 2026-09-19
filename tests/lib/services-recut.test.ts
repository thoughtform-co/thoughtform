import { describe, expect, it } from "vitest";

import {
  RECUT_PLATES,
  RECUT_SERVICES,
} from "@/app/(internal)/test/services-card-face-lab/serviceRecut";
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
 * The re-cut four (owner, 2026-09-19): Keynote · Workshop · Embedded (with
 * Advisory folded in) · Home session. The records are lab-only until the owner
 * has read them; the FIT and the COPY LAW are asserted before that read, not
 * after (`.claude/rules/services-ring.md`: the phone back's fit is solved
 * before the string is written).
 */
describe("the re-cut services (lab record)", () => {
  it("keeps the four slot ids, in the ring's order", () => {
    expect(RECUT_PLATES.map((p) => p.id)).toEqual(SERVICE_PLATES.map((p) => p.id));
    expect(RECUT_SERVICES.map((s) => s.id)).toEqual(SERVICES.map((s) => s.id));
    RECUT_SERVICES.forEach((s, i) => expect(s.id).toBe(RECUT_PLATES[i].id));
  });

  it("carries Keynote and Workshop verbatim from production", () => {
    expect(RECUT_PLATES[0]).toBe(SERVICE_PLATES[0]);
    expect(RECUT_PLATES[1]).toBe(SERVICE_PLATES[1]);
    expect(RECUT_SERVICES[0]).toBe(SERVICES[0]);
    expect(RECUT_SERVICES[1]).toBe(SERVICES[1]);
  });

  it("names the merged offer EMBEDDED and keeps ADR-111's title", () => {
    const e = RECUT_PLATES[2];
    expect(e.id).toBe("embedded");
    expect(e.chip).toBe("Embedded");
    expect(e.title).toBe(SERVICE_PLATES[2].title);
    expect(e.lede).toEqual(SERVICE_PLATES[2].lede);
    // The leadership altitude entered, once.
    expect(plateCopyStrings(e).filter((s) => /leadership/i.test(s))).toHaveLength(2);
    expect(RECUT_SERVICES[2].name).toBe("Embedded");
  });

  it("puts the home session on the guided-build slot, with no photograph and no digit", () => {
    const h = RECUT_PLATES[3];
    expect(h.id).toBe("guided-build");
    expect(h.chip).toBe("Home session");
    expect(h.photo).toBeUndefined();
    // Ops prices this one per seat; a card may not. No digit anywhere on its
    // COPY — the feed label's `04` is the slot's ordinal (mobile chrome), not
    // an amount, and is the one string let through.
    for (const s of plateCopyStrings(h)) {
      if (s === h.feedLabel) continue;
      expect(s, `digit on the home session: ${s}`).not.toMatch(/\d/);
    }
    for (const s of serviceCopyStrings(RECUT_SERVICES[3])) expect(s).not.toMatch(/\d/);
    expect(RECUT_SERVICES[3].id).toBe("guided-build");
    expect(RECUT_SERVICES[3].name).toBe("Home session");
  });

  it("solves every record's back to fit above the CTA, every line inside its measure", () => {
    for (const plate of RECUT_PLATES) {
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
    for (const plate of RECUT_PLATES) {
      expect(ledeLength(plate), `${plate.id} lede`).toBeLessThanOrEqual(LEDE_MAX_CH);
    }
  });

  it("obeys the services copy law — on the re-cut AND on production", () => {
    const violations = [
      ...RECUT_PLATES.flatMap((p) => servicesCopyViolations(`recut/${p.id}`, plateCopyStrings(p))),
      ...RECUT_SERVICES.flatMap((s) =>
        servicesCopyViolations(`recut/${s.id}`, serviceCopyStrings(s))
      ),
      ...SERVICE_PLATES.flatMap((p) => servicesCopyViolations(`prod/${p.id}`, plateCopyStrings(p))),
      ...SERVICES.flatMap((s) => servicesCopyViolations(`prod/${s.id}`, serviceCopyStrings(s))),
    ];
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
