"""
prompt — the PROMPT LOCK, per era.

`IDENTITY_HEADER + ERA_WARDROBE[era] + STYLE_HOLO_EMISSIVE_BLACK + NEGATIVES`,
with the reference order BINDING: slot 1 is the identity photograph, slot 2 is
the wardrobe reference. That order is armada's attach rule and ADR-082 U12's
"identity-map Rule 0"; reversed, the model takes its face from the costume.

⚠ THE DOCTRINE IS "BAKE THE LIGHT, CODE THE SCREEN" (ADR-082 U1). What this
asset carries is identity, wardrobe and gold EMISSIVE LIGHTING on pure black.
Every raster artifact — scanlines, flicker, translucency, the materialize — is
added by the SITE in CSS, and the style block below SUBTRACTS them explicitly.
Three recorded reasons: VP9's 4:2:0 subsampling turns baked 1–2px scanlines
into moiré; an all-black wardrobe vanishes under an additive blend unless the
figure is already LIT; and one CSS block retunes every era where N bakes do not.

⚠ THE FIRST TWO PARAGRAPHS OF THE STYLE BLOCK ARE THE RECORDED BREAKTHROUGH AND
MAY NOT BE COMPRESSED. Asking for "a gold monochrome emissive figure" returned
A MAN IN A BROWN SUIT, over and over; asking for A VOLUMETRIC HOLOGRAM is what
gave the model permission to EMIT. The raster is then subtracted afterwards,
because a model told "hologram" will otherwise draw the scanlines too.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from grounds import KEY_GROUNDS, ground_name  # noqa: E402

STYLE_HOLO_EMISSIVE_BLACK = """
A VOLUMETRIC HOLOGRAM of this man — a body of light standing in a dark
projection volume. Not a photograph of a man, not a costume shoot, not a tinted
picture: he is EMITTING, and the light comes out of him.

ONE HUE. Tensor gold and nothing else — a single emissive ramp running from deep
amber where the light falls off, through warm gold on the planes, to near-white
where the emission is strongest. Highlights may clip to white. NOTHING in this
image is brown, tan, sepia, beige, grey, silver, blue or green. This is not a
brown grade and it is not a duotone laid over a photograph; the gold IS the
light source.

THE GROUND IS EMPTY SPACE. Pure black, #000000, edge to edge. No floor, no wall,
no set, no backdrop, no horizon line, no cast shadow, no reflection under his
feet. The black is nothing, not a dark room.

THE WARDROBE IS LIT, NOT DARK, AND THAT INCLUDES THE PARTS FURTHEST FROM THE
LIGHT. Every black garment reads as gold-lit cloth with visible folds, seams,
edges and material. A black that falls to the value of the background is a HOLE
in the figure, and there are no holes in the figure.

⚠ THE LOWER HALF IS THE ONE THAT FAILS. Light the HEM, the skirt of the robe,
the inside of the cloak and the cloth BETWEEN the fold highlights as fully as
the chest and the shoulders — a fill light from below and behind, not just a key
from the front. The cloth between two bright folds must still be clearly lit
cloth, never a black gap: if the gaps go black, the robe reads as a set of
vertical strips with holes between them instead of as one garment. The darkest
cloth in the whole figure still sits WELL ABOVE the background's black.

SUBTRACT THE RASTER. No scanlines, no scan bands, no horizontal stripes, no
interlacing, no CRT lines, no pixel grid, no dither, no halftone, no noise, no
film grain, no chromatic aberration, no lens flare, no glow, no bloom, no
volumetric light shafts, no haze, no fog, no particles, no floating UI, no HUD,
no text, no logo, no watermark, no vignette, no border, and no second ghost of
the figure. The screen artifacts are added elsewhere. This image is only the
light.

FRAMING. Full body, head to boots, standing, feet down, BOTH FEET ENTIRELY
INSIDE THE FRAME with a band of black beneath them. Vertical, 9:16. Camera at
chest height, straight on, long lens, no perspective distortion. Not a bust, not
a portrait, not a close-up, not a crop.

THE BOOTS LAW. The man may not touch any edge of the frame. A cloak hem, a
plume or a halo MAY run off the edge; the man may not. If he does not fit, make
the figure smaller — never cut him.

IDENTITY. The face, the head shape, the beard, the hairline and the build are
the man in the FIRST reference image, unchanged and recognisable. The SECOND
reference supplies the WARDROBE ONLY — take its garments, never its face.

POSE. Standing at rest. Weight even on both feet, shoulders square, chin level,
arms relaxed at his sides, looking at the camera. Still, not mid-action, not
walking, not gesturing.
""".strip()

NEGATIVES = """
DO NOT PRODUCE: brown, sepia, tan, beige, khaki, a brown suit, a tinted
photograph, a duotone laid on top, grey, silver, blue, green; a studio backdrop,
a grey seamless, a dark room, a floor, a ground shadow; scanlines, CRT lines,
stripes, grain, glow, bloom, haze; text, letters, numbers, a watermark, a
signature; cropped feet, cropped head, a bust, a close-up; two figures, a mirror
image, extra limbs, extra fingers, a helmet or a staff he is not wearing.
""".strip()

IDENTITY_HEADER = """
Use the FIRST reference image for this man's IDENTITY. Every image after it is
the WARDROBE — take the garments from them and never the face. Draw ONE figure:
him, wearing that wardrobe.
""".strip()

ERA_WARDROBE: dict[str, str] = {
    # 2023 · "The AI Captain" · the Starhaven era.
    #
    # Read off the owner's own reference painting rather than paraphrased: a
    # long cloak over a floor-length robe, a plated bandolier, a large round
    # gold disc closing the sash, stacked gold cuffs, medallions on a chain,
    # dark boots, and the ring of gold stars behind the head.
    #
    # ⚠ BARE-HEADED, AND THAT IS THE REFERENCE AGREEING WITH THE IDENTITY. The
    # record's loadout says "cap", which is the uniform's rather than this
    # era's; the reference figure is bald and bearded, and so is he.
    #
    # ⚠ HANDS EMPTY. The reference carries a gold-banded rod at his right side
    # and it is dropped deliberately: ADR-082 U18 measured this frame as
    # WIDTH-BOUND, so the widest pose sets the scale for the whole figure — a
    # held rod costs height off the man exactly as azeroth's gauntlet did.
    "genai": """
WARDROBE — 2023, the AI Captain, in the Starhaven captain's habit exactly as in
the second reference image.

A long black cloak falling from both shoulders over a floor-length black robe. A
black bandolier strap runs from his left shoulder across his chest to his right
hip, set with small rectangular metal plates. A black sash-belt at the waist is
closed by a LARGE ROUND GOLD DISC, and a second round gold boss sits at his
right shoulder. THICK STACKED GOLD CUFFS, three bands deep, on both forearms. A
few small gold medallions on a fine chain at his chest. Dark boots below the
robe's hem.

A HALO OF STARS. A thin ring of small four-pointed gold stars floats behind and
just above his head. It is the one object not attached to him, and it IS part of
the wardrobe — draw it.

He is BARE-HEADED: no cap, no hood, no crown, no helmet. His head is shaved and
he wears a short dark beard, as in the first reference. His hands are EMPTY — he
carries no staff, no rod and no weapon.
""".strip(),
    # 2018 · "The campaign commander" · the Expanse set visit.
    #
    # ⚠ WRITTEN OFF THE OWNER'S OWN SET PHOTOGRAPHS, not off the show. He is
    # wearing the production's MCRN marine armour on the standing set: a matte
    # black hard-shell rig over his own clothes, with a black kilt panel at the
    # waist and his cap still on. The clause names what the PHOTOGRAPHS show —
    # including the cap and the fact that he is in his own trousers under it,
    # because that is what a set visit looks like and it is what makes the
    # plate his rather than a costume render.
    #
    # ⚠ THE ARMOUR IS THE FRAGMENTATION RISK ON THIS ERA. It is near-black
    # segmented plate, which is exactly the material that keys into strips if
    # only its edges are lit (ADR-082 U24). The style block's lit-wardrobe
    # clause does the work; `grade.py`'s runs-per-row gate is what catches it.
    "expanse": """
WARDROBE — 2018, on the set visit, in the armour exactly as in the second
reference image.

A matte black hard-shell armour rig worn over his own dark clothes. A segmented
chest plate of raised geometric panels with a ribbed midsection; rounded shoulder
caps and plated upper arms; articulated forearm gauntlets over knuckled tactical
gloves; a high dark collar at the throat. A BLACK KILT PANEL hangs from the waist
to the knee over dark leggings, and he wears his own low dark boots. Military,
utilitarian, matte and worn — riveted and panelled, never glossy, never chrome,
and not superhero armour.

HE WEARS HIS OWN CAP, the flat dark cap from the first reference image, and NO
HELMET, no hood and no visor. His head and face are bare and fully visible.

He carries NO HELMET. What is in his hands is set by the POSE block below — do
not add a prop this wardrobe does not name.
""".strip(),
}

#: Eras whose wardrobe reference is not on this machine. `run.py` refuses them.
#:
#: ⚠ `expanse` WAS HERE UNTIL 2026-09-18 and is not any more. Its set-visit
#: folders on Drive (`The Expanse Set Visit/`, `MCRN/Exports/`) are genuinely
#: EMPTY — every one of their 38 sibling folders enumerates its contents, so
#: this was never an un-synced placeholder — and the owner supplied the
#: photographs directly instead. The refusal stays in the code because the
#: reason it existed has not changed: ADR-082 U14 measured what a words-only
#: wardrobe produces (a generic cowl, invented spires, a nondescript sword),
#: and the next era without a picture must hit this and stop rather than draw
#: a paraphrase.
#:
#: ⚠ 2016 LEFT THIS LIST BY THE OWNER'S OWN BRIEF, NOT BY A PHOTOGRAPH ARRIVING
#: (ADR-082 U33: "let's just try to create a Pokémon-style version of myself,
#: similar to Ash Ketchum with a hat, but … with my facial features"). The rule
#: above is about a REAL wardrobe drawn from words — a paraphrase of clothes
#: that exist. This one is a COSTUME INVENTED ON PURPOSE, drawn as a cel, and the
#: thing a photograph protects, the likeness, is still locked by photographs.
BLOCKED: dict[str, str] = {}

IDLE_PROMPT = """
The figure BREATHES and nothing else. A slow, even rise and fall of the chest;
the smallest weight shift between the feet; a barely perceptible sway of the
cloak's hem and of the light along it; one slow blink. He stays looking at the
camera.

THE CAMERA DOES NOT MOVE. No pan, no tilt, no dolly, no zoom, no push-in, no
orbit, no handheld drift, no parallax, no rack focus.

HE DOES NOT MOVE FROM HIS SPOT. No step, no turn, no walk, no gesture, no raised
arm, no head turn, no speech.

THE BACKGROUND STAYS PURE BLACK AND EMPTY. Nothing enters the frame. No
particles, no smoke, no light rays, no flicker, no new light source, no change
of exposure. His feet stay exactly where they are; the frame edges stay exactly
where they are.

The image's own look — gold emissive light on black — does not change over the
shot.
""".strip()

#: The idle for an era whose pose is not standing (ADR-082 U26).
#:
#: ⚠ THE SHARED IDLE DESCRIBES A STANDING BREATHER. "The smallest weight shift
#: between the feet" is meaningless on one knee, and "his feet stay exactly
#: where they are" is the wrong invariant when one of them is a planted knee —
#: a model given a clause it cannot satisfy satisfies something else.
ERA_IDLE: dict[str, str] = {
    "expanse": """
The figure BREATHES and nothing else, held in his kneel. A slow, even rise and
fall of the chest and shoulders; once, the fingers at his ear press the earpiece
a little more firmly; one slow blink. He keeps looking off-camera.

THE CAMERA DOES NOT MOVE. No pan, no tilt, no dolly, no zoom, no push-in, no
orbit, no handheld drift, no parallax, no rack focus.

HE DOES NOT STAND UP AND HE DOES NOT SHIFT HIS STANCE. The planted knee stays
on the ground, the forward boot stays flat, the rifle stays VERTICAL exactly
where it is — no sway, no tilt, no lowering, no aiming. No step, no turn, no
rise, no head turn, no speech.

THE BACKGROUND STAYS PURE BLACK AND EMPTY. Nothing enters the frame. No
particles, no smoke, no light rays, no flicker, no new light source, no change
of exposure. The frame edges stay exactly where they are.

The image's own look — gold emissive light on black — does not change over the
shot.
""".strip(),
}


def idle_prompt(era: str | None = None) -> str:
    """The idle clause for an era — its own if it has one, else the shared."""
    return ERA_IDLE.get(era or "", IDLE_PROMPT)


IDLE_NEGATIVE = (
    "camera movement, pan, tilt, zoom, dolly, orbit, handheld shake; walking, "
    "stepping, turning, gesturing, talking; particles, smoke, light rays, "
    "flicker, exposure change; background, floor, set, shadow; text, watermark; "
    "a second figure; the figure leaving the frame; cropped feet"
)


#: Eras whose PERFORMANCE is not the shared standing one (ADR-082 U26).
#:
#: ⚠ AN OVERRIDE, NEVER AN EDIT TO THE SHARED BLOCK. `STYLE_HOLO_EMISSIVE_BLACK`
#: carries FRAMING and POSE for every era at once, and `NEGATIVES` bans the prop
#: class outright ("a helmet or a staff he is not wearing") — so re-posing one
#: era in place re-poses the Starhaven captain with it, silently, in the same
#: run. The override is appended LAST so it is the final word the model reads,
#: and it names what it is replacing rather than hoping to outweigh it.
#:
#: ⚠ AND A NON-STANDING POSE COSTS STATURE, WHICH IS THE SITE'S PROBLEM TOO.
#: The boots law says "if he does not fit, make the figure smaller", and a
#: kneel with a raised rifle is the tallest-and-widest pose there is — so the figure lands shorter
#: in the canvas at the same body scale. `characterEras.ts`'s `stature` field is
#: what carries that across; `post.py` prints the head width it is derived from.
ERA_POSE: dict[str, str] = {
    "expanse": """
POSE — THIS ERA OVERRIDES THE STANDING POSE AND FRAMING ABOVE.

He is DOWN ON ONE KNEE: the right knee planted on the ground, the left foot
flat and forward, the torso upright and turned a few degrees so both knees
read. A commander who has stopped to take a report, not a soldier mid-fight.

His RIGHT hand holds a compact, matte black, panelled carbine UPRIGHT by the
pistol grip, the stock braced against the front of his right hip and the
barrel pointing STRAIGHT UP, inside the line of his shoulders. He is not
aiming, and his finger is outside the trigger guard.

His LEFT hand is raised to his LEFT EAR, two fingers pressing a small earpiece,
the elbow out and level — head level, eyes off-camera, mouth closed, listening.

FRAMING for this pose: the whole kneeling figure, the muzzle to the planted
boot, with a band of black beneath him. He sits LOWER in the frame than a
standing figure would and there is more black above him — that is correct and
must not be closed up by zooming in. Vertical, 9:16, camera at his chest
height, straight on, long lens.

The BOOTS LAW still governs: the rifle and the knee may not touch a side wall.
If the kneel does not fit, make the whole figure smaller — never crop the man
and never tip the weapon outward to make room.
""".strip(),
}


# ══ THE TWO-STEP ROUTE (ADR-082 U31) ═══════════════════════════════════════
#
# ⚠ "GRADE THE LIGHT, CODE THE SCREEN" NARROWS "BAKE THE LIGHT". The Architect —
# the look the owner holds every era to — was made in TWO steps: a photoreal
# colour still, then a restyle into gold. The eras drawn in ONE step ("a
# volumetric hologram") came back as emissive sculptures with blown eyes
# (interior p75 luma 181.8 and 191.1 against the Architect's 105.3), and the
# cause is structural rather than a matter of wording: the alpha is a LUMA key,
# so black cloth must be over-lit or it keys out, and over-lit black cloth is
# the glow. So the model now does what it is good at — the man, the wardrobe,
# the pose, in full colour, on a flat key ground — and `gold.py` does the gold
# deterministically, on a curve measured off the Architect himself.
#
# ⚠ NO ARTIST, SHOW OR STUDIO IS NAMED IN ANY PROMPT. The look is described by
# its PROPERTIES — a medium, a light, a lens — never by whose it is.
#
# ⚠ THE REFERENCE ROLES ARE THE ONES `generate.py` LABELS: each image arrives
# preceded by `IMAGE n — ROLE`, in `refs/refs.json`'s order, and the locks below
# address them by number.

#: The ground every plate stands on. BLUE because it is the complement of gold
#: AND of skin, and because at a luma weight of .114 its edge-mix moves the grade
#: roughly five times less than a green's would — and its luma sits near the
#: cloth's own, so a cloth edge does not brighten against it.
KEY_GROUND = """
THE GROUND: one perfectly uniform, saturated deep blue, hex #0A28D2 — a flat
digital fill from edge to edge and UNDER his boots. It is not a backdrop: no
gradient, no vignette, no texture, no horizon, no floor plane. He casts NO
shadow on it and it casts NO light on him — no blue rim, no blue bounce, no
blue reflection anywhere on the figure. As if he were cut out and laid on flat
coloured paper.
""".strip()


def key_ground_text(era: str | None) -> str:
    """The ground clause for an era's plate (ADR-082 U33, `grounds.py`). A blue
    era gets KEY_GROUND byte-for-byte, so a re-draw of genai or expanse reads the
    exact words its sidecar recorded."""
    name = ground_name(era)
    if name == "blue":
        return KEY_GROUND
    _, hexv, words = KEY_GROUNDS[name]
    return (
        f"THE GROUND: one perfectly uniform, {words}, hex {hexv} — a flat digital fill "
        "from edge to edge and UNDER his boots. It is not a backdrop: no gradient, no "
        "vignette, no texture, no horizon, no floor plane. He casts NO shadow on it and it "
        f"casts NO light on him — no {name} rim, no {name} bounce, no {name} reflection "
        "anywhere on the figure. As if he were cut out and laid on flat coloured paper."
    )

PLATE_LOCK: dict[str, str] = {
    # 2023 · the AI Captain, re-briefed by the owner (2026-09-25): "a realistic
    # version of myself inspired by this clothing. My face needs to match … I
    # like the airbrush retro-futuristic style … I don't want stars around my
    # head. It should be more like a subtle halo and I should be casting subtle
    # magic sigils and spells around my arms … like an idle animation from an
    # RPG video game or a character select."
    #
    # ⚠ THE PAINTING IS THE WARDROBE AND THE HANDLING, NEVER THE MAN. Both
    #   avatar paintings are a bald man with a grey beard and dark skin; they are
    #   cut below the beard (refs.py) and the three identity crops come first.
    # ⚠ THE STARS ARE GONE BY HIS WORD, and the halo is a single fine ring.
    # ⚠ THE SIGILS ARE THIN LINES OF LIGHT, NOT A HAZE. They are the one
    #   emissive thing on a plate cut by a CHROMA key: a line with a tight glow
    #   keys as partial alpha and `gold.unmix` takes the blue back out of it; a
    #   haze spread over the ground would key as a blue-grey fog. Their shapes
    #   are the vocabulary of the linework tattoos on his fingers, so the spell
    #   reads as his and no lettering enters the picture.
    # ⚠ THE HANDS ARE RAISED, SO THEY ARE HELD INSIDE THE CLOAK'S LINE: the
    #   site's figure column is width-bound, and the widest thing in a plate
    #   sets the scale of the whole man (ADR-082 U18).
    # ⚠ THE CLOTH IS STILL LIT AS CLOTH: the gold grade needs readable
    #   charcoal folds, which is what keeps this era inside the Architect's band
    #   where `genai-v2` read "too glowing".
    "genai": """
IMAGE 1, IMAGE 2 and IMAGE 3 are this man's IDENTITY, at three angles. IMAGE 4 is
the WARDROBE and the PAINT HANDLING — a painting cut below its figure's beard,
headless on purpose: take its garments and its handling, never a face, a beard or
a skin tone from it. IMAGE 5 is his HANDS. Draw ONE figure: this man, full
length, in that wardrobe.

HIS FACE, exactly as in the identity photographs and recognisable at a glance: a
long oval face with a strong, angular jaw; a heavy, straight, low-set dark brow;
deep-set, hooded dark eyes with real irises and shadowed hollows beneath them; a
straight nose with a broad bridge; a thin upper lip over a fuller lower lip. THE
BEARD IS A CHIN BEARD: a dark moustache joining a dense, full dark beard on the
chin and along the jawline, the CHEEKS nearly clean. His own light, warm skin.
BARE-HEADED, the head shaved to the skin — no cap, no hood, no crown. A serious,
contained expression, eyes on the lens, MOUTH CLOSED.

THE HABIT, exactly as IMAGE 4: a long black cloak with a high standing collar and
a ragged hem over a floor-length black robe; a bandolier from the left shoulder
to the right hip set with small metal plates; a sash-belt closed by ONE LARGE
ROUND GOLD DISC; a smaller gold boss at the breast; THICK STACKED GOLD CUFFS
three bands deep on both forearms; two medallions on a fine chain; a slim
gold-banded rod WORN at the hip inside the line of the cloak — never held. His
hands are BARE, with his own tattoos and his gold signet ring as in IMAGE 5.

POSE, like a hero on a character-select screen: standing tall and square to the
camera, his weight settled, calm and in command. His forearms are raised a little
in front of him at waist height, elbows near his sides, hands open about a
forearm's length from his body, palms turned a little upward and toward each
other, fingers relaxed and slightly parted — a spell held quietly between them,
never thrown. Both hands stay INSIDE the outline of the cloak.

THE SPELL, subtle and sparse: around each forearm, just above the gold cuffs, one
thin ring of small floating SIGILS circles the arm, and two or three more of the
same small sigils hang in the air just above each open palm. Each sigil is a fine
geometric line-glyph — a small circle crossed by straight strokes, a node on a
line, an open arc with a tick — the same vocabulary as the small linework tattoos
on his fingers; never letters, runes or numbers. They are drawn as FINE LINES OF
WARM GOLD LIGHT, each line carrying only a tight, soft glow that hugs it; they
cast a faint warm light onto his palms and the cuffs and nowhere else.

THE HALO, subtle: ONE thin, even circle of warm gold light behind his head, a
little wider than his head and centred on it, its line fine and clean with a
tight soft glow. NO STARS on it or around it — no star points, no rays, no
sparkles, no second ring.

PAINTED as retro-futuristic science-fiction poster art, realism first so he is
recognisable at a glance: AIRBRUSHED over a tight drawing — smooth sprayed
gradients modelling the skin and the cloak's folds, soft sprayed highlights, crisp
masked edges and hard bright specular glints on the gold and the metal, a few
confident brush marks in the cloth. Heroic and idealised, a painting — not a
photograph and not a 3D render. The blacks are PAINTED AS CLOTH.

LIT by two fixtures only: a broad soft white bounce below the camera as the KEY,
reaching into every fold, so the black cloth reads dark-to-mid charcoal and
nothing is crushed; and one small hard warm source high to camera-right, drawing
a HAIRLINE rim on the crown and the tops of the shoulders only.

CAMERA LOW, at hip height, tilted up a little; 85mm or longer.

FRAMING 9:16: the whole figure, from the top of the halo to the soles. The top of
the halo about 6 % down from the top edge, the soles about 4 % up from the bottom
edge, and nothing — no hand, no sigil, no hem — touching any edge. If he does not
fit, make him smaller.

DO NOT: stars anywhere; a hologram, a monochrome image, gold-tinted skin, glowing
eyes; a haze, smoke or light rays; letters, runes, numbers, text or a signature; a
rock, a ledge, sand, a floor, a shadow; blue light on the figure; gloves; a staff,
rod or weapon in his hands; a crop; a second figure.
""".strip(),
    # 2023 · the same brief on the owner's SECOND habit (2026-09-25), drawn beside
    # the first so he picks the clothing from the sheet: sculpted pauldrons, a
    # belt of machined gold modules, filigree bracers. ⚠ The painting's figure
    # is GLOVED and his hands are the identity's watermark (the skill's Rule 2),
    # so the bracers stop at the wrist and the hands are bare.
    "genai-regalia": """
IMAGE 1, IMAGE 2 and IMAGE 3 are this man's IDENTITY, at three angles. IMAGE 4 is
the WARDROBE and the PAINT HANDLING — a painting cut below its figure's beard,
headless on purpose: take its garments and its handling, never a face, a beard, a
skin tone or its gloved hands from it. IMAGE 5 is his HANDS. Draw ONE figure: this
man, full length, in that wardrobe.

HIS FACE, exactly as in the identity photographs and recognisable at a glance: a
long oval face with a strong, angular jaw; a heavy, straight, low-set dark brow;
deep-set, hooded dark eyes with real irises and shadowed hollows beneath them; a
straight nose with a broad bridge; a thin upper lip over a fuller lower lip. THE
BEARD IS A CHIN BEARD: a dark moustache joining a dense, full dark beard on the
chin and along the jawline, the CHEEKS nearly clean. His own light, warm skin.
BARE-HEADED, the head shaved to the skin — no cap, no hood, no crown. A serious,
contained expression, eyes on the lens, MOUTH CLOSED.

THE REGALIA, exactly as IMAGE 4: a long black cloak with a high collar falling to
the floor over a floor-length black robe; on both shoulders, sculpted PAULDRONS of
polished silver-and-gold metal, their surfaces engraved with fine circuit-like
line-work and set with small round lenses; small gold emblems pinned on the
cloak's breast — a gold cross within a ring, and small geometric line emblems; at
the waist a WIDE BELT of gold machined modules — blocks, ridges and round
lens-discs like the face of an old instrument; a small gold pendant on a cord
hanging from the belt; on both forearms, ornate gold BRACERS of the same machined
filigree, ending AT THE WRIST. IMAGE 4 is cut at the knee: continue the cloak and
the robe to the floor over dark boots. IMAGE 4 wears gloves — HE DOES NOT: his
hands are BARE, with his own tattoos and his gold signet ring as in IMAGE 5.

POSE, like a hero on a character-select screen: standing tall and square to the
camera, his weight settled, calm and in command. His forearms are raised a little
in front of him at waist height, elbows near his sides, hands open about a
forearm's length from his body, palms turned a little upward and toward each
other, fingers relaxed and slightly parted — a spell held quietly between them,
never thrown. Both hands stay INSIDE the outline of the cloak.

THE SPELL, subtle and sparse: around each forearm, just above the bracers' wrist
edge, one thin ring of small floating SIGILS circles the arm, and two or three
more of the same small sigils hang in the air just above each open palm. Each
sigil is a fine geometric line-glyph — a small circle crossed by straight strokes,
a node on a line, an open arc with a tick — the same vocabulary as the small
linework tattoos on his fingers; never letters, runes or numbers. They are drawn
as FINE LINES OF WARM GOLD LIGHT, each line carrying only a tight, soft glow that
hugs it; they cast a faint warm light onto his palms and the bracers and nowhere
else.

THE HALO, subtle: ONE thin, even circle of warm gold light behind his head, a
little wider than his head and centred on it, its line fine and clean with a
tight soft glow. NO STARS on it or around it — no star points, no rays, no
sparkles, no second ring.

PAINTED as retro-futuristic science-fiction poster art, realism first so he is
recognisable at a glance: AIRBRUSHED over a tight drawing — smooth sprayed
gradients modelling the skin and the cloak's folds, soft sprayed highlights, crisp
masked edges and hard bright specular glints on the pauldrons, the belt and the
bracers, a few confident brush marks in the cloth. Heroic and idealised, a
painting — not a photograph and not a 3D render. The blacks are PAINTED AS CLOTH.

LIT by two fixtures only: a broad soft white bounce below the camera as the KEY,
reaching into every fold, so the black cloth reads dark-to-mid charcoal and
nothing is crushed; and one small hard warm source high to camera-right, drawing
a HAIRLINE rim on the crown and the tops of the pauldrons only.

CAMERA LOW, at hip height, tilted up a little; 85mm or longer.

FRAMING 9:16: the whole figure, from the top of the halo to the soles. The top of
the halo about 6 % down from the top edge, the soles about 4 % up from the bottom
edge, and nothing — no pauldron, no hand, no sigil, no hem — touching any edge. If
he does not fit, make him smaller.

DO NOT: stars anywhere; a hologram, a monochrome image, gold-tinted skin, glowing
eyes; a haze, smoke or light rays; letters, runes, numbers, text or a signature; a
mountain, a sky, a rock, a floor, a shadow; blue light on the figure; gloves; a
staff, rod or weapon in his hands; a crop; a second figure.
""".strip(),
    # 2018 · the campaign commander, on the set visit. Live action: the owner's
    # own brief is "realistic … a live-action-ish type of thing".
    "expanse": """
IMAGE 1 and IMAGE 2 are this man's IDENTITY. IMAGE 3 is the WARDROBE SILHOUETTE —
a headless crop from the neck to the floor: take the armour, the kilt panel and
the leggings, and ignore the trainers, the suitcase and the wall. IMAGE 4 shows
the ARMOUR PANELS lit. IMAGE 5 is HIS BOOTS. Draw ONE figure: this man, in that
armour.

HIS FACE, unchanged and recognisable at a glance, and HIS OWN CAP as in IMAGE 1
and IMAGE 2 — no helmet, no visor. His face is fully visible.

Matte black hard-shell armour: a moulded chest plate of raised geometric panels,
a ribbed flexible midsection, a buckled pouch, rounded shoulder caps, plated
upper arms, long articulated forearm gauntlets, hex-grip tactical gloves, a high
ribbed collar. A BLACK KILT PANEL to the knee over black leggings; black socks
with three thin white bands; HIS OWN worn black lace-up combat boots from
IMAGE 5. A used production costume — scuffed, semi-matte, never glossy, never a
superhero suit; no insignia and no lettering on it.

POSE: DOWN ON ONE KNEE. The torso upright, turned a few degrees so both knees
read. The RIGHT knee on the ground, the LEFT foot flat in front, the kilt draped
over the raised thigh.

His RIGHT hand holds a compact, matte black, panelled carbine UPRIGHT by the
pistol grip, the STOCK BRACED AGAINST THE FRONT OF HIS RIGHT HIP, the barrel
pointing STRAIGHT UP, inside the line of his shoulders; its muzzle sits a little
above the cap and is the highest thing in the picture. He is NOT aiming, and his
finger is outside the trigger guard.

His LEFT hand is raised to his LEFT ear, two fingers pressing a small black
earpiece, the elbow out and level; a thin boom mic runs along his jaw. Head
level, turned slightly, EYES OFF THE LENS, mouth closed — a commander receiving
a report.

PHOTOGRAPHED as a unit-stills costume plate: photoreal, natural colour,
ungraded. 85mm at f/5.6, the camera square-on at his chest height, about 90 cm
from the ground. Real skin; no computer-graphics smoothness.

LIT by a six-foot octabox 45 degrees to camera-left as the KEY, with a catchlight
in the eyes, and a broad white bounce to camera-right one and a half stops under
as the FILL, so the black armour reads dark-to-mid charcoal with its panel lines
visible. NO backlight, no rim light, no kicker.

FRAMING 9:16: he sits LOW in the frame — the muzzle about 28 % down from the top
edge, the top of the cap about 36 % down, the ground contact about 5 % up from
the bottom edge. From the top of the cap to the bottom of the beard is about 13 %
of the frame's height — a standing man's head size: do NOT zoom in to fill the
space above him. Nothing touches an edge. Never tip the rifle outward to make
room.

DO NOT: a hologram, a glow, gold, a 3D game render, a statue; an aimed,
shouldered or downward-pointing rifle, or two hands on it; a helmet; insignia; a
set, a floor slab, a platform, a cast shadow, smoke; blue light on the figure; a
crop.
""".strip(),
    # 2016 · the street organiser, drawn as a cel (ADR-082 U33, owner: "a
    # Pokémon-style version of myself, similar to Ash Ketchum with a hat, but
    # … with my facial features"; anime, "like the show", his own call).
    # ⚠ NO SHOW, CHARACTER OR STUDIO IS NAMED: the medium is described by its
    #   properties and the costume by its parts.
    # ⚠ THE PALETTE IS DEEP BY DESIGN, NOT BY TASTE. The gold curve lifts
    #   mid-tones hard (photo luma 70 lands at ~155, 90 at ~176), so a bright
    #   cel palette arrives above the Architect's band (p75 80-130) even at the
    #   lowest exposure the chain allows. A dusk palette keeps the flats in the
    #   deep ambers and leaves the face as the brightest thing on him, which is
    #   where the Architect's own light sits.
    # ⚠ AND HE STANDS ON MAGENTA (`grounds.py`): the vest, the jeans and the
    #   gloves carry blue and green, which a blue key would read through.
    # ⚠ THE BOOTS LAW STILL BINDS: his own boots, the jeans' turn-up on them.
    "pokemon-go": """
IMAGE 1 and IMAGE 2 are this man's IDENTITY. IMAGE 3 is HIS BOOTS. Draw ONE
figure: this man, full length, standing.

DRAWN as hand-inked Japanese television cel animation of the late 1990s: bold,
clean black outlines of an even weight around every shape; flat cel colours with
exactly ONE hard-edged shadow tone each and a few simple highlights; large,
expressive eyes with a single white catchlight; simplified anatomy with a
slightly larger head. Not a photograph, not a 3D render, not a painting, and no
soft gradient inside any colour.

HIS FACE, drawn in that style and still recognisable as him at a glance: a long
oval face, heavy straight brows, dark hooded eyes with real irises, a straight
nose, and HIS SHORT, CLOSE-TRIMMED DARK BEARD that thins at the cheeks, drawn as
one flat dark shape with a clean outline. The sides of his head are shaved close
under the cap; no hair sticks out from it.

THE OUTFIT: a baseball cap worn facing forward — a deep crimson crown, an
off-white front panel, a curved brim, and NO logo, letter or symbol on it; a
short-sleeved deep-navy vest-jacket with white trim at the collar and the hem,
open over a plain black crew-neck T-shirt; dark-green fingerless gloves; dark
indigo jeans that end in a thick single-fold turn-up resting on HIS OWN worn
black lace-up combat boots, exactly as IMAGE 3 — never trainers.

THE PALETTE IS DEEP AND SATURATED, the way a dusk scene is coloured in that
style: the crimson, the navy, the indigo and the green are all dark, their
shadow tones darker still. Apart from his face and the white half of the ball,
nothing on him is bright.

POSE: standing, his weight settled, his feet about a shoulder-width apart, his
body turned a few degrees, looking at the camera with a confident half-smile.
His RIGHT hand holds a small red-and-white ball, the size of an apple, at chest
height and turned a little toward the viewer — split across its middle by a
black band with a round white button at the front. His LEFT hand grips the brim
of his cap. Both elbows stay close enough to his body that neither reaches an
edge.

LIT flatly, the way a cel is: the one shadow tone falls on the side away from
the picture's left. No rim light, no glow, no bloom, no lens effect.

FRAMING 9:16: the whole figure, from the top of the cap to the soles. The top of
the cap about 7 % down from the top edge, the soles about 4 % up from the bottom
edge, and nothing touching any edge. If he does not fit, make him smaller.

DO NOT: a photograph, a 3D render, a painting; a hologram, a glow, gold; a logo,
letters or numbers anywhere; a creature, a pet or a companion beside him; a
second figure; a floor, a cast shadow, a horizon; magenta light on the figure;
a crop.
""".strip(),
}


def plate_prompt(era: str, lock: str | None = None) -> str:
    """The full lock for one era's COLOUR PLATE — the two-step route's first half.
    `lock` names a second lock for the same era (`genai-regalia`); the ground is
    always the ERA's, so a second habit cannot stand on a different key."""
    text = PLATE_LOCK.get(lock or era)
    if text is None:
        raise SystemExit(f"no plate lock '{lock or era}'")
    return text + "\n\n" + key_ground_text(era)


#: The idle for a PLATE (Veo image-to-video). The ground is the key colour now,
#: so the invariant is that it STAYS the key colour — a ground that drifts in
#: value is a matte that drifts with it.
PLATE_IDLE: dict[str, tuple[str, str]] = {
    # ⚠ RE-BRIEFED 2026-09-25 (the owner: "casting subtle magic sigils and spells
    # around my arms … like an idle animation from an RPG video game or a
    # character select"). The ring of stars is gone; what moves now is the
    # SPELL, and only the spell and a breath. The sigils are the one thing a
    # video model will want to turn into an effect, so their motion is given as
    # a slow, even orbit and a soft brightening, and the burst is banned by name.
    # ⚠ AND THE HALO IS BROKEN PARTS THAT TURN (owner, same day: "like broken
    # parts rotating around my head"): the pieces orbit ON their circle, so the
    # loop can close on the frame it began on.
    "genai": (
        "A slow, shallow breath under the cloak; the thin rings of small gold sigils "
        "around his forearms turn slowly and evenly around his arms, and the few sigils "
        "above his open palms drift a little, brightening and dimming softly; the stone "
        "shards of the halo turn slowly and evenly around his head, all together on their "
        "one ring, like a slow orbit, their small chips drifting with them; one normal blink — that is everything",
        "his feet, his stance, his head and his eyes on the lens, his raised forearms and "
        "open hands (exactly where they are in the first frame), all the metalwork, the "
        "halo's circle (its size and its centre behind his head), and THE PAINT (the airbrushed surface is fixed to him like "
        "a printed surface; it never shimmers and it is never repainted)",
    ),
    # ⚠ THE COMMANDER (ADR-082 U34, owner: "more like a general or commander,
    # maybe holding my gun but then pointing in the distance, giving commands.
    # Make it subtle"). v2's kneeling breather (U32) read as "sighing … as if
    # he's having anxiety", and v3's scene (U33) became this pose. The plate is
    # `plate-expanse-mouth_01` (`command_01` with its lips closed) — he points
    # to the RIGHT of the picture and holds the rifle low across his body, the
    # MIRROR of what EDIT_COMMAND asked — so the idle is written in THAT
    # picture's terms. Still an idle, not a performance: no gesture at all.
    # ⚠ THE ACTION IS SAID IN PHYSICAL TERMS ONLY. "Sending his people on" and
    # "an order carried out" were refused on the SOUNDTRACK (uncharged) — and so
    # was every wording after them, physical ones included, because the cause
    # was the first plate's PARTED MOUTH (see PLATE_IDLE_HOLD). The rule stays
    # anyway: words that describe a spoken order still invite a voice.
    # ⚠ AND THE HAND DOES NOT MOVE AT ALL. Take 1 from the closed-mouth plate
    # was told "the raised hand moves forward a finger's width … and settles
    # back"; Veo read an invitation to GESTURE, swung the forearm upright into a
    # raised index finger ("wait") at 1.25 s and held it until 4.5 s. Measured:
    # the hand's reach fell 0.890 → 0.81 of the canvas. A pointing hand is the
    # most gesture-shaped thing in the picture, so it gets no motion of its own.
    "expanse": (
        "He holds the pose and breathes: a slow breath lifts his chest and settles; his "
        "head turns a fraction further toward where he points and back; one blink — "
        "nothing more",
        "his feet and his stance, the rifle held low across his body (no raising, no "
        "aiming, no swing), the pointing arm and its hand (level, pointing forward, the "
        "index finger never turning upward), the cap, the kilt and the earpiece, his "
        "mouth, and all of him inside the frame",
    ),
    # 2016 · the trainer (ADR-082 U33): an idle, like the others — a breath and a
    # small life in the hand, never a throw.
    "pokemon-go": (
        "He stands easy and breathes: a slow breath lifts his shoulders a little and "
        "settles; his thumb turns the red-and-white ball a little in his fingers and back; "
        "the half-smile warms a touch; one blink — that is everything",
        "his feet and his stance, the hand on the brim of the cap, the ball staying in his "
        "hand at chest height (never thrown, never tossed, never dropped), his head and his "
        "eyes on the camera, the outlines and the flat colours (the drawing stays the same "
        "drawing on every frame: nothing is redrawn, no line boils or shimmers), and all of "
        "him inside the frame",
    ),
}


#: ⚠ NOT `IDLE_NEGATIVE`. That one bans "background" outright, which was right
#: for a figure on black and fights a plate whose FLAT KEY GROUND is the one
#: thing the video must keep; what a plate cannot have is a ground that CHANGES
#: (a gradient, a floor, a shadow, blue light spilling onto the figure).
PLATE_IDLE_NEGATIVE = (
    "camera movement, pan, tilt, zoom, dolly, orbit, handheld shake; standing up, "
    "walking, turning away, talking; lowering, swinging or aiming the rifle; "
    "particles, smoke, light rays, flicker, exposure change; a gradient, vignette, "
    "floor, horizon or shadow on the ground; blue light on the figure; text, "
    "watermark; a second figure; the figure leaving the frame; cropped boots"
)


#: A pose the video model will "resolve" if it is only listed among the things
#: that stay still. ⚠ MEASURED, take 1 (2026-09-22): told "the hand at the
#: earpiece ... stays still" at the END of the prompt, Veo dropped the hand to
#: his side and lifted his head inside the first two seconds and held THAT for
#: the other six — a calmer pose, and a loop that can never close on frame 0.
#: The hold goes FIRST now, in the picture's terms, and the moves it made are
#: banned by name in the negative.
PLATE_IDLE_HOLD: dict[str, str] = {
    # ⚠ U32's lesson again: raised forearms the model is not told to HOLD are
    # forearms it will lower, and open hands it will close or wave.
    "genai": (
        "THE POSE IS HELD FOR ALL EIGHT SECONDS. His forearms stay raised in front of him "
        "at waist height and his hands stay open, palms up, exactly where they are in the "
        "first frame; they never drop, never lift, never close and never gesture. He keeps "
        "looking at the camera and his lips stay closed. The last frame is the first "
        "frame's pose."
    ),
    # ⚠ U32's lesson, one pose on: a raised arm the model is not told to HOLD is
    # an arm it will lower, so the hold is stated first and in picture terms.
    # ⚠ AND HE DOES NOT SPEAK. The first commander plate caught him with his
    # lips parted, as if mid-order, and five takes were refused on the
    # SOUNDTRACK: a model that reads a man speaking draws his voice, and a real
    # person's voice is what an audio filter refuses. Saying so here did NOT
    # fix it — a first frame outranks a sentence — so the PLATE was fixed
    # (`--edit-kind mouth`), and this clause keeps the closed mouth closed.
    "expanse": (
        "THE POSE IS HELD FOR ALL EIGHT SECONDS. The arm raised on the RIGHT of the "
        "picture keeps pointing forward into the distance, level, the whole time; it "
        "never drops and never lifts, and its hand and index finger stay exactly where "
        "they are in the first frame. The rifle stays low across his body in the hand on "
        "the LEFT of the picture. He "
        "keeps looking where he points. HE DOES NOT SPEAK: his lips are closed in the "
        "first frame and stay closed, and they never move. The last frame is the first "
        "frame's pose."
    ),
    # ⚠ The brim hand is the trainer's version of the earpiece: a raised hand
    #   the model would "resolve" to his side if it were only listed as still.
    "pokemon-go": (
        "THE POSE IS HELD FOR ALL EIGHT SECONDS. The hand on the brim of his cap — on the "
        "RIGHT of the picture — stays on the brim the whole time and never drops, and the "
        "ball stays in the other hand at chest height. He keeps looking at the camera. The "
        "last frame is the first frame's pose."
    ),
}

PLATE_IDLE_NEGATIVE_EXTRA: dict[str, str] = {
    "expanse": (
        "lowering the pointing arm, dropping the arm, raising the forearm, a finger "
        "pointing up, a raised index finger, a hand gesture, waving, beckoning, raising "
        "the rifle, shouldering or aiming the rifle, stepping, walking, turning away, "
        "looking at the camera, speaking, talking, moving lips, an open mouth, shouting, "
        "changing the pose"
    ),
}

#: An era whose idle negative is its OWN, not the shared one plus extras. The
#: shared one bans rifle moves and blue light; the trainer has no rifle, and his
#: ground is magenta.
PLATE_IDLE_NEGATIVE_OWN: dict[str, str] = {
    # The captain has no rifle, and the shared negative's "particles" would
    # fight the sigils he is holding; what he may not have is an EFFECT.
    # ⚠ "a camera orbit", never a bare "orbit": the halo's shards DO orbit.
    "genai": (
        "camera movement, pan, tilt, zoom, dolly, a camera orbit, handheld shake; walking, stepping, "
        "turning away, talking, moving lips; lowering the arms, closing the hands, a hand "
        "gesture, throwing a spell; a burst of magic, an explosion of light, sparks, embers, "
        "dust, fire, lightning, smoke, light rays, lens flare, flicker, exposure change; stars; "
        "the halo growing, shrinking or moving off his head, its pieces leaving their circle; redrawn or shimmering paint, a change of style; a "
        "gradient, vignette, floor, horizon or shadow on the ground; blue light on the "
        "figure; text, watermark; a second figure; the figure leaving the frame; cropped "
        "boots; music, a song, singing, speech, voices, sound effects"
    ),
    "pokemon-go": (
        "camera movement, pan, tilt, zoom, dolly, orbit, handheld shake; walking, turning "
        "away, talking; throwing, tossing, dropping or swapping the ball; lowering the hand "
        "from the cap; redrawn or boiling lines, shimmering colours, a change of style; "
        "particles, smoke, sparkles, light rays, flicker, exposure change; a gradient, "
        "vignette, floor, horizon or shadow on the ground; magenta light on the figure; a "
        "creature or a second figure; text, watermark; the figure leaving the frame; "
        "cropped boots; music, a song, a theme tune, singing, speech, voices, sound effects"
    ),
}

#: ⚠ VEO ALWAYS DRAWS A SOUNDTRACK, AND THE SOUNDTRACK CAN SINK THE CLIP
#: (ADR-082 U33). The trainer's first idle came back with no video and "an issue
#: with the audio for your prompt" — uncharged — and U34's commander ("giving
#: commands") came back the same way, so it is not a theme song: it is whatever
#: the audio model reaches for when the picture suggests a sound — there, a man
#: caught mid-word, which no sentence could silence. The Developer
#: API refuses `generate_audio` (see vid.py), so the sound is DIRECTED instead,
#: on EVERY plate clip: the asset is muted at the element, and the only job of
#: the audio is not to be refused.
PLATE_SOUND = (
    "SOUND: near-silence — a faint, even room tone and nothing else. No music, no song, "
    "no voice, no speech, no sound effects."
)
PLATE_IDLE_SOUND: dict[str, str] = {}


def ground_word(era: str | None) -> str:
    """The ground's colour as the idle and scene prompts say it: `BLUE`, `MAGENTA`."""
    return ground_name(era).upper()


def plate_idle_prompt(era: str, prop_wording: bool = False) -> str:
    """The idle clause for a plate. `prop_wording` is the one re-word the chain
    allows if the video model refuses a weapon beside a real face; a second
    refusal means that era ships its poster only."""
    action, still = PLATE_IDLE[era]
    still = headgear(still, era)
    hold = headgear(PLATE_IDLE_HOLD.get(era, ""), era)
    if prop_wording:
        action = action.replace("rifle", "costume prop carbine")
        still = still.replace("rifle", "costume prop carbine")
    lead = f"{hold} Within that pose: {action}" if hold else action
    sound = PLATE_IDLE_SOUND.get(era, PLATE_SOUND)
    return (
        f"LOCKED STATIC FRAME on a heavy tripod. {lead}. WHAT STAYS STILL: {still}. "
        f"The background is a FLAT UNIFORM {ground_word(era)}, the same value in every corner on every "
        f"frame. The lighting does not change. Real time. {sound}"
    )


#: The soundtrack's own bans, appended to every plate clip's negative (see
#: PLATE_SOUND for why).
PLATE_SOUND_NEGATIVE = "music, a song, singing, speech, voices, shouting, sound effects"


def plate_idle_negative(era: str) -> str:
    """The plate idle's negative, plus the era's own named moves (see above)."""
    if era in PLATE_IDLE_NEGATIVE_OWN:
        return PLATE_IDLE_NEGATIVE_OWN[era]
    extra = PLATE_IDLE_NEGATIVE_EXTRA.get(era)
    base = f"{PLATE_IDLE_NEGATIVE}; {extra}" if extra else PLATE_IDLE_NEGATIVE
    return f"{base}; {PLATE_SOUND_NEGATIVE}"


#: A SCENE for a plate (ADR-082 U33, owner: "I really want to have a pose where
#: he looks around, turns his head like he's scouting the thing, and then takes
#: his gun to aim"). Drawn with the plate as its first AND last frame
#: (`vid.py --scene`), so the action must END where it began.
#:
#: ⚠ HE AIMS PAST THE LENS, AND THAT IS ARITHMETIC (owner's call, from the
#:   numbers). The site paints every era at one body scale — 696.6px standing at
#:   1920x1247, 387px a metre — and his figure column holds about 0.6 m either
#:   side of his centre. A profile aim puts the muzzle ~0.95 m out (0.2 m to the
#:   shoulder, 0.75 m of carbine), so the only full aim that fits is one pointed
#:   within ~30° of the camera's axis: foreshortened across his chest.
#: ⚠ BOTH ENDS ARE HOLDS, SAID IN THE PROMPT. `post.py --loop settle` dissolves
#:   the model's drift onto frame 0, which is invisible only over a held pose.
#: ⚠ THE PICTURE'S TERMS, NEVER HIS. Plate F has the rifle in his LEFT hand, on
#:   the RIGHT of the picture; "his right hand" put it in the wrong hand once.
#: ⚠ U35 (owner, 2026-09-22): the kneeling scout-and-aim of U33 (`-v3`) is
#:   recorded in ADR-082 U33 and git; the Expanse STANDS since U34, so every
#:   `expanse` scene below is the COMMANDER's, in `plate-expanse-mouth_01`'s own
#:   picture terms — the pointing arm on the RIGHT of the picture, the rifle low
#:   in the hand on the LEFT. A kneeling text left under this key would draw a
#:   standing man on one knee the first time anyone ran `--ending home`.
PLATE_SCENE: dict[str, str] = {
    # 2026-09-25 (ADR-082 U44 A, the owner on genai-v3: "I think I'm a bit too
    # static. I think I should move my hands a bit and also my posture. I don't
    # think I should walk but … just move a bit with my body"). A LIVING IDLE,
    # drawn as a scene so it comes home to plate O on its own and the loop
    # closes on a pose rather than on a reversal (a ping-pong turns moving hands
    # around mid-gesture).
    # ⚠ THE HANDS ARE GIVEN A SHAPE TO MOVE IN, NOT A MOTION TO MAKE — U34's
    #   lesson: a hand told only "moves" became a raised index finger. So the
    #   drift is bounded (low, open, palms up, a few centimetres) and the
    #   gesture shapes are banned by name.
    # ⚠ THE HALO IS NOT ASKED TO DO ANYTHING: `post.py --loop orbit` erases the
    #   model's ring and turns frame 0's, following his head.
    "genai": (
        "LOCKED STATIC FRAME on a heavy tripod; the camera never moves and never pushes in. "
        "The shot BEGINS AND ENDS ON THE FIRST FRAME'S POSE: he stands with his forearms "
        "raised in front of him at waist height, his hands open, palms up, the ring of stone "
        "shards behind his head. In between, a slow, LIVING idle in real time, like a hero "
        "waiting on a character-select screen. His weight shifts gently onto one leg and back; "
        "his shoulders rise with a slow breath and settle; his torso turns a few degrees to one "
        "side and returns, his head tilting a little with it and coming back to the lens. His "
        "hands keep moving slowly the whole time, as if shaping the spell between them: they "
        "drift a few centimetres up and apart and turn a little, the fingers flexing and "
        "curling softly, then drift back down and together — always low, open and palms up. "
        "The small gold sigils follow his hands. His feet stay planted exactly where they are; "
        "he never steps, walks or lifts a heel. No gesture: no pointing, no raised finger, no "
        "fist, no wave, no reach toward the camera; his hands never rise above his chest and "
        "never leave the frame. His lips stay closed and he does not speak. His eyes stay "
        "open and alert; he blinks normally and quickly. In the last second he settles back "
        "into the first frame's pose and holds it. The background is a FLAT UNIFORM BLUE, the "
        "same value in every corner on every frame. The lighting does not change."
    ),
    "expanse": (
        "LOCKED STATIC FRAME on a heavy tripod; the camera never moves. The shot BEGINS "
        "AND ENDS ON THE FIRST FRAME'S POSE: he stands, pointing into the distance with the "
        "arm on the RIGHT of the picture, the rifle low in the hand on the LEFT of the "
        "picture. In between, one continuous action, in real time. He holds the point for a "
        "second, steady. Then the pointing hand comes in and presses the earpiece at his "
        "ear; he tilts his head to it and MOUTHS one short order into the boom mic — his "
        "lips move for a moment, then close. Then the hand goes back out and he points "
        "again, holding the first frame's pose, completely still, for the last second. His "
        "feet stay planted exactly where they are; his body does not sway, bob or step. His "
        "eyes stay open and alert; he blinks normally and quickly, never slowly. The rifle "
        "and both elbows stay inside the picture. The background is a FLAT UNIFORM BLUE, the "
        "same value in every corner on every frame. The lighting does not change."
    ),
}

PLATE_SCENE_NEGATIVE: dict[str, str] = {
    "genai": (
        "walking, stepping, lifting a foot or a heel, turning around, kneeling, crouching; "
        "pointing, a raised index finger, a fist, waving, beckoning, reaching toward the camera, "
        "hands above the chest, the arms dropping to his sides; talking, moving lips, an open "
        "mouth; slow blinking, eyes closing, drooping eyelids; a burst of magic, an explosion "
        "of light, sparks, embers, fire, lightning, smoke, light rays, lens flare; stars; "
        "camera movement, pan, tilt, zoom, push-in, dolly, a camera orbit, handheld shake; "
        "redrawn or shimmering paint, a change of style; a gradient, vignette, floor, horizon "
        "or shadow on the ground; blue light on the figure; flicker, exposure change; text, "
        "watermark; a second figure; the figure leaving the frame; cropped boots"
    ),
    "expanse": (
        "firing, a muzzle flash, recoil, smoke, shell casings, sparks; the barrel pointing "
        "straight into the lens; the rifle, the muzzle or an elbow leaving the frame; "
        "kneeling, crouching, stepping, walking, swaying, bobbing; slow blinking, eyes "
        "closing, drooping eyelids, half-closed eyes, a drowsy look; camera movement, pan, "
        "tilt, zoom, dolly, handheld shake; a gradient, vignette, floor, horizon or shadow on "
        "the ground; blue light on the figure; particles, light rays, flicker, exposure "
        "change; text, watermark; a second figure; cropped boots"
    ),
}


#: ⚠ TAKE 1 AIMED SIDEWAYS (2026-09-22). Told in words to aim "past the camera
#:   … foreshortened across his chest", Veo swung the rifle out to the RIGHT of
#:   the picture, level, and the barrel ran off the frame edge for ~2.7 s — the
#:   one pose the stage cannot hold. A video model finds the physically easy
#:   aim, and the easy aim from that grip is sideways. So the aim is DRAWN
#:   first, as a still (`EDIT_AIM`, where the framing can be checked before a
#:   video is paid for), and the scene runs from the plate TO that still
#:   (`vid.py --scene --ending aim --last <aim still>`) and loops as a
#:   ping-pong: both ends are the two holds, so neither turn has a velocity.
#: ⚠ U35 (owner, 2026-09-22): "I need to use my headpiece to voice commands. I
#:   need to look through my weapon. I need to point." The commander's scene
#:   runs point → the order at the earpiece → the aim, and ends on a DRAWN aim
#:   (`EDIT_AIM_STANDING`) for the reason above.
#: ⚠ THE ORDER IS MOUTHED, NOT SPOKEN. A speaking man is what the audio filter
#:   refused five times in U34 (a voice drawn for a real face); lips that move
#:   for a moment under a directed near-silence are the one version of "voice
#:   commands" with a chance of passing. `PLATE_SCENE_AIM_LISTEN` is the named
#:   fallback when even that is refused: he listens and nods, lips closed.
#: ⚠ AND HIS EYES ARE SAID. v4's idle lowered its lids three times for ~0.7 s,
#:   which the owner read as "a zombie"; "one blink" had been the whole brief.
PLATE_SCENE_AIM: dict[str, str] = {
    "expanse": (
        "LOCKED STATIC FRAME on a heavy tripod; the camera never moves. The shot BEGINS "
        "ON THE FIRST FRAME'S POSE — he stands, pointing into the distance with the arm on "
        "the RIGHT of the picture, the rifle low in the hand on the LEFT of the picture — "
        "and ENDS ON THE LAST FRAME'S POSE, looking through the rifle's optic. In between, "
        "one continuous action, in real time. First he holds the point for a second, "
        "steady. Then the pointing hand comes in and presses the earpiece at his ear; he "
        "tilts his head to it and MOUTHS one short order into the boom mic — his lips move "
        "for a moment, then close. Then that hand leaves the earpiece and takes the rifle's "
        "front grip, the rifle comes up into his shoulder, and he settles into the last "
        "frame's aim — his eye behind the optic, looking toward the RIGHT of the picture, "
        "where he pointed — and HOLDS IT, completely still, for the last second and a half. "
        "His feet stay planted exactly where they are for the whole shot; his body does not "
        "sway, bob or step. His eyes stay open and alert; he blinks normally and quickly, "
        "never slowly. The rifle never swings out sideways and never leaves the picture. "
        "The background is a FLAT UNIFORM BLUE, the same value in every corner on every "
        "frame. The lighting does not change."
    ),
}

#: The fallback of the scene above, word for word but the order: he LISTENS.
PLATE_SCENE_AIM_LISTEN: dict[str, str] = {
    era: text.replace(
        "he tilts his head to it and MOUTHS one short order into the boom mic — his lips move "
        "for a moment, then close.",
        "he tilts his head to it, LISTENING, and gives one short nod — his lips stay closed.",
    )
    for era, text in PLATE_SCENE_AIM.items()
}


def plate_scene_prompt(
    era: str, prop_wording: bool = False, ending: str = "home", listen: bool = False
) -> str:
    """The scene clause for a plate: back HOME to the first frame (PLATE_SCENE),
    or on to the drawn AIM (PLATE_SCENE_AIM, or its LISTEN fallback)."""
    if ending == "aim":
        table = PLATE_SCENE_AIM_LISTEN if listen else PLATE_SCENE_AIM
    else:
        table = PLATE_SCENE
    scene = table.get(era)
    if scene is None:
        raise SystemExit(f"no '{ending}' scene is authored for era '{era}'")
    if listen and scene == PLATE_SCENE_AIM.get(era):
        raise SystemExit(f"the listen fallback did not change '{era}'s scene — its order sentence moved")
    scene = f"{headgear(scene, era)} {PLATE_SOUND}"
    return scene.replace("rifle", "costume prop carbine") if prop_wording else scene


def plate_scene_negative(era: str) -> str:
    return f"{PLATE_SCENE_NEGATIVE[era]}; {PLATE_SOUND_NEGATIVE}"


#: ADR-082 U32 (owner, 2026-09-22): "the images you made were good, but only the
#: gun needs to look more futuristic", with two photographs of production prop
#: rifles. ⚠ AN EDIT OF THE PICKED PLATE, NEVER A RE-DRAW: three of the six
#: plates lost his likeness, and an edit keeps the one that has it.
#: ⚠ The design is ALSO said in words, read off his two photographs, so the
#: edit holds when the photographs cannot be attached — and so the model is
#: told WHICH of their properties to take (shapes, panels, colours), not their
#: side-on angle, their white ground or their stencilled markings.
RIFLE_DESIGN = (
    "angular matte black polymer; a long squared handguard pierced by rows of "
    "horizontal slotted vents; a flat top rail carrying a small low optic in a boxy "
    "housing; a squared stock with a light-grey side panel; a ribbed pistol grip; "
    "a few restrained accent parts in muted brick red (the optic's housing, an angled "
    "front grip) and ONE small red hazard-triangle decal; a short squared muzzle. "
    "Industrial and military rather than sleek: a tool, not a toy"
)

EDIT_RIFLE = """
IMAGE 1 is the photograph to edit.{design_clause}

Keep IMAGE 1 exactly as it is: the same man, the same face and beard, the cap,
the earpiece and the boom mic, the armour, the kilt, the socks, the boots, the
pose, both hands, the framing, the light, and the flat blue ground. Do not
redraw, re-light or re-sculpt anything except the rifle.

Make ONE change: replace the rifle he is holding upright with a FUTURISTIC
CARBINE — {design}.

It is held EXACTLY where and how the old one is: on the RIGHT SIDE OF THE
PICTURE, in the same hand and the same grip, standing VERTICAL beside his
shoulder, its stock resting where the old stock rests, its muzzle a little above
the cap. Do not move it to the other hand and do not change either arm. His
finger rests outside the trigger guard. The same length as the old rifle and
lit by the same light (a soft key from camera-left, a gentle fill from the
right) — photoreal and physically there: a used production prop, faintly
scuffed, never glossy, never glowing.

No legible text, numbers or logos anywhere on it. The ground stays one
perfectly uniform blue, #0A28D2, edge to edge — no shadow, no gradient, and no
blue light on the figure.
"""


#: ADR-082 U33: the scene's END POSE, drawn as a still so its framing can be
#: checked before a video is paid for (see PLATE_SCENE_AIM for why). ⚠ ONE
#: change, but a big one — the pose above the waist — so everything below it
#: and the picture's scale are named as fixed: Veo interpolates from the plate
#: to this still, and a knee that moved between them would slide.
#: ⚠ END-ON, BECAUSE THE STAGE IS NARROW: at the site's body scale his figure
#: column holds ~0.6 m either side of his centre and a profile aim needs ~0.95.
EDIT_AIM = """
IMAGE 1 is the photograph to edit.

Keep exactly as IMAGE 1: the same man, the same face and beard, the cap, the
earpiece in his ear and the boom mic, the armour, the kilt, the socks, the
boots; the planted knee and the forward boot EXACTLY where they are; his size
and his place in the picture; the light; and the flat blue ground.

Make ONE change, to his pose above the waist: he has brought the SAME rifle up
and is AIMING it. The stock is in his shoulder on the RIGHT of the picture. The
hand on the RIGHT of the picture holds the pistol grip; the hand on the LEFT of
the picture — the one at his ear in IMAGE 1 — now holds the rifle's front grip.
His cheek rests on the stock, his eye behind the small optic, his gaze along the
barrel.

He aims PAST THE CAMERA: the barrel points toward the viewer and a little to the
LEFT of the picture, seen nearly END-ON, so the rifle is SHORT in the picture.
Its muzzle sits in front of his chest, well inside the frame, and no part of the
rifle reaches out sideways past his own shoulders. Never aimed straight into
the lens, and never pointing sideways.

The same futuristic rifle as IMAGE 1 — its shapes, its panels, its red parts —
photoreal, a used production prop, faintly scuffed, never glossy, never
glowing, lit by the same light. No legible text, numbers or logos. The ground
stays one perfectly uniform blue, #0A28D2, edge to edge — no shadow, no
gradient, and no blue light on the figure. Nothing touches a frame edge.
"""


#: ADR-082 U34 (owner, 2026-09-22): "if I'm the campaign commander, then maybe I
#: should be more like a general or commander, maybe holding my gun but then
#: pointing in the distance, giving commands. Make it subtle … Maybe I shouldn't
#: be kneeling." An EDIT of plate F, because plate F is the one that holds his
#: likeness and the rifle he already approved.
#: ⚠ THE ARM IS FORESHORTENED FOR THE SAME REASON THE AIM WAS: at the site's body
#:   scale his column holds ~0.6 m either side of his centre, and an arm flung
#:   out sideways from a square-on chest reaches ~0.9 m.
#: ⚠ AND HE MAY NOT BE SHRUNK TO MAKE ROOM: every era paints one standing
#:   height, and the site refuses a figure spanning under 0.7343 of its canvas.
#: ⚠ THE MOUTH IS CLOSED, AND "OR JUST PARTED" WAS A FIVE-REFUSAL MISTAKE. The
#:   first cut allowed "closed or just parted as if giving the command"; the
#:   model drew him mid-word, and Veo — which must start ON that frame and
#:   always draws a soundtrack — gave the speaking man a voice. The audio filter
#:   refused every idle (five takes, uncharged), whatever the prompt said about
#:   silence: a first frame outranks a sentence. Fixed on the picked plate by
#:   EDIT_MOUTH below; fixed here so a redraw cannot bring it back.
EDIT_COMMAND = """
IMAGE 1 is the photograph to edit.

Keep exactly as IMAGE 1: the same man, the same face and beard, the cap, the
earpiece in his ear and the boom mic, the armour, the kilt panel, the leggings,
the socks, the boots, the SAME futuristic rifle, the light, and the flat blue
ground.

Make ONE change: his pose. He STANDS — no longer kneeling — upright and
planted, his feet about a shoulder-width apart, his weight settled, his torso
turned a few degrees toward the LEFT of the picture. A commander giving an order
to his people: calm, certain, not shouting.

The rifle hangs LOW in the hand on the RIGHT of the picture, held by its grip at
his side, the muzzle pointing down toward the ground a little ahead of his boot,
his finger outside the trigger guard. He is not aiming.

The other arm — the hand on the LEFT of the picture — is raised and POINTS into
the distance: forward and a little to the LEFT of the picture, the arm
FORESHORTENED toward the viewer so the pointing hand stays well inside the
frame. No part of him reaches out sideways past the line of his shoulders by
more than a hand's width. His head turns toward where he points, his eyes on the
distance, his MOUTH CLOSED, lips together: he has given the order and is silent.

FRAMING 9:16: the whole standing figure, from the top of the cap to the soles.
The top of the cap about 6 % down from the top edge, the soles about 3 % up
from the bottom edge, nothing touching any edge. He is drawn at a standing man's
full height in this frame — do NOT make him smaller to fit the arm; keep the arm
foreshortened instead.

Photoreal, lit by the same light as IMAGE 1. No legible text, numbers or logos.
The ground stays one perfectly uniform blue, #0A28D2, edge to edge — no shadow,
no gradient, no floor, and no blue light on the figure.
"""


#: ADR-082 U35: the commander scene's END POSE — he looks through the rifle's
#: optic where he was pointing — drawn as a still so its framing can be checked
#: before a video is paid for (EDIT_AIM's reason, one pose on). ⚠ In IMAGE 1's
#: terms, which are the MIRROR of EDIT_COMMAND's ask: the pointing arm is on the
#: RIGHT of the picture and the rifle in the hand on the LEFT. ⚠ Standing, so the
#: feet are named as fixed: Veo interpolates from the plate to this still, and a
#: boot that moved between them would slide.
EDIT_AIM_STANDING = """
IMAGE 1 is the photograph to edit.

Keep exactly as IMAGE 1: the same man, the same face and beard, the cap, the
earpiece in his ear and the boom mic, the armour, the kilt panel, the leggings,
the socks, the boots; his STANCE — standing, both feet planted exactly where
they are; his size and his place in the picture; the light; and the flat blue
ground.

Make ONE change, to his pose above the waist: he has brought the SAME rifle up
and looks through its small optic, aiming where he was pointing. The hand on
the LEFT of the picture — the one holding the rifle in IMAGE 1 — holds the
pistol grip, the stock is in his shoulder, and the hand on the RIGHT of the
picture — the one that was pointing — now holds the rifle's front grip. His
cheek rests on the stock, his eye behind the optic, his gaze along the barrel.

He aims toward the RIGHT of the picture and a little toward the viewer:
THREE-QUARTER, so the rifle is foreshortened and SHORT in the picture. Its
muzzle stays well inside the frame, and no part of the rifle reaches out past
his own shoulders by more than a hand's width. Never aimed straight into the
lens. His mouth is closed.

The same futuristic rifle as IMAGE 1 — its shapes, its panels, its red parts —
photoreal, a used production prop, faintly scuffed, never glossy, never
glowing, lit by the same light. No legible text, numbers or logos. The ground
stays one perfectly uniform blue, #0A28D2, edge to edge — no shadow, no
gradient, and no blue light on the figure. Nothing touches a frame edge.
"""


#: ADR-082 U34: the smallest edit in the chain — the picked commander plate
#: with its mouth closed, and nothing else. See EDIT_COMMAND's ⚠ for why a
#: parted mouth is a plate a video model cannot animate in silence.
EDIT_MOUTH = """
IMAGE 1 is the photograph to edit.

Keep IMAGE 1 exactly as it is: the same man, the same face, the same beard, the
cap, the earpiece and the boom mic, the armour, the kilt, the leggings, the
socks, the boots, the rifle, the pose, BOTH arms and both hands, the framing,
his size, the light, and the flat blue ground. Do not redraw, re-light or
re-sculpt anything except his mouth.

Make ONE change: his MOUTH IS CLOSED. His lips rest together, relaxed, the jaw
settled; no teeth show. He has given the order and is silent now, calm and
certain. Nothing else in his face changes: the same eyes, the same brow, the
same gaze toward where he points.

No legible text, numbers or logos. The ground stays one perfectly uniform blue,
#0A28D2, edge to edge — no shadow, no gradient, and no blue light on the figure.
"""


#: ADR-082 U41 (owner, 2026-09-24: the Expanse "doesn't really look like me;
#: the face I mean, so please go back and recreate it as accurately as
#: possible").
#: ⚠ THE FACE DRIFTED BECAUSE NO EDIT EVER SAW A PHOTOGRAPH. The v3 plate wave
#: attached the identity crops; every hop after it (rifle → command → mouth →
#: aim-stand) attached only the plate it was editing, so each re-draw of the
#: face was a photocopy of a photocopy — the skill's Rule 0 ("identity is slot
#: 1, always; a previous output as slot 1 drifts the face") broken by
#: construction. This edit puts the photographs back beside the plate: ONE
#: change, the face, matched to them; everything else in IMAGE 1 is fixed; the
#: mouth stays CLOSED (U34's five audio refusals).
#: ⚠ THE FACE IS ALSO SAID IN WORDS, read off the photographs. A reference alone
#: let the model keep its own idea of "a bearded man in a cap": the beard the
#: shoot shows is a DENSE CHIN BEARD with near-clean cheeks, not the full even
#: beard the plate grew, and the brow, the eyes and the jaw are what make him
#: him at a glance.
FACE_LOCK = """
HIS FACE, exactly as in the identity photographs: a long oval face with a
strong, angular jaw a little wider than his temples; a heavy, straight, low-set
dark brow; deep-set, hooded dark eyes with shadowed hollows beneath them; a
straight nose with a broad bridge; a thin upper lip over a fuller lower lip.
THE BEARD IS A CHIN BEARD: a dark moustache joining a dense, full beard on the
chin and along the jawline, while the CHEEKS are nearly clean — faint stubble at
most, never a full even beard across them. The sides of his head are shaved to
the skin under the cap. Warm olive skin, a serious and contained expression,
and his MOUTH CLOSED — lips together, no teeth.
""".strip()

EDIT_FACE = """
IMAGE 1 is the photograph to edit. {idents} this man's IDENTITY — the same
person, photographed. Take his face from them.

Keep IMAGE 1 exactly as it is: the cap, the earpiece and the boom mic, the
armour, the kilt panel, the leggings, the socks, the boots, the rifle, the
pose, BOTH arms and both hands, the framing, his size and his place in the
picture, the light, and the flat blue ground. Do not redraw, re-light or
re-sculpt anything except his face.

Make ONE change: his face becomes THIS man's face, unchanged and recognisable
at a glance — matched to the identity photographs in every feature — with the
head's turn, the gaze and the light of IMAGE 1 kept.

{face}

Photoreal, real skin, no computer-graphics smoothness, lit by the same light as
IMAGE 1. No legible text, numbers or logos. The ground stays one perfectly
uniform blue, #0A28D2, edge to edge — no shadow, no gradient, and no blue light
on the figure.

DO NOT: a younger or rounder face; a full or even beard across the cheeks;
smooth or cartoon cheeks; a different nose; an open or parted mouth; a smile;
glasses; a different cap; changed lighting; blue light on the figure; any change
below the collar.
"""


#: ADR-082 U41 (owner, 2026-09-24, on the rescued face: "the face looks good,
#: but I think my body should be a bit bulkier, with broader shoulders … a
#: space helmet instead of a cap. Let's make sure you can see my face"), with
#: two frames of the production's marine helmet as the reference.
#: ⚠ TWO CHANGES IN ONE EDIT, DELIBERATELY. The chain's law is one change per
#: hop, and it holds: the helmet's padded collar sits on the shoulders it
#: joins, so a helmet drawn on the old frame and a build drawn under the old
#: helmet are two edits that each undo half of the other — and every hop is
#: one more re-draw of the face U41 just put back. The identity crops travel
#: with it, and the face is named as fixed.
#: ⚠ THE HELMET IS DESCRIBED BY ITS PROPERTIES, never by whose it is: no show,
#: no studio, and the nameplate on its brow is BLANK — a real name on that
#: plate is lettering, which this wardrobe bans.
HELMET_DESIGN = (
    "an open-faced hard-shell marine helmet: a matte dark-grey shell with thin red "
    "trim lines along its panel seams, a raised brow ridge over one small BLANK "
    "rectangular plate, small round pods at the ears, a wide clear curved visor that "
    "stands OPEN in front of the face, and a padded neck collar that joins the helmet "
    "to the chest armour"
)

EDIT_RIG = """
IMAGE 1 is the photograph to edit. {idents} this man's IDENTITY — the same
person, photographed.{designs}

Keep exactly as IMAGE 1: this man's FACE — the brow, the eyes, the nose, the
chin beard, exactly as the identity photographs — the turn of his head and his
gaze, the rifle held low in the hand on the LEFT of the picture, the pointing
arm on the RIGHT, both hands, the kilt panel, the leggings, the socks, the
boots, his stance with both feet planted where they are, his place in the
picture, the light, and the flat blue ground.

Make TWO changes, and nothing else.

ONE — HIS CAP BECOMES A HELMET: {helmet}. His WHOLE face is visible inside it,
unobstructed — no reflection, no tint and no glare across the eyes, no
breathing mask. No cap under it, no hood. The earpiece and boom mic are gone:
the helmet carries its own comms. No lettering, numbers or insignia anywhere on
it.

TWO — HE IS BULKIER, WITH BROADER SHOULDERS: a heavier build under the same
armour — the chest plate deeper and wider, larger rounded shoulder caps
standing further out, thicker plated upper arms and forearms, a thicker neck
in the collar. A marine's frame, not a bodybuilder's: his height does not
change, his boots do not move, and no part of him reaches a frame edge — the
pointing hand stays well inside the picture.

Photoreal, a used production costume, semi-matte and faintly scuffed, never
glossy, lit by the same light as IMAGE 1. The ground stays one perfectly
uniform blue, #0A28D2, edge to edge — no shadow, no gradient, and no blue
light on the figure.

DO NOT: a closed, tinted or mirrored visor; a reflection across the face; a
mask over the mouth; a cap; a different face; a younger, smaller or slimmer
man; a superhero suit; a cartoon; lettering, numbers or insignia; a change to
the rifle, the kilt, the boots, the pose or the framing.
"""


#: 2026-09-25 · the Latent Land regalia, the owner's second read (on plates D and
#: E of `20260925-genai-v6`): "I like the long cloak and I also want the golden
#: pauldrons, but I think we should be able to see my black pants and black
#: boots … I love to wear high-top boots with black jeans … a bit more
#: adventurous … the halo should be made out of parts, like broken parts
#: rotating around my head."
#: ⚠ THREE CHANGES IN ONE EDIT, each named and bounded, and the sigils, the
#:   raised hands and the long cloak listed as KEPT: an outfit edit that is not
#:   told the cloak stays long shortens it with the robe.
#: ⚠ THE HALO'S PIECES STAY ON ONE CIRCLE, at the old ring's size and centre, so
#:   the idle can turn them as one broken ring rather than scatter them.
EDIT_OUTFIT = """
IMAGE 1 is the painting to edit. {idents} this man's IDENTITY — the same person,
photographed. {jeans} his own BLACK JEANS. {boots} his own HIGH BOOTS, with the
jeans' turned-up cuff resting on one. Take only the garments from those two —
never a background, a person or a pose.

Keep exactly as IMAGE 1: this man's FACE — the brow, the eyes, the nose, the chin
beard, exactly as the identity photographs — his shaved head, his gaze on the
lens and his closed mouth; his raised forearms and open hands with his tattoos and
his ring; the small gold sigils circling his forearms and floating above his
palms; the LONG black cloak falling from his shoulders to the floor, its high
collar, the emblems on its breast; the belt of machined gold modules and its
pendant; the bracers; the light; the painted, airbrushed handling; his size and
his place in the picture; and the flat blue ground.

Make THREE changes, and nothing else.

ONE — THE PAULDRONS ARE GOLD: the same sculpted pauldrons, the same shape, size
and engraved line-work and lenses, now in polished warm GOLD rather than silver.

TWO — BELOW THE BELT: BLACK JEANS AND HIGH BOOTS. The floor-length robe is GONE.
Under the belt he wears his own relaxed, straight-cut BLACK JEANS as in {jeans_n},
their hems turned up once in a thick cuff that rests on his own worn black
leather LACE-UP HIGH BOOTS as in {boots_n}, laced to well above the ankle, on
thick lug soles. The long cloak still falls from his shoulders to the floor behind
him and at his sides, OPEN AT THE FRONT, so the jeans and the boots read clearly
from the belt to the soles. A travelling adventurer, not a priest: the leather
creased and worn, never polished parade boots. His feet stay planted where they
are, the soles on the same line as before, nothing touching a frame edge.

THREE — THE HALO IS BROKEN: the single thin ring becomes a halo of separate PARTS —
six to eight curved arc segments of the same fine warm gold light, of unequal
lengths with clean gaps between them, all on ONE circle at the old ring's size
and centre behind his head, as if the ring had broken and its pieces keep
circling him; one or two small fragments sit a little off the circle. Fine lines
with a tight soft glow. No stars, no rays, no sparkles, no second ring.

The ground stays one perfectly uniform blue, #0A28D2, edge to edge — no shadow,
no gradient, and no blue light on the figure.

DO NOT: a robe, a skirt, a kilt or trousers of any colour but black; shoes,
trainers or short boots; a shorter cloak; stars; a different face; gloves; a
change to the pose, the hands, the sigils or the framing; lettering anywhere.
"""


#: 2026-09-25 · the owner's third read, on G–L: "the halo should be made out of
#: our Thoughtform gateways. It's like that white stony material … shards, maybe
#: out of shards, not too sharp." ONE change, on the picked outfit plate; the
#: design images are crops of the site's own gateway key visuals (the ring of
#: chalky, panelled stone that erodes into fragments at its edge).
#: ⚠ THE SHARDS ARE STONE, NOT LIGHT: matte and opaque, so the chroma key reads
#:   them as solid (a glow over blue is the one thing that keys as fog).
#: ⚠ OFF-WHITE, NEVER PURE WHITE, AND LIT LIKE HIM: the gold grade lifts
#:   mid-tones hard, and a paper-white ring beside his head would be the
#:   brightest thing on the figure — "too glowing" in a new place.
#: ⚠ ONE RING, at the old halo's size and centre, so the idle can turn the
#:   pieces together and the loop can close.
EDIT_HALO = """
Keep the image exactly as it is — the same man: his face, his beard, his shaved
head, his gaze on the lens and his closed mouth; his raised forearms and open
hands with his tattoos and his ring; the small gold sigils circling his forearms
and floating above his palms; the gold pauldrons, the long open black cloak, the
emblems, the belt of machined gold modules and its pendant, the bracers, the black
jeans with their turned-up cuffs, the high lace-up boots; the light, the painted
handling, his size and his place in the picture; and the flat blue ground.

Make ONE change: THE HALO. The thin broken lines of gold light behind his head are
REPLACED by a halo of floating SHARDS OF PALE STONE — the material of the ring-shaped
structure in {designs}: a chalky, matte, warm off-white stone, faintly weathered,
engraved with fine panel lines and seams. Seven to ten curved pieces of it that
together still trace ONE ring behind his head, at the old halo's size and centre,
with clear gaps between them, and a few small chips drifting just off the ring.
The shards are CHUNKY, with SOFTENED, ERODED EDGES and rounded broken corners —
weathered stone fragments, never blades, spikes, splinters or glass. Solid and
opaque: they do NOT glow. They catch the same light as his shoulders, lit from
below and in front, with a hairline of warm light along their upper edges, so
they read as a warm pale grey-white, never paper-white. They float free: nothing
joins them to him.

The ground stays one perfectly uniform blue, #0A28D2, edge to edge — no shadow,
no gradient, and no blue light on the figure or on the stone.

DO NOT: glowing or emissive shards; lines of gold light; crystal, glass, ice or
metal; sharp points, spikes or blades; a whole unbroken ring; a crown; stars;
pure white; lettering; any change to his face, his pose, his hands, the sigils,
the costume or the framing.
"""


def halo_prompt(n_design: int) -> str:
    """The halo edit: IMAGE 1 the plate, then the gateway crops as IMAGE 2… —
    `generate.py`'s generic edit path re-bases these past the identity crops."""
    if n_design < 1:
        raise SystemExit("the halo edit needs the gateway crops as --design")
    d = [f"IMAGE {i}" for i in range(2, 2 + n_design)]
    designs = d[0] if len(d) == 1 else ", ".join(d[:-1]) + f" and {d[-1]}"
    lead = (f"{designs} show{'s' if len(d) == 1 else ''} only the MATERIAL of the halo — "
            "take the stone's colour, surface, panel lines and eroded edges; ignore the "
            "structure's size, its shape as a whole, the sky, the ground, the ink lines "
            "and any lettering around it.\n")
    return (lead + EDIT_HALO.format(designs=designs)).strip()


def outfit_prompt(n_identity: int, n_design: int) -> str:
    """The outfit edit: IMAGE 1 the plate, IMAGES 2… the identity crops, then his
    jeans and his boots (`refs.py --set outfit` lists them in that order)."""
    if n_identity < 1 or n_design != 2:
        raise SystemExit("the outfit edit needs the wave's identity crops, then HIS BLACK JEANS "
                         "and HIS HIGH BOOTS (refs.py --set outfit)")
    nums = [f"IMAGE {i}" for i in range(2, 2 + n_identity)]
    idents = f"{nums[0]} is" if len(nums) == 1 else ", ".join(nums[:-1]) + f" and {nums[-1]} are"
    j, b = 2 + n_identity, 3 + n_identity
    return EDIT_OUTFIT.format(idents=idents, jeans=f"IMAGE {j} shows", boots=f"IMAGE {b} shows",
                              jeans_n=f"IMAGE {j}", boots_n=f"IMAGE {b}").strip()


def rig_prompt(n_identity: int, n_design: int) -> str:
    """The helmet-and-build edit: IMAGE 1 the plate, IMAGES 2… the identity crops,
    then the helmet's reference frames, if any."""
    if n_identity < 1:
        raise SystemExit("the rig edit needs the wave's identity crops (refs.py --set face)")
    nums = [f"IMAGE {i}" for i in range(2, 2 + n_identity)]
    idents = (
        f"{nums[0]} is" if len(nums) == 1 else ", ".join(nums[:-1]) + f" and {nums[-1]} are"
    )
    if n_design:
        d = [f"IMAGE {i}" for i in range(2 + n_identity, 2 + n_identity + n_design)]
        dn = f"{d[0]} shows" if len(d) == 1 else ", ".join(d[:-1]) + f" and {d[-1]} show"
        designs = (
            f" {dn} only the DESIGN of the helmet — take its shapes, its visor, its trim "
            "and its colours; ignore the people wearing it, their faces, their angle, "
            "their background and any lettering on it."
        )
    else:
        designs = ""
    return EDIT_RIG.format(idents=idents, designs=designs, helmet=HELMET_DESIGN).strip()


#: The commander wears the helmet from the rig edit on (ADR-082 U41). Every
#: later lock that named the cap, the earpiece and the boom mic reads the
#: helmet instead through `headgear()`; the cap wording stays in the constants
#: as the record of the plates before it.
EXPANSE_HEADGEAR = "helmet"
HEADGEAR_WORDS: dict[str, dict[str, str]] = {
    "helmet": {
        "the cap, the earpiece in his ear and the boom mic": (
            "the open-visor helmet with his whole face visible inside it"
        ),
        "the cap, the earpiece and the boom mic": (
            "the open-visor helmet with his whole face visible inside it"
        ),
        "the cap, the kilt and the earpiece": "the helmet, the kilt",
        "presses the earpiece at his ear; he tilts his head to it and MOUTHS one short "
        "order into the boom mic": (
            "touches the side of his helmet at the ear, keying its comms; he tilts his head "
            "to it and MOUTHS one short order"
        ),
        "presses the earpiece at his ear; he tilts his head to it and MOUTHS one short order "
        "into the boom mic": (
            "touches the side of his helmet at the ear, keying its comms; he tilts his head "
            "to it and MOUTHS one short order"
        ),
        "Then that hand leaves the earpiece and takes": "Then that hand leaves the helmet and takes",
        "presses the earpiece at his ear; he tilts his head to it, LISTENING": (
            "touches the side of his helmet at the ear, keying its comms; he tilts his head "
            "to it, LISTENING"
        ),
        "The top of the cap about": "The top of the helmet about",
        "from the top of the cap to the soles": "from the top of the helmet to the soles",
        "its muzzle sits a little above the cap": "its muzzle sits a little above the helmet",
    }
}


def headgear(text: str, era: str | None) -> str:
    """Re-word a lock for the era's headgear (the Expanse's helmet since U41).
    ⚠ The locks wrap their sentences, so a phrase can carry a line break in the
    middle; every key matches across ANY whitespace, or a lock that happens to
    break on "the cap, the" keeps its cap with nothing to say so."""
    if era != "expanse" or EXPANSE_HEADGEAR != "helmet":
        return text
    import re

    for old, new in HEADGEAR_WORDS["helmet"].items():
        pattern = r"\s+".join(re.escape(w) for w in old.split())
        text = re.sub(pattern, new, text)
    return text


def face_prompt(n_identity: int) -> str:
    """The face edit: IMAGE 1 the plate, IMAGES 2… the identity crops."""
    if n_identity < 1:
        raise SystemExit("the face edit needs at least one identity crop after the plate")
    nums = [f"IMAGE {i}" for i in range(2, 2 + n_identity)]
    idents = (
        f"{nums[0]} is" if len(nums) == 1 else ", ".join(nums[:-1]) + f" and {nums[-1]} are"
    )
    return EDIT_FACE.format(idents=idents, face=FACE_LOCK).strip()


def edit_prompt(era: str, n_design: int, kind: str = "rifle", n_identity: int = 0) -> str:
    """The one-change edit for a picked plate. `n_design` is how many photographs
    of the new rifle follow IMAGE 1 (0 means the words alone carry it); `kind`
    "aim" is the scene's end pose (ADR-082 U33), "command" the standing
    commander (U34), "mouth" that commander with his mouth closed (U34), "face"
    his own face put back from `n_identity` photographs (U41), "outfit" the Latent
    Land regalia's gold pauldrons, jeans, boots and broken halo (2026-09-25)."""
    if kind == "outfit":
        if era != "genai":
            raise SystemExit("the outfit edit is authored for genai only")
        return outfit_prompt(n_identity, n_design)
    if kind == "halo":
        if era != "genai":
            raise SystemExit("the halo edit is authored for genai only")
        return halo_prompt(n_design)
    if era != "expanse":
        raise SystemExit(f"no plate edit is authored for era '{era}'")
    if kind == "face":
        return face_prompt(n_identity)
    if kind == "rig":
        return rig_prompt(n_identity, n_design)
    if kind == "aim":
        return headgear(EDIT_AIM.strip(), era)
    if kind == "command":
        return headgear(EDIT_COMMAND.strip(), era)
    if kind == "mouth":
        return headgear(EDIT_MOUTH.strip(), era)
    if kind == "aim-stand":
        return headgear(EDIT_AIM_STANDING.strip(), era)
    if n_design:
        nums = " and ".join(f"IMAGE {i}" for i in range(2, 2 + n_design))
        clause = (
            f" {nums} show only the DESIGN of the new rifle — take its shapes, "
            "panels and colours; ignore their angle, their background, their scale "
            "and any lettering on them."
        )
    else:
        clause = ""
    return EDIT_RIFLE.format(design_clause=clause, design=RIFLE_DESIGN)


#: Route A′: the Architect's own second step, as ONE change to a picked plate.
#: The owner's word for Latent Land was "too glowing"; every clause below is a
#: property of the Architect's restyle, measured, said in words.
EDIT_QUIET_HOLOGRAM = """
Keep the image exactly as it is — the same man, face, eyes, garments, pose,
framing and edges; do not redraw or re-sculpt any surface. Make ONE change:
re-present the figure as a VOLUMETRIC HOLOGRAM of warm antique-gold light on pure
black, and keep it QUIET — this same picture printed in gold light, not a glowing
statue. One hue: deep amber in the darks, rich gold in the mids, pale champagne
only on skin and polished metal. The black cloth becomes a DIM, EVEN deep amber
with its folds legible, about a third as bright as the skin. The eyes stay real
eyes with dark irises. NO white-hot fold lines, NO bright rim, NO glowing
sockets, NO bloom; a soft falloff at the outline over a few pixels. The
background is PURE #000000. No scan lines, grid, motes, chromatic split, cone,
base, frame or text.
""".strip()


def still_prompt(era: str) -> str:
    """The full lock for one era's still."""
    wardrobe = ERA_WARDROBE.get(era)
    if wardrobe is None:
        raise SystemExit(f"no wardrobe lock for era '{era}'")
    parts = [IDENTITY_HEADER, wardrobe, STYLE_HOLO_EMISSIVE_BLACK, NEGATIVES]
    pose = ERA_POSE.get(era)
    if pose is not None:
        parts.append(pose)
    return "\n\n".join(parts)


if __name__ == "__main__":
    import sys

    era = sys.argv[1] if len(sys.argv) > 1 else "genai"
    stage = sys.argv[2] if len(sys.argv) > 2 else "still"
    print(plate_prompt(era) if stage == "plate" else still_prompt(era))
