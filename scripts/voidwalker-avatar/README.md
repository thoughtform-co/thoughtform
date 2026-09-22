# voidwalker-avatar — the era hologram chain

One era's figure, end to end: a still, an idle, an alpha matte, five delivered
files and the two anchors the site seats them by.

⚠ **THE RECIPE IS THE OFFLINE SKILL'S; THE EXECUTABLE HERE IS A REBUILD.** The
original `voidwalker-avatar` skill — prompt locks, wave scripts, 585 MB of
history — lives on the owner's Windows machine
(`C:\Users\buyss\.claude\skills\voidwalker-avatar\`). What is reconstructed here
comes from the record that DID survive: ADR-082 U1/U12/U13/U14 and the holo
gallery's manifest. The wave layout (`waves/<YYYYMMDD>-<era>-v<N>/`) matches, and
`sync-voidwalker-avatar-preview.mjs` mirrors BOTH trees into the gallery — never
a wave's `refs/` (other people's faces) and never a blind sheet's `*-key.json`.

## Two routes, and which one an era takes

**One step (`--stage still`) — the original.** The image model draws the era as
"a volumetric hologram" on black; Veo animates it; a luma key cuts it. It shipped
`genai-v2` and `expanse-v1`, and it is what the owner read as "too glowing": a
luma key needs black cloth OVER-LIT to survive, so the model lights the cloth
until it glows. Measured on the deep interior, those two sit at p75 luma
172 and 170 against the Architect's ~103.

**Two steps (`--stage plate`) — ADR-082 U31: grade the light, code the screen.**
The Architect was made in two steps (a photoreal colour still, then a restyle
into gold), which is why he reads as a gold-toned photograph. So the model now
draws the man in FULL COLOUR on a flat `#0A28D2` ground — identity, wardrobe,
pose — and `gold.py` does the gold deterministically, on a curve and a ramp
measured off the Architect himself. The key is a chroma key, so the cloth no
longer has to glow to stay in the picture.

```
python scripts/voidwalker-avatar/env.py --check GEMINI_API_KEY      # name + length only
python scripts/voidwalker-avatar/gold.py --selftest                 # free; G0's blind pair
python scripts/voidwalker-avatar/refs.py --era genai --wave <wave>  # crops + refs.json, then LOOK
python scripts/voidwalker-avatar/generate.py --era genai --wave <wave> --stage plate --dry-run
python scripts/voidwalker-avatar/generate.py --era genai --wave <wave> --stage plate
python scripts/voidwalker-avatar/grade.py --wave <wave> --stage plate   # gates + a gold preview each
python scripts/voidwalker-avatar/sheet.py --wave <wave>                 # the blind pick sheet
# ONE change to a picked plate, into a NEW wave (its plates/ are the edits, so grade + sheet read them):
python scripts/voidwalker-avatar/generate.py --era expanse --wave <new-wave> --stage edit --source <plate.png> [--design <photo> ...]
# the picked plate -> an 8s idle on the ground (paid), then route B's key + gold, per frame:
python scripts/voidwalker-avatar/vid.py --wave <wave> --stage plate --era expanse --still <plate.png>
python scripts/voidwalker-avatar/post.py --wave <wave> --era expanse --version v2 --matte ground --clip <plate-stem>.raw.mp4
```

⚠ `sheet.py`'s face finder is a skin-colour blob, and the rifle edit's brick-red
foregrip is skin-coloured enough to win: on an edit wave the face zoom can land
on the rifle. Crop the face yourself before calling a likeness.

The owner's gates are the clock: **G0** the blind pair (is this grade the
Architect's look?), **G1** the plate pick (is it him?), **G2** the idle, **G3**
the install.

## What each stage is defending against

- **`env.py`** — reads `GEMINI_API_KEY` from the ONE canonical key file the
  practice shares (`…\Arcs_In The Pocket\projects\20260820-ai-readiness\skill\scripts\.env`),
  or `VOIDWALKER_ENV_FILE` when set. ⚠ Never copy the key here: a second copy is
  a second thing to rotate. It loads only the names it uses, prints names and
  lengths only, and a missing or refused key STOPS the run — no fallback.
- **`prompt.py`** — the locks. The plate locks name no artist, show or studio;
  a look is described by its properties (a medium, a light, a lens). The
  one-step style block's first two paragraphs are the recorded breakthrough for
  THAT route ("a volumetric hologram" is what gave the model permission to emit).
- **`generate.py`** — six draws, because run-to-run variance on this model is
  19.6/255 against 5.0 between adjacent frames of real motion. Every reference is
  preceded by an `IMAGE n — ROLE` label; the key travels in the
  `x-goog-api-key` header, never the URL; every draw writes a prompt sidecar.
  A plate wave refuses references nobody has looked at (`refs.json` `looked`).
- **`gold.py`** — the grade: the Architect's measured curve and ramp (9.3/255
  held out on his true outline, against the model's own 19.6 self-disagreement),
  his measured bloom, and the exposure gate.
- **`grade.py`** — the deterministic gates, before a human looks.
- **`vid.py`** — Veo. ⚠ `last_frame` is not used: the first=last trick was
  measured leaving a seam louder than the movement.
- **`post.py`** — the loop, the key, the five encodes, the anchors.

## Findings this chain paid for

**1 · Silhouette fragmentation is the one-step route's failure.** A robe lit
only along its fold highlights keys into vertical strips. The measure is opaque
RUNS per hem row: Architect **1.93** · azeroth **4.15** · a dripping draw
**7.87**. A "how dark is the hem" metric ranked the shipped assets WORSE than the
broken draw, because what matters is whether dark cloth reaches the SILHOUETTE
EDGE.

**2 · The luma-key LUT is derived** (`off = corner_max + 6`,
`gain = 255 / (p10(lit) − off)`) and sampled at the CORNERS — a border ring read
the hem and produced a key that wiped the figure.

**3 · A trim alone does not close a very still idle**; the tail is blended into
the head, measured on the frames that ship.

**4 · The Architect's edge is not darker than his interior** (ADR-082 U31). A
first measure said it was — against the restyle's OWN luma matte, whose boundary
sits in the glow. Against his true outline the edge matches the interior; what
he has is a highlight-weighted outer BLOOM (12.5 luma off the face, 2.3 off the
trousers), which `gold.py` reproduces.

⚠ **THE FIGURE IS SEATED.** The site seats the media bottom-centred on the
projector disc, so a figure ending above the canvas floor hovers. `post.py`
shifts the frame — never crops it.

## State

| era          | wave                  | status                                                      |
| ------------ | --------------------- | ----------------------------------------------------------- |
| `genai`      | `20260918-genai-v3`   | shipped (one-step, `-v2`) — re-cut on the two-step route    |
| `expanse`    | `20260918-expanse-v1` | shipped (one-step) — re-cut kneeling, on the two-step route |
| `azeroth`    | offline `v5-blender`  | shipped `-v11` (v10 seated 33 rows, `reseat_azeroth.py`)    |
| `pokemon-go` | —                     | **blocked** until the owner's photograph lands              |

⚠ **THE REFUSAL STAYS.** An era without a photograph hits `BLOCKED` and stops:
ADR-082 U14 measured what a words-only wardrobe produces.

⚠ **`waves/` IS GITIGNORED, AND `refs/` IS NEVER MIRRORED.** A wave's references
are crops of the owner's photographs and of the people beside him in them; the
sync script excludes `refs/` by name and `public/_previews` is in
`.vercelignore`.
