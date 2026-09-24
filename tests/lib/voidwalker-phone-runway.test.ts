import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  VOIDWALKER_PHONE_RUNWAY,
  VOIDWALKER_PHONE_RUNWAY_MEDIA,
} from "@/components/landing/home-v2/unifiedServicesInstrument";
import {
  VOIDWALKER_ERA_BAND,
  VOIDWALKER_ERA_HYSTERESIS,
  VOIDWALKER_PHONE_ERA_BAND,
  voidwalkerEraFromProgress,
  voidwalkerProgressForEra,
} from "@/lib/voidwalker/voidwalkerHologramClock";

import { blocks, stripComments } from "./helpers/cssBlocks";

/**
 * THE ERA INSTRUMENT PINS ON THE PHONE (ADR-123) — the lockstep between the
 * flag, the writer, the sheet and the two release targets, and the era clock's
 * phone band; the `about-band-math` pattern one station down.
 *
 * Chromium resolves svh/dvh to one number, so what a phone probe can measure
 * is the geometry; what only this file can prove is that the sheet's `@media`
 * literal IS the hook's string, that the phone band is edge to edge, and that
 * every desktop caller of the clock is byte-identical with the new argument.
 */

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const SHEET = "components/landing/home-v2/voidwalker/voidwalker.css";
const BAND = "components/landing/home-v2/about/about-band.css";
const HOOK = "components/landing/home-v2/hooks/useVoidwalkerHologramScroll.ts";
const HOLOGRAM = "components/landing/home-v2/voidwalker/hologram/VoidwalkerHologram.tsx";
const STATION = "components/landing/home-v2/voidwalker/VoidwalkerStation.tsx";
const PROTOTYPE = "public/prototypes/v7/landing-v7-motion.html";

const decl = (decls: string, prop: string) => {
  const m = new RegExp(`(?:^|;)\\s*${prop.replace(/[-]/g, "\\-")}\\s*:\\s*([^;]+)`).exec(decls);
  return m ? m[1]!.replace(/\s+/g, " ").trim() : null;
};

describe("the phone runway: the sheet and the writer name one rung (ADR-123)", () => {
  const sheet = blocks(stripComments(read(SHEET)));
  const runway = sheet.filter((b) => /data-vw-phone="runway"/.test(b.path));

  it("the flag is on, and the sheet's block carries the hook's media string verbatim", () => {
    expect(VOIDWALKER_PHONE_RUNWAY).toBe(true);
    expect(runway.length).toBeGreaterThanOrEqual(4);
    for (const b of runway) expect(b.path, b.path).toContain(VOIDWALKER_PHONE_RUNWAY_MEDIA);
    // The rung is the instrument's own one-screen rung, with the ring rung's
    // height floor and motion gate — not the 960 the ring and the pile split on.
    expect(VOIDWALKER_PHONE_RUNWAY_MEDIA).toMatch(/^\(max-width: 700px\)/);
    expect(VOIDWALKER_PHONE_RUNWAY_MEDIA).toContain("(min-height: 681px)");
    expect(VOIDWALKER_PHONE_RUNWAY_MEDIA).toContain("(prefers-reduced-motion: no-preference)");
  });

  it("the station is the runway and the stop: padding 0, one dwell, start, always", () => {
    const st = runway.find((b) => /\.station$/.test(b.path));
    expect(st, "no runway rule on the station").toBeDefined();
    expect(decl(st!.decls, "padding-block")).toBe("0");
    expect(decl(st!.decls, "min-height")).toBe("calc(100svh + var(--vw-phone-dwell))");
    expect(decl(st!.decls, "scroll-snap-align")).toBe("start");
    expect(decl(st!.decls, "scroll-snap-stop")).toBe("always");
    expect(decl(st!.decls, "--vw-phone-dwell")).toBe("120svh");
    // The dial is declared ONCE in the sheet.
    const dials = sheet.filter((b) => /--vw-phone-dwell\s*:/.test(b.decls));
    expect(dials).toHaveLength(1);
  });

  it("the instrument pins inside it at the dynamic viewport and gives up its own seat", () => {
    const vwd = runway.find((b) => /> \.vwd$/.test(b.path));
    expect(vwd, "no pinned .vwd rule").toBeDefined();
    expect(decl(vwd!.decls, "position")).toBe("sticky");
    expect(decl(vwd!.decls, "top")).toBe("0");
    expect(decl(vwd!.decls, "height")).toBe("100dvh");
    expect(decl(vwd!.decls, "scroll-snap-align")).toBe("none");
    const hologram = runway.find((b) => /\.vw--hologram$/.test(b.path));
    expect(decl(hologram!.decls, "min-height")).toBe("calc(100svh + var(--vw-phone-dwell))");
  });

  it("the release target is a 100dvh box on the runway's foot, and nothing elsewhere", () => {
    const snap = runway.find((b) => /\.vw-phone-snap$/.test(b.path));
    expect(snap, "no release target rule").toBeDefined();
    expect(decl(snap!.decls, "bottom")).toBe("0");
    expect(decl(snap!.decls, "height")).toBe("100dvh");
    expect(decl(snap!.decls, "scroll-snap-align")).toBe("start");
    expect(decl(snap!.decls, "pointer-events")).toBe("none");
    const base = sheet.find((b) => b.path.trim() === ".vw-phone-snap");
    expect(base, "the release target has no resting rule").toBeDefined();
    expect(decl(base!.decls, "display")).toBe("none");
    expect(read(STATION)).toContain('className="vw-phone-snap"');
  });

  it("NO weld over #about: the runway block declares no negative margin", () => {
    for (const b of runway) {
      expect(b.decls, `${b.path} welds`).not.toMatch(/margin-top\s*:\s*(-|calc\(\s*-1)/);
    }
  });

  it("#about's release target sits on the band's last pinned frame, and the prototype carries it", () => {
    const band = blocks(stripComments(read(BAND)));
    // The band's rung declares the target twice (its box with the other two
    // targets, then its seat and align) — read the selector's whole cascade.
    const outs = band.filter((b) =>
      /\[data-about-band="on"\] \.voidwalker__snap-out$/.test(b.path)
    );
    expect(outs.length, "no release target on the about band").toBeGreaterThan(0);
    const out = { decls: outs.map((b) => b.decls).join(";") };
    expect(decl(out.decls, "position")).toBe("absolute");
    expect(decl(out.decls, "bottom")).toBe("0");
    expect(decl(out.decls, "height")).toBe("100dvh");
    expect(decl(out.decls, "scroll-snap-align")).toBe("start");
    const rest = band.find(
      (b) =>
        /(^|,)\s*\.voidwalker__snap-out\s*$/.test(b.path.trim()) &&
        /display\s*:\s*none/.test(b.decls)
    );
    expect(rest, "the release target has no resting display: none").toBeDefined();
    const html = read(PROTOTYPE);
    const i = html.indexOf('class="voidwalker__snap"');
    const o = html.indexOf('class="voidwalker__snap-out"');
    expect(i).toBeGreaterThan(-1);
    expect(o).toBeGreaterThan(i);
  });

  it("the writer stamps the rung, measures runway − band, and never writes the desktop's attributes there", () => {
    const hook = read(HOOK);
    expect(hook).toContain('from "../unifiedServicesInstrument"');
    expect(hook).toContain("VOIDWALKER_PHONE_RUNWAY_MEDIA");
    const phone = hook.slice(hook.indexOf("const writePhone"), hook.indexOf("const write = () =>"));
    expect(phone).toContain('setAttribute("data-vw-phone", "runway")');
    expect(phone).toContain("rr.height - root.getBoundingClientRect().height");
    expect(phone).toContain("VOIDWALKER_PHONE_ERA_BAND");
    expect(phone).toContain("voidwalkerEraPickRef");
    for (const attr of [
      "data-vw-mode",
      "data-vwh-ready",
      "data-vw-handoff",
      "voidwalkerHologramProgressRef",
    ])
      expect(phone, `the phone branch writes ${attr}`).not.toContain(attr);
    // The hologram's tap glides on the phone band and claims the era.
    const hologram = read(HOLOGRAM);
    expect(hologram).toContain("voidwalkerEraPickRef.current = { era: i, at: performance.now() }");
    expect(hologram).toContain("phone ? VOIDWALKER_PHONE_ERA_BAND : undefined");
    expect(hologram).toContain('data-station-seat=""');
  });
});

describe("the phone era band (ADR-123)", () => {
  const N = 5;

  it("runs edge to edge: the pin frame IS era 0 and the release IS the last", () => {
    expect(VOIDWALKER_PHONE_ERA_BAND).toEqual([0, 1]);
    expect(voidwalkerEraFromProgress(0, N, 0, VOIDWALKER_PHONE_ERA_BAND)).toBe(0);
    expect(voidwalkerEraFromProgress(1, N, 0, VOIDWALKER_PHONE_ERA_BAND)).toBe(N - 1);
    expect(voidwalkerEraFromProgress(0.5, N, 0, VOIDWALKER_PHONE_ERA_BAND)).toBe(2);
  });

  it("seats each era at its slice's centre, strictly increasing", () => {
    const centres = Array.from({ length: N }, (_, i) =>
      voidwalkerProgressForEra(i, N, VOIDWALKER_PHONE_ERA_BAND)
    );
    expect(centres[0]).toBeCloseTo(0.1, 6);
    expect(centres[N - 1]).toBeCloseTo(0.9, 6);
    for (let i = 1; i < N; i++) expect(centres[i]!).toBeGreaterThan(centres[i - 1]!);
    // A tap's seat resolves to its own era, whichever era the reader came from.
    for (let i = 0; i < N; i++)
      for (let cur = 0; cur < N; cur++)
        expect(voidwalkerEraFromProgress(centres[i]!, N, cur, VOIDWALKER_PHONE_ERA_BAND)).toBe(i);
  });

  it("keeps the hysteresis at a slice boundary", () => {
    const edge = 0.4; // between era 1 and era 2
    expect(voidwalkerEraFromProgress(edge + 0.001, N, 1, VOIDWALKER_PHONE_ERA_BAND)).toBe(1);
    expect(
      voidwalkerEraFromProgress(
        edge + (VOIDWALKER_ERA_HYSTERESIS + 0.01) * 0.2,
        N,
        1,
        VOIDWALKER_PHONE_ERA_BAND
      )
    ).toBe(2);
    expect(voidwalkerEraFromProgress(edge - 0.001, N, 2, VOIDWALKER_PHONE_ERA_BAND)).toBe(2);
  });

  it("leaves every desktop caller byte-identical: the default argument IS the desktop band", () => {
    for (let cur = 0; cur < N; cur++) {
      for (let k = 0; k <= 100; k++) {
        const p = k / 100;
        expect(voidwalkerEraFromProgress(p, N, cur)).toBe(
          voidwalkerEraFromProgress(p, N, cur, VOIDWALKER_ERA_BAND)
        );
      }
    }
    for (let i = 0; i < N; i++)
      expect(voidwalkerProgressForEra(i, N)).toBe(
        voidwalkerProgressForEra(i, N, VOIDWALKER_ERA_BAND)
      );
    expect(voidwalkerProgressForEra(0, 1)).toBe(VOIDWALKER_ERA_BAND[0]);
  });
});
