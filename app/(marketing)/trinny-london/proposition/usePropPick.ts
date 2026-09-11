import { useEffect } from "react";

/**
 * usePropPick — the proposal instrument's picker (ADR-094 U7).
 *
 * `#proposition`'s drawing is static HTML in the forked prototype: the
 * layer's four rows, the three team tiles and the configuration readout
 * are all parsed at build time, and the RECORD lives on the tiles as
 * `data-*` (`data-layers`, `data-owner`, `data-runs`, `data-bar`,
 * `data-reach`, `data-where`) so the parse guard walks every string the
 * page can letter. This hook is the one piece of behaviour: pick a team,
 * the readout takes its five answers and the layer lights only the rows
 * that team reads. The resting state is authored in the markup (Studio,
 * every row lit), so the drawing reads whole without JS and under
 * reduced motion; the hook adds the pick and nothing else.
 *
 * One delegated listener on `[data-tl-config]`, never one per tile — the
 * body is `dangerouslySetInnerHTML` and a re-render there would orphan
 * per-node listeners the same way it orphans nested roots. Arrow keys walk
 * the tablist because the tiles are `role="tab"`; Enter and Space are the
 * button's own.
 */
const KEYS = ["owner", "runs", "bar", "reach", "where"] as const;

export function usePropPick() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".tl-root [data-tl-config]");
    if (!root) return;

    const tiles = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-tl-pick]"));
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-tl-layer]"));
    const out = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLElement>("[data-tl-cfg]").forEach((el) => {
      const k = el.getAttribute("data-tl-cfg");
      if (k) out.set(k, el);
    });
    if (tiles.length === 0) return;

    const pick = (tile: HTMLButtonElement) => {
      for (const t of tiles) {
        const on = t === tile;
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      }
      const lit = new Set((tile.getAttribute("data-layers") ?? "").split(/\s+/).filter(Boolean));
      for (const r of rows)
        r.classList.toggle("is-on", lit.has(r.getAttribute("data-tl-layer") ?? ""));
      const name = tile.querySelector(".tl-config__tname")?.textContent ?? "";
      const nameEl = out.get("name");
      if (nameEl) nameEl.textContent = name;
      for (const k of KEYS) {
        const el = out.get(k);
        if (el) el.textContent = tile.getAttribute(`data-${k}`) ?? "";
      }
    };

    const onClick = (e: MouseEvent) => {
      const tile = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>("[data-tl-pick]");
      if (tile && root.contains(tile)) pick(tile);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const tile = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>("[data-tl-pick]");
      if (!tile) return;
      const i = tiles.indexOf(tile);
      const next = tiles[(i + (e.key === "ArrowRight" ? 1 : tiles.length - 1)) % tiles.length];
      if (!next) return;
      e.preventDefault();
      next.focus();
      pick(next);
    };

    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
    };
  }, []);
}
