import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EmbedStack } from "@/components/xb-proposal/embed/EmbedStack";
import { NetworkOrg } from "@/components/xb-proposal/network/NetworkOrg";
import {
  clockAt,
  DWELL_SVH,
  NETWORK_PHONE_LEGS,
  PASS_SVH,
  PHONE_STAGE_MEDIA,
  seatsOf,
  STEPS_PHONE_LEGS,
  travelOf,
} from "@/components/xb-proposal/phone/stageClock";
import { StackFlow } from "@/components/xb-proposal/stack/StackFlow";

/**
 * The phone stages (ADR-160): the opening sections' story played on a phone
 * by their own drawings, pinned and scrubbed. The clock is the phone
 * corridor's grammar (ADR-125): dwells shorter than one snap radius, passes
 * longer than two, so a rest is either on a composed frame or plainly
 * mid-travel.
 */

const STAGES = { steps: STEPS_PHONE_LEGS, network: NETWORK_PHONE_LEGS };
/** Blink pulls a rest within about a third of the snapport. */
const RADIUS = (vh: number) => vh / 3;

describe("the phone stage clock (ADR-160)", () => {
  for (const [name, legs] of Object.entries(STAGES)) {
    it(`${name}: monotone and continuous from its first frame to its last`, () => {
      const T = travelOf(legs);
      let prev = clockAt(legs, 0);
      expect(prev).toBe(legs[0].from);
      for (let s = 0.25; s <= T + 1; s += 0.25) {
        const v = clockAt(legs, s);
        expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
        expect(v - prev).toBeLessThan(0.02);
        prev = v;
      }
      expect(clockAt(legs, T + 10)).toBe(legs[legs.length - 1].to);
      expect(clockAt(legs, -10)).toBe(legs[0].from);
    });

    it(`${name}: every dwell is under one snap radius and every pass over two, at 640/664/844/932`, () => {
      for (const vh of [640, 664, 844, 932]) {
        const svh = vh / 100;
        for (const leg of legs) {
          const px = leg.len * svh;
          if (leg.from === leg.to) expect(px).toBeLessThan(RADIUS(vh));
          else expect(px).toBeGreaterThan(2 * RADIUS(vh));
        }
      }
    });

    it(`${name}: a seat at every dwell, holding the dwell's frame`, () => {
      const seats = seatsOf(legs);
      const dwells = legs.filter((l) => l.from === l.to);
      expect(seats.map((s) => s.id)).toEqual(dwells.map((l) => l.id));
      for (const seat of seats) {
        const leg = legs.find((l) => l.id === seat.id)!;
        expect(clockAt(legs, seat.at + 0.01)).toBe(leg.from);
        expect(clockAt(legs, seat.at + seat.len - 0.01)).toBe(leg.from);
      }
    });
  }

  it("seats the steps on Navigate, Encode and Build: EmbedStack's own p 0, 0.5 and 1", () => {
    const seats = seatsOf(STEPS_PHONE_LEGS);
    expect(seats.map((s) => clockAt(STEPS_PHONE_LEGS, s.at + 1))).toEqual([0, 0.5, 1]);
    expect(travelOf(STEPS_PHONE_LEGS)).toBe(3 * DWELL_SVH + 2 * PASS_SVH);
  });

  it("runs only on a phone with room for it, with motion allowed", () => {
    expect(PHONE_STAGE_MEDIA).toBe(
      "(max-width: 960px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)"
    );
  });
});

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const SHEETS = {
  vision: "components/xb-proposal/stack/stack-hero.css",
  steps: "components/xb-proposal/embed/embed.css",
  network: "components/xb-proposal/network/network-org.css",
};
const GATE = `@media ${PHONE_STAGE_MEDIA} {`;

describe("the stages' sheets (ADR-160)", () => {
  for (const [name, p] of Object.entries(SHEETS)) {
    const css = read(p);
    it(`${name}: gates its stage on the clock's own media literal, and keys it on the opt-in`, () => {
      const at = css.indexOf(GATE);
      expect(at, `${p} has no stage gate equal to PHONE_STAGE_MEDIA`).toBeGreaterThan(0);
      expect(css.slice(at)).toMatch(/\[data-phone="stage"\]/);
    });
    it(`${name}: a dynamic viewport unit only on the pinned band, inside the gate`, () => {
      expect(css.slice(0, css.indexOf(GATE))).not.toMatch(/\d+dvh/);
    });
  }
});

describe("the stages are opt-in (ADR-160)", () => {
  it("without the prop, nothing of a stage is in the markup (the keynote, X-Bionic, the labs)", () => {
    for (const el of [
      <EmbedStack key="s" arrive />,
      <NetworkOrg key="n" />,
      <StackFlow key="v" />,
    ]) {
      expect(renderToStaticMarkup(el)).not.toMatch(
        /data-phone|es-travel|xno-travel|class="es-ph"|es-seat|xno-seat/
      );
    }
  });

  it("with it, the band's travel follows the band and carries a seat at every dwell", () => {
    const steps = renderToStaticMarkup(<EmbedStack phone="stage" />);
    expect(steps).toContain('data-phone="stage"');
    expect(steps).toMatch(/class="es-body"[\s\S]*class="es-travel"/);
    expect((steps.match(/class="es-seat"/g) ?? []).length).toBe(seatsOf(STEPS_PHONE_LEGS).length);
    const net = renderToStaticMarkup(<NetworkOrg phone="stage" org={null} />);
    expect(net).toMatch(/class="xno-phone"[\s\S]*class="xno-travel"/);
    expect((net.match(/class="xno-seat"/g) ?? []).length).toBe(seatsOf(NETWORK_PHONE_LEGS).length);
  });

  it("only the two pages that asked for it pass it, to all three sections", () => {
    const pages: Record<string, number> = {
      "app/(marketing)/cases/page.tsx": 3,
      "app/(marketing)/arcs/thoughtform/ux-meetup/SwarmChapter.tsx": 3,
      "app/(marketing)/arcs/thoughtform/keynote-template-alpha/SwarmChapter.tsx": 0,
      "components/arcs/ArcFlowPorts.tsx": 0,
    };
    for (const [p, n] of Object.entries(pages)) {
      expect((read(p).match(/phone="stage"/g) ?? []).length, p).toBe(n);
    }
  });
});
