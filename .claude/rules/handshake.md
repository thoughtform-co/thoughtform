---
paths:
  - "lib/handshake/**"
  - "app/handshake.txt/**"
  - "app/llms.txt/**"
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
- **One rendering.** The route serves `renderHandshake()` and the footer links
  the file. No page about it, no second copy of the text.
- **Nothing points into the vault**, and every address in the letter is in
  `app/sitemap.ts`.
- **`/llms.txt` lists what the sitemap lists**, and reads the musings by path:
  its row in `next.config.mjs` `outputFileTracingIncludes` stays.
