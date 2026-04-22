"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLandingScroll } from "./hooks/useLandingScroll";
import { useRevealMotion } from "./hooks/useRevealMotion";
import { useSigilChoreography } from "./hooks/useSigilChoreography";
import { CelestialPortals } from "./CelestialConnector/CelestialPortals";
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

  // Practice phasebar — event-delegated so handlers survive DOM re-paints.
  // Re-queries nodes inside every handler instead of capturing stale refs.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scrubberPositions = ["16%", "50%", "84%"];

    const activate = (index: number, options: { focus?: boolean } = {}) => {
      const phasebar = root.querySelector<HTMLElement>("#phasebar");
      if (!phasebar) return;
      const tabs = Array.from(phasebar.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      const phases = Array.from(root.querySelectorAll<HTMLElement>(".chamber__phase"));
      const cases = Array.from(root.querySelectorAll<HTMLElement>(".chamber__case"));
      const scrubber = root.querySelector<HTMLElement>("#chamberScrubber");
      const phaseIdx = root.querySelector<HTMLElement>("#chamberPhaseIdx");
      const idxMeta = root.querySelector<HTMLElement>("#chamberIdxMeta");

      tabs.forEach((t, i) => {
        const on = i === index;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      phases.forEach((p, i) => p.setAttribute("data-active", i === index ? "true" : "false"));
      cases.forEach((c, i) => c.setAttribute("data-active", i === index ? "true" : "false"));
      if (scrubber) scrubber.style.setProperty("--scrubber-y", scrubberPositions[index] || "50%");
      if (phaseIdx)
        phaseIdx.textContent = `${String(index + 1).padStart(2, "0")} / ${String(tabs.length).padStart(2, "0")}`;
      if (idxMeta) idxMeta.textContent = String(index + 1).padStart(2, "0");
      const horizontal = window.matchMedia("(min-width: 721px)").matches;
      if (horizontal) {
        phasebar.style.setProperty("--pbar-x", `${index * 100}%`);
        phasebar.style.removeProperty("--pbar-y");
      } else {
        phasebar.style.setProperty("--pbar-y", `${index * 100}%`);
        phasebar.style.removeProperty("--pbar-x");
      }
      if (options.focus) tabs[index]?.focus();
    };

    const onClick = (e: Event) => {
      const tab = (e.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]');
      if (!tab) return;
      const phasebar = root.querySelector<HTMLElement>("#phasebar");
      if (!phasebar) return;
      const tabs = Array.from(phasebar.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      const index = tabs.indexOf(tab);
      if (index >= 0) activate(index);
    };

    const onKeydown = (e: Event) => {
      const ke = e as KeyboardEvent;
      const tab = (ke.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]');
      if (!tab) return;
      const phasebar = root.querySelector<HTMLElement>("#phasebar");
      if (!phasebar) return;
      const tabs = Array.from(phasebar.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      const index = tabs.indexOf(tab);
      if (index < 0) return;
      if (ke.key === "ArrowRight" || ke.key === "ArrowDown") {
        ke.preventDefault();
        activate((index + 1) % tabs.length, { focus: true });
      } else if (ke.key === "ArrowLeft" || ke.key === "ArrowUp") {
        ke.preventDefault();
        activate((index - 1 + tabs.length) % tabs.length, { focus: true });
      } else if (ke.key === "Home") {
        ke.preventDefault();
        activate(0, { focus: true });
      } else if (ke.key === "End") {
        ke.preventDefault();
        activate(tabs.length - 1, { focus: true });
      }
    };

    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeydown);

    const onResize = () => {
      const phasebar = root.querySelector<HTMLElement>("#phasebar");
      if (!phasebar) return;
      const tabs = Array.from(phasebar.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      const currentIndex = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
      activate(Math.max(0, currentIndex));
    };
    window.addEventListener("resize", onResize);

    activate(0);

    // Generate chamber gutter ticks
    const chamberTicks = root.querySelector<HTMLElement>("#chamberTicks");
    if (chamberTicks && !chamberTicks.children.length) {
      for (let i = 0; i < 21; i++) {
        chamberTicks.appendChild(document.createElement("span"));
      }
    }

    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeydown);
      window.removeEventListener("resize", onResize);
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
      tagIfEmpty(tri.querySelector(".tri__right"), "frame");
    }
    tagIfEmpty(root.querySelector(".crail--large"), "instrument");
    tagIfEmpty(root.querySelector(".continuum__close"), "body");

    [".exec__grid", ".products", ".about__stats"].forEach((sel) => {
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
      <CelestialEditorOverlay />
    </>
  );
}
