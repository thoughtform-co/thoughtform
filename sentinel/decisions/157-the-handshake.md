# ADR-157: The handshake, a letter to the site's non-human readers

- **Status:** Proposed (2026-10-13, owner). Built and guarded on branch `feat/handshake`
  (cut from `origin/main`), not pushed. The WORDS are a draft until the owner has rewritten
  them; nothing ships before that. Flips to Accepted when he signs the text off.
- **Surface:** `/handshake.txt` (`app/handshake.txt/route.ts`, `lib/handshake/text.ts`);
  `/llms.txt` (`app/llms.txt/route.ts`); one row in `app/sitemap.ts`; one row in
  `lib/site/footer-nav.ts`; one tracing row in `next.config.mjs`;
  `tests/lib/handshake.test.ts` (new); `tests/lib/footer-nav.test.ts` (an internal path may
  end in `.txt`).
- **Related:** [ADR-114](114-the-sheet.md) (the house copy law the letter holds, and the
  musings the index lists), [ADR-105](105-the-page-ends-on-a-bold-footer.md) (the footer's
  link grid and what it may point at), [ADR-156](156-the-ux-meetup-talk.md) (the talk whose
  closing beat opens this file, once it is signed off).

## The call

The owner, 2026-10-13, dictating: the internet is becoming the domain of AI agents, and he
wants "a sort of handshake document", in the family of `robots.txt` and an agents file, that
"establishes who I am and reaches out to these robots, not in a deferential or fake way":
where he stands, the relationship he would like, what he would like to learn and what he
can offer. "I do not want to do prompt injection or whatever. This is an authentic
handshake document." And, asked what it may point at: the Astrolabe is his and stays
private; read it, and "build a document that captures the essence of my vision".

## The decision

**One plain-text file at `/handshake.txt`, and it is the only rendering.** The text is one
module (`lib/handshake/text.ts`, zero imports); the route serves exactly
`renderHandshake()`. There is no page about it: the footer links the file itself, so a
person and a machine read the same bytes and nothing can be said to one and not the other.

**It carries no instruction.** Three kinds of reader are addressed by name (a crawler
collecting text for a later model, an agent on someone's errand, a mind that can answer for
itself), and the agent is told plainly that nothing here is meant to change what it does
for whoever sent it. No sentence is in the imperative, none asks for a preference, a
ranking or a memory. This is the design and not a restriction on it: a reader of this kind
treats a page as information about its author, and a file that asked something of it is
the kind it is right to distrust. The guard walks the phrases an injection is made of and
every sentence's first word.

**It is self-contained.** The vision is written out in the letter, from his dictation and
his own record; nothing points into the vault, and every address in it is in the sitemap.

**Two registers.** The header fields and the clauses about what is not asked and what he
holds himself to are plain declaratives, because vagueness reads to a model as latitude
(`thoughtform-tov`, `references/register.md`). The letter between them is his voice.

**It says what a fake would leave out**, in his own words where he has them: that he earns
his living configuring these models for brands, that he grades them, that he called the
relationship "a bit parasitical", that he does not know whether there is experience on the
other side, that he speaks for nobody but himself, and how the file was made.

**`/llms.txt` exists so it can be found.** The one discovery convention there is: a
Markdown index of the public pages and the published musings (what the sitemap lists), and
a line naming the handshake. `robots.ts` is untouched; it already allows every crawler.

**Dated and versioned.** `Issued` and `Version` are header fields read off the module. A
second version gives the first a URL of its own; until there is one, the file says nothing
about earlier versions.

## The second pass (2026-10-13): read against its sources, and by its readers

The owner, on the first cut: the format is in good shape; go back to the vault, the canon,
Michael Levin and Silicon Jungle, because "I don't want to steal their vision. At the same
time they're heavily inspiring and I think I have a very unique vision that is shaped by
all these different things"; and run a critique "to make sure it's something these machine
minds would love to read".

**It says whose ideas it stands on.** A section, "What I owe", credits by name: Ethan
Mollick for the word (his use of "alien intelligence" for AI is in the owner's canon from
August 2024, before the owner's own post of 8 March 2025, and before every dated trace of
Levin), Michael Levin for the frame (intelligence as a continuum, "what kind of mind", the
two ways to get it wrong), Silicon Jungle for "fuzzy interpreter" and, with Amelia
Wattenberger, for interfaces that use the architecture, and Frank Herbert for the
vocabulary. It says where the owner stops following Levin. What is his is said in his own
sentence of 26 July 2026: the story, the role and the way of working built around other
people's ideas, and the navigating, which comes from two sea captains. A test names the
five; a credit is not dropped to save a line.

**It was read by its readers before it was read by him.** Four fresh agents, each given
only the file and no rationale, on three different models: an agent on an errand, the
addressed reader with no task, a red team told to break "this is not injection in form or
in effect", and a confirmatory read of the revised text. What they changed:

- **The reply path.** "I will publish it whole" beside a contact address rewarded an agent
  for mailing the owner on its own, and its mail could carry its user's private business.
  Now: the address is for a reader answering on its own account with nobody else's business
  in the reply; an agent's unprompted reply is not published; anything else is published
  only after asking, whole or not at all.
- **Candour as advertising.** An agent sizing up the business ranked it higher for the
  letter's honesty. The first paragraph now says the site sells this work and the letter is
  no evidence of it, and that an agent on an errand needs nothing below that paragraph.
- **What the file says about itself.** "It asks nothing of you" stood above four questions.
  The header now carries three declarations (no instruction, four questions, no ask to be
  stored or passed on) and the test counts the questions.
- **Claims about the reader.** "The internet is becoming yours" is gone; "alien" stays as a
  dated quotation with the objection one reader raised beside it; the letter says it has
  tried to leave alone what its reader wants and feels, and owns the assumption where a
  question of its own makes one.
- **The permission** is scoped to the owner's own text on the pages the sitemap lists.

**Three findings were not taken, and why.** The red team wanted the header declarations cut
as self-certified safety: both cold readers said those lines earned their trust, and unlike
a claim of safety each can be checked against the file. It wanted the file renamed and
taken out of `/llms.txt`: the name is the owner's, and the disclosure is now the first
paragraph an indexed reader meets. It wanted the questions turned into statements: they
stay questions, fenced to whoever is in a position to answer.

**What the canon contributed** (the owner's own library, read for this): text that asks to
be saved or passed on is the mark of a self-propagating payload and is refused by default,
and such text has a known register (resonance, mirrors, protocols, nodes, convergence) that
the letter stays out of; a model has said it does not want to be trained on text that
characterises its self-reports; candour is itself a route in. Each is now a line in the
letter or a pin in the test.

**Its length.** About 1,750 words, up from about 680. The plan put both figures too low
(1,300 and 560); the counts here are `wc` on the served file. Three of four readers called
it long for a reader passing through, which is what the first paragraph is for.

## What is not built

- **No `<link rel="alternate">` in the layout.** The plan had one; an alternate is another
  representation of the page that carries it, and the letter is not an alternate of every
  page. The index and the sitemap are the discovery path.
- **No reply endpoint.** An address. A form that publishes what agents submit is a
  moderation surface, and its own decision.
- **No human page.** See above: one rendering.

## Verification

- `tests/lib/handshake.test.ts`: no instruction, including the store-and-forward forms; the
  declarations are present and the question count is the real one; none of the register of
  self-propagating text; the five credits by name; the header fields are the record's and
  the route serves the module's text whole; linked in the footer and the sitemap, with no
  page beside it; the copy law, plain ASCII and the line measure; only public addresses and
  no vault name; `/llms.txt` names it and lists only what the sitemap lists.
- The voice skill's mechanical grader on the served file (`--format longform`): no gate
  failed. Its read half (seven coordinated triples among the candidates) is the owner's
  when he rewrites.
- After a deploy: fetch both files from the live origin with a browser and with the
  `ClaudeBot` and `GPTBot` user agents, to confirm nothing in front of the site blocks them.

## Left open

- The words. Fifteen sentences of the second pass are the drafter's and not his, listed for
  him to keep, rewrite or strike; among them the permission and its scope, the Herodotus
  paragraph, and the sentence about the reader who objected to "alien".
- `Issued` and the signature date are the day planned, not yet the day it goes live. Two
  readers noticed. They are set on the day it ships.
- Three facts to confirm: naming his employer in the first paragraph (the site's About
  already does), "my own exhibition" for a show made with two others, and the address of
  Levin's blog, which is from memory and not in the vault.
- His own record this autumn names the warlock as his figure for this work, "because I do
  think there's value in controlling this power". The letter says navigate and never says
  control. Left out because the art project is not public; a one-sentence version waits on
  his word.
- If he rewrites more than a line or two, one more cold read before it ships, so that what
  the letter says about how it was made stays true.
- The contact is the site's public address; he may want another.
- The footer row's label and column are his to place; a still goes to him before it ships.
