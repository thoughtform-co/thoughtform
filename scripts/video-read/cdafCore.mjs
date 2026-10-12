// CDAF core: parse, serialise, hash, freshness. Zero dependencies, so the
// vitest guard, the CLI and any agent can share one reading of the format.
// Format: https://github.com/UditAkhourii/cdaf (SPEC.md, v1.0, MIT).

import { createHash } from "node:crypto";
import { createReadStream, statSync } from "node:fs";

export const VIDEO_EXT = /\.(mp4|mov|mkv|webm|avi|m4v)$/i;
export const REQUIRED_KEYS = ["video", "sha256", "bytes", "generator", "created"];
export const SEGMENT_RE =
  /^\[(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)-(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)\]\s+\S/;

/** Parse a sidecar's text into { version, header, body, sections }. Throws on a malformed file. */
export function parseCdaf(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const first = lines[0] ?? "";
  const m = first.match(/^--- CDAF\/(\d+)\.(\d+)\s*$/);
  if (!m) throw new Error(`first line must be "--- CDAF/<major>.<minor>", got "${first}"`);
  const header = {};
  let i = 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") break;
    const kv = line.match(/^([a-z0-9_-]+):\s?(.*)$/);
    if (!kv) throw new Error(`header line ${i + 1} is not "key: value": "${line}"`);
    header[kv[1]] = kv[2].trim();
  }
  if (i >= lines.length) throw new Error("header never closes with a line of exactly ---");
  const body = lines
    .slice(i + 1)
    .join("\n")
    .replace(/^\n+/, "");
  return { version: `${m[1]}.${m[2]}`, header, body, sections: splitSections(body) };
}

/** `## Name` sections of a body, keyed by name, in order. */
export function splitSections(body) {
  const out = {};
  let name = null;
  for (const line of body.split("\n")) {
    const h = line.match(/^## (.+?)\s*$/);
    if (h) {
      name = h[1];
      out[name] = [];
    } else if (name) out[name].push(line);
  }
  for (const k of Object.keys(out)) out[k] = out[k].join("\n").trim();
  return out;
}

/** Problems a conforming consumer would reject, as strings. Empty means well-formed. */
export function validateCdaf(parsed) {
  const errs = [];
  for (const k of REQUIRED_KEYS) if (!parsed.header[k]) errs.push(`missing header key "${k}"`);
  if (parsed.header.sha256 && !/^[0-9a-f]{64}$/.test(parsed.header.sha256))
    errs.push("sha256 is not 64 lowercase hex");
  if (parsed.header.bytes && !/^\d+$/.test(parsed.header.bytes))
    errs.push("bytes is not an integer");
  const seg = parsed.sections.Segments;
  if (seg === undefined) errs.push("missing ## Segments");
  else {
    const rows = seg.split("\n").filter((l) => l.trim().startsWith("["));
    if (!rows.length) errs.push("## Segments has no [START-END] lines");
    for (const r of rows) if (!SEGMENT_RE.test(r)) errs.push(`bad segment line: ${r.slice(0, 60)}`);
  }
  return errs;
}

export function serializeCdaf(header, body) {
  const order = [
    ...REQUIRED_KEYS.slice(0, 3),
    "duration",
    "resolution",
    "fps",
    "generator",
    "created",
    "detail",
    "lang",
  ];
  const keys = [
    ...order.filter((k) => k in header),
    ...Object.keys(header).filter((k) => !order.includes(k)),
  ];
  return `--- CDAF/1.0\n${keys.map((k) => `${k}: ${header[k]}`).join("\n")}\n---\n\n${body.trim()}\n`;
}

export function sha256File(path) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha256");
    createReadStream(path)
      .on("data", (d) => h.update(d))
      .on("end", () => resolve(h.digest("hex")))
      .on("error", reject);
  });
}

/** "fresh" | "stale". `strict` hashes; otherwise the size check alone (the spec's O(1) pre-check). */
export async function freshness(videoPath, header, { strict = true } = {}) {
  if (String(statSync(videoPath).size) !== header.bytes) return "stale";
  if (!strict) return "fresh";
  return (await sha256File(videoPath)) === header.sha256 ? "fresh" : "stale";
}

export function sidecarPathFor(videoPath) {
  return videoPath.replace(VIDEO_EXT, ".cdaf");
}

/** Seconds to the spec's HH:MM:SS.mmm. */
export function hms(sec) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = (s % 60).toFixed(3).padStart(6, "0");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${r}`;
}
