import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { sliceV7Sections } from "@/lib/v7-parse";

import { ArchiveFrame } from "./ArchiveFrame";
import { LabShell } from "./LabShell";
import { StillsGallery } from "./StillsGallery";
import { SUBSTRATE_IDS, WORK_IDS } from "./imapData";
import { readVariant } from "./variants";
import { V4Variant } from "./v4/V4Variant";
import type { Depth, FieldView, Lens } from "./v4/IntelligenceField";
import { V5Variant } from "./v5/V5Variant";
import { VIEW_IDS, type Level, type View } from "./v5/consoleFixture";

/* STYLESHEET ORDER IS LOAD-BEARING.
   The production sheets first — `landing.css` owns the `@font-face` block
   (PT Mono + PP Neue Montreal) and the `:root` token chain the rail tick math
   and the band copy sizes resolve against; `home-v2.css` owns
   `.home-v2-hud-root { display: contents }`; `services.css` supplies the
   `.svc-*` chrome the parsed HUD markup expects; `casefile.css` is the SHIPPED
   panel geometry, imported unmodified so this lab cannot drift from the live
   surface. `theme.css` LAST of the production sheets, which is ADR-058's own
   import order and what makes `?theme=light` reachable here (the pre-paint
   bootstrap in `app/layout.tsx` already writes `data-theme="light"` on `<html>`
   for every route — labs that skip this sheet simply have nothing consuming
   it). Then the lab sheet, so the `.iml-*` / `.imf-*` / `.imc-*` layer and its
   two scoped un-hides win the cascade. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/v7/theme.css";
import "./intelligence-map-lab.css";

const ARCHIVE_DIR = path.join(
  process.cwd(),
  "app",
  "(internal)",
  "test",
  "intelligence-map-lab",
  "lab-archive"
);

const one = (raw: string | string[] | undefined) => (Array.isArray(raw) ? raw[0] : raw);

function readDepth(raw: string | string[] | undefined): Depth {
  const n = Number(one(raw));
  return n === 1 || n === 2 ? n : 0;
}

function readLevel(raw: string | string[] | undefined): Level {
  const n = Number(one(raw));
  return n === 1 || n === 2 ? n : 0;
}

function readWork(raw: string | string[] | undefined, fallback: string): string {
  const value = one(raw);
  return value && WORK_IDS.includes(value) ? value : fallback;
}

function readSubstrate(raw: string | string[] | undefined): string {
  const value = one(raw);
  return value && SUBSTRATE_IDS.includes(value) ? value : "S02";
}

function readLens(raw: string | string[] | undefined): Lens {
  return one(raw) === "allocation" ? "allocation" : "team";
}

function readView(raw: string | string[] | undefined): View {
  const value = one(raw);
  return (VIEW_IDS as readonly string[]).includes(value ?? "") ? (value as View) : "team";
}

/**
 * The lab route. Parses the v7 prototype for the REAL HUD chrome (the parse
 * touches the filesystem, so it stays server-side), resolves `?v=` to a variant
 * and hands that variant its own params. `[]` means "HUD only, no stations":
 * the panel is the only content on the page, and it is judged inside the real
 * rails because its whole geometry snaps to their tick ladder.
 */
export default async function IntelligenceMapLabRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const slice = sliceV7Sections([]);
  const variant = readVariant(query.v);

  /* `?dev=0` drops the toggle strip. It is a page-edge overlay, so at 1280×720
     it sits over the panel's lowest band — fine for browsing, wrong for a
     screenshot that has to be judged as the artifact. The VARIANT strip is not
     part of that bargain and stays up. */
  const showConsole = one(query.dev) !== "0";

  if (variant.kind === "archive") {
    const html = await readFile(path.join(ARCHIVE_DIR, variant.file!), "utf8");
    return (
      <LabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} variant={variant} mode="full">
        <ArchiveFrame title={variant.title} html={html} />
      </LabShell>
    );
  }

  if (variant.kind === "stills") {
    const dir = path.join(ARCHIVE_DIR, "stills", variant.stills!);
    const files = (await readdir(dir)).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f)).sort();
    return (
      <LabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} variant={variant} mode="full">
        <StillsGallery round={variant.stills!} files={files} verdict={variant.provenance} />
      </LabShell>
    );
  }

  if (variant.id === "4") {
    const initialView: FieldView = {
      depth: readDepth(query.depth),
      lens: readLens(query.lens),
      work: readWork(query.work, "W05"),
      substrate: readSubstrate(query.substrate),
    };
    return (
      <LabShell
        hudHtml={slice.hudHtml}
        bodyClass={slice.bodyClass}
        variant={variant}
        mode="casefile"
      >
        <V4Variant
          initialView={initialView}
          /* HIS RULE, KEPT: an explicit `?depth` disables the guided read. A deep
             link asks for one frame, and the auto-trace would walk away from it —
             which is also what makes the screenshot recipe deterministic. */
          autoplay={one(query.autoplay) !== "0" && query.depth === undefined}
          showConsole={showConsole}
        />
      </LabShell>
    );
  }

  /* v5 — the default. */
  return (
    <LabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} variant={variant} mode="casefile">
      <V5Variant
        initialLevel={readLevel(query.level)}
        initialWork={readWork(query.work, "W05")}
        initialView={readView(query.view)}
        /* Same rule as v4: an explicit `?level` pins the frame and cancels the
           tour, so every screenshot in the report is reproducible. */
        autoplay={one(query.autoplay) !== "0" && query.level === undefined}
        showConsole={showConsole}
      />
    </LabShell>
  );
}
