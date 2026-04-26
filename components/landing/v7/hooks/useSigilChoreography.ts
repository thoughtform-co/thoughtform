"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { BrandmarkActorHandle } from "../BrandmarkActor";

gsap.registerPlugin(ScrollTrigger);

const DEBUG_ENDPOINT = "http://127.0.0.1:7282/ingest/c41d9533-0bb9-4c99-abdb-1d9fed02e7e0";
const DEBUG_SESSION_ID = "31ead7";
const debugLastSentAt = new Map<string, number>();

function query<T extends Element>(selector: string, scope: ParentNode): T | null {
  return scope.querySelector<T>(selector);
}

function rectPayload(rect: DOMRect | null | undefined) {
  if (!rect) return null;
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    top: Math.round(rect.top),
    left: Math.round(rect.left),
    bottom: Math.round(rect.bottom),
  };
}

function debugBrandmark(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  if (process.env.NODE_ENV === "production") return;
  const key = `${location}:${message}`;
  const now = Date.now();
  if (now - (debugLastSentAt.get(key) ?? 0) < 120) return;
  debugLastSentAt.set(key, now);
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": DEBUG_SESSION_ID },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId: "pre-fix",
      hypothesisId,
      location,
      message,
      data,
      timestamp: now,
    }),
  }).catch(() => {});
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
      // Threshold matches the handoffTl trigger start ("bottom 90%" of
      // defEl) — once section 02's bottom has reached 90% of the viewport
      // height, handoffTl owns the actor.
      const handoffStartReached = defEl.getBoundingClientRect().bottom <= window.innerHeight * 0.9;
      const downstreamOwnsActor =
        handoffArmed ||
        practiceEntryArmed ||
        practiceExitArmed ||
        handoffStartReached ||
        approachEl?.getAttribute("data-orbit-docked") === "true";
      if (downstreamOwnsActor) {
        // #region agent log
        debugBrandmark(
          "H2",
          "useSigilChoreography.ts:syncActorToSigilEntrance",
          "sigil sync bail downstream owner",
          {
            scrollY: Math.round(window.scrollY),
            sigilRect: rectPayload(sigilMark.getBoundingClientRect()),
            approachDocked: approachEl?.getAttribute("data-orbit-docked"),
            handoffStartReached,
            flags: { handoffArmed, practiceEntryArmed, practiceExitArmed, brandPinnedToHudSlot },
          }
        );
        // #endregion
        return;
      }
      brandPinnedToHudSlot = false;
      const o = Number(gsap.getProperty(sigilMark, "opacity")) || 0;
      const s = Number(gsap.getProperty(sigilMark, "scale")) || 0;
      if (o < 0.02) {
        // #region agent log
        debugBrandmark(
          "H1,H2",
          "useSigilChoreography.ts:syncActorToSigilEntrance",
          "sigil sync hide",
          {
            scrollY: Math.round(window.scrollY),
            sigilOpacity: o,
            sigilScale: s,
            sigilRect: rectPayload(sigilMark.getBoundingClientRect()),
            flags: { handoffArmed, practiceEntryArmed, practiceExitArmed, brandPinnedToHudSlot },
          }
        );
        // #endregion
        a.hide();
        return;
      }
      // #region agent log
      debugBrandmark(
        "H1,H2",
        "useSigilChoreography.ts:syncActorToSigilEntrance",
        "sigil sync pin",
        {
          scrollY: Math.round(window.scrollY),
          sigilOpacity: o,
          sigilScale: s,
          sigilRect: rectPayload(sigilMark.getBoundingClientRect()),
          flags: { handoffArmed, practiceEntryArmed, practiceExitArmed, brandPinnedToHudSlot },
        }
      );
      // #endregion
      // The diagram column (.tri__center) is `position: sticky` so the
      // sigil's live rect is itself stable while the user reads section
      // 02 — the actor inherits that stability for free by tracking the
      // live rect.
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
      // The diagram column is sticky, so the live sigil rect already
      // represents the actor's current on-screen position by the time
      // this fires.
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
      // Do NOT touch the actor opacity here. capture* runs on
      // onEnter / onEnterBack / onRefresh; the subsequent onUpdate
      // is responsible for visibility. Pinning with opacity 0 caused
      // a one-frame flicker on entry into the trigger range.
      // #region agent log
      debugBrandmark(
        "H1,H2,H3",
        "useSigilChoreography.ts:captureHandoffRects",
        "capture handoff rects",
        {
          scrollY: Math.round(window.scrollY),
          isSigilVisible,
          sigilRect: rectPayload(sigilRect),
          hudRect: rectPayload(hudRect),
          handoffStartRect: rectPayload(handoffStartRect),
          handoffTargetRect: rectPayload(handoffTargetRect),
          flags: { handoffArmed, practiceEntryArmed, practiceExitArmed, brandPinnedToHudSlot },
        }
      );
      // #endregion
    };

    const dock = () => {
      ensureFreshHudRefs();
      if (!hudBrandmark) return;
      brandPinnedToHudSlot = true;
      // The handoff has completed — clear the gate so downstream
      // listeners (orbit re-pin, practice docked tracker) are no
      // longer suppressed by a stale "handoff in progress" flag.
      handoffArmed = false;
      const hudRect = hudBrandmark.getBoundingClientRect();
      actor()?.pinToRect(hudRect, 1, 1);
      syncHudOutlineFromRoot();
      gsap.set(sigilMark, { opacity: 0, "--frame-opacity": 0 });
      hudBrandmark.classList.add("is-visible");
      hudEl?.classList.add("hud--brandmark-active");
      setTravelArmed(practiceEntryArmed || practiceExitArmed);
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
      // Same rationale as captureHandoffRects: don't override
      // visibility here, let applyPracticeTravel render the frame.
      // #region agent log
      debugBrandmark(
        "H1,H2,H3",
        "useSigilChoreography.ts:capturePracticeRects",
        "capture practice rects",
        {
          dir,
          scrollY: Math.round(window.scrollY),
          hudRect: rectPayload(hudRect),
          orbitRect: rectPayload(orbRect),
          practiceRect: rectPayload(practiceEl?.getBoundingClientRect()),
          approachDocked: approachEl?.getAttribute("data-orbit-docked"),
          practiceStartRect: rectPayload(practiceStartRect),
          practiceEndRect: rectPayload(practiceEndRect),
          flags: { handoffArmed, practiceEntryArmed, practiceExitArmed, brandPinnedToHudSlot },
        }
      );
      // #endregion
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
      if (!approachEl) return;
      ensureFreshHudRefs();
      let src: DOMRect;
      let dst: DOMRect;
      if (dir === "forward") {
        // Use *live* rects for the HUD → orbit travel. The orbit lives
        // inside `.approach__stage` (position: sticky), so its viewport
        // rect at the moment the entry trigger fires (practiceTop ≈ 40%
        // of viewport) is its not-yet-stuck flow position. At p=1
        // (`practiceDockAtOrbit`), the dock pins to the live rect (now
        // sticky-engaged), which produced a hundreds-of-pixels jump
        // from the captured mid-morph end to the live dock target.
        // Recomputing live every frame keeps the trajectory aimed at
        // the orbit's actual current screen position so the brandmark
        // "elegantly slides inside the diagram" instead of jumping
        // there at the end.
        const orbitMark = orbitMarkEl();
        if (!orbitMark || !hudBrandmark) return;
        src = hudBrandmark.getBoundingClientRect();
        dst = orbitMark.getBoundingClientRect();
      } else {
        // Reverse (orbit → HUD): use the rects captured by
        // `capturePracticeRects("reverse")` at trigger.onEnter. By the
        // time the exit trigger fires the user has scrolled past the
        // orbit's sticky un-engage point, so the live orbit rect is far
        // offscreen and a live morph would sweep the brandmark from
        // hundreds-of-pixels above the viewport down to the HUD. The
        // capture-at-onEnter rect anchors the morph at the orbit's
        // last on-screen position, which keeps the travel inside the
        // viewport.
        if (!practiceStartRect || !practiceEndRect) return;
        src = practiceStartRect;
        dst = practiceEndRect;
      }
      const shouldLogProgress = p <= 0.02 || p >= 0.98 || Math.abs(p - 0.5) < 0.03;
      if (shouldLogProgress) {
        // #region agent log
        debugBrandmark(
          "H2,H4",
          "useSigilChoreography.ts:applyPracticeTravel",
          "apply practice travel progress",
          {
            dir,
            progress: Number(p.toFixed(4)),
            scrollY: Math.round(window.scrollY),
            src: rectPayload(src),
            dst: rectPayload(dst),
            suppressPracticeEntry: dir === "forward" ? suppressPracticeEntry() : false,
            approachDocked: approachEl.getAttribute("data-orbit-docked"),
            flags: { handoffArmed, practiceEntryArmed, practiceExitArmed, brandPinnedToHudSlot },
          }
        );
        // #endregion
      }

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
      if (!approachEl || approachEl.getAttribute("data-orbit-docked") !== "true") {
        // #region agent log
        debugBrandmark(
          "H4",
          "useSigilChoreography.ts:repinActorToOrbitIfDocked",
          "repin bail no dock",
          {
            scrollY: Math.round(window.scrollY),
            approachDocked: approachEl?.getAttribute("data-orbit-docked"),
            flags: { handoffArmed, practiceEntryArmed, practiceExitArmed, brandPinnedToHudSlot },
          }
        );
        // #endregion
        return;
      }
      if (handoffArmed || practiceEntryArmed || practiceExitArmed) {
        // #region agent log
        debugBrandmark(
          "H4",
          "useSigilChoreography.ts:repinActorToOrbitIfDocked",
          "repin bail armed",
          {
            scrollY: Math.round(window.scrollY),
            approachDocked: approachEl.getAttribute("data-orbit-docked"),
            flags: { handoffArmed, practiceEntryArmed, practiceExitArmed, brandPinnedToHudSlot },
          }
        );
        // #endregion
        return;
      }
      const mark = orbitMarkEl();
      if (!mark) {
        // #region agent log
        debugBrandmark(
          "H1,H4",
          "useSigilChoreography.ts:repinActorToOrbitIfDocked",
          "repin bail no mark",
          {
            scrollY: Math.round(window.scrollY),
          }
        );
        // #endregion
        return;
      }
      const rect = mark.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        // #region agent log
        debugBrandmark(
          "H1,H4",
          "useSigilChoreography.ts:repinActorToOrbitIfDocked",
          "repin bail zero rect",
          {
            scrollY: Math.round(window.scrollY),
            orbitRect: rectPayload(rect),
          }
        );
        // #endregion
        return;
      }
      // #region agent log
      debugBrandmark(
        "H1,H4",
        "useSigilChoreography.ts:repinActorToOrbitIfDocked",
        "repin actor to orbit",
        {
          scrollY: Math.round(window.scrollY),
          orbitRect: rectPayload(rect),
          practiceRect: rectPayload(practiceEl?.getBoundingClientRect()),
          flags: { handoffArmed, practiceEntryArmed, practiceExitArmed, brandPinnedToHudSlot },
        }
      );
      // #endregion
      actor()?.pinToRect(rect, 1, 1);
      actor()?.setHudOutline(false);
    };

    /**
     * Hold the actor at a fixed viewport position while the brandmark is
     * "parked at sigil" — after the section-02 entrance reveal completes,
     * before the continuum handoff starts. We capture the sigil rect ONCE
     * (when entrance is essentially done) and re-pin the actor to that
     * cached rect on every scroll frame. Because the rect is in viewport
     * coordinates and the actor is `position: fixed`, the brandmark stays
     * visually anchored to one screen position throughout section 02 —
     * the user reads the section copy while the brandmark hovers as a
     * stable north-star reference, instead of drifting up the viewport
     * with the section's natural scroll.
     *
     * The cache is cleared whenever an upstream owner takes over (entrance
     * reverses, handoff arms, practice triggers arm, viewport resizes).
     * `captureHandoffRects` reads parkedSigilRect when arming the handoff
     * morph so the sigil → HUD travel begins from the actor's actual on-
     * screen position rather than from a stale or unrelated rect.
     */
    /**
     * Continuous re-pin to the live `.sigil__mark` rect while the
     * brandmark is "parked at sigil" — i.e. between entrance reveal end
     * and the continuum handoff arming. The diagram column
     * (`.tri__center`) is `position: sticky`, so the live rect itself is
     * stable while the user scrolls section 02; the actor gets that
     * stability for free by tracking it. Without this loop, refreshes
     * (resize, font-load, ResizeObserver) could leave the actor pinned
     * to a stale rect while the sticky element settles.
     */
    const repinActorToSigilIfParked = () => {
      if (handoffArmed || practiceEntryArmed || practiceExitArmed) return;
      if (brandPinnedToHudSlot) return;
      if (approachEl?.getAttribute("data-orbit-docked") === "true") return;

      const vh = window.innerHeight;

      // Threshold matches `entranceTl.scrollTrigger.end` — only park
      // once entrance is past, so entranceTl's scrub keeps full ownership
      // during the reveal.
      const entrancePastEnd = defEl.getBoundingClientRect().top <= vh * 0.35;
      if (!entrancePastEnd) return;

      // Threshold matches `handoffTl.scrollTrigger.start` ("bottom 90%"
      // of defEl) — once handoff arms, leave the actor alone so the
      // morph can drive it.
      const handoffStartReached = defEl.getBoundingClientRect().bottom <= vh * 0.9;
      if (handoffStartReached) return;

      const o = Number(gsap.getProperty(sigilMark, "opacity")) || 0;
      if (o < 0.95) return;

      const sigilRect = sigilMark.getBoundingClientRect();
      if (sigilRect.width <= 0 || sigilRect.height <= 0) return;

      brandPinnedToHudSlot = false;
      actor()?.pinToRect(sigilRect, 1, 1);
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
      repinActorToSigilIfParked();
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

    // Layout shifts after initial mount (font swaps, image / video decode,
    // dangerouslySetInnerHTML hydration) push the practice section's
    // offsetTop down by 100s of pixels. ScrollTrigger caches start/end
    // positions on first refresh, so without follow-up refreshes the
    // entry trigger fires too early and the actor docks at the orbit
    // before the user has reached the section. We chase those layout
    // shifts with: (a) window 'load' (after all critical resources),
    // (b) a delayed safety refresh, and (c) ResizeObservers on the key
    // landmarks so any post-load reflow re-syncs positions.
    const refresh = () => ScrollTrigger.refresh();
    ScrollTrigger.addEventListener("refresh", () => {
      // #region agent log
      debugBrandmark(
        "H3",
        "useSigilChoreography.ts:ScrollTrigger.refresh",
        "scrolltrigger refresh geometry",
        {
          scrollY: Math.round(window.scrollY),
          viewport: { width: window.innerWidth, height: window.innerHeight },
          practiceRect: rectPayload(practiceEl?.getBoundingClientRect()),
          approachRect: rectPayload(approachEl?.getBoundingClientRect()),
          orbitRect: rectPayload(orbitMarkEl()?.getBoundingClientRect()),
          triggers: ScrollTrigger.getAll()
            .filter((t) =>
              ["practice", "continuum", "definition"].includes(
                (t.trigger as HTMLElement | null)?.id ?? ""
              )
            )
            .map((t) => ({
              id: (t.trigger as HTMLElement | null)?.id,
              start: Math.round(t.start),
              end: Math.round(t.end),
              progress: Number(t.progress.toFixed(4)),
              isActive: t.isActive,
            })),
        }
      );
      // #endregion
    });
    window.addEventListener("load", refresh);
    // The practice section can roughly triple in height after the
    // celestial portals + phase glyphs mount, which shifts every
    // downstream trigger position. Multiple deferred refreshes catch
    // each settling step. A debounced ResizeObserver collapses the
    // burst of resize callbacks during layout into a single late
    // refresh.
    const refreshTimers = [
      window.setTimeout(refresh, 250),
      window.setTimeout(refresh, 1200),
      window.setTimeout(refresh, 3000),
    ];
    let roDebounce = 0;
    const ro = new ResizeObserver(() => {
      if (roDebounce) clearTimeout(roDebounce);
      roDebounce = window.setTimeout(refresh, 120);
    });
    if (practiceEl) ro.observe(practiceEl);
    if (defEl) ro.observe(defEl);
    if (contEl) ro.observe(contEl);

    // Continuous re-pin: the dock-tracker ScrollTrigger only re-pins
    // inside its computed range, which is fragile to position drift.
    // A passive, rAF-throttled scroll listener re-pins the actor on
    // every frame while the brandmark is parked at one of its rest
    // states (orbit center while docked in #practice, or sigil center
    // between entranceTl ending and handoffTl beginning in #definition).
    // Runs after the scroll event so ScrollTrigger has already updated
    // `data-orbit-docked` and any state flags for the current frame.
    let dockedRaf = 0;
    const onDockedScroll = () => {
      if (dockedRaf) return;
      dockedRaf = requestAnimationFrame(() => {
        dockedRaf = 0;
        repinActorToOrbitIfDocked();
        repinActorToSigilIfParked();
      });
    };
    window.addEventListener("scroll", onDockedScroll, { passive: true });

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
          // Anchor the handoff to section 02's *bottom* rather than
          // continuum's top. Two reasons:
          //   1. The diagram column (`.tri__center`) is `position: sticky`,
          //      so its viewport position is locked while reading the
          //      section copy — the natural moment for the brandmark to
          //      detach is when section 02 is itself leaving the screen,
          //      not when the next section happens to enter.
          //   2. Anchoring to defEl makes the handoff start coincide
          //      with the sticky un-engage point regardless of the
          //      connector's height between sections.
          // Range is tight + a short scrub so the travel feels
          // deliberate ("gently moves") instead of dragged out.
          trigger: defEl,
          start: "bottom 90%",
          end: "bottom 30%",
          scrub: 0.4,
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
            // Defer to whichever stage currently owns the actor. If
            // the practice triggers have already taken ownership
            // (orbit-docked or in-flight to/from orbit), keep our
            // hands off — otherwise refresh would yank the actor
            // back to the HUD slot mid-practice.
            const orbitOwns =
              approachEl?.getAttribute("data-orbit-docked") === "true" ||
              practiceEntryArmed ||
              practiceExitArmed;
            if (self.progress >= 0.995) {
              if (orbitOwns) return;
              captureHandoffRects();
              handoffArmed = true;
              dock();
            } else if (self.progress > 0) {
              if (orbitOwns) return;
              captureHandoffRects();
              handoffArmed = true;
              applyHandoff(self.progress);
            } else {
              if (orbitOwns) return;
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
              scrub: 0.4,
              onEnter: () => {
                capturePracticeRects("forward");
                practiceEntryArmed = true;
              },
              onEnterBack: () => {
                capturePracticeRects("forward");
                practiceEntryArmed = true;
              },
              // Fast-scroll defence: when the user blows past `top 0%`
              // before scrub easing has reached p >= 0.995, the
              // applyPracticeTravel onUpdate path never calls
              // practiceDockAtOrbit, leaving practiceEntryArmed stuck
              // at true and the actor frozen mid-morph. While that
              // flag is set, repinActorToOrbitIfDocked bails, so the
              // actor visibly drifts from where the morph stopped as
              // the user scrolls between Navigate and Encode.
              // onLeave fires the moment scroll passes the trigger end
              // (regardless of scrub progress), so we can settle the
              // dock state here.
              onLeave: () => {
                if (practiceEntryArmed) {
                  practiceDockAtOrbit();
                }
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
                  // We're before the practice-entry zone (hero, section 02,
                  // or continuum). Reset practice-entry state but DO NOT
                  // pin the actor to HUD here — that's only correct after
                  // the continuum handoff has completed. On initial page
                  // load at scrollY=0 (Hero), unconditionally pinning to
                  // HUD made the brandmark visible at the bottom-left
                  // corner during the Hero section, overriding the
                  // entrance/sigil-park/hidden states owned by upstream
                  // triggers.
                  practiceEntryArmed = false;
                  approachEl.setAttribute("data-orbit-docked", "false");
                  setTravelArmed(handoffArmed || practiceExitArmed);
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
            scrub: 0.4,
            onEnter: () => {
              capturePracticeRects("reverse");
              practiceExitArmed = true;
            },
            onEnterBack: () => {
              capturePracticeRects("reverse");
              practiceExitArmed = true;
            },
            // Symmetric fast-scroll defence: settle at the HUD slot
            // when scroll blows past `bottom -10%` before scrub eases
            // to p >= 0.995. Without this, practiceExitArmed would
            // stay true after the user has left #practice entirely
            // and the actor would remain frozen on its final exit
            // frame, drifting off-target as the rest of the page
            // continues scrolling.
            onLeave: () => {
              if (practiceExitArmed) {
                practiceRedockAtHud();
              }
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
      window.removeEventListener("load", refresh);
      window.removeEventListener("scroll", onDockedScroll);
      refreshTimers.forEach((id) => clearTimeout(id));
      if (roDebounce) clearTimeout(roDebounce);
      ro.disconnect();
      if (dockedRaf) cancelAnimationFrame(dockedRaf);
      hudBrandmark?.classList.remove("is-visible");
      hudEl?.classList.remove("hud--brandmark-active");
      approachEl?.removeAttribute("data-orbit-docked");
      ctx.revert();
      actor()?.hide();
    };
  }, [rootRef, actorRef]);
}
