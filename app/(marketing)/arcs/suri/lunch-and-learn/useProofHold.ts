"use client";

import { useEffect } from "react";

/**
 * useProofHold — the proof pile stays behind while the room's own part
 * scrolls over it (ADR-147 U7, owner 2026-10-05: "the proof cards when I've
 * scrolled all through them stay sticky in the background so the 'What this
 * looks like at Suri.' section nicely scrolls over it").
 *
 * `#services` becomes STICKY, pinned on the frame where the last card is
 * seated (see `seat`), and `#workshop`, the next station, rises over it:
 * both are opaque `.station`s of one parent, and the workshop takes
 * `z-index: 7` over the pile's 6 (v1's sheet lifts the proof station to 6
 * while it is live). ⚠ Never lower the PILE instead: the corridor's WebGL
 * host shares that stack, and a lowered pile paints under it (measured: the
 * gate showed where the cards were). Once the workshop covers
 * the frame the pile is hidden, so a presenting laptop does not keep painting
 * four consoles under an opaque page.
 *
 * ⚠ This route only, and only where the pile is a scroll-driven stack: the
 * capable rung, never a phone and never reduced motion (the gate below is the
 * casefile's own pair). Everything it writes is inline and restored on
 * unmount, so v1's shared sheet is untouched.
 */
const MEDIA = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";

export function useProofHold() {
  useEffect(() => {
    const services = document.querySelector<HTMLElement>(".tw-root #services");
    const workshop = document.querySelector<HTMLElement>(".tw-root #workshop");
    if (!services || !workshop) return;
    const mq = window.matchMedia(MEDIA);
    let raf = 0;

    /* Pin the station on the frame where the LAST card is seated, not on its
       own last screen: the pile's runway runs past the seat (the last card's
       exit, ADR-096 U3), so a pin at the station's foot holds an empty frame.
       The seat is read off the last slot's NORMAL-FLOW box (its sticky
       release is lifted for one synchronous read) against its sticky `top`.
       Then the next station is pulled up by a margin so it enters the frame's
       foot on that same frame: the scroll between the seat and the station's
       end would otherwise be spent on a pinned pile with nothing moving. */
    const seat = () => {
      if (!mq.matches) return;
      const slots = services.querySelectorAll<HTMLElement>(".pf-slot");
      const last = slots[slots.length - 1];
      services.style.marginBottom = "";
      if (!last) {
        services.style.top = `${Math.min(0, window.innerHeight - services.offsetHeight)}px`;
        return;
      }
      const stickTop = parseFloat(getComputedStyle(last).top) || 0;
      const prev = last.style.position;
      last.style.position = "relative";
      const slotFromTop = last.getBoundingClientRect().top - services.getBoundingClientRect().top;
      last.style.position = prev;
      const pinTop = Math.min(0, stickTop - slotFromTop);
      services.style.top = `${pinTop}px`;
      const gap = workshop.getBoundingClientRect().top - services.getBoundingClientRect().top;
      const mb0 = parseFloat(getComputedStyle(services).marginBottom) || 0;
      services.style.marginBottom = `${mb0 + (window.innerHeight - pinTop - gap)}px`;
    };
    const cover = () => {
      raf = 0;
      if (!mq.matches) return;
      const covered = workshop.getBoundingClientRect().top <= 0;
      services.style.visibility = covered ? "hidden" : "";
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(cover);
    };
    const arm = () => {
      if (mq.matches) {
        services.style.position = "sticky";
        workshop.style.zIndex = "7";
        seat();
        cover();
      } else {
        services.style.position = "";
        workshop.style.zIndex = "";
        services.style.top = "";
        services.style.marginBottom = "";
        services.style.visibility = "";
      }
    };

    arm();
    const ro = new ResizeObserver(seat);
    ro.observe(services);
    window.addEventListener("resize", seat);
    window.addEventListener("scroll", onScroll, { passive: true });
    mq.addEventListener("change", arm);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", seat);
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", arm);
      if (raf) cancelAnimationFrame(raf);
      services.style.position = "";
      workshop.style.zIndex = "";
      services.style.top = "";
      services.style.marginBottom = "";
      services.style.visibility = "";
    };
  }, []);
}
