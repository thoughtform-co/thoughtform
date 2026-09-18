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
Use the FIRST reference image for this man's identity and the SECOND for his
wardrobe. Draw ONE figure: him, wearing that wardrobe.
""".strip()

ERA_WARDROBE: dict[str, str] = {
    # 2022 · "The AI Captain" · the Starhaven era.
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
WARDROBE — 2022, the AI Captain, in the Starhaven captain's habit exactly as in
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
    # ⚠ BLOCKED, AND IT MUST STAY BLOCKED UNTIL THE PHOTOGRAPHS EXIST LOCALLY.
    # `13_Voidwalker Pictures/The Expanse Set Visit/` and `MCRN/Exports/` both
    # enumerate ZERO files on this machine. ADR-082 U14 records what running a
    # wardrobe through an image model with no picture to point at produces: a
    # generic cowl, invented spires and a nondescript sword — "a paraphrase".
    # `run.py` refuses this era rather than drawing a generic sci-fi soldier.
    "expanse": """
WARDROBE — 2018, on the set visit, in the armour exactly as photographed in the
second reference image.

A hard-shell vacuum suit in the Martian naval pattern: a matte dark armoured
spacesuit over a ribbed pressure underlayer; a segmented hard chest plate;
shoulder caps and upper-arm plates; articulated forearm gauntlets with a wrist
console; a sectioned waist and hip belt; armoured thigh and shin plates; heavy
boots. Military-utilitarian — riveted, panelled, matte, worn. Not glossy, not
superhero armour, not a cape.

THE COLLAR RING IS OPEN AND HIS HEAD IS BARE. He carries no helmet and wears no
cap, no hood and no visor — his face is fully visible and unobstructed.
""".strip(),
}

#: Eras whose wardrobe reference is not on this machine. `run.py` refuses them.
BLOCKED: dict[str, str] = {
    "expanse": (
        "the set-visit photographs are not available offline — "
        "'13_Voidwalker Pictures/The Expanse Set Visit/' and 'MCRN/Exports/' "
        "both enumerate zero files. A words-only wardrobe produces a generic "
        "sci-fi soldier (ADR-082 U14's recorded v1 failure)."
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

IDLE_NEGATIVE = (
    "camera movement, pan, tilt, zoom, dolly, orbit, handheld shake; walking, "
    "stepping, turning, gesturing, talking; particles, smoke, light rays, "
    "flicker, exposure change; background, floor, set, shadow; text, watermark; "
    "a second figure; the figure leaving the frame; cropped feet"
)


def still_prompt(era: str) -> str:
    """The full lock for one era's still."""
    wardrobe = ERA_WARDROBE.get(era)
    if wardrobe is None:
        raise SystemExit(f"no wardrobe lock for era '{era}'")
    return "\n\n".join([IDENTITY_HEADER, wardrobe, STYLE_HOLO_EMISSIVE_BLACK, NEGATIVES])


if __name__ == "__main__":
    import sys

    era = sys.argv[1] if len(sys.argv) > 1 else "genai"
    print(still_prompt(era))
