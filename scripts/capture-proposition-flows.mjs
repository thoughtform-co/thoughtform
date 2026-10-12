/**
 * capture-proposition-flows — stills of /test/proposition-flows, one per block.
 *   node scripts/capture-proposition-flows.mjs [--port 3003] [--vp 1470x830]
 */
import { chromium } from "@playwright/test";
const args = process.argv.slice(2);
const argOf = (f, d) => (args.indexOf(f) >= 0 ? args[args.indexOf(f) + 1] : d);
const PORT = argOf("--port", "3003");
const [W, H] = argOf("--vp", "1470x830").split("x").map(Number);
const OUT = "docs/design/xbionic-proposal/flows";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: H } });
await p.goto(`http://localhost:${PORT}/test/proposition-flows`, { waitUntil: "load", timeout: 180000 });
await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await p.waitForTimeout(800);
for (const id of ["map", "a", "b", "c"]) {
  await p.locator(`#${id}`).screenshot({ path: `${OUT}/flows-${id}-${W}x${H}.png` });
  console.log("shot", id);
}
await b.close();
