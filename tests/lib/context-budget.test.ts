/**
 * The context budget — what every Claude Code session in this repo reads before
 * it reads the brief.
 *
 * ⚠ THE FAILURE IT GUARDS (2026-10-12): ~450 KB of house rules loaded before
 * every brief. CLAUDE.md had grown to 149 KB of per-surface rulings, and four
 * `.claude/rules/*.md` files wrote "**Paths:**" in prose instead of a `paths:`
 * frontmatter list, which Claude Code ignores, so they loaded into every session
 * unconditionally (proof.md alone was 248 KB). Arc pages added arcs.md and, through
 * a glob as wide as `app/(marketing)/**`, landing-v7.md. Transcript forensics
 * showed that vocabulary decided the shape of every design those sessions drew.
 *
 * What is pinned:
 *   · every rule file opens with YAML frontmatter holding a non-empty `paths:`
 *     list, so it loads only when a session touches a file it governs;
 *   · CLAUDE.md stays an index of at most 10 KB (the per-surface digest moved to
 *     sentinel/DIGEST.md, read on demand);
 *   · every rule file stays under its recorded ceiling, and a new rule file under
 *     20 000 bytes.
 *
 * ⚠ THE CEILINGS ARE A RATCHET. They are the sizes on 2026-10-12. A capture goes
 * into the ADR it concerns and the rule links it; when a rule shrinks, lower its
 * ceiling to the new size. Raising a ceiling to fit a capture is the regrowth this
 * test exists to stop.
 *
 * Sizes are counted with LF line endings, so a Windows checkout (CRLF) and CI (LF)
 * read the same numbers.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const RULES_DIR = join(ROOT, ".claude", "rules");

const readLf = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const byteSize = (text: string) => Buffer.byteLength(text, "utf8");

const CLAUDE_MD_CEILING = 10_240;
const NEW_RULE_CEILING = 20_000;

/** Bytes (LF) of each rule on 2026-10-12, after the four unscoped rules were scoped. */
const RULE_CEILINGS: Record<string, number> = {
  "arcs.md": 151_980,
  "auth.md": 5_336,
  "brandmark.md": 21_199,
  "interface-kit.md": 8_347,
  "landing-v7.md": 43_983,
  "lattice.md": 10_359,
  "mobile-sections.md": 53_417,
  "musings.md": 49_302,
  "proof-stack.md": 52_205,
  "proof.md": 245_904,
  "scroll-animations.md": 11_048,
  "services-ring.md": 53_331,
  "sessions.md": 4_772,
  "sheet.md": 27_388,
  "supabase.md": 695,
  "trinny-london.md": 123_877,
  "type-material.md": 7_118,
  "voidwalker.md": 117_082,
};

const WHAT_TO_DO =
  "Move the new ruling into its ADR under sentinel/decisions/ and link it; " +
  "lower the ceiling when a rule shrinks.";

const ruleFiles = readdirSync(RULES_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

describe("context budget: house rules load where they govern (2026-10-12)", () => {
  it("finds the rule files", () => {
    expect(ruleFiles.length).toBeGreaterThan(0);
  });

  describe.each(ruleFiles)(".claude/rules/%s", (file) => {
    const rel = `.claude/rules/${file}`;
    const text = readLf(rel);

    it("opens with YAML frontmatter holding a non-empty paths: list", () => {
      const scoped =
        `${rel} must open with YAML frontmatter ('---', a 'paths:' list of the files it ` +
        "governs, '---'). A prose **Paths:** line is ignored by Claude Code, so the rule " +
        "would load into every session.";
      expect(text.startsWith("---\n"), scoped).toBe(true);
      const { data } = matter(text);
      const paths: unknown = data.paths;
      expect(Array.isArray(paths), scoped).toBe(true);
      const globs = paths as unknown[];
      expect(globs.length, scoped).toBeGreaterThan(0);
      for (const glob of globs) {
        expect(typeof glob === "string" && glob.trim().length > 0, scoped).toBe(true);
      }
    });

    it("stays under its recorded ceiling", () => {
      const size = byteSize(text);
      const recorded = RULE_CEILINGS[file];
      const ceiling = recorded ?? NEW_RULE_CEILING;
      const where =
        recorded === undefined
          ? `${rel} is a new rule: ${size} bytes against the ${NEW_RULE_CEILING} a new rule may start at.`
          : `${rel} is ${size} bytes against its recorded ceiling of ${ceiling}.`;
      expect(size, `${where} ${WHAT_TO_DO}`).toBeLessThanOrEqual(ceiling);
    });
  });

  it("every recorded ceiling names a rule that exists", () => {
    const stale = Object.keys(RULE_CEILINGS).filter((f) => !ruleFiles.includes(f));
    expect(
      stale,
      "A ceiling outlived its rule; delete its entry (a renamed rule keeps its old ceiling)."
    ).toEqual([]);
  });

  it("CLAUDE.md stays an index of at most 10 KB", () => {
    const size = byteSize(readLf("CLAUDE.md"));
    expect(
      size,
      `CLAUDE.md is ${size} bytes against its ${CLAUDE_MD_CEILING}-byte ceiling: it is an ` +
        "index, not a ledger. " +
        WHAT_TO_DO +
        " A contract that binds one surface belongs in that surface's path-scoped rule."
    ).toBeLessThanOrEqual(CLAUDE_MD_CEILING);
  });
});
