# /test/interface-kit — the lab

The design grid, and the proof panel recomposed on it. Two views on one root,
nine knobs, ten named directions. Nothing on the landing changes; there is no
flag. A winner is promoted with ADR-091 and the losers are deleted with their
guards (ADR-070 U35).

**The measurement this is built on:** `ANALYSIS.md`.
**The graded wave:**
`.claude/skills/thoughtform-design/eval/armada/evals/waves/2026-09-05-kit-01.md`.

## The URLs

The dev server takes a free port when 3003 is busy, so read the port off the
running server rather than trusting these. At 3003:

```
http://localhost:3003/test/interface-kit?view=sheet
http://localhost:3003/test/interface-kit?view=panel&k=KJ
http://localhost:3003/test/interface-kit?view=panel&mount=shipped
```

`?view=sheet` is the design grid — every rule drawn once, at the size it ships
at, reading only `--ik-*`. `?view=panel` is the casefile recomposed from its own
production leaves in the real HUD frame. `mount=shipped` renders the untouched
`ServicesCasefile`: the control every candidate is judged beside.

## The knobs

Read once from the URL, written back as `data-ik-*` on the lab root. **The first
value of every knob is production untouched**, which is what makes `KA` a control
rather than a preference.

| knob       | values                | what the non-default does                                                    |
| ---------- | --------------------- | ---------------------------------------------------------------------------- |
| `grid`     | hidden · ruled        | draws the rail's rungs and the column split as page rules the panel lands on |
| `line`     | house · single        | the last gold off the structure: row glyphs and station diamonds go to dawn  |
| `track`    | wide · tight          | eleven rungs collapse toward one base at `.06em`                             |
| `weight`   | bold · regular        | 30 bold nodes to none; emphasis moves to ink                                 |
| `case`     | upper · sentence      | uppercase reserved for mono chrome                                           |
| `accent`   | house · budget        | 200 gold objects to a handful; the estate goes dawn                          |
| `material` | glass · flat          | no bloom, no second blur, no glow on the active row                          |
| `lip`      | gold · dawn           | the housing's edge as a device, or as software on the screen                 |
| `tab`      | fill · line · outline | three ways to mark the open station                                          |

Plus `?k=<direction>` (seeds the whole set), `?theme=`, `?mount=`, `?view=`,
`?row=`, `?console=0`.

## The directions

|        |                 | asks                                                                        |
| ------ | --------------- | --------------------------------------------------------------------------- |
| KA     | House           | does the recomposition read as the shipped panel?                           |
| KB     | Seated          | does drawing the sheet's rules make the panel a region rather than a card?  |
| KC     | Track tight     | does one dominant rung give the chrome a base to depart from?               |
| KD     | Weight regular  | does the hierarchy hold with nothing above 500?                             |
| KE     | Case sentence   | does sentence case give case something to say?                              |
| KF     | Accent budget   | does gold on the wayfinding marks alone still say where the reader is?      |
| KG     | Material flat   | does the housing survive losing its atmosphere?                             |
| KH     | Station line    | does a 1px line carry selection without a fill?                             |
| KI     | Station outline | does an outline carry selection without a fill?                             |
| **KJ** | **Composite**   | **all of it at once, with the machined gold lip kept — the recommendation** |

## Rulings this pass asks

1. **Sentence-case display.** Both references set display type in sentence case,
   and one of them sets it in this house's own face. The casefile's title and its
   four register claims are uppercase today. This is a brand-level change, which
   is why it ships as a knob rather than a fix.
2. **Mono at 400 only.** PT Mono ships one weight in the Figma library and the
   rule wants a 500 ceiling anyway. Does anything on this surface still need to
   be bold?
3. **The estate in dawn.** `accent=budget` takes twenty gold cartridges to dawn
   line-work. Does the map still read? ⚠ It cannot keep gold on the _selected_
   one — one token strokes both states — so this ruling implies a second token in
   `pda.css` if the answer is "the open stream should stay gold".
4. **The lip.** Kept gold in the composite, because a housing is the machined
   device a screen is set into and that edge is the identity. `lip=dawn` is the
   other reading: the panel as software drawn on the frame's screen.
5. **The seat.** `grid=ruled` makes the frame's own ladder visible behind the
   panel. Is that structure, or is it decoration? The references draw seven times
   more of these lines than we do.
6. **The station, a third time.** ADR-089 U3 made it a box and U4 filled the open
   one, after U2's flat wash was rejected as too much fill. `line` and `outline`
   keep the box and spend no area. ⚠ They differ from each other by one 1px bar,
   which is worth knowing before reading the stills at thumbnail size.
7. **The glow.** The active directory row carries an 18px halo and the brief
   title a text-shadow, against a shape law that says no glows. `material=flat`
   removes both.
8. **"Dashboard".** Sixty naive reads of this panel, and not one said instrument,
   console or control panel. Is that acceptable, or is it the thing to fix next?

## Traps

- ⚠ **`.ik-proof-stage` is `position: relative`, never `absolute; inset: 0`.** An
  absolutely positioned child resolves against the containing block's PADDING
  box, so an absolute stage inside the station box hands `.fl-case` a containing
  block starting at zero and the panel sits one whole `--hud-content-inset` too
  far outboard — 145px, laid out correctly, painting cleanly. **The
  KA-versus-control parity gate passed the entire time**, because both stills were
  rendered inside the same wrong box: a parity check between two things broken the
  same way reports parity. The capture asks the layout law now instead.
- ⚠ **A custom property is a string until something lays it out.**
  `--instrument-inset` is a `calc()` of three clamps; `getPropertyValue` returns
  the expression and `parseFloat` returns NaN, which coerces to 0 and makes a
  check agree with itself below the instrument tier and disagree above it.
  Resolve through a probe element.
- ⚠ **`will-change: transform` on a ladder wrapper makes it a containing block.**
  Every seated piece carries its own `data-fl-panel`; `.fl-left` deliberately
  carries none.
- ⚠ **`--fl-t*` resolve only against the real `.hud__rail`** — hence the server
  component and `sliceV7Sections([])`. Without it the record column's three zones
  collapse to `top: 0` with no error.
- ⚠ **`theme.css` must load after the other production sheets**, or `?theme=light`
  is a fiction. Theme comes from `?theme=`, never `colorScheme`.
- ⚠ **`reducedMotion: "no-preference"` in every capture.** Under PRM the casefile
  is a static document.

## Verifying

```bash
node scripts/capture-interface-kit.mjs --wave <name>
```

66 stills, the probe's own numbers per cell, and five control gates: the type
floor, the two-face rule, zero radius, `--ik-t0` equal to `--fl-t0`, and the seat.
⚠ **Only the CONTROL can fail it.** A direction failing a gate is the finding —
a capture that refuses to write a still because the still is interesting has
confused itself with the rubric.

Then, from `.claude/skills/thoughtform-design/eval/armada`:

```bash
python tools/doctor.py
python tools/qa.py --batch ../waves/<name> --runs 3
python tools/make_contact_sheet.py ../waves/<name> --sort type
python tools/pick.py ../waves/<name>
python tools/make_review_gallery.py ../waves/<name>
```

The wave's pixels are gitignored and rebuild from a URL in about nine minutes.
The six control stills are committed, because a baseline that can move is not a
baseline.
