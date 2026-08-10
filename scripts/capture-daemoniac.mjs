// Headless captures of /test/daemoniac — static DOM/SVG + 2D canvas,
// so headless is safe (no WebGL corridor on this route).
import { chromium } from "@playwright/test";

const OUT = process.argv[2];
const BASE = "http://localhost:3003/test/daemoniac";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
});
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector(".dae-lab__plate svg", { timeout: 30000 });

const chip = (label) => page.locator(".dae-lab__chip", { hasText: label }).first();
const row = (name) => page.locator(".dae-lab__row", { hasText: name }).first();
const shoot = async (file) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log("wrote", file);
};

// 1 · Voidwalker (person-led · decides-alone — the broken ring), void ground.
await shoot("daemoniac-01-voidwalker-void.png");

// 2 · The same bind on parchment — the tome-plate reading.
await chip("PARCHMENT").click();
await shoot("daemoniac-02-voidwalker-parchment.png");

// 3 · Wayfinder (agent · wide — the gated ring), void.
await chip("VOID").click();
await row("Wayfinder").click();
await shoot("daemoniac-03-wayfinder-void.png");

// 4 · Mímir (tool · bounded — double ring, diamond armature), void.
await row("Mímir").click();
await shoot("daemoniac-04-mimir-void.png");

// 5 · The stipple, full inscription (Vesper — the owner's reference shot).
await row("Vesper").click();
await chip("PARTICLES").click();
await page.waitForSelector(".dae-field__canvas");
await shoot("daemoniac-05-vesper-stipple.png");

// 5b · Mid-ritual (~55%).
await page.locator(".dae-lab__scrub").fill("55");
await shoot("daemoniac-05b-vesper-stipple-55.png");

// 6 · The specimen sheet on parchment — the alphabet as a tome page.
await chip("SPECIMEN").click();
await chip("PARCHMENT").click();
await shoot("daemoniac-06-specimen-parchment.png");

await browser.close();
