/**
 * ADR-150 — the Home sessions page, composed. Every string is the record's,
 * every string holds the copy law, the calendar drives the one lit morning,
 * and the route loads its sheets in the house order.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { SERVICE_PLATES } from "@/components/landing/home-v2/services/servicePlateData";
import { PROPOSAL_COPY_BANS, scanStrings } from "@/lib/arcs/copyLaw";
import { SERVICES_COPY_BANS } from "@/lib/services-ring/servicesCopyLaw";
import { MOVEMENTS, reserveHref, sessionsPageModel } from "@/lib/sessions/page";
import { nextSession, sessionsSorted } from "@/lib/sessions/registry";
import { letterDate } from "@/lib/sheet/dates";
import { HERO_ROUTES } from "@/lib/theme/heroPreload";
import { CONTACT_EMAIL } from "@/lib/site/socials";

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const NOW = new Date("2026-10-07T09:00:00Z");
const model = sessionsPageModel(NOW);
const service = SERVICES.find((s) => s.id === "guided-build")!;
const plate = SERVICE_PLATES.find((p) => p.id === "guided-build")!;

/** The lettered strings — what a reader sees. Geometry, hrefs and the
 *  photograph's alt (description, not offer) are walked separately. */
function lettered() {
  return {
    hero: { ...model.hero, actions: model.hero.actions.map((a) => a.label) },
    morning: {
      kicker: model.morning.kicker,
      title: model.morning.title,
      fig: model.morning.fig,
      span: model.morning.span,
      steps: model.morning.steps.map((s) => [s.n, s.name, s.short, s.body]),
    },
    dates: {
      kicker: model.dates.kicker,
      title: model.dates.title,
      sub: model.dates.sub,
      housing: model.dates.housing,
      count: model.dates.count,
      foot: model.dates.foot,
      ticks: model.dates.axis.ticks.map((t) => t.label),
      tiles: model.dates.tiles.map((t) => ({
        ordinal: t.ordinal,
        weekday: t.weekday,
        month: t.month,
        chips: t.chips,
        status: t.status,
        cta: t.cta,
        title: t.title,
      })),
      reserve: model.dates.reserve.label,
    },
    field: model.field.labels.map((l) => l.text),
    table: {
      kicker: model.table.kicker,
      title: model.table.title,
      corners: model.table.corners,
      fig: model.table.fig,
      readout: model.table.readout,
    },
    reserve: { ...model.reserve, href: undefined },
  };
}

describe("the Home sessions page (ADR-150)", () => {
  it("reads the service's own record, never a copy of it", () => {
    expect(model.hero.lede).toBe(service.body);
    expect(`${model.hero.title.pre} ${model.hero.title.em}`).toBe(service.tagline);
    expect(model.hero.eyebrow).toBe(`${service.verb} · ${plate.statusCode}`);
    expect(model.morning.title).toBe(`${plate.breakdown[0]}.`);
    expect(model.morning.span).toBe(plate.spec.duration);
    expect(model.dates.sub).toBe(`${plate.breakdown[1]}.`);
    expect(model.table.title).toBe(`${plate.spec.leavesWith}.`);
    expect(model.table.readout.map((r) => r.value)).toEqual([
      plate.spec.participants,
      plate.spec.format,
      plate.spec.language,
      plate.spec.duration,
    ]);
    expect(model.table.photo.src).toBe(plate.photo!.webp);
    expect(model.table.photo.alt).toBe(plate.photo!.alt);
    expect(MOVEMENTS[3].body).toBe(`${plate.breakdown[2]}.`);
    expect(model.reserve.email).toBe(CONTACT_EMAIL);
    expect(model.hero.actions[0].label).toBe(service.ctaLabel);
  });

  it("holds the copy law on every lettered string, and prints no money", () => {
    scanStrings(lettered(), "page", (value, path) => {
      expect(value, `${path}: an unrendered value`).not.toMatch(/undefined|\bNaN\b|\[object/);
      for (const [re, why] of [...SERVICES_COPY_BANS, ...PROPOSAL_COPY_BANS])
        expect(value, `${path}: ${why}`).not.toMatch(re);
      expect(value, `${path}: a price`).not.toMatch(/\d{1,3}(?:[.,]\d{3})+/);
    });
  });

  it("letters no digit but a date, an ordinal or the service's code", () => {
    const LAWFUL = [
      /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) \d{1,2} [A-Z][a-z]+ \d{4}\b/gi,
      /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2} [A-Z][a-z]{2}\b/gi,
      /\bMorning \d{2}\b/g,
      /\b\d\.\d\b/g,
      /\bNAV-\d{2}\b/g,
      /\bFig\. \d\b/g,
    ];
    scanStrings(lettered(), "page", (value, path) => {
      const rest = LAWFUL.reduce((s, re) => s.replace(re, ""), value);
      expect(rest, `${path}: a digit outside a date or an ordinal`).not.toMatch(/\d/);
    });
    // the tiles' day and year are date parts, and only date parts
    for (const t of model.dates.tiles) {
      expect(t.day).toMatch(/^\d{2}$/);
      expect(t.year).toMatch(/^\d{4}$/);
    }
  });

  it("lights exactly the next morning, and every open seat mails its own morning", () => {
    const next = nextSession(NOW);
    expect(model.next.id).toBe(next.id);
    expect(model.dates.tiles.filter((t) => t.state === "next").map((t) => t.id)).toEqual([next.id]);
    expect(model.dates.axis.marks.filter((m) => m.lit).map((m) => m.id)).toEqual([next.id]);
    expect(model.field.numerals.filter((n) => n.lit).map((n) => n.id)).toEqual([next.id]);
    expect(model.hero.readout).toBe(`Next morning · ${letterDate(next.date)} · Seats open`);
    for (const s of sessionsSorted()) {
      const tile = model.dates.tiles.find((t) => t.id === s.id)!;
      if (tile.state === "held") {
        expect(tile.href).toBeNull();
        continue;
      }
      expect(tile.href).toBe(reserveHref(s));
      const subject = decodeURIComponent(tile.href!.split("?subject=")[1]);
      expect(subject).toContain(s.title);
      expect(subject).toContain(letterDate(s.date));
      expect(tile.href!.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBe(true);
    }
  });

  it("holds a past morning as held, and lights the last when every date has passed", () => {
    const later = sessionsPageModel(new Date("2026-11-20T09:00:00Z"));
    expect(later.dates.tiles.find((t) => t.id === "october")!.state).toBe("held");
    expect(later.next.id).toBe("december");
    const after = sessionsPageModel(new Date("2027-06-01T09:00:00Z"));
    expect(after.dates.tiles.every((t) => t.state === "held")).toBe(true);
    expect(after.hero.readout).toMatch(/^Last morning · .* · Held$/);
    expect(after.dates.axis.now).toBeNull();
  });

  it("plots every morning inside the axis, oldest first", () => {
    const xs = model.dates.axis.marks.map((m) => m.x);
    expect(xs.every((x) => x > 0 && x < 1)).toBe(true);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(model.dates.axis.ticks[0].x).toBe(0);
    expect(model.dates.axis.now).not.toBeNull();
    expect(model.dates.axis.now!).toBeLessThan(xs[0]);
  });

  it("has four chapters, each a section the page draws", () => {
    expect(model.chapters.length).toBeLessThanOrEqual(5);
    const sources = readdirSync(join(ROOT, "components/sessions"))
      .map((f) => read(`components/sessions/${f}`))
      .join("\n");
    for (const c of model.chapters) expect(sources, c.id).toContain(`id="${c.id}"`);
  });

  it("loads its sheets in the house order, and opens on the key visual", () => {
    const route = read("app/(marketing)/home-sessions/page.tsx");
    const order = [
      'import "@/components/landing/v7/landing.css";',
      'import "@/components/lattice/lattice.css";',
      'import "@/components/sessions/sessions.css";',
      'import "@/components/landing/v7/site-footer/site-footer.css";',
      'import "@/components/landing/v7/theme.css";',
      'import "@/components/landing/v7/rail-instruments/rail-instruments.css";',
    ].map((line) => route.indexOf(line));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(route).toContain("export const revalidate = 86400;");
    expect(route).not.toContain("components/sheet/");

    expect(HERO_ROUTES).toContain("/home-sessions");
    const hero = read("components/sessions/SessionsHero.tsx");
    expect(hero).toContain('data-plate="gateway"');
    expect(hero).toContain('loading="lazy"');
    // the phone's portrait plate is offered before the landscape one
    expect(hero.indexOf("HERO_PLATE_DARK_PORTRAIT}")).toBeLessThan(
      hero.indexOf("srcSet={HERO_PLATE_DARK}")
    );
  });

  it("keeps the record out of every client file", () => {
    for (const f of readdirSync(join(ROOT, "components/sessions"))) {
      const src = read(`components/sessions/${f}`);
      if (!/^\s*["']use client["']/.test(src)) continue;
      expect(src, f).not.toMatch(/from "@\/lib\/sessions\/(page|registry)"/);
      expect(src, f).not.toMatch(/servicePlateData|serviceData/);
    }
  });
});
