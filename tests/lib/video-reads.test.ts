// Every read in the video library is a conforming CDAF sidecar, so the
// cdaf skill can trust the format without the video at hand.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCdaf as parseCdafUntyped, validateCdaf } from "../../scripts/video-read/cdafCore.mjs";

// The core is plain .mjs shared with the CLI; this is the shape it returns.
const parseCdaf = parseCdafUntyped as unknown as (text: string) => {
  header: Record<string, string>;
  sections: Record<string, string>;
};

const LIBRARY = join(__dirname, "..", "..", "docs", "video-reads");
const files = readdirSync(LIBRARY).filter((f) => f.endsWith(".cdaf"));
const readme = readFileSync(join(LIBRARY, "README.md"), "utf8");

describe("video reads", () => {
  it("has reads", () => expect(files.length).toBeGreaterThan(0));

  it.each(files)("%s is well-formed CDAF", (f) => {
    const parsed = parseCdaf(readFileSync(join(LIBRARY, f), "utf8"));
    expect(validateCdaf(parsed)).toEqual([]);
    expect(f.endsWith(`-${parsed.header.sha256.slice(0, 8)}.cdaf`)).toBe(true);
  });

  it.each(files)("%s is listed in the README", (f) => {
    expect(readme).toContain(f.replace(/\.cdaf$/, ""));
  });
});
