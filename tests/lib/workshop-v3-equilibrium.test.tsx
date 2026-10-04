import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import * as THREE from "three";
import { describe, expect, it } from "vitest";

import {
  equilibriumStationHtml,
  insertEquilibriumStation,
} from "@/app/(marketing)/arcs/thoughtform/workshop-v3/equilibrium";
import { replaceHeroCopy } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/hero";
import { ArcInterstitial } from "@/components/arcs/ArcInterstitial";
import {
  coreSlices,
  EQ_ANCHORS,
  EQ_CAMERA,
  EQ_DOWN,
  EQ_DOWN_SPEC,
  EQ_FRAME,
  EQ_UP,
  EQ_UP_SPEC,
  eqCameraPosition,
  eqPolylines,
  eqProject,
  seatWords,
  toWorld,
} from "@/components/holo-program/equilibriumGeom";
import { WORKSHOP_INTRO } from "@/lib/arcs/content/shared/workshopIntro";
import { THOUGHTFORM_WORKSHOP_V3_ARC } from "@/lib/arcs/content/thoughtform-workshop-v3";
import type { ArcSectionOf } from "@/lib/arcs/types";
import { getThoughtformWorkshopContent } from "@/lib/v7-parse";

/**
 * The third cut's opener (ADR-143 U7): the Thoughtform equilibrium between the
 * hero and the About — a holographic object in three.js (owner, 2026-10-04:
 * "I want actual three js 3D object like holo") — and the Pensieve's slot.
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const section = (html: string, id: string) =>
  new RegExp(`<section\\b[^>]*\\bid="${id}"[\\s\\S]*?</section>`).exec(html)?.[0] ?? "";

describe("the opener's insert seam", () => {
  const { bodyHtml } = getThoughtformWorkshopContent();
  const withHero = replaceHeroCopy(bodyHtml, WORKSHOP_INTRO.hero);

  it("splices the station between the hero and the About, and changes nothing else", () => {
    const next = insertEquilibriumStation(withHero, WORKSHOP_INTRO.equilibrium);
    const ids = [...next.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.slice(0, 3)).toEqual(["hero", "equilibrium", "about"]);
    expect(next.replace(equilibriumStationHtml(WORKSHOP_INTRO.equilibrium), "")).toBe(withHero);
  });

  it("throws rather than splice into the wrong place", () => {
    expect(() => insertEquilibriumStation("<main></main>", WORKSHOP_INTRO.equilibrium)).toThrow(
      /#hero/
    );
    expect(() =>
      insertEquilibriumStation(
        '<section id="hero"></section><section id="voidwalker"></section>',
        WORKSHOP_INTRO.equilibrium
      )
    ).toThrow(/not #about/);
    const once = insertEquilibriumStation(withHero, WORKSHOP_INTRO.equilibrium);
    expect(() => insertEquilibriumStation(once, WORKSHOP_INTRO.equilibrium)).toThrow(/already/);
  });

  it("carries the copy, the static drawing, the canvas slot and the three words", () => {
    const html = section(
      insertEquilibriumStation(withHero, WORKSHOP_INTRO.equilibrium),
      "equilibrium"
    );
    const copy = WORKSHOP_INTRO.equilibrium;
    expect(html).toContain('class="station tw-eq"');
    expect(html).toContain(`>${copy.title}</h2>`);
    expect(html).toContain(`>${copy.sub}</p>`);
    expect(html).toContain(`viewBox="0 0 ${EQ_FRAME.w} ${EQ_FRAME.h}"`);
    expect(html).toContain("data-tw-eq-canvas");
    for (const { key, text } of Object.values(copy.labels)) {
      expect(html).toContain(`>${key}</span>`);
      expect(html).toContain(`>${text}</span>`);
    }
    // The parse strips comments before this seam runs; nothing after it would.
    expect(html).not.toContain("<!--");
  });
});

describe("the equilibrium object", () => {
  it("projects at rest exactly as three's camera does, so the fallback IS the hologram", () => {
    const cam = new THREE.PerspectiveCamera(EQ_CAMERA.fovDeg, EQ_FRAME.w / EQ_FRAME.h, 0.1, 60);
    cam.position.set(...eqCameraPosition());
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    const v = new THREE.Vector3();
    const points = [
      ...Object.values(EQ_ANCHORS),
      toWorld(EQ_DOWN, [1.32, 0, 0]),
      toWorld(EQ_UP, [0, 0, 1.48]),
    ];
    for (const p of points) {
      v.set(...p).project(cam);
      const q = eqProject(p);
      expect(q.x).toBeCloseTo(((v.x + 1) / 2) * EQ_FRAME.w, 3);
      expect(q.y).toBeCloseTo(((1 - v.y) / 2) * EQ_FRAME.h, 3);
    }
  });

  it("is a real object: each system a right-handed frame, the two tilted opposite ways", () => {
    for (const sys of [EQ_UP, EQ_DOWN]) {
      const [a, n, b] = [sys.a, sys.n, sys.b];
      const c = [a[1] * n[2] - a[2] * n[1], a[2] * n[0] - a[0] * n[2], a[0] * n[1] - a[1] * n[0]];
      expect(c[0] * b[0] + c[1] * b[1] + c[2] * b[2], sys.id).toBeCloseTo(1, 6);
    }
    // On screen, upstream rises to the right and downstream falls to it.
    const slope = (sys: typeof EQ_UP) => {
      const l = eqProject(toWorld(sys, [-1, 0, 0]));
      const r = eqProject(toWorld(sys, [1, 0, 0]));
      return l.y - r.y; // positive: the right end is higher
    };
    expect(slope(EQ_UP)).toBeGreaterThan(0);
    expect(slope(EQ_DOWN)).toBeLessThan(0);
    expect(EQ_UP.centre[1]).toBeGreaterThan(EQ_DOWN.centre[1]);
  });

  it("encodes the difference: downstream tight and steady, upstream wide and slow", () => {
    expect(EQ_DOWN_SPEC.rings.length).toBe(3);
    expect(EQ_UP_SPEC.rings.length).toBe(2);
    const gaps = (at: readonly number[]) =>
      at.map((d, i) => (at[(i + 1) % at.length] - d + 360) % 360);
    for (const m of EQ_DOWN_SPEC.motes) {
      const g = gaps(m.at);
      expect(Math.max(...g) - Math.min(...g), `${m.id}: evenly spaced`).toBeLessThan(1e-6);
    }
    const up = gaps(EQ_UP_SPEC.motes[0].at);
    expect(Math.max(...up) - Math.min(...up), "upstream motes are uneven").toBeGreaterThan(20);
    expect(EQ_DOWN_SPEC.motes[0].speed).toBeGreaterThan(EQ_UP_SPEC.motes[0].speed * 2);
  });

  it("spends gold on the flow alone: the bright arcs and the axis", () => {
    const gold = eqPolylines()
      .filter((l) => l.role === "gold")
      .map((l) => l.id);
    expect(gold.sort()).toEqual(["axis", "down-arc", "up-arc"]);
  });

  it("draws everything but the fading floor inside its frame, and seats the words on it", () => {
    for (const l of eqPolylines()) {
      if (l.role === "grid") continue;
      for (const p of l.points) {
        const q = eqProject(p);
        expect(q.x, l.id).toBeGreaterThan(0);
        expect(q.x, l.id).toBeLessThan(EQ_FRAME.w);
        expect(q.y, l.id).toBeGreaterThan(0);
        expect(q.y, l.id).toBeLessThan(EQ_FRAME.h);
      }
    }
    expect(coreSlices().length).toBe(13);
    const seats = seatWords();
    expect(seats.map((s) => s.id).sort()).toEqual(["downstream", "encode", "upstream"]);
    for (const s of seats) {
      expect(s.ax, s.id).toBeGreaterThan(0.1);
      expect(s.ax, s.id).toBeLessThan(0.9);
      expect(s.at, s.id).toBeGreaterThan(0.05);
      expect(s.at, s.id).toBeLessThan(0.95);
    }
  });

  it("cannot flicker: no dropout, no breathing, no grain on paper", () => {
    // The code, not its comments (which say what is NOT here, by name).
    const scene = read("components/holo-program/HoloEquilibriumScene.tsx")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    for (const banned of ["FLICKER", "BREATHE", "flickerSeeds", "scale.setScalar"]) {
      expect(scene, banned).not.toContain(banned);
    }
    const canvas = read("components/holo-program/HoloEquilibriumCanvas.tsx");
    expect(canvas).toContain("palette.additive ? POST.grain * palette.grainScale : 0");
    expect(canvas, "no aberration (ADR-080's confetti)").not.toContain("ChromaticAberration");
  });

  it("reaches three only through a dynamic chunk", () => {
    const mount = read("app/(marketing)/arcs/thoughtform/workshop-v3/EquilibriumMount.tsx");
    expect(mount).toMatch(/import\("@\/components\/holo-program\/HoloEquilibriumCanvas"\)/);
    expect(mount).not.toMatch(/^import[^;]*from "@\/components\/holo-program\/HoloEquilibrium/m);
    expect(mount).not.toMatch(/from "three"|@react-three/);
  });
});

describe("the opener's copy", () => {
  const copy = WORKSHOP_INTRO.equilibrium;
  const strings = [
    copy.eyebrow,
    copy.title,
    copy.sub,
    ...Object.values(copy.labels).flatMap((l) => [l.key, l.text]),
  ];

  it("keeps the copy law and the label measure", () => {
    for (const s of strings) {
      expect(s, "an em dash").not.toContain("—");
      expect(s, "a digit").not.toMatch(/\d/);
      expect(s, "markup").not.toMatch(/[<>]/);
      for (const word of ["leverage", "unlock", "harness", "delve", "seamless", "robust"]) {
        expect(s.toLowerCase(), word).not.toContain(word);
      }
    }
    for (const { key, text } of Object.values(copy.labels)) {
      expect(key.length, key).toBeLessThanOrEqual(12);
      expect(text.length, text).toBeLessThanOrEqual(42);
    }
    expect(copy.sub.length, "two lines at the head's measure").toBeLessThanOrEqual(150);
  });
});

describe("the opener's sheet", () => {
  const sheet = read("app/(marketing)/arcs/thoughtform/workshop-v3/equilibrium.css");

  it("scopes every rule to this cut, so it wins on specificity and touches no other page", () => {
    // Comments out, and every at-rule's prelude (`@media …`, `@supports …`).
    const body = sheet.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@[^{]+\{/g, "{");
    const selectors = [...body.matchAll(/([^{}@;]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => s && !s.startsWith("@") && !/^(from|to|\d+%)$/.test(s));
    expect(selectors.length).toBeGreaterThan(20);
    for (const sel of selectors) {
      for (const part of sel.split(",")) {
        expect(part.trim(), sel).toMatch(/^\.tw-root\[data-tw-cut="v3"\]/);
      }
    }
  });

  it("holds both curtains on their own station's view timeline", () => {
    expect(sheet).toContain("view-timeline: --tw-eq block");
    expect(sheet).toContain("view-timeline: --tw-about block");
    expect(sheet.match(/animation-range: entry 0% entry 100%/g)?.length).toBe(2);
  });
});

describe("the Pensieve", () => {
  const ids = THOUGHTFORM_WORKSHOP_V3_ARC.sections.map((s) => s.id);
  const pensieve = THOUGHTFORM_WORKSHOP_V3_ARC.sections.find((s) => s.id === "pensieve");

  it("follows the two you write, as a line until its clip lands", () => {
    expect(ids[ids.indexOf("leverage-motion") + 1]).toBe("pensieve");
    if (pensieve?.kind !== "interstitial") throw new Error("the Pensieve is an interstitial");
    expect(pensieve.clip, "the owner supplies the footage").toBeUndefined();
    expect(renderToStaticMarkup(<ArcInterstitial section={pensieve} />)).not.toContain("<video");
  });

  it("plays a silent loop above the line once it has one", () => {
    if (pensieve?.kind !== "interstitial") throw new Error("the Pensieve is an interstitial");
    const withClip: ArcSectionOf<"interstitial"> = {
      ...pensieve,
      clip: { src: "/arcs/x/clip.mp4", poster: "/arcs/x/clip.jpg", alt: "A memory drawn out" },
    };
    const html = renderToStaticMarkup(<ArcInterstitial section={withClip} />);
    expect(html).toMatch(/<figure class="arc-inter__clip"><video/);
    expect(html).toContain('preload="none"');
    expect(html).toContain("loop");
    expect(html).toContain('poster="/arcs/x/clip.jpg"');
    expect(html.indexOf("<video")).toBeLessThan(html.indexOf("arc-inter__line"));
  });
});
