import type { Page } from "@playwright/test";

/**
 * The terminal-motion drive — ONE source for every arc smoke (ADR-072).
 *
 * Hoisted verbatim out of `arc-terminal-smoke.spec.ts` so the portfolio
 * smoke parks beats with the same stepped scroll and the same settle
 * (a spec cannot import a spec without registering its tests twice).
 * Every drive is a REAL stepped scroll, never a teleport: the arm/strike
 * ladder has to sequence, and a jump skips the states being asserted.
 */
/** Kill smooth scrolling so a stepped drive lands where we asked. */
export async function prepare(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "html{scroll-behavior:auto !important}" });
  await page.waitForTimeout(500);
}

/** Stepped real scroll — the ladder must sequence, so never teleport. */
export async function driveTo(page: Page, y: number, steps = 8) {
  const from = await page.evaluate(() => window.scrollY);
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((t) => window.scrollTo(0, t), Math.round(from + ((y - from) * i) / steps));
    await page.waitForTimeout(70);
  }
}

/** Scroll a beat to its park: its stage bottom meeting the viewport bottom. */
export async function parkBeat(page: Page, id: string, steps = 8) {
  const geo = await page.evaluate((id) => {
    const s = document.getElementById(id);
    if (!s) return null;
    const stage = s.querySelector<HTMLElement>(".arc-stage");
    return {
      top: Math.round(s.getBoundingClientRect().top + window.scrollY),
      stageH: stage?.offsetHeight ?? 0,
    };
  }, id);
  if (!geo) throw new Error(`no beat #${id}`);
  await driveTo(page, geo.top + Math.max(0, geo.stageH - page.viewportSize()!.height), steps);
  // Wait for the decode to settle rather than sleeping a fixed guess.
  await page
    .locator(`#${id} .arc-stage[data-reveal="done"]`)
    .waitFor({ state: "attached", timeout: 15_000 });
}

export const beatState = (page: Page, id: string) =>
  page.evaluate((id) => {
    const s = document.getElementById(id)!;
    const stage = s.querySelector<HTMLElement>(".arc-stage")!;
    const head = stage.querySelector<HTMLElement>(".arc-head, .arc-inter__band, .arc-close__band");
    const plane = stage.querySelector<HTMLElement>(".arc-plane")!;
    const targets = [...stage.querySelectorAll<HTMLElement>("[data-arc-decode]")];
    return {
      reveal: stage.getAttribute("data-reveal"),
      secIn: stage.style.getPropertyValue("--sec-in"),
      secOut: stage.style.getPropertyValue("--sec-out"),
      headTransform: head ? getComputedStyle(head).transform : null,
      headOpacity: head ? Number(getComputedStyle(head).opacity) : null,
      planeClip: getComputedStyle(plane).clipPath,
      planeOpacity: Number(getComputedStyle(plane).opacity),
      total: targets.length,
      resolved: targets.filter((el) => el.textContent === el.dataset.arcDecode).length,
      blank: targets.filter((el) => el.textContent === "").length,
    };
  }, id);
