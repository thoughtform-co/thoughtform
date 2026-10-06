#!/usr/bin/env node
/**
 * Export Suri's lunch and learn as a standalone page: an `index.html` and an
 * `assets/` folder that open from disk, with no server and no network.
 *
 * It runs against a dev server that is already up, renders
 * `/arcs/suri/lunch-and-learn`, scrolls the page so every reveal and decode
 * has settled, then lifts the part from "What this looks like at Suri." to
 * the contact station and the foot, together with the HUD frame and the
 * site's own stylesheets. Keeping the real CSS (rather than inlining computed
 * styles) is what keeps the export responsive and in both themes.
 *
 * Export-only changes, none of which touch the live page or its record:
 *   - the first section is retitled "Navigating Creative Intelligence at Suri."
 *   - the top-left corner bracket gives way to the SURI wordmark, seated in
 *     ADR-130's client-mark slot (`.arc-hud-client`) at the width of the
 *     docked Thoughtform wordmark in the opposite corner
 *   - the top-right menu and everything above `#workshop` are dropped
 *   - the stages, curve and spectrum ship their SVG figures (headless Chromium
 *     runs with 3D off, so `ArcHoloStageMount` takes its fallback)
 *   - `assets/export.js` replays the tabs, the curve steps, the loop clip and
 *     the theme switch
 *
 * Usage:
 *   node scripts/arcs/export-suri-lunch-and-learn.mjs \
 *     [--base http://localhost:3003] [--out exports/suri-creative-intelligence]
 *
 * Read the port off the running server; 3003 is only the default.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const BASE = arg("base", "http://localhost:3003").replace(/\/$/, "");
const OUT = path.resolve(arg("out", "exports/suri-creative-intelligence"));
const ROUTE = "/arcs/suri/lunch-and-learn";
const ORIGIN = new URL(BASE).origin;
const SITE = "https://thoughtform.co";
const TITLE = "Navigating Creative Intelligence at Suri";

const OLD_PRE = "What this looks like";
const NEW_PRE = "Navigating Creative Intelligence";

const log = (...m) => console.log("·", ...m);

/* ── Render and settle ────────────────────────────────────────────────── */

/** Scroll the whole document in viewport steps, until its height stops
 *  growing (the tail is mounted lazily), so every one-shot reveal fires. */
async function settle(page) {
  await page.waitForTimeout(2500);
  let last = 0;
  for (let pass = 0; pass < 4; pass += 1) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    if (height === last) break;
    last = height;
    const vh = await page.evaluate(() => innerHeight);
    for (let y = 0; y <= height; y += Math.round(vh * 0.5)) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      await page.waitForTimeout(70);
    }
  }
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })
  );
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll(".arc-reveal")].every((e) => e.classList.contains("is-in")),
      null,
      { timeout: 20000 }
    )
    .catch(() => log("warning: not every .arc-reveal reported is-in"));
  // Transitions and the decode kernel's last frames.
  await page.waitForTimeout(2500);
}

/** Everything the export needs from the settled page, serialised in-page. */
function capture({ oldPre, newPre }) {
  const abs = (u) => {
    try {
      return new URL(u, location.href).href;
    } catch {
      return u;
    }
  };
  const largest = (srcset) => {
    let best = null;
    for (const part of srcset.split(",")) {
      const [u, d] = part.trim().split(/\s+/);
      if (!u) continue;
      const n = parseFloat(d || "1");
      if (!best || n > best.n) best = { u, n };
    }
    return best ? best.u : null;
  };

  /* Media: what the browser actually showed, as an absolute URL, so the
     exporter can map it to a file. */
  for (const img of document.querySelectorAll("img")) {
    const shown = img.currentSrc || (img.srcset && largest(img.srcset)) || img.getAttribute("src");
    if (shown) img.setAttribute("src", abs(shown));
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    img.removeAttribute("loading");
    img.setAttribute("decoding", "async");
  }
  for (const source of document.querySelectorAll("picture source")) source.remove();
  for (const el of document.querySelectorAll("video[src], video[poster], source[src]")) {
    if (el.getAttribute("src")) el.setAttribute("src", abs(el.getAttribute("src")));
    if (el.getAttribute("poster")) el.setAttribute("poster", abs(el.getAttribute("poster")));
  }
  for (const el of document.querySelectorAll("image, use")) {
    for (const name of ["href", "xlink:href"]) {
      const v = el.getAttribute(name);
      if (v && !v.startsWith("#") && !v.startsWith("data:")) el.setAttribute(name, abs(v));
    }
  }
  for (const el of document.querySelectorAll("[style*='url(']")) {
    el.setAttribute(
      "style",
      el
        .getAttribute("style")
        .replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) =>
          u.startsWith("data:") || u.startsWith("#") ? m : `url("${abs(u)}")`
        )
    );
  }

  /* The loop clip autoplays muted in view (export.js); give it the
     attributes a browser's autoplay policy reads from markup. */
  for (const v of document.querySelectorAll("video.arc-inter__video")) {
    v.setAttribute("muted", "");
    v.setAttribute("loop", "");
    v.setAttribute("playsinline", "");
  }

  /* The retitle, in every text node and attribute of the first section, so
     a decode leaf and its ghost stay equal to their text. */
  const first = document.querySelector("#the-workshop");
  if (!first) throw new Error("#the-workshop not found");
  let hits = 0;
  const walker = document.createTreeWalker(first, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeValue.includes(oldPre)) {
      n.nodeValue = n.nodeValue.split(oldPre).join(newPre);
      hits += 1;
    }
  }
  for (const el of [first, ...first.querySelectorAll("*")]) {
    for (const a of [...el.attributes]) {
      if (a.value.includes(oldPre)) {
        el.setAttribute(a.name, a.value.split(oldPre).join(newPre));
        hits += 1;
      }
    }
  }

  /* Every one-shot reveal lands seated. A scroll pass fires most of them,
     but not the ones inside a worked tab that was hidden at the time, and
     not the first section's copy, which the proof hold keeps covered. */
  for (const el of document.querySelectorAll(".arc-reveal, [data-m]")) el.classList.add("is-in");

  /* Live-only machinery out. */
  const drop = (sel, scope = document) => scope.querySelectorAll(sel).forEach((e) => e.remove());
  drop("script, noscript, canvas, template");

  const strip = (root) => {
    const it = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
    const dead = [];
    for (let n = it.nextNode(); n; n = it.nextNode()) dead.push(n);
    dead.forEach((n) => n.remove());
    return root;
  };

  const hud = document.querySelector(".hud").cloneNode(true);
  drop("#hudBrandmark", hud);

  const station = (id) => {
    const el = document.querySelector(`#${id}`).cloneNode(true);
    el.classList.remove("is-offscreen");
    el.removeAttribute("style");
    return strip(el);
  };
  const workshop = station("workshop");
  const contact = station("contact");
  for (const el of contact.querySelectorAll("[data-m]")) el.classList.add("is-in");

  const attrs = (el) => [...el.attributes].map((a) => [a.name, a.value]);
  const ti = document.querySelector(".theme-instrument");
  const rin = document.querySelector(".rin-settings");
  const foot = document.querySelector("footer.foot");

  return {
    hits,
    html: attrs(document.documentElement).filter(([n]) => n !== "data-theme"),
    ti: attrs(ti),
    stations: attrs(document.querySelector("main.stations")),
    hud: strip(hud).outerHTML,
    workshop: workshop.outerHTML,
    contact: contact.outerHTML,
    foot: foot ? strip(foot.cloneNode(true)).outerHTML : "",
    rin: rin ? rin.outerHTML : "",
    glyph: document.querySelector(".theme-toggle")?.innerHTML ?? "",
    sheets: [...document.styleSheets].map((s) =>
      s.href ? { href: s.href } : { text: s.ownerNode?.textContent ?? "" }
    ),
  };
}

/* ── Assets ───────────────────────────────────────────────────────────── */

const EXT = {
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/svg+xml": ".svg",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "font/woff2": ".woff2",
  "font/woff": ".woff",
};

const files = new Map(); // absolute URL → path under assets/ (URL-encoded)
const missing = [];

/** Where a URL lives under `assets/`. Plain paths keep their structure; the
 *  image optimiser's responses get a name of their own. */
function assetPath(url, contentType) {
  const u = new URL(url);
  if (u.pathname.startsWith("/_next/image")) {
    const inner = u.searchParams.get("url") ?? "image";
    const base = path.posix
      .basename(inner)
      .replace(/\.[^.]+$/, "")
      .replace(/[^\w.-]+/g, "_");
    const hash = createHash("sha1").update(url).digest("hex").slice(0, 8);
    return `_img/${base}-${hash}${EXT[contentType?.split(";")[0]] ?? path.posix.extname(inner)}`;
  }
  return u.pathname.replace(/^\/+/, "");
}

async function download(url) {
  if (files.has(url)) return files.get(url);
  const res = await fetch(url);
  if (!res.ok) {
    missing.push(`${res.status} ${url}`);
    files.set(url, null);
    return null;
  }
  const rel = assetPath(url, res.headers.get("content-type"));
  const disk = path.join(OUT, "assets", decodeURIComponent(rel));
  fs.mkdirSync(path.dirname(disk), { recursive: true });
  fs.writeFileSync(disk, Buffer.from(await res.arrayBuffer()));
  files.set(url, rel);
  return rel;
}

const sameOrigin = (url) => {
  try {
    return new URL(url).origin === ORIGIN;
  } catch {
    return false;
  }
};

/** Rewrite every same-origin absolute URL in `html`'s media attributes to
 *  its file under `assets/`. */
async function localiseHtml(html) {
  const re = new RegExp(
    `${ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/[^"'\\s)&]*(?:&amp;[^"'\\s)&]*)*`,
    "g"
  );
  const urls = [...new Set(html.match(re) ?? [])];
  for (const raw of urls) {
    const url = raw.replace(/&amp;/g, "&");
    const rel = await download(url);
    if (rel) html = html.split(raw).join(`assets/${rel}`);
  }
  /* Links back into the site go to the live site. */
  html = html.replace(/(<a\b[^>]*\shref=")\/(?!\/)/g, `$1${SITE}/`);
  return html;
}

/** One stylesheet out of every sheet the page loaded, in document order,
 *  every `url()` pointed at its file. Fonts and SVG are always fetched; any
 *  other target only if the live page requested it in either theme (most of
 *  the site's plates belong to stations this export does not carry). */
async function localiseCss(sheets, requested) {
  let out = "";
  for (const sheet of sheets) {
    let text;
    let baseUrl;
    if (sheet.href) {
      const res = await fetch(sheet.href);
      text = await res.text();
      baseUrl = sheet.href;
    } else {
      text = sheet.text;
      baseUrl = `${BASE}${ROUTE}`;
    }
    text = text.replace(/\/\*# sourceMappingURL=[^*]*\*\//g, "");
    const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
    const jobs = [];
    text.replace(re, (m, q, u) => {
      jobs.push(u);
      return m;
    });
    const map = new Map();
    for (const u of new Set(jobs)) {
      if (u.startsWith("data:") || u.startsWith("#")) continue;
      const absUrl = new URL(u, baseUrl).href;
      if (!sameOrigin(absUrl)) continue;
      const kind = path.posix.extname(new URL(absUrl).pathname).toLowerCase();
      const wanted = /\.(woff2?|ttf|otf|svg)$/.test(kind) || requested.has(absUrl);
      const rel = wanted ? await download(absUrl) : assetPath(absUrl);
      if (rel) map.set(u, rel);
    }
    text = text.replace(re, (m, q, u) => (map.has(u) ? `url("${map.get(u)}")` : m));
    out += `\n/* ── ${sheet.href ? new URL(sheet.href).pathname : "inline <style>"} ── */\n${text}\n`;
  }
  return out;
}

/* ── Main ─────────────────────────────────────────────────────────────── */

const attrString = (pairs) =>
  pairs.map(([n, v]) => (v === "" ? ` ${n}` : ` ${n}="${v.replace(/"/g, "&quot;")}"`)).join("");

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });

  const browser = await chromium.launch({ args: ["--disable-3d-apis"] });
  const requested = new Set();
  const page = async (theme) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    p.on("response", (r) => {
      if (r.ok() && sameOrigin(r.url())) requested.add(r.url());
    });
    await p.goto(`${BASE}${ROUTE}?theme=${theme}`, { waitUntil: "networkidle", timeout: 180000 });
    await p.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
    await settle(p);
    return p;
  };

  log("rendering light (for the switch's glyph and the light plates)…");
  const light = await page("light");
  const lightGlyph = await light.evaluate(
    () => document.querySelector(".theme-toggle")?.innerHTML ?? ""
  );
  await light.context().close();

  log("rendering dark…");
  const dark = await page("dark");
  const holo = await dark.evaluate(() =>
    [...document.querySelectorAll("[data-holo]")].map((e) => e.getAttribute("data-holo"))
  );
  if (holo.some((h) => h === "live"))
    throw new Error("a holo stage went live; the export needs the SVG figures");
  const cap = await dark.evaluate(capture, { oldPre: OLD_PRE, newPre: NEW_PRE });
  await browser.close();
  if (cap.hits === 0)
    throw new Error(`"${OLD_PRE}" not found in #the-workshop; the retitle did not land`);
  log(`retitled ${cap.hits} text node(s)/attribute(s)`);

  log("collecting the stylesheets…");
  const css = await localiseCss(cap.sheets, requested);
  fs.writeFileSync(path.join(OUT, "assets", "site.css"), css);

  fs.copyFileSync(
    path.join(HERE, "export-assets", "export.js"),
    path.join(OUT, "assets", "export.js")
  );
  const wordmark = fs
    .readFileSync(path.join(HERE, "export-assets", "suri-wordmark.svg"), "utf8")
    .replace(/<!--[\s\S]*?-->\s*/, "")
    .trim();

  /* The client mark's own sheet: ADR-130's slot, the wordmark at the docked
     Thoughtform wordmark's width (`--hud-brand-w` × its 0.68 dock scale), in
     the HUD's ink so both themes follow. The bracket yields the corner, as it
     does wherever a client mark is seated. */
  fs.writeFileSync(
    path.join(OUT, "assets", "export.css"),
    `/* Export only: the client's mark in the HUD's top-left corner. */
.hud__corner--tl { display: none !important; }
.arc-hud-client { color: rgb(var(--dawn-rgb, 235, 227, 214)); pointer-events: none; }
.arc-hud-client svg {
  display: block;
  width: calc(var(--hud-brand-w, 122px) * 0.68);
  height: auto;
}
`
  );

  log("localising the media…");
  const body = await localiseHtml(
    `<div class="tw-root" data-tw-cut="v3">` +
      `<div${attrString(cap.ti)}>` +
      cap.hud +
      `<main${attrString(cap.stations)}>${cap.workshop}${cap.contact}</main>` +
      cap.foot +
      `</div>` +
      cap.rin +
      `</div>` +
      `<span class="arc-hud-client" role="img" aria-label="Suri">${wordmark}</span>`
  );

  const bootstrap =
    `(function(){try{var d=document.documentElement;` +
    `var q=new URLSearchParams(location.search).get("theme");` +
    `var s=null;try{s=localStorage.getItem("tf-theme")}catch(e){}` +
    `var t=(q==="light"||q==="dark")?q:((s==="light"||s==="dark")?s:"dark");` +
    `if(t==="light")d.setAttribute("data-theme","light");}catch(e){}})();`;

  const html = `<!doctype html>
<html${attrString(cap.html)}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${TITLE}</title>
<script>${bootstrap}</script>
<link rel="stylesheet" href="assets/site.css">
<link rel="stylesheet" href="assets/export.css">
</head>
<body>
${body}
<script>window.__SX_GLYPHS__=${JSON.stringify({ light: cap.glyph, dark: lightGlyph })};</script>
<script src="assets/export.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, "index.html"), html);

  const leaked = html.match(new RegExp(ORIGIN, "g"));
  if (leaked) throw new Error(`${leaked.length} reference(s) to ${ORIGIN} survived in index.html`);

  const zip = `${OUT}.zip`;
  fs.rmSync(zip, { force: true });
  execFileSync("zip", ["-qr", path.basename(zip), path.basename(OUT)], { cwd: path.dirname(OUT) });

  const fetched = [...files.values()].filter(Boolean).length;
  log(`${fetched} asset(s) written, ${missing.length} missing`);
  for (const m of missing) log(`  missing: ${m}`);
  log(`index: ${path.join(OUT, "index.html")}`);
  log(`zip:   ${zip}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
