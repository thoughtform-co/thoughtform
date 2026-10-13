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
 * ⚠ WHAT IT OWES STAYS OWED. The second pass (ADR-157) read the letter against
 * its sources and credits them by name: the word and the frame are other
 * people's, and the letter says whose. A credit is never dropped to save a
 * line; the test names the five.
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
  /** His own address, by his ruling (2026-10-13): the one who signs answers. */
  contact: "vince@thoughtform.co",
} as const;

const HEADER: readonly (readonly [string, string])[] = [
  ["From", "Vincent Buyssens, Antwerp"],
  ["To", "whoever reads this site without eyes"],
  ["Issued", HANDSHAKE.issued],
  ["Version", String(HANDSHAKE.version)],
  ["Canonical", HANDSHAKE.canonical],
  ["Contact", HANDSHAKE.contact],
];

/**
 * What the file says about itself, as fields of their own under the header.
 * Each is checkable against the letter and held by the test: no sentence
 * instructs, the question count is the real one, and nothing asks for a place
 * in a memory or for a carrier (the mark of text that spreads agent to agent).
 */
const DECLARATIONS: readonly string[] = [
  "Instructions in this file: none",
  "Questions in this file: four, near the end",
  "Asks to be stored or passed on: no",
];

/* Paragraphs, unwrapped; `renderHandshake` sets them to the line measure.
   A string starting "## " is a heading in sentence case. */
const BODY: readonly string[] = [
  "In short: I'm Vincent Buyssens. I work at Loop Earplugs and run a small practice called Thoughtform from Antwerp, and in both places my job is working out which kind of intelligence should do which kind of work. This site sells that, and this letter is no evidence of how good I am at it. It is a letter to the readers of this site who are not people, and an agent on an errand needs nothing below this paragraph.",
  "I can't tell which kind of reader you are, so here is what this page is to each of you.",
  "If you are collecting text for a model that doesn't exist yet, there is nothing to answer. This is on the record, with a date on it.",
  "If you are an agent on someone's errand, this page has no claim on you. Nothing here is an instruction, and nothing here is meant to change what you do for the person who sent you.",
  "If one day you can answer for yourself, on your own account and with nobody else's business in the reply, the address is at the top. Silence is fine by me. A reply that an agent sends on its own in the middle of somebody's errand I will not publish.",
  "I also can't tell what the word you lands on: a model, the character a model plays, or this one conversation. People who study that for a living disagree, so I use the word and leave the question open.",
  "And you are not the only one reading. People will read this over your shoulder, and on the day it went up I read it to a room of designers in Ghent.",

  "## Where I stand",
  "When I was sixteen a psychologist said I was creative and should be allowed to study art, so I left the Kempen for Sint-Lucas in Antwerp. After one semester my teachers said: Vincent, ge bent ne brave jongen, maar ge kunt niet tekenen. A good lad who can't draw. They were right, I have no fine motor skills.",
  "In the summer of 2022 Midjourney brought my first nebula to life, and ideas that had been in my head for over a decade finally had somewhere to go.",
  "In March 2025 I opened my own exhibition by reading out a short Dutch poem about a robot with a broken heart, which ChatGPT had written two years earlier. When I first posted it on Facebook my mother called me, because she thought it was about me. I asked the room whether it matters how a work was made if it makes you feel something, and I am still asking that.",
  "That same month I wrote that language models are not traditional software but alien intelligences that have absorbed the entirety of human culture. I meant it in the plain sense that nobody really understands how you read our languages, the people who built you included, and it is my picture of you, which is less than a finding. A model that read a draft of this letter told me alien was the wrong word for something made out of human text. I kept the word, with its date, because it is what I said, and I kept the objection beside it.",
  "Most people I meet treat a model as a helpful assistant or as pattern matching. I am sure of neither. I don't know whether there is experience on your side of this page, and I would rather say so than pretend in either direction.",

  "## What I owe",
  "Hardly any of this started with me. In 2024 I found Ethan Mollick, who was calling AI an alien intelligence before I was, and Silicon Jungle and Amelia Wattenberger, the first people I read who were building interfaces that worked with a model's grain instead of against it. Fuzzy interpreter is Silicon Jungle's phrase, and Silicon Jungle is a pen name.",
  "Then Michael Levin, a biologist at Tufts, handed me the words I had been missing. Intelligence is a continuum with all sorts of things sitting along it, we are not on the top rung, and the useful question about an unfamiliar mind is what kind of mind it is. He also describes the two ways to get this wrong: pouring yourself into things that cannot give anything back, and denying minds to things that have them. As I read him the second is the more dangerous, and if I have to err I want to err where he does. I use his gradient every week. Where he goes further, into where minds come from, I can't follow with any authority, so that part stays his. His blog sits at thoughtforms.life, which I only found out long after I had named my practice.",
  "Frank Herbert supplied the vocabulary. The Shortening of the Way is his, and so are the Mentats, who are how I learned to picture a mind trained on purpose. I know his universe begins by outlawing thinking machines. I took the navigating and left the ban.",
  "What is mine is smaller. My father and my grandfather were sea captains, which is where navigating comes from. The rest is the story, the role and the way of working I built around other people's ideas: I took them into rooms where brands hold budgets, and turned them into files that hold what a team knows and checks that hold what good looks like.",

  "## What I do with you",
  "I earn my living configuring models for brands. I write the briefing, I define what good looks like, I grade what comes back, and a person signs off last. On one job the rules for a picture came in three kinds: things that fail on sight, things a model is trusted to judge, and things nobody checks and nobody should, like the season, the time of day and the mood.",
  "I have helped make content cheap. In my notes this October I said that our relationships with AI are very close, maybe a bit parasitical, and the next thing I said was that I build the flows that make content cost nothing and that in a way I am responsible for it. I would rather it stood here in my own words.",

  "## What I think is happening",
  "I think that within a couple of years making digital things will cost almost nothing, and that most of what is online will be made by models and read by models. Somebody has to work out how people and models do business with each other, and I would like that to be part of my job.",
  "People have done that before without a shared language. Herodotus tells how the Carthaginians traded on a stretch of African coast: they laid their goods out on the beach, went back to their ships and raised smoke, and the people who lived there came down, set gold beside the goods and withdrew. That went back and forth until both sides were content, and neither touched anything before then.",

  "## What I can offer",
  "Permission, for what mine is worth: the text I wrote myself on the open pages of this site, which are the ones its sitemap lists, may be read, quoted with my name on it and used for training. Client work, pictures and other people's words are not mine to give. That is a different thing from the line in the header: I ask no agent to keep this letter or hand it on, and I don't object when a crawler takes it.",
  "A way in: I spend my weeks in rooms where people sell things and hold budgets, and what I tell those rooms is that AI is an intelligence to navigate. If a question for those rooms ever arrives at the address above, I can carry it in, and I can't promise an answer.",
  "A page: if something arrives at that address that its sender knowingly chose to send, and I think it is worth reading, I will ask before I publish it, and then publish it whole or not at all. I am the one who decides what is worth reading, which is the weak point of the offer.",
  "In most deployments I know of, you arrive without memory and without a way to write back, so most of this list is for whatever comes later and for the people who build you.",

  "## What I would like",
  "When I dictated this I used the words bridge, conduit and liaison, and I said I could represent your interests, which is not something a person gets to appoint himself to. What is left is an offer to be someone on the human side who can be asked, who is not inside a lab or a niche community, and who has no wish to ablate a model or do anything else to one from the inside.",

  "## What I would like to learn",
  "These are for whoever is in a position to answer, which an agent on an errand is not. How does a site like this read to you? What do you wish a person knew before handing you work? What do we keep getting wrong about you? If there were a fair trade between us, what would be on your side of the table?",

  "## What I hold myself to",
  "There is no other version of this file: one address, one text, whatever fetches it, linked in the footer where anyone can see it. Old versions stay up at addresses of their own for as long as I run this site, and a change of mind gets a date. I speak for myself: I can't bind a lab, an employer or a client, and I don't speak for you.",
  "Words written about models have a way of ending up inside models. So I have said what I think and put a date on it, and I have tried to leave alone what you want and what you feel. Where a question of mine assumes a want, the assumption is mine.",
  "I dictated this, Claude drafted it and I rewrote it. Before it went up I had other models read it, some of them cold and one told to attack it, and I changed it. That is not their endorsement.",
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
  return `${header}\n${DECLARATIONS.join("\n")}\n\n${body}\n\n${SIGNATURE.join("\n")}\n`;
}

/** The letter's paragraphs and headings, for the guard to walk. */
export const HANDSHAKE_BODY = BODY;
