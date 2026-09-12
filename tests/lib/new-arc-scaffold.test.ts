import { describe, expect, it } from "vitest";

/* A plain .mjs script module, deliberately untyped: the scaffold is a
   script, not part of the app's graph. TS resolves it through allowJs, so
   no directive is needed — one added "just in case" is itself an error. */
import { constantCase, proposalModule, FILL_IN } from "../../scripts/new-arc/proposalTemplate.mjs";

/**
 * The proposal scaffold (ADR-098).
 *
 * ⚠ WHAT THIS GUARDS IS THAT THE SCAFFOLD SHIPS A WORKING PAGE. Armada's
 * day-one command runs `scripts/new-arc.mjs` unattended, so a skeleton that
 * left placeholders, or an unbalanced quote, or a section the copy law
 * rejects would leave `npm run verify` failing in a repo nobody had opened.
 * The template function is pure, so the whole shape can be asserted without
 * touching the filesystem or the registry.
 *
 * The end-to-end proof — scaffold, register, and every registry guard green
 * — was run by hand on a throwaway client before this landed; what stays
 * here is the part that is cheap to run on every commit.
 */
const build = (over: Record<string, string> = {}) =>
  proposalModule({ client: "acme", name: "Acme", engagement: "proposal", ...over }) as string;

describe("the proposal scaffold (ADR-098)", () => {
  it("names the module and the constant from the slug", () => {
    expect(constantCase("tom-on-the-moon")).toBe("TOM_ON_THE_MOON");
    const src = build();
    expect(src).toContain("export const ACME_PROPOSAL_ARC: ArcDef = {");
    expect(src).toContain('slug: "acme-proposal"');
    expect(src).toContain('client: "acme"');
    expect(src).toContain('format: "proposal"');
    expect(src).toContain('theme: "light"');
  });

  it("leaves NO placeholder but the configuration's ghost tile", () => {
    /* The one bracket that is honest: a workstream that is not scoped yet.
       Every other `[...]` would be an unfinished page on a live route, and
       the registry test walks for exactly this. */
    const brackets = build().match(/\[[A-Z][^\]]*\]/g) ?? [];
    expect(brackets).toEqual(["[Next team]"]);
  });

  it("interpolates the client's name and escapes it as a string literal", () => {
    const src = build({ name: 'Tom "on the" Moon' });
    // A name with quotes in it must not break the module it is written into.
    expect(src).toContain('\\"on the\\"');
    expect(src).not.toContain('name: "Tom "on the" Moon"');
  });

  it("holds the client-facing copy law the registry test enforces", () => {
    /* The whole file, minus the one line the registry test also exempts:
       every arc's tab title is `<name> — Thoughtform`, the site's own
       convention, and the law is about the copy a reader reads. Everything
       else in the skeleton — its comments included — holds the law, which
       is why this can scan the raw source rather than picking strings out
       of it. */
    const src = build()
      .split("\n")
      .filter((line) => !/^\s*title: .*Thoughtform/.test(line))
      .join("\n");
    for (const [pattern, what] of [
      [/\bself-sufficient\b/i, "says the word instead of the behaviour"],
      [/\barmada\b/i, "fleet vocabulary"],
      [/\bcallsign\b/i, "fleet vocabulary"],
      [/—/, "em dash"],
    ] as const) {
      expect(pattern.test(src), `the skeleton ${what}`).toBe(false);
    }
  });

  it("carries the chapters the header expects, and closes on a close", () => {
    const src = build();
    // At most five chapters (ADR-073's cap), and the last section is the
    // close, which is the exit mark on every arc's corner roster.
    expect((src.match(/menuPrimary: true/g) ?? []).length).toBeLessThanOrEqual(5);
    expect(src.lastIndexOf('kind: "close"')).toBeGreaterThan(src.lastIndexOf('kind: "cards"'));
    expect(src).toContain('kind: "configuration"');
  });

  it("prints a fill-in list in the order the page reads", () => {
    expect(FILL_IN.length).toBeGreaterThan(0);
    expect(FILL_IN[0]).toMatch(/configuration/i);
  });
});
