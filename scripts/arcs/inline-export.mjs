#!/usr/bin/env node
/**
 * Fold an exported page folder (`index.html` + `assets/`) into ONE HTML file:
 * the stylesheets and scripts inlined, every image, font and video a data URI.
 * For places that take a single file (a Claude artifact, an upload with an
 * attachment limit). Run after `export-suri-lunch-and-learn.mjs`.
 *
 * Usage:
 *   node scripts/arcs/inline-export.mjs [exports/suri-creative-intelligence]
 *
 * Writes `<folder>.html` beside the folder. A `url()` whose file is not in
 * the folder (a plate for a station the export does not carry) becomes an
 * empty data URI rather than a dead relative path.
 */
import fs from "node:fs";
import path from "node:path";

const DIR = path.resolve(process.argv[2] ?? "exports/suri-creative-intelligence");
const OUT = `${DIR}.html`;

const MIME = {
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

let inlined = 0;
const absent = new Set();

/** `ref` resolved against `fromDir`, as a data URI, or null when absent. */
function dataUri(ref, fromDir) {
  const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
  const file = path.resolve(fromDir, clean);
  if (!file.startsWith(DIR) || !fs.existsSync(file)) {
    absent.add(clean);
    return null;
  }
  const mime = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  inlined += 1;
  return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
}

const isLocal = (ref) => !/^(data:|https?:|mailto:|#|\/\/)/.test(ref);

function inlineCss(css, fromDir) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, ref) => {
    if (!isLocal(ref)) return m;
    return `url("${dataUri(ref, fromDir) ?? "data:,"}")`;
  });
}

let html = fs.readFileSync(path.join(DIR, "index.html"), "utf8");

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
  const file = path.join(DIR, href);
  const css = inlineCss(fs.readFileSync(file, "utf8"), path.dirname(file));
  return `<style>\n${css.replace(/<\/style/gi, "<\\/style")}\n</style>`;
});

html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  const js = fs.readFileSync(path.join(DIR, src), "utf8");
  return `<script>\n${js.replace(/<\/script/gi, "<\\/script")}\n</script>`;
});

/* Media attributes, and any url() inside a style attribute. */
html = html.replace(/\b(src|poster|href|xlink:href)="(assets\/[^"]+)"/g, (m, name, ref) => {
  const uri = dataUri(ref, DIR);
  return uri ? `${name}="${uri}"` : m;
});
html = html.replace(
  /style="([^"]*url\([^"]*)"/g,
  (m, style) => `style="${inlineCss(style.replace(/&quot;/g, '"'), DIR).replace(/"/g, "&quot;")}"`
);

const leftover = html.match(/["'(]assets\/[^"')]+/g);
if (leftover) {
  console.error(
    `${leftover.length} reference(s) to assets/ were not inlined:`,
    leftover.slice(0, 5)
  );
  process.exit(1);
}

fs.writeFileSync(OUT, html);
const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
console.log(`· ${inlined} file(s) inlined, ${absent.size} absent reference(s) emptied`);
console.log(`· ${OUT} (${mb} MB)`);
