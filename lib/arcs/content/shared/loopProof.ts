import type { ArcSectionOf } from "../../types";

/**
 * LOOP, BY REFERENCE: the proposals' part one and the About (hoisted from
 * `pandora-proposal.ts` when the X-Bionic proposal became their second
 * reader, 2026-10-08). One record, so the Loop beats and the portrait
 * cannot drift between two proposals. A page that needs a different
 * eyebrow or title spreads the object and overrides that key only.
 */

export const LOOP_IN_PRACTICE: ArcSectionOf<"interstitial"> = {
  /* PART ONE IS SURI'S OPENING (owner, 2026-09-28: the "four things we
       do" head and its paragraph were "a regression from the core one").
       The callout is `suri-proposal`'s own line; its subline drops Suri's
       "in the order it happened", because the cards below follow the
       pile's order, which is not the calendar's. */
  id: "in-practice",
  kind: "interstitial",
  variant: "callout",
  menuLabel: "In practice",
  menuPrimary: true,
  eyebrow: "Part one · Loop, 2024 to now",
  line: {
    pre: "In 2024, Loop's executive team decided the company would be",
    em: "AI-first.",
  },
  subline:
    "Creative operations was the biggest immediate win, so it became the first focus. What follows is what that decision produced.",
};

/* ⚠ THE FOUR PROOF BEATS ARE THE HOMEPAGE'S OWN FOLDER CARDS, AT REST
     (ADR-128 Phase B): one Loop project a beat, in the pile's order, the
     card lettering the arc line as its title and Loop's own claims beneath.
     No head on any of them — the card is the head — and the Part one
     callout above says why they are here. Phase A drew the same four as
     `films` · a head over the `heimdall` dossier · `sheets` ·
     `intelligence`; the record is the same, the housing is the one the
     owner is "really happy with". */
export const LOOP_PROOF_CARDS: readonly ArcSectionOf<"proof-card">[] = [
  {
    id: "practice-frontier",
    kind: "proof-card",
    menuLabel: "Films",
    track: "atl-films",
    title: "We pushed the frontiers of AI creative",
  },
  {
    id: "practice-tools",
    kind: "proof-card",
    menuLabel: "Tools",
    track: "tooling",
    title: "We built the tools the work needed",
  },
  {
    id: "practice-studio",
    kind: "proof-card",
    menuLabel: "Studio",
    track: "studio",
    title: "We made the creative team self-sufficient",
  },
  {
    id: "practice-layer",
    kind: "proof-card",
    menuLabel: "The layer",
    track: "ai-transformation",
    title: "We built the layer the agents run on",
  },
];

export const LOOP_RETURN: ArcSectionOf<"crew"> = {
  /* WHAT IT RETURNED AT LOOP (ADR-133 U5, owner 2026-09-29): back beside
       the proof cards it comes from, read left to right, "just a super
       clear visualization of what's now been possible because of this".
       One row per role: who, then what is possible now, drawn as the
       quantity it is and said in one line. Rob's four points; the fourth is
       creative strategy on Mímir's briefing division (the month's forecast
       divided into briefs across partner and format). The only figures are
       Loop's spoken, printable ones. */
  id: "return",
  kind: "crew",
  menuLabel: "The return",
  head: {
    eyebrow: "Loop · what it returned",
    title: { pre: "What it returned", em: "at Loop." },
    sub: "Each role at Loop, the workstream it runs, and what is possible now.",
  },
  rows: [
    /* ⚠ `result` IS THE ROW AS A RETURN (the proposal system, 2026-10-10,
       `layout: "returns"`): the same four facts in the job's vocabulary, a
       value, a line, a tally where the number is a count. Every figure is
       the row's own; a count the record does not give is not drawn (700 is
       too many segments; the briefing's split is a glyph count, not a
       filed figure). */
    {
      id: "assets",
      who: "Two designers and a copywriter",
      work: "Paid social",
      line: "About 700 assets a month",
      output: { kind: "field", count: 700 },
      result: {
        value: "~700",
        line: "Paid social assets a month, from two designers and a copywriter.",
      },
    },
    {
      id: "copy",
      who: "The PMs",
      work: "Copy",
      line: "Filled in by the PMs, checked by one copy editor",
      output: { kind: "funnel", lines: 12 },
      result: {
        value: "1 editor",
        line: "The copy is filled in by the PMs themselves; one copy editor checks all of it.",
      },
    },
    {
      id: "review",
      who: "The head of design",
      work: "Review",
      line: "About ten times less review by hand",
      output: { kind: "tenfold" },
      result: {
        value: "10×",
        line: "About ten times less review by hand for the head of design.",
        tally: [{ of: 10, lit: 1 }],
      },
    },
    {
      id: "strategy",
      who: "Creative strategy",
      work: "Briefing",
      line: "The ad count, divided across partners and formats",
      output: { kind: "split", parts: 6 },
      result: {
        value: "By brief",
        line: "The month's ad count arrives divided across partners and formats, as briefs.",
      },
    },
  ],
  alt: "What it returned at Loop, each role beside the workstream it runs. Two designers and a copywriter, paid social: about 700 assets a month. The PMs, copy: filled in by the PMs, checked by one copy editor. The head of design, review: about ten times less review by hand. Creative strategy, briefing: the ad count, divided across partners and formats.",
};

export const VINCE_ABOUT: ArcSectionOf<"portrait"> = {
  /* THE ABOUT, THE HOMEPAGE'S OWN (ADR-133 U5, owner 2026-09-29: "with
       Rob removed, I would just repurpose the About section from our
       homepage, with my picture on the right side and the text on the left
       side, so it becomes uniform"). The homepage's words and portrait, as
       they stand there. Rob advises in the background and is named in the
       covering email, not on the page. */
  id: "people",
  kind: "portrait",
  layout: "orbit",
  menuLabel: "Who does it",
  ariaLabel: "About Vince Buyssens",
  head: {
    eyebrow: "Thoughtform · who does the work",
    title: { pre: "Vince Buyssens" },
    sub: "Creative technologist · Founder · AI adoption",
  },
  image: { src: "/images/vince-portrait.jpg", alt: "Vince Buyssens, founder of Thoughtform" },
  bio: [
    "Vince has been navigating the tides of digital change for over a decade: social media, online communities, now intelligence itself.",
    "AI is different: it isn't software to command, but an intelligence to navigate. Through Thoughtform, he helps teams build that relationship, mapping the fit between their work and the intelligence available.",
    "He runs the same practice inside Loop Earplugs, leading AI adoption: advising leadership, embedding with teams, building the tools behind the marketing engine.",
  ],
  meta: [
    { label: "Base", value: "Antwerp · BE" },
    { label: "Practice", value: "10+ yrs" },
    { label: "Also at", value: "Loop Earplugs" },
  ],
};
