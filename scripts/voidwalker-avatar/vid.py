"""
vid — the picked still becomes an 8-second idle, through Veo.

⚠ `last_frame` IS NOT USED FOR AN IDLE, AND THAT IS A RECORDED MEASUREMENT.
ADR-082 U14 tried Veo's first=last trick to close the loop and it left a seam of
15.35/255 against 14.19 of real motion — "the jump was louder than the
movement". An idle's loop is closed by TRIMMING to the clip's own detected
period instead (see `period.py`), which took that seam to 5.69 against 15.10.

⚠ A SCENE IS THE ONE PLACE IT IS USED (`--scene`, ADR-082 U33, owner: "he looks
around, turns his head like he's scouting … and then takes his gun to aim").
An action that big cannot return to its own first frame by luck in eight
seconds, so the plate is passed as BOTH ends. What U14 measured still holds —
the model lands near the frame, not on it — which is why a scene is written to
HOLD at both ends and `post.py --loop settle` dissolves the residual drift onto
frame 0 afterwards, gated against the held second rather than the action.

⚠ THE STILL IS THE STYLE. Per-frame restyling through the image model was
measured and rejected (U14): two calls on the SAME frame differ by 19.6/255
while two ADJACENT frames differ by 5.0, so a per-frame batch buries the
animation in strobe. One still, animated.
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from env import require  # noqa: E402
from prompt import (  # noqa: E402
    IDLE_NEGATIVE,
    idle_prompt,
    plate_idle_negative,
    plate_idle_prompt,
    plate_scene_negative,
    plate_scene_prompt,
)

MODEL = "veo-3.1-generate-preview"
#: ⚠ VEO 3 ALWAYS DRAWS A SOUNDTRACK, AND IT CAN REFUSE A CLIP ON IT ALONE
#: (ADR-082 U34). The standing commander was refused five times — "an issue with
#: the audio for your prompt", uncharged — through a directed near-silence, a
#: physical-only action, the prop re-wording and a "his lips stay closed"
#: clause: the refusal followed the PICTURE, not the words. The plate had caught
#: him MID-WORD, and a speaking man gets a voice; closing the mouth on the plate
#: (`generate.py --edit-kind mouth`) rendered on the first try. ⚠ Veo 2 (which
#: draws no audio) answers 404 for this key: the key serves the three Veo 3.1
#: variants only (`ListModels`), so `--model` picks among those (the lite one
#: rejects `negativePrompt`).
MODELS = ("veo-3.1-generate-preview", "veo-3.1-fast-generate-preview", "veo-3.1-lite-generate-preview")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wave", required=True)
    ap.add_argument("--still", default=None, help="defaults to the wave's pick.txt")
    # The era only selects an IDLE override; absent, the shared standing
    # breather is used exactly as before (ADR-082 U26).
    ap.add_argument("--era", default=None)
    # ADR-082 U31: a PLATE is a colour figure on the key ground. It animates
    # with the ground-hold prompt, and the gold comes afterwards, per frame,
    # from gold.py — never from the video model.
    ap.add_argument("--stage", choices=("still", "plate"), default="still")
    ap.add_argument(
        "--prop-wording",
        action="store_true",
        help="plate stage: the one re-word allowed if the model refuses a weapon beside a real face",
    )
    ap.add_argument(
        "--scene",
        action="store_true",
        help="plate stage: the era's SCENE, drawn with the plate as its first AND last frame",
    )
    # ⚠ ADR-082 U33, after take 1 aimed sideways off the frame: the scene can
    # end on a DRAWN still instead of coming home, and loops as a ping-pong.
    ap.add_argument("--ending", choices=("home", "aim"), default="home",
                    help="scene: back to the first frame, or on to the drawn aim still (--last)")
    ap.add_argument("--last", default=None,
                    help="scene: the last frame, a file in the wave's plates/ (default: the plate itself)")
    # ⚠ ADR-082 U35: the fallback when the MOUTHED order is refused on its audio —
    # he listens at the earpiece and nods, lips closed. Named apart on disk.
    ap.add_argument("--listen", action="store_true",
                    help="scene (--ending aim): the listening take instead of the mouthed order")
    ap.add_argument("--model", choices=MODELS, default=MODEL,
                    help="the Veo variant (the default is the full model)")
    ap.add_argument("--dry-run", action="store_true", help="print the request, send nothing")
    args = ap.parse_args()
    model = args.model

    root = Path(__file__).resolve().parent
    wave = root / "waves" / args.wave
    pick = args.still or (wave / "pick.txt").read_text().strip()
    plate = args.stage == "plate"
    still = wave / ("plates" if plate else "stills") / pick
    if not still.exists():
        raise SystemExit(f"picked {'plate' if plate else 'still'} not found: {still}")
    if plate and not args.era:
        raise SystemExit("the plate stage needs --era (the idle is authored per era)")
    if args.scene and not plate:
        raise SystemExit("--scene is a plate-stage option")
    last = (wave / "plates" / args.last) if args.last else still
    if args.scene and not last.exists():
        raise SystemExit(f"the scene's last frame is not on disk: {last}")
    if args.ending == "aim" and last == still:
        raise SystemExit("--ending aim needs --last, the drawn aim still")

    if args.listen and not (args.scene and args.ending == "aim"):
        raise SystemExit("--listen is the aim scene's fallback: pass --scene --ending aim")
    if args.scene:
        prompt = plate_scene_prompt(args.era, args.prop_wording, args.ending, args.listen)
        negative = plate_scene_negative(args.era)
        if args.prop_wording:
            negative = negative.replace("rifle", "costume prop carbine")
    elif plate:
        prompt = plate_idle_prompt(args.era, args.prop_wording)
        negative = plate_idle_negative(args.era)
        if args.prop_wording:
            negative = negative.replace("rifle", "costume prop carbine")
    else:
        prompt = idle_prompt(args.era)
        negative = IDLE_NEGATIVE

    out_dir = wave / "veo"
    out_dir.mkdir(parents=True, exist_ok=True)
    # A plate's clip is named for the plate: a second pick must not find the
    # first pick's clip on disk and "keep" it. A scene is named apart from an
    # idle of the same plate for the same reason.
    stem = Path(pick).stem + (
        f".scene{'-aim' if args.ending == 'aim' else ''}{'-listen' if args.listen else ''}"
        if args.scene
        else ""
    )
    raw = out_dir / (f"{stem}.raw.mp4" if plate else "raw.mp4")
    if args.dry_run:
        ends = f"  (last_frame = {last.name})" if args.scene else ""
        print(f"veo · {model} · from {still.name} -> {raw.name}{ends}\n\nPROMPT\n{prompt}\n\nNEGATIVE\n{negative}")
        return 0
    if raw.exists():
        print(f"{raw} already on disk — kept (delete it to re-draw)")
        return 0

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=require("GEMINI_API_KEY"))
    print(f"veo · {model} · from {still.name}")

    extra = {"last_frame": types.Image.from_file(location=str(last))} if args.scene else {}
    extra["resolution"] = "720p"
    op = client.models.generate_videos(
        model=model,
        prompt=prompt,
        image=types.Image.from_file(location=str(still)),
        config=types.GenerateVideosConfig(
            aspect_ratio="9:16",
            duration_seconds=8,
            negative_prompt=negative,
            # The figure is a hologram of a real person; the model needs this
            # to be explicit rather than inferred.
            person_generation="allow_adult",
            number_of_videos=1,
            # ⚠ NO `generate_audio` HERE. It is a Gemini Enterprise Agent
            # Platform field and the Developer API rejects the request outright
            # rather than ignoring it. The asset is muted at the element
            # anyway, so the only cost is bytes in `raw.mp4`, which never ship.
            **extra,
        ),
    )

    waited = 0
    while not op.done:
        time.sleep(10)
        waited += 10
        op = client.operations.get(op)
        print(f"  … {waited}s")
        if waited > 900:
            raise SystemExit("veo did not finish within 15 minutes")

    if getattr(op, "error", None):
        raise SystemExit(f"veo failed: {op.error}")

    videos = op.response.generated_videos
    if not videos:
        raise SystemExit(f"veo returned no video: {op.response}")

    client.files.download(file=videos[0].video)
    videos[0].video.save(str(raw))
    print(f"  -> {raw}  {raw.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
