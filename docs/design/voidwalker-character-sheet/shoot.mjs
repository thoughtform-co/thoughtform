// Renders each .dc.html as plain HTML and screenshots the stage, so the
// composition can be checked before publishing. Also reports overflow.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
const { chromium } = await import(new URL("file:///C:/Users/buyss/Manifold Delta/Artifacts/01_thoughtform/node_modules/playwright/index.mjs").href);

const files = readdirSync(".").filter((f) => f.endsWith(".dc.html")).sort();
const holo = "data:image/jpeg;base64," + readFileSync("holo.jpg").toString("base64");
const film = "data:image/jpeg;base64," + readFileSync("film.jpg").toString("base64");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1256 }, deviceScaleFactor: 1 });
const report = [];

for (const f of files) {
  let src = readFileSync(f, "utf8")
    .replace(/<script src="\.\/support\.js"><\/script>/, "")
    .replace(/<\/?x-dc>/g, "")
    .replace(/<helmet>/, "").replace(/<\/helmet>/, "")
    .replace(/src="holo\.jpg"/g, `src="${holo}"`)
    .replace(/src="film\.jpg"/g, `src="${film}"`);
  const out = f.replace(".dc.html", ".preview.html");
  writeFileSync(out, src);
  await page.goto("file:///" + process.cwd().replace(/\\/g, "/") + "/" + out);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);

  const m = await page.evaluate(() => {
    const st = document.querySelector(".stage");
    const sb = st.getBoundingClientRect();
    const bad = [];
    for (const el of st.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (/g|glow|amb|arc/.test(el.className || "")) continue; // decorative bleed is clipped by design
      const over =
        (r.left < sb.left - 0.5 ? "L" : "") + (r.right > sb.right + 0.5 ? "R" : "") +
        (r.top < sb.top - 0.5 ? "T" : "") + (r.bottom > sb.bottom + 0.5 ? "B" : "");
      if (over) bad.push(`${el.className || el.tagName}[${over}] ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    // font-family roll-call: anything not PT Mono / PP Neue Montreal is a third family
    const fams = new Set();
    for (const el of st.querySelectorAll("*"))
      if (el.textContent && el.children.length === 0 && el.textContent.trim())
        fams.add(getComputedStyle(el).fontFamily.split(",")[0].replace(/"/g, ""));
    // smallest rendered type
    let min = 99, minEl = "";
    for (const el of st.querySelectorAll("*"))
      if (el.children.length === 0 && el.textContent.trim()) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < min) { min = fs; minEl = el.className || el.tagName; }
      }
    const ttl = st.querySelector(".ttl");
    return {
      overflow: bad.slice(0, 12), families: [...fams], minPx: min, minEl,
      titlePx: ttl ? getComputedStyle(ttl).fontSize : "-",
      titleBox: ttl ? (() => { const r = ttl.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })() : "-",
    };
  });
  report.push({ f, ...m });
  await page.locator(".stage").screenshot({ path: f.replace(".dc.html", ".png") });
  console.log(`${f.padEnd(22)} minPx=${m.minPx} (${m.minEl})  title=${m.titlePx}/${m.titleBox}  fams=${m.families.join("|")}  overflow=${m.overflow.length}`);
  if (m.overflow.length) m.overflow.forEach((o) => console.log("    ! " + o));
}
await browser.close();
writeFileSync("report.json", JSON.stringify(report, null, 2));
