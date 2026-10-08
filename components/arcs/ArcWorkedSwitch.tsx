"use client";

import { useEffect } from "react";

const ROOT = ".arc-root";
const JS_CLASS = "is-arc-worked-js";
const PICK_ATTR = "data-arc-worked";
const PANEL = "[data-arc-worked-panel]";
const TAB = "[data-arc-worked-tab]";
const GROUP = "[data-arc-worked-group]";
const LIVE_ATTR = "data-arc-worked-live";

/**
 * ArcWorkedSwitch — the one island the switched chapter needs (ADR-139).
 *
 * It owns exactly four things: the class that tells the stylesheet a hand
 * is listening, the `hidden` flag on every panel, the checked state of
 * every tab, and which group is being read (`data-arc-worked-live`, so the
 * bar can dock in the frame's top band only then). Nothing else on the page
 * knows it exists.
 *
 * ⚠ THE PICK REACHES EVERY GROUP THAT OFFERS IT (ADR-148 U5). Groups that
 * carry the same ids follow one choice together, so the room follows one
 * piece of work from the plugin board to the last conversation without
 * touching the control again; a group with its own ids (the Suri page's
 * cases beside its workstreams) keeps its own pick. `arcs-registry` pins
 * that groups sharing an id share the whole set, in the same order.
 *
 * ⚠ IT NEVER RENDERS THE PANELS. They are server markup, already correct at
 * rest; this only hides the ones that are not picked. That is what keeps
 * no-JS, reduced motion and a static render all reading whole — the
 * `configuration` picker's own law (`types.ts`), held here.
 *
 * ⚠ NO STATE, NO RE-RENDER. The DOM is the state. A React state here would
 * mean the island owned the panels, and it would have to render six beats'
 * worth of content it does not have.
 */
export function ArcWorkedSwitch() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(ROOT);
    if (!root) return;

    const groups = Array.from(root.querySelectorAll<HTMLElement>(GROUP)).map((el) => ({
      el,
      panels: Array.from(el.querySelectorAll<HTMLElement>(PANEL)),
      tabs: Array.from(el.querySelectorAll<HTMLButtonElement>(TAB)),
    }));
    const panels = groups.flatMap((g) => g.panels);
    if (panels.length === 0) return;

    /* Pick `pick` in every group that offers it; the rest keep theirs. */
    const apply = (pick: string) => {
      root.setAttribute(PICK_ATTR, pick);
      for (const g of groups) {
        if (!g.panels.some((p) => p.dataset.arcWorkedPanel === pick)) continue;
        for (const panel of g.panels) panel.hidden = panel.dataset.arcWorkedPanel !== pick;
        for (const tab of g.tabs) {
          const on = tab.dataset.arcWorkedTab === pick;
          tab.setAttribute("aria-checked", on ? "true" : "false");
          tab.tabIndex = on ? 0 : -1;
        }
      }
    };

    const onClick = (event: MouseEvent) => {
      const tab = (event.target as HTMLElement | null)?.closest<HTMLElement>(TAB);
      const pick = tab?.dataset.arcWorkedTab;
      if (pick) apply(pick);
    };

    /* Arrow keys move the pick inside the group the focus is in, the radio
       pattern's own behaviour; the pick then reaches every group offering it. */
    const onKeyDown = (event: KeyboardEvent) => {
      const tab = (event.target as HTMLElement | null)?.closest<HTMLElement>(TAB);
      if (!tab) return;
      const step =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;
      if (!step) return;
      event.preventDefault();
      const bar = tab.closest<HTMLElement>("[data-arc-worked-bar]");
      const siblings = Array.from(bar?.querySelectorAll<HTMLButtonElement>(TAB) ?? []);
      const at = siblings.indexOf(tab as HTMLButtonElement);
      const next = siblings[(at + step + siblings.length) % siblings.length];
      const pick = next?.dataset.arcWorkedTab;
      if (!pick) return;
      apply(pick);
      next.focus();
    };

    /* The bar docks in the frame's top band only while its group is the
       one being read (ADR-148 U7): the group crossing the viewport's
       midline, the corner readout's own band. Off, it takes no room. */
    const live = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.toggleAttribute(LIVE_ATTR, entry.isIntersecting);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    for (const g of groups) live.observe(g.el);

    root.classList.add(JS_CLASS);
    /* The resting pick is each group's own: whichever panel the server
       marked default. Never a literal here — the record decides the order,
       and a hard-coded first id would drift the day it changes. */
    for (const g of groups) {
      const resting =
        g.panels.find((p) => p.hasAttribute("data-arc-worked-default"))?.dataset.arcWorkedPanel ??
        g.panels[0]?.dataset.arcWorkedPanel;
      if (resting) apply(resting);
    }
    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeyDown);

    return () => {
      live.disconnect();
      for (const g of groups) g.el.removeAttribute(LIVE_ATTR);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeyDown);
      root.classList.remove(JS_CLASS);
      root.removeAttribute(PICK_ATTR);
      for (const panel of panels) panel.hidden = false;
    };
  }, []);

  return null;
}
