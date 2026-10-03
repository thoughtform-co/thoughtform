// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  clearPrelude,
  corridorPreludeRef,
  onPreludeChange,
  preludeLive,
  writePrelude,
} from "@/lib/home-v2/corridorPreludeRef";

/**
 * The corridor's PRELUDE (ADR-138): the parked particle brandmark painted
 * before the corridor is reached, on one route. Everywhere else it is off, and
 * every reader must be identity at `level` 0 — which is what these pins hold.
 */

const ROOT = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

afterEach(() => clearPrelude());

describe("corridorPreludeRef", () => {
  it("rests off: every channel 0 and no aperture", () => {
    expect(corridorPreludeRef.current).toEqual({ level: 0, travel: 0, fold: 0, aperture: null });
    expect(preludeLive()).toBe(false);
    expect(document.documentElement.hasAttribute("data-corridor-prelude")).toBe(false);
  });

  it("notifies on the live edge only, and mirrors it on <html>", () => {
    const seen: boolean[] = [];
    const off = onPreludeChange((live) => seen.push(live));
    writePrelude({ level: 1, travel: 0, fold: 0, aperture: null });
    writePrelude({
      level: 0.5,
      travel: 0.3,
      fold: 0.1,
      aperture: { cx: 10, cy: 20, half: 5, feather: 2 },
    });
    expect(seen).toEqual([true]);
    expect(document.documentElement.getAttribute("data-corridor-prelude")).toBe("1");
    expect(corridorPreludeRef.current.aperture).toEqual({ cx: 10, cy: 20, half: 5, feather: 2 });
    clearPrelude();
    expect(seen).toEqual([true, false]);
    expect(document.documentElement.hasAttribute("data-corridor-prelude")).toBe(false);
    off();
    writePrelude({ level: 1, travel: 0, fold: 0, aperture: null });
    expect(seen).toEqual([true, false]);
  });

  it("stays three-free and DOM-import-free", () => {
    const src = read("lib/home-v2/corridorPreludeRef.ts");
    expect(src).not.toMatch(/from\s+["'](three|@react-three)/);
    expect(src).not.toMatch(/^import /m);
  });
});

describe("the corridor's readers are identity at level 0", () => {
  it("the scene counts the prelude as engagement in all three places, and subscribes to its edge", () => {
    const src = read("components/landing/home-v2/DepthGatewayScene/index.tsx");
    expect(src).toMatch(
      /import \{ onPreludeChange, preludeLive \} from "@\/lib\/home-v2\/corridorPreludeRef"/
    );
    // governor engagedNow · FrameInvalidator isEngaged · frameloop engaged (read + set)
    expect((src.match(/preludeLive\(\)/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect((src.match(/onPreludeChange\(/g) ?? []).length).toBe(2);
    // The opening is a FADE in every reader, never clipping planes, so the
    // renderer's own state is untouched on every route.
    expect(src).not.toMatch(/localClippingEnabled/);
  });

  it("the core reads the prelude, and every envelope takes it through max() or a level-gated branch", () => {
    const src = read("components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx");
    expect(src).toMatch(/corridorPreludeRef\.current/);
    expect(src).toMatch(/prelude\.level > 0/);
    expect(src).toMatch(/Math\.max\(depth, preludeDepth\)/);
    expect(src).toMatch(/svgOwns = preludeLevel > 0 \? false :/);
    expect(src).toMatch(/apertureRef=\{apertureRef\}/);
    expect(src).toMatch(/ap\.feather = hole\.feather;/);
  });

  it("the core's fragment shader fades out inside the aperture only while it is on", () => {
    const src = read("components/brand/BrandmarkPhysicsCore/shaders.ts");
    expect(src).toMatch(/uniform vec4 uAperture;/);
    expect(src).toMatch(/uniform float uApertureOn;/);
    expect(src).toMatch(/uniform float uApertureFeather;/);
    expect(src).toMatch(/if \(uApertureOn > 0\.5\)/);
    expect(src).toMatch(
      /apertureKeep = 1\.0 - clamp\(inset \/ max\(uApertureFeather \* 0\.6, 1\.0\), 0\.0, 1\.0\);/
    );
    expect(src).toMatch(/gl_FragColor = vec4\(color, outAlpha \* apertureKeep\);/);
    const core = read("components/brand/BrandmarkPhysicsCore/BrandmarkPhysicsCore.tsx");
    expect(core).toMatch(/uApertureOn: \{ value: 0 \}/);
  });

  it("the compass gate fades in through the aperture only under the prelude, and hides while it is shut", () => {
    const src = read(
      "components/landing/home-v2/DepthGatewayScene/gates/ThoughtformCompassGate.tsx"
    );
    expect(src).toMatch(/corridorPreludeRef\.current/);
    expect(src).toMatch(/prelude\.level > 0 \? prelude\.aperture : null/);
    // A fade on the gate's own materials, exactly 1 unless the prelude turns
    // it on — never clipping planes, whose edge draws a line of its own (the
    // owner's "frame going over the brand mark").
    expect(src).toMatch(/if \(uTwApOn < 0\.5\) return 1\.0;/);
    expect(src).toMatch(/m\.onBeforeCompile = /);
    expect(src).not.toMatch(/clippingPlanes/);
  });

  it("the gate's throat fades in through the opening under the prelude", () => {
    const src = read("components/landing/home-v2/DepthGatewayScene/GatewayThroat.tsx");
    expect(src).toMatch(/corridorPreludeRef\.current/);
    expect(src).toMatch(/prelude\.level > 0 \? prelude\.aperture : null/);
    expect(src).toMatch(/uApertureOn: \{ value: 0 \}/);
    expect(src).toMatch(/if \(uApertureOn > 0\.5\)/);
    expect(src).toMatch(
      /apertureKeep = clamp\(inset \/ max\(uApertureFeather, 1\.0\), 0\.0, 1\.0\);/
    );
  });

  it("the DOM layers open on feathered masks, never a hard inset", () => {
    const css = read("app/(marketing)/arcs/thoughtform/workshop-v1/thoughtform-workshop.css");
    expect(css).toMatch(/\.home-v2-copy-layer \{\s*-webkit-mask-image:/);
    // The mask sits UNDER the shell's drop-shadow, so the halo follows it.
    expect(css).toMatch(/\.home-v2-projected-brandmark > div \{\s*-webkit-mask-image:/);
    expect(css).not.toMatch(/--tw-ap-t|--tw-apg-t/);
  });

  it("only the workshop route writes it", () => {
    const writer = read("app/(marketing)/arcs/thoughtform/workshop-v1/flow/useWorkshopFlow.ts");
    expect(writer).toMatch(/writePrelude\(/);
    expect(writer).toMatch(/clearPrelude\(\)/);
  });
});
