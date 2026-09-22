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
BLOCKED: dict[str, str] = {
    # ⚠ 2016 HAS NO FIGURE OF ITS OWN (ADR-082 U31). It resolves to the canonical
    # pair today — the Architect in the Thoughtform cap, ten years early. The
    # owner will supply a photograph; the era's wardrobe lock is read OFF that
    # photograph (logos blanked, the crowd cropped out), never written first.
    "pokemon-go": (
        "no wardrobe photograph yet. It goes in "
        r"I:\My Drive\01_Thoughtform Branding\13_Voidwalker Pictures\2016_Pokemon GO"
        " — then write this era's wardrobe lock from it before drawing."
    ),
}

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

PLATE_LOCK: dict[str, str] = {
    # 2023 · the AI Captain. The owner's own painting of the character is the
    # WARDROBE and the PAINT HANDLING; its face is not his, which is why it is
    # attached cropped at the collar and why the identity images come first.
    "genai": """
IMAGE 1 and IMAGE 2 are this man's IDENTITY. IMAGE 3 is the WARDROBE and the
PAINT HANDLING — a painting cropped at the collar, headless on purpose: take its
garments and its brushwork, never a face or a skin tone from it. IMAGE 4 is his
HANDS. Draw ONE figure: this man, full length, in that wardrobe.

HIS FACE, unchanged and recognisable at a glance: a long oval face, a heavy
straight brow, hooded dark eyes with real irises, a straight nose, a short
close-trimmed beard that thins at the cheeks, his own warm olive skin.
BARE-HEADED: the head shaved to the skin — no cap, no hood, no crown.

THE HABIT, exactly as IMAGE 3: a long black cloak with a high standing collar and
a ragged hem over a floor-length black robe; a bandolier from the left shoulder
to the right hip set with small metal plates; a sash-belt closed by ONE LARGE
ROUND GOLD DISC; a smaller gold boss at the breast; THICK STACKED GOLD CUFFS
three bands deep on both forearms; two medallions on a fine chain; a slim
gold-banded rod WORN at the hip inside the line of the cloak — never held, never
projecting past it. His hands are EMPTY and hang at his sides, backs to the
camera, with his own tattoos and his gold signet ring as in IMAGE 4.

THE HALO: a thin gold ring behind his head with five or six small FOUR-POINTED
stars set ON the ring — fine line and solid shapes. No glow, no sparkle dust.

PAINTED as heroic cinema key art: acrylic over a tight pencil drawing, realism
first. Confident brushwork in the cloth, tighter in the face and the metal.
Sculpted values, decisive edges. The blacks are PAINTED AS CLOTH.

LIT by two fixtures only: a broad soft white bounce below the camera as the KEY,
reaching into every fold, so the black cloth reads dark-to-mid charcoal and
nothing is crushed; and one small hard warm source high to camera-right, drawing
a HAIRLINE rim on the crown and the tops of the shoulders only.

CAMERA LOW, at hip height, tilted up a little; 85mm or longer.

FRAMING 9:16: the whole figure, from the highest star to the soles. The top of
the skull about 11 % down from the top edge, the soles about 5 % up from the
bottom edge, and nothing touching any edge. If he does not fit, make him smaller.

DO NOT: a hologram, a glow, glowing eyes, gold-tinted skin, a monochrome image;
a rock, a ledge, sand, a floor, a shadow; blue light on the figure; text or a
signature; a crop; a second figure; anything held in his hands.
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
}


def plate_prompt(era: str) -> str:
    """The full lock for one era's COLOUR PLATE — the two-step route's first half."""
    lock = PLATE_LOCK.get(era)
    if lock is None:
        raise SystemExit(f"no plate lock for era '{era}'")
    return lock + "\n\n" + KEY_GROUND


#: The idle for a PLATE (Veo image-to-video). The ground is the key colour now,
#: so the invariant is that it STAYS the key colour — a ground that drifts in
#: value is a matte that drifts with it.
PLATE_IDLE: dict[str, tuple[str, str]] = {
    "genai": (
        "A slow, shallow breath under the cloak; the hem stirs and settles; one slow "
        "blink — that is everything",
        "his feet, his head, his eyes on the lens, his arms, all the metalwork, the ring "
        "of stars (a fixed object: no rotation, no twinkle, no pulse), and THE PAINT "
        "(the brushwork is fixed to the cloth like a printed surface; it never shimmers "
        "and it is never repainted)",
    ),
    "expanse": (
        "He holds the kneel and breathes; once he presses the earpiece a little more "
        "firmly; his eyes flick to the right and return; one small nod; one blink",
        "the planted knee and the flat boot, the rifle VERTICAL (no sway, no tilt, no "
        "lowering, no aiming), the raised elbow, the cap and the kilt, the closed mouth, "
        "and all of him inside the frame",
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


def plate_idle_prompt(era: str, prop_wording: bool = False) -> str:
    """The idle clause for a plate. `prop_wording` is the one re-word the chain
    allows if the video model refuses a weapon beside a real face; a second
    refusal means that era ships its poster only."""
    action, still = PLATE_IDLE[era]
    if prop_wording:
        action = action.replace("rifle", "costume prop carbine")
        still = still.replace("rifle", "costume prop carbine")
    return (
        f"LOCKED STATIC FRAME on a heavy tripod. {action}. WHAT STAYS STILL: {still}. "
        "The background is a FLAT UNIFORM BLUE, the same value in every corner on every "
        "frame. The lighting does not change. Real time."
    )


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


def edit_prompt(era: str, n_design: int) -> str:
    """The one-change edit for a picked plate. `n_design` is how many photographs
    of the new rifle follow IMAGE 1 (0 means the words alone carry it)."""
    if era != "expanse":
        raise SystemExit(f"no plate edit is authored for era '{era}'")
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
