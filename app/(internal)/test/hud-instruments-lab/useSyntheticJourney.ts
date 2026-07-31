"use client";

import { useEffect } from "react";

import { SERVICES_PROOF_RUNWAY_VH } from "@/components/landing/home-v2/unifiedServicesInstrument";
import { CORRIDOR_MOUNT_ID } from "@/lib/rail-manifest/entries";
import { resolveActiveIdx } from "@/lib/rail-manifest/resolveActiveIdx";
import { sectionReadout } from "@/lib/rail-manifest/sectionLabel";
import { splitServicesRunway } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

import { CORRIDOR_BEATS, RUNWAY_BLOCKS } from "./journey";
import { publishJourney } from "./journeyRef";

/**
 * The lab's corridor stand-in — the ONE writer of `data-corridor-engaged`
 * and `data-corridor-phase`, plus the publisher of `journeyRef`.
 *
 * Writer split (both delta-gated, disjoint attribute sets — ADR-002):
 *
 *   useLandingScroll   `data-active-station` · `--hero-lift` · `--depth`
 *                      · `data-corridor-entry`     (production, unmodified)
 *   useSyntheticJourney `data-corridor-engaged` · `data-corridor-phase`
 *
 * Nothing else writes `<html>`. The console is not a writer either — its
 * stepper performs a real `window.scrollTo` through
 * `scrollToManifestEntry`, so there is exactly one truth about where the
 * reader is: `scrollY`.
 *
 * ⚠ `data-corridor-engaged` is REMOVED when not engaged, never set to
 * `"false"` — `resolveActiveIdx` only tests for the literal `"true"`, but a
 * statically-present attribute is the documented way to route the resolver
 * down the corridor branch and light the wrong row
 * (`ServicesAnchorLabShell` carries the same warning).
 *
 * ⚠ `--hil-journey` is written on the LAB ROOT, never on `<html>`. A
 * per-frame custom property on the root element invalidates style for the
 * whole document; `HudNav` documents exactly that cost. One element, one
 * recalc.
 */

/** Where the corridor mount counts as holding the viewport. */
function corridorEngaged(rect: DOMRect, vh: number): boolean {
  return rect.top <= 0 && rect.bottom > vh;
}

export function useSyntheticJourney(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const html = document.documentElement;
    let raf = 0;

    const frame = () => {
      raf = 0;
      const root = rootRef.current;
      if (!root) return;

      const vh = window.innerHeight;
      const scrollY = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
      const scroll01 = Math.max(0, Math.min(1, scrollY / maxScroll));

      // Which block holds the viewport MIDLINE — the same rule
      // `useLandingScroll` uses for `data-active-station`, so the two can
      // never disagree about which section the reader is in.
      const mid = scrollY + vh / 2;
      let blockIdx = 0;
      let blockLocal = 0;
      for (let i = 0; i < RUNWAY_BLOCKS.length; i++) {
        const el = document.getElementById(RUNWAY_BLOCKS[i].id);
        if (!el) continue;
        const top = scrollY + el.getBoundingClientRect().top;
        if (top <= mid) {
          blockIdx = i;
          blockLocal = Math.max(
            0,
            Math.min(1, (scrollY - top) / Math.max(1, el.offsetHeight - vh))
          );
        }
      }

      // ── Corridor beat bus ────────────────────────────────────────────
      const mount = document.getElementById(CORRIDOR_MOUNT_ID);
      let corridorRaw = 0;
      if (mount) {
        const rect = mount.getBoundingClientRect();
        const travel = Math.max(1, mount.offsetHeight - vh);
        corridorRaw = Math.max(0, Math.min(1, -rect.top / travel));

        if (corridorEngaged(rect, vh)) {
          if (html.getAttribute("data-corridor-engaged") !== "true") {
            html.setAttribute("data-corridor-engaged", "true");
          }
          let phase = CORRIDOR_BEATS[0]?.phase ?? "thesis";
          for (const beat of CORRIDOR_BEATS) if (corridorRaw >= beat.at) phase = beat.phase;
          if (html.getAttribute("data-corridor-phase") !== phase) {
            html.setAttribute("data-corridor-phase", phase);
          }
        } else if (html.hasAttribute("data-corridor-engaged")) {
          html.removeAttribute("data-corridor-engaged");
          html.removeAttribute("data-corridor-phase");
        }
      }

      // ── Services ring bridge ─────────────────────────────────────────
      // Without this the nav corner prints a LIE while at #services: the
      // ref's resting `proofRelease: 1` shows SERVICES where production
      // shows PROOF for the whole casefile dwell, and its resting
      // `progress: 0` pins service 01's verb in the detail slot forever.
      //
      // `splitServicesRunway` is the production split, used rather than
      // hand-rolled offsets (`.claude/rules/services-ring.md`). The one
      // simplification: `proofRelease` takes `proofP` directly instead of
      // production's PROOF_RELEASE ramp — the flip still lands late in the
      // dwell, which is all this lab reads it for.
      const servicesEl = document.getElementById("services");
      if (servicesEl) {
        const rect = servicesEl.getBoundingClientRect();
        const { proofP, ringP } = splitServicesRunway(
          -rect.top,
          Math.max(1, servicesEl.offsetHeight - vh),
          SERVICES_PROOF_RUNWAY_VH * vh
        );
        servicesRingProgressRef.current.progress = ringP;
        servicesRingProgressRef.current.proofRelease = proofP;
        servicesRingProgressRef.current.proofPresence = proofP < 1 ? 1 : 0;
      }

      // ── Publish ──────────────────────────────────────────────────────
      const activeIdx = resolveActiveIdx(html);
      // Count ROWS reached, not manifest indices: the Arc's four beats
      // collapse to one readout row, and counting indices would draw four
      // Arc marks on the left rail. `sectionReadout().num` is 1-based and
      // zero-padded, which is exactly the count of rows reached.
      const reachedRows = Number(
        sectionReadout(activeIdx, servicesRingProgressRef.current.proofRelease < 0.75).num
      );

      publishJourney({ scroll01, blockIdx, blockLocal, corridorRaw, activeIdx, reachedRows });

      root.style.setProperty("--hil-journey", scroll01.toFixed(4));
      root.style.setProperty("--hil-block-local", blockLocal.toFixed(4));
      root.style.setProperty("--hil-reached", String(reachedRows));
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(frame);
    };

    // rAF stalls to a standstill in a hidden document (the headed-pane
    // quirk), so a tab switch mid-scroll would strand every scalar at its
    // last value. Resync on the way back.
    const onVisibility = () => {
      if (document.visibilityState === "visible") schedule();
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", onVisibility);
    frame();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) cancelAnimationFrame(raf);
      html.removeAttribute("data-corridor-engaged");
      html.removeAttribute("data-corridor-phase");
      // The ring ref is module-global and shared with production code
      // paths: "Nothing may ever leave this at 0 as a resting state."
      servicesRingProgressRef.current = { progress: 0, proofRelease: 1, proofPresence: 0 };
    };
  }, [rootRef]);
}
