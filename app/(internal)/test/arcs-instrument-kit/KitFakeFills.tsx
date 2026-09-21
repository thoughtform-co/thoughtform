"use client";

import { useEffect } from "react";

/**
 * The kit's FILLS fake (ADR-118): a second engagement row filled beside the
 * chosen one — what the rubric's L2 fails. It is a DOM edit after mount on
 * purpose: the log's data can only ever name one selection, so the fake has
 * to be drawn outside it, and it is drawn nowhere but here.
 */
export function KitFakeFills() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      const rows = [...document.querySelectorAll<HTMLElement>(".sh-log__row")];
      const other = rows.find((r) => !r.classList.contains("is-on"));
      other?.classList.add("is-on");
    }, 0);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
