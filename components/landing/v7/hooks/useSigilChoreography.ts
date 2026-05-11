"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { BrandmarkActorHandle } from "../BrandmarkActor";

gsap.registerPlugin(ScrollTrigger);

/**
 * useSigilChoreography
 *
 * Brandmark scroll character — one travel actor + native source-owned
 * docks. The fixed `.tf-brandmark-actor` exists *only* for transitions
 * between stations; while parked, ownership of the visible mark hands
 * to a native DOM element inside the relevant section so it scrolls
 * naturally with the page (no fixed-position jiggle).
 *
 * Canonical v3 state machine (matches ADR-010 v3):
 *
 *   Hidden        : pre-hero state or post-practice exit; actor opacity 0.
 *   Sigil         : native `.sigil__mark img` (section 02 diagram) owns
 *                   the mark while the visitor reads section 02. The
 *                   fixed actor stays hidden.
 *   Miss          : actor morphs sigil → `.miss__brand-slot img` (centre
 *                   of the 4-card grid in #missing-layer). On p=1, hands
 *                   ownership to the native miss brand via
 *                   `data-brand-on-missing="parked"`.
 *   Backdrop      : actor morphs miss → `.ask__brandmark-anchor` (faint
 *                   ~640px backdrop @ 0.08 opacity behind the Evans quote).
 *   Rail entry    : actor morphs backdrop → `.crail__brand img` (middle
 *                   of the continuum rail). On p=1, hands ownership to
 *                   the native rail brand via `data-brand-on-rail="parked"`.
 *   Practice entry: actor morphs rail brand → `.approach__orbit__mark`
 *                   (orbit centre inside #practice). Live rect each frame
 *                   because the orbit's parent is `position: sticky`.
 *   Practice exit : actor stays pinned at orbit while opacity fades 1 → 0.
 *
 * Trigger anchors (don't retune without an ADR update):
 *   missTl          @ #missing-layer top 50% → top 0%, scrub: 0.4
 *   backdropTl      @ #asking-gap    top 50% → top 0%, scrub: 0.4
 *   railEntryTl     @ #continuum     top 60% → top 30%, scrub: 0.4
 *   practiceEntryTl @ #practice      top 60% → top 0%, scrub: 0.4
 *   practiceExitTl  @ #practice      bottom 25% → bottom -10%, scrub: 0.4
 *
 * Regression invariants (ADR-010 v3 § Eight regression rules):
 *   1. Section 02 source-owned. The native `.sigil__mark img` owns the
 *      visible mark during reading; the fixed actor stays hidden through
 *      hero, entrance, and the parked sigil state. Never imitate the
 *      diagram with the fixed actor.
 *   2. Three source-owned park stations (`.sigil__mark img`,
 *      `.miss__brand-slot img`, `.crail__brand img`). The fixed actor
 *      stays positioned at the brand's rect so it can re-emerge instantly
 *      for the next morph, but is hidden via CSS opacity while parked.
 *      Native dock visibility is strictly gated on `[data-brand-on-*=
 *      "parked"]` — never on IntersectionObserver `.is-in` alone, or the
 *      native will paint before the actor has arrived.
 *   3. Travel legs read live source rects each frame (`readSigilRect`,
 *      `readMissBrandRect`, `readBackdropRect`, `readRailBrandRect`,
 *      orbit `getBoundingClientRect`). No stale captures across triggers.
 *   4. Entrance reads horizontal from the *untransformed* container
 *      and vertical from the live rect centre, so the entrance `scale`
 *      tween doesn't wobble the handoff rect.
 *   5. `onRefresh` short-circuits at `scrollY < 4` for every downstream
 *      trigger, so a refresh on the hero never pins the actor to miss/
 *      backdrop/rail/orbit.
 *   6. Every travel timeline has `onLeave` / `onLeaveBack` settlers so
 *      fast-scroll past `scrub` easing can't leave a dock half-armed.
 *   7. `data-brand-on-missing` and `data-brand-on-rail` (tri-state:
 *      `"false" | "true" | "parked"`) are written to BOTH the landing
 *      rootRef AND `document.documentElement`. The fixed
 *      `.tf-brandmark-actor` renders as a sibling of rootRef, so
 *      descendant selectors only reach it via `documentElement`.
 *   8. `#hudBrandmark` is no longer a destination on v7. It remains
 *      in the DOM as a legacy frame anchor but is hidden by CSS while
 *      `[data-brand-on-rail]` is set. The diamond reticle on the
 *      continuum rail is also hidden whenever the actor owns the rail
 *      (`[data-brand-on-rail="true"]` transit or `"parked"`).
 */
export function useSigilChoreography(
  rootRef: React.RefObject<HTMLElement | null>,
  actorRef: React.RefObject<BrandmarkActorHandle | null>
) {
  useEffect(() => {
    const docEl = rootRef.current;
    if (!docEl) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Stations
    const defEl = docEl.querySelector<HTMLElement>("#definition");
    const missEl = docEl.querySelector<HTMLElement>("#missing-layer");
    const askEl = docEl.querySelector<HTMLElement>("#asking-gap");
    const contEl = docEl.querySelector<HTMLElement>("#continuum");
    const practiceEl = docEl.querySelector<HTMLElement>("#practice");
    const approachEl =
      docEl.querySelector<HTMLElement>("#approach") ??
      docEl.querySelector<HTMLElement>(".approach");

    // Sigil internals (section 02)
    const sigilOrbits = docEl.querySelector<HTMLElement>(".sigil__orbits");
    const sigilHalo = docEl.querySelector<HTMLElement>(".sigil__halo");
    const sigilMark = docEl.querySelector<HTMLElement>(".sigil__mark");
    const sigilCap = docEl.querySelector<HTMLElement>(".sigil__cap");
    const sigilLegend = docEl.querySelector<HTMLElement>(".sigil__legend");
    const triLeft = docEl.querySelector<HTMLElement>(".tri__left");

    // Missing-layer brandmark slot (centre of the 4-card grid).
    /** Native missing-layer brandmark — source-owned during the parked
     * phase. Lives inside the grid DOM so it stays in flow with the
     * cards. Mirrors the rail-brand pattern: fixed actor handles
     * transitions in (sigil → miss) and out (miss → backdrop), the
     * native image owns the visible mark in between. */
    const missBrand = missEl?.querySelector<HTMLElement>(".miss__brand-slot img") ?? null;

    // Asking-gap backdrop anchor
    const askAnchor = askEl?.querySelector<HTMLElement>(".ask__brandmark-anchor") ?? null;

    // Continuum rail
    const crailLine = contEl?.querySelector<HTMLElement>(".crail--large .crail__line") ?? null;
    /** Native rail brandmark — source-owned during the parked phase.
     * Lives inside the rail DOM (position: absolute) so it scrolls
     * naturally with the rail and never jiggles like a fixed-position
     * actor would. The fixed actor only takes over for transitions
     * in (backdrop → rail) and out (rail → orbit). */
    const crailBrand = contEl?.querySelector<HTMLElement>(".crail__brand") ?? null;

    // Bail if essential stations are missing.
    if (!defEl || !contEl || !sigilMark || !sigilOrbits) return;

    const actor = () => actorRef.current;

    // ── State flags ─────────────────────────────────────────────────
    /** True while morphing sigil → missing-layer brand slot. */
    let missArmed = false;
    /** True while parked at the missing-layer brand slot (native
     * `.miss__brand-slot img` owns the visible mark). */
    let parkedAtMiss = false;
    /** True while morphing missing-layer → backdrop. */
    let backdropArmed = false;
    /** True while parked at the asking-gap backdrop anchor. */
    let parkedAtBackdrop = false;
    /** True while morphing backdrop → rail leftmost stop. */
    let railEntryArmed = false;
    /** True while parked at the rail (native crail__brand owns the
     * visible mark; fixed actor is hidden behind opacity 0). */
    let parkedAtRail = false;
    /** True while morphing rail → orbit. */
    let practiceEntryArmed = false;
    /** True while parked at orbit. */
    let parkedAtOrbit = false;
    /** True while fading orbit → hidden on practice exit. */
    let practiceExitArmed = false;

    /** Tri-state data attr: "false" | "true" (transit) | "parked".
     * - "true"   → fixed actor is travelling through the rail band; diamond
     *              reticle is hidden but no native rail brand shown.
     * - "parked" → native `.crail__brand` owns the visible mark; fixed
     *              actor is hidden via CSS opacity.
     * - "false"  → not on the rail at all (default state).
     *
     * Set on BOTH the LandingPage rootRef (for descendants like the
     * native rail brand and diamond reticle) AND documentElement (for
     * the fixed `.tf-brandmark-actor` which is rendered as a sibling
     * of the rootRef and therefore NOT a descendant of it). */
    const setBrandOnRail = (state: "false" | "true" | "parked") => {
      docEl.setAttribute("data-brand-on-rail", state);
      document.documentElement.setAttribute("data-brand-on-rail", state);
    };

    /** Tri-state data attr for the missing-layer dock. Same pattern
     * as setBrandOnRail: "parked" means the native
     * `.miss__brand-slot img` owns the visible mark; "true" means
     * the fixed actor is mid-transit toward / away from this dock;
     * "false" means we're elsewhere on the page. */
    const setBrandOnMissing = (state: "false" | "true" | "parked") => {
      docEl.setAttribute("data-brand-on-missing", state);
      document.documentElement.setAttribute("data-brand-on-missing", state);
    };

    // Section-02 reveal targets — disable any baked-in IO motion so the
    // entrance scrub is the only thing animating these.
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

    /** Read the sigil's untransformed rect. Vertical from the live rect's
     * centre + offsetHeight; horizontal from the parent's rect (which has
     * no scale animation). Same logic as the previous hook so the
     * regression rule "horizontal from untransformed parent" still
     * applies. */
    const readSigilRect = (): DOMRect => {
      const liveRect = sigilMark.getBoundingClientRect();
      const sigilH = sigilMark.offsetHeight;
      const sigilW = sigilMark.offsetWidth;
      if (sigilH <= 0 || sigilW <= 0) return liveRect;
      const verticalCentre = liveRect.top + liveRect.height / 2;
      const unscaledTop = verticalCentre - sigilH / 2;
      const sigilContainer = sigilMark.parentElement;
      let unscaledLeft = liveRect.left;
      if (sigilContainer) {
        const containerRect = sigilContainer.getBoundingClientRect();
        if (containerRect.width > 0) {
          unscaledLeft = containerRect.left + (containerRect.width - sigilW) / 2;
        }
      }
      return new DOMRect(unscaledLeft, unscaledTop, sigilW, sigilH);
    };

    /** Backdrop anchor's live rect. */
    const readBackdropRect = (): DOMRect | null => {
      if (!askAnchor) return null;
      return askAnchor.getBoundingClientRect();
    };

    /** Compute a square brandmark rect along the rail at a normalised
     * scroll progress p in [0, 1]. The actor sits centred on the rail
     * line, sized to fit visually below the line readout (~48px). */
    const readRailRectAt = (p: number): DOMRect | null => {
      if (!crailLine) return null;
      const lineRect = crailLine.getBoundingClientRect();
      if (lineRect.width <= 0) return null;
      const size = 48;
      const cx = lineRect.left + lineRect.width * Math.min(1, Math.max(0, p));
      const cy = lineRect.top + lineRect.height / 2;
      // Actor sits *above* the rail line so its centre and the rail
      // ride together visually (the line is a 1px hairline; the
      // brandmark is a square sigil).
      return new DOMRect(cx - size / 2, cy - size / 2, size, size);
    };

    // Stop fractions / scrub helpers were removed when the brandmark
    // moved to the native `.crail__brand` (parked at the middle stop
    // for the duration of continuum). The fixed actor only handles
    // transitions in (backdrop → rail brand) and out (rail brand →
    // orbit), so per-stop fraction maths is no longer needed.

    const orbitMarkEl = () =>
      approachEl && docEl.contains(approachEl)
        ? approachEl.querySelector<HTMLElement>(".approach__orbit__mark")
        : docEl.querySelector<HTMLElement>(".approach__orbit__mark");

    /** Live rect of the native rail brand element. Read each call so
     * the morph from rail → orbit can hand off from the brand's
     * current viewport position even as the page scrolls. */
    const readRailBrandRect = (): DOMRect | null => {
      if (!crailBrand) return null;
      return crailBrand.getBoundingClientRect();
    };

    /** Live rect of the missing-layer brand image. Same pattern as
     * readRailBrandRect — read each call so the morph from
     * miss → backdrop hands off from the brand's current viewport
     * position even as the page scrolls. */
    const readMissBrandRect = (): DOMRect | null => {
      if (!missBrand) return null;
      return missBrand.getBoundingClientRect();
    };

    /** Park at the native missing-layer brand. Hands ownership of the
     * visible mark to `.miss__brand-slot img` (CSS-driven via
     * `[data-brand-on-missing="parked"]`). The fixed actor stays
     * pinned at the brand's rect so it can re-emerge instantly for
     * the backdrop morph, but is hidden via CSS opacity. The native
     * brand scrolls naturally with the grid DOM, no jiggle. */
    const pinAtMissLayerParked = () => {
      const a = actor();
      if (!a) return;
      const rect = readMissBrandRect();
      if (rect && rect.width > 0) {
        a.pinToRect(rect, 1, 1); // CSS forces opacity:0 via data-attr
      }
      a.setHudOutline(false);
      parkedAtMiss = true;
      missArmed = false;
      setBrandOnMissing("parked");
      setBrandOnRail("false");
      setTravelArmed(backdropArmed);
    };

    /** Pin actor to the asking-gap backdrop anchor at large scale and
     * faint opacity. */
    const pinToBackdrop = () => {
      const a = actor();
      if (!a) return;
      const rect = readBackdropRect();
      if (!rect) return;
      a.pinToRect(rect, 0.08, 1);
      a.setHudOutline(false);
      parkedAtBackdrop = true;
      parkedAtMiss = false;
      parkedAtRail = false;
      backdropArmed = false;
      setBrandOnMissing("false");
      setBrandOnRail("false");
      setTravelArmed(railEntryArmed);
    };

    /** Pin actor to the rail at a normalised X fraction. Used during
     * the railEntry morph (when frac=0..1 hasn't reached the parked
     * dock yet) and during the practice entry morph's first frame
     * to position the actor where the native brand was. */
    const pinToRailAt = (frac: number) => {
      const a = actor();
      if (!a) return;
      const rect = readRailRectAt(frac);
      if (!rect) return;
      a.pinToRect(rect, 1, 1);
      a.setHudOutline(false);
      setBrandOnRail("true");
      parkedAtBackdrop = false;
      parkedAtRail = false;
      railEntryArmed = false;
      setTravelArmed(practiceEntryArmed);
    };

    /** Park at the native rail brand. Hands ownership of the visible
     * mark to `.crail__brand` (CSS-driven via [data-brand-on-rail]
     * = "parked"). The fixed actor stays positioned at the brand's
     * rect (so it can re-emerge instantly for the practice entry
     * morph) but is hidden via CSS opacity. No JS scroll listener
     * needed while parked — the native brand scrolls naturally with
     * the rail DOM, eliminating the fixed-position jiggle. */
    const pinAtRailParked = () => {
      const a = actor();
      if (!a) return;
      const rect = readRailBrandRect();
      if (rect && rect.width > 0) {
        a.pinToRect(rect, 1, 1); // CSS forces opacity:0 via data-attr
      }
      a.setHudOutline(false);
      parkedAtRail = true;
      parkedAtBackdrop = false;
      railEntryArmed = false;
      setBrandOnRail("parked");
      setTravelArmed(practiceEntryArmed);
    };

    /** Pin actor to the orbit centre (approach__orbit__mark). */
    const pinToOrbit = () => {
      const a = actor();
      if (!a) return;
      const mark = orbitMarkEl();
      if (!mark) return;
      const rect = mark.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      a.pinToRect(rect, 1, 1);
      a.setHudOutline(false);
      parkedAtOrbit = true;
      parkedAtRail = false;
      practiceEntryArmed = false;
      setBrandOnRail("false");
      approachEl?.setAttribute("data-orbit-docked", "true");
      setTravelArmed(practiceExitArmed);
    };

    /** Pin actor to the orbit centre (approach__orbit__mark). */

    /** Hide actor entirely (post-practice exit). */
    const hideActor = () => {
      actor()?.hide();
      parkedAtMiss = false;
      parkedAtBackdrop = false;
      parkedAtRail = false;
      parkedAtOrbit = false;
      missArmed = false;
      backdropArmed = false;
      railEntryArmed = false;
      practiceEntryArmed = false;
      practiceExitArmed = false;
      setBrandOnMissing("false");
      setBrandOnRail("false");
      approachEl?.setAttribute("data-orbit-docked", "false");
      setTravelArmed(false);
    };

    /** Show the native sigil source (used when reversing back into
     * section 02 from the missing-layer / asking-gap). */
    const showSigilSource = () => {
      gsap.set(sigilMark, { opacity: 1, "--frame-opacity": 1 });
      actor()?.hide();
      parkedAtMiss = false;
      parkedAtBackdrop = false;
      missArmed = false;
      backdropArmed = false;
      setBrandOnMissing("false");
      setBrandOnRail("false");
    };

    // ── Reduced-motion fast path ────────────────────────────────────
    // Pin instantly: missing-layer → backdrop → rail → orbit; hide on
    // practice exit.
    if (reduceMotion) {
      gsap.set(
        [sigilOrbits, sigilHalo, sigilMark, sigilCap, sigilLegend, triLeft].filter(Boolean),
        { opacity: 1, scale: 1, y: 0, clearProps: "transform" }
      );
      const rmCtx = gsap.context(() => {
        if (missEl) {
          ScrollTrigger.create({
            trigger: missEl,
            start: "top 60%",
            end: "bottom 40%",
            onEnter: () => pinAtMissLayerParked(),
            onEnterBack: () => pinAtMissLayerParked(),
          });
        }
        if (askEl) {
          ScrollTrigger.create({
            trigger: askEl,
            start: "top 60%",
            end: "bottom 40%",
            onEnter: () => pinToBackdrop(),
            onEnterBack: () => pinToBackdrop(),
          });
        }
        ScrollTrigger.create({
          trigger: contEl,
          start: "top 60%",
          end: "bottom 40%",
          onEnter: () => pinAtRailParked(),
          onEnterBack: () => pinAtRailParked(),
        });
        if (practiceEl && approachEl) {
          ScrollTrigger.create({
            trigger: practiceEl,
            start: "top 40%",
            end: "top 0%",
            onEnter: () => pinToOrbit(),
            onLeaveBack: () => pinAtRailParked(),
          });
          ScrollTrigger.create({
            trigger: practiceEl,
            start: "bottom 25%",
            end: "bottom -10%",
            onEnter: () => hideActor(),
            onLeaveBack: () => pinToOrbit(),
          });
        }
      }, docEl);
      return () => {
        rmCtx.revert();
        approachEl?.removeAttribute("data-orbit-docked");
        setBrandOnRail("false");
        setBrandOnMissing("false");
        actor()?.hide();
      };
    }

    const handoffEase = gsap.parseEase("power3.inOut");

    // Cached morph rects — kept fresh by `onResize` and re-captured
    // at trigger boundaries so live targets aren't re-read every frame
    // outside the hot path of the scrub.
    let missMorphSrc: DOMRect | null = null;
    let missMorphDst: DOMRect | null = null;
    let backdropMorphSrc: DOMRect | null = null;
    let backdropMorphDst: DOMRect | null = null;
    let railEntryMorphSrc: DOMRect | null = null;
    let railEntryMorphDst: DOMRect | null = null;
    let practiceEntryMorphSrc: DOMRect | null = null;
    let practiceEntryMorphDst: DOMRect | null = null;

    const captureMissRects = () => {
      missMorphSrc = readSigilRect();
      // Land at the native missing-layer brand position (the parked
      // dock) so the morph completes exactly where the native brand
      // takes over.
      missMorphDst = readMissBrandRect();
    };

    const captureBackdropRects = () => {
      // Source = current viewport position of the native missing-layer
      // brand. If the missing-layer section isn't in the page (no
      // brand to read), fall back to the live sigil rect so the morph
      // still has a sensible source on first paint.
      backdropMorphSrc = readMissBrandRect() ?? readSigilRect();
      backdropMorphDst = readBackdropRect();
    };

    const captureRailEntryRects = () => {
      railEntryMorphSrc = readBackdropRect();
      // Land at the native rail brand position (the parked dock) so
      // the morph completes exactly where the native brand will take
      // over. If the brand isn't measurable yet, fall back to the
      // middle stop on the rail line.
      railEntryMorphDst = readRailBrandRect() ?? readRailRectAt(0.5);
    };

    const capturePracticeEntryRects = () => {
      // Source = current viewport position of the native rail brand.
      // Read live each capture because the brand scrolls with the rail.
      practiceEntryMorphSrc = readRailBrandRect() ?? readRailRectAt(0.5);
      const mark = orbitMarkEl();
      practiceEntryMorphDst = mark?.getBoundingClientRect() ?? null;
    };

    const applyMissMorph = (p: number) => {
      const a = actor();
      if (!a || !missMorphSrc || !missMorphDst) return;
      if (p <= 0) {
        showSigilSource();
        return;
      }
      if (p >= 0.995) {
        pinAtMissLayerParked();
        return;
      }
      missArmed = true;
      parkedAtMiss = false;
      // Hide the native sigil mark while the actor flies over it.
      gsap.set(sigilMark, { opacity: 0, "--frame-opacity": 0 });
      a.morphRects(missMorphSrc, missMorphDst, p, handoffEase);
      gsap.set(".tf-brandmark-actor", { opacity: 1 });
      setBrandOnMissing("true");
      setTravelArmed(true);
    };

    const applyBackdropMorph = (p: number) => {
      const a = actor();
      if (!a) return;
      // Read live each frame because the missing-layer source rect
      // changes as the user scrolls past it.
      backdropMorphSrc = readMissBrandRect() ?? readSigilRect();
      backdropMorphDst = readBackdropRect();
      if (!backdropMorphSrc || !backdropMorphDst) return;
      if (p <= 0) {
        // Reverse direction: hand back to the missing-layer parked dock.
        if (missEl) pinAtMissLayerParked();
        else showSigilSource();
        return;
      }
      if (p >= 0.995) {
        pinToBackdrop();
        return;
      }
      backdropArmed = true;
      parkedAtBackdrop = false;
      parkedAtMiss = false;
      // Sigil source already hidden by missMorph; ensure it stays so
      // when the user reverses without going all the way back.
      gsap.set(sigilMark, { opacity: 0, "--frame-opacity": 0 });
      a.morphRects(backdropMorphSrc, backdropMorphDst, p, handoffEase);
      // morphShell sets opacity:1; tween it down toward backdrop's
      // 0.08 as the morph completes so the landing reads as a faint
      // backdrop rather than a sudden snap.
      const targetOpacity = 1 - (1 - 0.08) * p;
      gsap.set(".tf-brandmark-actor", { opacity: targetOpacity });
      // Diamond / native rail brand are hidden during transit; native
      // missing-layer brand also hidden so the fixed actor owns the
      // visible mark for the duration of the morph.
      setBrandOnMissing("true");
      setTravelArmed(true);
    };

    const applyRailEntryMorph = (p: number) => {
      const a = actor();
      if (!a) return;
      if (!railEntryMorphSrc || !railEntryMorphDst) {
        captureRailEntryRects();
      }
      if (!railEntryMorphSrc || !railEntryMorphDst) return;
      if (p <= 0) {
        pinToBackdrop();
        return;
      }
      if (p >= 0.995) {
        pinAtRailParked();
        return;
      }
      railEntryArmed = true;
      parkedAtBackdrop = false;
      a.morphRects(railEntryMorphSrc, railEntryMorphDst, p, handoffEase);
      // Fade up from 0.08 → 1 across the entry morph.
      const opacity = 0.08 + (1 - 0.08) * p;
      gsap.set(".tf-brandmark-actor", { opacity });
      setBrandOnRail("true");
      setTravelArmed(true);
    };

    const applyPracticeEntryMorph = (p: number) => {
      const a = actor();
      if (!a) return;
      // Always read live rects each frame — both the rail brand
      // (scrolls with the rail DOM) and the orbit (sticky parent)
      // change position relative to the viewport per scroll frame.
      practiceEntryMorphSrc = readRailBrandRect() ?? readRailRectAt(0.5);
      const mark = orbitMarkEl();
      practiceEntryMorphDst = mark?.getBoundingClientRect() ?? null;
      if (!practiceEntryMorphSrc || !practiceEntryMorphDst) return;
      if (p <= 0) {
        pinAtRailParked();
        return;
      }
      if (p >= 0.995) {
        pinToOrbit();
        return;
      }
      practiceEntryArmed = true;
      parkedAtOrbit = false;
      parkedAtRail = false;
      setBrandOnRail("true"); // transit state — diamond hidden, native rail brand hidden, fixed actor visible
      approachEl?.setAttribute("data-orbit-docked", "false");
      a.morphRects(practiceEntryMorphSrc, practiceEntryMorphDst, p, handoffEase);
      gsap.set(".tf-brandmark-actor", { opacity: 1 });
      setTravelArmed(true);
    };

    const applyPracticeExitFade = (p: number) => {
      const a = actor();
      if (!a) return;
      if (p <= 0) {
        pinToOrbit();
        return;
      }
      if (p >= 0.995) {
        hideActor();
        return;
      }
      practiceExitArmed = true;
      parkedAtOrbit = false;
      // Keep the actor at the orbit position while fading out, so it
      // looks like the brandmark is dissolving in place rather than
      // sliding off-screen.
      const mark = orbitMarkEl();
      if (mark) {
        a.pinToRect(mark.getBoundingClientRect(), 1 - p, 1);
      }
      setTravelArmed(true);
    };

    const repinActorToOrbitIfDocked = () => {
      if (!approachEl) return;
      if (approachEl.getAttribute("data-orbit-docked") !== "true") return;
      if (missArmed || backdropArmed || railEntryArmed || practiceEntryArmed || practiceExitArmed)
        return;
      const mark = orbitMarkEl();
      if (!mark) return;
      const rect = mark.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      actor()?.pinToRect(rect, 1, 1);
      actor()?.setHudOutline(false);
    };

    const repinActorAtMissIfParked = () => {
      // Native miss brand owns the visible mark; the fixed actor is
      // hidden via CSS opacity. Re-pin the (invisible) actor to the
      // brand's current rect each scroll tick so it can re-emerge
      // exactly where the brand is when the backdrop morph arms.
      if (!parkedAtMiss) return;
      if (missArmed || backdropArmed || railEntryArmed || practiceEntryArmed || practiceExitArmed)
        return;
      const rect = readMissBrandRect();
      if (!rect || rect.width <= 0) return;
      actor()?.pinToRect(rect, 1, 1);
      actor()?.setHudOutline(false);
    };

    const repinActorAtRailIfScrubbing = () => {
      // Parked-at-rail uses the native `.crail__brand` element; no
      // JS re-pin needed because the brand scrolls naturally with
      // the rail DOM. Reserved as a no-op for future use.
      return;
      // Best-effort: re-read rail rect on scroll without touching
      // global progress. The railScrubTl onUpdate is the source of
      // truth for X; this just keeps Y aligned with rail movement
      // (the rail moves with the document scroll).
      // No-op here — railScrubTl.onUpdate will fire on the same
      // frame and overwrite. Reserved for future use.
    };

    /** Section 02 source-owned park: keep the actor hidden whenever the
     * user is parked at the sigil reading state. Mirrors the original
     * hook's invariant 1. */
    const repinActorToSigilIfParked = () => {
      if (
        missArmed ||
        backdropArmed ||
        railEntryArmed ||
        practiceEntryArmed ||
        practiceExitArmed ||
        parkedAtMiss ||
        parkedAtBackdrop ||
        parkedAtRail ||
        parkedAtOrbit
      )
        return;
      const vh = window.innerHeight;
      const entrancePastEnd = defEl.getBoundingClientRect().top <= vh * 0.35;
      if (!entrancePastEnd) return;
      // Once the missing-layer (or asking-gap as fallback) crosses
      // the upper third of the viewport, downstream owns the actor;
      // stop pinning to sigil.
      const downstreamReached = missEl
        ? missEl.getBoundingClientRect().top <= vh * 0.6
        : askEl
          ? askEl.getBoundingClientRect().top <= vh * 0.6
          : contEl.getBoundingClientRect().top <= vh * 0.5;
      if (downstreamReached) return;
      const o = Number(gsap.getProperty(sigilMark, "opacity")) || 0;
      if (o < 0.95) return;
      actor()?.hide();
      actor()?.setHudOutline(false);
    };

    const onResize = () => {
      if (missArmed) captureMissRects();
      if (backdropArmed) captureBackdropRects();
      if (railEntryArmed) captureRailEntryRects();
      if (practiceEntryArmed) capturePracticeEntryRects();
      if (parkedAtMiss) pinAtMissLayerParked();
      if (parkedAtBackdrop) pinToBackdrop();
      if (parkedAtRail) pinAtRailParked();
      if (parkedAtOrbit) pinToOrbit();
      repinActorToOrbitIfDocked();
      repinActorAtMissIfParked();
      repinActorToSigilIfParked();
    };
    window.addEventListener("resize", onResize);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") ScrollTrigger.refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) ScrollTrigger.refresh();
    };
    window.addEventListener("pageshow", onPageShow);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
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
    if (askEl) ro.observe(askEl);
    if (missEl) ro.observe(missEl);

    // Continuous reconciliation. Re-pin the actor to the orbit while
    // parked there (sticky parent moves), and keep the sigil-park rule
    // honoured. Also keep the (invisible) actor pinned to the
    // missing-layer brand's current position while parked, so the
    // backdrop morph hands off cleanly from the right rect.
    let dockedRaf = 0;
    const onScroll = () => {
      if (dockedRaf) return;
      dockedRaf = requestAnimationFrame(() => {
        dockedRaf = 0;
        repinActorToOrbitIfDocked();
        repinActorAtRailIfScrubbing();
        repinActorAtMissIfParked();
        repinActorToSigilIfParked();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const ctx = gsap.context(() => {
      // Initial state: hide everything at section 02.
      gsap.set([sigilOrbits, sigilHalo].filter(Boolean), { opacity: 0, scale: 0.6, rotation: -8 });
      gsap.set(sigilMark, { opacity: 0, scale: 0.7 });
      gsap.set([sigilCap, sigilLegend, triLeft].filter(Boolean), { opacity: 0, y: 16 });
      if (approachEl && !approachEl.getAttribute("data-orbit-docked")) {
        approachEl.setAttribute("data-orbit-docked", "false");
      }

      // ── Trigger 1: Entrance — sigil reveal ─────────────────────
      const entranceTl = gsap.timeline({
        scrollTrigger: {
          trigger: defEl,
          start: "top 85%",
          end: "top 35%",
          scrub: 0.6,
          onUpdate: () => {
            // While entrance is scrubbing, ensure the actor stays hidden
            // and the native sigil owns the diagram (Rule 1).
            const downstreamOwns =
              backdropArmed ||
              railEntryArmed ||
              practiceEntryArmed ||
              practiceExitArmed ||
              parkedAtBackdrop ||
              parkedAtOrbit;
            if (!downstreamOwns) actor()?.hide();
          },
          onRefresh: () => {
            const downstreamOwns =
              backdropArmed ||
              railEntryArmed ||
              practiceEntryArmed ||
              practiceExitArmed ||
              parkedAtBackdrop ||
              parkedAtOrbit;
            if (!downstreamOwns) actor()?.hide();
          },
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
        .to(sigilMark, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }, 0.15)
        .to(
          [sigilCap, sigilLegend].filter(Boolean),
          { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", stagger: 0.06 },
          0.3
        )
        .to(
          [triLeft].filter(Boolean),
          { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" },
          0.25
        );

      // ── Trigger 2: Missing-layer — sigil → native miss brand ───
      // Morphs the fixed actor from the live sigil rect to the
      // missing-layer brand image's position. At p=1, hands ownership
      // to the native `.miss__brand-slot img` via `pinAtMissLayerParked()`
      // (CSS sets `[data-brand-on-missing="parked"]`, fading the native
      // brand in and the fixed actor out). The native brand owns the
      // visible mark while the user reads the 4 cards.
      if (missEl) {
        gsap.timeline({
          scrollTrigger: {
            trigger: missEl,
            start: "top 50%",
            end: "top 0%",
            scrub: 0.4,
            onEnter: () => {
              captureMissRects();
              missArmed = true;
              setTravelArmed(true);
            },
            onEnterBack: () => {
              captureMissRects();
              missArmed = true;
              setTravelArmed(true);
            },
            onLeave: () => pinAtMissLayerParked(),
            onLeaveBack: () => {
              missArmed = false;
              showSigilSource();
            },
            onRefresh: (self) => {
              if (window.scrollY < 4) return;
              if (self.progress >= 0.995) {
                captureMissRects();
                missArmed = true;
                pinAtMissLayerParked();
              } else if (self.progress > 0) {
                captureMissRects();
                missArmed = true;
                applyMissMorph(self.progress);
              } else {
                if (parkedAtMiss || parkedAtBackdrop || parkedAtOrbit) return;
                showSigilSource();
              }
            },
            onUpdate: (self) => applyMissMorph(self.progress),
          },
        });
      }

      // ── Trigger 3: Backdrop — missing-layer → asking-gap backdrop ──
      // Source rect changes from the sigil to the native missing-layer
      // brand (since the brandmark now travels through the miss dock
      // first). At p=1, hands to the asking-gap backdrop anchor.
      if (askEl) {
        gsap.timeline({
          scrollTrigger: {
            trigger: askEl,
            start: "top 50%",
            end: "top 0%",
            scrub: 0.4,
            onEnter: () => {
              captureBackdropRects();
              backdropArmed = true;
              setTravelArmed(true);
            },
            onEnterBack: () => {
              captureBackdropRects();
              backdropArmed = true;
              setTravelArmed(true);
            },
            onLeave: () => pinToBackdrop(),
            onLeaveBack: () => {
              backdropArmed = false;
              if (missEl) pinAtMissLayerParked();
              else showSigilSource();
            },
            onRefresh: (self) => {
              // Never pin from refresh at scrollY === 0 (Rule 4).
              if (window.scrollY < 4) return;
              if (self.progress >= 0.995) {
                captureBackdropRects();
                backdropArmed = true;
                pinToBackdrop();
              } else if (self.progress > 0) {
                captureBackdropRects();
                backdropArmed = true;
                applyBackdropMorph(self.progress);
              } else {
                if (parkedAtMiss || parkedAtBackdrop || parkedAtOrbit) return;
                if (missEl) pinAtMissLayerParked();
                else showSigilSource();
              }
            },
            onUpdate: (self) => applyBackdropMorph(self.progress),
          },
        });
      }

      // ── Trigger 3: Rail entry — backdrop → native rail brand ───
      // Morphs the fixed actor from backdrop → the native
      // `.crail__brand` element's position. At p=1, hands ownership
      // to the native element via `pinAtRailParked()` (CSS sets
      // `[data-brand-on-rail="parked"]`, which fades the native
      // brand in and the fixed actor out). The native brand then
      // owns the visible mark for the duration of continuum body —
      // it scrolls naturally with the rail DOM, no jiggle.
      gsap.timeline({
        scrollTrigger: {
          trigger: contEl,
          start: "top 60%",
          end: "top 30%",
          scrub: 0.4,
          onEnter: () => {
            captureRailEntryRects();
            railEntryArmed = true;
            setTravelArmed(true);
          },
          onEnterBack: () => {
            captureRailEntryRects();
            railEntryArmed = true;
            setTravelArmed(true);
          },
          onLeave: () => pinAtRailParked(),
          onLeaveBack: () => pinToBackdrop(),
          onRefresh: (self) => {
            if (window.scrollY < 4) return;
            if (self.progress >= 0.995) {
              captureRailEntryRects();
              railEntryArmed = true;
              pinAtRailParked();
            } else if (self.progress > 0) {
              captureRailEntryRects();
              railEntryArmed = true;
              applyRailEntryMorph(self.progress);
            }
          },
          onUpdate: (self) => applyRailEntryMorph(self.progress),
        },
      });

      // ── Trigger 4 (legacy): Rail scrub trigger removed ─────────
      // The brandmark now stays parked at the native `.crail__brand`
      // (CSS-pinned to `left: 50%` of the rail line) for the entire
      // continuum body. No JS scrub needed because the native brand
      // moves with the rail DOM. Reverse hand-off (orbit → rail)
      // re-armed by `practiceEntryTl.onLeaveBack`.
      // Keep the data-attr re-set on continuum re-entry from above
      // so a hard scroll back doesn't strand the actor in transit.
      gsap.timeline({
        scrollTrigger: {
          trigger: contEl,
          start: "top 30%",
          end: "bottom 60%",
          onEnter: () => {
            if (!parkedAtRail) pinAtRailParked();
          },
          onEnterBack: () => {
            if (!parkedAtRail) pinAtRailParked();
          },
          onRefresh: (self) => {
            if (window.scrollY < 4) return;
            if (self.isActive) {
              if (!parkedAtRail) pinAtRailParked();
            }
          },
        },
      });

      if (practiceEl && approachEl) {
        // ── Trigger 5: Practice entry — rail brand → orbit ───────
        // Source rect is the live `.crail__brand` (read each frame
        // via `readRailBrandRect()`). Destination is the live orbit
        // mark (also read each frame, since its sticky parent
        // changes engagement). Starts at practice top 60% so there
        // is a clean ~540px scroll runway for the morph.
        gsap.timeline({
          scrollTrigger: {
            trigger: practiceEl,
            start: "top 60%",
            end: "top 0%",
            scrub: 0.4,
            onEnter: () => {
              capturePracticeEntryRects();
              practiceEntryArmed = true;
              parkedAtRail = false;
              setTravelArmed(true);
            },
            onEnterBack: () => {
              capturePracticeEntryRects();
              practiceEntryArmed = true;
              parkedAtRail = false;
              setTravelArmed(true);
            },
            onLeave: () => {
              if (practiceEntryArmed) pinToOrbit();
            },
            onLeaveBack: () => {
              practiceEntryArmed = false;
              pinAtRailParked();
            },
            onRefresh: (self) => {
              if (window.scrollY < 4) {
                practiceEntryArmed = false;
                approachEl.setAttribute("data-orbit-docked", "false");
                return;
              }
              if (self.progress >= 0.995) {
                capturePracticeEntryRects();
                practiceEntryArmed = true;
                pinToOrbit();
              } else if (self.progress > 0) {
                capturePracticeEntryRects();
                practiceEntryArmed = true;
                applyPracticeEntryMorph(self.progress);
              } else {
                practiceEntryArmed = false;
                approachEl.setAttribute("data-orbit-docked", "false");
              }
            },
            onUpdate: (self) => applyPracticeEntryMorph(self.progress),
          },
        });

        // ── Trigger 6: Practice exit — orbit → hidden (fade) ─────
        gsap.timeline({
          scrollTrigger: {
            trigger: practiceEl,
            start: "bottom 25%",
            end: "bottom -10%",
            scrub: 0.4,
            onEnter: () => {
              practiceExitArmed = true;
              setTravelArmed(true);
            },
            onEnterBack: () => {
              practiceExitArmed = true;
              setTravelArmed(true);
            },
            onLeave: () => {
              if (practiceExitArmed) hideActor();
            },
            onLeaveBack: () => {
              practiceExitArmed = false;
              pinToOrbit();
            },
            onRefresh: (self) => {
              if (window.scrollY < 4) return;
              if (self.progress >= 0.995) {
                practiceExitArmed = true;
                hideActor();
              } else if (self.progress > 0) {
                practiceExitArmed = true;
                applyPracticeExitFade(self.progress);
              }
            },
            onUpdate: (self) => applyPracticeExitFade(self.progress),
          },
        });

        // ── Trigger 7: Orbit re-pin while parked (sticky tracker) ─
        ScrollTrigger.create({
          trigger: practiceEl,
          start: "top 0%",
          end: "bottom 25%",
          onUpdate: () => repinActorToOrbitIfDocked(),
          onEnter: () => repinActorToOrbitIfDocked(),
          onEnterBack: () => repinActorToOrbitIfDocked(),
          onRefresh: () => repinActorToOrbitIfDocked(),
        });
      }
    }, docEl);

    // Initial sync.
    repinActorToSigilIfParked();

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("load", refresh);
      window.removeEventListener("scroll", onScroll);
      refreshTimers.forEach((id) => clearTimeout(id));
      if (roDebounce) clearTimeout(roDebounce);
      ro.disconnect();
      if (dockedRaf) cancelAnimationFrame(dockedRaf);
      approachEl?.removeAttribute("data-orbit-docked");
      docEl.removeAttribute("data-brand-on-rail");
      document.documentElement.removeAttribute("data-brand-on-rail");
      docEl.removeAttribute("data-brand-on-missing");
      document.documentElement.removeAttribute("data-brand-on-missing");
      ctx.revert();
      actor()?.hide();
    };
  }, [rootRef, actorRef]);
}
