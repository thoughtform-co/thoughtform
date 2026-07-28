"use client";

import { useEffect, useRef, useState } from "react";

import { useActiveSection } from "./hooks/useActiveSection";
import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";

/**
 * Top-right HUD navigation for the v7 landing page (Brand Codex
 * "Hero Omega").
 *
 * Two visual states driven by scroll position:
 *
 *   • EXPANDED — while the hero is in view, the links render inline
 *     across the top-right, aligned to the right rail.
 *   • COLLAPSED — once the user scrolls past half of the first
 *     viewport, the inline links fade out and the SECTION READOUT fades
 *     in (staying aligned to the right rail). Clicking it opens the
 *     existing slide-in nav list.
 *
 * The readout is the journey indicator (ADR-055). It replaced the
 * left/right `CorridorSectionMenu` reels, which only existed above
 * 1101×760 — so the indicator was missing on exactly the laptops and
 * phones that need orientation most. The corner is the one piece of
 * chrome that survives every viewport and the hero curtain, and it
 * already held a nav affordance, so title and trigger became one
 * control: the label names where you are, pressing it opens where you
 * can go. Below 960px this is the site's ONLY navigation — the rails,
 * the manifest and the menus are all hidden by then.
 *
 * Rendered as a fixed React overlay (mounted by LandingPage) rather
 * than static body markup because it needs scroll + open/closed state.
 * Reuses the `.hud__nav` / `.hud__nav__btn` / `.hud__nav__list` styling
 * already in landing.css; the `.hud__nav--inline` modifier, the inline
 * row and `.hud__nav__sector` are the additions.
 *
 * ⚠ State stays LOCAL to this leaf. `LandingPage` owns the
 * `dangerouslySetInnerHTML` body and hosts nested `createRoot` portals;
 * a re-render up there re-applies the innerHTML and silently orphans
 * them (`.claude/rules/landing-v7.md`).
 *
 * Link targets map onto the surviving sections (the corridor surgery
 * removes #definition / #intelligence-layer / #buildQuote etc.; #tools
 * and #build retired with ADR-033 — the cases live in the Arc's
 * Build-park orbit): SERVICES → #services, ABOUT → #about,
 * PROOF → #proof (the client case, ADR-054 — it replaced the #continuum
 * vision beat this slot used to point at).
 */
const NAV_ITEMS = [
  { num: "01", label: "Services", href: "#services" },
  { num: "02", label: "About", href: "#about" },
  { num: "03", label: "Proof", href: "#proof" },
] as const;

/** Seconds the readout's decode waits on arrival — matches the CSS
 *  fade-in delay (`.hud__nav.is-collapsed .hud__nav__sector`), so the
 *  boot plays on a visible readout instead of behind its own fade. */
const READOUT_ARRIVE_DELAY_S = 0.17;

export function HudNav() {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLSpanElement>(null);
  const section = useActiveSection();

  // Collapse once the hero has largely scrolled out of view. A
  // rAF-throttled scroll listener (consistent with the other landing
  // hooks) flips `collapsed` past ~60% of the first viewport.
  useEffect(() => {
    let raf = 0;
    const evaluate = () => {
      raf = 0;
      const past = window.scrollY > window.innerHeight * 0.5;
      setCollapsed((prev) => (prev === past ? prev : past));
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

  // Mirror the collapse state onto <html> as `data-nav-collapsed` so the
  // top-left wordmark (`.hud__brand`, static markup in a separate DOM
  // subtree) can shrink in lockstep with the inline-links → hamburger
  // morph via CSS, off the identical trigger. Driven by the `collapsed`
  // STATE (not the raw scroll frame), so the root-element attribute is
  // written only on the two threshold crossings — never per scroll
  // frame.
  //
  // The class is toggled on the `.hud__brand` element ITSELF (queried
  // out of the separate static-markup subtree), NOT as an attribute on
  // <html>. A root-element attribute would invalidate style for the
  // whole document at the exact moment the corridor's heavy R3F frame
  // renders — a visible hitch at the hero→corridor seam. Scoping the
  // class to the single wordmark keeps the recalc local to that element.
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

  // The slide-in list only exists in the collapsed state; force it
  // shut whenever we expand back to the inline row.
  useEffect(() => {
    if (!collapsed) setOpen(false);
  }, [collapsed]);

  /**
   * Section readout decode (ADR-055) — the corridor caption-card recipe
   * (`CorridorStationHeaders`): re-target one scramble job per section
   * change and drive it from a local rAF that stops the frame it lands.
   *
   * The visible name is IMPERATIVELY owned — React renders the span
   * EMPTY and this effect writes every character. If React rendered the
   * label, it would commit the new text before the effect ran, and
   * `queueScramble` (which reads `from` off the live element) would see
   * `from === to` and no-op: no decode, ever. The accessible name lives
   * in a separate React-rendered `.visually-hidden` span, so AT never
   * reads scrambled glyphs.
   *
   * `captionScramble` is the correct kernel here and `terminalReveal`'s
   * `scrambleText` is not: the latter captures `textContent` at call
   * time and force-writes it back on cleanup, which is safe only on
   * constant text (ADR-031 Update 21 — the bug that staled the retired
   * menu's pinned highlight).
   */
  useEffect(() => {
    const el = sectorRef.current;
    if (!el) return;
    // On the hero the readout is faded out AND blanked, so scrolling back
    // up can never leave a half-decoded ghost under the returning links —
    // and the next collapse gets a clean empty string to decode from.
    if (!collapsed) {
      el.textContent = "";
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) {
      el.textContent = section.label;
      return;
    }
    const jobs: ScrambleJob[] = [];
    // Empty text means this is the ARRIVAL at the collapse: hold the
    // decode for the readout's own fade-in delay so the boot is actually
    // seen, and the corner reads links peel away → title decodes in
    // rather than title pops in. A label change mid-journey starts at
    // once, from whatever is on screen.
    const lead = el.textContent ? 0 : READOUT_ARRIVE_DELAY_S;
    queueScramble(jobs, el, section.label, performance.now() / 1000 + lead);
    if (jobs.length === 0) return;
    let raf = 0;
    const tick = () => {
      advanceScrambles(jobs, performance.now() / 1000);
      raf = jobs.length > 0 ? requestAnimationFrame(tick) : 0;
    };
    raf = requestAnimationFrame(tick);
    // Cancel only — never restore captured text. Re-queuing reads `from`
    // off the live element, so a mid-flight change chains from what the
    // reader can see; force-writing a captured string back is the
    // ADR-031 Update 21 bug.
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [collapsed, section.label]);

  // The closed drawer is INERT, not merely invisible: it used to be
  // `opacity: 0; pointer-events: none` only, which left its three menu
  // items in the tab order behind a closed menu. Toggled on the node
  // rather than as a JSX prop so this does not depend on the React
  // version's `inert` support.
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
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpen(false);
      // The drawer goes inert on close, which would strand focus on the
      // link that was just activated — hand it back to the trigger.
      btnRef.current?.focus();
    }
  };

  return (
    <div className="hud-nav-overlay">
      <nav
        ref={navRef}
        className={`hud__nav hud__nav--inline${collapsed ? " is-collapsed" : ""}${open ? " is-open" : ""}`}
        aria-label="Primary"
      >
        {/* Inline row — visible while the hero is on screen. Each link
            carries its index (`--i`) so the morph can stagger them as they
            peel off toward the hamburger. */}
        <div className="hud__nav__inline">
          {NAV_ITEMS.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              className="hud__nav__inline__link"
              style={{ "--i": i } as React.CSSProperties}
              onClick={(e) => handleNavigate(e, item.href)}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* The trigger — fades in once collapsed. It carries BOTH faces:
            the section readout (the journey indicator, ADR-055) and the
            bars, which survive as the trigger wherever the readout is
            suppressed — below 641px before the collapse, and on
            /claude-workshop, whose station order is not the manifest's.
            CSS picks; the button and drawer are identical either way. */}
        <button
          ref={btnRef}
          type="button"
          className="hud__nav__btn"
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls="hud-nav-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="hud__nav__sector" aria-hidden="true">
            <span className="hud__nav__sector__idx">
              {section.num}
              <span className="hud__nav__sector__sep">/</span>
              {section.total}
            </span>
            {/* Written imperatively by the decode effect — see above. */}
            <span className="hud__nav__sector__name" ref={sectorRef} />
          </span>
          <span className="bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          {/* The accessible name: states the action AND contains the
              visible label, so voice control can address the control by
              what it reads (WCAG 2.5.3 label-in-name). */}
          <span className="visually-hidden">
            {open ? "Close navigation" : "Open navigation"} — current section: {section.label}
          </span>
        </button>

        {/* Slide-in list opened by the trigger. No `role="menu"`: this is
            a disclosure revealing a list of links, not an application
            menu — that role would promise arrow-key roving focus that
            does not exist here. `aria-expanded` + `aria-controls` on the
            trigger already carry the semantics, and the drawer follows
            the button in DOM order, so Tab reaches it naturally. */}
        <div className="hud__nav__list" id="hud-nav-menu" ref={listRef}>
          <div className="hud__nav__list__head">
            <span className="k">Nav</span>
            <span>0{NAV_ITEMS.length}</span>
          </div>
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} onClick={(e) => handleNavigate(e, item.href)}>
              <span className="num">{item.num}</span>
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
