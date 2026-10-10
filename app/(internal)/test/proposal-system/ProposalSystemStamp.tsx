"use client";

import { useCallback, useEffect, useState } from "react";

import { measureProposal, summariseProposal, type PsReport } from "@/lib/proposal-system/measure";
import { knobString, type PsKnobs, type PsTheme } from "@/lib/proposal-system/variants";
import { useThemeStore } from "@/lib/stores/themeStore";

export interface ProposalHandle {
  measure(): PsReport;
  summarise(): string;
}

declare global {
  interface Window {
    __proposal?: ProposalHandle;
  }
}

/**
 * ProposalSystemStamp — the machine mirror the capture waits on, and the
 * theme the query asked for. The stamp's tail (`beats|js`) is read off the
 * live page two frames after mount: the beat count and whether the reveal
 * system armed (`.arc-root.is-arc-js`), values only the real page produces.
 * A wait a script can satisfy itself is no wait.
 */
export function ProposalSystemStamp({ knobs, theme }: { knobs: PsKnobs; theme: PsTheme }) {
  const [read, setRead] = useState({ beats: 0, js: 0 });
  const setMode = useThemeStore((s) => s.setMode);

  useEffect(() => {
    setMode(theme);
  }, [theme, setMode]);

  const measure = useCallback(() => measureProposal(document), []);

  useEffect(() => {
    let raf = 0;
    const sample = () => {
      const beats = document.querySelectorAll(".arc-root .arc-section").length;
      const js = document.querySelector(".arc-root.is-arc-js") ? 1 : 0;
      setRead((prev) => (prev.beats === beats && prev.js === js ? prev : { beats, js }));
    };
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(sample);
    });
    const t = window.setTimeout(sample, 48);
    const t2 = window.setTimeout(sample, 600);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [knobs, theme]);

  useEffect(() => {
    window.__proposal = { measure, summarise: () => summariseProposal(measure()) };
    return () => {
      delete window.__proposal;
    };
  }, [measure]);

  const stamp = [knobString(knobs), theme, read.beats, read.js].join("|");
  return (
    <p
      className="lat-read ps-read"
      data-stamp={stamp}
      data-knobs={knobString(knobs)}
      data-theme={theme}
      data-beats={read.beats}
      data-js={read.js}
      aria-hidden="true"
    />
  );
}
