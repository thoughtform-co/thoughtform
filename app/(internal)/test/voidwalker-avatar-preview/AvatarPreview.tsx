"use client";

import { Suspense, useMemo, useState } from "react";

import { GlbViewer } from "./GlbViewer";

export interface FileEntry {
  rel: string;
  size: number;
}

export interface WaveManifestEntry {
  files: FileEntry[];
  meta: FileEntry[];
}

export interface PreviewManifest {
  generated_at: string;
  source: string;
  eval_log?: string;
  waves: Record<string, WaveManifestEntry>;
}

export interface WaveData {
  id: string;
  files: FileEntry[];
  meta: FileEntry[];
}

const PUBLIC_ROOT = "/_previews/voidwalker-avatar";

function isImage(rel: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(rel);
}
function isVideo(rel: string): boolean {
  return /\.(mp4|webm|mov)$/i.test(rel);
}
function isGlb(rel: string): boolean {
  return /\.glb$/i.test(rel);
}
function isMediaAtDepth(rel: string, depth: number): boolean {
  return rel.split("/").length === depth + 1;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function AvatarPreview({
  manifest,
  waves,
  evalLog,
}: {
  manifest: PreviewManifest;
  waves: WaveData[];
  evalLog: string;
}) {
  const [openWave, setOpenWave] = useState<string | null>(waves[0]?.id ?? null);

  const totalMedia = waves.reduce((s, w) => s + w.files.length, 0);
  const totalMediaBytes = waves.reduce((s, w) => s + w.files.reduce((a, f) => a + f.size, 0), 0);

  return (
    <main className="avatar-preview">
      <header className="avatar-preview__head">
        <h1>Voidwalker avatar preview</h1>
        <p>
          Read-only viewer over the <code>voidwalker-avatar</code> skill&apos;s wave folder.
          <br />
          {waves.length} wave(s), {totalMedia} media files, {formatSize(totalMediaBytes)} total.
          <br />
          Synced{" "}
          <time dateTime={manifest.generated_at}>
            {new Date(manifest.generated_at).toLocaleString()}
          </time>{" "}
          from <code>{manifest.source}</code>.
        </p>
        <p className="avatar-preview__hint">
          To refresh: <code>node scripts/sync-voidwalker-avatar-preview.mjs</code>
        </p>
      </header>

      <nav className="avatar-preview__tabs" aria-label="Waves">
        {waves.map((w) => (
          <button
            key={w.id}
            type="button"
            className="avatar-preview__tab"
            data-active={openWave === w.id || undefined}
            onClick={() => setOpenWave(w.id)}
          >
            <span className="avatar-preview__tab-id">{w.id}</span>
            <span className="avatar-preview__tab-meta">
              {w.files.length} files · {formatSize(w.files.reduce((s, f) => s + f.size, 0))}
            </span>
          </button>
        ))}
      </nav>

      <section className="avatar-preview__wave">
        {waves
          .filter((w) => w.id === openWave)
          .map((wave) => (
            <WaveBody key={wave.id} wave={wave} />
          ))}
      </section>

      {evalLog ? (
        <section className="avatar-preview__eval">
          <h2>eval log</h2>
          <pre>{evalLog}</pre>
        </section>
      ) : null}
    </main>
  );
}

function WaveBody({ wave }: { wave: WaveData }) {
  const files = useMemo(() => {
    const images = wave.files.filter((f) => isImage(f.rel) && isMediaAtDepth(f.rel, 1));
    const videos = wave.files.filter((f) => isVideo(f.rel));
    const glbs = wave.files.filter((f) => isGlb(f.rel));
    // Sub-folder images (frame extracts, prompts folders' outputs) get
    // their own bucket so the top level stays clean.
    const subImages = wave.files.filter((f) => isImage(f.rel) && !isMediaAtDepth(f.rel, 1));
    return { images, videos, glbs, subImages };
  }, [wave.files]);

  return (
    <div className="avatar-preview__body">
      <h2>{wave.id}</h2>

      {files.videos.length > 0 ? (
        <section>
          <h3>videos</h3>
          <div className="avatar-preview__grid avatar-preview__grid--videos">
            {files.videos.map((v) => (
              <figure key={v.rel} className="avatar-preview__figure">
                <video
                  src={`${PUBLIC_ROOT}/${v.rel}`}
                  controls
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
                <figcaption>
                  <code>{v.rel}</code>
                  <span>{formatSize(v.size)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {files.glbs.length > 0 ? (
        <section>
          <h3>3D models (GLB)</h3>
          <div className="avatar-preview__grid avatar-preview__grid--glbs">
            {files.glbs.map((g) => (
              <figure key={g.rel} className="avatar-preview__figure avatar-preview__figure--glb">
                <div className="avatar-preview__viewer">
                  <Suspense fallback={<div className="avatar-preview__loading">loading GLB…</div>}>
                    <GlbViewer src={`${PUBLIC_ROOT}/${g.rel}`} />
                  </Suspense>
                </div>
                <figcaption>
                  <code>{g.rel}</code>
                  <span>{formatSize(g.size)}</span>
                  <a href={`${PUBLIC_ROOT}/${g.rel}`} download>
                    download
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {files.images.length > 0 ? (
        <section>
          <h3>stills</h3>
          <div className="avatar-preview__grid avatar-preview__grid--images">
            {files.images.map((img) => (
              <figure key={img.rel} className="avatar-preview__figure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${PUBLIC_ROOT}/${img.rel}`}
                  alt={img.rel}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>
                  <code>{img.rel}</code>
                  <span>{formatSize(img.size)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {files.subImages.length > 0 ? (
        <section>
          <h3>frames + sub-folders</h3>
          <div className="avatar-preview__grid avatar-preview__grid--frames">
            {files.subImages.map((img) => (
              <figure
                key={img.rel}
                className="avatar-preview__figure avatar-preview__figure--small"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${PUBLIC_ROOT}/${img.rel}`}
                  alt={img.rel}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>
                  <code>{img.rel}</code>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {wave.meta.length > 0 ? (
        <section>
          <h3>metadata ({wave.meta.length} JSON/MD files)</h3>
          <ul className="avatar-preview__meta">
            {wave.meta.map((m) => (
              <li key={m.rel}>
                <a href={`${PUBLIC_ROOT}/${m.rel}`} target="_blank" rel="noopener">
                  {m.rel}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
