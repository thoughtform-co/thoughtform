"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { BrandmarkActorHandle } from "../BrandmarkActor";

gsap.registerPlugin(ScrollTrigger);

function query<T extends Element>(selector: string, scope: ParentNode): T | null {
  return scope.querySelector<T>(selector);
}

export function useSigilChoreography(
  rootRef: React.RefObject<HTMLElement | null>,
  actorRef: React.RefObject<BrandmarkActorHandle | null>
) {
  useEffect(() => {
    const docEl = rootRef.current;
    if (!docEl) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const defEl = query<HTMLElement>("#definition", docEl);
    const contEl = query<HTMLElement>("#continuum", docEl);
    const practiceEl = query<HTMLElement>("#practice", docEl);
    const approachEl =
      query<HTMLElement>("#approach", docEl) ?? query<HTMLElement>(".approach", docEl);
    const sigilOrbits = query<HTMLElement>(".sigil__orbits", docEl);
    const sigilHalo = query<HTMLElement>(".sigil__halo", docEl);
    const sigilMark = query<HTMLElement>(".sigil__mark", docEl);
    const sigilCap = query<HTMLElement>(".sigil__cap", docEl);
    const triLeft = query<HTMLElement>(".tri__left", docEl);
    const sigilLegend = query<HTMLElement>(".sigil__legend", docEl);
    let hudEl = query<HTMLElement>(".hud", docEl);
    let hudBrandmark = query<HTMLElement>("#hudBrandmark", docEl);

    if (!defEl || !contEl || !sigilOrbits || !sigilMark || !hudBrandmark) {
      return;
    }

    const actor = () => actorRef.current;

    /** True only while the actor is parked in the bottom-left HUD slot (not sigil / orbit / in-flight). */
    let brandPinnedToHudSlot = false;

    const syncHudOutlineFromRoot = () => {
      const a = actor();
      if (!a) return;
      if (!brandPinnedToHudSlot) {
        a.setHudOutline(false);
        return;
      }
      a.setHudOutline(docEl.getAttribute("data-practice-active") === "true");
    };

    const ensureFreshHudRefs = () => {
      if (!hudBrandmark || !docEl.contains(hudBrandmark)) {
        const fresh = query<HTMLElement>("#hudBrandmark", docEl);
        if (fresh) hudBrandmark = fresh;
      }
      if (!hudEl || !docEl.contains(hudEl)) {
        const fresh = query<HTMLElement>(".hud", docEl);
        if (fresh) hudEl = fresh;
      }
    };

    const orbitMarkEl = () =>
      approachEl && docEl.contains(approachEl)
        ? approachEl.querySelector<HTMLElement>(".approach__orbit__mark")
        : query<HTMLElement>(".approach__orbit__mark", docEl);

    const section2Els = [sigilOrbits, sigilHalo, sigilMark, sigilCap, sigilLegend, triLeft].filter(
      Boolean
    ) as HTMLElement[];
    section2Els.forEach((el) => {
      el.removeAttribute("data-m");
      el.classList.add("is-in");
    });

    const setTravelArmed = (armed: boolean) => {
      actor()?.setArmed(armed);
    };

    /** Reduced motion: instant dock / undock; native slot images stay visible. */
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

      const rmCtx = gsap.context(() => {
        if (!practiceEl || !approachEl) return;
        ScrollTrigger.create({
          trigger: practiceEl,
          start: "top 40%",
          end: "top 0%",
          onEnter: () => {
            approachEl.setAttribute("data-orbit-docked", "true");
          },
          onLeaveBack: () => {
            approachEl.setAttribute("data-orbit-docked", "false");
          },
        });
        ScrollTrigger.create({
          trigger: practiceEl,
          start: "bottom 25%",
          end: "bottom -10%",
          onEnter: () => {
            approachEl.setAttribute("data-orbit-docked", "false");
          },
          onLeaveBack: () => {
            approachEl.setAttribute("data-orbit-docked", "true");
          },
        });
      }, docEl);

      return () => {
        rmCtx.revert();
        hudBrandmark?.classList.remove("is-visible");
        hudEl?.classList.remove("hud--brandmark-active");
        approachEl?.removeAttribute("data-orbit-docked");
      };
    }

    const practiceMo = new MutationObserver(() => {
      syncHudOutlineFromRoot();
    });
    practiceMo.observe(docEl, { attributes: true, attributeFilter: ["data-practice-active"] });

    const handoffEase = gsap.parseEase("power3.inOut");
    let handoffStartRect: DOMRect | null = null;
    let handoffTargetRect: DOMRect | null = null;
    let handoffArmed = false;

    let practiceStartRect: DOMRect | null = null;
    let practiceEndRect: DOMRect | null = null;
    let practiceEntryArmed = false;
    let practiceExitArmed = false;
    let practiceExitScrollTrigger: ScrollTrigger | null = null;

    const syncActorToSigilEntrance = () => {
      const a = actor();
      if (!a) return;
      brandPinnedToHudSlot = false;
      const o = Number(gsap.getProperty(sigilMark, "opacity")) || 0;
      const s = Number(gsap.getProperty(sigilMark, "scale")) || 0;
      if (o < 0.02) {
        a.hide();
        return;
      }
      a.pinToRect(sigilMark.getBoundingClientRect(), o, s || 1);
      a.setHudOutline(false);
    };

    const captureHandoffRects = () => {
      ensureFreshHudRefs();
      brandPinnedToHudSlot = false;
      gsap.set(sigilMark, {
        opacity: 1,
        scale: 1,
        "--frame-opacity": 1,
        clearProps: "rotation",
      });
      const sigilRect = sigilMark.getBoundingClientRect();
      const hudRect = hudBrandmark!.getBoundingClientRect();
      const vh = window.innerHeight;
      const isSigilVisible = sigilRect.bottom > 0 && sigilRect.top < vh;
      if (isSigilVisible) {
        handoffStartRect = sigilRect;
      } else if (!handoffStartRect) {
        const liveCont =
          contEl && docEl.contains(contEl)
            ? contEl
            : docEl.querySelector<HTMLElement>("#continuum");
        if (liveCont) {
          const sigilDocY = sigilRect.top + window.scrollY;
          const contDocY = liveCont.getBoundingClientRect().top + window.scrollY;
          const fallbackTop = sigilDocY - (contDocY - vh * 0.8);
          handoffStartRect = new DOMRect(
            sigilRect.left,
            fallbackTop,
            sigilRect.width,
            sigilRect.height
          );
        } else {
          handoffStartRect = sigilRect;
        }
      }
      handoffTargetRect = hudRect;
      if (handoffStartRect) {
        actor()?.pinToRect(handoffStartRect, 0, 1);
      }
    };

    const dock = () => {
      ensureFreshHudRefs();
      if (!hudBrandmark) return;
      brandPinnedToHudSlot = true;
      const hudRect = hudBrandmark.getBoundingClientRect();
      actor()?.pinToRect(hudRect, 1, 1);
      syncHudOutlineFromRoot();
      gsap.set(sigilMark, { opacity: 0, "--frame-opacity": 0 });
      hudBrandmark.classList.add("is-visible");
      hudEl?.classList.add("hud--brandmark-active");
      setTravelArmed(false);
    };

    const resetHandoff = () => {
      ensureFreshHudRefs();
      handoffArmed = false;
      handoffStartRect = null;
      handoffTargetRect = null;
      brandPinnedToHudSlot = false;
      gsap.set(sigilMark, { opacity: 1, "--frame-opacity": 1 });
      hudBrandmark?.classList.remove("is-visible");
      hudEl?.classList.remove("hud--brandmark-active");
      setTravelArmed(handoffArmed || practiceEntryArmed || practiceExitArmed);
      syncActorToSigilEntrance();
    };

    const applyHandoff = (p: number) => {
      if (!handoffArmed || !handoffStartRect || !handoffTargetRect) {
        return;
      }
      ensureFreshHudRefs();
      if (p <= 0) {
        brandPinnedToHudSlot = false;
        gsap.set(sigilMark, { opacity: 1, "--frame-opacity": 1 });
        hudBrandmark?.classList.remove("is-visible");
        hudEl?.classList.remove("hud--brandmark-active");
        setTravelArmed(practiceEntryArmed || practiceExitArmed);
        syncActorToSigilEntrance();
        return;
      }

      if (p >= 0.995) {
        dock();
        return;
      }

      setTravelArmed(true);
      brandPinnedToHudSlot = false;
      const src = handoffStartRect;
      const dst = handoffTargetRect;
      const cornerRetired = p >= 0.82;

      hudEl?.classList.toggle("hud--brandmark-active", cornerRetired);
      hudBrandmark?.classList.remove("is-visible");

      actor()?.setHudOutline(false);
      actor()?.morphRects(src, dst, p, handoffEase);
      gsap.set(sigilMark, { opacity: 0, "--frame-opacity": 0 });
    };

    const capturePracticeRects = (dir: "forward" | "reverse") => {
      ensureFreshHudRefs();
      const mark = orbitMarkEl();
      if (!hudBrandmark || !mark) return;
      const hudRect = hudBrandmark.getBoundingClientRect();
      const orbRect = mark.getBoundingClientRect();
      if (dir === "forward") {
        practiceStartRect = hudRect;
        practiceEndRect = orbRect;
      } else {
        practiceStartRect = orbRect;
        practiceEndRect = hudRect;
      }
      if (practiceStartRect) {
        actor()?.pinToRect(practiceStartRect, 0, 1);
      }
    };

    const practiceDockAtOrbit = () => {
      if (!approachEl) return;
      practiceEntryArmed = false;
      brandPinnedToHudSlot = false;
      const mark = orbitMarkEl();
      if (mark) {
        actor()?.pinToRect(mark.getBoundingClientRect(), 1, 1);
      }
      actor()?.setHudOutline(false);
      approachEl.setAttribute("data-orbit-docked", "true");
      setTravelArmed(practiceExitArmed || handoffArmed);
    };

    const practiceRedockAtHud = () => {
      if (!approachEl) return;
      approachEl.setAttribute("data-orbit-docked", "false");
      ensureFreshHudRefs();
      brandPinnedToHudSlot = true;
      if (hudBrandmark) {
        actor()?.pinToRect(hudBrandmark.getBoundingClientRect(), 1, 1);
      }
      syncHudOutlineFromRoot();
      hudBrandmark?.classList.add("is-visible");
      hudEl?.classList.add("hud--brandmark-active");
      practiceExitArmed = false;
      setTravelArmed(handoffArmed || practiceEntryArmed);
    };

    const practiceUndockFromEntry = () => {
      if (!approachEl) return;
      approachEl.setAttribute("data-orbit-docked", "false");
      practiceEntryArmed = false;
      setTravelArmed(handoffArmed || practiceExitArmed);
      ensureFreshHudRefs();
      brandPinnedToHudSlot = true;
      if (hudBrandmark) {
        actor()?.pinToRect(hudBrandmark.getBoundingClientRect(), 1, 1);
        syncHudOutlineFromRoot();
      }
    };

    const practiceDockAtOrbitFromExitLeaveBack = () => {
      if (!approachEl) return;
      practiceExitArmed = false;
      brandPinnedToHudSlot = false;
      const mark = orbitMarkEl();
      if (mark) {
        actor()?.pinToRect(mark.getBoundingClientRect(), 1, 1);
      }
      actor()?.setHudOutline(false);
      approachEl.setAttribute("data-orbit-docked", "true");
      setTravelArmed(handoffArmed || practiceEntryArmed);
    };

    const suppressPracticeEntry = () => {
      const st = practiceExitScrollTrigger;
      return Boolean(st?.isActive || (st && st.progress > 0.0005));
    };

    const applyPracticeTravel = (p: number, dir: "forward" | "reverse") => {
      if (!practiceStartRect || !practiceEndRect || !approachEl) return;
      const src = practiceStartRect;
      const dst = practiceEndRect;

      if (dir === "forward") {
        if (suppressPracticeEntry()) return;
        if (p <= 0.004) {
          approachEl.setAttribute("data-orbit-docked", "false");
          ensureFreshHudRefs();
          brandPinnedToHudSlot = true;
          if (hudBrandmark) {
            actor()?.pinToRect(hudBrandmark.getBoundingClientRect(), 1, 1);
            syncHudOutlineFromRoot();
          }
          setTravelArmed(practiceExitArmed || handoffArmed);
          return;
        }
        if (p >= 0.995) {
          if (suppressPracticeEntry()) return;
          practiceDockAtOrbit();
          return;
        }
        setTravelArmed(true);
        brandPinnedToHudSlot = false;
        approachEl.setAttribute("data-orbit-docked", "false");
        actor()?.setHudOutline(false);
        actor()?.morphRects(src, dst, p, handoffEase);
        return;
      }

      /* reverse — orbit → HUD */
      if (p >= 0.995) {
        practiceRedockAtHud();
        return;
      }
      setTravelArmed(true);
      brandPinnedToHudSlot = false;
      approachEl.setAttribute("data-orbit-docked", "false");
      actor()?.setHudOutline(false);
      if (p <= 0.004) {
        actor()?.morphRects(src, dst, 0, handoffEase);
        return;
      }
      actor()?.morphRects(src, dst, p, handoffEase);
    };

    const repinActorToOrbitIfDocked = () => {
      if (!approachEl || approachEl.getAttribute("data-orbit-docked") !== "true") return;
      if (handoffArmed || practiceEntryArmed || practiceExitArmed) return;
      const mark = orbitMarkEl();
      if (!mark) return;
      const rect = mark.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      actor()?.pinToRect(rect, 1, 1);
      actor()?.setHudOutline(false);
    };

    const onResize = () => {
      ensureFreshHudRefs();
      if (handoffArmed && hudBrandmark) {
        handoffTargetRect = hudBrandmark.getBoundingClientRect();
      }
      if (practiceEntryArmed && hudBrandmark) {
        capturePracticeRects("forward");
      }
      if (practiceExitArmed && hudBrandmark) {
        capturePracticeRects("reverse");
      }
      syncActorToSigilEntrance();
      syncHudOutlineFromRoot();
      repinActorToOrbitIfDocked();
    };
    window.addEventListener("resize", onResize);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        ScrollTrigger.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
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

      if (approachEl && !approachEl.getAttribute("data-orbit-docked")) {
        approachEl.setAttribute("data-orbit-docked", "false");
      }

      const entranceTl = gsap.timeline({
        scrollTrigger: {
          trigger: defEl,
          start: "top 85%",
          end: "top 35%",
          scrub: 0.6,
          onUpdate: syncActorToSigilEntrance,
          onRefresh: syncActorToSigilEntrance,
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
            setTravelArmed(true);
          },
          onEnterBack: () => {
            captureHandoffRects();
            handoffArmed = true;
            setTravelArmed(true);
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

      if (practiceEl && approachEl) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: practiceEl,
              start: "top 40%",
              end: "top 0%",
              scrub: 1.5,
              onEnter: () => {
                capturePracticeRects("forward");
                practiceEntryArmed = true;
              },
              onEnterBack: () => {
                capturePracticeRects("forward");
                practiceEntryArmed = true;
              },
              onLeaveBack: () => {
                practiceUndockFromEntry();
              },
              onRefresh: (self) => {
                if (self.progress >= 0.995) {
                  if (suppressPracticeEntry()) return;
                  capturePracticeRects("forward");
                  practiceEntryArmed = true;
                  practiceDockAtOrbit();
                } else if (self.progress > 0) {
                  capturePracticeRects("forward");
                  practiceEntryArmed = true;
                  applyPracticeTravel(self.progress, "forward");
                } else {
                  practiceUndockFromEntry();
                }
              },
              onUpdate: (self) => {
                applyPracticeTravel(self.progress, "forward");
              },
            },
          })
          .to({}, { duration: 0.01 }, 0);

        const practiceExitTl = gsap.timeline({
          scrollTrigger: {
            trigger: practiceEl,
            start: "bottom 25%",
            end: "bottom -10%",
            scrub: 1.5,
            onEnter: () => {
              capturePracticeRects("reverse");
              practiceExitArmed = true;
            },
            onEnterBack: () => {
              capturePracticeRects("reverse");
              practiceExitArmed = true;
            },
            onLeaveBack: () => {
              practiceDockAtOrbitFromExitLeaveBack();
            },
            onRefresh: (self) => {
              practiceExitScrollTrigger = self;
              if (self.progress >= 0.995) {
                capturePracticeRects("reverse");
                practiceExitArmed = true;
                practiceRedockAtHud();
              } else if (self.progress > 0) {
                capturePracticeRects("reverse");
                practiceExitArmed = true;
                applyPracticeTravel(self.progress, "reverse");
              } else if (self.isActive) {
                capturePracticeRects("reverse");
                practiceExitArmed = true;
                applyPracticeTravel(0, "reverse");
              } else {
                practiceExitArmed = false;
              }
            },
            onUpdate: (self) => {
              practiceExitScrollTrigger = self;
              applyPracticeTravel(self.progress, "reverse");
            },
          },
        });

        practiceExitScrollTrigger = practiceExitTl.scrollTrigger ?? null;
        practiceExitTl.to({}, { duration: 0.01 }, 0);

        // While the user is reading inside #practice (orbit docked, no
        // active handoff), the orbit element is `position: sticky`. The
        // actor lives on `position: fixed`, so it does not naturally
        // follow the sticky transitions. Re-pin every scroll frame to
        // keep the visible mark glued to the orbit centre.
        ScrollTrigger.create({
          trigger: practiceEl,
          start: "top 0%",
          end: "bottom 25%",
          onUpdate: () => {
            repinActorToOrbitIfDocked();
          },
          onEnter: () => repinActorToOrbitIfDocked(),
          onEnterBack: () => repinActorToOrbitIfDocked(),
          onRefresh: () => repinActorToOrbitIfDocked(),
        });
      }
    }, docEl);

    syncActorToSigilEntrance();

    return () => {
      practiceMo.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
      hudBrandmark?.classList.remove("is-visible");
      hudEl?.classList.remove("hud--brandmark-active");
      approachEl?.removeAttribute("data-orbit-docked");
      ctx.revert();
      actor()?.hide();
    };
  }, [rootRef, actorRef]);
}
