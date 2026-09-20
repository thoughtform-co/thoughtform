/**
 * lib/sheet/home-sessions — the Home sessions page as a sheet ladder
 * (ADR-114).
 *
 * The COPY is the services record's own (ADR-112, id `guided-build`): the
 * title, the body, the spec rows, the three breakdown lines and the table
 * photograph — read here, never restated, so a copy edit on the card lands
 * on the page. The DATES are `lib/sessions`. The ladder: split · timeline ·
 * steps · cells · row · close — six sections, five arrangements, none
 * repeated back to back.
 */

import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { SERVICE_PLATES } from "@/components/landing/home-v2/services/servicePlateData";
import { nextSession, sessionStatus, sessionsAxis, sessionsSorted } from "@/lib/sessions/registry";
import type { Session } from "@/lib/sessions/registry";
import { CONTACT_EMAIL } from "@/lib/site/socials";

import { letterDate } from "./dates";
import type { SheetSection } from "./types";

const service = SERVICES.find((s) => s.id === "guided-build");
const plate = SERVICE_PLATES.find((p) => p.id === "guided-build");
if (!service || !plate || !plate.photo)
  throw new Error("home-sessions: the guided-build record is missing, or carries no photograph");

const SERVICE = service;
const PLATE = plate;
const PHOTO = plate.photo;

/** The seat is reserved by mail; the subject names the morning. */
export function reserveHref(s: Session): string {
  const subject = `Reserve a seat: ${s.title}, ${letterDate(s.date)}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export function homeSessionsSections(now: Date): SheetSection[] {
  const sorted = sessionsSorted();
  const next = nextSession(now);
  const spec = PLATE.spec;
  return [
    {
      kind: "split",
      id: "home-sessions",
      name: "Home sessions",
      title: { pre: "The skill,", em: "for yourself." },
      paragraphs: [SERVICE.body, PLATE.breakdown[0] + "."],
      readout: [
        { label: "Duration", value: spec.duration },
        { label: "Seats", value: spec.participants },
        { label: "Where", value: spec.format },
        { label: "Language", value: spec.language },
        { label: "Leaves with", value: spec.leavesWith },
      ],
    },
    {
      kind: "timeline",
      id: "calendar",
      kicker: "On the calendar",
      menuLabel: "Calendar",
      menuPrimary: true,
      axis: sessionsAxis(),
      items: sorted.map((s) => ({
        id: s.id,
        date: s.date,
        title: s.title,
        sub:
          sessionStatus(s, now) === "past"
            ? "Held"
            : s.id === next.id
              ? "Next morning"
              : "Seats open",
      })),
      lit: next.id,
    },
    {
      kind: "steps",
      id: "reserve",
      kicker: "Reserve a seat",
      menuLabel: "Reserve",
      menuPrimary: true,
      items: sorted.map((s) => ({
        id: s.id,
        when: letterDate(s.date),
        title: s.title,
        lines: [PLATE.breakdown[1], PLATE.breakdown[2]],
        cta: { label: SERVICE.ctaLabel, href: reserveHref(s) },
      })),
      open: next.id,
    },
    {
      kind: "cells",
      id: "the-morning",
      kicker: "The morning",
      menuLabel: "The morning",
      menuPrimary: true,
      n: 2,
      cells: [
        {
          id: "how-it-runs",
          kicker: "How it runs",
          body: [SERVICE.tagline],
          steps: [
            { when: "Arrival", what: "Coffee at the table, and the room settles." },
            { when: "First half", what: "The argument behind the practice, in full." },
            { when: "Second half", what: "The skill by hand, on your own work." },
            { when: "After", what: PLATE.breakdown[2] + "." },
          ],
        },
        {
          id: "the-practical",
          kicker: "The practical",
          body: [PLATE.breakdown[1] + "."],
          readout: [
            { label: "Where", value: spec.format },
            { label: "When", value: spec.duration },
            { label: "Seats", value: spec.participants },
            { label: "Language", value: spec.language },
          ],
        },
      ],
    },
    {
      kind: "row",
      id: "at-the-table",
      kicker: "At the table",
      menuLabel: "At the table",
      menuPrimary: true,
      items: [
        {
          id: "vince",
          title: "Vince Buyssens at the table",
          tags: ["Antwerp", "One morning", spec.language],
          body: SERVICE.body,
          figure: {
            kind: "image",
            src: PHOTO.webp,
            alt: PHOTO.alt,
            width: 840,
            height: 1360,
            caption: "At the table, mid-session",
            treatment: "duotone",
          },
        },
      ],
    },
    { kind: "close", id: "contact", menuLabel: "Contact" },
  ];
}
