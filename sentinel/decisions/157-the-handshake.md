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

## What is not built

- **No `<link rel="alternate">` in the layout.** The plan had one; an alternate is another
  representation of the page that carries it, and the letter is not an alternate of every
  page. The index and the sitemap are the discovery path.
- **No reply endpoint.** An address. A form that publishes what agents submit is a
  moderation surface, and its own decision.
- **No human page.** See above: one rendering.

## Verification

- `tests/lib/handshake.test.ts`: no instruction; the header fields are the record's and the
  route serves the module's text whole; linked in the footer and the sitemap, with no page
  beside it; the copy law, plain ASCII and the line measure; only public addresses and no
  vault name; `/llms.txt` names it and lists only what the sitemap lists.
- After a deploy: fetch both files from the live origin with a browser and with the
  `ClaudeBot` and `GPTBot` user agents, to confirm nothing in front of the site blocks them.

## Left open

- The words. Listed for the owner as his or not his: the permission to read, quote and
  train on the site's own writing is a proposal, as are the publish-whole-or-not-at-all
  promise and the closing line.
- The contact is the site's public address; he may want another.
- The footer row's label and column are his to place; a still goes to him before it ships.
