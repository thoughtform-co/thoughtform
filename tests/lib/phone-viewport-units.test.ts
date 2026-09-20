import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blocks, stripComments } from "./helpers/cssBlocks";

/**
 * ADR-113 — no live viewport unit inside phone CONTENT.
 *
 * On iOS Safari `svh` is the small viewport and holds; `dvh` follows the
 * toolbar and `lvh` is the large one. A box on the landing that spends a
 * `dvh` term reflows for every frame of the bar animation, which the owner
 * read as the section "settling" (the era stops rode `100dvh − 100svh` for
 * one day, ADR-082 U26 → ADR-113). mobile-sections.md §8 states the law:
 * content stays in svh; a BACKDROP takes `100dvh; min-height: 100lvh`; the
 * fixed chrome is pinned to the real floor.
 *
 * ⚠ CHROMIUM CANNOT SEE ANY OF THIS — every Playwright project resolves the
 * three units to one number, so the phone probes measure the same box before
 * and after a `dvh` term is added or removed. This file is the in-repo proof.
 *
 * Every `dvh`/`lvh` declaration in the landing's sheets must be one of the
 * named exceptions below, by SELECTOR PATH (never by file), and each sheet's
 * total is pinned so a new declaration under an allowed selector still stops
 * here and has to be argued for. The pins are a ratchet: they only go down.
 */

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** The sheets the landing route renders on a phone (the arcs, the proposal
 *  and the workshop routes have their own compositions and are not swept). */
const SHEETS = [
  "app/styles/variables.css",
  "app/styles/base.css",
  "components/landing/v7/landing.css",
  "components/landing/v7/theme.css",
  "components/landing/v7/rail-instruments/rail-instruments.css",
  "components/landing/v7/site-footer/site-footer.css",
  "components/landing/home-v2/home-v2.css",
  "components/landing/home-v2/services/services.css",
  "components/landing/home-v2/services/proof-stack/proof-stack.css",
  "components/landing/home-v2/services/casefile/casefile.css",
  "components/landing/home-v2/services/casefile/console/console.css",
  "components/landing/home-v2/services/casefile/map/pda/pda.css",
  "components/landing/home-v2/about/about-stage.css",
  "components/landing/home-v2/voidwalker/voidwalker.css",
  "components/landing/home-v2/voidwalker/voidwalker-wire.css",
  "components/landing/home-v2/voidwalker/voidwalker-travel.css",
  "components/landing/home-v2/voidwalker/hologram/voidwalker-hologram.css",
  "components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css",
] as const;

type Allow = { sheet: string; path: RegExp; why: string };

/** The named exceptions. A match is on the block's nesting-aware selector
 *  path, so a rule inside `@media` is judged by its own selector. */
const ALLOW: Allow[] = [
  {
    sheet: "components/landing/v7/landing.css",
    path: /(^|\s)\.hud__rail$|\.hud__corner--(tl|br)$/,
    why: "the HUD's curtain-reveal clips — paired with --hero-lift = scrollY / innerHeight by design (the hero is 100dvh)",
  },
  {
    sheet: "components/landing/v7/rail-instruments/rail-instruments.css",
    path: /\.rin-settings__row$|\.hud__rail$|\.hud__corner--tl$/,
    why: "the same curtain-reveal clips, restated for the instrument rail",
  },
  {
    sheet: "components/landing/v7/landing.css",
    path: /^\.hero$/,
    why: "the hero is the one 100dvh box on purpose: lift = 1 ⇔ the curtain has cleared, on every device (landing.css §hero)",
  },
  {
    sheet: "components/landing/v7/landing.css",
    path: /^\.station$/,
    why: "binds only on #contact, the footer: its grid is auto 1fr auto with the slot stretched, so the growth goes into the middle row and the legal bar hugs the real floor (ADR-113)",
  },
  {
    sheet: "components/landing/v7/landing.css",
    path: /^body\.density-(spacious|dense) \.station$/,
    why: "admin density classes; never on the public landing",
  },
  {
    sheet: "components/landing/v7/landing.css",
    path: /^\.ilayer(__inner)?$|^\.build-quote-runway$|^\.station\.station--cover$/,
    why: "the prototype's pinned stations — replaced at parse time by the corridor (CORRIDOR_REPLACED_STATIONS); the cover interstitial is a sticky backdrop, not content",
  },
  {
    sheet: "components/landing/home-v2/home-v2.css",
    path: /\.home-v2-stage__canvas/,
    why: "the corridor's docked canvas is a BACKDROP: 100dvh with a 100lvh floor, nothing laid out inside it (ADR-082 U26)",
  },
];

/** Today's counts. Lower a pin when a term goes; raising one is an ADR line. */
const PINS: Record<(typeof SHEETS)[number], number> = {
  "app/styles/variables.css": 0,
  "app/styles/base.css": 0,
  "components/landing/v7/landing.css": 12,
  "components/landing/v7/theme.css": 0,
  "components/landing/v7/rail-instruments/rail-instruments.css": 3,
  "components/landing/v7/site-footer/site-footer.css": 0,
  "components/landing/home-v2/home-v2.css": 2,
  "components/landing/home-v2/services/services.css": 0,
  "components/landing/home-v2/services/proof-stack/proof-stack.css": 0,
  "components/landing/home-v2/services/casefile/casefile.css": 0,
  "components/landing/home-v2/services/casefile/console/console.css": 0,
  "components/landing/home-v2/services/casefile/map/pda/pda.css": 0,
  "components/landing/home-v2/about/about-stage.css": 0,
  "components/landing/home-v2/voidwalker/voidwalker.css": 0,
  "components/landing/home-v2/voidwalker/voidwalker-wire.css": 0,
  "components/landing/home-v2/voidwalker/voidwalker-travel.css": 0,
  "components/landing/home-v2/voidwalker/hologram/voidwalker-hologram.css": 0,
  "components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css": 0,
};

const LIVE_UNIT = /\d(?:\.\d+)?(?:dvh|lvh)\b/;

type Hit = { path: string; decl: string };

function liveUnitHits(css: string): Hit[] {
  const hits: Hit[] = [];
  for (const b of blocks(stripComments(css))) {
    for (const raw of b.decls.split(";")) {
      const decl = raw.trim().replace(/\s+/g, " ");
      if (LIVE_UNIT.test(decl)) hits.push({ path: b.path.replace(/\s+/g, " "), decl });
    }
  }
  return hits;
}

describe("no live viewport unit inside phone content (ADR-113)", () => {
  for (const sheet of SHEETS) {
    it(`${sheet}: every dvh/lvh term is a named exception, and the count is pinned`, () => {
      const hits = liveUnitHits(read(sheet));
      for (const h of hits) {
        const ok = ALLOW.some((a) => a.sheet === sheet && a.path.test(h.path));
        expect(
          ok,
          `${sheet}\n  [${h.path}]  ${h.decl}\n  is a dvh/lvh term inside content. Content stays in svh ` +
            `(mobile-sections.md §8); a backdrop or a curtain clip is named in ALLOW with its reason.`
        ).toBe(true);
      }
      expect(hits.length, `${sheet}: dvh/lvh count moved (pinned ${PINS[sheet]})`).toBe(
        PINS[sheet]
      );
    });
  }

  it("every ALLOW entry still matches something (a stale exception is a hole)", () => {
    for (const a of ALLOW) {
      const hits = liveUnitHits(read(a.sheet));
      expect(
        hits.some((h) => a.path.test(h.path)),
        `${a.sheet} ${a.path} matches no declaration any more — delete the entry`
      ).toBe(true);
    }
  });

  it("the era band's clearance is the constant chrome band, not the live toolbar term", () => {
    const css = stripComments(
      read("components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css")
    );
    const phone = blocks(css).find(
      (b) => /max-width:\s*700px/.test(b.path) && /(^|\s)\.vwd$/.test(b.path)
    );
    expect(phone, "the ≤700 .vwd block is gone").toBeDefined();
    const m = /--vwd-chrome-clear\s*:\s*([^;]+);/.exec(phone!.decls);
    expect(m, "the ≤700 .vwd block declares no --vwd-chrome-clear").not.toBeNull();
    const value = m![1].replace(/\s+/g, " ").trim();
    expect(value).toBe("var(--mobile-chrome-bottom, 56px)");
    expect(value).not.toMatch(/dvh|lvh/);
  });
});
