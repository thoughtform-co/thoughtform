import { describe, expect, it } from "vitest";

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import {
  FIELD_LOG_CLIENTS,
  getClient,
  resolveTools,
} from "@/app/(internal)/test/field-log-lab/fieldLogData";

/**
 * Field-log casefile content guard (/test/field-log-lab).
 *
 * The lab's content is destined for `lib/cases/` once the design settles, so
 * it carries the SAME confidentiality envelope as
 * `tests/lib/cases-registry.test.ts` from day one rather than acquiring it at
 * promotion. The failure this prevents is a client's spend, board or repo
 * reaching a page someone screenshots — treat a red run as a real incident,
 * never as a test to relax (`.claude/rules/proof.md`).
 *
 * The shape assertions pin the two contracts the markup depends on: every
 * directory row resolves to a track, and every tool id resolves against
 * `PROJECT_CASES`, which stays the single canonical source for tool copy.
 */
describe("field-log casefile data", () => {
  it("client slugs are unique and kebab-case, and getClient resolves them", () => {
    const slugs = FIELD_LOG_CLIENTS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(getClient(slug)?.slug).toBe(slug);
    }
    expect(getClient("nope")).toBeUndefined();
  });

  it("every client opens on a track and its track ids are unique and anchorable", () => {
    for (const c of FIELD_LOG_CLIENTS) {
      expect(c.tracks.length).toBeGreaterThan(0);
      const ids = c.tracks.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("every track carries a full right column (2..4 readouts, context, source)", () => {
    for (const c of FIELD_LOG_CLIENTS) {
      for (const t of c.tracks) {
        expect(t.readouts.length).toBeGreaterThanOrEqual(2);
        expect(t.readouts.length).toBeLessThanOrEqual(4);
        expect(t.context.length).toBeGreaterThan(0);
        for (const row of t.context) {
          // The dotted leader needs a non-wrapping value, so a long one runs
          // into the next column of the three-up register. Keep them terse.
          expect(row.v.length, `${c.slug}/${t.id} context "${row.k}"`).toBeLessThanOrEqual(20);
        }
        expect(t.source.length).toBeGreaterThan(0);
        expect(t.file.length).toBeGreaterThan(0);
      }
    }
  });

  it("visuals lifted from lib/cases arrived non-empty", () => {
    // `LOOP_BEATS[n].visual.kind === …` narrowing falls back to `[]` if the
    // canonical beat's visual kind ever changes. That would silently empty a
    // plate, so pin it here rather than discovering it in a screenshot.
    for (const c of FIELD_LOG_CLIENTS) {
      for (const t of c.tracks) {
        if (t.visual.kind === "log") expect(t.visual.rows.length).toBeGreaterThan(0);
        if (t.visual.kind === "registry") {
          expect(t.visual.rows.length).toBeGreaterThan(0);
          expect(t.visual.groups.length).toBeGreaterThan(0);
        }
        if (t.visual.kind === "register") expect(t.visual.rows.length).toBeGreaterThan(0);
        if (t.visual.kind === "signal") expect(t.visual.points.length).toBeGreaterThan(1);
      }
    }
  });

  it("signal points stay inside the plot box and run left to right", () => {
    for (const c of FIELD_LOG_CLIENTS) {
      for (const t of c.tracks) {
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

  it("tool ids resolve against PROJECT_CASES (single canonical tool copy)", () => {
    const known = new Set(PROJECT_CASES.map((p) => p.id));
    for (const c of FIELD_LOG_CLIENTS) {
      for (const t of c.tracks) {
        if (t.visual.kind !== "tools") continue;
        expect(t.visual.toolIds.length).toBeGreaterThan(0);
        for (const id of t.visual.toolIds) expect(known.has(id as never)).toBe(true);
        // …and none silently drop out of the resolver the panel uses.
        expect(resolveTools(t.visual.toolIds)).toHaveLength(t.visual.toolIds.length);
      }
    }
  });

  it("no italic markup smuggled into copy strings", () => {
    const offenders: string[] = [];
    scanStrings(FIELD_LOG_CLIENTS, "clients", (value, path) => {
      if (/<\s*(i|em)[\s>]/i.test(value)) offenders.push(path);
    });
    expect(offenders).toEqual([]);
  });

  it("holds the confidentiality envelope (no money, boards, or repo links)", () => {
    const banned: readonly [RegExp, string][] = [
      [/[€$£]/, "currency symbol"],
      [/\b\d{1,3}(,\d{3})+\b/, "amount with thousands separator"],
      [/\bUSD\b|\bEUR\b/i, "currency code"],
      [/monday\.com/i, "board link"],
      [/github\.com/i, "repo link"],
      [/loop-skills|tensalir|\baether\b/i, "private repo name"],
    ];
    const offenders: string[] = [];
    scanStrings(FIELD_LOG_CLIENTS, "clients", (value, path) => {
      for (const [pattern, what] of banned) {
        if (pattern.test(value)) offenders.push(`${path}: ${what}`);
      }
    });
    expect(offenders).toEqual([]);
  });

  it("the handoff's superseded readouts never came along", () => {
    // The `Thoughtform Prime` handoff printed 15+ teams / 20+ Skills / 90% of
    // paid social. Those predate the ADR-054 numbers doctrine (22 / 42 / 4 /
    // 5 → 130+), and "90% of paid social" is a near-variant of the "95% of
    // briefings" claim already published on the ai-keynote arc page.
    const offenders: string[] = [];
    scanStrings(FIELD_LOG_CLIENTS, "clients", (value, path) => {
      if (/\b15\+\s*teams\b/i.test(value)) offenders.push(`${path}: superseded team count`);
      if (/\b20\+\s*skills\b/i.test(value)) offenders.push(`${path}: superseded skill count`);
      if (/\b90\s*%/.test(value)) offenders.push(`${path}: duplicate paid-social claim`);
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
