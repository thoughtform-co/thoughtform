import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { nextSession, sessionsAxis, sessionsSorted } from "@/lib/sessions/registry";
import { letterDate } from "@/lib/sheet/dates";
import type { SheetSection } from "@/lib/sheet/types";

/**
 * The kit's fixtures (ADR-114): every arrangement, every primitive, every
 * state the sheet has, on one page — the specimen sheet the eval grades as
 * type `SK` and the place a primitive is read before a page spends it.
 *
 * ⚠ FIXTURES ARE LABELLED AS FIXTURES. The console is the Loop tools record
 * (the casefile's own `PROJECT_CASES`, published) drawn as a four-card pile
 * so the stack mechanic has something to stack — every real console today
 * holds one card. Nothing here carries a price or a claim a page does not.
 */
export function kitSections(now: Date): SheetSection[] {
  const sorted = sessionsSorted();
  const next = nextSession(now);
  const tools = PROJECT_CASES.slice(0, 4);
  return [
    {
      kind: "split",
      id: "kit",
      name: "Subpage kit",
      title: { pre: "Every arrangement,", em: "every state." },
      paragraphs: [
        "The sheet's vocabulary on one page: the split, the row, the cells, the console, the timeline, the steps, the table, the figure, the prose and the close.",
        "What a page spends is read here first.",
      ],
      readout: [
        { label: "Arrangements", value: "Ten" },
        { label: "Knobs", value: "Five" },
        { label: "Directions", value: "Four, and a negative pole" },
        { label: "Rules", value: "One weight, one hue, three alphas" },
      ],
      stations: {
        attr: "kind",
        label: "Filter the fixtures by kind",
        stations: [
          { id: "keynote", name: "Keynotes" },
          { id: "workshop", name: "Workshops" },
          { id: "production", name: "Productions" },
        ],
      },
    },
    {
      kind: "console",
      id: "console-fixture",
      kicker: "The console",
      consoles: [
        {
          id: "loop-fixture",
          menuLabel: "Console",
          menuPrimary: true,
          panel: {
            name: "Loop Earplugs · fixture",
            readout: [
              { label: "Engagements", value: String(tools.length) },
              { label: "Standing", value: "Delivered" },
              { label: "Latest", value: tools[0]?.tab ?? "" },
              { label: "Since", value: "2023" },
              { label: "Kinds", value: "Productions" },
            ],
            lede: "Four tools the studio runs, as a pile: the fixture that exercises the stack.",
          },
          cards: tools.map((t) => ({
            id: t.id,
            kicker: t.tab,
            title: t.tagline,
            body: `${t.codename}, in service. A fixture card over the casefile's own record: the shape is the page's, the content is the tool's.`,
            figure: {
              kind: "image" as const,
              src: t.image.src,
              alt: t.image.alt,
              width: t.image.width,
              height: t.image.height,
              caption: t.tab,
              treatment: "duotone" as const,
            },
            href: "/arcs/loop-earplugs",
            data: { kind: "production" },
          })),
          data: { "sh-filter": "kind", kinds: "production" },
        },
      ],
    },
    {
      kind: "row",
      id: "row-fixture",
      kicker: "Ruled rows",
      items: [
        {
          id: "row-image",
          title: "A row with a photograph",
          tags: ["Ordinal", "Title", "Tags"],
          body: "Ordinal, title, mono tags, paragraph and figure across one hairline row, the fields aligned down the column.",
          figure: {
            kind: "image",
            src: "/images/services/strategic.webp",
            alt: "At the table",
            width: 840,
            height: 1360,
            caption: "Duotone, portrait",
            treatment: "duotone",
          },
        },
        {
          id: "row-mark",
          title: "A row with the house mark",
          tags: ["Mark", "No photograph"],
          body: "When a record has no picture the frame carries the house's generative mark instead of an empty box.",
          figure: { kind: "mark", caption: "The mark", seed: 2 },
        },
      ],
    },
    {
      kind: "cells",
      id: "cells-three",
      kicker: "Three cells",
      n: 3,
      cells: [
        {
          id: "c1",
          kicker: "Keynote",
          body: ["A shared frame for AI, built on the room's own cases."],
          caption: "Navigate",
          data: { "sh-filter": "kind", kinds: "keynote" },
        },
        {
          id: "c2",
          kicker: "Workshop",
          body: ["One configuration, built with a team in a day, on its own keys."],
          caption: "Navigate and encode",
          data: { "sh-filter": "kind", kinds: "workshop" },
        },
        {
          id: "c3",
          kicker: "Embedded",
          body: ["A capability the team owns, in three stage-gated workstreams."],
          caption: "Encode and build",
          data: { "sh-filter": "kind", kinds: "production" },
        },
      ],
    },
    {
      kind: "timeline",
      id: "timeline-fixture",
      kicker: "The timeline",
      menuLabel: "Timeline",
      menuPrimary: true,
      axis: sessionsAxis(),
      items: sorted.map((s) => ({
        id: s.id,
        date: s.date,
        title: s.title,
        sub: s.id === next.id ? "Lit" : "Rest",
      })),
      lit: next.id,
    },
    {
      kind: "steps",
      id: "steps-fixture",
      kicker: "The steps",
      items: sorted.map((s) => ({
        id: s.id,
        when: letterDate(s.date),
        title: s.title,
        lines: ["The open item shows its lines.", "The rest show one line each."],
        cta: { label: "Reserve a seat", href: "/home-sessions" },
      })),
      open: next.id,
    },
    {
      kind: "table",
      id: "table-fixture",
      kicker: "The table",
      menuLabel: "Table",
      menuPrimary: true,
      columns: ["Date", "Title", "Summary", "Tags"],
      rows: [
        {
          id: "t1",
          cells: [
            "14 Sep 2026",
            "Navigate the intelligence",
            "Where the model sits in the work.",
            "navigate · practice",
          ],
          href: "/musings",
          tags: ["navigate", "practice"],
        },
        {
          id: "t2",
          cells: [
            "7 Sep 2026",
            "Encode the context",
            "The layer a team writes down.",
            "encode · practice",
          ],
          href: "/musings",
          tags: ["encode", "practice"],
          draft: true,
        },
        {
          id: "t3",
          cells: [
            "30 Aug 2026",
            "The capability your team owns",
            "What stays when we go.",
            "build · practice",
          ],
          href: "/musings",
          tags: ["build", "practice"],
        },
      ],
      stations: {
        attr: "tag",
        label: "Filter the rows by tag",
        stations: [
          { id: "navigate", name: "navigate" },
          { id: "encode", name: "encode" },
          { id: "build", name: "build" },
          { id: "practice", name: "practice" },
        ],
      },
    },
    {
      kind: "figure",
      id: "figure-fixture",
      kicker: "The figure",
      items: [
        {
          id: "f1",
          figure: {
            kind: "image",
            src: tools[0]?.image.src ?? "/images/services/strategic.webp",
            alt: tools[0]?.image.alt ?? "",
            width: tools[0]?.image.width ?? 840,
            height: tools[0]?.image.height ?? 1360,
            caption: "A capture, in the duotone",
            treatment: "duotone",
          },
          kicker: "Figure, framed",
          title: "A capture in a frame",
          lede: "The bracketed FIG bar, the picture taken into the grammar, the mono caption.",
        },
        {
          id: "f2",
          figure: { kind: "mark", caption: "The mark", seed: 4 },
          kicker: "Figure, generative",
          title: "The house's own mark",
          lede: "A dot lattice with one diamond seated in it, for a record with no picture.",
        },
      ],
    },
    {
      kind: "prose",
      id: "prose-fixture",
      kicker: "The prose",
      menuLabel: "Prose",
      menuPrimary: true,
      meta: [
        { label: "Date", value: letterDate("2026-09-14") },
        { label: "Author", value: "Vince Buyssens" },
        { label: "Reading", value: "2 min" },
        { label: "Tags", value: "kit · fixture" },
      ],
    },
    {
      kind: "cells",
      id: "cells-two",
      kicker: "Two cells",
      n: 2,
      cells: [
        {
          id: "schedule",
          kicker: "A stepped schedule",
          body: ["A cell can carry a rail of steps."],
          steps: [
            { when: "Arrival", what: "Coffee at the table." },
            { when: "First half", what: "The argument, in full." },
            { when: "Second half", what: "The skill, by hand." },
          ],
        },
        {
          id: "readout",
          kicker: "A readout",
          body: ["Or a readout column, the label dim and the value lit."],
          readout: [
            { label: "Where", value: "At the table, in Antwerp" },
            { label: "When", value: "One morning, three hours" },
            { label: "Language", value: "NL / EN" },
          ],
        },
      ],
    },
    { kind: "close", id: "contact", menuLabel: "Contact" },
  ];
}
