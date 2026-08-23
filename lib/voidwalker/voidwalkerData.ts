/**
 * The VOIDWALKER through-line — the nine beats that led up to Thoughtform
 * (ADR-074). Content ONLY: this module has ZERO imports (the `lib/cases`
 * law), so the renderer, the unit guard and any parse-time consumer read
 * one record.
 *
 * The leitmotif is the owner's own, from the strategy skill's navigator
 * reference: *read a new system early, build the layer that lets people act
 * inside it, then step back.* Every beat is that move on a different system.
 * Facts are at LOCK — the crowd figures, the petition, the upvotes and the
 * press names are the sourced set (the CV, the vault's press notes, the
 * articles themselves). No rounding, no combining into new claims;
 * `tests/lib/voidwalker-data.test.ts` pins the phrasings.
 *
 * ⚠ The word "Voidwalker" is the SECTION TITLE here by owner decision
 * (2026-08-23), which overrules the strategy skill's invoice-only rule for
 * this one surface — recorded in ADR-074. It appears nowhere in the prose.
 */

/** A run of body text. `em` = upright gold emphasis (the `.voidwalker__bio em`
 *  recipe); `mark` = a real-world entity, dawn ink with a gold underline,
 *  never a link. Markup may not be smuggled into strings. */
export type VwSegment = string | { em: string } | { mark: string };

export interface VwPress {
  /** The outlet, as it prints on the plate's bar (`PRESS · NEWSWEEK`). */
  outlet: string;
  /** The headline, verbatim from the piece (≤110 chars — two lines on the bar). */
  headline: string;
  /** ISO date where the piece is dated. */
  date?: string;
  /** The article, when a public URL is on file — the bar becomes a link. */
  href?: string;
}

/** The six drawings, keyed for the wireframe registry. */
export type VwWireId = "hunt" | "ophef" | "expanse" | "coins" | "azeroth" | "latent";

export interface VoidwalkerBeat {
  /** Kebab id — the DOM id is `vw-${id}`. */
  id: string;
  /** As lettered on the spine: "2016" | "2014–2017" (en dash). */
  year: string;
  /** Chronology guard — the beats are sorted by this. */
  sortYear: number;
  /** A STORY beat carries a wireframe plate and a press bar; a WAYPOINT is
   *  a compact row on the same spine (the prologue and the terminus). */
  kind: "story" | "waypoint";
  /** ≤28 chars plain (story) / ≤32 (waypoint) — one to two lines at the
   *  display size in the 5fr title column. */
  title: VwSegment[];
  /** ≤300 chars plain (story) / ≤170 (waypoint). */
  body: VwSegment[];
  /** Story only — the plate's top line, `ARTEFACT · …` (≤24 chars). */
  artefact?: string;
  /** Story: required. Waypoint: optional (lettered without a plate). */
  press?: VwPress;
  /** Story: required; must exist in the wireframe registry. */
  wire?: VwWireId;
}

export const VOIDWALKER_HEAD = {
  title: "VOIDWALKER",
  lede: [
    "Before there were models to prompt, there were crowds, fandoms and classrooms. ",
    { em: "He was prompting humans for decades." },
  ] as readonly VwSegment[],
  foot: [
    "The same move each time: read a new system early, build the layer that lets people act inside it, step back.",
  ] as readonly VwSegment[],
  /** The terminus hands to the contact beat — `#practice` is an empty
   *  breather station in production (its body is stripped at parse time),
   *  so it is not a destination. */
  next: { label: "Next · Plot your course", href: "#contact" },
} as const;

export const VOIDWALKER_BEATS: readonly VoidwalkerBeat[] = [
  {
    id: "creatives",
    year: "2014–2017",
    sortYear: 2014,
    kind: "waypoint",
    title: ["Antwerp. Powered by Creatives"],
    body: [
      "Community manager for the Antwerp creative industry. The native terrain: people, disciplines, industries — a community that holds without its organiser in the middle.",
    ],
  },
  {
    id: "pokemon-go",
    year: "2016",
    sortYear: 2016,
    kind: "story",
    title: ["The crowd was the work."],
    body: [
      "Co-founded Pokémon GO Belgium and stepped forward as the country's first Pokémon GO consultant, advising ",
      { mark: "Unizo" },
      ". A hunt on Kammenstraat drew about a thousand people; a second, with Antwerp Zoo, sixteen thousand. ",
      { em: "He barely played the game." },
      " The game was the medium.",
    ],
    artefact: "STREET HUNT · ANTWERP",
    press: {
      outlet: "Gazet van Antwerpen",
      headline: "Pokémon-gekte in Kammenstraat is nog maar het begin",
      date: "2016-07-27",
    },
    wire: "hunt",
  },
  {
    id: "ophef",
    year: "2016",
    sortYear: 2016.8,
    kind: "story",
    title: ["A hashtag became a party."],
    body: [
      "October 2016. A hashtag that got out of hand on Twitter became a political party for millennials, founded in Antwerp by four twenty-somethings — ",
      { em: "a party by millennials, but for everyone." },
      " He was one of the four, quoted as co-founder at twenty-six.",
    ],
    artefact: "HASHTAG · PARTY",
    press: {
      outlet: "De Standaard",
      headline: "South Park meets de Wetstraat",
      date: "2016-10-19",
      href: "https://www.standaard.be/cnt/dmf20161018_02526101",
    },
    wire: "ophef",
  },
  {
    id: "expanse",
    year: "2018",
    sortYear: 2018,
    kind: "story",
    title: ["Venting became a campaign."],
    body: [
      "SyFy cancelled the show. Reddit vented; a Discord became the command centre. The petition passed 100,000 signatures, a crowdfunded banner plane circled Amazon Studios, and he flew to LA to put it in front of Jeff Bezos. Amazon picked it up: ",
      { em: "three more seasons." },
    ],
    artefact: "CAMPAIGN · DISCORD",
    press: {
      outlet: "Newsweek",
      headline: "The Flight to Save The Expanse",
      href: "https://www.newsweek.com/expanse-save-amazon-syfy-season-4-renew-fans-934620",
    },
    wire: "expanse",
  },
  {
    id: "coins",
    year: "2018",
    sortYear: 2018.9,
    kind: "story",
    title: ["Six coins, one bullet."],
    body: [
      "November 2018, the Armistice centenary. He posted his great-grandfather's story to Reddit: six coins in Optatius Buyssens's breast pocket gave him away near Lebbeke in 1914 — ",
      { em: "and stopped the bullet." },
      " Past 100,000 upvotes and over a million views; BBC, CNN and VRT followed.",
    ],
    artefact: "REDDIT POST · SIX COINS",
    press: {
      outlet: "CNN",
      headline:
        "Six coins in a World War I soldier's pocket got him discovered and shot. They also saved his life.",
      date: "2018-11-13",
      href: "https://edition.cnn.com/2018/11/13/world/wwi-coins-save-soldier-trnd/index.html",
    },
    wire: "coins",
  },
  {
    id: "classroom",
    year: "2020",
    sortYear: 2020,
    kind: "story",
    title: ["Class moved into Azeroth."],
    body: [
      "COVID closed the campus, so the Online Communities class moved inside World of Warcraft — Azeroth as the field site — and Social Media Storytelling ran on Instagram Live, Stories and DMs. Teaching is ",
      { em: "the exit built into a calendar" },
      ": the semester ends, the capability stays.",
    ],
    artefact: "CLASSROOM · AZEROTH",
    // Gazet van Antwerpen ran the classroom first ("Docent gebruikt
    // videospel World of Warcraft als leeromgeving",
    // https://www.gva.be/cnt/dmf20200316_04891563); the plate carries the
    // international piece.
    press: {
      outlet: "MIT Technology Review",
      headline: "Kids are sick of Zoom too — so their teachers are getting creative",
      date: "2020-12-12",
      href: "https://www.technologyreview.com/2020/12/12/1014220/kids-zoom-fatigue-remote-learning-roblox-instagram/",
    },
    wire: "azeroth",
  },
  {
    id: "genai",
    year: "2022",
    sortYear: 2022,
    kind: "story",
    title: ["Then the models arrived."],
    body: [
      "Founded ",
      { mark: "Starhaven" },
      ", one of Belgium's first AI consultancies for the creative industry. AI Captain on Welcome to Latent Land, ",
      { em: "the first hybrid AI-video production in Belgium" },
      "; AI direction on Under Armour's campaign with Anthony Joshua; co-drafted the UBA/ACC AI Charter.",
    ],
    artefact: "LATENT LAND · CHARTER",
    // The film itself: https://www.youtube.com/watch?v=jFVezT4mznU
    press: {
      outlet: "De Tijd",
      headline: "AI is the calculator for the creative mind",
      href: "https://www.tijd.be/ondernemen/technologie/ai-is-een-rekenmachine-voor-de-creatieve-geest/10469709.html",
    },
    wire: "latent",
  },
  {
    id: "loop",
    year: "2024",
    sortYear: 2024,
    kind: "waypoint",
    title: ["Loop Earplugs"],
    // The model vendor is deliberately unnamed — the public-surface
    // convention (`MODEL_FAMILIES` in cases-registry; the bio and the
    // casefile both avoid it).
    body: [
      "Embedded as Lead Creative Technologist on a company-wide AI mandate: the layer grew from 5 to 130+ people, four tools built. The casefile earlier on this page tells it.",
    ],
  },
  {
    id: "thoughtform",
    year: "2025",
    sortYear: 2025,
    kind: "waypoint",
    title: ["Thoughtform"],
    body: [
      "The practice, founded. The same move, run on organisations — with an intelligence in place of a platform.",
    ],
    press: {
      outlet: "HLN",
      headline:
        "Antwerpenaar wil met nieuw bedrijf verzonnen antwoorden van AI gebruiken als creatieve inspiratiebron",
      date: "2025-07-18",
    },
  },
];

/** Plain text of a segment run — what the budgets are measured on. */
export function vwPlain(segments: readonly VwSegment[]): string {
  return segments.map((s) => (typeof s === "string" ? s : "em" in s ? s.em : s.mark)).join("");
}
