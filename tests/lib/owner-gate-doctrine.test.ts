import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Where the owner's gate lives, and what may touch the pass (ADR-117).
 *
 * ⚠ SOURCE SCANS, BECAUSE EACH OF THESE FAILS SILENTLY. A page that loses
 * `force-dynamic` is prerendered again and its HTML, RSC and segment files
 * carry every client's name to anyone who asks for them; a gate moved into
 * `proxy.ts` looks equivalent and misses those URL shapes; an API route that
 * reads the pass turns a one-page capability into a session; a client
 * component importing the signer ships `node:crypto` to the browser.
 */

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

describe("the owner's gate (ADR-117)", () => {
  it("the overview is dynamic and asks for the pass before it renders anything", () => {
    const page = read("app/(marketing)/arcs/page.tsx");
    expect(page).toMatch(/^export const dynamic = "force-dynamic";$/m);
    const body = page.slice(page.indexOf("export default async function"));
    const gate = body.indexOf("await assertOwner()");
    expect(gate, "assertOwner is called").toBeGreaterThan(0);
    for (const later of ["sliceV7Sections(", "arcsInstrumentSections(", "todayIn("]) {
      const at = body.indexOf(later);
      if (at >= 0) expect(at, `${later} runs after the gate`).toBeGreaterThan(gate);
    }
    // The metadata asks too, so a denied request carries the root's title.
    expect(page).toMatch(/generateMetadata[\s\S]*ownerGate\(\)/);
  });

  it("the gate is in the page, never in proxy.ts", () => {
    const proxy = read("proxy.ts");
    expect(proxy).not.toMatch(/tf_owner|ownerPass|ownerGate|OWNER_PASS/);
  });

  it("no API route reads the pass but the one that mints it", () => {
    const hits = walk(join(ROOT, "app", "api"))
      .map((p) => relative(ROOT, p).replace(/\\/g, "/"))
      .filter((p) => p !== "app/api/owner-pass/route.ts")
      .filter((p) => /tf_owner|OWNER_PASS_COOKIE|auth\/ownerPass|auth\/ownerGate/.test(read(p)));
    expect(hits).toEqual([]);
  });

  it("no client component imports the signer or the gate", () => {
    const offenders: string[] = [];
    for (const dir of ["app", "components", "lib"]) {
      for (const p of walk(join(ROOT, dir))) {
        const src = readFileSync(p, "utf8");
        if (!/^["']use client["']/m.test(src)) continue;
        if (/from ["']@\/lib\/auth\/owner(Pass|Gate)["']/.test(src))
          offenders.push(relative(ROOT, p));
      }
    }
    expect(offenders).toEqual([]);
    // The browser's half imports neither, and no registry either (its
    // comments may NAME them — only import lines are read).
    const imports = read("lib/auth/ownerPassClient.ts")
      .split("\n")
      .filter((l) => /^import\b/.test(l))
      .join("\n");
    expect(imports).toMatch(/allowed-user/);
    expect(imports).not.toMatch(/ownerPass["']|ownerGate|node:crypto|lib\/arcs/);
  });

  it("the anonymous path loads the browser's half lazily, never statically", () => {
    const provider = read("components/auth/AuthProvider.tsx");
    expect(provider).toMatch(/import\("@\/lib\/auth\/ownerPassClient"\)/);
    expect(provider).not.toMatch(/^import[^\n]*ownerPassClient/m);
  });

  it("the not-found page is marked, the static export skips the overview, the env is documented", () => {
    expect(read("app/not-found.tsx")).toMatch(/data-tf-404/);
    const exporter = read("scripts/package-homepage-static.mjs");
    expect(exporter).toMatch(/"app\/\(marketing\)\/arcs\/page\.tsx"/);
    expect(exporter).toMatch(/"proxy\.ts"/);
    // The name is documented and the value is not.
    expect(read(".env.example")).toMatch(/^OWNER_PASS_SECRET=$/m);
  });
});
