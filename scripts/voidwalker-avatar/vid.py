"""
vid — the picked still becomes an 8-second idle, through Veo.

⚠ `last_frame` IS NOT USED, AND THAT IS A RECORDED MEASUREMENT. ADR-082 U14
tried Veo's first=last trick to close the loop and it left a seam of 15.35/255
against 14.19 of real motion — "the jump was louder than the movement". The
loop is closed by TRIMMING to the clip's own detected period instead (see
`period.py`), which took that seam to 5.69 against 15.10.

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
from prompt import IDLE_NEGATIVE, idle_prompt  # noqa: E402

MODEL = "veo-3.1-generate-preview"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wave", required=True)
    ap.add_argument("--still", default=None, help="defaults to the wave's pick.txt")
    # The era only selects an IDLE override; absent, the shared standing
    # breather is used exactly as before (ADR-082 U26).
    ap.add_argument("--era", default=None)
    args = ap.parse_args()

    root = Path(__file__).resolve().parent
    wave = root / "waves" / args.wave
    pick = args.still or (wave / "pick.txt").read_text().strip()
    still = wave / "stills" / pick
    if not still.exists():
        raise SystemExit(f"picked still not found: {still}")

    out_dir = wave / "veo"
    out_dir.mkdir(parents=True, exist_ok=True)
    raw = out_dir / "raw.mp4"
    if raw.exists():
        print(f"{raw} already on disk — kept (delete it to re-draw)")
        return 0

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=require("GEMINI_API_KEY"))
    print(f"veo · {MODEL} · from {still.name}")

    op = client.models.generate_videos(
        model=MODEL,
        prompt=idle_prompt(args.era),
        image=types.Image.from_file(location=str(still)),
        config=types.GenerateVideosConfig(
            aspect_ratio="9:16",
            resolution="720p",
            duration_seconds=8,
            negative_prompt=IDLE_NEGATIVE,
            # The figure is a hologram of a real person; the model needs this
            # to be explicit rather than inferred.
            person_generation="allow_adult",
            number_of_videos=1,
            # ⚠ NO `generate_audio` HERE. It is a Gemini Enterprise Agent
            # Platform field and the Developer API rejects the request outright
            # rather than ignoring it. The asset is muted at the element
            # anyway, so the only cost is bytes in `raw.mp4`, which never ship.
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
