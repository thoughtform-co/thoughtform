import { describe, expect, it } from "vitest";

import { caseModeLabel, dossierHead } from "@/components/arcs/ArcDossier";
import { arcTitleText } from "@/components/arcs/chrome";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { AI_KEYNOTE_ARC } from "@/lib/arcs/content/ai-keynote";
import { PORTFOLIO_ARC } from "@/lib/arcs/content/portfolio";
import { LOOP_SKILL_GROUPS } from "@/lib/arcs/content/shared/loop-skills";
import { STUDIO_AD_CARDS } from "@/lib/arcs/content/shared/loop-studio";
import { MODE_LEGEND } from "@/lib/arcs/content/shared/loop-tools";
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
    //
    // ADR-072 widened this to the casefile's whole numbers canon — the
    // portfolio arc prints the Loop figures on purpose, so every superseded
    // figure the landing has pinned OUT must be pinned out here too: 90 % /
    // 95 % (97 % is canonical), "15+ teams" / "20+ Skills" (the Prime
    // handoff), "teams mapped" (the 14-set's meaning with the 22-set's
    // value), "8 teams" (departments are not teams). And the ONE team count
    // an arc may print beside "14" has to say what the 14 are.
    const offenders: string[] = [];
    ARCS.forEach((arc) =>
      scanArc(arc, arc.slug, (value, path) => {
        if (/\bforty-two\b/i.test(value)) offenders.push(`${path}: superseded skill count (prose)`);
        if (/\b42\s*skills\b/i.test(value)) offenders.push(`${path}: superseded skill count`);
        if (/\b(?:90|95)\s*%/.test(value)) offenders.push(`${path}: superseded studio figure`);
        if (/\b15\+\s*teams\b/i.test(value)) offenders.push(`${path}: superseded team count`);
        if (/\b20\+\s*(?:skills|teams)\b/i.test(value)) offenders.push(`${path}: superseded count`);
        if (/\bteams\s+mapped\b/i.test(value)) offenders.push(`${path}: conflated team count`);
        if (/\b8\s+teams\b/i.test(value)) offenders.push(`${path}: departments printed as teams`);
        if (/\b14\s+teams\b/i.test(value) && !/\b14\s+teams\s+using\s+the\s+layer\b/i.test(value)) {
          offenders.push(`${path}: 14 teams without "using the layer"`);
        }
      })
    );
    expect(offenders).toEqual([]);
  });

  it("holds the confidentiality envelope on the portfolio (no money, boards, repos, surnames)", () => {
    // THE KEYNOTE IS EXEMPT, AND THAT IS RECORDED, NOT FORGOTTEN. The
    // keynote is a client DECK — shown live, unlisted — and prints per-ad
    // spend and order value in euros on purpose (the exemption is written
    // beside `STUDIO_SHOTS` in `lib/cases/content/loop-earplugs.ts`, and
    // its signal cards quote public headlines with dollar figures). The
    // portfolio is a page a reader FORWARDS, so it sits inside the
    // casefile's envelope: the same six patterns `cases-registry.test.ts`
    // runs over CASES and PROJECT_CASES (copied, not imported — a spec
    // importing a spec registers its tests twice), plus first names only.
    const ENVELOPE_ARCS = ["portfolio"];
    const banned: readonly [RegExp, string][] = [
      [/[€$£]/, "currency symbol"],
      [/\b\d{1,3}(,\d{3})+\b/, "amount with thousands separator"],
      [/\bUSD\b|\bEUR\b/i, "currency code"],
      [/monday\.com/i, "board link"],
      [/github\.com/i, "repo link"],
      [/loop-skills|tensalir|\baether\b/i, "private repo name"],
    ];
    const offenders: string[] = [];
    for (const slug of ENVELOPE_ARCS) {
      const arc = getArc(slug);
      expect(arc, `envelope arc ${slug} is registered`).toBeDefined();
      scanArc(arc, slug, (value, path) => {
        for (const [pattern, what] of banned) {
          if (pattern.test(value)) offenders.push(`${path}: ${what}`);
        }
      });
      for (const section of arc!.sections) {
        if (section.kind === "interstitial" && section.attribution) {
          // First name, optionally ` · role` — the casefile's rule, with a
          // Unicode-aware name class (the roster has an Aurélie).
          expect(section.attribution, `${slug}/${section.id} attribution`).toMatch(
            /^[A-Z][\p{L}'-]+(\s·\s.+)?$/u
          );
        }
        if (section.kind === "list-groups") {
          for (const group of section.groups) {
            for (const item of group.items) {
              if (item.meta && /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(item.meta)) {
                offenders.push(`${slug}/${section.id}/${item.id}: meta reads as a full name`);
              }
            }
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("dossier sections point at a PROJECT_CASES record and say its own legend (ADR-072)", () => {
    const ids = PROJECT_CASES.map((tool) => tool.id);
    for (const arc of ARCS) {
      const seen = new Set<string>();
      for (const section of arc.sections) {
        if (section.kind !== "dossier") continue;
        const tool = PROJECT_CASES.find((t) => t.id === section.toolId);
        expect(tool, `${arc.slug}/${section.id}: toolId ${section.toolId}`).toBeDefined();
        expect(seen.has(section.toolId), `${arc.slug}: ${section.toolId} dossiered twice`).toBe(
          false
        );
        seen.add(section.toolId);
        // The legend IS the shared mode sentence — the template says the
        // same thing everywhere, never a re-typed near-copy.
        expect(section.legend).toBe(MODE_LEGEND[caseModeLabel(tool!.mode)]);
        // A dossier never authors a split head: the record column is the
        // intro, and a sub would wedge it into the narrow column.
        expect(section.head?.sub).toBeUndefined();
        if (section.head) {
          expect(arcTitleText(section.head.title)).toBe(arcTitleText(dossierHead(tool!).title));
        }
      }
    }
    // The portfolio carries all four, in the canonical order.
    const portfolioTools = PORTFOLIO_ARC.sections
      .filter((section) => section.kind === "dossier")
      .map((section) => (section.kind === "dossier" ? section.toolId : ""));
    expect(portfolioTools).toEqual(ids);
    // The derived masthead needs every record's title to convert
    // losslessly: at most one em segment, never the first.
    for (const tool of PROJECT_CASES) {
      const ems = tool.title.filter((segment) => segment.em);
      expect(ems.length, `${tool.id}: em segments`).toBeLessThanOrEqual(1);
      expect(tool.title[0]?.em, `${tool.id}: em-first title`).toBeFalsy();
      expect(arcTitleText(dossierHead(tool).title)).toBe(
        tool.title
          .map((segment) => segment.text)
          .join("")
          .replace(/\s+/g, " ")
          .trim()
      );
    }
  });

  it("shares the Loop evidence by reference, never by copy (ADR-072)", () => {
    const keynoteStudio = AI_KEYNOTE_ARC.sections.find((s) => s.id === "proof-studio");
    expect(keynoteStudio?.kind === "cards" && keynoteStudio.cards).toBe(STUDIO_AD_CARDS);
    for (const arc of [AI_KEYNOTE_ARC, PORTFOLIO_ARC]) {
      const roster = arc.sections.find((s) => s.id === "skills-by-team");
      expect(roster?.kind === "list-groups" && roster.groups, `${arc.slug} roster`).toBe(
        LOOP_SKILL_GROUPS
      );
    }
    // The portfolio's studio cards are the SAME records minus the money rows.
    const portfolioStudio = PORTFOLIO_ARC.sections.find((s) => s.id === "studio");
    expect(portfolioStudio?.kind).toBe("cards");
    if (portfolioStudio?.kind === "cards") {
      expect(portfolioStudio.cards.map((c) => c.id)).toEqual(STUDIO_AD_CARDS.map((c) => c.id));
      for (const card of portfolioStudio.cards) {
        expect(card.metaRows?.map((row) => row.label)).toEqual(["SKU", "ROAS"]);
      }
    }
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
