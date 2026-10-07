/**
 * lib/sessions/page — the Home sessions page, composed (ADR-150).
 *
 * Every string the page prints comes from a record and is READ here, never
 * restated: the service's own copy (`serviceData.ts` / `servicePlateData.ts`,
 * id `guided-build`), the mornings (`registry.ts`), the address
 * (`lib/site/socials.ts`). A copy edit on the services card lands on this
 * page. The one authored block is the morning's four movements, which no
 * record holds yet (`MOVEMENTS` below, OWNER-TO-CONFIRM like the dates).
 *
 * ⚠ THE DATE IS A PARAMETER. `sessionsPageModel(now)` is pure in `now`; the
 * route passes the request's date and revalidates daily, so "next morning"
 * moves by itself.
 *
 * ⚠ NO PRICE, AND NO DIGIT BUT A DATE OR AN ORDINAL. `sessions-page.test.ts`
 * walks every string this module emits.
 */

import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { SERVICE_PLATES } from "@/components/landing/home-v2/services/servicePlateData";
import { dayNumber, letterDate, monthSpan } from "@/lib/sheet/dates";
import { CONTACT_EMAIL } from "@/lib/site/socials";

import { dialSectors } from "./dial";
import type { DialSector } from "./dial";
import { fieldGeom, fieldSeed } from "./field";
import type { FieldGeom } from "./field";
import { nextSession, sessionStatus, sessionsAxis, sessionsSorted } from "./registry";
import type { Session } from "./registry";

const foundService = SERVICES.find((s) => s.id === "guided-build");
const foundPlate = SERVICE_PLATES.find((p) => p.id === "guided-build");
if (!foundService || !foundPlate || !foundPlate.photo)
  throw new Error("sessions: the guided-build record is missing, or carries no photograph");

/** The service record's own entries, read by reference (and by the test). */
export const SESSIONS_SERVICE = foundService;
export const SESSIONS_PLATE = foundPlate;
const service = foundService;
const plate = foundPlate;
const PHOTO = foundPlate.photo;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * The morning's four movements. ⚠ OWNER-TO-CONFIRM (2026-10-07): the
 * minutes are a first draft summing to the record's three hours, and they
 * are drawn, never lettered — each one is a sector's sweep on the dial.
 * Three of the four sentences are the page's own from ADR-114; the fourth
 * is the record's breakdown line.
 */
export const MOVEMENTS = [
  {
    id: "arrival",
    n: "1.1",
    name: "Arrival",
    short: "Arrival",
    body: "Coffee at the table, and the room settles.",
    minutes: 15,
  },
  {
    id: "argument",
    n: "1.2",
    name: "The argument",
    short: "Argument",
    body: "The argument behind the practice, in full.",
    minutes: 60,
  },
  {
    id: "by-hand",
    n: "1.3",
    name: "The skill by hand",
    short: "By hand",
    body: "The skill by hand, on your own work.",
    minutes: 75,
  },
  {
    id: "after",
    n: "1.4",
    name: "The circle after",
    short: "After",
    body: `${plate.breakdown[2]}.`,
    minutes: 30,
  },
] as const;

/** The seat is reserved by mail; the subject names the morning. */
export function reserveHref(s: Session): string {
  const subject = `Reserve a seat: ${s.title}, ${letterDate(s.date)}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export type TileState = "next" | "open" | "held";

export interface SessionsTile {
  id: string;
  ordinal: string;
  day: string;
  weekday: string;
  month: string;
  year: string;
  chips: readonly string[];
  state: TileState;
  status: string;
  href: string | null;
  cta: string;
  title: string;
}

export interface AxisMark {
  id: string;
  x: number;
  lit: boolean;
  held: boolean;
}

export interface AxisTick {
  id: string;
  x: number;
  label: string;
}

export interface SessionsPageModel {
  chapters: readonly { id: string; label: string; primary: true }[];
  next: Session;
  hero: {
    eyebrow: string;
    title: { pre: string; em: string };
    lede: string;
    readout: string;
    actions: readonly { id: string; label: string; href: string; primary: boolean }[];
  };
  morning: {
    kicker: string;
    title: string;
    fig: string;
    span: string;
    steps: readonly (typeof MOVEMENTS)[number][];
    sectors: readonly DialSector[];
  };
  dates: {
    kicker: string;
    title: string;
    sub: string;
    housing: string;
    count: string;
    axis: { ticks: readonly AxisTick[]; marks: readonly AxisMark[]; now: number | null };
    tiles: readonly SessionsTile[];
    foot: string;
    reserve: { label: string; href: string };
  };
  field: FieldGeom & { labels: readonly { id: string; text: string }[] };
  table: {
    kicker: string;
    title: string;
    photo: { src: string; fallback: string; alt: string; width: number; height: number };
    corners: readonly [string, string, string, string];
    fig: string;
    readout: readonly { key: string; value: string }[];
  };
  reserve: {
    kicker: string;
    title: string;
    date: string;
    sub: string;
    label: string;
    href: string;
    email: string;
  };
}

const upper = (s: string) => s.toUpperCase();

/** The fraction of the axis a day sits at: the middle of its day, or its
 *  morning edge for a month boundary. */
function axisX(iso: string, from: string, to: string, edge = false): number {
  const start = dayNumber(`${from}-01`);
  const [y, m] = to.split("-").map(Number);
  const end = dayNumber(`${m === 12 ? y + 1 : y}-${String((m % 12) + 1).padStart(2, "0")}-01`);
  const x = (dayNumber(iso) + (edge ? 0 : 0.5) - start) / (end - start);
  return Math.round(x * 10000) / 10000;
}

export function sessionsPageModel(now: Date): SessionsPageModel {
  const sorted = sessionsSorted();
  const next = nextSession(now);
  const allPast = sessionStatus(next, now) === "past";
  const spec = plate.spec;
  const [pre, em] = splitTagline(service.tagline);
  const { from, to } = sessionsAxis();
  const today = now.toISOString().slice(0, 10);
  const nowX = axisX(today, from, to);

  const tiles: SessionsTile[] = sorted.map((s, i) => {
    const [y, m, d] = s.date.split("-").map(Number);
    const weekday = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    const past = sessionStatus(s, now) === "past";
    const state: TileState = past ? "held" : s.id === next.id ? "next" : "open";
    return {
      id: s.id,
      ordinal: `Morning ${String(i + 1).padStart(2, "0")}`,
      day: String(d).padStart(2, "0"),
      weekday,
      month: MONTHS[m - 1],
      year: String(y),
      chips: [`${weekday.slice(0, 3)} ${d} ${MONTHS[m - 1].slice(0, 3)}`, "Antwerp", spec.language],
      state,
      status: state === "held" ? "Held" : state === "next" ? "Next morning" : "Seats open",
      href: past ? null : reserveHref(s),
      cta: past ? "Held" : service.ctaLabel,
      title: s.title,
    };
  });

  const nextIdx = sorted.findIndex((s) => s.id === next.id);
  const field = fieldGeom(
    sorted.map((s) => ({ id: s.id, day: s.date.slice(8, 10) })),
    allPast ? -1 : nextIdx,
    fieldSeed(sorted.map((s) => s.date))
  );

  return {
    chapters: [
      { id: "the-morning", label: "The morning", primary: true },
      { id: "dates", label: "The dates", primary: true },
      { id: "the-table", label: "The table", primary: true },
      { id: "reserve", label: "Reserve", primary: true },
    ],
    next,
    hero: {
      eyebrow: `${service.verb} · ${plate.statusCode}`,
      title: { pre, em },
      lede: service.body,
      readout: allPast
        ? `Last morning · ${letterDate(next.date)} · Held`
        : `Next morning · ${letterDate(next.date)} · Seats open`,
      actions: [
        { id: "reserve", label: service.ctaLabel, href: reserveHref(next), primary: true },
        { id: "dates", label: "See the mornings", href: "#dates", primary: false },
      ],
    },
    morning: {
      kicker: "The morning",
      title: `${plate.breakdown[0]}.`,
      fig: "Fig. 1 · The morning",
      span: spec.duration,
      steps: MOVEMENTS,
      sectors: dialSectors(MOVEMENTS),
    },
    dates: {
      kicker: "The dates",
      title: "The mornings on the calendar.",
      sub: `${plate.breakdown[1]}.`,
      housing: "The mornings",
      count: `${spec.format} · ${spec.language}`,
      axis: {
        ticks: monthSpan(from, to).map((ym) => {
          const [, m] = ym.split("-").map(Number);
          return {
            id: ym,
            x: axisX(`${ym}-01`, from, to, true),
            label: upper(MONTHS[m - 1].slice(0, 3)),
          };
        }),
        marks: sorted.map((s) => ({
          id: s.id,
          x: axisX(s.date, from, to),
          lit: !allPast && s.id === next.id,
          held: sessionStatus(s, now) === "past",
        })),
        now: nowX >= 0 && nowX <= 1 ? nowX : null,
      },
      tiles,
      foot: `${spec.participants} · ${spec.duration}`,
      reserve: { label: service.ctaLabel, href: reserveHref(next) },
    },
    field: {
      ...field,
      labels: sorted.map((s) => {
        const [, m] = s.date.split("-").map(Number);
        const state =
          sessionStatus(s, now) === "past" ? "Held" : s.id === next.id ? "Next" : "Open";
        return { id: s.id, text: `${MONTHS[m - 1]} · ${state}` };
      }),
    },
    table: {
      kicker: "The table",
      title: `${spec.leavesWith}.`,
      photo: { src: PHOTO.webp, fallback: PHOTO.jpg, alt: PHOTO.alt, width: 840, height: 1360 },
      corners: ["At the table", "Antwerp", "One morning", spec.language],
      fig: "Fig. 3 · The table, from above",
      readout: [
        { key: "Seats", value: spec.participants },
        { key: "Where", value: spec.format },
        { key: "Language", value: spec.language },
        { key: "Duration", value: spec.duration },
      ],
    },
    reserve: {
      kicker: "Reserve",
      title: `${service.ctaLabel}.`,
      date: letterDate(next.date),
      sub: `${spec.duration}, ${spec.format.charAt(0).toLowerCase()}${spec.format.slice(1)}.`,
      label: service.ctaLabel,
      href: reserveHref(next),
      email: CONTACT_EMAIL,
    },
  };
}

/** "The skill, for yourself." → ["The skill,", "for yourself."]. */
function splitTagline(tagline: string): [string, string] {
  const at = tagline.indexOf(",");
  if (at < 0) return [tagline, ""];
  return [tagline.slice(0, at + 1), tagline.slice(at + 1).trim()];
}
