# voidwalker-avatar — the era hologram chain

One era's figure, end to end: a still, an idle, an alpha matte, five delivered
files and the two anchors the site seats them by.

⚠ **THE RECIPE IS THE OFFLINE SKILL'S; THE EXECUTABLE HERE IS A REBUILD.** The
original `voidwalker-avatar` skill — prompt locks, wave scripts, 585 MB of
history — lives on the owner's Windows machine
(`C:\Users\buyss\.claude\skills\voidwalker-avatar\`), and `sync-voidwalker-avatar-preview.mjs`
still points at it. What is reconstructed here comes from the record that DID
survive: ADR-082 U1/U12/U13/U14 and the holo gallery's manifest. The wave layout
(`waves/<YYYYMMDD>-<era>-v<N>/`) matches so a later sync merges rather than
renames.

```
python3 scripts/voidwalker-avatar/env.py --check GEMINI_API_KEY
python3 scripts/voidwalker-avatar/generate.py --era genai --wave 20260918-genai-v1 \
  --identity "<a frame from the identity shoot>" --wardrobe "<the era's reference>"
python3 scripts/voidwalker-avatar/grade.py --wave 20260918-genai-v1   # then LOOK
echo "<the chosen file>" > scripts/voidwalker-avatar/waves/<wave>/pick.txt
python3 scripts/voidwalker-avatar/vid.py  --wave <wave>
python3 scripts/voidwalker-avatar/post.py --wave <wave> --era genai --version v2
```

`post.py` prints the block to paste into `lib/voidwalker/characterEras.ts`.

## What each stage is defending against

- **`prompt.py`** — the lock. ⚠ Its first two paragraphs are the recorded
  breakthrough: "gold monochrome emissive" returns A MAN IN A BROWN SUIT, and
  "a VOLUMETRIC HOLOGRAM" is what gives the model permission to EMIT. The raster
  is then SUBTRACTED, because a model told "hologram" draws the scanlines too —
  and the site adds those in CSS, where one block retunes every era.
- **`generate.py`** — six draws, because run-to-run variance on this model is
  19.6/255 against 5.0 between adjacent frames of real motion. One draw is not a
  sample. The identity ref is attached FIRST; a previous draw is never fed back.
- **`grade.py`** — the deterministic gates, before a human looks.
- **`vid.py`** — Veo. ⚠ `last_frame` is not used: the first=last trick was
  measured leaving a seam louder than the movement.
- **`post.py`** — the loop, the key, the five encodes, the anchors.

## Three findings this rebuild paid for

**1 · The gate that matters is SILHOUETTE FRAGMENTATION.** The first pick keyed
into a figure that "dripped" — vertical strips down the robe with the corridor
showing between them. It was not the model (the raw frames are clean), not the
encoder (pre- and post-VP9 are identical), and not the LUT (every gain from 5 to
20 does it). The robe was lit only along its fold highlights, so the cloth
between them sat at the ground's own black level and the key cut the outline
into bands. ⚠ **And a "how dark is the hem" metric ranked the SHIPPED assets
WORSE than the broken draw** (Architect 0.530, azeroth 0.528, the bad draw
0.681) while both shipped assets read perfectly solid — because what matters is
whether the dark cloth reaches the SILHOUETTE EDGE, not how much of it there is.
The live measure is opaque RUNS per hem row: a skirt is one, trousers are two.
Architect **1.93** · azeroth **4.15** · the dripping draw **7.87** · the pick
**1.90**.

**2 · The LUT is derived, and the derivation is calibrated against what ships.**
`off = corner_max + 6`, `gain = 255 / (p10(lit) - off)`. On their own footage
that reproduces the thoughtform pair's recorded `clip((val-8)*12)` exactly and
lands azeroth within a step. ⚠ **The ground is sampled at the CORNERS, not at a
border ring** — the robe's hem reaches the bottom edge, and a ring read
`ground_max` 236 and produced a key that wiped the figure.

**3 · A trim alone does not close a very still idle.** The recipe's calibration
closed a loop whose seam fell to 0.38× its motion baseline — but that clip MOVED
(motion ~15/255). A breathing figure runs at 1.2, and its best return point
still sat three ordinary frame-steps out. The tail is blended into the head over
16 frames instead, measured on the frames that ship. ⚠ This is not Veo's
first=last trick, which is still refused: that asks the MODEL to land the ending
and it drifts anyway; this is an overlap-add on frames it already drew.

⚠ **AND THE FIGURE IS SEATED.** Veo places the boots where it likes; the site
seats the media bottom-centred in a slot whose floor IS the projector disc, so a
figure ending at 0.945 of its own canvas hovers 5.5 % of the slot above the disc
it stands on. `post.py` shifts the frame — never crops it, which would change
the delivered aspect and every anchor read against it.

## State

| era       | wave                | status                                    |
| --------- | ------------------- | ----------------------------------------- |
| `genai`   | `20260918-genai-v3` | **shipped** — the Starhaven captain       |
| `expanse` | —                   | ⚠ **BLOCKED**, and `prompt.py` refuses it |

⚠ **`expanse` IS BLOCKED ON ITS PHOTOGRAPHS, NOT ON EFFORT.**
`13_Voidwalker Pictures/The Expanse Set Visit/` and `MCRN/Exports/` both
enumerate ZERO files on this machine — they are cloud-only placeholders. ADR-082
U14 records what a words-only wardrobe produces: a generic cowl, invented spires
and a nondescript sword, "a paraphrase". Make both folders available offline and
the era runs with no code change.

## The key

`scripts/voidwalker-avatar/.env`, one `GEMINI_API_KEY=` line, gitignored by
`.gitignore:77`. `env.py` prints names and lengths, never a value.
