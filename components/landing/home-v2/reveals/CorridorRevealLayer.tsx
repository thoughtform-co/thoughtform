"use client";

import { useCallback, useEffect, useRef, useState, type TransitionEvent } from "react";

import {
  resolveRevealStage,
  shouldForceClose,
  type RevealStageKey,
} from "@/lib/home-v2/corridorReveals";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

import { BuildToolTiles } from "./BuildToolTiles";
import { EncodeSkillsList } from "./EncodeSkillsList";
import { NavigateSignalCard } from "./NavigateSignalCard";

/**
 * CorridorRevealLayer — the Arc's per-stage reveal consoles (ADR-032).
 *
 * A fixed sibling layer inside `.home-v2-stage__sticky` (mounted after
 * `CorridorProgressRail`, `!fallback` only). It shows ONE labeled console
 * chip at a time — bottom-centre, beneath the caption card — for whichever
 * Arc stage is on screen (VIEW SIGNAL / VIEW SKILLS / VIEW TOOLS). Clicking
 * opens a right-side console drawer with that stage's proof: a signal card
 * (Navigate), skill examples (Encode), or tool previews (Build). The sphere
 * artifact keeps primacy — the drawer sits beside it, no backdrop.
 *
 * Everything is a READ-ONLY function of the corridor's `paintProgress`
 * (the `CorridorProgressRail` rAF pattern) — no scroll writers. The chip
 * arrives/leaves in lockstep with the station copy (shared bands in
 * `corridorReveals.ts`). Scrolling out of a stage force-closes its panel
 * (the scroll-away dismissal); there is no scroll lock.
 *
 * Desktop-capable only via CSS (matching the right-rail register gate);
 * never mounts on the fallback corridor (PRM / no-WebGL).
 */

interface StageDef {
  key: RevealStageKey;
  chipLabel: string;
  panelTitle: string;
  dialogLabel: string;
}

const STAGES: readonly StageDef[] = [
  {
    key: "navigate",
    chipLabel: "View signal",
    panelTitle: "SIGNAL — 01 · NAVIGATE",
    dialogLabel: "Navigate — a signal example",
  },
  {
    key: "encode",
    chipLabel: "View skills",
    panelTitle: "SKILLS — 02 · ENCODE",
    dialogLabel: "Encode — skill examples",
  },
  {
    key: "build",
    chipLabel: "View tools",
    panelTitle: "TOOL UNITS — 03 · BUILD",
    dialogLabel: "Build — the tools in production",
  },
];

export function CorridorRevealLayer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const chipRefs = useRef<Record<RevealStageKey, HTMLButtonElement | null>>({
    navigate: null,
    encode: null,
    build: null,
  });

  // `open` drives the dialog (is-open + aria); `mountStage` lags on close so
  // the drawer's content stays mounted while the aperture wipes shut.
  const [open, setOpen] = useState<RevealStageKey | null>(null);
  const [mountStage, setMountStage] = useState<RevealStageKey | null>(null);

  // Mirror `open` into a ref so the mount-once rAF loop reads the latest
  // value without re-subscribing. Synced in an effect (not during render).
  const openRef = useRef<RevealStageKey | null>(null);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const activeStageRef = useRef<RevealStageKey | null>(null);
  const lastOpacityRef = useRef(-1);
  const seenRef = useRef<Set<RevealStageKey>>(new Set());

  // ── rAF: read the corridor, drive the chip slot, force-close on exit ──
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = useDepthGatewayStore.getState().transform;
      const engaged = t.active || t.armed;
      const { stage, opacity } = resolveRevealStage(t.paintProgress, t.epilogueProgress, engaged);

      if (Math.abs(opacity - lastOpacityRef.current) > 0.002) {
        if (slotRef.current) slotRef.current.style.opacity = opacity.toFixed(3);
        lastOpacityRef.current = opacity;
      }

      if (stage !== activeStageRef.current) {
        activeStageRef.current = stage;
        const slot = slotRef.current;
        if (slot) {
          if (stage) slot.setAttribute("data-stage", stage);
          else slot.removeAttribute("data-stage");
        }
        for (const s of STAGES) {
          const btn = chipRefs.current[s.key];
          if (!btn) continue;
          const on = s.key === stage;
          btn.hidden = !on;
          if (on && !seenRef.current.has(s.key)) {
            seenRef.current.add(s.key);
            btn.classList.add("is-fresh");
          }
        }
      }

      if (
        openRef.current &&
        shouldForceClose(openRef.current, t.paintProgress, t.epilogueProgress, engaged)
      ) {
        setOpen(null);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // `inert` is a DOM property here (React 18 has no typed prop) so the
  // closed, clipped drawer is fully out of the a11y + tab order.
  useEffect(() => {
    const el = panelRef.current;
    if (el) el.inert = open === null;
  }, [open]);

  // Focus the drawer on open (non-modal — no focus trap, scroll stays live).
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  // Escape + outside-pointerdown dismissal while open.
  useEffect(() => {
    if (!open) return;
    const closeAndReturn = () => {
      const chip = chipRefs.current[open];
      setOpen(null);
      chip?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAndReturn();
    };
    const onDown = (e: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const toggle = useCallback((stage: RevealStageKey) => {
    // Mount the stage's content now; on a close this re-sets the same
    // value (a no-op) and the content stays mounted through the aperture
    // wipe, cleared on transition-end.
    setMountStage(stage);
    setOpen((prev) => (prev === stage ? null : stage));
  }, []);

  const onPanelTransitionEnd = useCallback((e: TransitionEvent) => {
    // Only the panel's own aperture sweep — ignore bubbled child (e.g.
    // close-button) transitions.
    if (e.target !== e.currentTarget) return;
    if (openRef.current === null) setMountStage(null);
  }, []);

  const activeTitle = STAGES.find((s) => s.key === open)?.panelTitle;
  const activeDialogLabel = STAGES.find((s) => s.key === open)?.dialogLabel;

  return (
    <div ref={rootRef} className="home-v2-reveal-layer">
      <div ref={slotRef} className="home-v2-reveal-slot" style={{ opacity: 0 }}>
        {STAGES.map((s) => (
          <button
            key={s.key}
            ref={(el) => {
              chipRefs.current[s.key] = el;
            }}
            hidden
            type="button"
            className="home-v2-reveal-chip"
            data-stage={s.key}
            aria-expanded={open === s.key}
            aria-controls="home-v2-reveal-panel"
            onAnimationEnd={(e) => e.currentTarget.classList.remove("is-fresh")}
            onClick={(e) => {
              e.currentTarget.classList.remove("is-fresh");
              toggle(s.key);
            }}
          >
            <span className="home-v2-reveal-chip__tick" aria-hidden="true" />
            <span className="home-v2-reveal-chip__label">{s.chipLabel}</span>
          </button>
        ))}
      </div>

      <aside
        ref={panelRef}
        id="home-v2-reveal-panel"
        className={`home-v2-reveal-panel${open ? " is-open" : ""}`}
        role="dialog"
        aria-label={activeDialogLabel}
        aria-hidden={open ? undefined : "true"}
        tabIndex={-1}
        data-stage={mountStage ?? undefined}
        onTransitionEnd={onPanelTransitionEnd}
      >
        <div className="home-v2-reveal-panel__frame" aria-hidden="true" />
        <header className="home-v2-reveal-panel__bar">
          <span className="home-v2-reveal-panel__title">{activeTitle}</span>
          <button
            type="button"
            className="home-v2-reveal-panel__close"
            aria-label="Close"
            onClick={() => {
              const chip = open ? chipRefs.current[open] : null;
              setOpen(null);
              chip?.focus();
            }}
          >
            ESC
          </button>
        </header>
        <div className="home-v2-reveal-panel__body">
          {mountStage === "navigate" && <NavigateSignalCard />}
          {mountStage === "encode" && <EncodeSkillsList />}
          {mountStage === "build" && <BuildToolTiles />}
        </div>
      </aside>
    </div>
  );
}
