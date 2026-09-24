"use client";

import { useEffect, useRef, useState } from "react";

import {
  bumpSession,
  flushNow,
  readPrev,
  record,
  type BlackBoxRecord,
} from "@/lib/landing/blackBox";
import { frameCounterRef } from "@/lib/home-v2/frameCounterRef";
import { useQualityStore } from "@/lib/hooks/useQualityTier";
import { classifyRenderer } from "@/lib/webgl/rendererClass";
import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";

import { readDiagBoot } from "./DiagGate";

/**
 * The phone diagnostic STRIP (ADR-123 §Part 1, commit A) — a fixed 10px PT
 * Mono readout under the top-right corner with a COPY chit, re-read at 4 Hz
 * and on scroll, stamping NOW beside PREV (the black box of the page before
 * this one, which is what a reload leaves behind).
 *
 * Loaded only through `DiagGate` (`?diag=phone`), so nothing here is on the
 * visitor's path; its one production concern is to cost nothing it measures —
 * the reads are cheap DOM attributes and a store snapshot, never a layout of
 * the pile.
 */

/** Which build of the bisect ladder this is. Moved by hand per commit. */
export const DIAG_VARIANT = "B";

type Snap = BlackBoxRecord;

function navType(): string {
  try {
    const e = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    return e?.type ?? "n/a";
  } catch {
    return "n/a";
  }
}

function memory(): string {
  const p = performance as Performance & {
    memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
  };
  if (!p.memory) return "n/a";
  return `${Math.round(p.memory.usedJSHeapSize / 1048576)}/${Math.round(
    p.memory.totalJSHeapSize / 1048576
  )}MB`;
}

function pile(): Record<string, unknown> {
  const runway = document.querySelector<HTMLElement>(".pf-stack__runway");
  if (!runway) return { mounted: false };
  const slots = runway.querySelectorAll<HTMLElement>("[data-pc-slot]");
  const active = runway.getAttribute("data-pc-active");
  const idx = active == null ? Number.NaN : Number.parseInt(active, 10);
  const slot = Number.isFinite(idx)
    ? runway.querySelector<HTMLElement>(`[data-pc-index="${idx}"]`)
    : null;
  return {
    mounted: true,
    split: runway.parentElement?.classList.contains("pf-stack--split") ?? false,
    slots: slots.length,
    active,
    enter: slot?.style.getPropertyValue("--pc-enter") || null,
    depth: slot?.style.getPropertyValue("--pc-depth") || null,
    state: slot?.getAttribute("data-pc-state") ?? null,
    covered: runway.querySelectorAll('[data-pc-state="covered"]').length,
  };
}

function gl(): Record<string, unknown>[] {
  return Array.from(document.querySelectorAll("canvas")).map((c) => {
    const host = c.parentElement;
    const cs = host ? getComputedStyle(host) : null;
    return {
      host: host?.className?.toString().slice(0, 40) ?? "",
      buf: `${c.width}x${c.height}`,
      css: `${Math.round(c.clientWidth)}x${Math.round(c.clientHeight)}`,
      pos: cs?.position ?? "",
    };
  });
}

function htmlAttrs(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of Array.from(document.documentElement.attributes)) {
    if (a.name.startsWith("data-")) out[a.name.slice(5)] = a.value;
  }
  return out;
}

function snapshot(
  session: { session: number; prevAt: number | null },
  frames: [number, number]
): Snap {
  const q = useQualityStore.getState();
  const vv = window.visualViewport;
  const b = readDiagBoot();
  return {
    build: DIAG_VARIANT,
    t: new Date().toISOString(),
    ua: navigator.userAgent.slice(0, 80),
    nav: navType(),
    persisted: b.persisted,
    pageshows: b.pageshows,
    session: session.session,
    prevAt: session.prevAt,
    vh: {
      inner: window.innerHeight,
      client: layoutViewportHeight(),
      visual: vv ? Math.round(vv.height) : null,
      scale: vv ? +vv.scale.toFixed(2) : null,
      dpr: window.devicePixelRatio,
      w: window.innerWidth,
    },
    y: Math.round(window.scrollY),
    docH: document.documentElement.scrollHeight,
    pile: pile(),
    gov: {
      dpr: q.dprCeiling,
      count: q.countMultiplier,
      probed: q.probed,
      renderer: q.probed ? classifyRenderer() : "unprobed",
    },
    gl: gl(),
    html: htmlAttrs(),
    lost: b.lost,
    restored: b.restored,
    frames: { corridor: frames[0], brandmark: frames[1] },
    mem: memory(),
  };
}

const strip: React.CSSProperties = {
  position: "fixed",
  top: "calc(var(--hud-padding, 32px) + 44px)",
  right: "var(--hud-padding, 32px)",
  zIndex: 1200,
  maxWidth: "min(78vw, 360px)",
  padding: "6px 8px",
  font: "10px/1.35 var(--font-pt-mono)",
  letterSpacing: "0.04em",
  color: "rgba(235, 227, 214, 0.92)",
  background: "rgba(10, 9, 8, 0.82)",
  border: "1px solid rgba(202, 165, 84, 0.35)",
  pointerEvents: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const chit: React.CSSProperties = {
  display: "inline-block",
  minWidth: 44,
  minHeight: 44,
  margin: "6px 0 0",
  padding: "0 10px",
  font: "inherit",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#0a0908",
  background: "#caa554",
  border: 0,
};

export function DiagPanel() {
  const [now, setNow] = useState<Snap | null>(null);
  const [prev] = useState<Snap>(() => readPrev());
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const sessionRef = useRef<{ session: number; prevAt: number | null } | null>(null);
  const framesRef = useRef<[number, number]>([0, 0]);
  const fpsRef = useRef<{ t: number; c: number; b: number }>({ t: 0, c: 0, b: 0 });

  useEffect(() => {
    sessionRef.current = bumpSession();
    let raf = 0;
    let timer = 0;
    const read = () => {
      const s = sessionRef.current!;
      const c = frameCounterRef.current;
      const t = performance.now();
      const dt = (t - fpsRef.current.t) / 1000;
      if (dt >= 1) {
        framesRef.current = [
          Math.round((c.corridor - fpsRef.current.c) / dt),
          Math.round((c.brandmark - fpsRef.current.b) / dt),
        ];
        fpsRef.current = { t, c: c.corridor, b: c.brandmark };
      }
      const snap = snapshot(s, framesRef.current);
      setNow(snap);
      record(snap);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        read();
      });
    };
    const onError = (e: ErrorEvent) =>
      setErr(`${e.message} @${e.filename?.split("/").pop()}:${e.lineno}`);
    const onRejection = (e: PromiseRejectionEvent) =>
      setErr(`rejection: ${String(e.reason).slice(0, 120)}`);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    timer = window.setInterval(read, 250);
    // The first read is a frame late on purpose: a synchronous setState in an
    // effect body is the cascading-render shape the lint ratchet counts.
    raf = requestAnimationFrame(() => {
      raf = 0;
      read();
    });
    return () => {
      window.clearInterval(timer);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  useEffect(() => {
    if (err) record({ err });
  }, [err]);

  const copy = async () => {
    flushNow();
    const payload = JSON.stringify({ now, prev, err }, null, 1);
    try {
      await navigator.clipboard.writeText(payload);
      setCopied("copied");
    } catch {
      setCopied("copy failed — long-press the strip");
    }
    window.setTimeout(() => setCopied(null), 1600);
  };

  if (!now) return null;
  const vh = now.vh as Record<string, unknown>;
  const p = now.pile as Record<string, unknown>;
  const f = now.frames as Record<string, number>;
  const g = now.gov as Record<string, unknown>;
  const prevLine = prev.t
    ? `PREV ${String(prev.build ?? "?")} ${String(prev.nav ?? "")} y${String(prev.y ?? "")}/${String(
        prev.docH ?? ""
      )} s${String(prev.session ?? "")} lost${String(prev.lost ?? 0)} ${String(prev.mem ?? "")}${
        prev.err ? ` ERR ${String(prev.err).slice(0, 60)}` : ""
      }`
    : "PREV —";

  return (
    <div style={strip} data-diag-phone="" aria-live="off">
      {`NOW ${DIAG_VARIANT} ${String(now.nav)} s${String(now.session)} bf${String(now.persisted)} y${String(
        now.y
      )}/${String(now.docH)}\n`}
      {`vh in${String(vh.inner)} icb${String(vh.client)} vis${String(vh.visual)} dpr${String(vh.dpr)}\n`}
      {`pile ${
        p.mounted
          ? `${String(p.slots)}s split${String(p.split)} a${String(p.active)} e${String(
              p.enter
            )} d${String(p.depth)} ${String(p.state)} cov${String(p.covered)}`
          : "unmounted"
      }\n`}
      {`fps corr${f.corridor} brand${f.brandmark} · gov dpr${String(g.dpr)} n${String(g.count)} ${String(
        g.renderer
      )}\n`}
      {`gl ${(now.gl as Record<string, unknown>[]).map((c) => `${String(c.buf)}${String(c.pos).slice(0, 1)}`).join(" ")} lost${String(
        now.lost
      )}/${String(now.restored)} ${String(now.mem)}\n`}
      {err ? `ERR ${err}\n` : ""}
      {prevLine}
      {"\n"}
      <button type="button" style={chit} onClick={copy}>
        {copied ?? "copy"}
      </button>
    </div>
  );
}
