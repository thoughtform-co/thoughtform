"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Top-right HUD navigation for the v7 landing page (Brand Codex
 * "Hero Omega").
 *
 * Two visual states driven by scroll position:
 *
 *   • EXPANDED — while the hero is in view, the four links render
 *     inline across the top-right, aligned to the right rail.
 *   • COLLAPSED — once the user scrolls past ~60% of the first
 *     viewport, the inline links fade out and the bare three-line
 *     hamburger trigger fades in (staying aligned to the right rail).
 *     Clicking it opens the existing slide-in nav list.
 *
 * Rendered as a fixed React overlay (mounted by LandingPage) rather
 * than static body markup because it needs scroll + open/closed state.
 * Reuses the `.hud__nav` / `.hud__nav__btn` / `.hud__nav__list` styling
 * already in landing.css; only the `.hud__nav--inline` modifier + the
 * inline row are new.
 *
 * Link targets use a best-guess mapping onto the surviving sections
 * (the corridor surgery removes #definition / #intelligence-layer /
 * #buildQuote etc.): SERVICES → #services, ABOUT → #about,
 * VISION → #continuum, TOOLS → #build.
 */
const NAV_ITEMS = [
  { num: "01", label: "Tools", href: "#build" },
  { num: "02", label: "About", href: "#about" },
  { num: "03", label: "Services", href: "#services" },
  { num: "04", label: "Vision", href: "#continuum" },
] as const;

export function HudNav() {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

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

  // The slide-in list only exists in the collapsed state; force it
  // shut whenever we expand back to the inline row.
  useEffect(() => {
    if (!collapsed) setOpen(false);
  }, [collapsed]);

  // Close on Escape, and on outside click while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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

        {/* Hamburger trigger — fades in once collapsed */}
        <button
          type="button"
          className="hud__nav__btn"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        {/* Slide-in list opened by the hamburger */}
        <div className="hud__nav__list" role="menu">
          <div className="hud__nav__list__head">
            <span className="k">Nav</span>
            <span>0{NAV_ITEMS.length}</span>
          </div>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={(e) => handleNavigate(e, item.href)}
            >
              <span className="num">{item.num}</span>
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
