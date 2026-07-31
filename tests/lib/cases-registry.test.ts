import { describe, expect, it } from "vitest";

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { CASES, caseBeatMenu, caseSlugs, getCase } from "@/lib/cases/registry";

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

  it("every track carries a full panel (2..4 readouts, context, source)", () => {
    for (const c of CASES) {
      for (const t of c.casefile.tracks) {
        expect(t.readouts.length).toBeGreaterThanOrEqual(2);
        expect(t.readouts.length).toBeLessThanOrEqual(4);
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

  it("no track plate is empty", () => {
    for (const c of CASES) {
      for (const t of c.casefile.tracks) {
        const v = t.visual;
        if (v.kind === "log") expect(v.rows.length).toBeGreaterThan(0);
        if (v.kind === "register") expect(v.rows.length).toBeGreaterThan(0);
        if (v.kind === "registry") {
          expect(v.rows.length).toBeGreaterThan(0);
          expect(v.groups.length).toBeGreaterThan(0);
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
    for (const c of CASES) {
      const beatLog = c.beats.find((b) => b.visual.kind === "log")?.visual;
      const trackLog = c.casefile.tracks.find(
        (t) => t.visual.kind === "log" && t.id === "transformation"
      )?.visual;
      if (beatLog?.kind === "log" && trackLog?.kind === "log") {
        expect(trackLog.rows).toBe(beatLog.rows);
      }
      const beatReg = c.beats.find((b) => b.visual.kind === "registry")?.visual;
      const trackReg = c.casefile.tracks.find((t) => t.visual.kind === "registry")?.visual;
      if (beatReg?.kind === "registry" && trackReg?.kind === "registry") {
        expect(trackReg.rows).toBe(beatReg.rows);
        expect(trackReg.groups).toBe(beatReg.groups);
      }
    }
  });

  it("the handoff's superseded readouts never came along", () => {
    // The `Thoughtform Prime` design handoff printed 15+ teams / 20+ Skills /
    // 90% of paid social. Those predate the ADR-054 numbers doctrine (22 / 42
    // / 4 / 5 → 130+), and "90% of paid social" is a near-variant of the "95%
    // of briefings" claim already published on the ai-keynote arc page.
    const offenders: string[] = [];
    scanStrings(CASES, "cases", (value, path) => {
      if (/\b15\+\s*teams\b/i.test(value)) offenders.push(`${path}: superseded team count`);
      if (/\b20\+\s*skills\b/i.test(value)) offenders.push(`${path}: superseded skill count`);
      if (/\b90\s*%/.test(value)) offenders.push(`${path}: duplicate paid-social claim`);
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
    }
  });

  it("PROJECT_CASES capability copy fits the casefile's foot tiles", () => {
    // Four tiles across a ~690px foot band. The title is a single mono line
    // and the desc is clamped to two — copy far past these silently loses its
    // tail to the clamp, which reads as a truncation bug.
    for (const c of PROJECT_CASES) {
      expect(c.capabilities).toHaveLength(4);
      for (const cap of c.capabilities) {
        // The tile title must hold ONE line: it sits above a 2-line clamped
        // desc in a ~45px band, so a wrap pushes its description out of line
        // with the other three tiles. 24 is what the current copy needs and
        // what the tile's tracking (0.08em, tightened for exactly this) was
        // measured to fit in a ~165px column — verified in-browser at
        // 1280/1440/1920, no title wraps.
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
