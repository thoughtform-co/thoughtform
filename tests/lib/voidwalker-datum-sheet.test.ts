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

  it("is one six-point folder: the tab flush at its top-left, a 45° slant, a square body", () => {
    expect(silhouette).toHaveLength(6);
    // ADR-082 U34: the tab sits at the card's own corner on EVERY card.
    expect(silhouette[0]).toBe("0 0");
    // The slant: a horizontal run of the tab's own height — 45° by construction.
    expect(silhouette[1]).toBe("calc(var(--_wt) - var(--_t)) 0");
    expect(silhouette[2]).toBe("var(--_wt) var(--_t)");
  });

  it("draws the lip as a CLOSED evenodd ring — both contours return to their start", () => {
    expect(ring[0]).toBe("evenodd");
    const pts = ring.slice(1);
    // 6 outer + close, 6 inner + close.
    expect(pts).toHaveLength(14);
    const outer = pts.slice(0, 7);
    const inner = pts.slice(7);
    // ⚠ The open form (`.pf-card`'s) paints a bow-tie across a concave outline
    // (ADR-118), and this outline has a concave corner.
    expect(outer[6], "the outer contour is not closed").toBe(outer[0]);
    expect(inner[6], "the inner contour is not closed").toBe(inner[0]);
    // The ring's outer contour IS the card's silhouette, point for point.
    expect(outer.slice(0, 6)).toEqual(silhouette);
  });

  it("shifts the slant's inner ends by 0.414px, the 45°-meets-horizontal join", () => {
    const inner = ring.slice(8);
    // 1 − √2. (0.586 is the chamfer BETWEEN two axis edges, which this is not.)
    expect(inner[1]).toBe("calc(var(--_wt) - var(--_t) - 0.414px) 1px");
    expect(inner[2]).toBe("calc(var(--_wt) - 0.414px) calc(var(--_t) + 1px)");
    expect(ring.join(" ")).not.toContain("0.586");
  });

  it("paints no `border` on the card — a clip cuts a border, it never strokes one", () => {
    expect(ruleBody(css, ".vwd__mcard")).not.toMatch(/(^|[;\s])border(-[a-z]+)?\s*:/);
  });

  it("gives every card ONE tab width, solved from the type (ADR-082 U34)", () => {
    const stack = ruleBody(css, ".vwd__mstack");
    // PT Mono's 0.6em advance + `--track-label`'s .08em, for `IMAGE NN`.
    expect(stack).toContain("--_adv: calc(var(--vwd-mtab-fs) * 0.68)");
    expect(stack).toContain("--_wt: calc(var(--_adv) * 7 + 31px + var(--vwd-mtab-h))");
    // ⚠ Nothing in the card may vary the tab by depth: the depth is the pile's.
    const card = ruleBody(css, ".vwd__mcard");
    expect(card).not.toMatch(/--_x0|--_back|--_wf|--_wb/);
    expect(ruleBody(css, ".vwd__mcard__tab")).toContain("width: var(--_wt)");
  });

  it("stacks each card behind one TAB HEIGHT up and a step left, and reserves it", () => {
    const stack = ruleBody(css, ".vwd__mstack");
    // ⚠ Less than a tab height slides the next card's tab row over this tab.
    expect(stack).toContain("--vwd-mstack-dy: var(--vwd-mtab-h)");
    const card = ruleBody(css, ".vwd__mcard");
    expect(card).toContain("calc(var(--vwd-md, 0) * -1 * var(--vwd-mstack-dx))");
    expect(card).toContain("calc(var(--vwd-md, 0) * -1 * var(--vwd-mstack-dy))");
    // The room the cards behind stand in is the pile's own padding, top and left.
    expect(stack).toMatch(/padding:\s*calc\(var\(--_steps\) \* var\(--vwd-mstack-dy\)\) 0 0/);
  });

  it("three cards fit the binding seat and a fourth breaks the frame's floor", () => {
    // 1280×720, measured (capture-era-media): a 194.7px seat, a card of
    // 22 (tab) + 7.2 (pad) + 27 (a two-line title) + 7.2 (gap) + 7.2 (pad)
    // around a frame whose cap is 108px and whose floor is 72px.
    const seat = 194.7;
    const t = 22;
    const chrome = t + 7.2 + 27 + 7.2 + 7.2;
    const frame = (n: number) => Math.min(108, seat - (n - 1) * t - chrome);
    expect(frame(CHARACTER_ERA_MEDIA_MAX)).toBeGreaterThanOrEqual(72);
    // ⚠ This is what the record's cap IS. Raising it is a redesign of the pile.
    expect(frame(CHARACTER_ERA_MEDIA_MAX + 1)).toBeLessThan(72);
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

describe("the owner's second read (ADR-082 U32)", () => {
  it("sets the card title in capitals, and capitals are the mono's job", () => {
    // Uppercase on the sans is a type-material finding (ADR-092); every other
    // capitalised line on this station is PT Mono.
    const title = ruleBody(css, ".vwd__mcard__title");
    expect(title).toMatch(/font-family:\s*var\(--vwd-mono\)/);
    expect(title).toMatch(/text-transform:\s*uppercase/);
    expect(title).toMatch(/letter-spacing:\s*var\(--track-label\)/);
  });

  it("gives the lede the paragraph's own size and ink — never a gold sentence", () => {
    // U29 said "the body's size" and shipped a height clamp of its own, which
    // put an 18px paragraph under a 14.5px lede at the owner's window.
    const motto = ruleBody(css, ".vwd__motto");
    const prose = ruleBody(css, ".vwd__prose");
    const sizeOf = (body: string) => body.match(/font-size:\s*([^;]+);/)?.[1]?.trim();
    expect(sizeOf(motto)).toBe(sizeOf(prose));
    expect(motto).not.toMatch(/gold/);
    expect(motto).toMatch(/color:\s*rgb\(var\(--vwd-dawn-rgb\)\)/);
    expect(motto).toMatch(/font-weight:\s*var\(--weight-lit\)/);
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

describe("ON RECORD is cards (ADR-082 U35)", () => {
  it("outlines a card on all four sides and never gives it a ground", () => {
    const card = ruleBody(css, ".vwd__pcard");
    expect(card).toMatch(/(^|[;\s])border:\s*1px solid/);
    // An outline is not a ground: the >700px paint sweep, and the station's law.
    expect(card).not.toMatch(/background/);
    expect(ruleBody(css, ".vwd__pcard__thumb")).not.toMatch(/background/);
    // Square — chrome sits at 0 on ADR-065's depth ladder.
    expect(card).not.toMatch(/border-radius|clip-path/);
    // The air between cards is the divider, never a rule.
    expect(ruleBody(css, ".vwd__press-stack")).toMatch(/(^|[;\s])gap:/);
    expect(card).not.toMatch(/border-bottom/);
  });

  it("keeps U29's and U31's retired parts retired", () => {
    // U29's document mark in a well, and U31's tagged row, by their own names.
    expect(css).not.toContain(".vwd__press__well");
    expect(css).not.toContain("--vwd-press-well");
    expect(css).not.toContain(".vwd__press__glyph");
    expect(css).not.toContain(".vwd__press__tag");
    expect(css).not.toContain(".vwd__press__meta");
    expect(css).not.toContain(".vwd__press__headline");
  });

  it("seats every mark on the pixel lattice", () => {
    // 7 cells: anything but an integer multiple goes soft.
    for (const token of ["--vwd-press-mark", "--vwd-fact-mark", "--vwd-pcard-mark"]) {
      const px = Number(new RegExp(`${token}:\\s*(\\d+)px`).exec(css)?.[1]);
      expect(px, token).toBeGreaterThan(0);
      expect(px % 7, token).toBe(0);
    }
    for (const selector of [".vwd__press__arrow", ".vwd__pcard__mark", ".vwd__facts__mark"])
      expect(ruleBody(css, selector), selector).toContain("shape-rendering: crispEdges");
  });

  it("pads the thumbnail's mark into place rather than centring it", () => {
    // A 21px mark centred in an even box lands on a half pixel.
    const thumb = ruleBody(css, ".vwd__pcard__thumb");
    expect(thumb).toMatch(/box-sizing:\s*content-box/);
    expect(thumb).toMatch(/padding:\s*var\(--vwd-pcard-pad\)/);
    expect(thumb).not.toMatch(/place-items|justify-content|align-items/);
    expect(Number.isInteger(Number(/--vwd-pcard-pad:\s*(\d+)px/.exec(css)?.[1]))).toBe(true);
  });

  it("lifts lines and ink on hover — never a fill, and only on an anchor", () => {
    const hover = css
      .split("}")
      .filter((r) => /\.vwd__pcard[^{]*:(hover|focus-visible)/.test(r.split("{")[0] ?? ""));
    expect(hover.length).toBeGreaterThan(0);
    for (const rule of hover) {
      const [selector = "", body = ""] = rule.split("{");
      for (const part of selector.split(","))
        expect(part.trim().startsWith("a.vwd__pcard")).toBe(true);
      expect(body).not.toMatch(/background/);
    }
  });
});

describe("FACTS is one grid of four (ADR-082 U35)", () => {
  it("lays the facts out two cells a row, each ending on its own rule", () => {
    expect(ruleBody(css, ".vwd__facts")).toMatch(
      /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
    );
    expect(ruleBody(css, ".vwd__facts__cell")).toMatch(/border-bottom:\s*1px solid/);
    // U23's readout row is gone with its per-era keys.
    expect(css).not.toContain(".vwd__facts__row");
  });

  it("draws the marks in dawn alone — gold on this station is the band's 'you are here'", () => {
    for (const layer of ["sk", "sig", "dr"]) {
      const body = ruleBody(css, `.vwd__mk__${layer}`);
      expect(body).toMatch(/--vwd-dawn-rgb/);
      expect(body).not.toMatch(/gold/);
    }
  });
});

describe("what ADR-082 U31 retired stays retired", () => {
  it("has no bare film frame left in the sheet", () => {
    expect(css).not.toContain(".vwd__film");
  });
});
