---
name: cdaf
description: Read a video's CDAF sidecar (.cdaf) instead of watching it, and file every new video read as one so it is paid for once. Use BEFORE analysing any video file (.mp4 .mov .mkv .webm .avi .m4v), whether Vince's Loom feedback, a moodboard reference clip, a screen recording or footage; when he says he recorded a video; when a question needs what an earlier video said or showed ("what did I say about Tensorlake", "find the clip where…"); or when asked what videos have already been analysed.
---

# CDAF: video reads, paid once

A `.cdaf` sidecar is a plain-text, timestamped account of one exact video,
anchored to it by `bytes` and `sha256` in its header. Reading it costs a few
thousand tokens; watching the video again costs ~6K tokens a minute. Format:
[CDAF v1.0](https://github.com/UditAkhourii/cdaf) (MIT, Udit Akhouri); this
skill adapts its upstream skill to this repo.

## Where reads live

- **The library: `docs/video-reads/*.cdaf`**, versioned, readable from any
  session, cloud ones included. Named `<slug>-<sha8>.cdaf`; matched to a video
  by size then hash, so a renamed or moved video still finds its read.
- **Beside the video**, the spec's own place (`clip.mp4` → `clip.cdaf`), e.g. in
  `I:\My Drive\01_Thoughtform Branding\10_Websites\00_UI Moodboard\`. Same bytes
  as the library copy.
- `docs/video-reads/README.md` lists what has been read.

## The rule

Before analysing any video:

1. `node scripts/video-read/cdaf.mjs read "<video>"` prints the fresh read
   (beside it or in the library) and refuses a stale one. Exit 1 means none.
2. Fresh: answer from the read. Do not upload the video.
3. Missing or stale: generate one (below), then answer from it.
4. Looking for something across videos: `node scripts/video-read/cdaf.mjs find <word>...`,
   or grep `docs/video-reads/` directly. Never open videos to search.

`status <dir>` reports FRESH / STALE / MISSING for every video under a folder.

## Generating a read

```bash
node scripts/video-read/cdaf.mjs generate "<video-or-folder>" --profile feedback --context "what this is"
```

- **Profiles** set the extra sections after the spec's Summary, Segments,
  Transcript, On-screen Text and Tags: `feedback` (his Loom reviews: Screen Log
  with LIKE/DISLIKE/CHANGE verdicts, Change Requests, Synthesis), `reference`
  (sites or clips he points at: Site Log with the URL off the address bar,
  Properties, Synthesis), `diagrams` (Diagram Log of construction, Rules),
  `footage` (spec sections only).
- Gemini 3.1 Pro (preview) through the Files API, falling back to 2.5 Pro;
  `GEMINI_API_KEY` from the canonical `.env` (override with `CDAF_ENV` or the
  env var). Skips videos that already have a fresh read; `--force` redoes one.
- Writes the library copy and the beside copy (`--no-beside` to skip), and
  prints the token cost. Commit the library file.
- More than a handful of long videos: say how many and roughly what it costs
  before running.
- Never hand-edit a `.cdaf` body: the hash then vouches for words no model
  wrote. Regenerate instead. Header `x-` keys are free to add.

## How far to trust a fresh read

Fresh proves it describes these bytes, not that it is right.

- **His verdicts are the record; the Summary and Synthesis are a model's
  reading of them.** Quote the Transcript or the log row when it matters.
- Timestamps are approximate (a second or so). Check the frame before cutting
  on one: `ffmpeg -ss <t> -i "<video>" -frames:v 1 frame.png`.
- A model can narrate what a clip implies but never shows, and misreads small
  text and fine visual state. When a decision rests on one detail, look at
  that frame, not the whole video.
- `x-folded-from` marks a read converted from an older markdown read; its
  Segments were rebuilt from that read's log and gaps point at the Transcript.
