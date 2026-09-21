"use client";

import { useEffect, useRef } from "react";

/** The dossier's swap: one centre-out aperture, the length of a glance. */
export const SHEET_SWAP_MS = 180;

/** A deep link names an engagement as `#arc=<id>`. */
const HASH = /^#arc=([a-z0-9-]+)$/;

/**
 * SheetInstrumentController — the ONE client file of the arcs instrument
 * (ADR-118).
 *
 * It renders nothing but a marker and moves ATTRIBUTES the server already
 * wrote: which row is filled and `aria-current`, which mark is lit, which
 * dossier is shown. Selection is DELEGATED from the page's root, so there is
 * one listener however many rows there are.
 *
 *  - a plain click on a row or a mark SELECTS; a modified click (new tab, a
 *    download) keeps the link's own behaviour, and so does a click the
 *    keyboard produced (`detail === 0`): ENTER on a focused row OPENS it;
 *  - ↑ / ↓ on a row walk every row, ACROSS the kind sections (U2), and bring
 *    the next one into view — the list may run past the screen now;
 *  - a mark's click also seats the log and focuses its row;
 *  - `#arc=<id>` on arrival selects and seats.
 *
 * ⚠ IT IMPORTS NO REGISTRY, AND MAY NOT. A client component that imported
 * `lib/arcs` would put every client's name and lede into a PUBLIC chunk for a
 * page that only its owner may open (ADR-117). Everything it knows, it reads
 * off the DOM — `arcs-import-doctrine` fails the build's source if that
 * changes.
 *
 * ⚠ `data-dos-id` ON THE ROOT IS THE CAPTURE'S OBSERVABLE: it is removed when
 * a swap starts and written only when the incoming dossier has SETTLED — its
 * aperture open — a value the page computed, never one a script can satisfy by
 * itself. Until U2 settled also meant the dossier's picture had decoded; the
 * picture is gone (the configuration is inline SVG, painted with the markup),
 * and with it the wait. ⚠ On arrival the server's choice is written at once —
 * and a deep link that names the choice ALREADY made writes it too: `select()`
 * does nothing for the current id, and until U2 only the picture's promise
 * covered that path.
 */
export function SheetInstrumentController() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = markerRef.current?.closest<HTMLElement>(".sh-root");
    if (!root) return;
    const log = root.querySelector<HTMLElement>(".sh-sec--log");
    const status = root.querySelector<HTMLElement>("[data-sh-log-status]");
    const prm = window.matchMedia("(prefers-reduced-motion: reduce)");

    const rows = () => [...root.querySelectorAll<HTMLAnchorElement>(".sh-log__row")];
    const rowFor = (id: string) =>
      root.querySelector<HTMLAnchorElement>(`.sh-log__row[data-id="${CSS.escape(id)}"]`);

    let current =
      root.querySelector('.sh-log__row[aria-current="true"]')?.getAttribute("data-id") ?? null;
    let lastSwap = 0;
    let settleTimer = 0;
    let disposed = false;

    // Arm the arrival apertures only now that a script is here to open them.
    root.classList.add("is-sh-inst");
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              for (const e of entries)
                if (e.isIntersecting) {
                  e.target.classList.add("is-in");
                  io?.unobserve(e.target);
                }
            },
            { threshold: 0.12 }
          )
        : null;
    for (const el of root.querySelectorAll(".sh-ap-root")) {
      if (io) io.observe(el);
      else el.classList.add("is-in");
    }

    function select(id: string, opts: { focus?: boolean; hash?: boolean } = {}) {
      const row = rowFor(id);
      if (!row) return;
      if (id !== current) {
        for (const r of rows()) {
          const on = r.dataset.id === id;
          r.classList.toggle("is-on", on);
          if (on) r.setAttribute("aria-current", "true");
          else r.removeAttribute("aria-current");
        }
        for (const m of root!.querySelectorAll<HTMLElement>(".sh-mon__mark"))
          m.classList.toggle("is-lit", m.dataset.id === id);

        const now = performance.now();
        // Rapid steps snap: a swap inside the last one's window plays nothing.
        const animate = !prm.matches && now - lastSwap > SHEET_SWAP_MS;
        lastSwap = now;
        let incoming: HTMLElement | null = null;
        for (const d of root!.querySelectorAll<HTMLElement>(".sh-dos")) {
          const on = d.dataset.id === id;
          d.hidden = !on;
          d.classList.remove("is-swap");
          if (on) incoming = d;
        }
        current = id;
        root!.removeAttribute("data-dos-id");
        window.clearTimeout(settleTimer);
        // The timer, not `animationend`: a rapid step cancels the animation it
        // would have waited on, and a cancelled one never ends.
        const settle = () => {
          incoming?.classList.remove("is-swap");
          if (!disposed && current === id) root!.setAttribute("data-dos-id", id);
        };
        if (animate && incoming) {
          void (incoming as HTMLElement).offsetWidth; // restart the keyframes
          (incoming as HTMLElement).classList.add("is-swap");
          settleTimer = window.setTimeout(settle, SHEET_SWAP_MS + 20);
        } else settle();

        // The dossier's own name (its `aria-label`, U2), never the block's
        // alone: three blocks read "The proposal" under three clients.
        const title =
          (incoming as HTMLElement | null)?.getAttribute("aria-label") ??
          `${row.querySelector(".sh-log__name")?.textContent ?? ""} ${
            row.querySelector(".sh-log__eng")?.textContent ?? ""
          }`;
        if (status) status.textContent = `${title.trim()} selected`;
      }
      if (opts.hash !== false) {
        const url = `${location.pathname}${location.search}#arc=${id}`;
        history.replaceState(history.state, "", url);
      }
      if (opts.focus) row.focus({ preventScroll: true });
    }

    function seatLog(behavior: ScrollBehavior) {
      log?.scrollIntoView({ block: "start", behavior });
    }

    /* A row the list pushed below the fold (U2: the list may run past the
       screen) is brought up just far enough to show whole; the dossier is
       sticky, so it stays where the reader was looking. `scroll-margin` on the
       row keeps it clear of the frame's rails. */
    function reveal(row: HTMLElement | null, behavior: ScrollBehavior) {
      row?.scrollIntoView({ block: "nearest", behavior });
    }
    const motion = (): ScrollBehavior => (prm.matches ? "auto" : "smooth");

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // A click the keyboard produced (Enter on a focused link) OPENS.
      if (e.detail === 0) return;
      const target = e.target as Element | null;
      const row = target?.closest<HTMLAnchorElement>(".sh-log__row");
      if (row?.dataset.id) {
        e.preventDefault();
        select(row.dataset.id, { focus: true });
        return;
      }
      const mark = target?.closest<HTMLAnchorElement>(".sh-mon__mark");
      if (mark?.dataset.id) {
        e.preventDefault();
        select(mark.dataset.id);
        const next = rowFor(mark.dataset.id);
        seatLog(motion());
        next?.focus({ preventScroll: true });
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const row = (e.target as Element | null)?.closest<HTMLAnchorElement>(".sh-log__row");
      if (!row) return;
      const list = rows();
      const i = list.indexOf(row);
      const next = list[i + (e.key === "ArrowDown" ? 1 : -1)];
      e.preventDefault();
      if (next?.dataset.id) {
        select(next.dataset.id, { focus: true });
        reveal(next, "auto");
      }
    };

    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKey);

    const deep = HASH.exec(location.hash)?.[1];
    if (deep && rowFor(deep)) {
      if (deep !== current) select(deep, { hash: false });
      else root.setAttribute("data-dos-id", deep);
      seatLog("auto");
      reveal(rowFor(deep), "auto");
    } else if (current) root.setAttribute("data-dos-id", current);

    return () => {
      disposed = true;
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
      io?.disconnect();
      window.clearTimeout(settleTimer);
      root.classList.remove("is-sh-inst");
    };
  }, []);

  return <span ref={markerRef} hidden data-sh-instrument="" />;
}
