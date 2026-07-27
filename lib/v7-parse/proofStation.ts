/**
 * `#proof` station generator (ADR-054).
 *
 * Turns a `CaseDef` into the station's inner markup, injected into the
 * authored `[data-proof-body]` shell at parse time. Generating rather
 * than authoring keeps `lib/cases` the single source of truth for case
 * copy while still shipping server-rendered, indexable HTML that
 * `useRevealMotion` can observe on first paint (a nested React root
 * could do neither).
 *
 * CONTRACT with `parseBody`:
 *   · the output carries NO HTML comments — the ship-weight trim runs
 *     after this and would eat anything comment-shaped;
 *   · every interpolated field goes through `esc()`;
 *   · reveal roles are authored here as `data-m` / `data-m-group`, the
 *     same vocabulary `#contact` uses.
 *
 * The four production tools resolve from `PROJECT_CASES` — a pure data
 * module, imported here (server-only) so the tool strip can never drift
 * from the corridor's arc-cases card.
 */

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import type { CaseBeat, CaseDef, CaseSegment, CaseTitle, CaseVisual } from "@/lib/cases/types";

/** Escape text for an HTML text node or a double-quoted attribute. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Deterministic survey coordinate — the M2 plate stamp. FNV-1a over the
 * seed so the value is stable across renders (a random stamp would
 * hydrate-mismatch and churn the served HTML on every build).
 * Mirrors `coordStamp` in `components/arcs/chrome.tsx`; duplicated
 * rather than imported to keep the parse pipeline free of component
 * imports.
 */
function coordStamp(seed: string, salt: number): string {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const a = (h >>> 12) % 4096;
  const b = h % 4096;
  return `${String(a).padStart(4, "0")} / ${String(b).padStart(4, "0")}`;
}

/** Split title → markup. `em` is UPRIGHT GOLD, never italics. */
function title(t: CaseTitle): string {
  const parts: string[] = [];
  if (t.pre) parts.push(esc(t.pre));
  if (t.em) parts.push(`<em>${esc(t.em)}</em>`);
  if (t.post) parts.push(esc(t.post));
  return parts.join(" ");
}

/** Segment run → markup. `em` is the gold-wash caption marker. */
function segments(runs: readonly CaseSegment[]): string {
  return runs
    .map((run) => (typeof run === "string" ? esc(run) : `<em>${esc(run.em)}</em>`))
    .join("");
}

/** The M2 survey-plate chrome shared by the report's two plates. */
function plate(desig: string, seed: string, salt: number, mark: "origin" | "close"): string {
  return (
    `<span class="proof__grid" aria-hidden="true"></span>` +
    `<span class="proof__mark proof__mark--${mark}" aria-hidden="true"></span>` +
    `<span class="proof__desig">${esc(desig)}</span>` +
    `<span class="proof__coord">${esc(coordStamp(seed, salt))}</span>`
  );
}

function reportHtml(def: CaseDef): string {
  const { report } = def;
  const stats = report.stats
    .map(
      (stat) =>
        `<li class="proof__stat" data-m="frame">` +
        `<span class="proof__stat-value">${esc(stat.value)}</span>` +
        `<span class="proof__stat-label">${esc(stat.label)}</span>` +
        (stat.detail ? `<span class="proof__stat-detail">${esc(stat.detail)}</span>` : "") +
        `</li>`
    )
    .join("");
  const meta = report.meta
    .map(
      (row) =>
        `<div class="proof__meta-row">` +
        `<dt class="proof__meta-k">${esc(row.label)}</dt>` +
        `<dd class="proof__meta-v">${esc(row.value)}</dd>` +
        `</div>`
    )
    .join("");

  return (
    `<header class="proof__report" data-m-group>` +
    `<div class="proof__plate proof__plate--title" data-m="title">` +
    plate("PRF / REPORT · 01", def.slug, 1, "origin") +
    `<h2 class="proof__title">${title(report.title)}</h2>` +
    `</div>` +
    `<div class="proof__plate proof__plate--brief" data-m="body">` +
    plate("PRF / BRIEF · 02", def.slug, 2, "close") +
    `<span class="proof__state">Live</span>` +
    `<p class="proof__lede">${esc(report.lede)}</p>` +
    `</div>` +
    `<ul class="proof__stats" data-m-group>${stats}</ul>` +
    `<dl class="proof__meta" data-m="eyebrow">${meta}</dl>` +
    `</header>`
  );
}

function visualHtml(visual: CaseVisual, beat: CaseBeat): string {
  switch (visual.kind) {
    case "log": {
      const rows = visual.rows
        .map(
          (row) =>
            `<div class="proof__log-row">` +
            `<span class="proof__log-t">${esc(row.t)}</span>` +
            `<span class="proof__log-rule" aria-hidden="true"></span>` +
            `<span class="proof__log-event">${esc(row.event)}</span>` +
            `</div>`
        )
        .join("");
      return (
        `<figure class="proof__plate proof__visual proof__visual--log" data-m="instrument">` +
        `<span class="proof__grid" aria-hidden="true"></span>` +
        `<figcaption class="proof__visual-title">${esc(visual.title)}</figcaption>` +
        `<div class="proof__log">${rows}</div>` +
        (visual.tail ? `<p class="proof__visual-foot">${esc(visual.tail)}</p>` : "") +
        `</figure>`
      );
    }
    case "registry": {
      const groups = visual.groups
        .map(
          (group) =>
            `<div class="proof__reg-group">` +
            `<dt class="proof__reg-name">${esc(group.name)}</dt>` +
            `<dd class="proof__reg-gloss">${esc(group.gloss)}</dd>` +
            `</div>`
        )
        .join("");
      const rows = visual.rows
        .map(
          (row) =>
            `<div class="proof__reg-row">` +
            `<span class="proof__reg-team">${esc(row.team)}</span>` +
            `<span class="proof__reg-skill">${esc(row.name)}</span>` +
            (row.tag ? `<span class="proof__reg-tag">${esc(row.tag)}</span>` : "") +
            `</div>`
        )
        .join("");
      return (
        `<figure class="proof__plate proof__visual proof__visual--registry" data-m="instrument">` +
        `<span class="proof__grid" aria-hidden="true"></span>` +
        `<figcaption class="proof__visual-title">${esc(visual.title)}</figcaption>` +
        `<dl class="proof__reg-groups">${groups}</dl>` +
        `<div class="proof__reg-rows">${rows}</div>` +
        (visual.footer ? `<p class="proof__visual-foot">${esc(visual.footer)}</p>` : "") +
        `</figure>`
      );
    }
    case "tool-strip": {
      const rows = visual.toolIds
        .map((id) => {
          const tool = PROJECT_CASES.find((p) => p.id === id);
          if (!tool) return "";
          return (
            `<li class="proof__tool">` +
            `<img class="proof__tool-shot" src="${esc(tool.image.src)}" alt="${esc(tool.image.alt)}" width="${tool.image.width}" height="${tool.image.height}" loading="lazy" decoding="async" />` +
            `<span class="proof__tool-name">${esc(tool.codename)}</span>` +
            `<span class="proof__tool-tag">${esc(tool.tagline)}</span>` +
            (tool.metric
              ? `<span class="proof__tool-metric">${esc(tool.metric.value)} <span class="proof__tool-metric-label">${esc(tool.metric.label)}</span></span>`
              : "") +
            `</li>`
          );
        })
        .join("");
      return `<ul class="proof__visual proof__visual--tools" data-m="frame">${rows}</ul>`;
    }
    case "video":
      return (
        `<figure class="proof__visual proof__visual--media" data-m="frame">` +
        `<video class="proof__video" src="${esc(visual.src)}" poster="${esc(visual.poster)}" preload="none" controls playsinline></video>` +
        (visual.caption ? `<figcaption>${esc(visual.caption)}</figcaption>` : "") +
        `</figure>`
      );
    case "image":
      return (
        `<figure class="proof__visual proof__visual--media" data-m="frame">` +
        `<img class="proof__image" src="${esc(visual.image.src)}" alt="${esc(visual.image.alt)}"${visual.image.width ? ` width="${visual.image.width}"` : ""}${visual.image.height ? ` height="${visual.image.height}"` : ""} loading="lazy" decoding="async" />` +
        (visual.caption ? `<figcaption>${esc(visual.caption)}</figcaption>` : "") +
        `</figure>`
      );
    default: {
      // Exhaustiveness: a new CaseVisual kind must add a branch above.
      const never: never = visual;
      void never;
      void beat;
      return "";
    }
  }
}

function beatHtml(beat: CaseBeat, index: number): string {
  const desig = `PRF / ${beat.phase.toUpperCase()} · ${String(index + 1).padStart(2, "0")}`;
  const body = beat.body.map((p) => `<p class="proof__body">${esc(p)}</p>`).join("");
  const receipts = beat.receipts?.length
    ? `<ul class="proof__receipts" data-m="fade">` +
      beat.receipts.map((r) => `<li class="proof__receipt">${esc(r)}</li>`).join("") +
      `</ul>`
    : "";
  const quote = beat.quote
    ? `<blockquote class="proof__quote" data-m="fade">` +
      `<p>${esc(beat.quote.text)}</p>` +
      `<cite>${esc(beat.quote.attribution)}</cite>` +
      `</blockquote>`
    : "";
  const closer = beat.closer?.length
    ? `<p class="proof__closer" data-m="fade">${segments(beat.closer)}</p>`
    : "";

  // Zig-zag: even beats read text-left, odd beats mirror. DOM order is
  // always text-then-visual (so tab + mobile order never change); the
  // flip is a CSS column swap only.
  const flip = index % 2 === 1 ? " proof__beat--flip" : "";

  return (
    `<section class="proof__beat${flip}" id="${esc(beat.id)}" data-proof-beat="${esc(beat.phase)}" data-m-group>` +
    `<div class="proof__beat-copy">` +
    `<p class="proof__eyebrow" data-m="eyebrow">${esc(desig)}</p>` +
    `<h3 class="proof__beat-title" data-m="title">${title(beat.title)}</h3>` +
    `<div class="proof__beat-body" data-m="body">${body}</div>` +
    receipts +
    quote +
    closer +
    `</div>` +
    `<div class="proof__beat-visual">${visualHtml(beat.visual, beat)}</div>` +
    `</section>`
  );
}

/**
 * Build the `#proof` station body. Pure: same `CaseDef` in, same string
 * out — which is what lets `parseBody`'s options-keyed memo hold.
 */
export function buildProofStationHtml(def: CaseDef): string {
  return reportHtml(def) + def.beats.map((beat, i) => beatHtml(beat, i)).join("");
}
