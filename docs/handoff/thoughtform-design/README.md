# Thoughtform design: resume on another Claude account

Snapshot 2026-10-12. Written because the claude.ai project "Thoughtform Design"
(its threads and project memory) lives on one account and does not travel. This
folder is the bridge. Read this file only; open the other two when you need them.

## Resume in four steps

1. Open this repo (`C:\Users\buyss\Manifold Delta\Artifacts\01_thoughtform`) in
   Claude Code on the other account and run `/resume-thoughtform-design`.
2. Read [threads.md](threads.md). Pick the thread Vince names; do not pick one
   up on your own.
3. Check the state is still true: `git worktree list`, `git log -3 <branch>`,
   and curl the port before quoting a URL. This snapshot ages fast.
4. Account setup differs per profile: [accounts.md](accounts.md).

Do NOT load `CLAUDE.md`'s ADR index, `sentinel/`, `.claude/rules/` or the
design-rulings memories into a new design task. ~450 KB of house rulings is why
new work kept regressing into plates, consoles and 10px labels.

## How work is run (the protocol)

- **One integration branch:** `lab/xb-offer-rebuild`, served on **3003** from the
  main checkout. Nothing is on `main`. Merging to main waits for Vince's yes
  (thoughtform.co deploys from main).
- **Every other task gets its own git worktree, branch and port** (3012+). Never
  edit the main checkout from a side task, never restart 3003, never `git stash`,
  commit with `git commit -- <paths>`.
- **Second dev server:** in the worktree, copy `.env` + `.env.local` from the
  main tree, then `PORT=<port> npx next dev --webpack -p <port>`. Never
  `npm run dev` there (its predev kills 3003).
- **Bringing work to 3003:** the owner of `lab/xb-offer-rebuild` takes a side
  branch file by file (a full merge drags main's commits over files open in the
  tree), then tells Vince it is live on 3003.
- **Push** `git push -u origin <branch>`. A 403 means the wrong `gh` account:
  `gh auth switch --user thoughtform-co`.
- **Report** every page as a full URL on its own line, port off the running
  server: `http://localhost:3003/arcs/x-bionic/proposal`.

## Vince's design rules (the short list)

1. **Start from the brief and his references**, in a self-contained folder
   importing nothing from arcs, landing or other labs. Brand through tokens only:
   `#0A0908` void, `#EBE3D6` dawn, Tensor gold `#CAA554`, PP Neue Montreal (sans),
   PT Mono (chrome).
2. **One section at a time.** Two or three variations of one section, shown as
   stills at 1280×720 and 1470×830, he picks on sight, then the next section.
   Never rebuild a whole page from one brain dump.
3. **Iterate from the variant he picked.** Diff against its still; pay for new
   content by cutting, never by shrinking air, gaps or type.
4. **Change only what was asked.** "Port X" means mount X's own component, never
   a redraw in its style. If "what we have now" is ambiguous, ask which block.
5. **Simple is a ceiling.** First cut = fewest objects, one line each.
6. **Drawing board = new compositions** from his references, not old figures in
   a new material.
7. **Colour on surfaces, not lines.** A gold border on every frame stood out
   too much; a low-alpha wash on the bands that bracket content reads as one part.
8. **No flashing motion.** No luminance flicker; reveals are a centre-out
   aperture or a short fade.
9. **Judge by eye at his viewport (~1920×1247)**; "fits without clipping" is a
   check, not the quality he picked.
10. **His Loom/feedback videos** are read with the `thoughtform:cdaf` skill
    (`cdaf.mjs read` first, then `generate --profile feedback`), filed under
    `docs/video-reads/`.

## Root causes behind the regressions (2026-10-10 → 12)

- Too much context loaded by default (the 149 KB CLAUDE.md, unscoped rule
  files, a memory index full of surface rulings). Fix in flight on
  `chore/context-cleanup` (awaiting his yes).
- Building inside the arc shell's stylesheet chain instead of a clean folder.
- Reading references through the house's own summary of them instead of the
  sites themselves.
- Adapting instead of porting, and reading asks wider than asked.
- Shrinking air to make new content fit.

The full memory (154 files) is shared already on this machine: see
[accounts.md](accounts.md#memory).
