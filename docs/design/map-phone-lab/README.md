# /test/map-phone-lab — the map card on a phone

Look-dev for the proof card _We built the layer the agents run on_ at phone
size (2026-09-25, owner: _"On mobile it just looks like a lot of text and a
lot of frames … a super simplified, mobile-friendly version of our work,
configuration and layer … make a test page and some designs"_). He chose three
directions to build (the dial was declined). **Nothing on the landing
changed**, and there is no ADR until a direction wins (the BOARD-archetype and
config-lab precedent); promotion is an ADR-107 update.

```
http://localhost:3003/test/map-phone-lab
```

`/test/*` is proxy-blocked in production, so there is no thoughtform.co URL.
Read the port off the running server; 3003 is the default.

## The page

- **Board mode** (the default, on a desktop): one iframe per column at the
  frame's real size, all four on one reading, with pickers for the reading,
  the frame, the theme and the stream. Iframes because the phone rules are
  media queries and the casefile tokens resolve on `vw` / `svh`: a desktop
  page cannot render them.
- **Solo mode** (`?solo=1&v=&r=&preset=&theme=&sel=`): one phone document —
  the pile's four earlier cards as head bands, the map card's field sheet
  built from production's own classes (`.pf-stack--split`, `ProofCard`'s
  record panels, `ConsoleRail` in the tabs slot), and the direction in the
  bay. `shipped` mounts production's own field (`PdaPhoneReadings`), so the
  baseline is the live card, not a copy.

## The four columns

| id        | name         | thesis                                                                                                                                                                                                      |
| --------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shipped` | What ships   | ADR-107 U2: three lists keyed on the rail — the index, every configured stream with its three answers, the five shapes with every Skill.                                                                    |
| `pick`    | One stream   | One thing per reading, tied by one picked stream: WORK a 4×5 field of state tiles, CONFIGURATION that stream as a spine (owner, card, three answers) with a stepper, LAYER five bars sized by their Skills. |
| `rows`    | Readout rows | The framed-key travel-data grammar and nothing else: departments with their marks, a stepper and four answers, five shapes as runs of Skill ticks with the open one's sentence.                             |
| `deck`    | Swipe deck   | One object per swipe on a sideways snap track, one lit segment for the position: a card per department, per stream, per shape (over its own physics field).                                                 |

## What every direction keeps

- **It fits the bay with no inner scroll** at the binding bay, 310 × 323 at
  390 × 681 (the ring and pile rung's floor, and the CI proxy for the
  toolbar-shown iPhone).
- **It letters only the record.** Every string is declared in `models.ts`'s
  `lettering()`, and `tests/lib/map-phone-lab.test.tsx` walks every stream ×
  reading (420 declarations) under the map's envelope
  (`tests/lib/helpers/mapEnvelope.ts`, shared with `pda-phone-readings`), the
  ordinal ban and the teams ban — then renders each direction and checks
  every text node and accessible name against its declaration. A lab page is
  outside every content scanner; a string a component composes for itself is
  the `8 TEAMS` defect (ADR-070 U15) waiting to happen.
- **One selected stream is the persistent object** across the three readings
  (ADR-069 at phone size): picked in WORK, drawn in CONFIGURATION, lit in
  LAYER.
- **Gold is wayfinding, green is the human alone.** The configured mark is
  gold (the desktop cartridge's `StateMark` grammar); the owner is the one
  green value.
- **PT Mono for chrome, PP Neue Montreal for prose**; labels ≥ 10px, prose
  ≥ 12px, interactive targets ≥ 44px (which is why Readout rows' WORK is
  read-only at 32px rows).
- **RUNS IN never says a value twice** — production letters _Scheduled agent ·
  Scheduled agent_ on three streams; the lab drops the interface where it
  repeats the agent.

## The baseline (`shipped`, the findings ledger)

Inner scroll is how far the bay's own list scrolls past its height; a run is
one element of text. Identical in dark and light.

| frame     | bay       | WORK           | CONFIGURATION     | LAYER          |
| --------- | --------- | -------------- | ----------------- | -------------- |
| 390 × 681 | 310 × 323 | 638px, 72 runs | 2,075px, 219 runs | 443px, 66 runs |
| 390 × 844 | 310 × 486 | 475px, 72 runs | 1,912px, 219 runs | 280px, 66 runs |
| 430 × 932 | 346 × 573 | 388px, 72 runs | 1,643px, 206 runs | 175px, 66 runs |

CONFIGURATION is four to seven bays of list inside one card. All three
directions fit every bay with no inner scroll.

Measured in every frame and theme: the foot sentence sets at **9.5px**, and
the configured mark is **green** (`rgb(126, 159, 102)` dark, `rgb(63, 90,
46)` light), the colour this site keeps for the person.

## Strings on one screen

The unit test prints the count at the default stream (W-017) and holds a
ceiling two above it, sized on LAYER for the largest shape:

| direction    | WORK | CONFIGURATION | LAYER |
| ------------ | ---- | ------------- | ----- |
| One stream   | 23   | 14            | 18    |
| Readout rows | 8    | 9             | 18    |
| Swipe deck   | 6    | 14            | 12    |

(The deck letters every card into its track; its count is per card.)

## Promotion notes

- **One stream and Readout rows** are DOM, like the lists they would replace:
  promotion swaps `PdaPhoneReadings`' three lists behind the same `view`,
  keeps the rail, and moves the lab's gates into
  `proof-stack-mobile-smoke`.
- **Swipe deck** puts a sideways snap track inside the vertical pile. Its
  risks are the ones Chromium cannot show: the track needs its own
  `touch-action` against the page's vertical pan, a diagonal gesture lands
  inside the pile's short dwell, the card around it is transformed every
  frame, and iOS arbitrates the two gestures its own way. It needs a device
  read before it can be picked.
- The capture measures the bay from production's CSS, so its numbers hold on
  promotion as long as the pile's split rules do not move.

## For the owner

1. Which direction carries the card — or a mix per reading, which works
   because the three share one selected stream.
2. For the deck: does a sideways swipe inside the moving card feel right
   under a thumb?
3. The configured mark: gold in all three directions, green today.

## Verifying

```bash
npx vitest run tests/lib/map-phone-lab.test.tsx tests/lib/pda-phone-readings.test.ts
node scripts/capture-map-phone-lab.mjs            # every column, reading, frame, theme
node scripts/capture-map-phone-lab.mjs --v pick --r work --presets p681 --themes dark
```

The capture runs against the DEV server (the proxy 404s `/test` in
production) and takes about a minute a cell on a shared one. Its gates, for
the three directions only: no ink outside the bay, no overflow, the type
floors and faces, 44px targets, no page errors. `shipped` is printed as the
ledger above and never fails the run. Stills land here as
`{preset}_{v}_{r}_{theme}.png` with a contact sheet per frame and theme;
**the sheets and `report.json` are committed, the per-cell stills are not**
(they are deterministic renders of a URL — rerun the capture).
