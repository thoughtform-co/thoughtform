"""
refs — prepare an era's REFERENCE CROPS for a plate wave, and make them LOOKABLE.

⚠ THE LAST WAVE PAID FOR SIX DRAWS OF THE WRONG MAN. Its identity reference was
a 3/4 stage shot with the face under 1 % of the frame, and a wardrobe reference
was a group photo with four faces in it — so the model chose its own face, and
chose from four. The rule now (ADR-082 U31): every reference is CROPPED to the
one thing its role asks for, written to `waves/<wave>/refs/`, listed in
`refs.json` with `looked: false`, and set beside the others on a contact sheet.
`generate.py --stage plate` refuses the wave until a person has opened that
sheet and flipped the flags (`--looked`).

⚠ WHAT A CROP REMOVES IS AS DELIBERATE AS WHAT IT KEEPS:
  · the Starhaven painting is cut at the COLLAR — its figure has a different
    face and skin, and a bald bearded face in a reference is the strongest
    identity leak this chain has;
  · the set-visit frame loses the visitor standing to his left;
  · the group frame is cut to HIS torso — three other people are in it;
  · the stage shot of his boots loses the audience's heads.

⚠ `refs/` IS NEVER MIRRORED (the sync script excludes it by name) — it holds
crops of other people's photographs.

  python scripts/voidwalker-avatar/refs.py --era genai --wave 20260921-genai-v4
  python scripts/voidwalker-avatar/refs.py --era genai --wave 20260921-genai-v4 --looked
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

BANK = Path(r"C:\Users\buyss\.claude\skills\voidwalker-avatar\references\photo-bank\thoughtform-shoot-20251126")
DRIVE = Path(r"I:\My Drive\01_Thoughtform Branding\13_Voidwalker Pictures")
#: The owner's own avatar paintings (2026-09-25: "Here are my avatars"). Both
#: are Midjourney paintings of a bald, bearded man whose face and skin are NOT
#: his, so each is cut below its beard.
AVATARS = Path(r"I:\My Drive\01_Thoughtform Branding\05_Key Visuals\Avatars")
PAINTING = AVATARS / (
    "starhaven_Remove_the_background._And_maybe_extend_the_image_so__bfc4d908-b2c2-4faf-8e30-bfb9bb5bf043.png"
)
#: The second habit: sculpted pauldrons, a belt of machined gold modules,
#: filigree bracers. Its figure is cut at the knee and gloved.
REGALIA = AVATARS / (
    "starhaven_a_mysterious_bald_celestial_Voidwalker_with_a_short_b_48144e25-c21c-40ef-9eeb-e0edc4d14e76.png"
)
MAX_PX = 2048

#: (file written, role as the prompt addresses it, source, crop box in the
#: SOURCE's own pixels as (left, top, right, bottom) or None for the whole frame,
#: and why the box is where it is).
IDENTITY = [
    ("identity-1.jpg", "IDENTITY", BANK / "face-detail.jpg", None,
     "near-frontal, the face ~40 % of the frame; the one the likeness is judged against"),
    ("identity-2.jpg", "IDENTITY", BANK / "colour-04.jpg", (0, 0, 1143, 1010),
     "the face at a second angle and light; cut above the chest"),
]
#: ADR-082 U41 — the FACE set: the identity crops ALONE, for a face edit of a
#: picked plate (`generate.py --edit-kind face`). A THIRD angle joins the pair:
#: the commander's head is turned three-quarter, and the two near-frontal crops
#: left the model matching loosely. ⚠ NOT added to `IDENTITY` itself: every
#: plate lock numbers its wardrobe images from IMAGE 3, and a third identity
#: crop there would shift every one of those labels.
IDENTITY_FACE = IDENTITY + [
    ("identity-3.jpg", "IDENTITY", BANK / "colour-01-3q-hands.jpg", (360, 90, 820, 560),
     "the face at a third angle, three-quarter; the chin beard and the shaved sides plain"),
]
BOOTS = ("boots.jpg", "HIS BOOTS", BANK / "boots-detail.jpg", (260, 0, 1100, 585),
         "his boots on the stage; the audience's heads are below the box")
#: 2026-09-25 (owner, on the Latent Land regalia): "we should be able to see my
#: black pants and black boots … I love to wear high-top boots with black jeans".
#: ⚠ BOOTS above stops at the laces (it was cut for the Expanse's kilt and socks),
#: so this set takes a WHOLE boot with the jeans' cuff resting on it, and the
#: jeans' fit from the stage frame, cut between his jacket hem and the heads.
OUTFIT = [
    ("jeans.jpg", "HIS BLACK JEANS", BANK / "colour-05-fullbody-gema.jpg", (330, 860, 830, 1320),
     "his relaxed straight black jeans below the jacket hem; the audience's heads are below the box"),
    ("boots-high.jpg", "HIS HIGH BOOTS", BANK / "boots-detail.jpg", (450, 100, 1100, 746),
     "one whole boot, laced high, with the jeans' thick turned-up cuff resting on it"),
]
HANDS = ("hands.jpg", "HANDS", BANK / "hands-detail.jpg", None,
         "his tattoos and the signet; the paintings' hands are someone else's")
RECIPES: dict[str, list[tuple[str, str, Path, tuple[int, int, int, int] | None, str]]] = {
    # ⚠ THE LATENT LAND RECIPES TAKE THE THREE-ANGLE FACE SET (2026-09-25). The
    # owner's brief is "a realistic version of myself … my face needs to match",
    # and U41 measured that two near-frontal crops let a model match loosely. So
    # the wardrobe is IMAGE 4 and the hands IMAGE 5 here, and `PLATE_LOCK`'s two
    # genai locks number them that way; `20260921-genai-v4` (never drawn) was cut
    # on the old two-crop numbering and is superseded by `20260925-genai-v5`.
    "genai": IDENTITY_FACE + [
        ("wardrobe-paint.jpg", "WARDROBE + PAINT HANDLING", PAINTING, (0, 830, 1600, 3040),
         "the painting cut BELOW its beard (y 830; the beard ends ~795) — its face and skin are not his"),
        HANDS,
    ],
    # The second habit, as its own recipe so a wave's refs.json holds one
    # wardrobe and the lock can address it as IMAGE 4.
    "genai-regalia": IDENTITY_FACE + [
        ("wardrobe-regalia.jpg", "WARDROBE + PAINT HANDLING", REGALIA, (300, 860, 1500, 2464),
         "the painting cut BELOW its beard (y 860; the beard ends ~850) and inside its figure "
         "— its face, skin and gloved hands are not his"),
        HANDS,
    ],
    "expanse": IDENTITY + [
        ("wardrobe-silhouette.jpg", "WARDROBE SILHOUETTE",
         DRIVE / "The Expanse Set Visit" / "Expanse Fan.jpg", (170, 290, 612, 1200),
         "neck to floor; the visitor standing to his left is cut out at x 612"),
        ("armour-panels.jpg", "ARMOUR PANELS", DRIVE / "The Expanse Set Visit" / "1 (2).jpg",
         (1180, 560, 1600, 820),
         "his own torso, seated, the plates lit; the three other visitors are outside the box"),
        BOOTS,
    ],
    # 2016 · the trainer, drawn as a cel (ADR-082 U33). ⚠ NO WARDROBE PICTURE,
    # ON PURPOSE: the costume is invented from the owner's brief and lettered in
    # the lock; a reference picture of the character it echoes is exactly what
    # the no-names rule keeps out of the request. The face and the boots are his.
    "pokemon-go": IDENTITY + [BOOTS],
}


def write(src: Path, box, dst: Path) -> tuple[int, int]:
    im = Image.open(src).convert("RGB")
    if box:
        im = im.crop(box)
    im.thumbnail((MAX_PX, MAX_PX))
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, quality=92)
    return im.size


def contact(rows: list[dict], refs: Path) -> Path:
    tiles = []
    for r in rows:
        im = Image.open(refs / r["file"]).convert("RGB")
        im.thumbnail((360, 480))
        tile = Image.new("RGB", (380, 540), (17, 17, 17))
        tile.paste(im, ((380 - im.width) // 2, 8))
        d = ImageDraw.Draw(tile)
        d.text((10, 496), f"IMAGE {r['image']} — {r['role']}", fill=(235, 227, 214))
        d.text((10, 514), r["file"], fill=(160, 150, 140))
        tiles.append(tile)
    sheet = Image.new("RGB", (380 * len(tiles), 540), (17, 17, 17))
    for i, t in enumerate(tiles):
        sheet.paste(t, (380 * i, 0))
    out = refs / "contact.jpg"
    sheet.save(out, quality=88)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--era", required=True, choices=sorted(RECIPES))
    ap.add_argument("--wave", required=True)
    ap.add_argument("--looked", action="store_true",
                    help="after OPENING contact.jpg: mark every crop as looked at")
    ap.add_argument("--set", choices=("plate", "face", "outfit"), default="plate",
                    help="plate: the era's full recipe; face: the three identity crops alone "
                         "(ADR-082 U41, for `generate.py --edit-kind face`); outfit: those three "
                         "plus his jeans and his high boots (`--edit-kind outfit`, 2026-09-25)")
    args = ap.parse_args()

    refs = Path(__file__).resolve().parent / "waves" / args.wave / "refs"
    spec = refs / "refs.json"
    if args.looked:
        rows = json.loads(spec.read_text(encoding="utf-8"))
        for r in rows:
            r["looked"] = True
        spec.write_text(json.dumps(rows, indent=1), encoding="utf-8")
        print(f"marked {len(rows)} reference(s) as looked at in {spec}")
        return 0

    rows = []
    recipe = {"face": IDENTITY_FACE, "outfit": IDENTITY_FACE + OUTFIT}.get(args.set) or RECIPES[args.era]
    for n, (name, role, src, box, why) in enumerate(recipe, start=1):
        if not src.exists():
            raise SystemExit(f"reference source missing: {src}")
        size = write(src, box, refs / name)
        rows.append({"image": n, "role": role, "file": name, "source": src.name,
                     "box": list(box) if box else None, "size": list(size),
                     "why": why, "looked": False})
        print(f"  IMAGE {n} — {role:26} {name:26} {size[0]}x{size[1]}")
    spec.write_text(json.dumps(rows, indent=1), encoding="utf-8")
    print(f"\ncontact sheet: {contact(rows, refs)}\nOPEN IT, then: --looked")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
