"use client";

type PrototypeSource = {
  bodyClassName: string;
  bodyHtml: string;
  dataTheme: string;
  inlineStyles: string;
};

type MountOptions = {
  htmlText: string;
  tokensCss: string;
};

const SHADOW_BOOTSTRAP_CSS = `
:host {
  display: block;
  min-height: 100vh;
  background: #050403;
}

.v7-doc {
  position: relative;
  min-height: 100vh;
  --depth: 0;
}
`;

function parsePrototypeSource(htmlText: string): PrototypeSource {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(htmlText, "text/html");

  documentNode.querySelectorAll("script").forEach((node) => node.remove());

  const heroCta = documentNode.querySelector('a[href="#manifesto"]');
  if (heroCta) {
    heroCta.setAttribute("href", "#definition");
  }

  documentNode.querySelectorAll('img[src^="assets/logos/"]').forEach((node) => {
    const currentSrc = node.getAttribute("src");
    if (!currentSrc) return;
    node.setAttribute("src", currentSrc.replace("assets/logos/", "/logos/"));
  });

  return {
    bodyClassName: documentNode.body.className || "theme-instrument density-comfortable",
    bodyHtml: documentNode.body.innerHTML,
    dataTheme: documentNode.documentElement.getAttribute("data-theme") || "dark",
    inlineStyles: documentNode.querySelector("style")?.textContent || "",
  };
}

function scopePrototypeCss(tokensCss: string, inlineStyles: string) {
  return [SHADOW_BOOTSTRAP_CSS, tokensCss, inlineStyles]
    .join("\n")
    .replace(/:root/g, ".v7-doc")
    .replace(/\[data-theme="light"\]/g, '.v7-doc[data-theme="light"]')
    .replace(/html,\s*body/g, ":host, .v7-doc")
    .replace(/\bbody(?=(?:\.[A-Za-z-]+|\[[^\]]+\]|\s*\{))/g, ".v7-doc");
}

function initializePrototypeRuntime(root: ShadowRoot, docEl: HTMLElement) {
  const cleanups: Array<() => void> = [];
  const addCleanup = (cleanup: (() => void) | void) => {
    if (typeof cleanup === "function") {
      cleanups.push(cleanup);
    }
  };

  const query = <T extends Element>(selector: string, scope: ParentNode = docEl) =>
    selectElement<T>(selector, scope);
  const queryAll = <T extends Element>(selector: string, scope: ParentNode = docEl) =>
    selectAllElements<T>(selector, scope);

  const applyTweak = (key: string, value: string) => {
    if (key === "theme") {
      docEl.classList.remove("theme-instrument", "theme-latent");
      docEl.classList.add(`theme-${value}`);
      return;
    }

    if (key === "density") {
      docEl.classList.remove("density-spacious", "density-comfortable", "density-dense");
      docEl.classList.add(`density-${value}`);
      return;
    }

    if (key === "gateway") {
      docEl.setAttribute("data-gateway", value);
    }
  };

  const defaultTweaks = {
    theme: "instrument",
    density: "comfortable",
    gateway: "rings",
  };

  Object.entries(defaultTweaks).forEach(([key, value]) => applyTweak(key, value));
  const currentTweaks = { ...defaultTweaks };

  const buildTicks = (containerId: string, count = 24) => {
    const container = query<HTMLElement>(`#${containerId}`);
    if (!container) return;
    container.innerHTML = "";

    for (let i = 0; i < count; i += 1) {
      const tick = document.createElement("div");
      tick.className = "hud__rail__tick" + (i % 4 === 0 ? " hud__rail__tick--major" : "");
      tick.style.top = `${(i / (count - 1)) * 100}%`;
      container.appendChild(tick);

      if (i % 4 !== 0) continue;

      const label = document.createElement("div");
      label.className = "hud__rail__label";
      label.style.top = `${(i / (count - 1)) * 100}%`;
      label.style.transform = "translateY(-50%)";

      if (containerId === "leftTicks") {
        label.textContent = String(i * 2).padStart(2, "0");
      } else {
        const idx = Math.floor(i / 4) + 1;
        label.textContent = String(idx).padStart(2, "0");
      }

      container.appendChild(label);
    }
  };

  buildTicks("leftTicks");
  buildTicks("rightTicks");

  const stations = queryAll<HTMLElement>(".station");
  const navLinks = queryAll<HTMLAnchorElement>("#hudNav a");
  const depthIndicator = query<HTMLElement>("#depthIndicator");
  const progressBar = query<HTMLElement>("#progressBar");
  const hudProgress = query<HTMLElement>("#hudProgress");
  const hudSector = query<HTMLElement>("#hudSector");
  const hudSignalValue = query<HTMLElement>("#hudSignalV");
  const hudStatus = query<HTMLElement>("#hudStatus");
  const coordD = query<HTMLElement>("#coordD");
  const coordT = query<HTMLElement>("#coordT");
  const coordR = query<HTMLElement>("#coordR");
  const coordZ = query<HTMLElement>("#coordZ");

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

  const statuses: Record<string, string> = {
    hero: "Scroll to descend · the window stays · the world changes",
    definition: "Locating the sigil · adopt · encode · build",
    continuum: "Reading the spectrum · tool ↔ collaborator",
    practice: "Surveying practice · adopt → encode → build",
    services: "Approaching service triad · three instruments mapped",
    products: "Fleet constellation · 4 instruments in deck",
    about: "Telemetry nominal · crew identity resolved",
    contact: "Event horizon · awaiting handshake",
  };

  let scrollRafId: number | null = null;
  const onScroll = () => {
    if (scrollRafId) return;

    scrollRafId = window.requestAnimationFrame(() => {
      scrollRafId = null;
      const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / scrollMax));

      progressBar?.style.setProperty("--p", `${(progress * 100).toFixed(1)}%`);
      if (hudProgress) {
        hudProgress.textContent = `${String(Math.round(progress * 100)).padStart(2, "0")}%`;
      }

      if (depthIndicator) {
        depthIndicator.style.top = `${4 + progress * 92}%`;
      }

      if (coordD) coordD.textContent = (0.2 + progress * 0.55).toFixed(2);
      if (coordT) {
        coordT.textContent = `${String(Math.round(progress * 359)).padStart(
          3,
          "0"
        )}.${String(Math.round((progress * 10) % 10))}°`;
      }
      if (coordR) {
        coordR.textContent = (0.4 + Math.sin(progress * 6) * 0.25 + 0.3).toFixed(2);
      }
      if (coordZ) coordZ.textContent = (1.2 + progress * 5.8).toFixed(1);
      if (hudSignalValue) {
        hudSignalValue.textContent = (0.72 + Math.sin(progress * 4) * 0.12 + 0.05).toFixed(2);
      }

      docEl.style.setProperty("--depth", Math.min(1, progress * 1.2).toFixed(4));

      const viewportMid = window.scrollY + window.innerHeight / 2;
      let activeStation = stations[0];
      for (const station of stations) {
        if (station.offsetTop <= viewportMid) {
          activeStation = station;
        }
      }

      const activeKey = activeStation?.getAttribute("data-station") || activeStation?.id || "hero";

      navLinks.forEach((link) =>
        link.classList.toggle("is-active", link.getAttribute("data-station") === activeKey)
      );

      if (hudSector) hudSector.textContent = sectors[activeKey] || "Field";
      if (hudStatus) hudStatus.textContent = statuses[activeKey] || statuses.hero;
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
      const target = query<HTMLElement>(href);
      if (!target) return;
      event.preventDefault();
      window.scrollTo({
        top: target.offsetTop - 20,
        behavior: "smooth",
      });
    };

    link.addEventListener("click", onClick);
    addCleanup(() => link.removeEventListener("click", onClick));
  });

  const tweaksEl = query<HTMLElement>("#tweaks");
  if (tweaksEl) {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object" || !("type" in data)) return;
      const type = typeof data.type === "string" ? data.type : null;
      if (type === "__activate_edit_mode") {
        tweaksEl.classList.add("is-open");
      } else if (type === "__deactivate_edit_mode") {
        tweaksEl.classList.remove("is-open");
      }
    };

    window.addEventListener("message", onMessage);
    addCleanup(() => window.removeEventListener("message", onMessage));

    try {
      window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    } catch {
      // Parent messaging is optional outside design-mode embeds.
    }

    queryAll<HTMLElement>("#tweaks .tweaks__segmented").forEach((group) => {
      const key = group.getAttribute("data-tweak");
      if (!key) return;

      queryAll<HTMLButtonElement>("button", group).forEach((button) => {
        const onButtonClick = () => {
          const value = button.getAttribute("data-value");
          if (!value) return;

          queryAll<HTMLButtonElement>("button", group).forEach((other) =>
            other.classList.toggle("is-active", other === button)
          );

          currentTweaks[key as keyof typeof currentTweaks] = value;
          applyTweak(key, value);

          try {
            window.parent.postMessage(
              {
                type: "__edit_mode_set_keys",
                edits: { [key]: value },
              },
              "*"
            );
          } catch {
            // Parent messaging is optional outside design-mode embeds.
          }
        };

        button.addEventListener("click", onButtonClick);
        addCleanup(() => button.removeEventListener("click", onButtonClick));
      });
    });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tagIfEmpty = (element: Element | null, role: string) => {
    if (element && !element.hasAttribute("data-m")) {
      element.setAttribute("data-m", role);
    }
  };

  queryAll<HTMLElement>(".station").forEach((station) => {
    if (!station.hasAttribute("data-m-group")) {
      station.setAttribute("data-m-group", "");
    }
    tagIfEmpty(query(":scope > .station__idx", station), "eyebrow");
    tagIfEmpty(query(":scope > .station__title", station), "title");
    tagIfEmpty(query(":scope > .station__lede", station), "body");
  });

  const heroContent = query<HTMLElement>(".hero__content");
  if (heroContent) {
    heroContent.setAttribute("data-m-group", "");
    tagIfEmpty(query(".hero__wordmark", heroContent), "title");
    tagIfEmpty(query(".hero__tagline", heroContent), "body");
    tagIfEmpty(query(".hero__desc", heroContent), "body");
    tagIfEmpty(query(".hero__cta", heroContent), "body");
  }

  const tri = query<HTMLElement>(".tri");
  if (tri) {
    tri.setAttribute("data-m-group", "");
    tagIfEmpty(query(".tri__left", tri), "body");
    tagIfEmpty(query(".tri__center", tri), "instrument");
    tagIfEmpty(query(".tri__right", tri), "frame");
  }

  tagIfEmpty(query(".crail--large"), "instrument");
  tagIfEmpty(query(".continuum__close"), "body");

  const practiceNav = query<HTMLElement>(".practice-nav");
  if (practiceNav) {
    practiceNav.setAttribute("data-m", "fade");
  }

  [".services__deck", ".products", ".principles", ".about__stats"].forEach((selector) => {
    queryAll<HTMLElement>(selector).forEach((grid) => {
      grid.setAttribute("data-m-group", "");
      Array.from(grid.children).forEach((child) => tagIfEmpty(child, "frame"));
    });
  });

  const about = query<HTMLElement>(".about");
  if (about) {
    about.setAttribute("data-m-group", "");
    const dial = query(".about__dial", about);
    if (dial) dial.setAttribute("data-m", "instrument");
    Array.from(about.children).forEach((child) => {
      if (child !== dial) tagIfEmpty(child, "body");
    });
  }

  const contact = query<HTMLElement>(".contact");
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
    queryAll<HTMLElement>(selector).forEach((element) => {
      if (!element.hasAttribute("data-parallax")) {
        element.setAttribute("data-parallax", String(speed));
      }
    });
  });

  queryAll<HTMLElement>("[data-m-group]").forEach((group) => {
    let index = 0;
    queryAll<HTMLElement>(":scope > [data-m]", group).forEach((element) => {
      element.style.setProperty("--m-i", String(index));
      index += 1;
    });
  });

  const revealTargets = queryAll<HTMLElement>("[data-m]");
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

    revealTargets.forEach((target) => revealObserver.observe(target));
    addCleanup(() => revealObserver.disconnect());
  } else {
    revealTargets.forEach((target) => target.classList.add("is-in"));
  }

  const heroRaf = window.requestAnimationFrame(() => {
    queryAll<HTMLElement>(".hero [data-m]").forEach((element) => element.classList.add("is-in"));
  });
  addCleanup(() => window.cancelAnimationFrame(heroRaf));

  const safetySweep = () => {
    const viewportHeight = window.innerHeight;
    queryAll<HTMLElement>("[data-m]:not(.is-in)").forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < viewportHeight * 1.1) {
        element.classList.add("is-in");
      }
    });
  };

  const safetyFast = window.setTimeout(safetySweep, 900);
  const safetySlow = window.setTimeout(safetySweep, 2400);
  addCleanup(() => {
    window.clearTimeout(safetyFast);
    window.clearTimeout(safetySlow);
  });

  if (!reduceMotion) {
    const parallaxItems = queryAll<HTMLElement>("[data-parallax]");
    let parallaxTicking = false;

    const updateParallax = () => {
      parallaxTicking = false;
      const viewportHeight = window.innerHeight;
      const viewportCenter = window.scrollY + viewportHeight / 2;

      for (const element of parallaxItems) {
        const speed = parseFloat(element.dataset.parallax || "0") || 0;
        const rect = element.getBoundingClientRect();
        const elementCenter = window.scrollY + rect.top + rect.height / 2;
        const delta = elementCenter - viewportCenter;
        const translateY = -delta * speed;
        element.style.setProperty("--py", `${translateY.toFixed(1)}px`);
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
        for (const entry of entries) {
          entry.target.classList.toggle("is-offscreen", !entry.isIntersecting);
        }
      },
      { threshold: 0, rootMargin: "30% 0px 30% 0px" }
    );

    stations.forEach((station) => stationObserver.observe(station));
    addCleanup(() => stationObserver.disconnect());
  }

  const pnav = query<HTMLElement>(".pnav");
  if (pnav) {
    const tabs = queryAll<HTMLButtonElement>('[role="tab"]', pnav);
    const panels = queryAll<HTMLElement>(".pdetail__panel");

    const activate = (index: number, options: { focus?: boolean } = {}) => {
      tabs.forEach((tab, tabIndex) => {
        const isActive = tabIndex === index;
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel, panelIndex) => {
        panel.setAttribute("data-active", panelIndex === index ? "true" : "false");
      });

      const horizontal = window.matchMedia("(min-width: 821px)").matches;
      if (horizontal) {
        pnav.style.setProperty("--pnav-x", `${index * 100}%`);
        pnav.style.removeProperty("--pnav-y");
      } else {
        pnav.style.setProperty("--pnav-y", `${index * 100}%`);
        pnav.style.removeProperty("--pnav-x");
      }

      if (options.focus) {
        tabs[index]?.focus();
      }
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
      const currentIndex = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
      activate(Math.max(0, currentIndex));
    };

    window.addEventListener("resize", onTabsResize);
    addCleanup(() => window.removeEventListener("resize", onTabsResize));
    activate(0);
  }

  return () => {
    cleanups.reverse().forEach((cleanup) => cleanup());
    root.innerHTML = "";
  };
}

function selectElement<T extends Element>(selector: string, scope: ParentNode) {
  return scope.querySelector<T>(selector);
}

function selectAllElements<T extends Element>(selector: string, scope: ParentNode) {
  return Array.from(scope.querySelectorAll<T>(selector));
}

export function mountV7Prototype(host: HTMLElement, options: MountOptions) {
  const source = parsePrototypeSource(options.htmlText);
  const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  shadowRoot.innerHTML = "";

  const style = document.createElement("style");
  style.textContent = scopePrototypeCss(options.tokensCss, source.inlineStyles);

  const docEl = document.createElement("div");
  docEl.className = `v7-doc ${source.bodyClassName}`.trim();
  docEl.setAttribute("data-theme", source.dataTheme);
  docEl.innerHTML = source.bodyHtml;

  shadowRoot.append(style, docEl);

  return initializePrototypeRuntime(shadowRoot, docEl);
}
