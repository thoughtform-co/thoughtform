/* Binds the stills into one landscape PDF, a page per still at 1920×1080
   CSS px, each embedded as a high-quality JPEG. Usage: node pdf.mjs <dir> <out.pdf> */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
const [dir, outPdf] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
const b = await chromium.launch();
const p = await b.newPage();
const jpgs = [];
for (const f of files) {
  const data = fs.readFileSync(path.join(dir, f)).toString("base64");
  await p.setContent(`<img id=i src="data:image/png;base64,${data}">`);
  const jpg = await p.evaluate(async () => {
    const i = document.getElementById("i"); await i.decode();
    const c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight;
    c.getContext("2d").drawImage(i, 0, 0); return c.toDataURL("image/jpeg", 0.9);
  });
  jpgs.push(jpg);
}
const html = `<!doctype html><style>@page{size:1920px 1080px;margin:0}html,body{margin:0;background:#0a0908}
img{display:block;width:1920px;height:1080px;page-break-after:always;break-after:page}img:last-child{page-break-after:auto;break-after:auto}</style>
${jpgs.map((j) => `<img src="${j}">`).join("")}`;
await p.setContent(html, { waitUntil: "load" });
await p.pdf({ path: outPdf, width: "1920px", height: "1080px", printBackground: true, pageRanges: "" });
await b.close();
console.log(outPdf, (fs.statSync(outPdf).size / 1e6).toFixed(1) + " MB", files.length + " pages");
