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
# or a SCENE (ADR-082 U33): the plate as first AND last frame, the end dissolved onto frame 0
python scripts/voidwalker-avatar/vid.py --wave <wave> --stage plate --era expanse --scene
python scripts/voidwalker-avatar/post.py --wave <wave> --era expanse --version v3 --matte ground --clip <plate-stem>.scene.raw.mp4 --loop settle
# ...and if it will not settle, the same take cut in a HELD beat and played back and forth
python scripts/voidwalker-avatar/post.py ... --loop pingpong --cut <frame in the hold>
# ADR-082 U34: a NEW POSE is an edit of the picked plate, and a parted mouth is fixed on the plate
python scripts/voidwalker-avatar/generate.py --era expanse --wave <wave> --stage edit --edit-kind command --source <plate F>
python scripts/voidwalker-avatar/generate.py --era expanse --wave <wave> --stage edit --edit-kind mouth --source <the picked command plate>
# ADR-082 U35: a SCENE TO A DRAWN END POSE — draw the pose first, then run the plate to it
python scripts/voidwalker-avatar/generate.py --era expanse --wave <wave> --stage edit --edit-kind aim-stand --source <the mouth plate>
python scripts/voidwalker-avatar/vid.py --wave <wave> --stage plate --era expanse --scene --ending aim --last <the picked aimstand plate>
# ...and only if the spoken beat is refused: he LISTENS at the earpiece instead (lips closed, one nod)
python scripts/voidwalker-avatar/vid.py ... --scene --ending aim --last <aimstand> --listen
# ADR-082 U41: HIS FACE PUT BACK on a picked plate, the identity crops ATTACHED (the edit stage
# never attached them, which is how four edits drifted the Expanse's face into a stranger's)
python scripts/voidwalker-avatar/refs.py --era expanse --wave <wave> --set face      # the three identity crops alone; LOOK, then --looked
python scripts/voidwalker-avatar/generate.py --era expanse --wave <wave> --stage edit --edit-kind face --source <the picked plate> --draws 3
python scripts/voidwalker-avatar/generate.py ... --edit-kind face --model gpt --draws 3   # GPT Image 2, the identity-rescue lane
python scripts/voidwalker-avatar/grade.py --wave <wave> --stage plate && python scripts/voidwalker-avatar/sheet.py --wave <wave>   # + heads.jpg
# every LATER edit in a wave that holds identity crops attaches them too (aim-stand, command, mouth, rifle)
```

⚠ **AN EDIT ATTACHES THE IDENTITY CROPS OR IT DRIFTS (U41).** The Expanse's face
went plate → rifle → command → mouth → aim-stand, and every one of those edits
saw only the plate it was editing — a photocopy of a photocopy — until the
owner read the shipped figure as not him. The v8 face wave measured the two
lanes: Gemini's three face edits either barely moved the face or redrew the
frame (a cyan ground, a frontal glare, K1 off the lock); GPT Image 2's three put
his face back — the brow, the hollows, the chin beard, the jaw — with the pose,
the rifle, the armour and the ground untouched to the pixel. So `generate.py`
attaches the wave's identity crops on EVERY edit kind now (`plate_refs`), tells
a non-face edit first that his face stays exactly theirs, and takes `--model
gpt` on any edit. ⚠ `gpt-image-2` refuses `input_fidelity`; the bare retry
carries it. ⚠ The face is also said in WORDS (`FACE_LOCK`), read off the
photographs — "close-trimmed, connected" let the model keep a full even beard
across the cheeks; the shoot shows a dense chin beard and near-clean cheeks
(`identity-map.md` corrected the same day).

⚠ **A SPOKEN BEAT IS MOUTHED, NEVER VOICED (U35).** The commander's scene has
him press the earpiece and give an order. After U34's five audio refusals the
order is MOUTHED under directed near-silence, on a plate whose lips are closed at
frame zero — that passed. `--listen` swaps the order for a listening beat and
is the recorded fallback; the stem gets `-listen` so the two takes never
overwrite each other. ⚠ **"A ZOMBIE" IS SLOW BLINKS**: v4's lids lowered three
times for ~0.7 s, so the scene asks for eyes open and alert with normal quick
blinks and bans slow blinks, drooping lids and eyes closing BY NAME in the
prompt and the negative.

⚠ **A PLATE WITH A PARTED MOUTH CANNOT BE ANIMATED IN SILENCE (U34).** Veo
starts ON the plate and always draws a soundtrack; a man caught mid-word gets a
voice, and the audio filter refuses the clip ("an issue with the audio for your
prompt", uncharged). The commander's first plate was refused five times — plain
wording, a directed near-silence, physical-only verbs, the prop wording, and a
"his lips stay closed" clause. A first frame outranks a sentence: `--edit-kind
mouth` closes the lips and changes nothing else (silhouette IoU 0.998 against
its source), and the idle rendered on the first try. Look at the MOUTH before a
plate goes to video.

⚠ **A HAND GIVEN A MOTION OF ITS OWN BECOMES A GESTURE (U34).** Told the pointing
hand "moves forward a finger's width … and settles back", Veo swung the forearm
upright into a raised index finger from 1.25 s to 4.5 s — the reach fell 0.890 →
0.81 of the canvas. The re-take gives the hand no motion and bans the upturned
finger by name; it held 7.3 s. Judge a held pose by TRACKING it (the hand's
reach and height per frame), not by a strip of eight frames, which can land on
both ends of a gesture and look held.

⚠ **THE GROUND IS THE ERA'S, NOT ALWAYS BLUE (U33, `grounds.py`).** Blue is the
default because it is gold's and skin's complement. It is the wrong key for a
wardrobe that carries blue: the 2016 trainer's navy vest keys at α 0.27 on it and
his jeans at 0.78 (`gold.py --selftest` prints both). He stands on MAGENTA, whose
key `min(R, B) − G` leaves every colour he wears opaque. One table feeds the
prompt's words and the key's arithmetic, so they cannot disagree.

⚠ **A CEL MUST BE DRAWN IN A DEEP PALETTE.** The Architect's curve lifts
mid-tones hard (photo luma 70 lands near 155), so a bright flat-colour figure
arrives above his band at every exposure the chain allows. The plate preview is
graded at the exposure `post.py` will solve, so the sheet shows the real risk.

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
- **`vid.py`** — Veo. ⚠ `last_frame` is not used for an IDLE: the first=last
  trick was measured leaving a seam louder than the movement. A SCENE
  (`--scene`) is the one exception — an action that big cannot come home by
  luck — and it is written to HOLD at both ends so the drift can be dissolved.
- **`post.py`** — the loop, the key, the five encodes, the anchors. ⚠ `settle`
  is gated on the HELD second's motion, never the clip's average (an action
  inflates that until anything passes). ⚠ The outer 4px are repainted with the
  ground before the key, so a muzzle that reaches an edge would be CUT there,
  cleanly — any ink within 6px of a wall is reported as a problem.

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
seat line (the projector disc's top until ADR-082 U35 deleted the disc; the
seat box is still there), so a figure ending above the canvas floor hovers.
`post.py` shifts the frame — never crops it.

## State

| era          | wave                     | status                                                   |
| ------------ | ------------------------ | -------------------------------------------------------- |
| `genai`      | `20260918-genai-v3`      | shipped (one-step, `-v2`) — re-cut on the two-step route |
| `expanse`    | `20260922-expanse-v7`    | the commander performs (U35): point → order → aim, `-v5` |
| `azeroth`    | offline `v5-blender`     | shipped `-v11` (v10 seated 33 rows, `reseat_azeroth.py`) |
| `pokemon-go` | `20260922-pokemon-go-v1` | the trainer as a cel, on magenta (U33), `-v1`            |

⚠ **THE REFUSAL STAYS, EMPTY.** An era without a photograph hits `BLOCKED` and
stops: ADR-082 U14 measured what a words-only wardrobe produces. 2016 left it by
the owner's own brief — an invented costume drawn as a cel, the likeness still
locked by photographs — not because the rule changed.

⚠ **`waves/` IS GITIGNORED, AND `refs/` IS NEVER MIRRORED.** A wave's references
are crops of the owner's photographs and of the people beside him in them; the
sync script excludes `refs/` by name and `public/_previews` is in
`.vercelignore`.
