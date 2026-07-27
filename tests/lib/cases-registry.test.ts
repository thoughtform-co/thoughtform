import { describe, expect, it } from "vitest";

import { PROOF_SUBS } from "@/components/landing/home-v2/CorridorSectionMenu";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { CASES, PROOF_CASE, caseBeatMenu, caseSlugs, getCase } from "@/lib/cases/registry";

/**
 * Case registry integrity (ADR-054) — the contracts the `#proof` station
 * generator and the corridor section menu rely on:
 *
 *   · unique kebab slugs (future /cases/[slug] static params);
 *   · exactly three beats in Arc order, with unique anchorable ids;
 *   · tool references resolve against PROJECT_CASES, which stays the
 *     single canonical source for the four tools' copy;
 *   · repo-rooted asset paths;
 *   · the site-wide no-italics rule;
 *   · the confidentiality envelope — no money, no board links, no repo
 *     links, first-name-only attribution. This is a MECHANICAL guard on
 *     an editorial rule: the failure it prevents is publishing a client's
 *     spend on a public marketing page.
 */
describe("cases registry (ADR-054)", () => {
  it("slugs are unique and kebab-case", () => {
    const slugs = caseSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("getCase resolves every slug and rejects unknowns", () => {
    for (const slug of caseSlugs()) {
      expect(getCase(slug)?.slug).toBe(slug);
    }
    expect(getCase("nope")).toBeUndefined();
  });

  it("every case is exactly three beats in Arc order", () => {
    for (const c of CASES) {
      expect(c.beats).toHaveLength(3);
      expect(c.beats.map((b) => b.phase)).toEqual(["navigate", "encode", "build"]);
    }
  });

  it("beat ids are unique, kebab-case and anchorable", () => {
    for (const c of CASES) {
      const ids = c.beats.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("the menu mirror numbers the beats 01..03 and names them by phase", () => {
    for (const c of CASES) {
      expect(caseBeatMenu(c)).toEqual([
        { id: c.beats[0].id, num: "01", name: "NAVIGATE" },
        { id: c.beats[1].id, num: "02", name: "ENCODE" },
        { id: c.beats[2].id, num: "03", name: "BUILD" },
      ]);
    }
  });

  it("the corridor menu's PROOF subs are in lockstep with the case's beats", () => {
    // CorridorSectionMenu hardcodes these three rows rather than
    // importing the registry — it is a client component, and the import
    // would ship every case's copy in the landing bundle for three
    // labels. This is the guard that keeps the duplicate honest.
    expect(PROOF_SUBS).toEqual(caseBeatMenu(PROOF_CASE));
  });

  it("the mission report reads as a summary (3..5 stats, meta rows present)", () => {
    for (const c of CASES) {
      expect(c.report.stats.length).toBeGreaterThanOrEqual(3);
      expect(c.report.stats.length).toBeLessThanOrEqual(5);
      expect(c.report.meta.length).toBeGreaterThan(0);
    }
  });

  it("tool-strip ids resolve against PROJECT_CASES (single canonical tool copy)", () => {
    const known = new Set(PROJECT_CASES.map((p) => p.id));
    for (const c of CASES) {
      for (const beat of c.beats) {
        if (beat.visual.kind !== "tool-strip") continue;
        expect(beat.visual.toolIds.length).toBeGreaterThan(0);
        for (const id of beat.visual.toolIds) expect(known.has(id as never)).toBe(true);
      }
    }
  });

  it("asset paths are repo-rooted (/project-cards, /arcs, /images or /videos)", () => {
    const ok = (src: string) =>
      src.startsWith("/project-cards/") ||
      src.startsWith("/arcs/") ||
      src.startsWith("/images/") ||
      src.startsWith("/videos/");
    for (const c of CASES) {
      for (const beat of c.beats) {
        if (beat.visual.kind === "image") expect(ok(beat.visual.image.src)).toBe(true);
        if (beat.visual.kind === "video") {
          expect(ok(beat.visual.src)).toBe(true);
          expect(ok(beat.visual.poster)).toBe(true);
        }
      }
    }
  });

  it("quote attributions are first-name only", () => {
    for (const c of CASES) {
      for (const beat of c.beats) {
        if (!beat.quote) continue;
        // "Firstname · Team" — a space-separated surname would fail.
        expect(beat.quote.attribution).toMatch(/^[A-Z][a-z]+(\s·\s.+)?$/);
      }
    }
  });

  it("no italic markup smuggled into copy strings", () => {
    const offenders: string[] = [];
    scanStrings(CASES, "cases", (value, path) => {
      if (/<\s*(i|em)[\s>]/i.test(value)) offenders.push(path);
    });
    expect(offenders).toEqual([]);
  });

  it("holds the confidentiality envelope (no money, boards, or repo links)", () => {
    // Currency symbols, amounts with a thousands separator, the adoption
    // board, and the private Skills/tool repos. Any of these reaching a
    // public page is a client-confidentiality incident, not a typo.
    const banned: readonly [RegExp, string][] = [
      [/[€$£]/, "currency symbol"],
      [/\b\d{1,3}(,\d{3})+\b/, "amount with thousands separator"],
      [/\bUSD\b|\bEUR\b/i, "currency code"],
      [/monday\.com/i, "board link"],
      [/github\.com/i, "repo link"],
      [/loop-skills|tensalir|\baether\b/i, "private repo name"],
    ];
    const offenders: string[] = [];
    scanStrings(CASES, "cases", (value, path) => {
      for (const [pattern, what] of banned) {
        if (pattern.test(value)) offenders.push(`${path}: ${what}`);
      }
    });
    expect(offenders).toEqual([]);
  });
});

/** Walk every string in a value, reporting its dotted path. */
function scanStrings(
  value: unknown,
  path: string,
  visit: (value: string, path: string) => void
): void {
  if (typeof value === "string") {
    visit(value, path);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scanStrings(v, `${path}[${i}]`, visit));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) scanStrings(v, `${path}.${k}`, visit);
  }
}
