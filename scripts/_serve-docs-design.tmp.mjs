// Tiny throwaway static server for docs/design/ on port 3007.
// Used to view offer-one-pager.html through Cursor's browser tool
// (which blocks file:// URLs). Kill this process when done.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, normalize } from "node:path";

const ROOT = resolve("docs/design");
const PORT = 3007;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
    // basic traversal guard
    const rel = normalize(url).replace(/^([\\/])+/, "");
    let full = join(ROOT, rel);
    if (!full.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const s = await stat(full).catch(() => null);
    if (s && s.isDirectory()) full = join(full, "index.html");
    const body = await readFile(full);
    res.writeHead(200, { "Content-Type": TYPES[extname(full).toLowerCase()] || "application/octet-stream" });
    res.end(body);
  } catch (e) {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not Found: " + req.url);
  }
}).listen(PORT, () => {
  console.log(`serving docs/design/ on http://localhost:${PORT}`);
});
