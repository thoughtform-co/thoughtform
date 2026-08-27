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

let resolved: boolean | null = null;
let started = false;
const listeners = new Set<(supported: boolean) => void>();

function settle(supported: boolean): void {
  if (resolved !== null) return;
  resolved = supported;
  for (const listener of listeners) listener(supported);
  listeners.clear();
}

function runProbe(): void {
  if (started || typeof window === "undefined" || typeof document === "undefined") return;
  started = true;

  let video: HTMLVideoElement | null = null;
  let timer = 0;

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
    video.playsInline = true;
    video.preload = "auto";
    // Never in the layout, never a paint cost: the probe is decoded, sampled
    // and dropped without ever entering the document.
    video.src = `data:video/webm;base64,${PROBE_WEBM_BASE64}`;

    const sample = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: false });
        if (!ctx || !video) {
          settle(false);
          return;
        }
        // A transparent source drawn onto a fresh (transparent) canvas leaves
        // alpha 0 where alpha is honoured, and 255 where it is ignored.
        ctx.drawImage(video, 0, 0, 1, 1);
        settle(ctx.getImageData(0, 0, 1, 1).data[3]! < 250);
      } catch {
        // A tainted or unreadable canvas tells us nothing, so assume the
        // engine cannot be trusted with alpha and keep the floor.
        settle(false);
      } finally {
        cleanup();
      }
    };

    video.addEventListener("loadeddata", sample, { once: true });
    video.addEventListener(
      "error",
      () => {
        settle(false);
        cleanup();
      },
      { once: true }
    );

    // A decoder that never fires either event must not strand the station on
    // an undecided branch.
    timer = window.setTimeout(() => {
      settle(false);
      cleanup();
    }, PROBE_TIMEOUT_MS);

    const play = video.play();
    if (play && typeof play.catch === "function") play.catch(() => {});
  } catch {
    settle(false);
    cleanup();
  }
}

if (typeof window !== "undefined") runProbe();

/** `null` until the probe settles — callers MUST treat null as unsupported. */
export function getHoloAlphaSupport(): boolean | null {
  return resolved;
}

/** Fires once with the probe's verdict; immediate if already settled. */
export function onHoloAlphaSupport(listener: (supported: boolean) => void): () => void {
  if (resolved !== null) {
    listener(resolved);
    return () => {};
  }
  runProbe();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test seam: reset the memo so a spec can drive both branches. */
export function __resetHoloAlphaSupportForTests(): void {
  resolved = null;
  started = false;
  listeners.clear();
}
