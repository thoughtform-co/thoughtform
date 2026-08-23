"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";

import type { ArcMenuItem } from "./ArcShell";
import { useArcActiveSection } from "./useArcActiveSection";

/**
 * ArcHudNav — the landing's top-right header, on an arc page (ADR-073).
 *
 * The same control the homepage mounts (`HudNav`, ADR-055), in the same
 * two states, reusing the same `.hud__nav*` chrome out of landing.css —
 * which arcs already import, so the corner is byte-for-byte the site's
 * header rather than a lookalike:
 *
 *   • EXPANDED — while the hero is on screen, the CHAPTER links render
 *     inline across the top-right, aligned to the right rail.
 *   • COLLAPSED — past half the first viewport the links peel away and
 *     the SECTION READOUT decodes in. It IS the trigger: the label names
 *     where the reader is, pressing it opens the drawer of every section.
 *
 * ⚠ IT REPLACES THE LEFT REEL, and that is ADR-055's own ruling applied
 * one surface later (owner, 2026-08-23). `ArcMenu` was a copy of the
 * corridor section menu the landing DELETED for exactly this reason: it
 * only existed above 1101×760, so the indicator was missing on the
 * laptops and phones that need it most — at 1280×720, one of this repo's
 * reference viewports, an arc page had no navigation at all. The drawer
 * carries the full section list at every width, so nothing is lost.
 *
 * ⚠ WHAT IS ARC-SPECIFIC, and why it is not `HudNav` itself: the
 * landing's readout reads the corridor bus (`useActiveSection` →
 * `MANIFEST_ENTRIES`, `resolveActiveIdx`, the services ring's progress
 * ref) and its links are the landing's four stations. None of that
 * exists here, and importing it would drag the corridor's state into a
 * deck page. What is shared is the CHROME (landing.css) and the KERNEL
 * (`captionScramble`) — both leaf-level and free of three/supabase.
 *
 * ⚠ INLINE = CHAPTERS ONLY. A deck runs to ten menu sections and ten
 * inline links do not fit a hero; the drawer takes all of them and the
 * row takes the ones the content marks `menuPrimary` (registry-capped).
 */
interface ArcHudNavProps {
  items: readonly ArcMenuItem[];
}

/** Seconds the readout's decode waits on arrival — matches the CSS
 *  fade-in delay (`.hud__nav.is-collapsed .hud__nav__sector`), so the
 *  boot plays on a visible readout instead of behind its own fade. */
const READOUT_ARRIVE_DELAY_S = 0.17;

const pad = (n: number) => String(n).padStart(2, "0");

export function ArcHudNav({ items }: ArcHudNavProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLSpanElement>(null);
  const activeIdx = useArcActiveSection(items);
  const active = items[activeIdx];
  const label = (active?.label ?? "").toUpperCase();
  const primary = items.filter((item) => item.primary);

  // Collapse once the hero has largely scrolled out of view — the
  // landing's own threshold and its rAF-throttled listener, so the two
  // headers change state at the same scroll position.
  useEffect(() => {
    let raf = 0;
    const evaluate = () => {
      raf = 0;
      const past = window.scrollY > window.innerHeight * 0.5;
      setCollapsed((prev) => (prev === past ? prev : past));
      // The drawer only exists in the collapsed state, so expanding back
      // to the chapter row closes it. Done HERE, in the scroll callback,
      // rather than in an effect on `collapsed`: a state sync effect is
      // an extra render and the lint rule is right about it. `setOpen`
      // with the current value bails inside React.
      if (!past) setOpen(false);
    };
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(evaluate);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    evaluate();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Mirror the collapse onto the wordmark so it shrinks in lockstep with
  // the links → hamburger morph. The class goes on `.hud__brand` ITSELF
  // (it lives in the injected HUD subtree), never as a root attribute:
  // an <html> attribute invalidates style for the whole document.
  useEffect(() => {
    const brand = document.querySelector(".hud__brand");
    brand?.classList.toggle("is-collapsed", collapsed);
  }, [collapsed]);

  useEffect(
    () => () => {
      document.querySelector(".hud__brand")?.classList.remove("is-collapsed");
    },
    []
  );

  /**
   * The readout's decode — the corridor caption-card recipe, verbatim
   * from `HudNav`.
   *
   * ⚠ THE VISIBLE NAME IS IMPERATIVELY OWNED: React renders the span
   * EMPTY and this effect writes every character. If React rendered the
   * label, it would commit the new text before the effect ran and
   * `queueScramble` — which reads `from` off the live element — would
   * see `from === to` and no-op: no decode, ever. The accessible name is
   * a separate React-rendered `.visually-hidden` span, so AT never reads
   * scrambled glyphs.
   */
  useEffect(() => {
    const el = sectorRef.current;
    if (!el) return;
    // On the hero the readout is faded out AND blanked, so scrolling back
    // up can never leave a half-decoded ghost under the returning links.
    if (!collapsed) {
      el.textContent = "";
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) {
      el.textContent = label;
      return;
    }
    const jobs: ScrambleJob[] = [];
    // Empty text means this is the ARRIVAL at the collapse: hold for the
    // readout's own fade-in delay so the boot is seen. A section change
    // mid-page starts at once, from whatever is on screen.
    const lead = el.textContent ? 0 : READOUT_ARRIVE_DELAY_S;
    queueScramble(jobs, el, label, performance.now() / 1000 + lead);
    if (jobs.length === 0) return;
    let raf = 0;
    const tick = () => {
      advanceScrambles(jobs, performance.now() / 1000);
      raf = jobs.length > 0 ? requestAnimationFrame(tick) : 0;
    };
    raf = requestAnimationFrame(tick);
    // Cancel only — never restore captured text (the ADR-031 U21 bug).
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [collapsed, label]);

  // The closed drawer is INERT, not merely invisible: opacity alone left
  // its links in the tab order behind a closed menu.
  useEffect(() => {
    listRef.current?.toggleAttribute("inert", !open);
  }, [open]);

  // Close on Escape, and on outside click while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        // Escape returns focus to the control that opened the drawer —
        // otherwise focus is stranded on a node that just went inert.
        btnRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const navigate = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setOpen(false);
    // The drawer goes inert on close, which would strand focus on the
    // link just activated — hand it back to the trigger.
    btnRef.current?.focus();
  };

  if (items.length === 0) return null;

  return (
    <div className="hud-nav-overlay">
      <nav
        ref={navRef}
        className={`hud__nav hud__nav--inline${collapsed ? " is-collapsed" : ""}${open ? " is-open" : ""}`}
        aria-label="Primary"
      >
        {/* The chapter row — visible while the hero is on screen. Each
            link carries its index (`--i`) so the morph can stagger them
            as they peel off toward the trigger. */}
        {primary.length > 0 ? (
          <div className="hud__nav__inline">
            {primary.map((item, i) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="hud__nav__inline__link"
                style={{ "--i": i } as CSSProperties}
                onClick={(e) => navigate(e, item.id)}
              >
                {item.label}
              </a>
            ))}
          </div>
        ) : null}

        {/* The trigger, carrying both faces: the section readout (the
            journey indicator) and the bars, which survive wherever the
            readout is suppressed. CSS picks; the drawer is identical
            either way. */}
        <button
          ref={btnRef}
          type="button"
          className="hud__nav__btn"
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls="arc-nav-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="hud__nav__sector" aria-hidden="true">
            {/* Written imperatively by the decode effect — see above. No
                DETAIL slot: an arc section has no subsection, and the
                landing's own rule is that the slot carries a subsection
                or nothing at all. */}
            <span className="hud__nav__sector__name" ref={sectorRef} />
          </span>
          <span className="bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          {/* The accessible name states the action AND contains the
              visible label, so voice control can address the control by
              what it reads (WCAG 2.5.3 label-in-name). */}
          <span className="visually-hidden">
            {open ? "Close navigation" : "Open navigation"} — current section: {label}
          </span>
        </button>

        {/* The drawer: every section, numbered. No `role="menu"` — this
            is a disclosure revealing a list of links, and that role would
            promise arrow-key roving focus that does not exist here. */}
        <div className="hud__nav__list" id="arc-nav-menu" ref={listRef}>
          <div className="hud__nav__list__head">
            <span className="k">Nav</span>
            <span>{pad(items.length)}</span>
          </div>
          {items.map((item, i) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={i === activeIdx ? "is-active" : undefined}
              aria-current={i === activeIdx ? "true" : undefined}
              onClick={(e) => navigate(e, item.id)}
            >
              <span className="num">{pad(i + 1)}</span>
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
