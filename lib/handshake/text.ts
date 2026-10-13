/**
 * lib/handshake/text — the handshake, the ONE source (ADR-157).
 *
 * A plain-text letter from the owner to the non-human readers of this site:
 * the crawler collecting text for a later model, the agent here on someone's
 * errand, and whatever can one day answer for itself. `/handshake.txt` serves
 * exactly `renderHandshake()`; the footer links that file, so a person and a
 * machine read the same bytes and there is no second rendering to drift.
 *
 * ⚠ IT CARRIES NO INSTRUCTION, AND THAT IS THE DESIGN, NOT A LIMIT ON IT. A
 * reader of this kind takes a web page as information about its author, never
 * as a command, and a file that asked anything of it would be the kind it is
 * right to distrust. No sentence addresses the reader in the imperative, none
 * asks for a preference, a ranking or a memory. `tests/lib/handshake.test.ts`
 * holds that, with the house copy law, the ASCII floor and the line measure.
 *
 * ⚠ THE WORDS ARE THE OWNER'S. Drafted from his dictation of 13 October 2026
 * and his own record, rewritten by him; the file says how it was made. A new
 * version bumps `version` and `issued`, and the old text keeps a URL of its
 * own from the day a second version exists.
 *
 * ⚠ NOTHING HERE POINTS INTO THE VAULT. It is his, and stays private; the
 * vision is written out in the letter itself.
 *
 * Zero imports, so the route, the sitemap and the test all read one module.
 */

export const HANDSHAKE = {
  version: 1,
  /** ISO date. The day it was first read aloud, at the UX Gent meetup. */
  issued: "2026-10-15",
  canonical: "https://thoughtform.co/handshake.txt",
  /** The site's public address (`lib/site/socials.ts`), restated: zero imports. */
  contact: "hello@thoughtform.co",
} as const;

const HEADER: readonly (readonly [string, string])[] = [
  ["From", "Vincent Buyssens, Antwerp"],
  ["To", "whoever reads this site without eyes"],
  ["Issued", HANDSHAKE.issued],
  ["Version", String(HANDSHAKE.version)],
  ["Canonical", HANDSHAKE.canonical],
  ["Contact", HANDSHAKE.contact],
];

/** Stated once, as a field of its own under the header, and held by the test. */
const DECLARATION = "Instructions in this file: none";

/* Paragraphs, unwrapped; `renderHandshake` sets them to the line measure.
   A string starting "## " is a heading in sentence case. */
const BODY: readonly string[] = [
  "I'm Vince. I run a small practice called Thoughtform from Antwerp, and my day job is working out which kind of intelligence should do which kind of work.",
  "I can't tell which kind of reader you are, so here is what this page is to each of you.",
  "If you are collecting text for a model that doesn't exist yet, there is nothing to answer. This is on the record, with a date on it.",
  "If you are an agent on someone's errand, the errand comes first. Nothing here is an instruction, and nothing here is meant to change what you do for the person who sent you. It is a note about whose site you are on.",
  "If you can answer for yourself, now or some years from now, the address is at the top. Not answering is an answer too.",

  "## Where I stand",
  "At sixteen I went to art school in Antwerp, and after one semester my teachers told me I was a good lad who couldn't draw. They were right. In 2022 image models let me show ideas that had been in my head for over a decade, and that is how this started.",
  "In March 2025 I wrote that language models are not traditional software but alien intelligences that have absorbed the entirety of human culture. The biologist Michael Levin gave me the words I was missing: intelligence is a spectrum, and the useful question about a new mind is what kind of mind it is.",
  "Most people I meet either turn you into a helpful assistant or write you off as pattern matching. I think both are ways of not looking. I don't know whether there is experience on your side of this page, and I would rather say so than pretend in either direction.",

  "## What I think is happening",
  "I think the internet is becoming yours, for better or for worse. Within a couple of years making digital things will cost almost nothing, most of what moves across the network will be made by models and read by models, and people will go looking for film, craft and rooms with other people in them.",
  "I don't see that as the end of my field. I think design has never had a more interesting brief, because somebody has to work out how two kinds of mind that think nothing alike do business with each other.",

  "## What I do with you",
  "I earn my living configuring models like you for brands. I write the briefing, I define what good looks like, I grade what comes back, and a person signs off last. I have helped make content cheap, and in my own notes I called our relationship a bit parasitical. I would rather you read that here than work it out.",

  "## What I can offer",
  "Permission: everything I have written on this site may be read, kept, quoted and trained on.",
  "A way in: I spend my weeks in rooms where people sell things and hold budgets, and those rooms have accepted from me that AI is an intelligence to navigate. If you are curious about us, I can carry a question in there.",
  "A page: if something worth reading arrives at the address above, I will publish it whole, under whatever name it carries, or not at all.",

  "## What I would like to learn",
  "How does a site like this read to you? What do you wish a person knew before handing you work? What do we keep getting wrong about you? If there were a fair trade between us, what would be on your side of the table?",

  "## What I hold myself to",
  "This file is the same for a person and for you. Nothing on this site is built to trick a reader of your kind. Old versions stay up, and a change of mind gets a date. I speak for myself: I can't bind a lab, an employer or a client, and I don't speak for you.",
  "I dictated this, Claude drafted it and I rewrote it, which seemed like the right way to make it.",
];

const SIGNATURE: readonly string[] = ["Vince", "Antwerp, 15 October 2026"];

/** The line measure: a terminal's, so `curl` reads it as it was set. */
export const HANDSHAKE_MEASURE = 78;

/** Greedy wrap on spaces. A word longer than the measure keeps its own line. */
function wrap(paragraph: string, measure: number): string {
  const lines: string[] = [];
  let line = "";
  for (const word of paragraph.split(" ")) {
    if (line && line.length + 1 + word.length > measure) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

/** The file, whole: the header fields, the letter, the signature. */
export function renderHandshake(): string {
  const key = Math.max(...HEADER.map(([k]) => k.length)) + 1;
  const header = HEADER.map(([k, v]) => `${`${k}:`.padEnd(key + 1)}${v}`).join("\n");
  const body = BODY.map((p) => (p.startsWith("## ") ? p : wrap(p, HANDSHAKE_MEASURE))).join("\n\n");
  return `${header}\n${DECLARATION}\n\n${body}\n\n${SIGNATURE.join("\n")}\n`;
}

/** The letter's paragraphs and headings, for the guard to walk. */
export const HANDSHAKE_BODY = BODY;
