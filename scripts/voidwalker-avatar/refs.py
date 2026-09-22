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
PAINTING = Path(
    r"C:\Users\buyss\Downloads"
    r"\starhaven_Remove_the_background._And_maybe_extend_the_image_so__bfc4d908-b2c2-4faf-8e30-bfb9bb5bf043.png"
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
BOOTS = ("boots.jpg", "HIS BOOTS", BANK / "boots-detail.jpg", (260, 0, 1100, 585),
         "his boots on the stage; the audience's heads are below the box")
RECIPES: dict[str, list[tuple[str, str, Path, tuple[int, int, int, int] | None, str]]] = {
    "genai": IDENTITY + [
        ("wardrobe-paint.jpg", "WARDROBE + PAINT HANDLING", PAINTING, (0, 830, 1600, 3040),
         "the painting cut BELOW its beard (y 830; the beard ends ~795) — its face and skin are not his"),
        ("hands.jpg", "HANDS", BANK / "hands-detail.jpg", None,
         "his tattoos and the signet; the painting's hands are someone else's"),
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
    for n, (name, role, src, box, why) in enumerate(RECIPES[args.era], start=1):
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
