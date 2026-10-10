"""
vid — the picked still becomes an 8-second idle, through Gemini Omni Flash.

⚠ 2026-10-07: VEO 3.1 PREVIEW SHUTS DOWN 2026-10-22, AND OMNI IS A DIFFERENT API.
The three Veo 3.1 preview variants are retired by Google; the migration target
is `gemini-omni-1.1-flash`, which answers only on the Interactions API (one
POST to `/v1beta/interactions`), not `generate_videos` / predictLongRunning.
So this lane is now SDK-free like `generate.py`: one signed urllib POST, the key
in the `x-goog-api-key` header. What Veo took and Omni does not:
  * `last_frame` → a SECOND IMAGE before the text (two images then text is
    Omni's first/last-frame interpolation);
  * `negative_prompt` → folded into the prompt as "Avoid: …" (Omni has none);
  * `duration_seconds` no longer exists → the length is SAID in the prompt;
  * `person_generation`, `number_of_videos` → gone (one video per request).
⚠ UNVERIFIED BY A LIVE CALL. Omni documents first/last interpolation for TWO
images; for ONE image it documents "subject references", not "the opening
frame". An idle sends one still, so check the first idle's frame 0 against the
still before trusting it. Everything below measured on Veo (U14, U33, U34) is a
record of Veo and has not been re-measured on Omni.

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
import base64
import json
import mimetypes
import sys
import time
import urllib.error
import urllib.request
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

MODEL = "gemini-omni-1.1-flash"
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions"
FILES = "https://generativelanguage.googleapis.com/v1beta/"
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
#: 2026-10-07: the three Veo 3.1 previews shut down 2026-10-22; Omni Flash is
#: the one video model left on this lane. Whether Omni's audio filter refuses a
#: mid-word plate the same way is not yet measured: look at the MOUTH regardless.
MODELS = (MODEL,)


def part(path: Path) -> dict:
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    return {"type": "image", "data": base64.b64encode(path.read_bytes()).decode(), "mime_type": mime}


def call(url: str, key: str, body: dict | None = None, timeout: int = 900) -> bytes:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
        method="POST" if body is not None else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except urllib.error.HTTPError as err:
        if err.code in (401, 403):
            # ⚠ NAME THE KEY AND STOP — never a fallback to another one.
            raise SystemExit(
                f"the video model refused GEMINI_API_KEY (HTTP {err.code}). Stopping. Check it with:\n"
                "  python scripts/voidwalker-avatar/env.py --check GEMINI_API_KEY"
            ) from None
        raise SystemExit(f"omni {err.code}: {err.read().decode('utf-8', 'ignore')[:400]}") from None


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
                    help="the video model (Omni Flash, since the Veo previews retired)")
    # ⚠ Omni returns the clip INLINE only under 4 MB. A bigger one needs
    # `delivery: uri`, a Files API record polled to ACTIVE, then a download.
    ap.add_argument("--delivery", choices=("inline", "uri"), default="inline",
                    help="inline base64 (< 4 MB) or a Files API uri for a bigger clip")
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
    # ⚠ Omni has no `duration_seconds` and no `negative_prompt`: the length is
    # said in the prompt, and the negative rides it as an "Avoid:" clause.
    text = f"{prompt}\n\nThe clip is eight seconds long.\n\nAvoid: {negative}"
    if args.dry_run:
        ends = f"  (last frame = {last.name})" if args.scene else ""
        print(f"omni · {model} · from {still.name} -> {raw.name}{ends}\n\nPROMPT\n{text}")
        return 0
    if raw.exists():
        print(f"{raw} already on disk — kept (delete it to re-draw)")
        return 0

    key = require("GEMINI_API_KEY")
    print(f"omni · {model} · from {still.name}")

    # Two images then text is Omni's first/last-frame interpolation (Veo's
    # `last_frame`); one image then text is the idle.
    images = [part(still)] + ([part(last)] if args.scene else [])
    response_format = {"type": "video", "aspect_ratio": "9:16", "resolution": "720p"}
    if args.delivery == "uri":
        response_format["delivery"] = "uri"
    # ⚠ NO `person_generation`, NO `number_of_videos`, NO audio toggle: Omni
    # documents none of them, and draws one video per request.
    body = {"model": model, "input": images + [{"type": "text", "text": text}],
            "response_format": response_format}
    data = json.loads(call(ENDPOINT, key, body))

    video = data.get("output_video") or {}
    if video.get("data"):
        raw.write_bytes(base64.b64decode(video["data"]))
    elif video.get("uri"):
        # ⚠ The file record's shape is UNVERIFIED: polled by its `name` to
        # ACTIVE, then fetched from its `uri` with the same header, as Veo's was.
        name = video.get("name") or video["uri"].split("/v1beta/", 1)[-1].split(":", 1)[0]
        waited = 0
        while json.loads(call(FILES + name, key)).get("state") != "ACTIVE":
            time.sleep(10)
            waited += 10
            print(f"  … {waited}s")
            if waited > 900:
                raise SystemExit("the clip's file did not turn ACTIVE within 15 minutes")
        raw.write_bytes(call(video["uri"], key))
    else:
        hint = " (over 4 MB? re-run with --delivery uri)" if args.delivery == "inline" else ""
        raise SystemExit(f"omni returned no video{hint}: {json.dumps(data)[:400]}")
    print(f"  -> {raw}  {raw.stat().st_size // 1024} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
