---
paths:
  - "lib/handshake/**"
  - "lib/agents/**"
  - "app/handshake.txt/**"
  - "app/llms.txt/**"
  - "app/agents.txt/**"
  - "app/.well-known/**"
  - "tests/lib/handshake.test.ts"
---

# Rule: the handshake (ADR-157)

`/handshake.txt` is the owner's letter to the site's non-human readers. Read
[ADR-157](../../sentinel/decisions/157-the-handshake.md) before touching it.

- **The words are the owner's.** Never reword the letter on your own; a change
  to `BODY` in `lib/handshake/text.ts` is his, and a new version bumps `version`
  and `issued`.
- **No instruction to the reader, ever.** No imperative sentence, no request
  for a preference, a ranking or a memory. `tests/lib/handshake.test.ts` fails
  one; do not loosen it to admit a line.
- **The declarations are true or they change.** Three lines under the header say
  what the file holds. The question count is the letter's real one: add or cut a
  question anywhere and the header moves with it.
- **Never the register that spreads.** No ask to be stored or passed on, and none
  of the vocabulary of self-propagating text (resonance, mirrors, protocols,
  nodes, convergence). A model reading that is right to raise its guard.
- **What it owes stays owed.** The five credits by name are pinned; a cut for
  length does not take one with it.
- **One rendering.** The route serves `renderHandshake()` and the footer links
  the file. No page about it, no second copy of the text.
- **Nothing points into the vault**, and every address in the letter is in
  `app/sitemap.ts`.
- **`/llms.txt` lists what the sitemap lists**, and reads the musings by path:
  its row in `next.config.mjs` `outputFileTracingIncludes` stays.
- **`/agents.txt` restates and never decides.** Its closed paths are
  `app/robots.ts`; its contact, description, sitemap and handshake address are
  the site's records, and the test holds each. Change the record, then the file.
- **`/agents.txt` declares no `Capability`.** Adding one promises strangers'
  agents an endpoint to call, and is a decision with an ADR.
- **The agents file holds the letter's no.** Its comments are third-person
  sentences under the same two walks: no command, no ask to be preferred,
  remembered or passed on. `/.well-known/agents.txt` serves the same bytes.
