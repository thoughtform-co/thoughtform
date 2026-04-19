"use client";

import { useEffect, useRef } from "react";

interface V7LandingProps {
  bodyHtml: string;
  bodyClass: string;
}

function query<T extends Element>(selector: string, scope: ParentNode): T | null {
  return scope.querySelector<T>(selector);
}

function queryAll<T extends Element>(selector: string, scope: ParentNode): T[] {
  return Array.from(scope.querySelectorAll<T>(selector));
}

function initV7Runtime(docEl: HTMLElement): () => void {
  const cleanups: Array<() => void> = [];
  const addCleanup = (fn: (() => void) | void) => {
    if (typeof fn === "function") cleanups.push(fn);
  };

  const applyTweak = (key: string, value: string) => {
    if (key === "theme") {
      docEl.classList.remove("theme-instrument", "theme-latent");
      docEl.classList.add(`theme-${value}`);
    } else if (key === "density") {
      docEl.classList.remove("density-spacious", "density-comfortable", "density-dense");
      docEl.classList.add(`density-${value}`);
    } else if (key === "gateway") {
      docEl.setAttribute("data-gateway", value);
    }
  };

  const defaultTweaks = { theme: "instrument", density: "comfortable", gateway: "rings" };
  Object.entries(defaultTweaks).forEach(([k, v]) => applyTweak(k, v));
  const currentTweaks = { ...defaultTweaks };

  // Ticks and section markers are pre-rendered server-side in v7-parse.ts
  // so React's reconciliation cannot wipe them. We only attach event handlers
  // and track references for the scroll-driven active-state logic.
  const markerEls: Array<{ el: HTMLElement; station: string }> = queryAll<HTMLElement>(
    "#rightMarkers .hud__marker",
    docEl
  ).map((el) => ({ el, station: el.getAttribute("data-station") || "" }));

  const stations = queryAll<HTMLElement>(".station", docEl);
  const navLinks = queryAll<HTMLAnchorElement>("#hudNav a", docEl);
  const depthIndicator = query<HTMLElement>("#depthIndicator", docEl);
  const hudSector = query<HTMLElement>("#hudSector", docEl);
  const heroEl = query<HTMLElement>("#hero", docEl);
  const defEl = query<HTMLElement>("#definition", docEl);
  const contEl = query<HTMLElement>("#continuum", docEl);
  const sigilMark = query<HTMLElement>(".sigil__mark", docEl);
  const hudBrandmark = query<HTMLElement>("#hudBrandmark", docEl);
  const hudBrandmarkOverlay = query<HTMLElement>("#hudBrandmarkOverlay", docEl);
  let brandmarkHandoffComplete = false;

  const sectors: Record<string, string> = {
    hero: "Origin",
    definition: "North star",
    continuum: "Continuum",
    practice: "Field",
    services: "Runway",
    products: "Fleet",
    about: "Story",
    contact: "Horizon",
  };

  let scrollRafId: number | null = null;
  const onScroll = () => {
    if (scrollRafId) return;
    scrollRafId = window.requestAnimationFrame(() => {
      scrollRafId = null;
      const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / scrollMax));

      if (depthIndicator) depthIndicator.style.top = `${progress * 100}%`;
      docEl.style.setProperty("--depth", Math.min(1, progress * 1.2).toFixed(4));

      if (heroEl && defEl) {
        const defTop = defEl.getBoundingClientRect().top;
        const vh = window.innerHeight;
        heroEl.style.setProperty(
          "--hero-cover",
          Math.max(0, Math.min(1, 1 - defTop / vh)).toFixed(4)
        );
      }

      const viewportMid = window.scrollY + window.innerHeight / 2;
      let activeStation = stations[0];
      for (const station of stations) {
        if (station.offsetTop <= viewportMid) activeStation = station;
      }

      const activeKey = activeStation?.getAttribute("data-station") || activeStation?.id || "hero";
      const stationOrder = stations.map((s) => s.getAttribute("data-station") || s.id);
      const activeIdx = stationOrder.indexOf(activeKey);

      navLinks.forEach((link) =>
        link.classList.toggle("is-active", link.getAttribute("data-station") === activeKey)
      );
      markerEls.forEach((m) => {
        const mIdx = stationOrder.indexOf(m.station);
        m.el.classList.toggle("is-active", m.station === activeKey);
        m.el.classList.toggle("is-past", mIdx < activeIdx);
      });
      if (hudSector) hudSector.textContent = sectors[activeKey] || "Field";

      if (defEl && contEl && sigilMark && hudBrandmark && hudBrandmarkOverlay) {
        const contRect = contEl.getBoundingClientRect();
        const vh = window.innerHeight;
        const handoffT = Math.max(0, Math.min(1, 1 - contRect.top / vh));
        if (handoffT <= 0) {
          hudBrandmarkOverlay.style.display = "none";
          hudBrandmark.classList.remove("is-visible");
          brandmarkHandoffComplete = false;
        } else if (handoffT < 1 && !brandmarkHandoffComplete) {
          const srcRect = sigilMark.getBoundingClientRect();
          const dstRect = hudBrandmark.getBoundingClientRect();
          const eased = handoffT * handoffT * (3 - 2 * handoffT);
          const cx =
            srcRect.left +
            srcRect.width / 2 +
            (dstRect.left + dstRect.width / 2 - srcRect.left - srcRect.width / 2) * eased;
          const cy =
            srcRect.top +
            srcRect.height / 2 +
            (dstRect.top + dstRect.height / 2 - srcRect.top - srcRect.height / 2) * eased;
          const size = srcRect.width + (dstRect.width - srcRect.width) * eased;
          hudBrandmarkOverlay.style.display = "block";
          hudBrandmarkOverlay.style.width = `${size}px`;
          hudBrandmarkOverlay.style.height = `${size}px`;
          hudBrandmarkOverlay.style.left = `${cx - size / 2}px`;
          hudBrandmarkOverlay.style.top = `${cy - size / 2}px`;
          hudBrandmarkOverlay.style.opacity = String(Math.min(1, handoffT * 2));
          hudBrandmark.classList.remove("is-visible");
        } else {
          hudBrandmarkOverlay.style.display = "none";
          hudBrandmark.classList.add("is-visible");
          brandmarkHandoffComplete = true;
        }
      }
    });
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  addCleanup(() => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    if (scrollRafId) window.cancelAnimationFrame(scrollRafId);
  });

  navLinks.forEach((link) => {
    const onClick = (event: MouseEvent) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const target = query<HTMLElement>(href, docEl);
      if (!target) return;
      event.preventDefault();
      window.scrollTo({ top: target.offsetTop - 20, behavior: "smooth" });
    };
    link.addEventListener("click", onClick);
    addCleanup(() => link.removeEventListener("click", onClick));
  });

  markerEls.forEach(({ el, station }) => {
    const onMarkerClick = () => {
      const target = query<HTMLElement>(`#${station}`, docEl);
      if (!target) return;
      window.scrollTo({ top: target.offsetTop - 20, behavior: "smooth" });
    };
    el.addEventListener("click", onMarkerClick);
    addCleanup(() => el.removeEventListener("click", onMarkerClick));
  });

  const tweaksEl = query<HTMLElement>("#tweaks", docEl);
  if (tweaksEl) {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object" || !("type" in data)) return;
      const type = typeof data.type === "string" ? data.type : null;
      if (type === "__activate_edit_mode") tweaksEl.classList.add("is-open");
      else if (type === "__deactivate_edit_mode") tweaksEl.classList.remove("is-open");
    };
    window.addEventListener("message", onMessage);
    addCleanup(() => window.removeEventListener("message", onMessage));
    queryAll<HTMLElement>("#tweaks .tweaks__segmented", docEl).forEach((group) => {
      const key = group.getAttribute("data-tweak");
      if (!key) return;
      queryAll<HTMLButtonElement>("button", group).forEach((button) => {
        const onButtonClick = () => {
          const value = button.getAttribute("data-value");
          if (!value) return;
          queryAll<HTMLButtonElement>("button", group).forEach((o) =>
            o.classList.toggle("is-active", o === button)
          );
          currentTweaks[key as keyof typeof currentTweaks] = value;
          applyTweak(key, value);
        };
        button.addEventListener("click", onButtonClick);
        addCleanup(() => button.removeEventListener("click", onButtonClick));
      });
    });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tagIfEmpty = (element: Element | null, role: string) => {
    if (element && !element.hasAttribute("data-m")) element.setAttribute("data-m", role);
  };

  queryAll<HTMLElement>(".station", docEl).forEach((station) => {
    if (!station.hasAttribute("data-m-group")) station.setAttribute("data-m-group", "");
    tagIfEmpty(query(":scope > .station__idx", station), "eyebrow");
    tagIfEmpty(query(":scope > .station__title", station), "title");
    tagIfEmpty(query(":scope > .station__lede", station), "body");
  });

  const heroContent = query<HTMLElement>(".hero__content", docEl);
  if (heroContent) {
    heroContent.setAttribute("data-m-group", "");
    tagIfEmpty(query(".hero__wordmark", heroContent), "title");
    tagIfEmpty(query(".hero__tagline", heroContent), "body");
    tagIfEmpty(query(".hero__desc", heroContent), "body");
    tagIfEmpty(query(".hero__cta", heroContent), "body");
  }

  const tri = query<HTMLElement>(".tri", docEl);
  if (tri) {
    tri.setAttribute("data-m-group", "");
    tagIfEmpty(query(".tri__left", tri), "body");
    tagIfEmpty(query(".tri__center", tri), "instrument");
    tagIfEmpty(query(".tri__right", tri), "frame");
  }
  tagIfEmpty(query(".crail--large", docEl), "instrument");
  tagIfEmpty(query(".continuum__close", docEl), "body");
  const practiceNav = query<HTMLElement>(".practice-nav", docEl);
  if (practiceNav) practiceNav.setAttribute("data-m", "fade");

  [".services__deck", ".products", ".principles", ".about__stats"].forEach((sel) => {
    queryAll<HTMLElement>(sel, docEl).forEach((grid) => {
      grid.setAttribute("data-m-group", "");
      Array.from(grid.children).forEach((child) => tagIfEmpty(child, "frame"));
    });
  });

  const about = query<HTMLElement>(".about", docEl);
  if (about) {
    about.setAttribute("data-m-group", "");
    const dial = query(".about__dial", about);
    if (dial) dial.setAttribute("data-m", "instrument");
    Array.from(about.children).forEach((child) => {
      if (child !== dial) tagIfEmpty(child, "body");
    });
  }

  const contact = query<HTMLElement>(".contact", docEl);
  if (contact) {
    contact.setAttribute("data-m-group", "");
    tagIfEmpty(query(".station__idx", contact), "eyebrow");
    tagIfEmpty(query(".contact__title", contact), "title");
    tagIfEmpty(query(".contact__desc", contact), "body");
    tagIfEmpty(query(".contact__cta", contact), "body");
    tagIfEmpty(query(".contact__email", contact), "body");
  }

  const parallaxMap: Array<[string, number]> = [
    [".hero__video", 0.03],
    [".tri__center", 0.04],
    [".about__dial", 0.06],
    [".hud__corner--tl", 0.015],
    [".hud__corner--tr", 0.015],
    [".hud__corner--bl", -0.015],
    [".hud__corner--br", -0.015],
  ];
  parallaxMap.forEach(([selector, speed]) => {
    queryAll<HTMLElement>(selector, docEl).forEach((element) => {
      if (!element.hasAttribute("data-parallax"))
        element.setAttribute("data-parallax", String(speed));
    });
  });

  queryAll<HTMLElement>("[data-m-group]", docEl).forEach((group) => {
    let index = 0;
    queryAll<HTMLElement>(":scope > [data-m]", group).forEach((element) => {
      element.style.setProperty("--m-i", String(index));
      index += 1;
    });
  });

  const revealTargets = queryAll<HTMLElement>("[data-m]", docEl);
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach((t) => revealObserver.observe(t));
    addCleanup(() => revealObserver.disconnect());
  } else {
    revealTargets.forEach((t) => t.classList.add("is-in"));
  }

  const heroRaf = window.requestAnimationFrame(() => {
    queryAll<HTMLElement>(".hero [data-m]", docEl).forEach((el) => el.classList.add("is-in"));
  });
  addCleanup(() => window.cancelAnimationFrame(heroRaf));

  const safetySweep = () => {
    const viewportHeight = window.innerHeight;
    queryAll<HTMLElement>("[data-m]:not(.is-in)", docEl).forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < viewportHeight * 1.1) element.classList.add("is-in");
    });
  };
  const safetyFast = window.setTimeout(safetySweep, 900);
  const safetySlow = window.setTimeout(safetySweep, 2400);
  addCleanup(() => {
    window.clearTimeout(safetyFast);
    window.clearTimeout(safetySlow);
  });

  if (!reduceMotion) {
    const parallaxItems = queryAll<HTMLElement>("[data-parallax]", docEl);
    let parallaxTicking = false;
    const updateParallax = () => {
      parallaxTicking = false;
      const viewportHeight = window.innerHeight;
      const viewportCenter = window.scrollY + viewportHeight / 2;
      for (const element of parallaxItems) {
        const speed = parseFloat(element.dataset.parallax || "0") || 0;
        const rect = element.getBoundingClientRect();
        const elementCenter = window.scrollY + rect.top + rect.height / 2;
        element.style.setProperty(
          "--py",
          `${(-(elementCenter - viewportCenter) * speed).toFixed(1)}px`
        );
      }
    };
    const onParallaxScroll = () => {
      if (parallaxTicking) return;
      parallaxTicking = true;
      window.requestAnimationFrame(updateParallax);
    };
    updateParallax();
    window.addEventListener("scroll", onParallaxScroll, { passive: true });
    window.addEventListener("resize", onParallaxScroll);
    addCleanup(() => {
      window.removeEventListener("scroll", onParallaxScroll);
      window.removeEventListener("resize", onParallaxScroll);
    });
  }

  if ("IntersectionObserver" in window && stations.length) {
    const stationObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          entry.target.classList.toggle("is-offscreen", !entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "30% 0px 30% 0px" }
    );
    stations.forEach((s) => stationObserver.observe(s));
    addCleanup(() => stationObserver.disconnect());
  }

  const pnav = query<HTMLElement>(".pnav", docEl);
  if (pnav) {
    const tabs = queryAll<HTMLButtonElement>('[role="tab"]', pnav);
    const panels = queryAll<HTMLElement>(".pdetail__panel", docEl);
    const activate = (index: number, options: { focus?: boolean } = {}) => {
      tabs.forEach((tab, ti) => {
        tab.setAttribute("aria-selected", ti === index ? "true" : "false");
        tab.tabIndex = ti === index ? 0 : -1;
      });
      panels.forEach((panel, pi) =>
        panel.setAttribute("data-active", pi === index ? "true" : "false")
      );
      const horizontal = window.matchMedia("(min-width: 821px)").matches;
      if (horizontal) {
        pnav.style.setProperty("--pnav-x", `${index * 100}%`);
        pnav.style.removeProperty("--pnav-y");
      } else {
        pnav.style.setProperty("--pnav-y", `${index * 100}%`);
        pnav.style.removeProperty("--pnav-x");
      }
      if (options.focus) tabs[index]?.focus();
    };
    tabs.forEach((tab, index) => {
      const onTabClick = () => activate(index);
      const onTabKeydown = (event: KeyboardEvent) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          activate((index + 1) % tabs.length, { focus: true });
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          activate((index - 1 + tabs.length) % tabs.length, { focus: true });
        } else if (event.key === "Home") {
          event.preventDefault();
          activate(0, { focus: true });
        } else if (event.key === "End") {
          event.preventDefault();
          activate(tabs.length - 1, { focus: true });
        }
      };
      tab.addEventListener("click", onTabClick);
      tab.addEventListener("keydown", onTabKeydown);
      addCleanup(() => {
        tab.removeEventListener("click", onTabClick);
        tab.removeEventListener("keydown", onTabKeydown);
      });
    });
    const onTabsResize = () => {
      const currentIndex = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
      activate(Math.max(0, currentIndex));
    };
    window.addEventListener("resize", onTabsResize);
    addCleanup(() => window.removeEventListener("resize", onTabsResize));
    activate(0);
  }

  return () => {
    cleanups.reverse().forEach((fn) => fn());
  };
}

export function V7Landing({ bodyHtml, bodyClass }: V7LandingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      return initV7Runtime(el);
    } catch (err) {
      console.error("[V7Runtime] init failed:", err);
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`v7-doc ${bodyClass}`}
      data-theme="dark"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: bodyHtml }}
    />
  );
}
