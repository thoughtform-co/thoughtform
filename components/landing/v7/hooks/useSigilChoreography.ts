"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function query<T extends Element>(selector: string, scope: ParentNode): T | null {
  return scope.querySelector<T>(selector);
}

export function useSigilChoreography(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const docEl = rootRef.current;
    if (!docEl) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const defEl = query<HTMLElement>("#definition", docEl);
    const contEl = query<HTMLElement>("#continuum", docEl);
    const sigilOrbits = query<HTMLElement>(".sigil__orbits", docEl);
    const sigilHalo = query<HTMLElement>(".sigil__halo", docEl);
    const sigilMark = query<HTMLElement>(".sigil__mark", docEl);
    const sigilCap = query<HTMLElement>(".sigil__cap", docEl);
    const triLeft = query<HTMLElement>(".tri__left", docEl);
    const sigilLegend = query<HTMLElement>(".sigil__legend", docEl);
    const hudEl = query<HTMLElement>(".hud", docEl);
    const hudBrandmark = query<HTMLElement>("#hudBrandmark", docEl);

    if (!defEl || !contEl || !sigilOrbits || !sigilMark || !hudBrandmark) {
      return;
    }

    const section2Els = [sigilOrbits, sigilHalo, sigilMark, sigilCap, sigilLegend, triLeft].filter(
      Boolean
    ) as HTMLElement[];
    section2Els.forEach((el) => {
      el.removeAttribute("data-m");
      el.classList.add("is-in");
    });

    if (reduceMotion) {
      gsap.set(
        [sigilOrbits, sigilHalo, sigilMark, sigilCap, sigilLegend, triLeft].filter(Boolean),
        {
          opacity: 1,
          scale: 1,
          y: 0,
          clearProps: "transform",
        }
      );
      hudBrandmark.classList.add("is-visible");
      hudEl?.classList.add("hud--brandmark-active");
      return;
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

    const handoffEase = gsap.parseEase("power3.inOut");
    let handoffStartRect: DOMRect | null = null;
    let handoffTargetRect: DOMRect | null = null;
    let handoffArmed = false;

    const captureHandoffRects = () => {
      gsap.set(sigilMark, {
        opacity: 1,
        scale: 1,
        "--frame-opacity": 1,
        clearProps: "rotation",
      });
      handoffStartRect = sigilMark.getBoundingClientRect();
      handoffTargetRect = hudBrandmark.getBoundingClientRect();
    };

    const dock = () => {
      gsap.set(travelMark, { opacity: 0 });
      gsap.set(sigilMark, { opacity: 0, "--frame-opacity": 0 });
      hudBrandmark.classList.add("is-visible");
      hudEl?.classList.add("hud--brandmark-active");
    };

    const resetHandoff = () => {
      handoffArmed = false;
      handoffStartRect = null;
      handoffTargetRect = null;
      gsap.set(travelMark, { opacity: 0 });
      gsap.set(sigilMark, { opacity: 1, "--frame-opacity": 1 });
      hudBrandmark.classList.remove("is-visible");
      hudEl?.classList.remove("hud--brandmark-active");
    };

    const applyHandoff = (p: number) => {
      if (!handoffArmed || !handoffStartRect || !handoffTargetRect) {
        return;
      }
      if (p <= 0) {
        gsap.set(travelMark, { opacity: 0 });
        gsap.set(sigilMark, { opacity: 1, "--frame-opacity": 1 });
        hudBrandmark.classList.remove("is-visible");
        hudEl?.classList.remove("hud--brandmark-active");
        return;
      }

      if (p >= 0.995) {
        dock();
        return;
      }

      const eased = handoffEase(p);
      const src = handoffStartRect;
      const dst = handoffTargetRect;
      const cornerRetired = p >= 0.82;

      hudEl?.classList.toggle("hud--brandmark-active", cornerRetired);
      hudBrandmark.classList.remove("is-visible");

      gsap.set(travelMark, {
        left: src.left + (dst.left - src.left) * eased,
        top: src.top + (dst.top - src.top) * eased,
        width: src.width + (dst.width - src.width) * eased,
        height: src.height + (dst.height - src.height) * eased,
        opacity: 1,
      });
      gsap.set(sigilMark, { opacity: 0, "--frame-opacity": 0 });
    };

    const onResize = () => {
      if (handoffArmed) {
        handoffTargetRect = hudBrandmark.getBoundingClientRect();
      }
    };
    window.addEventListener("resize", onResize);

    // When the tab is hidden, requestAnimationFrame pauses, scroll events
    // may queue, and the browser can shift layout (font swaps, image
    // decode). ScrollTrigger's cached positions and the captured handoff
    // rects can go stale. On resume, force a full refresh — this re-runs
    // onRefresh for every trigger, which recaptures rects and
    // re-syncs progress with current scroll position.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        ScrollTrigger.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    // Some browsers fire pageshow (e.g. returning from bfcache) without
    // a visibilitychange — cover that path too.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        ScrollTrigger.refresh();
      }
    };
    window.addEventListener("pageshow", onPageShow);

    const ctx = gsap.context(() => {
      gsap.set([sigilOrbits, sigilHalo], { opacity: 0, scale: 0.6, rotation: -8 });
      gsap.set(sigilMark, { opacity: 0, scale: 0.7 });
      gsap.set([sigilCap, sigilLegend, triLeft].filter(Boolean), { opacity: 0, y: 16 });

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
          [sigilCap, sigilLegend].filter(Boolean),
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: "power3.out",
            stagger: 0.06,
          },
          0.3
        )
        .to(
          [triLeft].filter(Boolean),
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power3.out",
          },
          0.25
        );

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
          onLeave: () => dock(),
          onLeaveBack: () => resetHandoff(),
          onRefresh: (self) => {
            if (self.progress >= 0.995) {
              captureHandoffRects();
              handoffArmed = true;
              dock();
            } else if (self.progress > 0) {
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
        [sigilOrbits, sigilHalo, sigilCap, sigilLegend].filter(Boolean),
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
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
      hudBrandmark.classList.remove("is-visible");
      hudEl?.classList.remove("hud--brandmark-active");
      ctx.revert();
      travelMark.remove();
    };
  }, [rootRef]);
}
