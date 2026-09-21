import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CHARACTER_ERA_MEDIA_MAX } from "@/lib/voidwalker/characterEras";

/**
 * `voidwalker-datum.css` — the laws of ADR-082 U31 that a STILL cannot hold.
 *
 * Every rule pinned here fails SILENTLY when broken: a ring left open paints a
 * bow-tie only across a concave outline; an ungated size container computes two
 * other breakpoints' bodies to zero; an id on the blur rule means light mode can
 * never switch the frost off; a fifth tab runs off the card it belongs to. None
 * of them errors, and three of the four look right at the viewport they were
 * authored at.
 */
const ROOT = join(__dirname, "..", "..");
const SHEET = "components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css";
const raw = readFileSync(join(ROOT, SHEET), "utf8");
/** The sheet states each law in prose that quotes the banned form. */
const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");

/** The body of the first rule whose selector list is EXACTLY `selector`, at any
 *  nesting depth (a media block's inner rules included). */
const ruleBody = (source: string, selector: string): string => {
  const at = source.indexOf(`${selector} {`);
  if (at < 0) throw new Error(`no rule for: ${selector}`);
  const open = source.indexOf("{", at);
  return source.slice(open + 1, source.indexOf("}", open));
};

/** The top-level `@media` blocks, as `[condition, body]`. */
const mediaBlocks = (source: string): Array<[string, string]> => {
  const out: Array<[string, string]> = [];
  const re = /@media\s*([^{]+)\{/g;
  for (let m = re.exec(source); m; m = re.exec(source)) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < source.length && depth > 0) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") depth -= 1;
      i += 1;
    }
    out.push([m[1]!.trim(), source.slice(re.lastIndex, i - 1)]);
    re.lastIndex = i;
  }
  return out;
};

/** A polygon's points, with `calc()` commas left alone. */
const polygonPoints = (body: string): string[] => {
  const at = body.indexOf("polygon(");
  if (at < 0) throw new Error("no polygon");
  let depth = 0;
  let i = at + "polygon".length;
  const start = i + 1;
  for (; i < body.length; i++) {
    if (body[i] === "(") depth += 1;
    else if (body[i] === ")") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  const inner = body.slice(start, i);
  const points: string[] = [];
  let buf = "";
  let d = 0;
  for (const ch of inner) {
    if (ch === "(") d += 1;
    if (ch === ")") d -= 1;
    if (ch === "," && d === 0) {
      points.push(buf);
      buf = "";
    } else buf += ch;
  }
  points.push(buf);
  return points.map((p) => p.replace(/\s+/g, " ").trim());
};

describe("the media card's silhouette and its lip (ADR-082 U31)", () => {
  const silhouette = polygonPoints(ruleBody(css, ".vwd__mcard"));
  const ring = polygonPoints(ruleBody(css, ".vwd__mcard::before"));

  it("is one eight-point folder: tab, 45° slant, square body", () => {
    expect(silhouette).toHaveLength(8);
    // The slant: a horizontal run of the tab's own height — 45° by construction.
    expect(silhouette[3]).toBe("calc(var(--_x1) - var(--_t)) 0");
    expect(silhouette[4]).toBe("var(--_x1) var(--_t)");
  });

  it("draws the lip as a CLOSED evenodd ring — both contours return to their start", () => {
    expect(ring[0]).toBe("evenodd");
    const pts = ring.slice(1);
    // 8 outer + close, 8 inner + close.
    expect(pts).toHaveLength(18);
    const outer = pts.slice(0, 9);
    const inner = pts.slice(9);
    // ⚠ The open form (`.pf-card`'s) paints a bow-tie across a concave outline
    // (ADR-118), and this outline has two concave corners.
    expect(outer[8], "the outer contour is not closed").toBe(outer[0]);
    expect(inner[8], "the inner contour is not closed").toBe(inner[0]);
    // The ring's outer contour IS the card's silhouette, point for point.
    expect(outer.slice(0, 8)).toEqual(silhouette);
  });

  it("shifts the slant's inner ends by 0.414px, the 45°-meets-horizontal join", () => {
    const inner = ring.slice(10);
    // 1 − √2. (0.586 is the chamfer BETWEEN two axis edges, which this is not.)
    expect(inner[3]).toBe("calc(var(--_x1) - var(--_t) - 0.414px) 1px");
    expect(inner[4]).toBe("calc(var(--_x1) - 0.414px) calc(var(--_t) + 1px)");
    expect(ring.join(" ")).not.toContain("0.586");
  });

  it("paints no `border` on the card — a clip cuts a border, it never strokes one", () => {
    expect(ruleBody(css, ".vwd__mcard")).not.toMatch(/(^|[;\s])border(-[a-z]+)?\s*:/);
  });

  it("orders the tabs by DEPTH and solves their widths from the type", () => {
    const card = ruleBody(css, ".vwd__mcard");
    expect(card).toContain("--_back: min(var(--vwd-md, 0), 1)");
    expect(card).toContain("max(var(--vwd-md, 0) - 1, 0)");
    const stack = ruleBody(css, ".vwd__mstack");
    // PT Mono's 0.6em advance + `--track-label`'s .08em.
    expect(stack).toContain("--_adv: calc(var(--vwd-mtab-fs) * 0.68)");
    expect(stack).toContain("var(--vwd-mtab-fch, 7)");
  });

  it("four tabs fit a card at the narrowest capable rung, and a fifth would not", () => {
    // The sheet's own arithmetic at 1101×800, restated: fs 9.6 (1.2svh), tab
    // height 22 (the clamp's floor), step 4.8 (0.6svh), a ~297px seat.
    const fs = 9.6;
    const t = 22;
    const step = 4.8;
    const seat = 297;
    const adv = fs * 0.68;
    const wf = adv * 7 + 31 + t; // `IMAGE NN`
    const wb = adv * 2 + 14 + t;
    const fits = (n: number) => wf + (n - 1) * (wb + 2) <= seat - (n - 1) * step;
    expect(fits(CHARACTER_ERA_MEDIA_MAX)).toBe(true);
    // ⚠ This is what the record's cap IS. Raising it is a redesign of the row.
    expect(fits(CHARACTER_ERA_MEDIA_MAX + 2)).toBe(false);
  });
});

describe("the pile fits its seat by construction (ADR-082 U31)", () => {
  it("makes the seat a size container ONLY at >=1101px", () => {
    // Size containment makes a box's height independent of its content. The
    // desktop seat is a `1fr` row and never asked; at <=1100px the bodies are
    // content-height flow, where the same declaration computes them to ZERO.
    const holders = mediaBlocks(css).filter(([, body]) => body.includes("container-type"));
    expect(holders.map(([cond]) => cond)).toEqual(["(min-width: 1101px)"]);
    const outside = mediaBlocks(css).reduce((s, [, body]) => s.replace(body, ""), css);
    expect(outside).not.toContain("container-type");
  });

  it("gives the frame an explicit minimum, or it cannot shrink at all", () => {
    // A flex item with an aspect-ratio has an AUTOMATIC minimum of its
    // transferred size; only an explicit one lets the frame pay for the card.
    const frame = ruleBody(css, ".vwd__mcard__frame");
    expect(frame).toMatch(/min-height:\s*72px/);
    expect(frame).toMatch(/flex:\s*0 1 auto/);
    expect(frame).toMatch(/width:\s*100%/);
  });

  it("never clamps the title — it wraps, and the frame gives", () => {
    const title = ruleBody(css, ".vwd__mcard__title");
    expect(title).not.toMatch(/line-clamp|text-overflow|white-space:\s*nowrap/);
    expect(title).toMatch(/flex:\s*0 0 auto/);
  });
});

describe("the glass (ADR-082 U31)", () => {
  it("frosts the FRONT card only, behind @supports, with no id in the selector", () => {
    // The DECLARATION, not the `@supports (backdrop-filter: blur(2px))` test.
    const at = css.indexOf("backdrop-filter: blur(calc(");
    expect(at).toBeGreaterThan(0);
    // The innermost rule: from the brace that opens it back to whatever closed
    // or opened the thing before it (here, the `@supports` block's own brace).
    const open = css.lastIndexOf("{", at);
    const before = Math.max(css.lastIndexOf("{", open - 1), css.lastIndexOf("}", open - 1));
    const selector = css.slice(before + 1, open).trim();
    expect(selector).toBe('.vwd__mcard[data-vwd-media-depth="0"]');
    expect(css.slice(css.lastIndexOf("@", open), open)).toContain("@supports (backdrop-filter");
    // One frosted card, not a pile of them: a blur is a per-frame snapshot.
    expect(css.match(/backdrop-filter:\s*blur\(calc\(/g)).toHaveLength(2); // + the -webkit- twin
    // ⚠ theme.css switches the frost off in light, and an id here cannot be
    // beaten from there.
    expect(selector).not.toContain("#");
  });

  it("waits for the seat's entry ladder before it samples a backdrop", () => {
    // An ancestor at opacity < 1 is the backdrop root; `--ci` is that ladder's
    // own clock and its opacity reaches 1 at ~0.59.
    expect(css).toContain("--_rest: clamp(0, calc((var(--ci, 1) - 0.6) * 5), 1)");
  });

  it("re-derives itself for light in theme.css", () => {
    const theme = readFileSync(join(ROOT, "components/landing/v7/theme.css"), "utf8").replace(
      /\/\*[\s\S]*?\*\//g,
      ""
    );
    const light = ruleBody(theme, 'html[data-theme="light"] .vwd__mstack');
    expect(light).toContain("--vwd-mbloom-a");
    expect(light).toContain("--vwd-mglass-a");
    expect(theme).toContain('html[data-theme="light"] .vwd__mcard[data-vwd-media-depth="0"]');
  });
});

describe("ON RECORD is tagged rows, not boxes (ADR-082 U31)", () => {
  it("rules a record at its FOOT and draws nothing round it", () => {
    const row = ruleBody(css, ".vwd__press");
    expect(row).toMatch(/border-bottom:\s*1px solid/);
    // U29's bounded object is what the owner read as "PowerPoint frames".
    expect(row).not.toMatch(/(^|[;\s])border:\s/);
    expect(css).not.toContain(".vwd__press__well");
    expect(css).not.toContain("--vwd-press-well");
    expect(css).not.toContain(".vwd__press__glyph");
  });

  it("keeps the link-out mark on the pixel lattice", () => {
    // 7 cells: anything but an integer multiple goes soft.
    const px = Number(/--vwd-press-mark:\s*(\d+)px/.exec(css)?.[1]);
    expect(px % 7).toBe(0);
    expect(ruleBody(css, ".vwd__press__arrow")).toContain("shape-rendering: crispEdges");
  });

  it("lifts lines and ink on hover — never a fill, and only on an anchor", () => {
    const hover = css
      .split("}")
      .filter((r) => /\.vwd__press[^{]*:(hover|focus-visible)/.test(r.split("{")[0] ?? ""));
    expect(hover.length).toBeGreaterThan(0);
    for (const rule of hover) {
      const [selector = "", body = ""] = rule.split("{");
      for (const part of selector.split(","))
        expect(part.trim().startsWith("a.vwd__press")).toBe(true);
      expect(body).not.toMatch(/background/);
    }
  });
});

describe("what ADR-082 U31 retired stays retired", () => {
  it("has no bare film frame left in the sheet", () => {
    expect(css).not.toContain(".vwd__film");
  });
});
