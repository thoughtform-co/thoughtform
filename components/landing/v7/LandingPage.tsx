"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLandingScroll } from "./hooks/useLandingScroll";
import { useRevealMotion } from "./hooks/useRevealMotion";
import { useSigilChoreography } from "./hooks/useSigilChoreography";
import { CelestialPortals } from "./CelestialConnector/CelestialPortals";
import { PhaseGlyphPortals } from "./PhaseGlyph";
import { CelestialEditorOverlay } from "@/components/admin/CelestialEditor";
import { useCelestialDrafts } from "@/components/admin/CelestialEditor/useCelestialDrafts";
import type { SlotsMap } from "@/lib/celestial/schema";

interface LandingPageProps {
  bodyHtml: string;
  bodyClass: string;
  celestialSlots?: SlotsMap;
}

export function LandingPage({ bodyHtml, bodyClass, celestialSlots }: LandingPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [navOpen, setNavOpen] = useState(false);

  useLandingScroll(rootRef);
  useRevealMotion(rootRef);
  useSigilChoreography(rootRef);

  // Hamburger toggle — wire imperatively since the nav markup comes from HTML
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const navEl = root.querySelector<HTMLElement>(".hud__nav");
    const navBtn = root.querySelector<HTMLButtonElement>(".hud__nav__btn");
    if (!navEl || !navBtn) return;

    const toggle = () => {
      navEl.classList.toggle("is-open");
    };
    navBtn.addEventListener("click", toggle);

    // Smooth scroll on nav links
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("#hudNav a"));
    const handlers: Array<[HTMLAnchorElement, (e: MouseEvent) => void]> = [];
    for (const link of links) {
      const handler = (event: MouseEvent) => {
        const href = link.getAttribute("href");
        if (!href) return;
        const target = root.querySelector<HTMLElement>(href);
        if (!target) return;
        event.preventDefault();
        navEl.classList.remove("is-open");
        window.scrollTo({ top: target.offsetTop - 20, behavior: "smooth" });
      };
      link.addEventListener("click", handler);
      handlers.push([link, handler]);
    }

    return () => {
      navBtn.removeEventListener("click", toggle);
      for (const [link, handler] of handlers) {
        link.removeEventListener("click", handler);
      }
    };
  }, []);

  // Practice section choreography. Two layers:
  //
  //   (1) section observer — toggles `data-practice-active` on the root
  //       element while `#practice` is engaged with the viewport. CSS
  //       reads this to crossfade the bottom-left HUD brandmark from its
  //       filled rendering to the outline rendering (the SVG filter
  //       defs live next to this component in the React tree).
  //
  //   (2) scroll-driven phase selector — on each scroll frame (rAF
  //       throttled) picks the `.approach__phase` whose center is
  //       closest to ~40% of the viewport (the natural reading focus)
  //       and writes `data-active-phase` on `.approach` plus
  //       `data-active` on each phase. CSS uses these to highlight the
  //       matching orbit lane / label and crossfade the matching phase
  //       glyph. This pattern avoids IntersectionObserver dead zones
  //       that can leave the active phase stale on mobile, where each
  //       phase is 100vh tall and may never cross a fixed ratio band.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const phases = Array.from(root.querySelectorAll<HTMLElement>(".approach__phase"));
    const approach = root.querySelector<HTMLElement>(".approach");
    const practice = root.querySelector<HTMLElement>("#practice");

    if (!phases.length || !approach) return;

    const setActivePhase = (target: HTMLElement | null) => {
      if (!target) return;
      const phase = target.getAttribute("data-phase");
      if (phase && approach.getAttribute("data-active-phase") !== phase) {
        approach.setAttribute("data-active-phase", phase);
      }
      phases.forEach((p) => {
        const next = p === target ? "true" : "false";
        if (p.getAttribute("data-active") !== next) {
          p.setAttribute("data-active", next);
        }
      });
    };

    const pickActivePhase = () => {
      const vh = window.innerHeight;
      // 40% from viewport top is the natural reading focus on this layout.
      const focusY = vh * 0.4;
      let bestPhase: HTMLElement | null = null;
      let bestDist = Infinity;
      for (const p of phases) {
        const r = p.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= vh) continue;
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - focusY);
        if (dist < bestDist) {
          bestDist = dist;
          bestPhase = p;
        }
      }
      if (bestPhase) {
        setActivePhase(bestPhase);
        return;
      }
      // Nothing in viewport — fall back to the phase nearest the
      // viewport above/below so entering #practice from continuum
      // immediately reads as Navigate, and entering from About on
      // upward scroll lands on Build.
      let nearest: HTMLElement | null = null;
      let nearestDist = Infinity;
      for (const p of phases) {
        const r = p.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - focusY);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = p;
        }
      }
      setActivePhase(nearest);
    };

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        pickActivePhase();
      });
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    pickActivePhase();

    let practiceIO: IntersectionObserver | null = null;
    if (practice) {
      // Activation band: shrink the viewport root by 15% top and bottom
      // so the brandmark only flips when #practice is solidly engaged,
      // not at the section boundaries where the user is still reading
      // the connector or the outgoing through-line.
      practiceIO = new IntersectionObserver(
        ([entry]) => {
          root.setAttribute("data-practice-active", entry?.isIntersecting ? "true" : "false");
        },
        { rootMargin: "-15% 0px -15% 0px", threshold: 0 }
      );
      practiceIO.observe(practice);
    }

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
      practiceIO?.disconnect();
      root.removeAttribute("data-practice-active");
    };
  }, []);

  // Tag motion roles on first mount (replaces the imperative tagging from initV7Runtime).
  // MUST be useLayoutEffect: runs before useRevealMotion's useEffect so the
  // IntersectionObserver sees all [data-m] elements. Otherwise auto-tagged
  // titles/bodies stay at opacity:0 until a reflow triggers them.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const tagIfEmpty = (el: Element | null, role: string) => {
      if (el && !el.hasAttribute("data-m")) el.setAttribute("data-m", role);
    };

    root.querySelectorAll<HTMLElement>(".station").forEach((station) => {
      if (!station.hasAttribute("data-m-group")) station.setAttribute("data-m-group", "");
      tagIfEmpty(station.querySelector(":scope > .station__idx"), "eyebrow");
      tagIfEmpty(station.querySelector(":scope > .station__title"), "title");
      tagIfEmpty(station.querySelector(":scope > .station__lede"), "body");
    });

    const heroContent = root.querySelector<HTMLElement>(".hero__content");
    if (heroContent) {
      heroContent.setAttribute("data-m-group", "");
      tagIfEmpty(heroContent.querySelector(".hero__wordmark"), "title");
      tagIfEmpty(heroContent.querySelector(".hero__tagline"), "body");
      tagIfEmpty(heroContent.querySelector(".hero__desc"), "body");
      tagIfEmpty(heroContent.querySelector(".hero__cta"), "body");
    }

    const tri = root.querySelector<HTMLElement>(".tri");
    if (tri) {
      tri.setAttribute("data-m-group", "");
      tagIfEmpty(tri.querySelector(".tri__left"), "body");
      tagIfEmpty(tri.querySelector(".tri__center"), "instrument");
    }
    tagIfEmpty(root.querySelector(".crail--large"), "instrument");
    tagIfEmpty(root.querySelector(".continuum__close"), "body");

    [".exec__grid", ".about__stats"].forEach((sel) => {
      root.querySelectorAll<HTMLElement>(sel).forEach((grid) => {
        grid.setAttribute("data-m-group", "");
        Array.from(grid.children).forEach((child) => tagIfEmpty(child, "frame"));
      });
    });

    const voidwalker = root.querySelector<HTMLElement>(".voidwalker");
    if (voidwalker) {
      voidwalker.setAttribute("data-m-group", "");
      const orbit = voidwalker.querySelector(".voidwalker__orbit");
      if (orbit) orbit.setAttribute("data-m", "instrument");
      const copy = voidwalker.querySelector(".voidwalker__copy");
      if (copy) tagIfEmpty(copy, "body");
    }

    const contact = root.querySelector<HTMLElement>(".contact");
    if (contact) {
      contact.setAttribute("data-m-group", "");
      tagIfEmpty(contact.querySelector(".station__idx"), "eyebrow");
      tagIfEmpty(contact.querySelector(".contact__title"), "title");
      tagIfEmpty(contact.querySelector(".contact__desc"), "body");
      tagIfEmpty(contact.querySelector(".contact__cta"), "body");
      tagIfEmpty(contact.querySelector(".contact__email"), "body");
    }

    // Set parallax speeds on decorative elements
    const parallaxMap: Array<[string, number]> = [
      [".hero__video", 0.03],
      [".tri__center", 0.04],
      [".voidwalker__orbit", 0.06],
    ];
    parallaxMap.forEach(([selector, speed]) => {
      root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (!el.hasAttribute("data-parallax")) el.setAttribute("data-parallax", String(speed));
      });
    });
  }, []);

  // Merge admin drafts over the persisted slot configs so the page
  // live-previews editor changes before they are saved.
  const drafts = useCelestialDrafts((s) => s.drafts);
  const mergedSlots = useMemo<SlotsMap | undefined>(() => {
    if (!celestialSlots) return undefined;
    const hasDrafts = Object.keys(drafts).length > 0;
    if (!hasDrafts) return celestialSlots;

    const merged = { ...celestialSlots };
    for (const [slotId, draftConfig] of Object.entries(drafts)) {
      if (merged[slotId]) {
        merged[slotId] = { ...merged[slotId], config: draftConfig };
      } else {
        merged[slotId] = {
          slot_id: slotId,
          config: draftConfig,
          orientation: "horizontal",
          enabled: true,
        };
      }
    }
    return merged;
  }, [celestialSlots, drafts]);

  return (
    <>
      <div
        ref={rootRef}
        className={bodyClass}
        data-theme="dark"
        style={
          {
            position: "relative",
            minHeight: "100vh",
            "--depth": 0,
            "--hero-cover": 0,
          } as React.CSSProperties
        }
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      {mergedSlots && <CelestialPortals slots={mergedSlots} containerRef={rootRef} />}
      <PhaseGlyphPortals containerRef={rootRef} />
      <CelestialEditorOverlay />
    </>
  );
}
