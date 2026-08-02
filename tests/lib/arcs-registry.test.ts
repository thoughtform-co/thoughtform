import { describe, expect, it } from "vitest";

import { ARCS, arcSlugs, getArc } from "@/lib/arcs/registry";

/**
 * Arc registry integrity (ADR-052) — the contracts the /arcs routes and
 * ArcMenu rely on: unique kebab slugs, unique section ids (anchor
 * targets), a close section as the page foot, repo-rooted asset paths,
 * and the site-wide no-italics rule (emphasis travels as ArcTitle.em,
 * never as markup smuggled into copy strings).
 */

/** Walk every string in an arc, reporting a dotted path for each. */
function scanArc(value: unknown, path: string, visit: (value: string, path: string) => void) {
  if (typeof value === "string") visit(value, path);
  else if (Array.isArray(value)) value.forEach((v, i) => scanArc(v, `${path}[${i}]`, visit));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) scanArc(v, `${path}.${k}`, visit);
  }
}

describe("arcs registry (ADR-052)", () => {
  it("slugs are unique and kebab-case", () => {
    const slugs = arcSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("getArc resolves every slug and rejects unknowns", () => {
    for (const slug of arcSlugs()) {
      expect(getArc(slug)?.slug).toBe(slug);
    }
    expect(getArc("nope")).toBeUndefined();
  });

  it("section ids are unique per arc and menu rows are anchorable", () => {
    for (const arc of ARCS) {
      const ids = arc.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const section of arc.sections) {
        if (section.menuLabel) {
          expect(section.id.length).toBeGreaterThan(0);
          expect(section.menuLabel.length).toBeLessThanOrEqual(18);
        }
      }
    }
  });

  it("every arc ends on a close section", () => {
    for (const arc of ARCS) {
      expect(arc.sections[arc.sections.length - 1]?.kind).toBe("close");
    }
  });

  it("asset paths are repo-rooted (/arcs, /images, or /videos)", () => {
    const ok = (src: string) =>
      src.startsWith("/arcs/") || src.startsWith("/images/") || src.startsWith("/videos/");
    for (const arc of ARCS) {
      expect(ok(arc.cardImage.src)).toBe(true);
      expect(ok(arc.hero.image.src)).toBe(true);
      for (const section of arc.sections) {
        if (section.kind === "media") {
          expect(ok(section.media.src)).toBe(true);
          if (section.media.type === "video") {
            expect(section.media.poster && ok(section.media.poster)).toBe(true);
          }
        }
        if (section.kind === "portrait") expect(ok(section.image.src)).toBe(true);
        if (section.kind === "cards") {
          for (const card of section.cards) {
            if (card.image) expect(ok(card.image.src)).toBe(true);
          }
        }
      }
    }
  });

  it("no italic markup smuggled into copy strings", () => {
    const offenders: string[] = [];
    ARCS.forEach((arc) =>
      scanArc(arc, arc.slug, (value, path) => {
        if (/<\s*(i|em)[\s>]/i.test(value)) offenders.push(path);
      })
    );
    expect(offenders).toEqual([]);
  });

  it("carries no superseded Loop claim the landing has already moved on from", () => {
    // THE ARCS ARE OUTSIDE THE CASEFILE'S GUARD. `cases-registry.test.ts`
    // scans `CASES` and `PROJECT_CASES` only, so a claim that also lives on
    // a deck page could be swept on the landing and survive here — which is
    // the one place nobody would look, because these pages are unlisted.
    //
    // 42 → 47+ Skills (2026-08-02, ADR-056 U12): the landing's Intelligence
    // Map plate sums its per-shape counts on screen, so the two surfaces
    // cannot print different totals for the same portfolio. Whoever raises
    // the count next has to raise it in both places, and this is what says
    // so out loud.
    const offenders: string[] = [];
    ARCS.forEach((arc) =>
      scanArc(arc, arc.slug, (value, path) => {
        if (/\bforty-two\b/i.test(value)) offenders.push(`${path}: superseded skill count (prose)`);
        if (/\b42\s*skills\b/i.test(value)) offenders.push(`${path}: superseded skill count`);
      })
    );
    expect(offenders).toEqual([]);
  });

  it("motion flags are known and card identities are distinguishable", () => {
    for (const arc of ARCS) {
      if (arc.motion) expect(["reveal", "terminal"]).toContain(arc.motion);
    }
    // Two arcs may legitimately share a format, so the honest global
    // invariants are the card title (grid) and the meta title (tab).
    const cardTitles = ARCS.map((arc) => arc.cardTitle);
    expect(new Set(cardTitles).size).toBe(cardTitles.length);
    const metaTitles = ARCS.map((arc) => arc.meta.title);
    expect(new Set(metaTitles).size).toBe(metaTitles.length);
    // Any arc sharing a format with another must override the chip.
    const formatCounts = new Map<string, number>();
    for (const arc of ARCS) formatCounts.set(arc.format, (formatCounts.get(arc.format) ?? 0) + 1);
    for (const arc of ARCS) {
      if ((formatCounts.get(arc.format) ?? 0) > 1 && arc.motion === "terminal") {
        expect(arc.cardChip).toBeDefined();
        expect(arc.cardChip).not.toBe(arc.format);
      }
    }
  });

  it("terminal cuts share their source arc's sections BY REFERENCE (ADR-057)", () => {
    const pairs: readonly [string, string][] = [
      ["claude-workshop", "claude-workshop-v2"],
      ["ai-keynote", "ai-keynote-v2"],
    ];
    for (const [v1Slug, v2Slug] of pairs) {
      const v1 = getArc(v1Slug);
      const v2 = getArc(v2Slug);
      expect(v1).toBeDefined();
      expect(v2).toBeDefined();
      expect(v2?.motion).toBe("terminal");
      expect(v1?.motion).toBeUndefined();
      // Reference equality, not deep equality: a copied array would
      // drift the moment either page's copy is edited.
      expect(v2?.sections).toBe(v1?.sections);
      expect(v2?.hero).toBe(v1?.hero);
    }
  });
});
