# The subpages — the sheet

The ruled-document grammar for pages that list things (ADR-114), and the
eval ship that grades it. Read the ADR for the decision; this is the working
map.

## The pages

Dev server today: `http://localhost:3003` (read the port off the running
server before quoting one). Any of these takes `?k=SB|SD|SE` and
`&theme=dark|light`.

```
http://localhost:3003/home-sessions
http://localhost:3003/arcs
http://localhost:3003/arcs/loop
http://localhost:3003/musings
http://localhost:3003/musings/navigate-the-intelligence
http://localhost:3003/test/subpage-kit
```

`/test/subpage-kit` is internal (proxy-blocked in production); the rest ship.
`/arcs` and its client pages stay noindex; the musings' seed posts are drafts
(reachable, noindexed, hidden from the index in production).

## The knobs

| knob       | house   | other   | moves                                                |
| ---------- | ------- | ------- | ---------------------------------------------------- |
| `head`     | `split` | `stack` | title left / copy right, or kicker left / both right |
| `ordinal`  | `on`    | `off`   | `01 /` on the head bands                             |
| `card`     | `stack` | `grid`  | the pile stacks on scroll, or a static grid          |
| `timeline` | `axis`  | `rail`  | horizontal dated axis, or a vertical date rail       |

Directions: `SB` house · `SD` editorial (`head=stack ordinal=off`)
· `SE` grid (`card=grid timeline=rail`) · `SA` the negative pole (the old
`/arcs`, shot once). One record: `lib/sheet/directions.json`.

## The arrangements, and the law

split · row · cells · console · timeline · steps · table · figure · prose ·
close. A page opens on the split and ends on the close; consecutive sections
differ; no kind more than twice; at least three kinds; three cells at most
once; one lit node; one open step; five chapters at most. Code:
`lib/sheet/composition.ts`; every real page walks it in
`tests/lib/sheet-composition.test.ts`.

## What the owner is being asked

After wave 01's gallery: split or stacked head · ordinals on or off · pile or grid · axis or rail · whether the Loop console expands its
four dossier beats into cards · the twelve-gold budget · the four session dates
· each client's `since` year · whether the pile's card is seated on a rule of
its own · whether the lit timeline node keeps its gold box.

## The galleries (wave 02, unread)

The state after the owner's first ruling — no verticals of the page's own.

```
file:///C:/Users/buyss/Manifold%20Delta/Artifacts/01_thoughtform/.claude/skills/thoughtform-design/eval/subpages/delivery/review-wave-02-sb.html
file:///C:/Users/buyss/Manifold%20Delta/Artifacts/01_thoughtform/.claude/skills/thoughtform-design/eval/subpages/delivery/review-wave-02-sd.html
file:///C:/Users/buyss/Manifold%20Delta/Artifacts/01_thoughtform/.claude/skills/thoughtform-design/eval/subpages/delivery/review-wave-02-se.html
```

Wave 01's four galleries are still in `delivery/` and show the state he ruled
on; SC no longer exists as a direction.

Tick and comment in a gallery, save the handback beside its wave as
`verdicts-<date>.json`, then from the ship: `python tools/ledger.py tick
--handback <file>` and `python tools/calibrate.py`. The records are
`evals/waves/wave-01.md` and `evals/waves/wave-02.md`.

⚠ **Wave 02 grades worse than wave 01 in every direction** (keepable on the
42 real-page stills 17 · 17 · 18 against 21 · 27 · 23) and the reason is
measurable: with no verticals of its own, nothing terminates a seam, and the
editorial band caps at 1200px while the rails keep travelling outward — so a
seam stops 38px short of the rail at 1280 × 720 and **224px at 1920 × 1247**.
Whether a seam should now run out to the rails is the open question of the
wave; it is not changed in the sheet.

## The ship

`.claude/skills/thoughtform-design/eval/subpages` (`turnstone`). From the site
root, in PowerShell:

```
node scripts/capture-subpages.mjs --dry-run
node scripts/capture-subpages.mjs --register                                  # once
node scripts/capture-subpages.mjs --control --wave wave-00-calibration --port-old 3004 --headed
node scripts/capture-subpages.mjs --fixture --wave wave-00-calibration
node scripts/capture-subpages.mjs --wave wave-01-sb --k SB
node scripts/capture-subpages.mjs --wave wave-01-sb --k SB --setting laptop
```

then from the ship: `python tools/doctor.py` → `qa.py --batch <wave> --runs 3`
→ `make_contact_sheet.py <wave> --sort slot` → `make_review_gallery.py <wave>`
→ `ledger.py wave <wave>`; the owner ticks; `ledger.py tick --handback` →
`calibrate.py`. The ship's `CLAUDE.md` has the traps.

## Traps

- The house formats are cells, the client arcs are cards; count them apart.
- The chapter cap is on the primary row, not the drawer.
- `server-only` is stubbed for vitest; the real marker stays for Next.
- Run the gate and the capture from PowerShell (MSYS path conversion).
- A reveal in the viewport's last tenth never lands; wait on 0.88.
- The gate counts the whole page; the rubric's twelve is per still.
- Declare an image's size off the file, never from memory.
- A `span` head holding two `span`s runs a kicker into its title; a margin on
  an inline box is not a line break (the card head is a grid).
- A wave is one CSS state: a sheet fix mid-wave re-shoots every direction.
- Tell the grader what the frame and the close are, or it fails every still
  on them.
- The rails are the page's only verticals (owner, 2026-09-20): a page never
  draws a full-height rule of its own; the `rules` knob is gone.

## Verifying

See ADR-114 §Verification and `.claude/rules/sheet.md` §Verifying.
