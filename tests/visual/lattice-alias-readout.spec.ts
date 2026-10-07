import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

/**
 * ADR-149 Phase 2 — the house READOUT of the sheet's layout numbers, before
 * and after the aliases. Where `lattice-parity` compares pixels and dies at
 * the ruling, this compares COMPUTED VALUES and stays: the band's padding, a
 * section's padding, the console's chamfer, the seam's colour, the copy size,
 * per route × viewport × theme, against a committed JSON fixture.
 *
 *   UPDATE_READOUT=1 npx playwright test tests/visual/lattice-alias-readout.spec.ts --project=desktop   # record
 *   npx playwright test tests/visual/lattice-alias-readout.spec.ts --project=desktop                    # assert
 *
 * ⚠ A custom property is a string until something lays it out: the chamfer and
 * the copy size are resolved through a probe element, never read off
 * `getPropertyValue`.
 */

const FIXTURE = join(__dirname, "fixtures", "lattice-alias-readout.json");
/* `/home-sessions` left the sheet (ADR-150). */
const ROUTES = ["/arcs/loop", "/musings", "/musings/navigate-the-intelligence"];
const VIEWPORTS: [number, number][] = [
  [1280, 720],
  [1920, 1247],
];
const THEMES = ["dark", "light"] as const;

type Readout = {
  bandPaddingLeft: number;
  secPaddingTop: number;
  seam: string;
  rule: string;
  cardCh: number;
  copy: number;
  plate: string;
};

const fixture: Record<string, Readout> = existsSync(FIXTURE)
  ? JSON.parse(readFileSync(FIXTURE, "utf8"))
  : {};
const UPDATE = process.env.UPDATE_READOUT === "1";

test.describe("lattice alias readout (ADR-149)", () => {
  test.describe.configure({ mode: "serial" });
  for (const route of ROUTES) {
    for (const [w, h] of VIEWPORTS) {
      for (const theme of THEMES) {
        const key = `${route} ${w}x${h} ${theme}`;
        test(key, async ({ page }) => {
          await page.setViewportSize({ width: w, height: h });
          await page.goto(`${route}?theme=${theme}`);
          await page.locator(".sh-root[data-sh-ready]").waitFor({ timeout: 45_000 });
          const read = await page.evaluate((): Readout => {
            const root = document.querySelector<HTMLElement>(".sh-root")!;
            const band = document.querySelector<HTMLElement>(".sh-band")!;
            const sec = document.querySelector<HTMLElement>(".sh-sec")!;
            const probe = document.createElement("div");
            probe.style.cssText =
              "position:absolute;visibility:hidden;width:var(--sh-card-ch);height:var(--sh-copy);";
            root.appendChild(probe);
            const pr = probe.getBoundingClientRect();
            const cs = getComputedStyle(root);
            const seamProbe = document.createElement("div");
            seamProbe.style.cssText =
              "position:absolute;visibility:hidden;background:var(--sh-seam);border-color:var(--sh-rule);color:var(--sh-plate)";
            root.appendChild(seamProbe);
            const ss = getComputedStyle(seamProbe);
            const out = {
              bandPaddingLeft: parseFloat(getComputedStyle(band).paddingLeft),
              secPaddingTop: parseFloat(getComputedStyle(sec).paddingTop),
              seam: ss.backgroundColor,
              rule: ss.borderTopColor,
              cardCh: pr.width,
              copy: pr.height,
              plate: ss.color,
            };
            void cs;
            probe.remove();
            seamProbe.remove();
            return out;
          });
          if (UPDATE) {
            fixture[key] = read;
            writeFileSync(FIXTURE, JSON.stringify(fixture, null, 2) + "\n");
            return;
          }
          expect(fixture[key], `${key}: no fixture — record with UPDATE_READOUT=1`).toBeTruthy();
          const want = fixture[key];
          for (const k of Object.keys(want) as (keyof Readout)[]) {
            const a = read[k];
            const b = want[k];
            if (typeof a === "number" && typeof b === "number") {
              expect(Math.abs(a - b), `${key} ${k}: ${a} vs ${b}`).toBeLessThanOrEqual(0.5);
            } else {
              expect(a, `${key} ${k}`).toBe(b);
            }
          }
        });
      }
    }
  }
});
