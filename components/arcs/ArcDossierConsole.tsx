"use client";

import { useRef } from "react";

import {
  MediaLightbox,
  useWalkthrough,
} from "@/components/landing/home-v2/services/casefile/MediaLightbox";
import { ToolField, titleText } from "@/components/landing/home-v2/services/casefile/ToolField";
import { ConsoleFrame } from "@/components/landing/home-v2/services/casefile/console/ConsoleFrame";
import type { ProjectCase } from "@/components/landing/v7/tools-cards/toolCardData";

import { useCloseOnArcBeatFold } from "./useCloseOnArcBeatFold";

/**
 * ArcDossierConsole — the casefile's tools console, mounted on an arc
 * (ADR-072). The ONE client island of the dossier beat, and it holds state
 * only: the walkthrough's open/closed flag and where focus returns to.
 *
 * It is the same instrument as the landing's tools plate — `ConsoleFrame`
 * around `ToolField` (the bay with the authored wireframe and the fused
 * watch bar, then the four capability blocks), the same `MediaLightbox`
 * portalled to `document.body` — with two deliberate absences: no rail
 * (one tool per beat, nothing to switch) and no `.services-stage` to
 * fold-close against (the beat's own fold is watched instead). Everything
 * the casefile host used to supply — a definite height, `--fl-shot-px`,
 * `--fl-copy`, `--fl-mono`, the settled gate — comes from `.arc-dossier`
 * in `arcs.css`.
 */
export function ArcDossierConsole({ tool }: { tool: ProjectCase }) {
  const { watching, open, close } = useWalkthrough();
  const rootRef = useRef<HTMLDivElement>(null);

  useCloseOnArcBeatFold(rootRef, watching, close);

  return (
    <ConsoleFrame className="fl-plate fl-plate--tools" rootRef={rootRef}>
      <ToolField tool={tool} onWatch={open} />
      {watching && tool.walkthrough ? (
        <MediaLightbox
          src={tool.walkthrough.src}
          label={`${tool.codename} · ${titleText(tool)}`}
          meta={`Walkthrough · ${tool.walkthrough.duration}`}
          onClose={close}
        />
      ) : null}
    </ConsoleFrame>
  );
}
