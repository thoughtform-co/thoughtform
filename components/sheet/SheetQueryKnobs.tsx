"use client";

import { useEffect, useRef } from "react";

import { knobAttrs, parseSheetQuery } from "@/lib/sheet/directions";

/**
 * SheetQueryKnobs — `?k=<ID>` (or explicit knob params) onto `.sh-root`
 * (ADR-114). Renders nothing visible; runs once after mount.
 *
 * ⚠ THE ROOT IS FOUND FROM THIS ELEMENT UP, never by a document query, so
 * a client-side entry cannot reach another page's root. A bare URL leaves
 * the server's house values exactly as rendered (the parser returns the
 * defaults), so the no-JS page and the JS page agree.
 */
export function SheetQueryKnobs() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>(".sh-root");
    if (!root) return;
    const { knobs, k } = parseSheetQuery(new URLSearchParams(window.location.search));
    for (const [attr, value] of Object.entries(knobAttrs(knobs))) root.setAttribute(attr, value);
    if (k) root.setAttribute("data-sh-k", k);
    else root.removeAttribute("data-sh-k");
  }, []);
  return <span ref={ref} hidden data-sh-knobs="" />;
}
