import type { CaseDef } from "@/lib/cases/types";

/**
 * CLIENT_STACK_FIXTURE — the SECOND client, and it is not a client.
 *
 * ⚠ **IT LIVES BESIDE THE LAB ROUTE, NEVER IN `lib/cases/`.** The
 * confidentiality envelope and the registry guard both key on `CASES`
 * (`tests/lib/cases-registry.test.ts` walks that array with
 * `JSON.stringify`), so a fixture parked in the content module would light
 * up a second tab on the PUBLIC page the moment someone imported the
 * registry — which is exactly the "do not ship placeholder clients"
 * ruling in `.claude/rules/proof.md`. Here it is unreachable from
 * production: `app/(internal)` is proxy-blocked, and nothing outside this
 * directory imports this file.
 *
 * ⚠ **BEING OUTSIDE THE GUARD'S ENVELOPE IS A REASON TO BE STRICTER, NOT
 * LOOSER.** Nothing here is scanned, so nothing here may be mistakable for a
 * record: the client is `SPECIMEN INDUSTRIES`, every value that could read as
 * a claim is a word rather than a figure, and the copy says what it is on the
 * surface itself (the brief's first sentence). No real client name, no
 * percentage, no count, no date that could be read as provenance.
 *
 * ⚠ **THREE TRACKS, DELIBERATELY** — the Loop casefile carries four. The
 * segment table sizes each client's band by ITS OWN row count
 * (`browseSegments`), and a fixture with four rows would make the two bands
 * equal, which is the one shape in which an off-by-one in the normalization
 * cannot show. Unequal rows are the whole reason the table exists.
 *
 * The visuals are the three plate kinds that need NO asset and NO id join —
 * `register`, `log` and `signal` are pure DOM/SVG, so the fixture pulls in no
 * bytes and cannot resolve against `PROJECT_CASES` (a `tools` reuse would put
 * real Loop captures inside a fake client, which is worse than plain).
 */
export const CLIENT_STACK_FIXTURE: CaseDef = {
  slug: "specimen-industries",
  client: "Specimen Industries",

  /* `report` and `beats` exist so the fixture satisfies `CaseDef`. The
     casefile is the only surface this lab mounts, so they carry the minimum
     that still reads as this fixture rather than as a stub of a real case. */
  report: {
    title: { pre: "A fixture, ", em: "not a case", post: "." },
    lede: "Synthetic content for the client-seam lab. Nothing here describes real work.",
    stats: [
      { value: "—", label: "specimen tile" },
      { value: "—", label: "specimen tile" },
      { value: "—", label: "specimen tile" },
    ],
    meta: [
      { label: "CLIENT", value: "SPECIMEN INDUSTRIES" },
      { label: "ROLE", value: "FIXTURE" },
      { label: "PERIOD", value: "NOT APPLICABLE" },
      { label: "STATUS", value: "SPECIMEN" },
    ],
  },

  beats: [
    {
      id: "specimen-navigate",
      phase: "navigate",
      title: { pre: "Specimen ", em: "navigate" },
      body: ["Placeholder beat body. This fixture exists to give the browse band a second client."],
      visual: {
        kind: "log",
        title: "SPECIMEN LOG",
        rows: [{ t: "AA.01", event: "Specimen entry" }],
      },
    },
    {
      id: "specimen-encode",
      phase: "encode",
      title: { pre: "Specimen ", em: "encode" },
      body: ["Placeholder beat body."],
      visual: {
        kind: "log",
        title: "SPECIMEN LOG",
        rows: [{ t: "AA.02", event: "Specimen entry" }],
      },
    },
    {
      id: "specimen-build",
      phase: "build",
      title: { pre: "Specimen ", em: "build" },
      body: ["Placeholder beat body."],
      visual: {
        kind: "log",
        title: "SPECIMEN LOG",
        rows: [{ t: "AA.03", event: "Specimen entry" }],
      },
    },
  ],

  casefile: {
    ix: "02",
    tab: "SPECIMEN",
    logCode: "TF-XXXX",
    state: "SPECIMEN",
    classLine: "FIXTURE · NOT A RECORD · LAB ONLY",
    brief: [
      "Every word on this tab is synthetic. ",
      { em: "Specimen Industries does not exist" },
      " — the fixture is here so the client seam can be judged at two clients, with unequal row counts, on the shipped component.",
    ],
    tracks: [
      {
        id: "specimen-ledger",
        file: "01_SPECIMEN-LEDGER/",
        meta: "SPECIMEN",
        project: "Specimen Ledger",
        icon: "dir",
        preview: "A dotted-leader register, so the seam is judged on chrome-dense content.",
        classification: "FIXTURE · REGISTER PLATE",
        brief: [
          "Row one of the fixture. It carries a ",
          { em: "register" },
          " plate — the densest chrome the panel can hold without an asset.",
        ],
        blocks: [
          {
            glyph: "board",
            title: "Specimen claim, row one",
            desc: "Placeholder evidence sentence. It states nothing about any real engagement.",
          },
          {
            glyph: "encode",
            title: "Specimen claim, row two",
            desc: "Placeholder evidence sentence, written to the same length as a real one.",
          },
          {
            glyph: "reuse",
            title: "Specimen claim, row three",
            desc: "Placeholder evidence sentence. The register is four rows on every track.",
          },
          {
            glyph: "envelope",
            title: "Specimen claim, row four",
            desc: "Placeholder evidence sentence closing the fixture's first register.",
          },
        ],
        context: [
          { k: "Specimen key", v: "Specimen value" },
          { k: "Second key", v: "Second value" },
        ],
        source: "SPECIMEN · FIXTURE ONLY",
        visual: {
          kind: "register",
          rows: [
            { k: "Specimen row", v: "Specimen value" },
            { k: "Second row", v: "Second value" },
            { k: "Third row", v: "Third value" },
            { k: "Fourth row", v: "Fourth value" },
            { k: "Fifth row", v: "Fifth value" },
          ],
          footer: "Synthetic register. Nothing here is a measurement.",
        },
      },
      {
        id: "specimen-bench",
        file: "02_FIXTURE-BENCH/",
        meta: "SPECIMEN",
        project: "Fixture Bench",
        icon: "dir",
        preview: "A terminal log, so the incoming panel has left-aligned rows to strike on.",
        classification: "FIXTURE · LOG PLATE",
        blocks: [
          {
            glyph: "field",
            title: "Bench claim, row one",
            desc: "Placeholder evidence sentence for the fixture's second track.",
          },
          {
            glyph: "threshold",
            title: "Bench claim, row two",
            desc: "Placeholder evidence sentence. No figure appears anywhere on this tab.",
          },
          {
            glyph: "cadence",
            title: "Bench claim, row three",
            desc: "Placeholder evidence sentence, same budget as the shipped register.",
          },
          {
            glyph: "holdfast",
            title: "Bench claim, row four",
            desc: "Placeholder evidence sentence closing the bench register.",
          },
        ],
        context: [{ k: "Bench key", v: "Bench value" }],
        source: "SPECIMEN · FIXTURE ONLY",
        visual: {
          kind: "log",
          rows: [
            { t: "AA.01", event: "Specimen event, first row" },
            { t: "AA.02", event: "Specimen event, second row" },
            { t: "AA.03", event: "Specimen event, third row" },
            { t: "AA.04", event: "Specimen event, fourth row" },
            { t: "AA.05", event: "Specimen event, fifth row" },
            { t: "AA.06", event: "Specimen event, sixth row" },
          ],
          tail: "Synthetic log. Stamps are letters so no row can read as a date.",
        },
      },
      {
        id: "specimen-rigging",
        file: "03_DUMMY-RIGGING/",
        meta: "SPECIMEN",
        project: "Dummy Rigging",
        icon: "doc",
        preview: "A drawn curve, so the seam is judged on an SVG plate as well as on type.",
        classification: "FIXTURE · SIGNAL PLATE",
        blocks: [
          {
            glyph: "masters",
            title: "Rigging claim, row one",
            desc: "Placeholder evidence sentence for the fixture's third track.",
          },
          {
            glyph: "level",
            title: "Rigging claim, row two",
            desc: "Placeholder evidence sentence. The curve below plots nothing real.",
          },
          {
            glyph: "broadcast",
            title: "Rigging claim, row three",
            desc: "Placeholder evidence sentence at the register's own budget.",
          },
          {
            glyph: "parallel",
            title: "Rigging claim, row four",
            desc: "Placeholder evidence sentence closing the fixture's last register.",
          },
        ],
        context: [{ k: "Rigging key", v: "Rigging value" }],
        source: "SPECIMEN · FIXTURE ONLY",
        visual: {
          kind: "signal",
          /* An arbitrary rising shape. The stamps are letters for the same
             reason the log's are: a plotted curve with dated stamps is the one
             thing on this fixture a reader could mistake for evidence. */
          points: [
            { x: 0, y: 0.1, stamp: "AA", label: "Specimen" },
            { x: 0.34, y: 0.34, stamp: "BB", label: "Specimen" },
            { x: 0.68, y: 0.62, stamp: "CC", label: "Specimen" },
            { x: 1, y: 0.9, stamp: "DD", label: "Specimen" },
          ],
          t0: "START",
          now: "NOW",
        },
      },
    ],
  },

  meta: {
    title: "Specimen Industries — lab fixture",
    description: "Synthetic casefile used by /test/client-stack-lab. Not a client, not a record.",
  },
};
