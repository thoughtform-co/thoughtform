// Every read in the video library is a well-formed CDAF sidecar
// (github.com/UditAkhourii/cdaf, SPEC v1.0), so the thoughtform:cdaf skill
// can trust the format without the video at hand. The skill and its CLI live
// in the Thoughtform plugin; this guards only the library this repo holds.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LIBRARY = join(__dirname, "..", "..", "docs", "video-reads");
const files = readdirSync(LIBRARY).filter((f) => f.endsWith(".cdaf"));
const readme = readFileSync(join(LIBRARY, "README.md"), "utf8");
const SEGMENT = /^\[\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?-\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?\]\s+\S/;

function parse(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const close = lines.indexOf("---", 1);
  const header: Record<string, string> = {};
  for (const line of lines.slice(1, close)) {
    const kv = line.match(/^([a-z0-9_-]+):\s?(.*)$/);
    if (kv) header[kv[1]] = kv[2].trim();
  }
  const body = lines.slice(close + 1);
  const start = body.indexOf("## Segments");
  const end = body.findIndex((l, i) => i > start && l.startsWith("## "));
  const segments = body.slice(start + 1, end).filter((l) => l.startsWith("["));
  return { first: lines[0], close, header, start, segments };
}

describe("video reads", () => {
  it("has reads", () => expect(files.length).toBeGreaterThan(0));

  it.each(files)("%s is well-formed CDAF", (f) => {
    const r = parse(readFileSync(join(LIBRARY, f), "utf8"));
    expect(r.first).toMatch(/^--- CDAF\/1\.\d+$/);
    expect(r.close).toBeGreaterThan(0);
    for (const k of ["video", "sha256", "bytes", "generator", "created"])
      expect(r.header[k]).toBeTruthy();
    expect(r.header.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(r.header.bytes).toMatch(/^\d+$/);
    expect(r.start).toBeGreaterThanOrEqual(0);
    expect(r.segments.length).toBeGreaterThan(0);
    for (const s of r.segments) expect(s).toMatch(SEGMENT);
    expect(f.endsWith(`-${r.header.sha256.slice(0, 8)}.cdaf`)).toBe(true);
  });

  it.each(files)("%s is listed in the README", (f) => {
    expect(readme).toContain(f.replace(/\.cdaf$/, ""));
  });
});
