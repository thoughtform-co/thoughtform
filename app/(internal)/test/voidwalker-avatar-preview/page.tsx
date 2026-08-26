import type { Metadata } from "next";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { AvatarPreview, type WaveData, type PreviewManifest } from "./AvatarPreview";

import "./avatar-preview.css";

export const metadata: Metadata = {
  title: "Voidwalker avatar preview · Thoughtform",
  robots: { index: false, follow: false },
};

/**
 * `/test/voidwalker-avatar-preview`
 *
 * Read-only viewer over the `voidwalker-avatar` skill's wave folders.
 * The skill produces stills, videos, contact sheets, GLBs and their
 * QA verdicts under
 * `C:\Users\buyss\.claude\skills\voidwalker-avatar\waves\`; this route
 * mirrors that folder into `public/_previews/voidwalker-avatar/` via
 * `scripts/sync-voidwalker-avatar-preview.mjs` and renders every wave
 * on one page — stills, embedded video players, GLB turntables, and
 * the narrative from `evals/EVAL_LOG.md`.
 *
 * ⚠ SOURCE FOLDER IS NEVER MUTATED. The sync script only READS from
 * the skill; the preview only reads from `public/_previews/`. The
 * parallel Claude session's outputs are safe.
 *
 * ⚠ THE ROUTE GROUP IS `(internal)`, blocked in production by
 * `proxy.ts`. Nothing here ships to public URLs.
 *
 * If the manifest is missing the page renders a one-line message
 * telling the reader how to sync — clearer than a broken layout.
 */
export default function VoidwalkerAvatarPreviewRoute() {
  const manifestPath = join(
    process.cwd(),
    "public",
    "_previews",
    "voidwalker-avatar",
    "manifest.json"
  );
  if (!existsSync(manifestPath)) {
    return (
      <main className="avatar-preview avatar-preview--empty">
        <div>
          <h1>Voidwalker avatar preview</h1>
          <p>
            No sync yet. Run <code>node scripts/sync-voidwalker-avatar-preview.mjs</code> to mirror
            the skill&apos;s wave folder into <code>public/_previews/voidwalker-avatar/</code>, then
            reload.
          </p>
        </div>
      </main>
    );
  }
  const manifest: PreviewManifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const evalLog = manifest.eval_log
    ? readFileSync(
        join(process.cwd(), "public", "_previews", "voidwalker-avatar", manifest.eval_log),
        "utf-8"
      )
    : "";

  const waves: WaveData[] = Object.entries(manifest.waves).map(([id, w]) => ({
    id,
    files: w.files,
    meta: w.meta,
  }));

  // Sort waves: eras from the registry first, then meshy suffixes attach to their parent.
  waves.sort((a, b) => a.id.localeCompare(b.id));

  return <AvatarPreview manifest={manifest} waves={waves} evalLog={evalLog} />;
}
