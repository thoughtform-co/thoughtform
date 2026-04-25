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

  // Approach scroll-driven phase controller — IntersectionObserver watches
  // .approach__phase elements and updates the scrubber position on the spine.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const phases = Array.from(root.querySelectorAll<HTMLElement>(".approach__phase"));
    const scrubber = root.querySelector<HTMLElement>("#chamberScrubber");
    const total = phases.length;

    if (!phases.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!top) return;
        const i = phases.indexOf(top.target as HTMLElement);
        if (i < 0) return;
        phases.forEach((p, j) => p.setAttribute("data-active", j === i ? "true" : "false"));
        if (scrubber) {
          const pct = total > 1 ? (i / (total - 1)) * 84 + 8 : 50;
          scrubber.style.setProperty("--scrubber-y", `${pct}%`);
        }
      },
      { threshold: [0.3, 0.5], rootMargin: "-20% 0px -40% 0px" }
    );
    phases.forEach((p) => io.observe(p));

    const spine = root.querySelector<HTMLElement>(".approach__spine");
    const canMeasureSpine = () => Boolean(spine && getComputedStyle(spine).display !== "none");

    const measureSpineAnchors = () => {
      if (!canMeasureSpine() || !phases.length) return;
      const spineEl = spine!;
      const spineRect = spineEl.getBoundingClientRect();
      const spineH = spineRect.height || 1;
      phases.forEach((phase, idx) => {
        const r = phase.getBoundingClientRect();
        const mid = r.top + r.height / 2 - spineRect.top;
        spineEl.style.setProperty(`--anchor-${idx + 1}-y`, `${(mid / spineH) * 100}%`);
      });
      for (let t = 0; t < phases.length - 1; t++) {
        const phaseRect = phases[t].getBoundingClientRect();
        const boundary = phaseRect.bottom - spineRect.top;
        const pct = (boundary / spineH) * 100;
        spineEl.style.setProperty(`--transit-${t + 1}-y`, `${pct}%`);
      }
    };

    let raf = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        measureSpineAnchors();
      });
    };

    let ro: ResizeObserver | null = null;
    const setupSpineResizeObservers = () => {
      ro?.disconnect();
      ro = null;
      if (typeof ResizeObserver === "undefined" || !spine) return;
      if (!canMeasureSpine()) return;
      ro = new ResizeObserver(() => {
        scheduleMeasure();
      });
      ro.observe(spine);
      phases.forEach((p) => ro!.observe(p));
    };

    measureSpineAnchors();
    setupSpineResizeObservers();

    const onWinResize = () => {
      setupSpineResizeObservers();
      scheduleMeasure();
    };
    window.addEventListener("resize", onWinResize);

    return () => {
      io.disconnect();
      window.removeEventListener("resize", onWinResize);
      cancelAnimationFrame(raf);
      ro?.disconnect();
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
