import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { caseModeLabel, dossierHead } from "@/components/arcs/ArcDossier";
import { TOOL_ORDER } from "@/components/arcs/ArcToolIndex";
import { arcTitleText } from "@/components/arcs/chrome";
import { litIsFramable } from "@/components/arcs/heroBoard/heroBoardLayout";
import {
  PROOF_STACK_CASE,
  PROOF_STACK_ORDER,
} from "@/components/landing/home-v2/services/proof-stack/proofOrder";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { AI_KEYNOTE_ARC } from "@/lib/arcs/content/ai-keynote";
import { AI_STORYTELLING_ARC } from "@/lib/arcs/content/ai-storytelling";
import { AI_STORYTELLING_CLASS_1_ARC } from "@/lib/arcs/content/ai-storytelling-class-1";
import { PORTFOLIO_ARC } from "@/lib/arcs/content/portfolio";
import { FRONTIER_CURVE } from "@/lib/arcs/content/shared/frontierCurve";
import { TOM_BENCH_EXAMPLE, TOM_PATH_STAGES } from "@/lib/arcs/content/shared/tom-on-the-moon";
import { THOUGHTFORM_WORKSHOP_ARC } from "@/lib/arcs/content/thoughtform-workshop";
import { LOOP_FIGURES } from "@/lib/arcs/content/shared/loop-figures";
import { LOOP_SKILL_GROUPS } from "@/lib/arcs/content/shared/loop-skills";
import { STUDIO_AD_CARDS } from "@/lib/arcs/content/shared/loop-studio";
import { MODE_LEGEND } from "@/lib/arcs/content/shared/loop-tools";
import { CLIENTS, clientSlugs, getClient, kindOf } from "@/lib/arcs/clients";
import { heroMeasureFaults, PROPOSAL_COPY_BANS } from "@/lib/arcs/copyLaw";
import { ARCS, arcSlugs, arcsOf, getArc, houseArcs } from "@/lib/arcs/registry";
import { HERO_ROUTES } from "@/lib/theme/heroPreload";
import { LIGHT_LOCKED_ROUTES } from "@/lib/theme/themeLock";
import { ROLLOUT_ROWS } from "@/lib/cases/content/loop-earplugs";
import { getCase } from "@/lib/cases/registry";

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

  it("every hero keeps the homepage's measure: a short title, one sentence under it", () => {
    /* The owner, 2026-09-27: the hero's text "should be much more concise.
       That should be a uniform rule." Every arc, every format, every status:
       the measure and its reasons are in `lib/arcs/copyLaw.ts`. */
    const offenders: string[] = [];
    for (const arc of ARCS) {
      for (const fault of heroMeasureFaults(arcTitleText(arc.hero.title), arc.hero.lede)) {
        offenders.push(`${arc.slug}: ${fault}`);
      }
    }
    expect(offenders).toEqual([]);
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
    const ENVELOPE_ARCS = ["loop-earplugs"];
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
    /* The portfolio carries all four — in the TRAJECTORY's order since
       ADR-079, not the registry's. Vesper is the tool built FOR the
       creative process and the other three are built AROUND it, which is
       both the real sequence (Oct 2025 → Feb 2026) and the distinction the
       chapter's own sub draws. ⚠ Pinned as a SET against the registry so a
       tool cannot go missing, and as a SEQUENCE against the index that
       points at these beats. */
    const portfolioTools = PORTFOLIO_ARC.sections
      .filter((section) => section.kind === "dossier")
      .map((section) => (section.kind === "dossier" ? section.toolId : ""));
    expect([...portfolioTools].sort()).toEqual([...ids].sort());
    expect(portfolioTools).toEqual([...TOOL_ORDER]);
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
      /* BOTH are chapters since ADR-079: retiring `rollout` freed the
         fifth inline slot, and the reel had been a full viewport of the
         page's most striking evidence with no link to reach it by. */
      expect(Object.keys(beats[0]).sort()).toEqual(
        ["ariaLabel", "head", "id", "kind", "menuLabel", "menuPrimary"].sort()
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

  it("the program board opens the page, letters no figures, and plots real dates (ADR-078 U1)", () => {
    const boards = PORTFOLIO_ARC.sections.filter((s) => s.kind === "program");
    expect(boards, "exactly one program board").toHaveLength(1);
    const beat = boards[0];
    if (beat.kind !== "program") throw new Error("unreachable");

    expect(beat.menuPrimary, "the setup is a chapter").toBe(true);

    /* ⚠ IT IS THE FIRST SECTION, and that is the whole shape of the U1
       revision: the page used to spend four sections — a bio, an origin
       card set, the thesis and a prose bridge — before a reader reached
       anything Loop shipped. The board carries all four, so the work
       starts on scroll one. It is also what the curtain holds. */
    expect(PORTFOLIO_ARC.sections[0]?.id, "the board opens the page").toBe(beat.id);

    /* AND THE THINGS IT REPLACED STAY REPLACED. A bio on an extension of
       the proof panel, an origin told in prose cards, and interstitial
       bridges written in a register the owner would not send. */
    const ids = PORTFOLIO_ARC.sections.map((s) => s.id);
    expect(ids, "no bio beat").not.toContain("about");
    expect(ids, "the origin is chart grammar now").not.toContain("beyond");
    expect(
      PORTFOLIO_ARC.sections.some((s) => s.kind === "interstitial"),
      "no prose bridges — the connective tissue is each section's own sub"
    ).toBe(false);
    expect(
      PORTFOLIO_ARC.sections.some((s) => s.kind === "portrait"),
      "the portrait kind stays for the keynote, never here"
    ).toBe(false);

    /* ⚠ NO DIGITS IN THE CONTENT MODULE. The registers are `LOOP_FIGURES`,
       read by the renderer — the same contract `dossier` has with
       `PROJECT_CASES`. A hand-typed count is the one that goes stale, and
       a figure declared here would sit outside the canon's one parity
       pin. A waypoint's `sub` is the one place a number may appear, and
       only as a DATE or the canon's own value. */
    const canon = new Set<string>(Object.values(LOOP_FIGURES));
    for (const wp of beat.waypoints) {
      const digits = wp.sub?.match(/\d[\d,.]*/g) ?? [];
      for (const d of digits) {
        /* A YEAR IS NOT A COUNT, and the distinction is the whole point of
           this guard: a date locates the work on record, a figure makes a
           claim about it. */
        const isYear = /^20(2[4-9]|3\d)$/.test(d);
        expect(
          isYear || [...canon].some((c) => c.includes(d)),
          `waypoint sub "${wp.sub}" letters ${d}, which is neither a year nor a canon figure`
        ).toBe(true);
      }
    }

    /* THE COURSE IS THE PAGE'S OWN TABLE OF CONTENTS, so every waypoint
       has to land on a section that exists — a dead anchor on a forwarded
       page is a broken promise a stranger finds first. */
    const idSet = new Set(ids);
    for (const wp of beat.waypoints) {
      if (wp.target) {
        expect(idSet.has(wp.target), `waypoint "${wp.id}" targets #${wp.target}`).toBe(true);
      }
    }

    /* ⚠ THE POSITIONS ARE DATES, SO THEY MUST RISE. The chart's whole
       claim over a list is that the gaps are real — an unsorted or
       out-of-range `at` would draw a course that crosses itself and say
       something false about when the work happened. */
    const ats = beat.waypoints.map((wp) => wp.at);
    for (const at of ats) {
      expect(at, "a position is 0 → 1 along the axis").toBeGreaterThanOrEqual(0);
      expect(at).toBeLessThanOrEqual(1);
    }
    expect(
      [...ats].sort((a, b) => a - b),
      "the course runs forward in time"
    ).toEqual(ats);

    /* EXACTLY ONE SEAT — where the curve and the course both arrive, and
       the drawing's one gold object (gold buys one thing per drawing). */
    expect(beat.waypoints.filter((wp) => wp.seat)).toHaveLength(1);
    expect(beat.waypoints.at(-1)?.seat, "the seat is the terminus").toBe(true);

    /* Everything it routes to comes AFTER it: the reader meets the chart,
       then the evidence it points at. */
    for (const wp of beat.waypoints) {
      if (wp.target) {
        expect(ids.indexOf(wp.target)).toBeGreaterThan(ids.indexOf(beat.id));
      }
    }
  });

  it("titles are names, not aphorisms (ADR-078 U1)", () => {
    /* THE OWNER'S OWN RULING, MECHANISED (2026-08-24: the earlier set
       "disgusts me… people will hate me for it"). Three shapes are banned
       as DISPLAY TITLES on this page — they read as generated copy, and
       this is the one page whose reader is a stranger being asked to take
       the work seriously:

         · the counting pair      "Twenty-two teams, forty-five minutes each."
         · the reversal epigram   "The method is X. The tools are Y."
         · the spelled-out number "Forty-seven Skills, five shapes of work."

       ⚠ TITLES ONLY. A dated LOG ROW may state a count in the same words
       — a record is not a claim — which is why this walks `head.title`
       and nothing else. */
    const spelled =
      /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)[-\s]/i;
    for (const section of PORTFOLIO_ARC.sections) {
      const head = "head" in section ? section.head : undefined;
      if (!head) continue;
      const title = [head.title.pre, head.title.em, head.title.post].filter(Boolean).join(" ");
      const at = `${section.id}: "${title}"`;

      expect(spelled.test(title.trim()), `${at} opens on a spelled-out number`).toBe(false);
      // The counting pair: "N somethings, M somethings each".
      expect(
        /\b\w+\s+\w+s,\s+\w+[-\s]\w+\s+\w+s\s+each\b/i.test(title),
        `${at} is a counting pair`
      ).toBe(false);
      // The reversal epigram: two full sentences pivoting on "is/are".
      const sentences = title.split(/(?<=\.)\s+/).filter((t) => t.trim().length > 0);
      const bothAssert = sentences.length > 1 && sentences.every((t) => /\b(is|are)\b/i.test(t));
      expect(bothAssert, `${at} is a reversal epigram`).toBe(false);
    }
  });

  it("a Dutch title is a name too (ADR-130 U2)", () => {
    /* ⚠ THE ADR-078 GUARD ABOVE IS ENGLISH, AND IT WALKS THE PORTFOLIO ALONE.
       So the counting pair went on shipping in Dutch: the Plopsa workshop had
       EIGHT of thirteen titles on one shape — "Eén stuk werk, zes vragen
       eromheen.", "Drie dingen, in deze volgorde.", "Vier weken, en dan …" —
       and the owner read the page as generated copy (2026-09-27: "I don't
       want it to be like AI slop as it is now, even in Dutch").

       Two shapes, on the DUTCH-language arcs only:

         · the counting title   a spelled numeral opening either half of the pair
         · the replacement pair "niet X maar Y", "X, niet Y", "geen X maar Y"

       ⚠ TITLES ONLY, exactly as ADR-078 U1 rules it — a readout ROW may still
       say "Zes vragen, twee die jullie schrijven", because a record is not a
       claim. And the list is by SLUG rather than by a language field: the
       record carries no `lang`, and inferring one from the copy would make the
       guard's reach depend on the copy it is guarding. */
    const DUTCH_ARCS = new Set(["plopsa-workshop", "suri-workshop", "suri-kickoff"]);
    /* ⚠ COMPARE ON A DE-ACCENTED SKELETON. The first cut matched the numeral
       "één" literally and MISSED the worst title on the page — "Eén stuk werk,
       zes vragen eromheen." — because Dutch capitalises the word "Eén", whose
       first character is a plain `E` that no case-fold of `é` ever reaches. A
       guard written against one spelling of its own keyword is a guard that
       reports green on the string it was written for. */
    const skeleton = (t: string) =>
      t
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    /* ⚠ "een" IS IN THE PAIR SET AND OUT OF THE OPENER SET. De-accented it is
       both the numeral "één" and the indefinite article, so it can only be read
       as a count when a SECOND numeral answers it across the comma; "Een uur
       aan het stuur." is a name, not a tally. */
    const NUM_PAIR =
      "een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf|dertien|twintig|dertig|veertig|vijftig|honderd";
    const NUM_OPEN = NUM_PAIR.replace("een|", "");
    const countingPair = new RegExp(`^\\s*(${NUM_PAIR})\\b[^,.]*[,.]\\s*(${NUM_PAIR})\\b`);
    const countingOpen = new RegExp(`^\\s*(${NUM_OPEN})\\s+\\w+,`);
    const replacement =
      /\bniet\s+\w[^,.]*,\s*maar\b|,\s*niet\s+\w+\.?$|\bgeen\s+\w[^,.]*,\s*maar\b/;

    for (const arc of ARCS) {
      if (!DUTCH_ARCS.has(arc.slug)) continue;
      for (const section of arc.sections) {
        const head = "head" in section ? section.head : undefined;
        if (!head) continue;
        const title = arcTitleText(head.title);
        const flat = skeleton(title);
        const at = `${arc.slug}#${section.id}: "${title}"`;
        expect(countingPair.test(flat), `${at} is a counting pair`).toBe(false);
        expect(countingOpen.test(flat), `${at} opens on a count`).toBe(false);
        expect(replacement.test(flat), `${at} is a replacement contrast`).toBe(false);
      }
    }
  });

  it('the Dutch copy never says "plaat" (owner, 2026-09-28)', () => {
    /* "Don't ever use the word plaat in Dutch; we don't say that in Flemish."
       An image is a "beeld". Walked over every string a Dutch arc carries,
       head to close, so it holds in a panel row as well as a title; "plaats"
       and "geplaatst" are other words and pass. */
    const DUTCH_ARCS = new Set(["plopsa-workshop", "suri-workshop", "suri-kickoff"]);
    const plaat = /\bplaat(je|jes)?\b|\bplaten\b/i;
    for (const arc of ARCS) {
      if (!DUTCH_ARCS.has(arc.slug)) continue;
      const hits = JSON.stringify({ hero: arc.hero, sections: arc.sections })
        .split(/"[^"]*":/)
        .filter((chunk) => plaat.test(chunk));
      expect(hits, `/arcs/${arc.slug}`).toEqual([]);
    }
  });

  it("the trajectory is the page's ONE chronology, and its contents (ADR-079)", () => {
    /* ⚠ THE `rollout` SECTION IS RETIRED. It plotted the SAME 2024 → now
       span the program board plots, in a second grammar, at the opposite
       end of the page — a reader met the chronology twice and had to work
       out that the two were one thing. Its rows are stations on the axis,
       its platform work is the board's `parallel` track, and its counts
       are the registers.

       The casefile keeps `ROLLOUT_ROWS`, which is the canonical copy and
       is untouched; what went is this page's re-authored second version,
       and with it the copy-with-parity pin that guarded the pair. */
    expect(
      PORTFOLIO_ARC.sections.some((s) => s.id === "rollout"),
      "the rollout is the trajectory now, not a section of its own"
    ).toBe(false);
    expect(
      PORTFOLIO_ARC.sections.some((s) => s.kind === "anatomy"),
      "and no anatomy beat replaced it"
    ).toBe(false);

    const board = PORTFOLIO_ARC.sections.filter((s) => s.kind === "program");
    expect(board, "exactly one program board").toHaveLength(1);
    expect(board[0].id, "and it is the one the curtain holds").toBe(PORTFOLIO_ARC.sections[0].id);
    if (board[0].kind !== "program") return;

    /* ⚠ THE GAPS ARE THE READING — pinned SORTED so a later hand cannot
       spread the stations evenly and delete the one thing the chart knows
       that a list does not. */
    const ats = board[0].waypoints.map((w) => w.at);
    expect([...ats].sort((a, b) => a - b)).toEqual(ats);
    expect(new Set(ats).size, "no two stations share a position").toBe(ats.length);
    expect(
      board[0].waypoints.filter((w) => w.seat),
      "exactly one terminus"
    ).toHaveLength(1);

    /* Every station carries its own note: the board names dated things,
       and the MOVE between them is what a stranger is reading for. */
    for (const w of board[0].waypoints) {
      expect(w.note, `${w.id} states what the move was`).toBeTruthy();
      expect(w.sub, `${w.id} is dated`).toBeTruthy();
    }

    /* Every target is a real section on THIS arc — the board is the page's
       table of contents, so a dead anchor is a broken contents page. */
    const ids = new Set(PORTFOLIO_ARC.sections.map((s) => s.id));
    for (const w of board[0].waypoints) {
      if (!w.target) continue;
      expect(ids.has(w.target), `${w.id} → #${w.target} exists`).toBe(true);
    }

    /* ⚠ THE PLATFORM TRACK STILL SAYS WHAT THE LOG SAID. The pilot's
       seats, the agreement and governance survive as the `parallel` run;
       the two team counts stay in the registers, where the renderer
       letters them from `LOOP_FIGURES`. */
    expect(board[0].parallel?.join(" "), "the parallel track survives").toMatch(/pilot/i);
    expect(ROLLOUT_ROWS.length, "the casefile's own log is untouched").toBe(6);
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

  it("every engagement resolves its client, and the two slug sets are DISJOINT (ADR-098)", () => {
    /* ⚠ ONE NAMESPACE, TWO SETS. `/arcs/[slug]` resolves a client first and
       an arc second, so a client slug equal to an arc's would shadow a live
       page with a listing — and it would do it silently, on a page whose
       whole distribution is a link somebody already forwarded. */
    const clients = clientSlugs();
    expect(new Set(clients).size).toBe(clients.length);
    for (const slug of clients) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    const collisions = clients.filter((slug) => arcSlugs().includes(slug));
    expect(collisions, "a client slug shadows an arc").toEqual([]);

    for (const arc of ARCS) {
      if (!arc.client) continue;
      expect(getClient(arc.client), `${arc.slug}: unknown client ${arc.client}`).toBeDefined();
    }
    // Every client on the overview has something to list — an arc, or a
    // page of its own that is not one (ADR-098 U2: the Trinny pitch).
    for (const client of CLIENTS) {
      const pages = client.pages ?? [];
      expect(
        arcsOf(client.slug).length + pages.length,
        `${client.slug}: no engagements`
      ).toBeGreaterThan(0);
      for (const page of pages) {
        /* ⚠ A CLIENT PAGE MAY NEST UNDER ITS OWN CLIENT, AND MAY NOT SIT IN
           THE SLUG NAMESPACE (ADR-099, owner 2026-09-13: the pitch moves to
           `/arcs/trinny-london/proposal`). The invariant ADR-098 was
           protecting is still the one that matters — a record with no
           sections may not occupy an address `[slug]` resolves, because
           that is a link-only arc by the back door and every `ARCS.map`
           walk would have to special-case it. A DEEPER path under the
           client's own segment is not in that namespace: `[slug]` matches
           one segment, so `/arcs/<client>/<leaf>` can only ever be a real
           route folder. Both halves are asserted — the depth AND the
           ownership — because a page nested under ANOTHER client's slug
           would resolve fine and lie about whose work it is. */
        const nested = page.href.match(/^\/arcs\/([a-z0-9-]+)\/[a-z0-9-]+$/);
        if (page.href.startsWith("/arcs")) {
          expect(nested, `${client.slug}: ${page.href} is in the [slug] namespace`).not.toBeNull();
          expect(nested?.[1], `${client.slug}: ${page.href} nests under another client`).toBe(
            client.slug
          );
        } else {
          expect(page.href, `${client.slug}: page ${page.href}`).toMatch(/^\/[a-z0-9-]+$/);
        }
        expect(page.chip.length, `${client.slug}: page chip`).toBeGreaterThan(0);
        expect(["keynote", "workshop", "production"]).toContain(page.kind);
      }
    }
    // The two partitions cover the registry exactly once.
    const grouped = CLIENTS.flatMap((c) => arcsOf(c.slug)).length + houseArcs().length;
    expect(grouped).toBe(ARCS.length);
  });

  it("resolves a kind for every arc, and the filter can reach it (ADR-098)", () => {
    for (const arc of ARCS) {
      expect(["keynote", "workshop", "production"], `${arc.slug}`).toContain(kindOf(arc));
    }
  });

  it("the configuration's picker is internally consistent (ADR-098)", () => {
    for (const arc of ARCS) {
      for (const section of arc.sections) {
        if (section.kind !== "configuration") continue;
        const at = `${arc.slug}/${section.id}`;
        const ids = section.layer.map((row) => row.id);
        expect(new Set(ids).size, `${at}: duplicate layer id`).toBe(ids.length);
        expect(section.teams.length, `${at}: no teams to pick`).toBeGreaterThan(0);
        const teamIds = section.teams.map((team) => team.id);
        expect(new Set(teamIds).size, `${at}: duplicate team id`).toBe(teamIds.length);
        for (const team of section.teams) {
          expect(team.layers.length, `${at}/${team.id}: reads no layer row`).toBeGreaterThan(0);
          for (const id of team.layers) {
            // A team lighting a row that does not exist dims the whole
            // layer and nothing fails — the picker just does nothing.
            expect(ids, `${at}/${team.id}: unknown layer ${id}`).toContain(id);
          }
          for (const key of ["owner", "runs", "bar", "reach", "where"] as const) {
            expect(team[key]?.length, `${at}/${team.id}: empty ${key}`).toBeGreaterThan(0);
          }
        }
        expect(section.kickers?.length ?? 0, `${at}: too many kickers`).toBeLessThanOrEqual(3);
        /* ⚠ NO DIGIT ON THE DRAWING. Picking a team is what makes the
           transfer visible; a count would be a claim the page cannot
           evidence, and the pitch page's own parse guard says the same. */
        scanArc(
          { layer: section.layer, seam: section.seam, teams: section.teams },
          at,
          (value, path) => {
            // A PHASE CODE IS A NAME, not a count: `M1` designates the
            // workstream a tile belongs to and evidences nothing. What the
            // rule is actually for is a figure the drawing cannot support.
            const counted = value.replace(/\bM\d\b/g, "");
            expect(/\d/.test(counted), `${path}: a figure on the configuration`).toBe(false);
          }
        );
      }
    }
  });

  it("a board's two states are one record, a ledger then a board (ADR-100)", () => {
    /* No registered arc carries a `board` yet — the Trinny page mounts it
       through its own dispatch and `trinny-offer.test.ts` walks that copy.
       The walk lives here too so a registered proposal can adopt the kind
       without the guard arriving a commit late. */
    for (const arc of ARCS) {
      for (const section of arc.sections) {
        if (section.kind !== "board") continue;
        const at = `${arc.slug}/${section.id}`;
        const [today, configured] = section.states;
        expect(today.mode, `${at}: the first state is today`).toBe("today");
        expect(configured.mode, `${at}: the second state is configured`).toBe("configured");
        // One context: the dormant side letters its tags, or none (its one
        // line IS the row); it never letters a different set.
        if (today.layer.rows.length > 0) {
          expect(
            configured.layer.rows.map((r) => r.id),
            `${at}: one context, lit differently`
          ).toEqual(today.layer.rows.map((r) => r.id));
        }
        expect(
          configured.tools.items.map((t) => t.id),
          `${at}: the same tools, wired differently`
        ).toEqual(today.tools.items.map((t) => t.id));
        for (const state of section.states) {
          const ids = state.layer.rows.map((r) => r.id);
          expect(new Set(ids).size, `${at}/${state.mode}: duplicate context id`).toBe(ids.length);
          expect(state.layer.rows.length, `${at}/${state.mode}: too many tags`).toBeLessThanOrEqual(
            4
          );
          // Four facts, four answers: an empty slot is a hole in the drawing.
          expect(state.seat.a.length, `${at}/${state.mode}: the seat`).toBeGreaterThan(0);
          expect(state.card.work.length, `${at}/${state.mode}: the work`).toBeGreaterThan(0);
          expect(state.tools.label.length, `${at}/${state.mode}: the tools`).toBeGreaterThan(0);
        }
        // The two sides answer with different words, or the before/after has
        // a row that says nothing.
        expect(configured.seat.a, `${at}: the seat reads the same on both`).not.toBe(today.seat.a);
        // ⚠ NO DIGIT ON THE DRAWING — the configuration's own ruling, kept.
        scanArc(section.states, at, (value, path) => {
          expect(/\d/.test(value), `${path}: a figure on the board`).toBe(false);
        });
      }
    }
  });

  it("a circuit is a map of six workflows on the marketing OS (ADR-133 U2)", () => {
    for (const arc of ARCS) {
      for (const section of arc.sections) {
        if (section.kind !== "circuit") continue;
        const at = `${arc.slug}/${section.id}`;
        // Six configurations, three a side, each the board's card: a name in
        // mono caps at the card's name rung (one line, so fourteen
        // characters) and one line under it.
        const ids = section.configs.map((c) => c.id);
        expect(ids, `${at}: six workflows`).toHaveLength(6);
        expect(new Set(ids).size, `${at}: duplicate workflow`).toBe(ids.length);
        for (const c of section.configs) {
          expect(c.name.length, `${at}/${c.id}: the name`).toBeGreaterThan(0);
          expect(c.name.length, `${at}/${c.id}: one line on the card`).toBeLessThanOrEqual(14);
          expect(c.line.length, `${at}/${c.id}: the card's line`).toBeGreaterThan(0);
        }
        expect(section.os.name.length, `${at}: the OS's name`).toBeGreaterThan(0);
        expect(section.socket.name.length, `${at}: the socket`).toBeGreaterThan(0);
        // NO DIGIT ANYWHERE IN IT, the board's ruling, kept.
        scanArc(section, at, (value, path) => {
          expect(/\d/.test(value), `${path}: a figure on the circuit`).toBe(false);
        });
      }
    }
  });

  it("a crew maps each role onto its workstream, and only the line carries a number (ADR-133 U6)", () => {
    for (const arc of ARCS) {
      for (const section of arc.sections) {
        if (section.kind !== "crew") continue;
        const at = `${arc.slug}/${section.id}`;
        for (const row of section.rows) {
          expect(row.who.length, `${at}/${row.id}: the role`).toBeGreaterThan(0);
          expect(row.work.length, `${at}/${row.id}: the workstream`).toBeGreaterThan(0);
          // The workstream is a NAME at the role's size: one short line.
          expect(
            row.work.length,
            `${at}/${row.id}: a workstream name, not a sentence`
          ).toBeLessThanOrEqual(18);
          expect(row.line.length, `${at}/${row.id}: what is possible now`).toBeGreaterThan(0);
          // A figure only where the record states one: in the line, or the
          // count the field draws, and nowhere else on the row.
          for (const [k, v] of Object.entries({ who: row.who, work: row.work })) {
            expect(/\d/.test(v), `${at}/${row.id}.${k}: a figure outside the line`).toBe(false);
          }
          if (row.output.kind === "field") {
            const stated = row.line.match(/\d+/)?.[0];
            expect(stated, `${at}/${row.id}: the field draws a count its line does not state`).toBe(
              String(row.output.count)
            );
          }
        }
      }
    }
  });

  it("a steps beat's three stages are one dial, read three ways (ADR-106)", () => {
    /* No registered arc carries a `steps` beat yet — the Trinny page mounts it
       through its own dispatch and `trinny-offer.test.ts` walks that copy. The
       walk lives here too so a registered proposal can adopt the kind without
       the guard arriving a commit late (the board's own precedent). */
    for (const arc of ARCS) {
      for (const section of arc.sections) {
        if (section.kind !== "steps") continue;
        const at = `${arc.slug}/${section.id}`;
        const ids = section.items.map((i) => i.id);
        expect(new Set(ids).size, `${at}: duplicate deliverable id`).toBe(ids.length);
        for (const item of section.items) {
          const where = `${at}/${item.id}`;
          expect(item.name.length, `${where}: name too long for the band`).toBeLessThanOrEqual(40);
          expect(item.kicker.length, `${where}: kicker`).toBeLessThanOrEqual(24);
          expect(item.body.length, `${where}: body`).toBeLessThanOrEqual(190);
          /* ⚠ EVERY FIGURE CARRIES THE DIAL'S DIAGONAL PAIR. It is the one
             piece of chrome all three share, so a stage without it is a stage
             drawn on a different instrument. */
          expect(item.visual.fix, `${where}: the dial's diagonal pair`).toHaveLength(2);
          for (const f of item.visual.fix) {
            expect(f.length, `${where}: fix too long for the corner`).toBeLessThanOrEqual(26);
            expect(f.trim().length, `${where}: an empty corner`).toBeGreaterThan(0);
          }
          if (item.visual.kind === "loop") {
            const stationIds = item.visual.stations.map((st) => st.id);
            expect(new Set(stationIds).size, `${where}: duplicate station`).toBe(stationIds.length);
            /* ⚠ `by` IS THE WHOLE READING — a filled node is the team's hand,
               an open one the model. A run that is all one or all the other
               has stopped drawing the distinction it exists for. */
            expect(
              item.visual.stations.some((st) => st.by === "team"),
              `${where}: no hand on the run`
            ).toBe(true);
            expect(
              item.visual.stations.some((st) => st.by === "model"),
              `${where}: nothing the model does`
            ).toBe(true);
            for (const st of item.visual.stations) {
              expect(st.name.length, `${where}/${st.id}: set on the ring`).toBeLessThanOrEqual(8);
            }
          }
          if (item.visual.kind === "handover") {
            expect(item.visual.inner.length, `${where}: the setup`).toBeLessThanOrEqual(16);
            expect(item.visual.outer.length, `${where}: the engagement`).toBeLessThanOrEqual(18);
            expect(item.visual.node.length, `${where}: the node`).toBeLessThanOrEqual(14);
          }
          /* ⚠ NO DIGIT ON ANY DRAWING — the house habit on every instrument.
             The image's own src and alt are addresses, not lettering. */
          scanArc(item.visual, where, (value, path) => {
            if (path.endsWith(".src") || path.endsWith(".alt")) return;
            expect(/\d/.test(value), `${path}: a figure on the drawing`).toBe(false);
          });
        }
      }
    }
  });

  it("a proof card is one Loop project, by reference, in the pile's own order (ADR-128)", () => {
    /* The homepage's folder card on a flowing page. The record is the Loop
       casefile's, resolved by the renderer the pile's own way; what the arc
       authors is WHICH track and in WHAT order — and the order is the record's
       (`PROOF_STACK_ORDER`, the arc steps), never a page preference. */
    const loop = getCase(PROOF_STACK_CASE);
    expect(loop, `the ${PROOF_STACK_CASE} casefile`).toBeTruthy();
    const tracks = loop!.casefile.tracks;
    for (const arc of ARCS) {
      const cards = arc.sections.filter((s) => s.kind === "proof-card");
      if (cards.length === 0) continue;
      const ids = cards.map((c) => c.track);
      expect(new Set(ids).size, `${arc.slug}: a project twice`).toBe(ids.length);
      for (const card of cards) {
        const at = `${arc.slug}/${card.id}`;
        const track = tracks.find((t) => t.id === card.track);
        expect(track, `${at}: "${card.track}" is not on the casefile`).toBeTruthy();
        /* The card letters `arc.title` as its title and `card.lede` under it;
           a track without both would render a card with a project name for a
           claim and no sentence — the pile requires the same two fields. */
        expect(track?.arc, `${at}: the track carries no arc line`).toBeTruthy();
        expect(track?.card, `${at}: the track carries no card lede`).toBeTruthy();
        /* An authored head is a masthead ABOVE the card and may not say what
           the card's own title says (the surface's said-twice rule). */
        if (card.head && track?.arc) {
          expect(
            arcTitleText(card.head.title).toLowerCase(),
            `${at}: the head repeats the card's title`
          ).not.toBe((card.title ?? track.arc.title).toLowerCase());
        }
        /* A page's own line for the card (the proposal's past tense, owner
           2026-09-28) fits the record's budget: ≤44 measured (the head is a
           `nowrap` bar), no digit, and never the record's line restated. */
        if (card.title !== undefined) {
          expect(card.title.length, `${at}: title`).toBeLessThanOrEqual(44);
          expect(card.title, `${at}: a digit on the card's title`).not.toMatch(/\d/);
          expect(card.title, `${at}: the override IS the record's line`).not.toBe(
            track?.arc?.title
          );
        }
      }
      /* The sequence is the pile's, filtered to what the page carries. */
      const expected = PROOF_STACK_ORDER.filter((id) => ids.includes(id));
      expect(ids, `${arc.slug}: proof cards out of the record's order`).toEqual(expected);
    }
  });

  it("a bench is one Skill and its evals, running, and it letters no figure (ADR-128 B2)", () => {
    /* Moira's `superRefine` as assertions, on the arcs' side of the copy. The
       renderer trusts the record for four things it cannot recover: that
       every result names a check IN THE CHECKS' ORDER (the rail reads them by
       index), that the verdict is the WORST of them (a verdict that
       disagrees with its own checks is the module's one lie), that a rule
       left FREE names no check (nobody checks it) while a fixed or adapted
       one names exactly one, and that the folder opens on `SKILL.md` and
       carries `evals/`. And no digit on the drawing but a `src` or an `alt`:
       a figure on a checker reads as a score, and a check returns a state. */
    const RANK: Record<string, number> = { pass: 0, review: 1, block: 2 };
    const STATES = Object.keys(RANK);
    const BANDS = ["fixed", "adapt", "free"];
    const KEYS = ["id", "kind", "menuLabel", "menuPrimary", "ariaLabel", "head", "example"];
    const onDisk = (src: string) => existsSync(join(process.cwd(), "public", src));
    const digits = (v: unknown, at: string) => {
      if (typeof v === "string") {
        expect(/\d/.test(v), `${at}: a figure on the drawing ("${v}")`).toBe(false);
      } else if (Array.isArray(v)) {
        v.forEach((x, i) => digits(x, `${at}[${i}]`));
      } else if (v && typeof v === "object") {
        for (const [key, x] of Object.entries(v)) {
          if (key === "src" || key === "alt") continue;
          digits(x, `${at}.${key}`);
        }
      }
    };
    for (const arc of ARCS) {
      for (const s of arc.sections) {
        if (s.kind !== "bench") continue;
        const at = `${arc.slug}/${s.id}`;
        for (const key of Object.keys(s))
          expect(KEYS, `${at}: unknown key "${key}"`).toContain(key);
        const ex = s.example;
        digits(ex, at);
        expect(ex.checks.length, `${at}: four checks`).toBe(4);
        const checkIds = ex.checks.map((c) => c.id);
        expect(new Set(checkIds).size, `${at}: a check twice`).toBe(4);
        for (const c of ex.checks) {
          expect(c.label.length, `${at}: check "${c.id}" label`).toBeLessThanOrEqual(16);
          expect(c.line.length, `${at}: check "${c.id}" line`).toBeLessThanOrEqual(110);
        }
        expect(ex.task.length, `${at}: task`).toBeLessThanOrEqual(130);
        expect(ex.inputs.length, `${at}: two or three inputs`).toBeGreaterThanOrEqual(2);
        expect(ex.inputs.length, `${at}: two or three inputs`).toBeLessThanOrEqual(3);
        expect(new Set(ex.inputs.map((i) => i.id)).size, `${at}: an input twice`).toBe(
          ex.inputs.length
        );
        for (const inp of ex.inputs) {
          const here = `${at}/${inp.id}`;
          expect(inp.label.length, `${here}: label`).toBeLessThanOrEqual(24);
          expect(inp.brief.length, `${here}: brief`).toBeLessThanOrEqual(160);
          expect(
            inp.results.map((r) => r.check),
            `${here}: one result per check, in the checks' order`
          ).toEqual(checkIds);
          for (const r of inp.results) {
            expect(STATES, `${here}: state "${r.state}"`).toContain(r.state);
            expect(r.note.length, `${here}: note on ${r.check}`).toBeLessThanOrEqual(90);
          }
          const worst = inp.results.reduce<string>(
            (w, r) => (RANK[r.state]! > RANK[w]! ? r.state : w),
            "pass"
          );
          expect(inp.verdict.state, `${here}: the verdict is the worst check`).toBe(worst);
          expect(inp.verdict.label.length, `${here}: verdict label`).toBeLessThanOrEqual(24);
          expect(inp.verdict.line.length, `${here}: verdict line`).toBeLessThanOrEqual(110);
          expect(inp.actions.length, `${here}: one or two actions`).toBeGreaterThanOrEqual(1);
          expect(inp.actions.length, `${here}: one or two actions`).toBeLessThanOrEqual(2);
          if (inp.output.kind === "image") {
            const { image, regions } = inp.output;
            expect(image.src.startsWith("/arcs/"), `${here}: ${image.src} under /arcs/`).toBe(true);
            expect(onDisk(image.src), `${here}: ${image.src} is not on disk`).toBe(true);
            expect(image.width > 0 && image.height > 0, `${here}: a sized image`).toBe(true);
            for (const r of regions) {
              expect(checkIds, `${here}: region "${r.label}" names an unknown check`).toContain(
                r.check
              );
              expect(
                r.left >= 0 && r.top >= 0 && r.left + r.width <= 100 && r.top + r.height <= 100,
                `${here}: region "${r.label}" leaves the picture`
              ).toBe(true);
              expect(r.label.length, `${here}: region "${r.label}"`).toBeLessThanOrEqual(14);
            }
          } else {
            const { text, marks } = inp.output;
            for (const m of marks) {
              expect(checkIds, `${here}: mark "${m.span}" names an unknown check`).toContain(
                m.check
              );
              expect(text.includes(m.span), `${here}: mark "${m.span}" is not in the text`).toBe(
                true
              );
              expect(STATES, `${here}: mark state`).toContain(m.state);
            }
          }
        }
        expect(ex.skill.files[0]?.name, `${at}: the folder opens on SKILL.md`).toBe("SKILL.md");
        expect(
          ex.skill.files.some((f) => f.name === "evals/"),
          `${at}: a Skill without evals/ is a prompt`
        ).toBe(true);
        for (const f of ex.skill.files) {
          expect(f.line.length, `${at}: ${f.name}`).toBeLessThanOrEqual(140);
          if (f.image) {
            expect(f.image.src.startsWith("/arcs/"), `${at}: ${f.image.src} under /arcs/`).toBe(
              true
            );
            expect(onDisk(f.image.src), `${at}: ${f.image.src} is not on disk`).toBe(true);
          }
        }
        expect(ex.rules.length, `${at}: three to six rules`).toBeGreaterThanOrEqual(3);
        expect(ex.rules.length, `${at}: three to six rules`).toBeLessThanOrEqual(6);
        for (const r of ex.rules) {
          expect(BANDS, `${at}: band "${r.band}"`).toContain(r.band);
          expect(r.line.length, `${at}: rule "${r.line}"`).toBeLessThanOrEqual(110);
          if (r.band === "free") {
            expect(r.check, `${at}: a free rule names a check ("${r.line}")`).toBeUndefined();
          } else {
            expect(r.check, `${at}: rule "${r.line}" names no check`).toBeTruthy();
            expect(checkIds, `${at}: rule "${r.line}" names an unknown check`).toContain(r.check);
          }
        }
        expect(ex.cases.length, `${at}: two to four cases`).toBeGreaterThanOrEqual(2);
        expect(ex.cases.length, `${at}: two to four cases`).toBeLessThanOrEqual(4);
        for (const c of ex.cases) {
          expect(c.checks.length, `${at}: case "${c.id}" names no check`).toBeGreaterThan(0);
          for (const id of c.checks) expect(checkIds, `${at}: case "${c.id}"`).toContain(id);
          if (c.expect) expect(STATES, `${at}: case "${c.id}" expects`).toContain(c.expect);
          expect(c.label.length, `${at}: case "${c.id}" label`).toBeLessThanOrEqual(32);
          expect(c.line.length, `${at}: case "${c.id}" line`).toBeLessThanOrEqual(130);
        }
        expect(ex.record.length, `${at}: record`).toBeLessThanOrEqual(240);
      }
    }
  });

  it("a path is a dated record of real frames, on disk (ADR-134)", () => {
    /* The renderer trusts the record for the frames it lays out: each one is
       under `/arcs/` and on disk (a missing file is an empty cell nobody sees
       as an error), sized, and every stage dated and named. */
    const onDisk = (src: string) => existsSync(join(process.cwd(), "public", src));
    for (const arc of ARCS) {
      for (const s of arc.sections) {
        if (s.kind !== "path") continue;
        const at = `${arc.slug}/${s.id}`;
        expect(s.stages.length, `${at}: three or four stages`).toBeGreaterThanOrEqual(3);
        expect(s.stages.length, `${at}: three or four stages`).toBeLessThanOrEqual(4);
        expect(new Set(s.stages.map((x) => x.id)).size, `${at}: a stage twice`).toBe(
          s.stages.length
        );
        for (const st of s.stages) {
          const here = `${at}/${st.id}`;
          expect(st.date.trim().length, `${here}: undated`).toBeGreaterThan(0);
          expect(st.label.length, `${here}: label`).toBeLessThanOrEqual(16);
          expect(st.name.length, `${here}: name`).toBeLessThanOrEqual(60);
          expect(st.images.length, `${here}: one to ten frames`).toBeGreaterThan(0);
          expect(st.images.length, `${here}: one to ten frames`).toBeLessThanOrEqual(10);
          for (const img of st.images) {
            expect(img.src.startsWith("/arcs/"), `${here}: ${img.src} under /arcs/`).toBe(true);
            expect(onDisk(img.src), `${here}: ${img.src} is not on disk`).toBe(true);
            expect(img.width > 0 && img.height > 0, `${here}: a sized frame`).toBe(true);
            expect(img.alt.trim().length, `${here}: ${img.src} has no alt`).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("a syllabus is one track: phases tile the classes, every class a full sheet (ADR-134)", () => {
    /* The renderer trusts the record for what it cannot recover: that each
       phase holds ONE consecutive run of classes (the brackets span a range,
       so a phase split in two would bracket the classes between), that every
       class names a phase that exists, that a station's name fits its column,
       that the fork has exactly two ways in, and that a worked-example link
       lands on a section of this page. */
    const GLYPHS = ["setup", "board", "wall", "offer", "poster", "site", "film", "launch"];
    for (const arc of ARCS) {
      const ids = new Set(arc.sections.map((x) => x.id));
      for (const s of arc.sections) {
        if (s.kind !== "syllabus") continue;
        const at = `${arc.slug}/${s.id}`;
        expect(s.classes.length, `${at}: three to twelve classes`).toBeGreaterThanOrEqual(3);
        expect(s.classes.length, `${at}: three to twelve classes`).toBeLessThanOrEqual(12);
        expect(s.entry.ways.length, `${at}: two ways in`).toBe(2);
        expect(s.launch.items.length, `${at}: one to three things launched`).toBeGreaterThan(0);
        expect(s.launch.items.length, `${at}: one to three things launched`).toBeLessThanOrEqual(3);
        const phaseIds = s.phases.map((p) => p.id);
        expect(new Set(phaseIds).size, `${at}: a phase twice`).toBe(phaseIds.length);
        expect(new Set(s.classes.map((c) => c.id)).size, `${at}: a class twice`).toBe(
          s.classes.length
        );
        /* The phases, read off the classes in order, are the phase list. */
        const runs = s.classes
          .map((c) => c.phase)
          .filter((p, i, all) => i === 0 || all[i - 1] !== p);
        expect(runs, `${at}: each phase one consecutive run, in the phases' order`).toEqual(
          phaseIds
        );
        for (const c of s.classes) {
          const here = `${at}/${c.id}`;
          expect(c.name.length, `${here}: name`).toBeLessThanOrEqual(16);
          expect(GLYPHS, `${here}: glyph "${c.glyph}"`).toContain(c.glyph);
          for (const key of ["objective", "make", "gate", "tool"] as const) {
            expect(c[key].trim().length, `${here}: ${key}`).toBeGreaterThan(0);
            expect(c[key].length, `${here}: ${key}`).toBeLessThanOrEqual(150);
          }
          if (c.example) {
            expect(c.example.href.startsWith("#"), `${here}: example is on this page`).toBe(true);
            expect(ids.has(c.example.href.slice(1)), `${here}: ${c.example.href} missing`).toBe(
              true
            );
          }
          /* A class's own page is another registered arc, linked at its
             root (ADR-136): a gated arc loads through /unlock and drops a
             fragment, so a fragment here would be a link to nowhere. */
          if (c.page) {
            expect(c.page.href, `${here}: page is an arc's root`).toMatch(/^\/arcs\/[a-z0-9-]+$/);
            expect(arcSlugs(), `${here}: ${c.page.href} is not a registered arc`).toContain(
              c.page.href.slice("/arcs/".length)
            );
            expect(c.page.label.trim().length, `${here}: page label`).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("the workshop's framing kinds hold their records (ADR-130)", () => {
    /* Four leaves and one layout, each with a fixed geometry and authored
       words. What is pinned is what the drawings assume and cannot check at
       render time: the counts the geometry is built for, the one lit object,
       the gate order, measures a label was set against, and NO DIGIT on an
       instrument's lettering (the house habit; the curve's years excepted,
       as on the program board). */
    const noDigits = (value: unknown, at: string) =>
      scanArc(value, at, (s, p) => expect(s, `${p} letters a digit`).not.toMatch(/\d/));

    for (const arc of ARCS) {
      const ids = new Set(arc.sections.map((s) => s.id));
      for (const s of arc.sections) {
        const at = `${arc.slug}#${s.id}`;

        if (s.kind === "list-groups" && s.layout === "readout") {
          expect(s.groups, `${at}: two panels`).toHaveLength(2);
          for (const g of s.groups) {
            expect(g.foot, `${at}/${g.id}: a readout plate ends on its foot`).toBeDefined();
            for (const item of g.items) {
              expect(item.tag, `${at}/${item.id}: a readout row has a key`).toBeTruthy();
              expect(item.name.length, `${at}/${item.id}: value`).toBeLessThanOrEqual(40);
              expect(item.body, `${at}/${item.id}: no prose inside a panel`).toBeUndefined();
              if (item.href) {
                expect(item.href, `${at}/${item.id}: an in-page link`).toMatch(/^#/);
                expect(ids.has(item.href.slice(1)), `${at}/${item.id}: ${item.href}`).toBe(true);
              }
            }
          }
        }

        if (s.kind === "stages") {
          const lit = s.stages.filter((st) => st.lit);
          expect(lit, `${at}: exactly one lit stage`).toHaveLength(1);
          expect(s.stages[2].lit, `${at}: the lit stage is the last`).toBe(true);
          expect(new Set(s.stages.map((st) => st.id)).size, `${at}: ids`).toBe(3);
          for (const st of s.stages) {
            expect(st.label.length, `${at}/${st.id}: label`).toBeLessThanOrEqual(14);
            expect(st.name.length, `${at}/${st.id}: name`).toBeLessThanOrEqual(40);
            expect(st.body.length, `${at}/${st.id}: body`).toBeLessThanOrEqual(130);
          }
          noDigits({ axes: s.axes, ends: s.ends, stages: s.stages }, at);
        }

        if (s.kind === "curve") {
          /* ADR-130 U5: the Moira workshop's curve, ported. Three lanes in
             the house order, each naming at least one model with a list
             price in and out; the other vendor's points sit on the curve. */
          expect(
            s.lanes.map((l) => l.id),
            `${at}: the three lanes in order`
          ).toEqual(["fast", "everyday", "frontier"]);
          for (const lane of s.lanes) {
            expect(lane.models.length, `${at}/${lane.id}: a model`).toBeGreaterThan(0);
            for (const m of lane.models) {
              expect(m.input > 0 && m.output > m.input, `${at}/${m.name}: prices`).toBe(true);
            }
          }
          for (const series of s.others) {
            for (const p of series.points) {
              expect(p.t > 0 && p.t < 1, `${at}/${p.model.name}: on the curve`).toBe(true);
              expect(p.model.output > p.model.input, `${at}/${p.model.name}: prices`).toBe(true);
            }
          }
          expect(s.effort.levels, `${at}: three effort levels`).toHaveLength(3);
          expect(s.note.length, `${at}: the note is the figure's licence`).toBeGreaterThan(0);
          noDigits({ axes: s.axes, step: s.step, effort: s.effort, show: s.prices.show }, at);
        }

        if (s.kind === "horizon") {
          expect(
            s.agent.gates.map((g) => g.kind),
            `${at}: the gates in order`
          ).toEqual(["check", "retry", "ask"]);
          const ats = s.agent.gates.map((g) => g.at);
          expect(ats, `${at}: gates sorted`).toEqual([...ats].sort((a, b) => a - b));
          for (const a of ats) expect(a > 0 && a < 1, `${at}: gate inside the run`).toBe(true);
          // ONE top track: Moira's operated tool, or the owner's upstream
          // day (ADR-133 U2), and the owner's plate only beside the latter.
          expect(
            Number(Boolean(s.operated)) + Number(Boolean(s.upstream)),
            `${at}: exactly one top track`
          ).toBe(1);
          if (s.owner)
            expect(s.upstream, `${at}: an owner plate needs the upstream track`).toBeDefined();
          if (s.operated) {
            expect(Number.isInteger(s.operated.steps), `${at}: steps`).toBe(true);
            expect(s.operated.steps).toBeGreaterThanOrEqual(6);
            expect(s.operated.steps).toBeLessThanOrEqual(10);
          }
          if (s.upstream) {
            for (const span of s.upstream.spans) {
              expect(span.length, `${at}: a span`).toBeLessThanOrEqual(20);
            }
          }
          for (const g of s.agent.gates) {
            expect(g.label.length, `${at}/${g.kind}: label`).toBeLessThanOrEqual(32);
          }
          // The owned reading draws no time axis (U4).
          if (s.upstream)
            expect(s.axis, `${at}: the owned reading carries no axis`).toBeUndefined();
          noDigits(
            {
              axis: s.axis ?? {},
              operated: s.operated ? { ...s.operated, steps: "" } : {},
              upstream: s.upstream ?? {},
              owner: s.owner ?? {},
              agent: s.agent,
            },
            at
          );
        }

        if (s.kind === "questions") {
          const all = [...s.left, ...s.right];
          expect(new Set(all.map((q) => q.id)).size, `${at}: six unique questions`).toBe(6);
          const litIdx = s.left.flatMap((q, i) => (q.lit ? [i] : []));
          expect(
            s.right.some((q) => q.lit),
            `${at}: the lit pair is on the left`
          ).toBe(false);
          expect(litIdx, `${at}: two lit, adjacent`).toHaveLength(2);
          expect(litIdx[1] - litIdx[0], `${at}: the lit pair is adjacent`).toBe(1);
          expect(all.filter((q) => q.human).length, `${at}: one owner`).toBeLessThanOrEqual(1);
          expect(s.tag.length, `${at}: tag`).toBeLessThanOrEqual(22);
          expect(s.work.name.length, `${at}: the work's name`).toBeLessThanOrEqual(24);
          for (const q of all) {
            expect(q.answer.length, `${at}/${q.id}: answer`).toBeLessThanOrEqual(60);
            expect(q.question.length, `${at}/${q.id}: question`).toBeLessThanOrEqual(24);
          }
          if (s.work.image) {
            expect(s.work.image.src, `${at}: the work's image`).toMatch(/^\/arcs\//);
            expect(
              existsSync(join(process.cwd(), "public", s.work.image.src)),
              `${at}: ${s.work.image.src} on disk`
            ).toBe(true);
          }
          noDigits({ work: { ...s.work, image: undefined }, left: s.left, right: s.right }, at);
        }
      }
    }
  });

  it("the class-one frame holds its records (ADR-136)", () => {
    /* Three more of the Moira workshop's beats, ported by hand, and the
       stages' example line. Pinned: the counts each drawing is built for,
       the one open row and where it sits, a signal only after the board it
       reads, and NO DIGIT on an instrument's lettering — with the one
       exception a dated clipping earns (ADR-078 U1: a dated log row may
       state a count, so a card's corner, kicker, title, dek and date may
       carry figures while the column heads and the card's mark and tag may
       not). */
    const noDigits = (value: unknown, at: string) =>
      scanArc(value, at, (s, p) => expect(s, `${p} letters a digit`).not.toMatch(/\d/));

    for (const arc of ARCS) {
      let board = false;
      for (const s of arc.sections) {
        const at = `${arc.slug}#${s.id}`;
        if (s.kind === "questions") board = true;

        if (s.kind === "stages") {
          const examples = s.stages.filter((st) => st.example !== undefined);
          expect([0, 3], `${at}: every stage carries an example, or none does`).toContain(
            examples.length
          );
          expect(Boolean(s.own), `${at}: \`own\` present iff the stages carry examples`).toBe(
            examples.length === 3
          );
          if (s.own) expect(s.own.length, `${at}: own`).toBeLessThanOrEqual(24);
          for (const st of examples) {
            expect(st.example?.length ?? 0, `${at}/${st.id}: example`).toBeLessThanOrEqual(48);
          }
          noDigits({ own: s.own ?? "" }, at);
        }

        if (s.kind === "spectrum") {
          expect(s.poles, `${at}: two poles`).toHaveLength(2);
          for (const p of s.poles) {
            expect(p.lines, `${at}/${p.label}: three lines`).toHaveLength(3);
            expect(p.label.length, `${at}/${p.label}: label`).toBeLessThanOrEqual(16);
            expect(p.head.length, `${at}/${p.label}: head`).toBeLessThanOrEqual(28);
            for (const l of p.lines) {
              expect(l.length, `${at}/${p.label}: line`).toBeLessThanOrEqual(48);
            }
          }
          expect(s.middle.label.length, `${at}: middle label`).toBeLessThanOrEqual(24);
          expect(s.middle.head.length, `${at}: middle head`).toBeLessThanOrEqual(28);
          expect(s.middle.line.length, `${at}: middle line`).toBeLessThanOrEqual(96);
          for (const b of [s.bands.start, s.bands.end]) {
            expect(b.length, `${at}: band`).toBeLessThanOrEqual(16);
          }
          noDigits({ poles: s.poles, middle: s.middle, bands: s.bands }, at);
        }

        if (s.kind === "resource") {
          expect(s.rows, `${at}: four rows`).toHaveLength(4);
          expect(new Set(s.rows.map((r) => r.id)).size, `${at}: row ids`).toBe(4);
          expect(
            s.rows.filter((r) => r.open),
            `${at}: exactly one open row`
          ).toHaveLength(1);
          expect(s.rows[3].open, `${at}: the open row is the last`).toBe(true);
          for (const r of s.rows) {
            expect(r.misses !== undefined, `${at}/${r.id}: misses iff open`).toBe(r.open === true);
            expect(r.resource.length, `${at}/${r.id}: resource`).toBeLessThanOrEqual(16);
            expect(r.unit.length, `${at}/${r.id}: unit`).toBeLessThanOrEqual(12);
            expect(r.tells.length, `${at}/${r.id}: tells`).toBeLessThanOrEqual(56);
            if (r.misses) expect(r.misses.length, `${at}/${r.id}: misses`).toBeLessThanOrEqual(56);
          }
          expect(s.columns, `${at}: three columns`).toHaveLength(3);
          noDigits({ columns: s.columns, rows: s.rows }, at);
        }

        if (s.kind === "signal") {
          expect(board, `${at}: a signal follows the board it reads`).toBe(true);
          expect(
            s.columns.map((c) => c.plate),
            `${at}: the board's order`
          ).toEqual(["context", "evals"]);
          const cardIds = s.columns.flatMap((c) => c.cards.map((card) => card.id));
          expect(new Set(cardIds).size, `${at}: card ids`).toBe(4);
          for (const c of s.columns) {
            expect(c.cards, `${at}/${c.id}: two clippings`).toHaveLength(2);
            noDigits({ label: c.label, line: c.line }, `${at}/${c.id}`);
            for (const card of c.cards) {
              expect(card.href, `${at}/${card.id}: https`).toMatch(/^https:\/\/\S+$/);
              expect(card.dek.length, `${at}/${card.id}: dek parts`).toBeGreaterThanOrEqual(1);
              expect(card.dek.length, `${at}/${card.id}: dek parts`).toBeLessThanOrEqual(6);
              for (const k of ["source", "date", "title", "kicker", "corner"] as const) {
                expect(card[k].trim().length, `${at}/${card.id}: ${k}`).toBeGreaterThan(0);
              }
              noDigits({ mark: card.mark, tag: card.tag }, `${at}/${card.id}`);
            }
          }
          expect(s.caption.length, `${at}: caption`).toBeLessThanOrEqual(220);
        }
      }
    }
  });

  it("the course and its class share the worked example and the curve by reference (ADR-136)", () => {
    /* One record, two pages: the course's Tom on the Moon path and bench
       and the class-one deck's are the same objects, and the archetype's
       frontier curve and the class's are the same lanes — so a reprice or a
       re-pinned anchor lands on both pages at once, and a copy typed on one
       fails here. */
    for (const arc of [AI_STORYTELLING_ARC, AI_STORYTELLING_CLASS_1_ARC]) {
      const path = arc.sections.find((s) => s.kind === "path");
      expect(path?.kind === "path" && path.stages, `${arc.slug}: the Tom path`).toBe(
        TOM_PATH_STAGES
      );
      const bench = arc.sections.find((s) => s.kind === "bench");
      expect(bench?.kind === "bench" && bench.example, `${arc.slug}: the Tom bench`).toBe(
        TOM_BENCH_EXAMPLE
      );
    }
    for (const arc of [THOUGHTFORM_WORKSHOP_ARC, AI_STORYTELLING_CLASS_1_ARC]) {
      const curve = arc.sections.find((s) => s.kind === "curve");
      expect(curve?.kind === "curve" && curve.lanes, `${arc.slug}: the frontier record`).toBe(
        FRONTIER_CURVE.lanes
      );
    }
  });

  it("a proposal holds the client-facing copy law (ADR-098)", () => {
    /* A proposal is read by the person being asked to buy it, so the deck's
       own law applies to every string on the page: say the behaviour, never
       the house's word for it. The fleet's vocabulary is internal and must
       not leak onto a client's page; `—` is banned by the deck's copy law
       and would be the one character on the surface nobody chose. */
    /* The bans live in `lib/arcs/copyLaw.ts` (ADR-098 U2), because a second
       surface reads them: the Trinny pitch page's offer is the same beats
       OUTSIDE `ARCS`, and `tests/lib/trinny-offer.test.ts` walks it with the
       same list. One law, two readers. */
    const banned = PROPOSAL_COPY_BANS;
    const offenders: string[] = [];
    for (const arc of ARCS) {
      if (arc.format !== "proposal") continue;
      scanArc(arc, arc.slug, (value, path) => {
        /* ⚠ `meta.title` IS EXEMPT, and only it. Every arc's tab title is
           `<name> — Thoughtform`; that dash is the site's own convention
           and predates this law, so pinning it here would ask one page to
           spell its tab differently from the other five. The law is about
           the copy a reader reads on the page. */
        if (path.endsWith(".meta.title")) return;
        for (const [pattern, what] of banned) {
          if (pattern.test(value)) offenders.push(`${path}: ${what}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it("a locked arc carries its hand-written route rows (ADR-098)", () => {
    /* Nothing derives either list, which is the whole point of them — so
       nothing but this would say an arc had asked for a lock it never got.
       A locked route that is missing its row renders dark on first paint
       and flips to light after hydration. */
    for (const arc of ARCS) {
      if (arc.theme !== "light") continue;
      expect(
        [...LIGHT_LOCKED_ROUTES],
        `${arc.slug}: theme "light" with no LIGHT_LOCKED_ROUTES row`
      ).toContain(`/arcs/${arc.slug}`);
    }
    for (const arc of ARCS) {
      if (arc.hero.plate !== "gateway") continue;
      expect([...HERO_ROUTES], `${arc.slug}: the gateway plate with no HERO_ROUTES row`).toContain(
        `/arcs/${arc.slug}`
      );
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

  it("every engagement carries its filing date, and the order agrees with it (ADR-118)", () => {
    /* ADR-098 refused a date that "only ever feeds a sort" — a second place
       for the order to be wrong. The date feeds the overview's MONITOR now,
       a plot, so it exists; and the registry's order is checked AGAINST it
       rather than standing beside it as a second fact. */
    const ISO = /^\d{4}-\d{2}-\d{2}$/;
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const valid = (iso: string) => {
      const [y, m, d] = iso.split("-").map(Number);
      const t = new Date(Date.UTC(y, m - 1, d));
      return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
    };
    const dated: { id: string; date: string; client?: string }[] = [
      ...ARCS.map((a) => ({ id: a.slug, date: a.date, client: a.client })),
      ...CLIENTS.flatMap((c) =>
        (c.pages ?? []).map((p) => ({ id: p.href, date: p.date, client: c.slug }))
      ),
    ];
    for (const { id, date, client } of dated) {
      expect(date, `${id}: date`).toMatch(ISO);
      expect(valid(date), `${id}: ${date} is a real day`).toBe(true);
      expect(date <= tomorrow, `${id}: ${date} is in the future`).toBe(true);
      const since = client ? getClient(client)?.since : undefined;
      if (since)
        expect(date.slice(0, 4) >= since, `${id}: filed before its client's since`).toBe(true);
    }
    // Inside a client the registry is newest first, and the dates must agree.
    for (const c of CLIENTS) {
      const dates = arcsOf(c.slug).map((a) => a.date);
      expect([...dates].sort().reverse(), `${c.slug}: arcs newest first`).toEqual(dates);
    }
  });

  it("a terminal cut files its OWN date, never its v1's by the spread (ADR-118)", () => {
    /* The v2 modules spread their v1 wholesale, so a v2 that authored no
       date would silently inherit v1's and plot on top of it. */
    const pairs: readonly [string, string][] = [
      ["claude-workshop", "claude-workshop-v2"],
      ["ai-keynote", "ai-keynote-v2"],
    ];
    for (const [v1Slug, v2Slug] of pairs) {
      const v1 = getArc(v1Slug)!;
      const v2 = getArc(v2Slug)!;
      expect(v2.date >= v1.date, `${v2Slug} is dated no earlier than ${v1Slug}`).toBe(true);
      const src = readFileSync(
        join(__dirname, "..", "..", "lib", "arcs", "content", `${v2Slug}.ts`),
        "utf8"
      );
      expect(src, `${v2Slug} authors its own date`).toMatch(/^\s*date: "\d{4}-\d{2}-\d{2}",$/m);
    }
  });
});

describe("the hero-board kind (ADR-137)", () => {
  it("every lit set is one side and adjacent, or its frame encloses an unlit plate", () => {
    for (const arc of ARCS) {
      for (const section of arc.sections) {
        if (section.kind !== "hero-board") continue;
        expect(litIsFramable(section.lit), `${arc.slug} / ${section.id}`).toBe(true);
      }
    }
  });
});

describe("the worked-example switch (ADR-139)", () => {
  it("every group is contiguous, and every group offers the same choices in the same order", () => {
    /* The pick is PAGE-WIDE: the island writes one id on the arc root and
       every group reads it. So a group that offered a different set, or the
       same set in a different order, would leave a beat blank the moment a
       reader chose from another one. Contiguity is what lets the renderer
       gather a run without scanning the whole array. */
    for (const arc of ARCS) {
      const groups = new Map<string, { ids: string[]; labels: string[]; at: number[] }>();
      arc.sections.forEach((section, i) => {
        const worked = section.worked;
        if (!worked) return;
        const g = groups.get(worked.group) ?? { ids: [], labels: [], at: [] };
        g.ids.push(worked.id);
        g.labels.push(worked.label);
        g.at.push(i);
        groups.set(worked.group, g);
      });
      if (groups.size === 0) continue;

      let shape: string | null = null;
      for (const [name, g] of groups) {
        const at = `${arc.slug}#${name}`;
        expect(new Set(g.ids).size, `${at}: an example appears twice in one group`).toBe(
          g.ids.length
        );
        expect(g.ids.length, `${at}: a group of one is not a switch`).toBeGreaterThan(1);
        for (const label of g.labels) {
          expect(label.length, `${at}: a tab label over the measure`).toBeLessThanOrEqual(24);
        }
        /* Contiguous: the indices are a run. */
        for (let i = 1; i < g.at.length; i++) {
          expect(g.at[i], `${at}: the group is interrupted at ${g.at[i]}`).toBe(g.at[i - 1] + 1);
        }
        /* Every group, the same choices, in the same order. */
        const here = g.ids.map((id, i) => `${id}|${g.labels[i]}`).join(" · ");
        if (shape === null) shape = here;
        else expect(here, `${at}: a different set of examples from the first group`).toBe(shape);

        /* Only the FIRST panel is the page's: the drawer would otherwise
           carry the beat three times, and the chapter row is capped at five. */
        for (const [i, index] of g.at.entries()) {
          const s = arc.sections[index];
          if (i === 0) continue;
          expect(s.menuLabel, `${at}: a panel after the first takes a menu row`).toBeUndefined();
          expect(s.menuPrimary, `${at}: a panel after the first is a chapter`).toBeUndefined();
        }
      }
    }
  });
});

describe("the second cut's four kinds (ADR-139)", () => {
  /* The house habit: the guard is written even where only one arc carries
     the kind, so a second page can adopt it without the walk arriving a
     commit late. NO DIGIT on an instrument's lettering, as every drawing
     before these. */
  const noDigits = (value: unknown, at: string) =>
    scanArc(value, at, (s, p) => expect(s, `${p} letters a digit`).not.toMatch(/\d/));

  it("the ground names no vendor, and reads from a plinth nobody writes", () => {
    for (const arc of ARCS) {
      for (const s of arc.sections) {
        if (s.kind !== "ground") continue;
        const at = `${arc.slug}#${s.id}`;
        expect(s.shelf.items.length, `${at}: the shelf`).toBeGreaterThanOrEqual(3);
        expect(s.shelf.items.length, `${at}: the shelf`).toBeLessThanOrEqual(5);
        expect(new Set(s.shelf.items.map((i) => i.id)).size, `${at}: duplicate shelf id`).toBe(
          s.shelf.items.length
        );
        for (const item of s.shelf.items) {
          expect(item.name.length, `${at}/${item.id}: name`).toBeLessThanOrEqual(32);
          expect(item.cost.length, `${at}/${item.id}: cost`).toBeLessThanOrEqual(40);
        }
        for (const course of [s.floor.reach, s.floor.steer]) {
          expect(course.tag.length, `${at}: a course tag`).toBeLessThanOrEqual(20);
          expect(course.items.length, `${at}: a course's items`).toBeGreaterThanOrEqual(2);
          expect(course.items.length, `${at}: a course's items`).toBeLessThanOrEqual(4);
        }
        expect(s.floor.base.name.length, `${at}: the plinth's name`).toBeLessThanOrEqual(32);
        /* The drawing letters no figure; the note under it is prose and may. */
        noDigits(s.shelf, `${at}.shelf`);
        noDigits(s.floor, `${at}.floor`);
      }
    }
  });

  it("a plugin board lights exactly the two plates the team writes, and ties every one to a question", () => {
    for (const arc of ARCS) {
      for (const s of arc.sections) {
        if (s.kind !== "plugin-board") continue;
        const at = `${arc.slug}#${s.id}`;
        expect(new Set(s.parts.map((p) => p.id)).size, `${at}: duplicate part id`).toBe(4);
        const lit = s.parts.filter((p) => p.lit);
        expect(lit.length, `${at}: gold is what the team writes, and that is two`).toBe(2);
        expect(
          [s.parts[0].lit, s.parts[1].lit],
          `${at}: the lit pair is the FIRST two, or a reader is told the team writes its connectors`
        ).toEqual([true, true]);
        for (const p of s.parts) {
          expect(p.name.length, `${at}/${p.id}: name`).toBeLessThanOrEqual(20);
          expect(p.line.length, `${at}/${p.id}: line`).toBeLessThanOrEqual(64);
          /* ⚠ THE TIE IS THE BEAT. Without it this is a folder diagram. */
          expect(p.answers.length, `${at}/${p.id}: answers`).toBeGreaterThan(0);
          expect(p.answers.length, `${at}/${p.id}: answers`).toBeLessThanOrEqual(24);
        }
        for (const n of s.above) {
          expect(n.name.length, `${at}/${n.id}: name`).toBeLessThanOrEqual(24);
          expect(n.line.length, `${at}/${n.id}: line`).toBeLessThanOrEqual(72);
        }
        expect(s.bar.answers.length, `${at}: the bar answers one`).toBeGreaterThan(0);
        noDigits(s.parts, `${at}.parts`);
        noDigits(s.above, `${at}.above`);
        noDigits(s.centre, `${at}.centre`);
      }
    }
  });

  it("a skill file marks one, two and three down the file, and answers each once", () => {
    for (const arc of ARCS) {
      for (const s of arc.sections) {
        if (s.kind !== "skill-file") continue;
        const at = `${arc.slug}#${s.id}`;
        expect(new Set(s.lines.map((l) => l.id)).size, `${at}: duplicate line id`).toBe(
          s.lines.length
        );
        const marks = s.lines.filter((l) => l.mark).map((l) => l.mark as number);
        expect(marks, `${at}: exactly one line per note, in order down the file`).toEqual([
          1, 2, 3,
        ]);
        expect(
          s.notes.map((n) => n.n),
          `${at}: the notes answer the marks, in order`
        ).toEqual([1, 2, 3]);
        for (const l of s.lines) {
          expect(l.text.length, `${at}/${l.id}: a line past the measure`).toBeLessThanOrEqual(240);
          if (l.key !== undefined) {
            expect(l.as, `${at}/${l.id}: a key outside the front matter`).toBe("meta");
          }
        }
        for (const n of s.notes) {
          expect(n.title.length, `${at}/${n.id}: title`).toBeLessThanOrEqual(32);
          expect(n.body.length, `${at}/${n.id}: body`).toBeLessThanOrEqual(240);
        }
        expect(s.folder.items.length, `${at}: the folder`).toBeGreaterThanOrEqual(2);
        expect(s.folder.items.length, `${at}: the folder`).toBeLessThanOrEqual(6);
      }
    }
  });

  it("a conversation opens on a person, and its column matches its reading", () => {
    for (const arc of ARCS) {
      for (const s of arc.sections) {
        if (s.kind !== "chat") continue;
        const at = `${arc.slug}#${s.id}`;
        expect(s.thread.turns.length, `${at}: turns`).toBeGreaterThanOrEqual(2);
        expect(s.thread.turns.length, `${at}: turns`).toBeLessThanOrEqual(6);
        expect(new Set(s.thread.turns.map((t) => t.id)).size, `${at}: duplicate turn id`).toBe(
          s.thread.turns.length
        );
        /* ⚠ A PERSON SPEAKS FIRST. A panel that opens on Claude is a page
           telling the room something happened on its behalf. */
        expect(s.thread.turns[0].kind, `${at}: a conversation opens on the person`).toBe("you");
        expect(
          s.aside.kind,
          `${at}: the menu stands beside "ask", the steps beside "feedback"`
        ).toBe(s.variant === "ask" ? "menu" : "steps");
        if (s.aside.kind === "menu") {
          expect(s.aside.items.length, `${at}: the menu`).toBeGreaterThanOrEqual(3);
          expect(s.aside.items.length, `${at}: the menu`).toBeLessThanOrEqual(8);
          expect(
            s.aside.items.filter((i) => i.on).length,
            `${at}: exactly one skill is picked in the menu`
          ).toBe(1);
        } else {
          expect(s.aside.items.length, `${at}: sorted, decided, drafted, delivered`).toBe(4);
        }
        /* ⚠ THE FEEDBACK READING SHOWS THE ASK BEFORE THE FILE. */
        if (s.variant === "feedback") {
          const blocks = s.thread.turns.flatMap((t) => (t.kind === "claude" ? t.blocks : []));
          expect(
            blocks.some((b) => b.kind === "issue"),
            `${at}: nothing is filed without showing the reader exactly what`
          ).toBe(true);
        }
      }
    }
  });
});
