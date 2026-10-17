import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { CASES } from "@/app/(internal)/test/proposal-swarm-v2/dossier/cases";
import {
  GLYPH_NAMES,
  GLYPHS,
  workstreamGlyph,
} from "@/app/(internal)/test/proposal-swarm-v2/dossier/Glyph";
import {
  ASSET_PREFIXES,
  assertCase,
  cutCase,
  KINDS,
  LETTER_CAP,
  letteredCount,
  SHORT_MAX,
  SHORT_MIN,
  stillsOf,
} from "@/app/(internal)/test/proposal-swarm-v2/dossier/story";
import type { Case } from "@/app/(internal)/test/proposal-swarm-v2/dossier/types";
import {
  AFTER_ID,
  BEFORE_ID,
  DOSSIER_ENTRY,
  JOB_IDS,
  LINE,
  spliceCases,
} from "@/app/(internal)/test/proposal-swarm-v2/splice";
import { X_BIONIC_PROPOSAL_ARC as PROD } from "@/lib/arcs/content/x-bionic-proposal";

const ROOT = resolve(__dirname, "../..");
const LAB = join(ROOT, "app/(internal)/test/proposal-swarm-v2");
const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");

/** Every string in a value, with where it sits. */
function walk(value: unknown, path: string, visit: (s: string, at: string) => void) {
  if (typeof value === "string") visit(value, path);
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`, visit));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`, visit);
  }
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

/** The clients' people, by the names their records use. Case-sensitive. */
const PEOPLE = /\b(Katia|Rita|Job|Vince|Alexander|Marco|Kate|Nick|Lottie|Adam|Rob|Nadine)\b/;

describe("the splice", () => {
  const entries = [DOSSIER_ENTRY];
  const s = spliceCases(PROD.sections, 2, entries);

  it("takes out exactly the four job panels and nothing else", () => {
    const kept = [...s.head, ...s.tail].map((x) => x.id);
    for (const id of JOB_IDS) expect(kept).not.toContain(id);
    const expected = PROD.sections
      .slice(2)
      .map((x) => x.id)
      .filter((id) => !(JOB_IDS as readonly string[]).includes(id));
    expect(kept).toEqual(expected);
  });

  it("numbers what follows the dossier as the swarm page did", () => {
    const at = PROD.sections.findIndex((x) => x.id === AFTER_ID);
    expect(s.tailOffset).toBe(at);
    expect(s.tail[0].id).toBe(AFTER_ID);
    expect(s.head[s.head.length - 1].id).toBe(BEFORE_ID);
  });

  it("keeps the line's sentence but for 'other', and hands its menu entry on", () => {
    const line = s.head.find((x) => x.id === BEFORE_ID);
    expect(line && "line" in line ? line.line : null).toEqual(LINE);
    expect(s.menu.find((m) => m.id === BEFORE_ID)).toBeUndefined();
    const original = PROD.sections.find((x) => x.id === BEFORE_ID);
    expect(original && "line" in original ? original.line.pre : "").toContain("other brands");
  });

  it("lists the dossier, a chapter of the page, where the jobs were; never a case", () => {
    const ids = s.menu.map((m) => m.id);
    const dossier = s.menu.find((m) => m.id === DOSSIER_ENTRY.id);
    expect(dossier).toEqual({ id: "cases", label: "The cases", primary: true });
    expect(ids.indexOf(DOSSIER_ENTRY.id)).toBe(ids.indexOf(AFTER_ID) - 1);
    expect(ids.some((id) => id.startsWith("case-"))).toBe(false);
    for (const id of JOB_IDS) expect(ids).not.toContain(id);
  });

  it("refuses a record whose jobs moved", () => {
    const moved = PROD.sections.filter((x) => x.id !== "job-ops");
    expect(() => spliceCases(moved, 2, entries)).toThrow();
  });
});

describe("the cases", () => {
  it("are Loop, Samako and Suri, in that order", () => {
    expect(CASES.map((c) => c.id)).toEqual(["loop", "samako", "suri"]);
  });

  for (const c of CASES) {
    describe(c.id, () => {
      it("hold the template's own checks", () => {
        expect(() => assertCase(c)).not.toThrow();
      });

      it("open on a header: three short numbers and one briefing", () => {
        expect(c.stats).toHaveLength(3);
        for (const s of c.stats) {
          expect(s.value.length, s.label).toBeLessThanOrEqual(12);
          expect(s.label.length, s.label).toBeLessThanOrEqual(56);
        }
        expect(c.brief.text.length).toBeLessThanOrEqual(140);
      });

      it("carry the client's logo (a file on disk) and its colour", () => {
        expect(c.logo.src.startsWith("/test/proposal-swarm-v2/logos/")).toBe(true);
        expect(existsSync(join(ROOT, "public", c.logo.src))).toBe(true);
        for (const rgb of [c.tint.dots, c.tint.glow]) {
          expect(rgb).toMatch(/^\d{1,3}, \d{1,3}, \d{1,3}$/);
        }
      });

      it("carry their labels: a project with an icon, a type of work, a name a chapter", () => {
        expect(c.project.length).toBeGreaterThan(0);
        expect(c.project.length).toBeLessThanOrEqual(18);
        expect(GLYPH_NAMES).toContain(c.glyph);
        expect(["play", "flow"]).toContain(workstreamGlyph(c.workstream));
        for (const ch of c.chapters) {
          expect(ch.nav, ch.id).toBeTruthy();
          expect((ch.nav ?? "").split(" ").length, ch.id).toBeLessThanOrEqual(3);
        }
      });

      it(`show ${SHORT_MIN} to ${SHORT_MAX} chapters in the short cut, every one in the full`, () => {
        const short = cutCase(c, "short").chapters.length;
        expect(short).toBeGreaterThanOrEqual(SHORT_MIN);
        expect(short).toBeLessThanOrEqual(SHORT_MAX);
        expect(cutCase(c, "full").chapters).toHaveLength(c.chapters.length);
      });

      it("draw only the known kinds, never raw html, under the letter cap", () => {
        const figures = [c.opening.figure, ...c.chapters.map((ch) => ch.frame.figure)];
        for (const f of figures) {
          expect(KINDS).toContain(f.kind);
          expect(letteredCount(f)).toBeLessThanOrEqual(LETTER_CAP);
        }
        expect(JSON.stringify(c)).not.toMatch(/<[a-z][^>]*>/i);
      });

      it("point only at pictures already published with the site, and on disk", () => {
        const figures = [c.opening.figure, ...c.chapters.map((ch) => ch.frame.figure)];
        for (const s of figures.flatMap(stillsOf)) {
          expect(ASSET_PREFIXES.some((p) => s.src.startsWith(p))).toBe(true);
          expect(existsSync(join(ROOT, "public", s.src))).toBe(true);
        }
      });

      it("name people by role, never by name", () => {
        walk(c as Case, c.id, (s, at) => {
          expect(PEOPLE.test(s), `${at}: "${s}"`).toBe(false);
        });
      });

      it("keep the claims concise: at most three, each a few words, a call short too", () => {
        for (const ch of c.chapters) {
          expect(ch.thought.length).toBeLessThanOrEqual(3);
          for (const t of ch.thought) expect(t.length, t).toBeLessThanOrEqual(36);
          if (ch.call) expect(`${ch.call.who}: ${ch.call.said}`.length).toBeLessThanOrEqual(48);
        }
      });
    });
  }

  it("show no money for Samako", () => {
    const samako = CASES.find((c) => c.id === "samako");
    walk(samako, "samako", (s, at) => {
      expect(/[$€]\s?\d/.test(s), `${at}: "${s}"`).toBe(false);
    });
  });
});

describe("the particle icons", () => {
  it("are 7 × 7 fields of grains", () => {
    for (const name of GLYPH_NAMES) {
      const rows = GLYPHS[name];
      expect(rows, name).toHaveLength(7);
      for (const r of rows) expect(r, name).toMatch(/^[#.]{7}$/);
    }
  });

  it("tell production and operations apart", () => {
    expect(workstreamGlyph("Creative production")).toBe("play");
    expect(workstreamGlyph("Creative operations")).toBe("flow");
  });
});

describe("the lab stays self-contained", () => {
  const dossier = files(join(LAB, "dossier")).filter((p) => /\.(ts|tsx)$/.test(p));
  const ALLOWED = /^(react|\.{1,2}\/.*|@\/lib\/arcs\/content\/shared\/suriDriveMap)$/;

  it("imports nothing from the arcs, the landing or the lattice components", () => {
    for (const p of dossier) {
      for (const m of read(p).matchAll(/from\s+"([^"]+)"/g)) {
        expect(ALLOWED.test(m[1]), `${p}: ${m[1]}`).toBe(true);
      }
    }
  });

  const css = read(join(LAB, "dossier/dossier.css"));

  it("letters nothing under 12px", () => {
    for (const m of css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) {
      expect(Number(m[1])).toBeGreaterThanOrEqual(12);
    }
    for (const m of css.matchAll(/font:\s*(\d+(?:\.\d+)?)px/g)) {
      expect(Number(m[1])).toBeGreaterThanOrEqual(12);
    }
  });

  it("rounds no corner and contains nothing", () => {
    expect(css).not.toMatch(/border-radius/);
    expect(css).not.toMatch(/(^|[\s;{])contain\s*:/m);
  });

  it("draws no vertical divider of its own between the words and the figures", () => {
    for (const sel of [
      ".csd-run {",
      ".csd-run__words {",
      ".csd-run__figs {",
      ".csd-run__stick {",
    ]) {
      const at = css.indexOf(sel);
      expect(at, sel).toBeGreaterThanOrEqual(0);
      const block = css.slice(at, css.indexOf("}", at));
      expect(block, sel).not.toMatch(/border-(left|right)/);
    }
  });

  it("cuts its frame with the TR + BL pair only", () => {
    const at = css.indexOf(".csd-frame {");
    const block = css.slice(at, css.indexOf("}", at));
    expect(block).toMatch(/calc\(100% - var\(--ch\)\) 0/);
    expect(block).toMatch(/var\(--ch\) 100%/);
    expect(block).not.toMatch(/0 var\(--ch\),/);
  });
});
