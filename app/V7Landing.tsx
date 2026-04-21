"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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

function initSigilChoreography(docEl: HTMLElement): () => void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const defEl = query<HTMLElement>("#definition", docEl);
  const contEl = query<HTMLElement>("#continuum", docEl);
  const sigilOrbits = query<HTMLElement>(".sigil__orbits", docEl);
  const sigilHalo = query<HTMLElement>(".sigil__halo", docEl);
  const sigilMark = query<HTMLElement>(".sigil__mark", docEl);
  const sigilCap = query<HTMLElement>(".sigil__cap", docEl);
  const triLeft = query<HTMLElement>(".tri__left", docEl);
  const triRight = query<HTMLElement>(".tri__right", docEl);
  const hudBrandmark = query<HTMLElement>("#hudBrandmark", docEl);

  if (!defEl || !contEl || !sigilOrbits || !sigilMark || !hudBrandmark) {
    return () => {};
  }

  const section2Els = [sigilOrbits, sigilHalo, sigilMark, sigilCap, triLeft, triRight].filter(
    Boolean
  ) as HTMLElement[];
  section2Els.forEach((el) => {
    el.removeAttribute("data-m");
    el.classList.add("is-in");
  });

  if (reduceMotion) {
    gsap.set([sigilOrbits, sigilHalo, sigilMark, sigilCap, triLeft, triRight].filter(Boolean), {
      opacity: 1,
      scale: 1,
      y: 0,
      clearProps: "transform",
    });
    hudBrandmark.classList.add("is-visible");
    return () => {};
  }

  const sigilImg = query<HTMLImageElement>(".sigil__mark img", docEl);
  const travelMark = document.createElement("div");
  travelMark.setAttribute("aria-hidden", "true");
  Object.assign(travelMark.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: "0px",
    height: "0px",
    opacity: "0",
    pointerEvents: "none",
    zIndex: "24",
    willChange: "left, top, width, height, opacity",
  });
  if (sigilImg) {
    const travelImg = sigilImg.cloneNode(true) as HTMLImageElement;
    Object.assign(travelImg.style, {
      width: "100%",
      height: "100%",
      display: "block",
      filter: "drop-shadow(0 0 24px rgba(202,165,84,0.25))",
    });
    travelMark.appendChild(travelImg);
  }
  docEl.appendChild(travelMark);

  const ctx = gsap.context(() => {
    gsap.set([sigilOrbits, sigilHalo], { opacity: 0, scale: 0.6, rotation: -8 });
    gsap.set(sigilMark, { opacity: 0, scale: 0.7 });
    gsap.set([sigilCap, triLeft, triRight].filter(Boolean), { opacity: 0, y: 16 });

    const entranceTl = gsap.timeline({
      scrollTrigger: {
        trigger: defEl,
        start: "top 85%",
        end: "top 35%",
        scrub: 0.6,
      },
    });

    entranceTl
      .to(
        [sigilOrbits, sigilHalo].filter(Boolean),
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.5,
          ease: "power3.out",
        },
        0
      )
      .to(
        sigilMark,
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "power3.out",
        },
        0.15
      )
      .to(
        [sigilCap].filter(Boolean),
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: "power3.out",
        },
        0.3
      )
      .to(
        [triLeft, triRight].filter(Boolean),
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power3.out",
          stagger: 0.08,
        },
        0.25
      );

    // Cinematic ease curve — slow start, accelerate through middle, slow settle.
    // Matches the shape designers reach for in After Effects / Premiere.
    const handoffEase = gsap.parseEase("power3.inOut");

    let handoffStartRect: DOMRect | null = null;
    let handoffTargetRect: DOMRect | null = null;
    let handoffArmed = false;

    const captureHandoffRects = () => {
      // Ensure the original sigil is visible for an accurate measurement,
      // even if it was left hidden by a previous forward pass.
      gsap.set(sigilMark, { opacity: 1, "--frame-opacity": 1 });
      handoffStartRect = sigilMark.getBoundingClientRect();
      handoffTargetRect = hudBrandmark.getBoundingClientRect();
    };

    const resetHandoff = () => {
      handoffArmed = false;
      handoffStartRect = null;
      handoffTargetRect = null;
      gsap.set(travelMark, { opacity: 0 });
      gsap.set(sigilMark, { opacity: 1, "--frame-opacity": 1 });
      hudBrandmark.classList.remove("is-visible");
    };

    const applyHandoff = (p: number) => {
      if (!handoffArmed || !handoffStartRect || !handoffTargetRect) {
        return;
      }
      if (p <= 0) {
        gsap.set(travelMark, { opacity: 0 });
        gsap.set(sigilMark, { opacity: 1, "--frame-opacity": 1 });
        return;
      }

      const eased = handoffEase(p);
      const src = handoffStartRect;
      const dst = handoffTargetRect;

      gsap.set(travelMark, {
        left: src.left + (dst.left - src.left) * eased,
        top: src.top + (dst.top - src.top) * eased,
        width: src.width + (dst.width - src.width) * eased,
        height: src.height + (dst.height - src.height) * eased,
        opacity: 1,
      });
      gsap.set(sigilMark, { opacity: 0, "--frame-opacity": 0 });
    };

    const handoffTl = gsap.timeline({
      scrollTrigger: {
        trigger: contEl,
        start: "top 80%",
        end: "top 5%",
        scrub: 1.8,
        onEnter: () => {
          captureHandoffRects();
          handoffArmed = true;
        },
        onEnterBack: () => {
          captureHandoffRects();
          handoffArmed = true;
        },
        onLeaveBack: () => resetHandoff(),
        onRefresh: (self) => {
          if (self.progress > 0) {
            captureHandoffRects();
            handoffArmed = true;
            applyHandoff(self.progress);
          } else {
            resetHandoff();
          }
        },
        onUpdate: (self) => applyHandoff(self.progress),
      },
    });

    handoffTl.to(
      [sigilOrbits, sigilHalo, sigilCap].filter(Boolean),
      {
        opacity: 0,
        scale: 0.7,
        duration: 0.6,
        ease: "power2.inOut",
      },
      0
    );
  }, docEl);

  return () => {
    ctx.revert();
    travelMark.remove();
  };
}

function initV7Runtime(docEl: HTMLElement): () => void {
  const cleanups: Array<() => void> = [];
  const addCleanup = (fn: (() => void) | void) => {
    if (typeof fn === "function") cleanups.push(fn);
  };

  addCleanup(initSigilChoreography(docEl));

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

  const stations = queryAll<HTMLElement>(".station", docEl);
  const navLinks = queryAll<HTMLAnchorElement>("#hudNav a", docEl);
  const depthIndicator = query<HTMLElement>("#depthIndicator", docEl);
  const hudSector = query<HTMLElement>("#hudSector", docEl);
  const hudProgress = query<HTMLElement>("#hudProgress", docEl);
  const coordD = query<HTMLElement>("#coordD", docEl);
  const coordT = query<HTMLElement>("#coordT", docEl);
  const heroEl = query<HTMLElement>("#hero", docEl);
  const defEl = query<HTMLElement>("#definition", docEl);

  const sectors: Record<string, string> = {
    hero: "Origin",
    definition: "North star",
    continuum: "Continuum",
    practice: "Field",
    about: "Story",
    products: "Fleet",
    contact: "Horizon",
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const parallaxCache: Array<{ el: HTMLElement; speed: number; top: number; height: number }> = [];
  const rebuildParallaxCache = () => {
    parallaxCache.length = 0;
    for (const el of queryAll<HTMLElement>("[data-parallax]", docEl)) {
      const speed = parseFloat(el.dataset.parallax || "0") || 0;
      parallaxCache.push({ el, speed, top: el.offsetTop, height: el.offsetHeight });
    }
  };

  let lastScrollY = -1;
  let scrollRafId: number | null = null;
  const onScrollFrame = () => {
    scrollRafId = null;
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const scrollMax = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
    const progress = Math.max(0, Math.min(1, scrollY / scrollMax));

    if (depthIndicator) depthIndicator.style.top = `${progress * 100}%`;
    if (hudProgress)
      hudProgress.textContent = `${String(Math.round(progress * 100)).padStart(2, "0")}%`;
    docEl.style.setProperty("--depth", Math.min(1, progress * 1.2).toFixed(4));

    if (coordD) coordD.textContent = (0.2 + progress * 0.55).toFixed(2);
    if (coordT)
      coordT.textContent = `${String(Math.round(progress * 359)).padStart(3, "0")}.${String(Math.round((progress * 10) % 10))}\u00b0`;

    if (heroEl && defEl) {
      const defTop = defEl.getBoundingClientRect().top;
      const heroCoverVal = Math.max(0, Math.min(1, 1 - defTop / viewportHeight));
      heroEl.style.setProperty("--hero-cover", heroCoverVal.toFixed(4));
      heroEl.style.visibility = heroCoverVal >= 1 ? "hidden" : "";
    }

    const viewportMid = scrollY + viewportHeight / 2;
    let activeStation = stations[0];
    for (const station of stations) {
      if (station.offsetTop <= viewportMid) activeStation = station;
    }

    const activeKey = activeStation?.getAttribute("data-station") || activeStation?.id || "hero";

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("data-station") === activeKey;
      link.classList.toggle("is-active", isActive);
    });
    if (hudSector) hudSector.textContent = sectors[activeKey] || "Field";

    if (!reduceMotion && scrollY !== lastScrollY) {
      lastScrollY = scrollY;
      const viewportCenter = scrollY + viewportHeight / 2;
      for (const item of parallaxCache) {
        const elementCenter = item.top + item.height / 2;
        item.el.style.setProperty(
          "--py",
          `${(-(elementCenter - viewportCenter) * item.speed).toFixed(1)}px`
        );
      }
    }
  };

  const onScroll = () => {
    if (scrollRafId) return;
    scrollRafId = window.requestAnimationFrame(onScrollFrame);
  };

  const onResize = () => {
    rebuildParallaxCache();
    onScroll();
  };

  onScrollFrame();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  addCleanup(() => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    if (scrollRafId) window.cancelAnimationFrame(scrollRafId);
  });

  // Hamburger menu toggle
  const hudNav = query<HTMLElement>(".hud__nav", docEl);
  const hudNavBtn = query<HTMLButtonElement>(".hud__nav__btn", docEl);
  if (hudNav && hudNavBtn) {
    const toggleMenu = () => hudNav.classList.toggle("is-open");
    hudNavBtn.addEventListener("click", toggleMenu);
    addCleanup(() => hudNavBtn.removeEventListener("click", toggleMenu));
  }

  navLinks.forEach((link) => {
    const onClick = (event: MouseEvent) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const target = query<HTMLElement>(href, docEl);
      if (!target) return;
      event.preventDefault();
      if (hudNav) hudNav.classList.remove("is-open");
      window.scrollTo({ top: target.offsetTop - 20, behavior: "smooth" });
    };
    link.addEventListener("click", onClick);
    addCleanup(() => link.removeEventListener("click", onClick));
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

  [".exec__grid", ".products", ".about__stats"].forEach((sel) => {
    queryAll<HTMLElement>(sel, docEl).forEach((grid) => {
      grid.setAttribute("data-m-group", "");
      Array.from(grid.children).forEach((child) => tagIfEmpty(child, "frame"));
    });
  });

  const voidwalker = query<HTMLElement>(".voidwalker", docEl);
  if (voidwalker) {
    voidwalker.setAttribute("data-m-group", "");
    const orbit = query(".voidwalker__orbit", voidwalker);
    if (orbit) orbit.setAttribute("data-m", "instrument");
    const copy = query(".voidwalker__copy", voidwalker);
    if (copy) tagIfEmpty(copy, "body");
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
    [".voidwalker__orbit", 0.06],
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

  rebuildParallaxCache();

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

  // Phasebar controller (Adopt / Encode / Build tabs in the practice chamber)
  const phasebar = query<HTMLElement>("#phasebar", docEl);
  if (phasebar) {
    const tabs = queryAll<HTMLButtonElement>('[role="tab"]', phasebar);
    const phases = queryAll<HTMLElement>(".chamber__phase", docEl);
    const cases = queryAll<HTMLElement>(".chamber__case", docEl);
    const scrubber = query<HTMLElement>("#chamberScrubber", docEl);
    const phaseIdx = query<HTMLElement>("#chamberPhaseIdx", docEl);
    const idxMeta = query<HTMLElement>("#chamberIdxMeta", docEl);

    const scrubberPositions = ["16%", "50%", "84%"];
    const activate = (index: number, options: { focus?: boolean } = {}) => {
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

  // Generate chamber gutter ticks
  const chamberTicks = query<HTMLElement>("#chamberTicks", docEl);
  if (chamberTicks && !chamberTicks.children.length) {
    for (let i = 0; i < 21; i++) {
      const tick = document.createElement("span");
      chamberTicks.appendChild(tick);
    }
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
