"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GALLERY_RUNS, type GalleryAsset } from "./galleryManifest";

/** The backdrops worth judging a hologram against.
 *
 *  ⚠ `void` AND `parchment` ARE THE TWO THAT DECIDE. ADR-058 swaps the theme
 *  tokens, so a figure that reads on black can vanish on paper — additive
 *  light does not exist on parchment, which is why the production sheet gives
 *  the light theme a dark projection well. `checker` is the honesty check: it
 *  is the only backdrop on which a matte hole cannot hide. */
const BACKDROPS = [
  { id: "void", label: "Void (dark theme)" },
  { id: "parchment", label: "Parchment (light theme)" },
  { id: "checker", label: "Checkerboard (matte honesty)" },
  { id: "corridor", label: "Corridor-ish gradient" },
  { id: "white", label: "White" },
] as const;
type BackdropId = (typeof BACKDROPS)[number]["id"];

const STATUS_TONE: Record<string, string> = {
  SHIPPING: "hg-status--ship",
  SUPERSEDED: "hg-status--super",
  REJECTED: "hg-status--reject",
  INTERMEDIATE: "hg-status--inter",
};

export function HoloGalleryShell() {
  const [backdrop, setBackdrop] = useState<BackdropId>("void");
  const [raster, setRaster] = useState(true);
  const [blend, setBlend] = useState(true);
  const [scan, setScan] = useState(3);
  const [alphaFirst, setAlphaFirst] = useState(true);
  const [scale, setScale] = useState(340);
  const [playing, setPlaying] = useState(true);
  const [missing, setMissing] = useState<string[]>([]);

  const videos = useRef(new Map<string, HTMLVideoElement>());

  const registerVideo = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) videos.current.set(id, el);
    else videos.current.delete(id);
  }, []);

  const noteMissing = useCallback((file: string) => {
    setMissing((prev) => (prev.includes(file) ? prev : [...prev, file]));
  }, []);

  // Play/pause every video from one control. Videos are `muted` + `playsInline`
  // so autoplay is permitted; `play()` still rejects if the element is detached
  // mid-toggle, which is why the promise is swallowed rather than awaited.
  useEffect(() => {
    for (const el of videos.current.values()) {
      if (playing) void el.play().catch(() => {});
      else el.pause();
    }
  }, [playing]);

  const totalMb = useMemo(
    () =>
      GALLERY_RUNS.reduce(
        (sum, r) => sum + r.assets.reduce((s, a) => s + (a.mb ?? 0), 0),
        0
      ).toFixed(1),
    []
  );

  return (
    <div className="hg" data-backdrop={backdrop}>
      <header className="hg__head">
        <div className="hg__head__title">
          <h1>Voidwalker hologram gallery</h1>
          <p>
            Every asset ever produced for the <code>#voidwalker</code> station, in one place.{" "}
            {GALLERY_RUNS.length} runs · {GALLERY_RUNS.reduce((n, r) => n + r.assets.length, 0)}{" "}
            assets · ~{totalMb} MB of media.
          </p>
        </div>

        <div className="hg__controls">
          <label className="hg__ctl">
            <span>Backdrop</span>
            <select value={backdrop} onChange={(e) => setBackdrop(e.target.value as BackdropId)}>
              {BACKDROPS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>

          <label className="hg__ctl hg__ctl--check">
            <input type="checkbox" checked={raster} onChange={(e) => setRaster(e.target.checked)} />
            <span>Scanline raster</span>
          </label>

          <label className="hg__ctl">
            <span>Scan pitch {scan}px</span>
            <input
              type="range"
              min={2}
              max={8}
              step={1}
              value={scan}
              disabled={!raster}
              onChange={(e) => setScan(Number(e.target.value))}
            />
          </label>

          <label className="hg__ctl hg__ctl--check">
            <input type="checkbox" checked={blend} onChange={(e) => setBlend(e.target.checked)} />
            <span>
              <code>plus-lighter</code> blend
            </span>
          </label>

          <label className="hg__ctl hg__ctl--check">
            <input
              type="checkbox"
              checked={alphaFirst}
              onChange={(e) => setAlphaFirst(e.target.checked)}
            />
            <span>Prefer alpha source</span>
          </label>

          <label className="hg__ctl">
            <span>Size {scale}px</span>
            <input
              type="range"
              min={180}
              max={620}
              step={20}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            />
          </label>

          <button type="button" className="hg__btn" onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause all" : "Play all"}
          </button>
        </div>
      </header>

      {missing.length > 0 && (
        <div className="hg__warn">
          <strong>{missing.length} asset(s) did not load.</strong> Most entries here are served from{" "}
          <code>public/_previews/voidwalker-avatar/</code>, which is <em>gitignored</em> — a
          per-machine mirror of the offline skill&rsquo;s wave folders. Populate it with:
          <pre>node scripts/sync-voidwalker-avatar-preview.mjs</pre>
          <details>
            <summary>Missing files</summary>
            <ul>
              {missing.map((m) => (
                <li key={m}>
                  <code>{m}</code>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {GALLERY_RUNS.map((run) => (
        <section key={run.id} className="hg__run">
          <div className="hg__run__head">
            <h2>{run.title}</h2>
            <div className="hg__run__meta">
              <span className={`hg__status ${STATUS_TONE[run.status] ?? ""}`}>{run.status}</span>
              <code>{run.wave}</code>
              <time>{run.date}</time>
              {run.adr && <span className="hg__adr">{run.adr}</span>}
            </div>
          </div>
          <div className="hg__run__summary">
            {run.summary.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          <div className="hg__grid">
            {run.assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                scale={scale}
                raster={raster}
                scan={scan}
                blend={blend}
                alphaFirst={alphaFirst}
                registerVideo={registerVideo}
                onMissing={noteMissing}
              />
            ))}
          </div>
        </section>
      ))}

      <footer className="hg__foot">
        <p>
          Dev-only route (<code>app/(internal)</code> is proxy-blocked in production). The treatment
          controls above are this page&rsquo;s own — the shipping raster lives in{" "}
          <code>voidwalker-hologram.css</code> and the composition lab is{" "}
          <a href="/test/voidwalker-holo-lab">/test/voidwalker-holo-lab</a>.
        </p>
      </footer>
    </div>
  );
}

function AssetCard({
  asset,
  scale,
  raster,
  scan,
  blend,
  alphaFirst,
  registerVideo,
  onMissing,
}: {
  asset: GalleryAsset;
  scale: number;
  raster: boolean;
  scan: number;
  blend: boolean;
  alphaFirst: boolean;
  registerVideo: (id: string, el: HTMLVideoElement | null) => void;
  onMissing: (file: string) => void;
}) {
  const isVideo = asset.kind === "video";
  // ⚠ DIAGNOSTICS AND SHEETS NEVER TAKE THE TREATMENT. A hole map or a contact
  // sheet under a scanline raster and an additive blend is unreadable — the
  // whole point of those frames is that they show their subject plainly.
  const plain = asset.kind === "diagnostic" || asset.kind === "sheet";
  const src = alphaFirst && asset.alphaSrc ? asset.alphaSrc : asset.src;

  const treatment = plain
    ? undefined
    : ({
        mixBlendMode: blend ? ("plus-lighter" as const) : ("normal" as const),
        WebkitMaskImage: raster
          ? `repeating-linear-gradient(to bottom, rgba(0,0,0,0.45) 0 1px, #000 1px ${scan}px)`
          : undefined,
        maskImage: raster
          ? `repeating-linear-gradient(to bottom, rgba(0,0,0,0.45) 0 1px, #000 1px ${scan}px)`
          : undefined,
      } satisfies React.CSSProperties);

  return (
    <figure className="hg__card" style={{ width: scale }} data-kind={asset.kind}>
      <div className="hg__card__stage" style={{ minHeight: Math.round(scale * 1.4) }}>
        {isVideo ? (
          <video
            ref={(el) => registerVideo(asset.id, el)}
            className="hg__media"
            style={treatment}
            src={src}
            muted
            loop
            playsInline
            autoPlay
            onError={() => onMissing(src)}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element -- dev-only lab
             reading a gitignored mirror; next/image would demand a loader and a
             build-time file that may not exist on a fresh clone. */
          <img
            className="hg__media"
            style={treatment}
            src={src}
            alt={`${asset.label} — ${asset.note}`}
            loading="lazy"
            onError={() => onMissing(src)}
          />
        )}
      </div>
      <figcaption className="hg__card__cap">
        <div className="hg__card__label">
          <strong>{asset.label}</strong>
          <span className="hg__kind">{asset.kind}</span>
        </div>
        <p>{asset.note}</p>
        <div className="hg__card__files">
          <code>{asset.src.split("/").pop()}</code>
          {asset.alphaSrc && (
            <code className={alphaFirst ? "is-active" : undefined}>
              {asset.alphaSrc.split("/").pop()}
            </code>
          )}
          {asset.mb != null && <span>{asset.mb} MB</span>}
        </div>
      </figcaption>
    </figure>
  );
}
