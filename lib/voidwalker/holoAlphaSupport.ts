/**
 * holoAlphaSupport — does this engine actually HONOUR alpha in a VP9/WebM?
 *
 * ⚠ `canPlayType` CANNOT ANSWER THIS, AND SOURCE ORDER IS A TRAP.
 * Safari 14.1+ plays VP9-in-WebM but does not composite its alpha channel, so
 * a plain `<source>` list with the WebM first hands Safari a file whose black
 * ground arrives OPAQUE — strictly worse than the additive floor path it has
 * today. Every codec-string query ("video/webm; codecs=vp9") returns
 * "probably" there, because the codec really is supported; only the alpha is
 * not. So the one honest test is to decode a known-transparent frame and read
 * the pixel back.
 *
 * The probe is a 581-byte, 2x2, single-frame VP9/WebM whose alpha is zero
 * everywhere (`alpha_mode=1` in the container). If the engine honours alpha,
 * the pixel drawn to a canvas reads back with alpha < 255. If it ignores
 * alpha, the pixel is opaque and we stay on the floor path.
 *
 * ⚠ AND THE SAME QUESTION HAS A SECOND ANSWER NOW (ADR-082 U23). Safari can
 * composite alpha — out of HEVC in a QuickTime container, which it is alone in
 * reading — so a NO here is no longer the end of the road: it chains into a
 * second probe of exactly the same shape. `canPlayType` is the same trap one
 * codec over (`video/quicktime; codecs="hvc1"` answers "probably" whether or
 * not the alpha is honoured), so the second lane decodes a frame too.
 *
 * Timing: this runs once, on first import, on the client. `#voidwalker` is far
 * down the corridor, so the result is settled long before the station mounts.
 * Anything that asks before it settles gets `null` and MUST choose the
 * fail-safe (non-alpha) branch — the same fail-static discipline the rest of
 * this station follows.
 */

/** 2x2, one frame, alpha 0 everywhere. Generated with:
 *  `ffmpeg -f lavfi -i "color=c=white:s=2x2:d=0.2:r=5"
 *   -vf "format=yuva420p,colorchannelmixer=aa=0"
 *   -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 40 -b:v 0 -an` */
const PROBE_WEBM_BASE64 =
  "GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAIVEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggEpTbuMU6uEHFO7a1OsggH/7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjIuMTIuMTAwV0GNTGF2ZjYyLjEyLjEwMESJiEBpAAAAAAAAFlSua8yuAQAAAAAAAEPXgQFzxYik2LcPUeNTqZyBACK1nIN1bmSIgQCGhVZfVlA5g4EBI+ODhAvrwgDglLCBArqBApqBAlPAgQFVsIRVuYEBElTDZ0CAc3OgY8CAZ8iaRaOHRU5DT0RFUkSHjUxhdmY2Mi4xMi4xMDBzc9pjwItjxYik2LcPUeNTqWfIpUWjh0VOQ09ERVJEh5hMYXZjNjIuMjguMTAwIGxpYnZweC12cDlnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAwLjIwMDAwMDAwMAAfQ7Z1y+eBAKDGoZ+BAAAAgkmDQgAAEAAWADgkHBiMAAAgAAARv//ZAAAAdaGipqDugQGlm4JJg0IAABAAFgA4JBwYjAAAIAAAEb//92wAABxTu2uRu4+zgQC3iveBAfGCAa/wgQM=";

const PROBE_TIMEOUT_MS = 3000;

/** The HEVC-alpha probe is the same 2x2 transparent frame in a QuickTime
 *  container, `hvc1`-tagged. ⚠ IT IS A STATIC ASSET, NOT A DATA URI, and that
 *  is deliberate twice over: an HEVC `.mov`'s parameter sets and `moov` box
 *  make it several KB of base64 in the landing bundle where the VP9 probe is
 *  581 bytes, and Safari's handling of `data:` media is itself the one failure
 *  mode that would settle `false` and silently change nothing. Generated with:
 *  `ffmpeg -f lavfi -i "color=c=white:s=2x2:d=0.2:r=5"
 *   -vf "format=rgba,colorchannelmixer=aa=0,format=bgra"
 *   -c:v hevc_videotoolbox -alpha_quality 0.9 -allow_sw 1 -tag:v hvc1` */
const PROBE_HEVC_SRC = "/videos/voidwalker/holo-alpha-probe-hevc.mov";

interface Verdict {
  resolved: boolean | null;
  started: boolean;
  listeners: Set<(supported: boolean) => void>;
}

const vp9: Verdict = { resolved: null, started: false, listeners: new Set() };
const hevc: Verdict = { resolved: null, started: false, listeners: new Set() };

function settleVerdict(verdict: Verdict, supported: boolean): void {
  if (verdict.resolved !== null) return;
  verdict.resolved = supported;
  for (const listener of verdict.listeners) listener(supported);
  verdict.listeners.clear();
}

/**
 * Decode one known-transparent frame and read the pixel back. Shared by both
 * codecs because the QUESTION is the same — does this engine composite the
 * alpha channel — and only the file differs.
 */
function probe(verdict: Verdict, src: string, onSettled?: (supported: boolean) => void): void {
  if (verdict.started || typeof window === "undefined" || typeof document === "undefined") return;
  verdict.started = true;

  let video: HTMLVideoElement | null = null;
  let timer = 0;

  const done = (supported: boolean) => {
    settleVerdict(verdict, supported);
    onSettled?.(supported);
  };

  const cleanup = () => {
    window.clearTimeout(timer);
    if (video) {
      video.removeAttribute("src");
      video.load();
      video = null;
    }
  };

  try {
    video = document.createElement("video");
    video.muted = true;
    // ⚠ BOTH, AND iOS NEEDS BOTH: it refuses programmatic play without them.
    video.playsInline = true;
    video.preload = "auto";
    // Never in the layout, never a paint cost: the probe is decoded, sampled
    // and dropped without ever entering the document.
    video.src = src;

    const sample = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: false });
        if (!ctx || !video) {
          done(false);
          return;
        }
        // A transparent source drawn onto a fresh (transparent) canvas leaves
        // alpha 0 where alpha is honoured, and 255 where it is ignored.
        ctx.drawImage(video, 0, 0, 1, 1);
        done(ctx.getImageData(0, 0, 1, 1).data[3]! < 250);
      } catch {
        // A tainted or unreadable canvas tells us nothing, so assume the
        // engine cannot be trusted with alpha and keep the floor.
        done(false);
      } finally {
        cleanup();
      }
    };

    video.addEventListener("loadeddata", sample, { once: true });
    video.addEventListener(
      "error",
      () => {
        done(false);
        cleanup();
      },
      { once: true }
    );

    // A decoder that never fires either event must not strand the station on
    // an undecided branch.
    timer = window.setTimeout(() => {
      done(false);
      cleanup();
    }, PROBE_TIMEOUT_MS);

    const play = video.play();
    if (play && typeof play.catch === "function") play.catch(() => {});
  } catch {
    done(false);
    cleanup();
  }
}

/**
 * ⚠ THE HEVC PROBE IS CHAINED BEHIND THE VP9 ONE, NEVER RACED WITH IT. Where
 * VP9 alpha works — Chromium, Firefox, i.e. every engine the CI has — the
 * second probe never runs, so those engines pay no extra request and no extra
 * decode, and a tie can never be resolved in favour of the larger, newer,
 * less-guarded source. It runs only where the first one answered NO, which is
 * Safari, which is the branch it exists for.
 */
function runProbe(): void {
  probe(vp9, `data:video/webm;base64,${PROBE_WEBM_BASE64}`, (supported) => {
    if (!supported) probe(hevc, PROBE_HEVC_SRC);
    else settleVerdict(hevc, false);
  });
}

if (typeof window !== "undefined") runProbe();

/** `null` until the probe settles — callers MUST treat null as unsupported. */
export function getHoloAlphaSupport(): boolean | null {
  return vp9.resolved;
}

/** Fires once with the probe's verdict; immediate if already settled. */
export function onHoloAlphaSupport(listener: (supported: boolean) => void): () => void {
  if (vp9.resolved !== null) {
    listener(vp9.resolved);
    return () => {};
  }
  runProbe();
  vp9.listeners.add(listener);
  return () => vp9.listeners.delete(listener);
}

/** The Safari branch's verdict: does this engine composite HEVC alpha out of a
 *  QuickTime container? `null` until settled, and callers treat null as the
 *  floor exactly as they do for VP9. ⚠ It is `false` — not `null` — wherever
 *  VP9 alpha already works, because the chain settles it there without a
 *  decode; a caller must never read this as "HEVC was tried and failed". */
export function getHoloHevcAlphaSupport(): boolean | null {
  return hevc.resolved;
}

/** Fires once with the HEVC verdict; immediate if already settled. */
export function onHoloHevcAlphaSupport(listener: (supported: boolean) => void): () => void {
  if (hevc.resolved !== null) {
    listener(hevc.resolved);
    return () => {};
  }
  runProbe();
  hevc.listeners.add(listener);
  return () => hevc.listeners.delete(listener);
}

/** Test seam: reset BOTH memos so a spec can drive every branch. */
export function __resetHoloAlphaSupportForTests(): void {
  for (const verdict of [vp9, hevc]) {
    verdict.resolved = null;
    verdict.started = false;
    verdict.listeners.clear();
  }
}
