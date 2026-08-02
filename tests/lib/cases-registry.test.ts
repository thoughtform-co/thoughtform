import { describe, expect, it } from "vitest";

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
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

  it("every track carries a full panel (a readouts OR blocks foot, context, source)", () => {
    for (const c of CASES) {
      for (const t of c.casefile.tracks) {
        // EXACTLY ONE FOOT (ADR-056 U12). The panel has one slot below the
        // plate, so carrying both is not a richer row — it is a row whose
        // rendered half is decided by a branch order in the renderer.
        expect(
          Boolean(t.readouts) !== Boolean(t.blocks),
          `${c.slug}/${t.id} must carry readouts OR blocks, not both or neither`
        ).toBe(true);
        if (t.readouts) {
          expect(t.readouts.length).toBeGreaterThanOrEqual(2);
          expect(t.readouts.length).toBeLessThanOrEqual(4);
        }
        if (t.blocks) {
          // The grid is 2×2 and the foot is `overflow: hidden` — a fifth
          // tile does not wrap to a third row, it silently disappears.
          expect(t.blocks.length, `${c.slug}/${t.id} blocks`).toBe(4);
          for (const b of t.blocks) {
            // Mono caps, `white-space: nowrap` with an ellipsis, against a
            // half-rail of ~330px. It truncates rather than wrapping, so the
            // ceiling is the guard.
            expect(b.title.length, `${c.slug}/${t.id} block "${b.title}"`).toBeLessThanOrEqual(26);
            // Two clamped lines, ONE at ≤760h.
            expect(b.desc.length, `${c.slug}/${t.id} block "${b.title}" desc`).toBeLessThanOrEqual(
              95
            );
            // The figure prints at display size on one line.
            if (b.stat) {
              expect(
                b.stat.length,
                `${c.slug}/${t.id} block "${b.title}" stat`
              ).toBeLessThanOrEqual(4);
            }
          }
        }
        // The readouts kind IS the readouts — a blocks foot there would
        // leave the row with no plate at all.
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
    // The budget was ~195 chars at 1280x720 (the binding viewport) until the
    // 2026-08-01 tick move took the brief box from 154px to 199px there. The
    // box now takes 364 characters of representative prose before it clips
    // (measured at 1280x720 / 1366x768 / 1440x800 — 364 / 366 / 366, so 720p
    // still binds); 330 is that ceiling with a line of margin, because wrap
    // points move with the words. This was a comment-and-measurement
    // convention before — pinning it is the point of ADR-056 U11's test line.
    const BRIEF_MAX = 330;
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
        if (v.kind === "registry") {
          expect(v.rows.length).toBeGreaterThan(0);
          expect(v.groups.length).toBeGreaterThan(0);
          // WEIGHTS ARE ALL-OR-NONE (ADR-056 U12). The renderer branches per
          // group, so a half-weighted plate would draw some groups as bars
          // and some as glosses — two designs in one box.
          const weighted = v.groups.filter((g) => g.count).length;
          expect(
            weighted === 0 || weighted === v.groups.length,
            `${c.slug}/${t.id} registry weights are all-or-none`
          ).toBe(true);
          for (const g of v.groups) {
            if (!g.count) continue;
            // Digits only: the bar's width is `Number(count)`, so "12+" would
            // print a figure the bar cannot honour.
            expect(g.count, `${c.slug}/${t.id} group "${g.name}" count`).toMatch(/^\d+$/);
            expect(g.teams?.length, `${c.slug}/${t.id} group "${g.name}" teams`).toBeGreaterThan(0);
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
    for (const c of CASES) {
      const beatLog = c.beats.find((b) => b.visual.kind === "log")?.visual;
      if (beatLog?.kind === "log") {
        const trackLog = c.casefile.tracks.find((t) => t.visual.kind === "log")?.visual;
        expect(trackLog?.kind, `${c.slug}: no casefile row shares the beat's log plate`).toBe(
          "log"
        );
        if (trackLog?.kind === "log") expect(trackLog.rows).toBe(beatLog.rows);
      }
      const beatReg = c.beats.find((b) => b.visual.kind === "registry")?.visual;
      if (beatReg?.kind === "registry") {
        const trackReg = c.casefile.tracks.find((t) => t.visual.kind === "registry")?.visual;
        expect(trackReg?.kind, `${c.slug}: no casefile row shares the beat's registry plate`).toBe(
          "registry"
        );
        if (trackReg?.kind === "registry") {
          expect(trackReg.rows).toBe(beatReg.rows);
          expect(trackReg.groups).toBe(beatReg.groups);
        }
      }
    }
  });

  it("the handoff's superseded readouts never came along", () => {
    // The `Thoughtform Prime` design handoff printed 15+ teams / 20+ Skills /
    // 90% of paid social. Those predate the ADR-054 numbers doctrine (22 / 47+
    // / 4 / 5 → 130+), and "90% of paid social" is a near-variant of the "95%
    // of briefings" claim already published on the ai-keynote arc page.
    const offenders: string[] = [];
    scanStrings(CASES, "cases", (value, path) => {
      if (/\b15\+\s*teams\b/i.test(value)) offenders.push(`${path}: superseded team count`);
      if (/\b20\+\s*skills\b/i.test(value)) offenders.push(`${path}: superseded skill count`);
      if (/\b90\s*%/.test(value)) offenders.push(`${path}: duplicate paid-social claim`);
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

  it("one Skills total across the case, and the map plate sums to it", () => {
    // THE PLATE MAKES THE ARITHMETIC CHECKABLE (ADR-056 U12). The weighted
    // registry prints a count per shape; the foot prints the total. A reader
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
        for (const b of t.blocks ?? []) {
          if (b.stat && /skills?/i.test(b.title)) note(b.stat, `${t.id} block "${b.title}"`);
        }
        if (t.visual.kind === "registry" && t.visual.groups.some((g) => g.count)) {
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

  it("PROJECT_CASES capability copy fits the casefile's foot tiles", () => {
    // Four tiles across a ~690px foot band. The title is a single mono line
    // and the desc is clamped to two — copy far past these silently loses its
    // tail to the clamp, which reads as a truncation bug.
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
