import { describe, expect, it } from "vitest";

import { caseModeLabel, dossierHead } from "@/components/arcs/ArcDossier";
import { arcTitleText } from "@/components/arcs/chrome";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { AI_KEYNOTE_ARC } from "@/lib/arcs/content/ai-keynote";
import { PORTFOLIO_ARC } from "@/lib/arcs/content/portfolio";
import { LOOP_FIGURES } from "@/lib/arcs/content/shared/loop-figures";
import { LOOP_SKILL_GROUPS } from "@/lib/arcs/content/shared/loop-skills";
import { STUDIO_AD_CARDS } from "@/lib/arcs/content/shared/loop-studio";
import { MODE_LEGEND } from "@/lib/arcs/content/shared/loop-tools";
import { ARCS, arcSlugs, getArc } from "@/lib/arcs/registry";
import { ROLLOUT_ROWS } from "@/lib/cases/content/loop-earplugs";

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

  it("the header's chapter row is capped, and every chapter is in the drawer (ADR-073)", () => {
    // The inline row is the hero state of the site's header; the drawer
    // takes every `menuLabel`. Five is what the row fits beside the hero
    // copy at 1280×720 — measured, and the smoke asserts the row lands on
    // no hero ink at the reference viewports. A chapter with no
    // `menuLabel` would claim a link the drawer cannot list.
    for (const arc of ARCS) {
      const primary = arc.sections.filter((section) => section.menuPrimary);
      expect(primary.length, `${arc.slug}: chapter count`).toBeLessThanOrEqual(5);
      for (const section of primary) {
        expect(
          section.menuLabel,
          `${arc.slug}/${section.id}: chapter without a menu label`
        ).toBeTruthy();
      }
      // A deck with a menu has a spine; a header with an empty row is a
      // bare hamburger on a page that has chapters to name.
      if (arc.sections.some((section) => section.menuLabel)) {
        expect(primary.length, `${arc.slug}: no chapters marked`).toBeGreaterThan(0);
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
    /* ⚠ THE WRITTEN ROSTER IS THE KEYNOTE'S ALONE NOW (ADR-076). The
       portfolio dropped it with its five-shapes rows: 47 text cards read
       as a wall on a page a stranger scrolls, and the architecture beat
       draws the same 47 instead. The keynote is a deck read in a room and
       keeps the list — so the pin narrows rather than going, which is
       what keeps the DECK's copy from being re-typed. */
    const keynoteRoster = AI_KEYNOTE_ARC.sections.find((s) => s.id === "skills-by-team");
    expect(keynoteRoster?.kind === "list-groups" && keynoteRoster.groups, "keynote roster").toBe(
      LOOP_SKILL_GROUPS
    );
    expect(
      PORTFOLIO_ARC.sections.some((s) => s.id === "skills-by-team"),
      "the portfolio's text roster is drawn now, not written"
    ).toBe(false);
    /* ⚠ THE STUDIO CARDS ARE THE KEYNOTE'S ALONE NOW (ADR-078), the same
       narrowing the roster took one paragraph up — and the `proof-studio`
       pin above is what keeps the DECK's copy from being re-typed. The
       portfolio's studio beat mounts the casefile's SHEETS instead: the
       cards showed only what the studio shipped, and the half a stranger
       has to trust is the policy under it. */
    expect(
      PORTFOLIO_ARC.sections.some((s) => s.kind === "cards" && s.id === "studio"),
      "the portfolio's studio beat is a console now, not ad cards"
    ).toBe(false);
  });

  it("the portfolio's studio chapter is the casefile's own plates (ADR-078)", () => {
    /* Both beats carry a masthead and NOTHING else — the `intelligence`
       kind's contract, one directory row across. The records are
       `LOOP_STUDIO_SHEETS` / `LOOP_ATL_FILMS`, resolved by the renderers
       and pinned `toBe` the casefile's in `cases-registry.test.ts`; a
       content module that re-typed either would publish a second version
       of the studio's own red line. */
    for (const kind of ["sheets", "films"] as const) {
      const beats = PORTFOLIO_ARC.sections.filter((s) => s.kind === kind);
      expect(beats, `exactly one ${kind} beat`).toHaveLength(1);
      expect(Object.keys(beats[0]).sort()).toEqual(
        [
          "ariaLabel",
          "head",
          "id",
          "kind",
          "menuLabel",
          ...(kind === "sheets" ? ["menuPrimary"] : []),
        ].sort()
      );
    }

    const ids = PORTFOLIO_ARC.sections.map((s) => s.id);
    /* THE STUDIO PRECEDES THE TOOLS, and that ordering IS the argument:
       the tools are what the studio's own bottlenecks produced, so a
       reader who meets them first meets four side projects. */
    expect(ids.indexOf("studio")).toBeLessThan(ids.indexOf("tools"));
    expect(ids.indexOf("studio-films")).toBe(ids.indexOf("studio") + 1);

    /* The ad cards and the single-film media beat are both gone. */
    expect(ids).not.toContain("proof-ai-atl");
    const studio = PORTFOLIO_ARC.sections.find((s) => s.id === "studio");
    expect(studio?.kind, "the studio beat is a console now, not cards").toBe("sheets");
  });

  it("the flywheel letters no figures, and its route resolves (ADR-078)", () => {
    const fly = PORTFOLIO_ARC.sections.filter((s) => s.kind === "flywheel");
    expect(fly, "exactly one flywheel beat").toHaveLength(1);
    const beat = fly[0];
    if (beat.kind !== "flywheel") throw new Error("unreachable");

    expect(beat.menuPrimary, "the thesis is a chapter").toBe(true);

    /* ⚠ NO DIGITS IN THE CONTENT MODULE. The registers are `LOOP_FIGURES`,
       read by the renderer — the same contract `dossier` has with
       `PROJECT_CASES`. A hand-typed count is the one that goes stale, and
       a figure declared here would sit outside the canon's one parity
       pin. The route's `sub` captions are the one place a count may
       appear, and only as the canon's own value. */
    const canon = new Set<string>(Object.values(LOOP_FIGURES));
    for (const wp of beat.route) {
      const digits = wp.sub?.match(/\d[\d,.]*/g) ?? [];
      for (const d of digits) {
        /* A YEAR IS NOT A COUNT, and the distinction is the whole point of
           this guard: a date locates the work on record, a figure makes a
           claim about it. Years in the engagement's own span are fine
           anywhere; anything else has to BE the canon's value. */
        const isYear = /^20(2[4-9]|3\d)$/.test(d);
        expect(
          isYear || [...canon].some((c) => c.includes(d)),
          `route sub "${wp.sub}" letters ${d}, which is neither a year nor a canon figure`
        ).toBe(true);
      }
    }

    /* THE ROUTE IS THE PAGE'S OWN TABLE OF CONTENTS, so every waypoint
       that links has to land on a section that exists — a dead anchor on
       a forwarded page is a broken promise a stranger finds first. */
    const ids = new Set(PORTFOLIO_ARC.sections.map((s) => s.id));
    for (const wp of beat.route) {
      if (wp.target) {
        expect(ids.has(wp.target), `route waypoint "${wp.id}" targets #${wp.target}`).toBe(true);
      }
    }

    /* EXACTLY ONE SEAT — the terminus both strands converge into, and the
       drawing's one gold object (gold buys one thing per drawing). */
    expect(beat.route.filter((wp) => wp.seat)).toHaveLength(1);
    expect(beat.route.at(-1)?.seat, "the seat is the terminus").toBe(true);

    /* AND IT SITS WHERE THE THESIS BELONGS: before every chapter it
       routes to, so the reader meets the argument and then the evidence. */
    const order = PORTFOLIO_ARC.sections.map((s) => s.id);
    for (const wp of beat.route) {
      if (wp.target && wp.target !== "about") {
        expect(order.indexOf(wp.target)).toBeGreaterThan(order.indexOf("overview"));
      }
    }
  });

  it("the rollout beat agrees with the casefile's own log (ADR-078)", () => {
    /* COPY-WITH-PARITY, the `LOOP_FIGURES` precedent: `lib/arcs` keeps no
       `lib/cases` import, so the rows are re-authored here and pinned
       against the record rather than shared. The page states them as
       sentences and the casefile as log lines, so the pin is on the
       CLAIMS a reader could subtract — the milestones and their order —
       rather than on the strings. */
    const rollout = PORTFOLIO_ARC.sections.find((s) => s.id === "rollout");
    expect(rollout?.kind).toBe("anatomy");
    if (rollout?.kind !== "anatomy") return;

    expect(rollout.rows.map((r) => r.label)).toEqual(ROLLOUT_ROWS.map((r) => r.t as string));

    /* The one number the log carries into prose, in the wording that
       keeps the two team-counts apart. */
    const briefed = rollout.rows.find((r) => r.id === "briefed");
    expect(briefed?.body).toContain("Twenty-two teams briefed");
    const now = rollout.rows.find((r) => r.id === "now");
    expect(now?.body).toContain("using it");
  });

  it("the portfolio closes on ONE architecture beat, and it flows (ADR-076)", () => {
    /* THE MOTION. A portfolio is scrolled at the reader's pace, so the
       page takes the ADR-052 reveal; the `-v2` client decks keep the
       pinned grammar they were designed in. Absent, not "reveal" — the
       renderer resolves the default in one place and an explicit value
       here would be a second source for it. */
    expect(PORTFOLIO_ARC.motion).toBeUndefined();

    const intel = PORTFOLIO_ARC.sections.filter((s) => s.kind === "intelligence");
    expect(intel, "exactly one architecture beat").toHaveLength(1);
    expect(intel[0].id).toBe("intelligence");
    expect(intel[0].menuPrimary, "it is a chapter").toBe(true);
    expect(intel[0].kind === "intelligence" && intel[0].head.title).toBeTruthy();

    /* AT THE FOOT: after the four dossiers and the outcome, before the
       close. It is the answer to "what is underneath all of that", which
       only reads as an answer once the work has been shown. */
    const ids = PORTFOLIO_ARC.sections.map((s) => s.id);
    expect(ids.indexOf("intelligence")).toBeGreaterThan(ids.indexOf("tool-heimdall"));
    expect(ids.indexOf("intelligence")).toBeGreaterThan(ids.indexOf("studio"));
    expect(ids.indexOf("intelligence")).toBe(ids.indexOf("close") - 1);

    /* IT CARRIES NO RECORD OF ITS OWN. The 47 Skills and their five
       shapes come from `LOOP_INTELLIGENCE_MAP`, resolved by the renderer
       — a content module that re-typed them would publish a second
       portfolio, and the two would drift the first time either was
       edited. So the section is a masthead and nothing else. */
    expect(Object.keys(intel[0]).sort()).toEqual(
      ["ariaLabel", "head", "id", "kind", "menuLabel", "menuPrimary"].sort()
    );

    /* AND THE TEXT WALLS ARE GONE, both of them. */
    expect(ids).not.toContain("five-shapes");
    expect(ids).not.toContain("skills-by-team");
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
