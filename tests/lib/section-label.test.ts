import { describe, expect, it } from "vitest";

import { MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";
import {
  ARC_SECTION_ID,
  ARC_SECTION_LABEL,
  READOUT_SECTIONS,
  readoutDetail,
  sectionReadout,
} from "@/lib/rail-manifest/sectionLabel";

/**
 * The nav-corner readout (ADR-055). These pin the two properties the
 * corner depends on: the corridor collapses to ONE row, and the label is
 * never empty (it doubles as the nav trigger's visible name).
 */
describe("section readout", () => {
  const idxOf = (id: string) => MANIFEST_ENTRIES.findIndex((e) => e.id === id);

  it("collapses hero + every corridor beat onto one Arc row", () => {
    for (const id of ["hero", "thesis", "navigate", "encode", "build"]) {
      const readout = sectionReadout(idxOf(id));
      expect(readout.id, id).toBe(ARC_SECTION_ID);
      expect(readout.label, id).toBe(ARC_SECTION_LABEL);
      expect(readout.num, id).toBe("01");
    }
  });

  it("is stable across the hero→corridor seam, so no decode can fire there", () => {
    // resolveActiveIdx walks hero → thesis → navigate at that seam;
    // queueScramble no-ops when the incoming text equals the current, so
    // one shared label is what makes the seam flicker-proof.
    const labels = ["hero", "thesis", "navigate"].map((id) => sectionReadout(idxOf(id)).label);
    expect(new Set(labels).size).toBe(1);
  });

  it("names each station in the chrome register (uppercase)", () => {
    expect(sectionReadout(idxOf("services"))).toMatchObject({ id: "services", label: "SERVICES" });
    expect(sectionReadout(idxOf("about"))).toMatchObject({ id: "about", label: "ABOUT" });
    expect(sectionReadout(idxOf("practice"))).toMatchObject({ id: "practice", label: "PRACTICE" });
    expect(sectionReadout(idxOf("contact"))).toMatchObject({ id: "contact", label: "CONTACT" });
  });

  it("numbers rows 1..N over the collapsed sequence", () => {
    expect(READOUT_SECTIONS.map((r) => r.id)).toEqual([
      "arc",
      "proof",
      "services",
      "about",
      "practice",
      "contact",
    ]);
    const last = sectionReadout(idxOf("contact"));
    expect(last.num).toBe("06");
    expect(last.total).toBe("06");
    for (const [i, row] of READOUT_SECTIONS.entries()) {
      // `proof` is the one row with no manifest entry (ADR-056): the casefile
      // shares `#services`' DOM section and rail detent, so it is addressed
      // by the services index plus the `proofOwns` flag instead.
      const seat = row.id === ARC_SECTION_ID ? idxOf("navigate") : idxOf(row.id);
      const readout =
        row.id === "proof" ? sectionReadout(idxOf("services"), true) : sectionReadout(seat);
      expect(readout.num, row.id).toBe(String(i + 1).padStart(2, "0"));
    }
  });

  it("splits the services index into the casefile beat and the offer (ADR-056)", () => {
    const servicesIdx = idxOf("services");
    // The flag is what the corner reads while the casefile holds the stage.
    expect(sectionReadout(servicesIdx, true)).toMatchObject({ id: "proof", label: "PROOF" });
    // …and the resting truth — no flag, or an unwritten one — is the offer.
    // This is the fail-safe every other caller relies on.
    expect(sectionReadout(servicesIdx, false)).toMatchObject({
      id: "services",
      label: "SERVICES",
    });
    expect(sectionReadout(servicesIdx)).toMatchObject({ id: "services" });
    // The proof row seats immediately BEFORE the offer it introduces.
    expect(Number(sectionReadout(servicesIdx, true).num)).toBe(
      Number(sectionReadout(servicesIdx).num) - 1
    );
    // The flag only ever means anything on services — it must never rewrite
    // another section's label.
    for (const id of ["about", "practice", "contact"]) {
      expect(sectionReadout(idxOf(id), true).id, id).toBe(id);
    }
  });

  it("gives the detail slot the subsection, or the position when there is none", () => {
    const arc = sectionReadout(idxOf("navigate"));
    expect(readoutDetail(arc, "navigate")).toBe("navigate //");
    expect(readoutDetail(arc, null)).toBe("01/06");

    const about = sectionReadout(idxOf("about"));
    expect(readoutDetail(about, null)).toBe("04/06");
    expect(readoutDetail(about)).toBe("04/06");

    // One slot for both forms is what keeps the swap a plain decode, so
    // the two must never render as an empty string.
    for (const sub of [null, "navigate", "workshop"]) {
      expect(readoutDetail(sectionReadout(idxOf("services")), sub).length).toBeGreaterThan(0);
    }
  });

  it("never yields an empty label — the corner is also the nav trigger", () => {
    for (const idx of [-1, 0, MANIFEST_ENTRIES.length, 999, Number.NaN]) {
      const readout = sectionReadout(idx);
      expect(readout.label.length, String(idx)).toBeGreaterThan(0);
      expect(readout.num, String(idx)).toMatch(/^\d{2}$/);
    }
  });
});
