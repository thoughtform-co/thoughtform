import { describe, expect, it } from "vitest";

import { PROOF_GLYPHS } from "@/components/landing/home-v2/services/casefile/proofGlyphData";
import { skillSymbol } from "@/components/landing/home-v2/services/casefile/skillSymbol";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { AI_KEYNOTE_ARC } from "@/lib/arcs/content/ai-keynote";
import { BOARD_CHIP_SLOTS } from "@/components/landing/home-v2/services/casefile/map/mapProjection";
import { CASES, caseBeatMenu, caseSlugs, getCase } from "@/lib/cases/registry";
import type { CaseSegment } from "@/lib/cases/types";

/**
 * Case registry integrity (ADR-054) — the contracts the `#proof` station
 * generator relies on:
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
/** Model families never travel to a public surface (owner, 2026-08-03). */
const MODEL_FAMILIES = /\b(opus|sonnet|haiku|fable|gpt|gemini|llama|mistral|claude)\b/i;

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

  // (The lockstep guard on `CorridorSectionMenu`'s hardcoded PROOF subs
  // retired with the menu itself — ADR-055 dropped subsections, so there
  // is no longer a duplicate of `caseBeatMenu` to keep honest. The shape
  // test above stays: it is a registry data guard in its own right.)

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
      // The casefile TRACKS carry media too (`stills` / `films`, ADR-056).
      // This loop used to walk beats only, which left every track asset
      // unguarded — a remote or mistyped src would have shipped silently.
      for (const t of c.casefile.tracks) {
        if (t.visual.kind === "stills") {
          for (const shot of t.visual.shots) {
            expect(ok(shot.src), `${c.slug}/${t.id} still ${shot.src}`).toBe(true);
          }
        }
        if (t.visual.kind === "films") {
          for (const film of t.visual.films) {
            // Self-hosted only: CSP is `media-src 'self' blob:`, so a bucket
            // URL here is blocked the moment CSP leaves report-only.
            expect(ok(film.src), `${c.slug}/${t.id} film ${film.src}`).toBe(true);
            expect(ok(film.poster), `${c.slug}/${t.id} poster ${film.poster}`).toBe(true);
          }
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

  /* ── The casefile (ADR-056) ─────────────────────────────────────────
     The guards that were proven on the lab data before promotion. The
     casefile is the LIVE surface now, so these run against the registry. */

  it("every case opens on a track, with unique anchorable track ids", () => {
    for (const c of CASES) {
      expect(c.casefile.tracks.length).toBeGreaterThan(0);
      const ids = c.casefile.tracks.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("every track carries one proof register plus its context and source", () => {
    for (const c of CASES) {
      for (const t of c.casefile.tracks) {
        // EXACTLY ONE PROOF MODEL. Legacy readouts normalize into the same
        // register; carrying both leaves renderer precedence ambiguous.
        expect(
          Boolean(t.readouts) !== Boolean(t.blocks),
          `${c.slug}/${t.id} must carry readouts OR blocks, not both or neither`
        ).toBe(true);
        if (t.readouts) {
          expect(t.readouts.length).toBeGreaterThanOrEqual(2);
          expect(t.readouts.length).toBeLessThanOrEqual(4);
        }
        if (t.blocks) {
          // The left proof register is exactly 2×2.
          expect(t.blocks.length, `${c.slug}/${t.id} blocks`).toBe(4);
          for (const b of t.blocks) {
            // THE CLAIM, and it is the tile's whole headline now — the
            // display figure that used to lead it is deleted (2026-08-06,
            // owner), because across four rows its sixteen values carried
            // nine different grammars.
            //
            // ⚠ 27 IS MEASURED, NOT ROUND. At 1920×1080 the register's
            // half-column is ~234px and the claim sets at 13px mono with
            // .045em tracking — ~8.4px an advance, so 28 characters wrap. A
            // wrapped claim steals a line from its own sentence: the map
            // row's third tile did exactly that and clipped its description
            // by 14px while the other fifteen fit.
            expect(b.title.length, `${c.slug}/${t.id} block "${b.title}"`).toBeGreaterThan(0);
            expect(b.title.length, `${c.slug}/${t.id} block "${b.title}"`).toBeLessThanOrEqual(27);
            // The evidence for the claim. Visible at every viewport now that
            // the figure's display line is free.
            expect(b.desc.length, `${c.slug}/${t.id} block "${b.title}" desc`).toBeLessThanOrEqual(
              95
            );
          }
        }
        // The readouts kind IS the readouts — blocks there would leave the
        // row with no visual plate at all.
        if (t.visual.kind === "readouts") {
          expect(t.readouts, `${c.slug}/${t.id} solo plate needs readouts`).toBeDefined();
        }
        expect(t.context.length).toBeGreaterThan(0);
        expect(t.source.length).toBeGreaterThan(0);
        expect(t.file.length).toBeGreaterThan(0);
        // `project` is the brief's DISPLAY HEADING since 2026-07-30, and the
        // brief column is height-boxed — a title that wraps pushes the class
        // line and reflows everything under it. 20 chars at the 24px cap is
        // ~290px against a ~340px column.
        expect(t.project.length, `${c.slug}/${t.id} project`).toBeGreaterThan(0);
        expect(t.project.length, `${c.slug}/${t.id} project`).toBeLessThanOrEqual(20);
        if (t.classification) {
          expect(
            t.classification.length,
            `${c.slug}/${t.id} track classification`
          ).toBeLessThanOrEqual(64);
        }
        for (const row of t.context) {
          // The dotted leader needs a non-wrapping value, so a long one runs
          // into the next column of the three-up register.
          expect(row.v.length, `${c.slug}/${t.id} context "${row.k}"`).toBeLessThanOrEqual(20);
        }
      }
    }
  });

  it("briefs stay inside the height box they cannot overflow visibly", () => {
    // `.fl-brief` is boxed against the `--fl-t6` seam with `overflow: hidden`
    // and NO scrollbar, so an overlong brief silently loses its tail — and
    // only on short viewports, which is why it survived three passes: it
    // looks perfect at 1920x1080, where this copy gets authored.
    //
    // The harmonized left column gives the summary more vertical room before
    // the compact proof register. The longest approved summary is the Studio
    // account; 420 keeps a guardrail without forcing editorial truncation.
    const BRIEF_MAX = 420;
    const len = (segs: readonly CaseSegment[]) =>
      segs.map((s) => (typeof s === "string" ? s : s.em)).join("").length;
    for (const c of CASES) {
      expect(len(c.casefile.brief), `${c.slug} casefile brief`).toBeLessThanOrEqual(BRIEF_MAX);
      for (const t of c.casefile.tracks) {
        if (!t.brief) continue;
        expect(len(t.brief), `${c.slug}/${t.id} brief`).toBeLessThanOrEqual(BRIEF_MAX);
      }
    }
  });

  it("every row's project title corresponds to its filename", () => {
    // Owner rule, 2026-07-31: the directory row and the brief's heading name
    // the SAME thing. They sat divergent for five of eight rows
    // ("01_STUDIO/" over "AI Adoption Studio"), which reads as two
    // taxonomies. Normalise the filename — drop the ordinal prefix, the
    // trailing slash and any extension, hyphens to spaces — and it must
    // equal the project, case- and hyphen-insensitively.
    const norm = (s: string) =>
      s
        .replace(/^\d+_/, "")
        .replace(/\/$/, "")
        .replace(/\.(md|dat|log)$/i, "")
        .replace(/[-\s]+/g, " ")
        .trim()
        .toUpperCase();
    for (const c of CASES) {
      for (const t of c.casefile.tracks) {
        expect(norm(t.file), `${c.slug}/${t.id} file vs project`).toBe(norm(t.project));
        // The row is `20px | 1fr | auto` with the meta right-aligned, and the
        // filename column is at min-content. Measured at 21 chars the
        // tightest row (`01_AI-FLUENCY-STUDIO/` against `500 ADS/MO`) keeps
        // 12px of clearance at 1280/1440/1920 — that is the ceiling, not a
        // comfortable margin.
        expect(t.file.length, `${c.slug}/${t.id} file`).toBeLessThanOrEqual(21);
      }
    }
  });

  it("no track plate is empty", () => {
    for (const c of CASES) {
      for (const t of c.casefile.tracks) {
        const v = t.visual;
        if (v.kind === "log") expect(v.rows.length).toBeGreaterThan(0);
        if (v.kind === "register") expect(v.rows.length).toBeGreaterThan(0);
        if (v.kind === "registry" || v.kind === "intelligence-map") {
          expect(v.rows.length).toBeGreaterThan(0);
          expect(v.groups.length).toBeGreaterThan(0);
          // WEIGHTS ARE ALL-OR-NONE (ADR-056 U12). The tabs print every
          // group's count, so a half-weighted plate would render some tabs
          // with figures and some without — two designs in one strip.
          const weighted = v.groups.filter((g) => g.count).length;
          expect(
            weighted === 0 || weighted === v.groups.length,
            `${c.slug}/${t.id} registry weights are all-or-none`
          ).toBe(true);
          for (const g of v.groups) {
            if (!g.count) continue;
            // Digits only: the browser counts chips against `Number(count)`.
            expect(g.count, `${c.slug}/${t.id} group "${g.name}" count`).toMatch(/^\d+$/);
            expect(g.teams?.length, `${c.slug}/${t.id} group "${g.name}" teams`).toBeGreaterThan(0);
          }
          // THE PORTFOLIO IS THE COUNTS, ENUMERATED (ADR-056 U13). Every
          // skill files under a real group, and every group's printed count
          // equals its chip-list length — the browser makes the figures
          // countable by eye, so drift here is a visible contradiction.
          if (v.skills?.length) {
            const groupNames = new Set(v.groups.map((g) => g.name));
            const STATUSES = new Set(["In use", "Shipped", "In build", "Scoped"]);
            const summarised = v.skills.some((s) => Boolean(s.summary));
            for (const s of v.skills) {
              expect(
                groupNames.has(s.engine),
                `${c.slug}/${t.id} skill "${s.name}" engine "${s.engine}"`
              ).toBe(true);
              // The name heads the dossier and labels its cell; 30ch is the
              // measured ceiling against the plate's inner width.
              expect(s.name.length, `${c.slug}/${t.id} skill "${s.name}"`).toBeLessThanOrEqual(30);
              expect(s.team.length, `${c.slug}/${t.id} skill "${s.name}" team`).toBeGreaterThan(0);
              expect(
                STATUSES.has(s.status),
                `${c.slug}/${t.id} skill "${s.name}" status "${s.status}"`
              ).toBe(true);
              // The source data carries per-skill client OWNERS; those must
              // never travel ("Toby + Maud" is the shape to catch). The
              // SUMMARY is rewritten from the same cards, so it is scanned
              // for the same shape — that is where a pasted line would
              // smuggle one back in.
              expect(
                /\s\+\s/.test(s.name) || /\s\+\s/.test(s.team) || /\s\+\s/.test(s.summary ?? ""),
                `${c.slug}/${t.id} skill "${s.name}" smells like an owner pair`
              ).toBe(false);
              // ALL-OR-NONE (ADR-056 U14): the dossier answers every cell or
              // the map is a promise it breaks on the 47th click.
              expect(
                Boolean(s.summary),
                `${c.slug}/${t.id} skill "${s.name}" has no summary but its siblings do`
              ).toBe(summarised);
              // Four clamped lines at the dossier's ~40-character measure,
              // three at ≤800h. The box clips silently; this is the guard.
              expect(
                (s.summary ?? "").length,
                `${c.slug}/${t.id} skill "${s.name}" summary`
              ).toBeLessThanOrEqual(150);
            }
            for (const g of v.groups) {
              if (!g.count) continue;
              const chips = v.skills.filter((s) => s.engine === g.name).length;
              expect(
                chips,
                `${c.slug}/${t.id} group "${g.name}" prints ${g.count} but lists ${chips}`
              ).toBe(Number(g.count));
            }
          }
        }
        if (v.kind === "signal") expect(v.points.length).toBeGreaterThan(1);
        if (v.kind === "tools") expect(v.toolIds.length).toBeGreaterThan(0);
        if (v.kind === "stills") {
          expect(v.shots.length).toBeGreaterThan(0);
          // Alt text is the whole a11y story for this plate — the panel copy
          // never describes the individual ads.
          for (const shot of v.shots) expect(shot.alt.length).toBeGreaterThan(0);
        }
        if (v.kind === "films") {
          expect(v.films.length).toBeGreaterThan(0);
          for (const film of v.films) {
            expect(film.poster.length).toBeGreaterThan(0);
            expect(film.label.length).toBeGreaterThan(0);
          }
        }
        if (v.kind === "sheets") {
          // A ONE-SHEET ROW IS A PLATE WITH A RAIL ON IT — the rail costs
          // ~32px of the console and switches nothing. If a row has one
          // thing to show, it uses that thing's own plate kind.
          expect(v.sheets.length, `${c.slug}/${t.id} sheets`).toBeGreaterThan(1);
          for (const s of v.sheets) {
            // The rail's own label. Mono caps, one line, no ordinal — the
            // 4-station type rung starts ellipsising past ~22 characters.
            expect(s.label.length, `${c.slug}/${t.id}/${s.id} label`).toBeGreaterThan(0);
            expect(s.label.length, `${c.slug}/${t.id}/${s.id} label`).toBeLessThanOrEqual(22);
            const b = s.body;
            if (b.kind === "stills") {
              expect(b.shots.length).toBeGreaterThan(0);
              for (const shot of b.shots) expect(shot.alt.length).toBeGreaterThan(0);
            }
            if (b.kind === "compare") {
              // ⚠ EXACTLY TWO, and this is a design rule rather than a data
              // shape: the sheet exists to draw ONE line. Three columns is a
              // table, and a table is a different argument.
              expect(b.columns.length, `${c.slug}/${t.id}/${s.id} columns`).toBe(2);
              for (const col of b.columns) {
                expect(col.name.length).toBeGreaterThan(0);
                expect(col.claim.length).toBeGreaterThan(0);
                // Both columns show the same number of exemplars — an
                // asymmetric pair reads as a preference, not a boundary.
                expect(col.examples.length, `${c.slug}/${t.id}/${s.id} "${col.name}"`).toBe(3);
                for (const ex of col.examples) {
                  // Noun phrases on a 10.5px mono leader, never sentences.
                  expect(
                    ex.length,
                    `${c.slug}/${t.id}/${s.id} example "${ex}"`
                  ).toBeLessThanOrEqual(34);
                }
                expect(
                  col.desc.length,
                  `${c.slug}/${t.id}/${s.id} "${col.name}" desc`
                ).toBeLessThanOrEqual(180);
              }
            }
            if (b.kind === "facts") {
              // The `.fl-caps` 2×2, the same grid the tools plate uses — so
              // the same budgets, for the same reason: the title is `nowrap`
              // and the description clamps to two lines.
              expect(b.facts.length, `${c.slug}/${t.id}/${s.id} facts`).toBe(4);
              for (const f of b.facts) {
                expect(f.title.length, `${c.slug}/${t.id} fact "${f.title}"`).toBeLessThanOrEqual(
                  24
                );
                expect(
                  f.desc.length,
                  `${c.slug}/${t.id} fact "${f.title}" desc`
                ).toBeLessThanOrEqual(95);
              }
            }
          }
        }
      }
    }
  });

  it("signal points stay inside the plot box and run left to right", () => {
    for (const c of CASES) {
      for (const t of c.casefile.tracks) {
        if (t.visual.kind !== "signal") continue;
        let prevX = -1;
        for (const p of t.visual.points) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(1);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(1);
          expect(p.x).toBeGreaterThan(prevX);
          prevX = p.x;
        }
      }
    }
  });

  it("casefile tool ids resolve against PROJECT_CASES too", () => {
    const known = new Set(PROJECT_CASES.map((p) => p.id));
    for (const c of CASES) {
      for (const t of c.casefile.tracks) {
        if (t.visual.kind !== "tools") continue;
        for (const id of t.visual.toolIds) expect(known.has(id as never)).toBe(true);
      }
    }
  });

  it("the beats and the casefile share their plates rather than restating them", () => {
    // The hoisted consts in the content module are what stop the two
    // surfaces drifting. If someone re-types a plate inline, the row arrays
    // stop being reference-equal and this catches it.
    //
    // ⚠ TWO WAYS THIS USED TO GO QUIET (both fixed 2026-07-31, after the
    // directory was recomposed and neither would have been noticed):
    //   · The log lookup keyed on a hardcoded track id. Renaming that row
    //     did not fail the test — it made the `find` return undefined and
    //     the assertion never ran. The lookup is by PLATE KIND now, matching
    //     the registry branch, so no row id is load-bearing here.
    //   · Both branches sat behind `if (beat && track)`, so deleting the
    //     last row carrying a plate turned the guard into a no-op that still
    //     reported green. The beat is the source of truth, so its plate now
    //     ASSERTS that a casefile row shares it.
    //
    // The LOG branch is conditional since the 2026-08-02 directory trim
    // (ADR-056 U13): the rollout row left the casefile, so the beat is the
    // log's ONLY renderer and there is no second surface to hold in sync.
    // If a log row ever returns, it must share the beat's rows — that half
    // still asserts. The REGISTRY branch stays unconditional: row one is
    // the default panel and the beat's mirror by design.
    for (const c of CASES) {
      const beatLog = c.beats.find((b) => b.visual.kind === "log")?.visual;
      if (beatLog?.kind === "log") {
        const trackLog = c.casefile.tracks.find((t) => t.visual.kind === "log")?.visual;
        if (trackLog?.kind === "log") expect(trackLog.rows).toBe(beatLog.rows);
      }
      const beatReg = c.beats.find((b) => b.visual.kind === "registry")?.visual;
      if (beatReg?.kind === "registry") {
        const trackReg = c.casefile.tracks.find(
          (t) => t.visual.kind === "registry" || t.visual.kind === "intelligence-map"
        )?.visual;
        expect(
          trackReg?.kind === "registry" || trackReg?.kind === "intelligence-map",
          `${c.slug}: no casefile row shares the beat's registry plate`
        ).toBe(true);
        if (trackReg?.kind === "registry" || trackReg?.kind === "intelligence-map") {
          expect(trackReg.rows).toBe(beatReg.rows);
          expect(trackReg.groups).toBe(beatReg.groups);
        }
      }
    }
  });

  it("the handoff's superseded readouts never came along", () => {
    // The `Thoughtform Prime` design handoff carried older team, Skill, and
    // paid-social figures. The current registry pins one set of claims.
    const offenders: string[] = [];
    scanStrings(CASES, "cases", (value, path) => {
      if (/\b15\+\s*teams\b/i.test(value)) offenders.push(`${path}: superseded team count`);
      if (/\b20\+\s*skills\b/i.test(value)) offenders.push(`${path}: superseded skill count`);
      if (/\b90\s*%/.test(value)) offenders.push(`${path}: duplicate paid-social claim`);
      if (/\b95\s*%/.test(value)) offenders.push(`${path}: superseded paid-social claim`);
      // 42 → 47+ (2026-08-02, ADR-056 U12). The Intelligence Map plate now
      // SUMS its per-shape counts on screen, so a surviving 42 is a variant
      // the reader can check against the plate beside it. Both registers are
      // banned because the prose spells it out and the readouts do not.
      if (/\bforty-two\b/i.test(value)) offenders.push(`${path}: superseded skill count (prose)`);
      if (/\b42\s*skills\b/i.test(value)) offenders.push(`${path}: superseded skill count`);
      // "22 teams mapped" claimed the 14-set's MEANING with the 22-set's
      // VALUE — 22 is the count of teams briefed, 14 the count running the
      // layer. The label carries the claim, so the label is what is pinned:
      // the value and the label are separate strings and the joined phrase
      // never exists to match on.
      if (/\bteams\s+mapped\b/i.test(value)) offenders.push(`${path}: conflated team count`);
    });
    expect(offenders).toEqual([]);
  });

  it("publishes one canonical Studio adoption figure across Proof and the AI keynote", () => {
    const loop = getCase("loop-earplugs");
    const studio = loop?.casefile.tracks.find((track) => track.id === "studio");
    // ⚠ THE FIGURE IS IN THE CLAIM NOW, not in a display slot beside it —
    // `CaseBlock.value` was deleted 2026-08-06. The guard follows it there
    // rather than lapsing: the one canonical adoption figure still has to be
    // present on this row, it just reads as a sentence.
    expect(
      studio?.blocks?.some((block) => /\b97\s*%/.test(block.title)),
      "the Studio register must still publish 97% as a claim"
    ).toBe(true);

    const percentages = new Set<string>();
    const collect = (root: unknown, path: string) => {
      scanStrings(root, path, (value) => {
        for (const match of value.matchAll(/\b(?:90|95|97)\s*%/g)) {
          percentages.add(match[0].replace(/\s/g, ""));
        }
      });
    };
    collect(loop, "loop case");
    collect(AI_KEYNOTE_ARC, "AI keynote");
    expect([...percentages]).toEqual(["97%"]);
  });

  it("harmonizes all four Loop tracks around four proof blocks", () => {
    const loop = getCase("loop-earplugs");
    expect(loop?.casefile.tracks).toHaveLength(4);
    for (const track of loop?.casefile.tracks ?? []) {
      expect(track.blocks, track.id).toHaveLength(4);
      expect(track.readouts, track.id).toBeUndefined();
    }

    // `27 → 47` replaced `5 → 130+` with ADR-062: the row's meta now names
    // the two counts the drawing itself publishes — modules on the board and
    // Skills on the mains — so the directory agrees with the sheet it opens.
    //
    // ⚠ THE ORDER IS THE DIRECTORY, AND SOFTWARE FOR FEW IS 02 (owner,
    // 2026-08-07). The map still leads (it is the default panel and the
    // engagement itself); the four tools are the hardest evidence the
    // mapping produced something a team now runs, so they read before the
    // two creative-output rows. Two arrays move together with a reorder —
    // this one and the classification below — and so do `file`, `preview`
    // and `stamp.ord` in the content module. `stamp.ref` deliberately does
    // NOT: a ref identifies the record, not the row's position.
    expect(loop?.casefile.tracks.map((track) => track.meta)).toEqual([
      "27 → 47",
      "4 TOOLS",
      "500 ADS/MO",
      "2 FILMS",
    ]);
    expect(
      loop?.casefile.tracks.map((track) => track.classification ?? loop.casefile.classLine)
    ).toEqual([
      loop?.casefile.classLine,
      "AI-ASSISTED DEVELOPMENT · INTERNAL TOOLS · ACTIVE",
      "AI ADOPTION · CREATIVE PRODUCTION · ACTIVE",
      "GENERATIVE PRODUCTION · ATL / CTV · SHIPPED",
    ]);
    // ⚠ THE TOOLING REGISTER IS PROGRAM-LEVEL NOW (2026-08-07). The four
    // tool-describing claims — "Generation platform" and its three siblings
    // — were one tile per tool, which is what the RIGHT PANEL does with a
    // capture beside it; the register was restating the gallery two boxes
    // away. These four say the thing only the register can say. The literal
    // pin stays because the ORDER is the argument: gap → collapse →
    // ownership → substrate is why-it-exists, what-it-changed, who-holds-it,
    // what-it-shares.
    expect(
      loop?.casefile.tracks
        .find((track) => track.id === "tooling")
        ?.blocks?.map((block) => block.title)
    ).toEqual([
      "Too specific to buy",
      "Rebuilt, not accelerated",
      "Owned by the teams",
      "One substrate, four tools",
    ]);
  });

  it("every proof claim carries a glyph, and every glyph key resolves", () => {
    // The mark is data in `lib/cases/**` and a drawing in the component
    // layer, which is the only way the content module keeps its zero-import
    // contract. That split has one failure mode — a key that resolves to
    // nothing renders an empty cell and says so nowhere — so it is pinned
    // here rather than trusted to review.
    const keys = new Set(Object.keys(PROOF_GLYPHS));
    for (const c of CASES) {
      for (const t of c.casefile.tracks) {
        for (const b of t.blocks ?? []) {
          if (b.glyph === undefined) continue;
          expect(b.glyph.length, `${c.slug}/${t.id} block "${b.title}" glyph`).toBeGreaterThan(0);
          expect(
            keys.has(b.glyph),
            `${c.slug}/${t.id} block "${b.title}" names glyph "${b.glyph}", which is not in PROOF_GLYPHS`
          ).toBe(true);
        }
      }
    }

    // All four Loop tracks are drawn. A register with three marks and one
    // blank tile reads as a rendering bug, so the rule is all-or-none per
    // track and Loop is the track set that has them.
    const loop = getCase("loop-earplugs");
    for (const t of loop?.casefile.tracks ?? []) {
      const glyphs = (t.blocks ?? []).map((b) => b.glyph);
      expect(glyphs.filter(Boolean), `${t.id} glyphs`).toHaveLength(4);
      // One mark per claim WITHIN a row: two tiles under one glyph would put
      // two different claims behind one drawing, which is the register's
      // whole grammar collapsing. Across rows a repeat would be legitimate,
      // so the uniqueness is scoped to the track.
      expect(new Set(glyphs).size, `${t.id} glyphs are not unique`).toBe(4);
    }
  });

  it("tool lifecycle has ONE registry, and the proof register is not it", () => {
    // ⚠ THE `· live` SUFFIX LEFT THESE FOUR CLAIMS (2026-08-06). It was a
    // second status registry — `.claude/rules/proof.md` names exactly that as
    // the thing to avoid — kept in step by hand with `PROJECT_CASES`, where
    // the lifecycle actually lives. Removing it is what makes the rule true
    // rather than merely asserted, so the guard moves to the canonical
    // source and the proof labels are freed to be claims.
    for (const tool of PROJECT_CASES) {
      expect(tool.status, `${tool.id} lifecycle`).toBe("Production");
    }
    const tooling = getCase("loop-earplugs")?.casefile.tracks.find((t) => t.id === "tooling");
    for (const block of tooling?.blocks ?? []) {
      expect(
        block.title,
        `"${block.title}" restates a lifecycle the tool registry owns`
      ).not.toMatch(/\b(live|production|shipped|wip)\b/i);
    }
  });

  it("one Skills total across the case, and the map plate sums to it", () => {
    // THE PLATE MAKES THE ARITHMETIC CHECKABLE (ADR-056 U12). The weighted
    // registry prints a count per shape; the proof register prints the total. A reader
    // can add the first up and compare, so any second variant of the total
    // anywhere in the case is not a stale string — it is a visible
    // contradiction. Six printings drifted from one source before this guard
    // existed, which is exactly how 42 outlived the number it came from.
    //
    // No literal is pinned here on purpose: the guard is that the surfaces
    // AGREE, so raising the count is one content edit and not a test edit.
    const digits = (s: string) => Number(s.replace(/\D/g, ""));
    for (const c of CASES) {
      const totals = new Map<number, string[]>();
      const note = (value: string, where: string) => {
        const n = digits(value);
        if (!n) return;
        totals.set(n, [...(totals.get(n) ?? []), where]);
      };
      for (const s of c.report.stats) {
        if (/skills?/i.test(s.label)) note(s.value, `report stat "${s.label}"`);
      }
      for (const t of c.casefile.tracks) {
        for (const r of t.readouts ?? []) {
          if (/skills?/i.test(r.label)) note(r.value, `${t.id} readout "${r.label}"`);
        }
        // The claim carries its own figure since `CaseBlock.value` was
        // deleted, so the total is read out of the title itself — `47 Skills
        // encoded` still has to agree with the map plate's sum.
        for (const b of t.blocks ?? []) {
          if (/skills?/i.test(b.title)) note(b.title, `${t.id} block "${b.title}"`);
        }
        if (
          (t.visual.kind === "registry" || t.visual.kind === "intelligence-map") &&
          t.visual.groups.some((g) => g.count)
        ) {
          const sum = t.visual.groups.reduce((n, g) => n + (Number(g.count) || 0), 0);
          note(String(sum), `${t.id} map plate (sum of shape counts)`);
        }
      }
      expect(
        [...totals.keys()].sort((a, b) => a - b),
        `${c.slug}: Skills totals disagree — ${[...totals]
          .map(([n, where]) => `${n} (${where.join(", ")})`)
          .join(" vs ")}`
      ).toHaveLength(1);
    }
  });

  it("the dormant registry plate's allocation evidence still holds its shape", () => {
    // ⚠ THIS GUARDS A DORMANT PATH. `intelligence`/`teamDraw` moved OFF the
    // intelligence-map visual with ADR-062 — the city draws shapes,
    // districts and works, not reach/draw tiers. They survive as optional
    // fields on `registry`, which is what a SECOND client's row would use
    // (`SkillsBrowserPlate`). No track carries them today, so this loop is
    // expected to find nothing; it exists so the dormant API cannot rot
    // silently before someone reaches for it.
    const BANDS = new Set(["light", "steady", "deep", "intensive"]);

    for (const c of CASES) {
      for (const t of c.casefile.tracks) {
        if (t.visual.kind !== "registry") continue;
        const { intelligence, teamDraw, skills } = t.visual;
        const where = `${c.slug}/${t.id}`;

        if (intelligence) {
          const { tiers, reads, trend } = intelligence;

          expect(tiers.length, `${where} tiers`).toBe(4);
          const drawSum = tiers.reduce((n, t2) => n + t2.draw, 0);
          expect(
            drawSum,
            `${where} draw shares sum to ${drawSum}, not ~100`
          ).toBeGreaterThanOrEqual(96);
          expect(drawSum, `${where} draw shares sum to ${drawSum}, not ~100`).toBeLessThanOrEqual(
            104
          );
          for (const tier of tiers) {
            expect(tier.name.length, `${where} tier "${tier.name}"`).toBeLessThanOrEqual(10);
            expect(
              (tier.note ?? "").length,
              `${where} tier "${tier.name}" note`
            ).toBeLessThanOrEqual(20);
            for (const [k, v] of [
              ["reach", tier.reach],
              ["draw", tier.draw],
            ] as const) {
              expect(v, `${where} tier "${tier.name}" ${k}`).toBeGreaterThanOrEqual(0);
              expect(v, `${where} tier "${tier.name}" ${k}`).toBeLessThanOrEqual(100);
            }
            expect(
              MODEL_FAMILIES.test(`${tier.name} ${tier.note ?? ""}`),
              `${where} tier "${tier.name}" names a model family`
            ).toBe(false);
          }

          expect(reads.length, `${where} reads`).toBeGreaterThanOrEqual(2);
          expect(reads.length, `${where} reads`).toBeLessThanOrEqual(3);
          const teams = new Set((skills ?? []).map((s) => s.team));
          for (const r of reads) {
            expect(r.lens.length, `${where} read "${r.team}" lens`).toBeLessThanOrEqual(16);
            expect(r.why.length, `${where} read "${r.team}" why`).toBeLessThanOrEqual(90);
            if (teams.size) {
              expect(teams.has(r.team), `${where} read names team "${r.team}"`).toBe(true);
            }
          }

          if (trend) {
            expect(trend.label.length, `${where} trend label`).toBeLessThanOrEqual(32);
            expect(trend.points.length, `${where} trend points`).toBeGreaterThanOrEqual(2);
          }
        }

        if (teamDraw?.length && skills?.length) {
          const banded = new Set(teamDraw.map((t2) => t2.team));
          const tierNames = new Set((intelligence?.tiers ?? []).map((t2) => t2.name));
          for (const t2 of teamDraw) {
            expect(BANDS.has(t2.band), `${where} band "${t2.band}" for ${t2.team}`).toBe(true);
            if (tierNames.size) {
              expect(
                tierNames.has(t2.tier),
                `${where} team "${t2.team}" leans on tier "${t2.tier}"`
              ).toBe(true);
            }
          }
          for (const team of new Set(skills.map((s) => s.team))) {
            expect(banded.has(team), `${where} team "${team}" has Skills but no draw band`).toBe(
              true
            );
          }
        }
      }
    }
  });

  it("the Loop work-to-intelligence map is a complete, drawable record (ADR-062)", () => {
    const loop = getCase("loop-earplugs");
    const visual = loop?.casefile.tracks.find((t) => t.id === "ai-transformation")?.visual;
    expect(visual?.kind).toBe("intelligence-map");
    if (!visual || visual.kind !== "intelligence-map") {
      throw new Error("Loop's lead track must use the intelligence-map visual");
    }

    const { shapes, districts, works, skills, groups } = visual;

    // The Skills reservoir is unchanged by the redraw.
    expect(skills).toHaveLength(47);
    const skillIds = skills.map((s) => s.id);
    expect(new Set(skillIds).size).toBe(47);
    for (const id of skillIds) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);

    // FIVE MAINS, and their Skill counts are the SAME arithmetic the plate
    // prints. Two arrays describing one portfolio is exactly how a surface
    // ends up publishing two totals a reader can subtract.
    expect(shapes).toHaveLength(5);
    expect([...shapes].map((s) => s.key).sort()).toEqual([
      "judgment",
      "pattern",
      "stakeholder",
      "validation",
      "voice",
    ]);
    const shapeSkills = shapes.reduce((n, s) => n + s.skills, 0);
    const groupCount = groups.reduce((n, g) => n + (Number(g.count) || 0), 0);
    expect(
      shapeSkills,
      `the mains sum to ${shapeSkills} but the plate's groups sum to ${groupCount}`
    ).toBe(groupCount);

    // EIGHT DISTRICTS, and they seat on a 4x2 grid.
    expect(districts).toHaveLength(8);
    expect(new Set(districts.map((d) => d.id)).size).toBe(8);
    expect(new Set(districts.map((d) => d.name)).size).toBe(8);

    // 27 MODULES: 24 configured, 3 person-led. Person-led work stays on the
    // map — the negative space is what leadership reads, so a redraw that
    // quietly dropped it would invert the map's meaning.
    expect(works).toHaveLength(27);
    expect(new Set(works.map((w) => w.id)).size).toBe(27);
    const configured = works.filter((w) => w.lane !== null);
    expect(configured).toHaveLength(24);
    expect(works.length - configured.length).toBe(3);

    const districtIds = new Set(districts.map((d) => d.id));
    const shapeKeys = new Set(shapes.map((s) => s.key));
    for (const w of works) {
      expect(districtIds.has(w.dist), `${w.id} sits in unknown district "${w.dist}"`).toBe(true);
      expect(w.shapes.length, `${w.id} taps no shape`).toBeGreaterThan(0);
      for (const k of w.shapes) {
        expect(shapeKeys.has(k), `${w.id} taps unknown shape "${k}"`).toBe(true);
      }
      // `cfg` and `lane` are the SAME fact told twice; the drawing branches
      // on one and the hover card on the other.
      expect(
        (w.cfg === null) === (w.lane === null),
        `${w.id} disagrees with itself about being person-led`
      ).toBe(true);
    }

    // SIX CHIP SLOTS PER DISTRICT is a geometric ceiling, not a style
    // choice: a seventh module falls off its plate rather than clipping, so
    // nothing on screen would tell you it happened.
    for (const d of districts) {
      const n = works.filter((w) => w.dist === d.id).length;
      expect(
        n,
        `${d.name} seats ${n} modules on a ${BOARD_CHIP_SLOTS}-slot plate`
      ).toBeLessThanOrEqual(BOARD_CHIP_SLOTS);
    }

    // EACH MAIN IS TRENCHED EXACTLY ONCE, by a CONFIGURED stream. This is
    // what makes the reuse figure arithmetic rather than an assertion:
    // 24 configured minus 5 trenched is the 19 the sheet prints. The
    // renderer's lookup falls back to the first work on a miss, so a typo
    // here would draw a plausible wrong answer rather than throwing.
    expect(new Set(shapes.map((s) => s.first)).size).toBe(5);
    for (const s of shapes) {
      const first = works.find((w) => w.id === s.first);
      expect(first, `shape "${s.key}" was trenched by unknown work "${s.first}"`).toBeTruthy();
      expect(first?.lane, `shape "${s.key}" was trenched by person-led work`).not.toBeNull();
      expect(
        first?.shapes.includes(s.key),
        `${s.first} trenched "${s.key}" without tapping it`
      ).toBe(true);
    }
    expect(configured.length - shapes.length).toBe(19);
  });

  it("districts are never published as teams (ADR-062)", () => {
    // THREE COUNTS, THREE UNITS. 22 teams BRIEFED, 14 teams USING THE LAYER,
    // and now 8 DISTRICTS — which are departments. The wording is the only
    // thing keeping them apart, and the failure mode is a phrase that lends
    // one number another's meaning ("8 teams"), which is what the older
    // "22 teams mapped" pin already caught once.
    const loop = getCase("loop-earplugs");
    const visual = loop?.casefile.tracks.find((t) => t.id === "ai-transformation")?.visual;
    if (!visual || visual.kind !== "intelligence-map") return;

    const n = visual.districts.length;
    const banned = new RegExp(`\\b${n}\\+?\\s+teams?\\b`, "i");
    for (const c of CASES) {
      const prose = JSON.stringify(c);
      expect(
        banned.test(prose),
        `${c.slug} publishes "${n} teams" — ${n} is the DISTRICT count, a different unit`
      ).toBe(false);
    }
  });

  it("keeps the map's configuration copy anonymous and price-free (ADR-062)", () => {
    const loop = getCase("loop-earplugs");
    const visual = loop?.casefile.tracks.find((t) => t.id === "ai-transformation")?.visual;
    if (!visual || visual.kind !== "intelligence-map") {
      throw new Error("Loop's lead track must use the intelligence-map visual");
    }

    // Every string the drawing or the hover card can render.
    const strings: string[] = [];
    for (const s of visual.shapes) strings.push(s.label, s.gloss);
    for (const d of visual.districts) strings.push(d.name, d.ab);
    for (const w of visual.works) {
      strings.push(w.title, w.bar, w.evals, w.lane ?? "", w.vol, w.seat);
      if (w.cfg) {
        strings.push(...w.cfg.p, ...w.cfg.s, ...w.cfg.m, ...w.cfg.c, ...w.cfg.g);
        strings.push(...w.cfg.k, ...w.cfg.u, w.cfg.o, w.cfg.why);
      }
    }
    const blob = strings.join(" | ");

    // The confidentiality envelope, applied to the map's own copy. Each of
    // these is an editorial rule that only a machine can hold: a person
    // reviewing 27 records will not catch the one vendor name.
    for (const [label, re] of [
      ["money", /[€$£¥]|\b(USD|EUR|GBP)\b|\b\d{1,3}(,\d{3})+\b/],
      ["a source URL", /\b(monday|notion|github|figma)\.com\b/i],
      ["a model family", MODEL_FAMILIES],
      ["a vendor or private system", /\b(openai|anthropic|supabase|slack|aether|salesforce)\b/i],
      ["a personal name", /\b(Vince|Astrid|Nathan|Koen|Olga|Helen|Damien|Robert|Toby|Maud)\b/],
    ] as const) {
      expect(re.test(blob), `the map's copy names ${label}`).toBe(false);
    }

    // Roles, not people. The set is open — v13 introduced thirteen more than
    // ADR-061's eight — so this checks the SHAPE of a role rather than
    // pinning a list that a content edit would have to come here to change.
    for (const w of visual.works) {
      if (!w.cfg) continue;
      for (const role of [w.cfg.p[0], w.cfg.o]) {
        expect(role.length, `role "${role}" on ${w.id}`).toBeLessThanOrEqual(28);
        expect(
          /^[A-Z][A-Za-z+ /-]*$/.test(role),
          `role "${role}" on ${w.id} does not read as a role title`
        ).toBe(true);
      }
      // The lane is generic capability language, never a product.
      expect(
        ["Fast", "Everyday", "Deep", "Frontier"].includes(w.lane ?? ""),
        `${w.id} runs on non-generic lane "${w.lane}"`
      ).toBe(true);
    }
  });
  it("every Skill's lattice symbol is unique within its plate (ADR-056 U15)", () => {
    // The lattice reads as a periodic table, and its tiles carry a SYMBOL
    // rather than a name. Two Skills under one mark is not a cosmetic clash:
    // the tile stops identifying the thing it opens. `skillSymbol` derives
    // most of them and hand-sets the rest, so this is the guard that tells a
    // future author their new Skill needs an override.
    for (const c of CASES) {
      for (const t of c.casefile.tracks) {
        if (
          (t.visual.kind !== "registry" && t.visual.kind !== "intelligence-map") ||
          !t.visual.skills?.length
        )
          continue;
        const byMark = new Map<string, string[]>();
        for (const s of t.visual.skills) {
          const mark = skillSymbol(s.name);
          // One character reads as a bullet, not a mark; four is the widest
          // the tile holds at the 11px symbol size.
          expect(mark.length, `${c.slug}/${t.id} "${s.name}" -> "${mark}"`).toBeGreaterThanOrEqual(
            2
          );
          expect(mark.length, `${c.slug}/${t.id} "${s.name}" -> "${mark}"`).toBeLessThanOrEqual(4);
          byMark.set(mark, [...(byMark.get(mark) ?? []), s.name]);
        }
        const clashes = [...byMark].filter(([, names]) => names.length > 1);
        expect(
          clashes.map(([m, names]) => `${m}: ${names.join(" | ")}`),
          `${c.slug}/${t.id} symbol collision — add an override in skillSymbol.ts`
        ).toEqual([]);
      }
    }
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
    // PROJECT_CASES renders on the SAME public surface (the casefile's tool
    // gallery, ADR-056 Update 9) but lives outside `lib/cases/`, so it was
    // never scanned. It carries client tool copy — challenge paragraphs,
    // capability descriptions, stacks — and needs the same envelope.
    scanStrings(PROJECT_CASES, "PROJECT_CASES", (value, path) => {
      for (const [pattern, what] of banned) {
        if (pattern.test(value)) offenders.push(`${path}: ${what}`);
      }
    });
    expect(offenders).toEqual([]);
  });

  it("PROJECT_CASES asset paths are repo-rooted, and every tool has a walkthrough", () => {
    const ok = (src: string) => src.startsWith("/project-cards/") || src.startsWith("/videos/");
    for (const c of PROJECT_CASES) {
      expect(ok(c.image.src), `${c.id} image`).toBe(true);
      // The gallery's Watch walkthrough button is conditional on this, so a
      // missing one degrades silently rather than erroring.
      expect(c.walkthrough, `${c.id} walkthrough`).toBeDefined();
      expect(ok(c.walkthrough!.src), `${c.id} walkthrough src`).toBe(true);
      expect(ok(c.walkthrough!.poster), `${c.id} walkthrough poster`).toBe(true);
      // Printed on the watch bar — "m:ss", read off the encode, not guessed.
      expect(c.walkthrough!.duration, `${c.id} duration`).toMatch(/^\d+:\d{2}$/);
    }
  });

  it("PROJECT_CASES capability copy fits both of its homes", () => {
    // ONE canonical array, TWO renderers (ADR-068 U2): the Arc card's tile
    // band and the casefile's detail 2×2. The title is a single mono line in
    // both — the Arc tile at ~160px is the tighter home, which is where 24
    // comes from — and the sentence budget is 95 so the casefile block stays
    // ≤3 wrapped lines at its 12px floor. Copy past either silently clips or
    // reflows the grid, which reads as a bug.
    for (const c of PROJECT_CASES) {
      expect(c.capabilities).toHaveLength(4);
      for (const cap of c.capabilities) {
        // The tile title must hold ONE line: a wrap pushes its description a
        // line below its three neighbours', which reads as a broken grid.
        // Verified in-browser at 1280/1440/1920 at the tile's 10.5px/0.06em.
        expect(cap.title.length, `${c.id} "${cap.title}"`).toBeLessThanOrEqual(24);
        expect(cap.desc.length, `${c.id} "${cap.title}" desc`).toBeLessThanOrEqual(95);
      }
      // The register's dotted leader needs a non-wrapping value; the panel
      // shows the DEPARTMENT only for exactly this reason.
      expect(c.team.split("·")[0].trim().length, `${c.id} team`).toBeLessThanOrEqual(20);
    }
  });

  it("PROJECT_CASES rail handles fit four stations on one console", () => {
    // ⚠ 14 IS ARITHMETIC, NOT TASTE (ADR-066). A quarter of the 594.5px
    // console at 1280×720 is 146.6px, leaving ~122px after padding, diamond
    // and gap — about fourteen characters at the 10px control floor. The
    // fifteenth character is what costs the rail its diamond, and that is a
    // mark the surface cannot buy back below the decorative floor.
    const tabs = PROJECT_CASES.map((c) => c.tab);
    for (const c of PROJECT_CASES) {
      expect(c.tab.length, `${c.id} tab "${c.tab}"`).toBeGreaterThan(0);
      expect(c.tab.length, `${c.id} tab "${c.tab}"`).toBeLessThanOrEqual(14);
    }
    // A rail with two identical handles cannot say which station is lit.
    expect(new Set(tabs).size, `tab handles collide: ${tabs.join(" · ")}`).toBe(tabs.length);
  });

  it("PROJECT_CASES route steps fit the plate's spine", () => {
    // ⚠ The renderer (RouteDiagram) was deleted in the 08-07 declutter
    // (e3b3386) and its orphan file removed 2026-08-08 — the DATA is held
    // for a future route drawing (ADR-068 named a vertical chain as the
    // likely mobile shape), so these budgets keep guarding it.
    // The before-state is a sequence a reader COUNTS, so the count has a
    // floor and a ceiling: below three there is no route to collapse, above
    // five the cells stop being readable across the plate's width. Each cell
    // is one mono line — a step past its budget wraps and drops the row.
    for (const c of PROJECT_CASES) {
      const { before, now, beforeMeta, nowMeta } = c.route;
      expect(before.length, `${c.id} route.before`).toBeGreaterThanOrEqual(3);
      expect(before.length, `${c.id} route.before`).toBeLessThanOrEqual(5);
      for (const step of before) {
        expect(step.length, `${c.id} route step "${step}"`).toBeGreaterThan(0);
        expect(step.length, `${c.id} route step "${step}"`).toBeLessThanOrEqual(12);
      }
      expect(now.length, `${c.id} route.now "${now}"`).toBeGreaterThan(0);
      expect(now.length, `${c.id} route.now "${now}"`).toBeLessThanOrEqual(10);
      for (const [k, v] of [
        ["beforeMeta", beforeMeta],
        ["nowMeta", nowMeta],
      ] as const) {
        expect(v.length, `${c.id} route.${k} "${v}"`).toBeGreaterThan(0);
        expect(v.length, `${c.id} route.${k} "${v}"`).toBeLessThanOrEqual(44);
      }
    }
  });

  // The "detail plates ask the SAME four questions" guard left with the
  // field it pinned: ADR-068 U2 (owner, 2026-08-08) filled the 2×2 with the
  // portfolio site's capability blocks and deleted `ProjectCase.detail` —
  // the capability guard above is the blocks' shape pin now.
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
