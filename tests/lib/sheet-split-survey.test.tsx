/**
 * The musings head is the masthead's (ADR-129) — source ratchets for what a
 * still cannot show.
 *
 * Three asks, and each one has a way to go wrong that no gate would see: the
 * survey chrome is COPIED (so its stamps and inks can drift from the homepage
 * station's), the head is PINNED (so its seat is arithmetic against a header
 * whose type is declared on a selector the sheet cannot read), and the corner
 * prints one word (so the corner's mode rides one optional prop no arc passes).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { kitSections } from "@/app/(internal)/test/subpage-kit/fixtures";
import { coordStamp, surveyDesig } from "@/components/sheet/chrome";
import { SheetSplit } from "@/components/sheet/SheetSplit";
import { CLIENTS, clientPageCount } from "@/lib/arcs/clients";
import { arcsOf } from "@/lib/arcs/registry";
import { MUSINGS_COORDS } from "@/lib/musings/mastheadData";
import type { MusingPost } from "@/lib/musings/types";
import { clientSheetSections } from "@/lib/sheet/arcs";
import { homeSessionsSections } from "@/lib/sheet/home-sessions";
import { MUSINGS_CORNER, musingPostSections, musingsIndexSections } from "@/lib/sheet/musings";
import type { SheetSection } from "@/lib/sheet/types";

import { blocks, stripComments } from "./helpers/cssBlocks";

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const flat = (s: string) => s.replace(/\s+/g, "");

const SHEET = "components/sheet/sheet.css";
const THEME = "components/landing/v7/theme.css";
const LANDING = "components/landing/v7/landing.css";
const BASE = "app/styles/base.css";

const NOW = new Date("2026-09-27T09:00:00Z");

function post(slug: string, over: Partial<MusingPost> = {}): MusingPost {
  return {
    slug,
    title: `A post called ${slug}`,
    date: "2026-09-14",
    summary: "One sentence that says what the post is about.",
    tags: ["practice"],
    author: "Vince Buyssens",
    draft: false,
    featured: false,
    related: [],
    readingMinutes: 2,
    body: "The body.",
    ...over,
  };
}
const POSTS = [post("one", { featured: true }), post("two", { date: "2026-09-07" })];

type Split = Extract<SheetSection, { kind: "split" }>;
const splitOf = (ladder: SheetSection[]) =>
  ladder.find((s): s is Split => s.kind === "split") ?? null;

/** A selector path with its whitespace collapsed — a comma list broken across
 *  lines keeps its newline in the walker's path. */
const norm = (path: string) => path.replace(/\s+/g, " ");
/** Every declaration block whose selector path is exactly `path`, flattened. */
const decls = (css: string, path: string) =>
  blocks(stripComments(css))
    .filter((b) => norm(b.path) === path)
    .map((b) => flat(b.decls))
    .join(";");
/** Every block whose path ends with `ending` and sits inside `inside`. */
const declsIn = (css: string, ending: string, inside: string) =>
  blocks(stripComments(css))
    .filter((b) => norm(b.path).endsWith(ending) && norm(b.path).includes(inside))
    .map((b) => flat(b.decls))
    .join(";");

describe("the musings head is the masthead's (ADR-129)", () => {
  const index = musingsIndexSections(POSTS, POSTS.slice(0, 1));
  const postLadder = musingPostSections(POSTS[0], POSTS.slice(1));

  it("both musings heads carry the survey, only the overview pins, and no other sheet does either", () => {
    const i = splitOf(index)!;
    const p = splitOf(postLadder)!;
    expect(i.survey).toEqual({ code: "MUS", state: "OPEN" });
    expect(p.survey).toEqual({ code: "MUS", state: "ON RECORD" });
    expect(i.pin).toBe(true);
    // ⚠ THE ARTICLE IS READ, NOT BROWSED (U1, owner): a pinned head sat on the
    // text and broke the flow. It scrolls away.
    expect(p.pin).toBeUndefined();
    for (const s of [i, p]) {
      // authored UPPERCASE: nothing transforms the strings on a phone rung
      expect(s.survey!.code).toBe(s.survey!.code.toUpperCase());
      expect(s.survey!.state).toBe(s.survey!.state.toUpperCase());
    }
    const others: Record<string, SheetSection[]> = {
      "home-sessions": homeSessionsSections(NOW),
      kit: kitSections(NOW),
      ...Object.fromEntries(
        CLIENTS.filter((c) => clientPageCount(c, arcsOf(c.slug)) > 0).map((c) => [
          `arcs/${c.slug}`,
          clientSheetSections(c),
        ])
      ),
    };
    for (const [name, ladder] of Object.entries(others)) {
      const s = splitOf(ladder);
      if (!s) continue;
      expect(s.survey, `${name}: survey`).toBeUndefined();
      expect(s.pin, `${name}: pin`).toBeUndefined();
    }
  });

  it("the renderer letters the designations, and the stamps are the homepage station's", () => {
    expect(surveyDesig("MUS", 1)).toBe("MUS / TITLE · 01");
    expect(surveyDesig("MUS", 2)).toBe("MUS / BRIEF · 02");
    // ⚠ THE COPY IS PINNED TO ITS ORIGINAL: the index's id is `musings`, so
    // the page and the station letter the same two stamps.
    expect(coordStamp("musings", 1)).toBe(MUSINGS_COORDS[0]);
    expect(coordStamp("musings", 2)).toBe(MUSINGS_COORDS[1]);
  });

  it("a survey head draws the chrome and no name kicker; a plain head the reverse", () => {
    const survey = renderToStaticMarkup(<SheetSplit section={splitOf(index)!} />);
    expect(survey).toContain("data-sh-survey");
    expect(survey.match(/class="sh-split__desig"/g) ?? []).toHaveLength(2);
    expect(survey).toContain("MUS / TITLE · 01");
    expect(survey).toContain("MUS / BRIEF · 02");
    expect(survey).toContain('class="sh-split__state"');
    expect(survey.match(/sh-split__mark--(origin|close)/g) ?? []).toHaveLength(2);
    expect(survey.match(/class="sh-split__coord/g) ?? []).toHaveLength(2);
    expect(survey.match(/class="sh-split__grid"/g) ?? []).toHaveLength(2);
    expect(survey).not.toContain("sh-split__name");
    // every chrome string is hidden from AT, so the H1 stays the name
    for (const cls of ["sh-split__desig", "sh-split__state", "sh-split__coord"]) {
      const tags = survey.match(new RegExp(`<span class="${cls}[^"]*"[^>]*>`, "g")) ?? [];
      expect(tags.length, cls).toBeGreaterThan(0);
      for (const t of tags) expect(t, cls).toContain('aria-hidden="true"');
    }
    const plain = renderToStaticMarkup(
      <SheetSplit section={splitOf(homeSessionsSections(NOW))!} />
    );
    expect(plain).toContain("sh-split__name");
    expect(plain).not.toContain("data-sh-survey");
    expect(plain).not.toContain("sh-split__desig");
  });

  it("the head is the body's sibling, drawn before it, and the pin is stamped from the record", () => {
    const renderer = read("components/sheet/SheetRenderer.tsx");
    const head = renderer.indexOf("draw(split, sections.indexOf(split))");
    expect(head).toBeGreaterThan(-1);
    expect(head).toBeLessThan(renderer.indexOf('className="sh-body"'));
    expect(renderer).toMatch(
      /section\.kind === "split" && section\.pin \? \{ "data-sh-pin": "" \}/
    );
    // skipped in the map, never filtered — ordinalOf walks the full array
    expect(renderer).toMatch(
      /section\.kind === "split" \|\| section\.kind === "close"\) return null/
    );
    expect(renderer).not.toMatch(/sections\.filter\(/);
  });

  it("the corner prints one label on both musings routes and nowhere else", () => {
    expect(MUSINGS_CORNER).toEqual({ text: "Musings", href: "/musings" });
    for (const route of [
      "app/(marketing)/musings/page.tsx",
      "app/(marketing)/musings/[slug]/page.tsx",
    ])
      expect(read(route), route).toContain("corner={MUSINGS_CORNER}");
    for (const route of [
      "app/(marketing)/home-sessions/page.tsx",
      "app/(marketing)/arcs/[slug]/page.tsx",
      "app/(marketing)/arcs/page.tsx",
    ])
      expect(read(route), route).not.toContain("corner=");
    const nav = read("components/arcs/ArcHudNav.tsx");
    expect(nav).toMatch(
      /const readout = \(label\?\.text \?\? active\?\.label \?\? ""\)\.toUpperCase\(\)/
    );
    expect(read("components/sheet/SheetShell.tsx")).toContain(
      "<ArcHudNav items={chapters} label={corner} />"
    );
  });
});

describe("the survey chrome and the pin, in the sheet (ADR-129)", () => {
  const sheet = read(SHEET);

  it("the seat is arithmetic against the header's own type, mirrored because the sheet cannot read it", () => {
    const root = decls(sheet, ".sh-root");
    expect(root).toContain("--sh-pin-head:calc(var(--hud-margin)+1.6*var(--sh-nav-link)+42px)");
    expect(root).toContain(
      "--sh-split-pad:max(calc(var(--sh-sec-pad)+var(--sh-split-lift)),var(--sh-pin-head))"
    );
    // ⚠ THE MIRROR EQUALS THE ORIGINAL, and the original is NOT on :root —
    // which is the whole reason the mirror exists.
    const mirror = root.match(/--sh-nav-link:([^;]+)/)?.[1];
    const original = decls(read(LANDING), ".hud__nav").match(/--nav-link-size:([^;]+)/)?.[1];
    expect(mirror).toBeDefined();
    expect(mirror).toBe(original);
    // the 1.6 is the body's line height, pinned from the other end
    expect(decls(read(BASE), "body")).toContain("line-height:1.6");
    expect(decls(sheet, ".sh-sec--split")).toContain("padding-block-start:var(--sh-split-pad)");
  });

  it("the pin lives only inside the complement of the inert rung, at z 1, with its offset from the seat", () => {
    const gate =
      "@media (min-width: 961px) and (min-height: 681px) and (prefers-reduced-motion: no-preference)";
    const pin = declsIn(sheet, " .sh-sec--split[data-sh-pin]", gate);
    expect(pin).toContain("position:sticky");
    expect(pin).toContain("top:calc(var(--sh-pin-head)-var(--sh-split-pad))");
    expect(pin).toContain("z-index:1");
    expect(declsIn(sheet, " .sh-sec--split[data-sh-pin]::before", gate)).toContain(
      "height:var(--sh-pin-fade)"
    );
    // nothing sticky outside the gate
    for (const b of blocks(stripComments(sheet)))
      if (b.path.includes("[data-sh-pin]") && !b.path.includes(gate))
        expect(flat(b.decls), b.path).not.toContain("position:sticky");
    // U0's seat for a sticky column under the head went with the article's
    // pin (U1): no pinned page holds prose, so nothing may reach for it.
    expect(stripComments(sheet)).not.toContain("--sh-head-h");
    expect(read("components/sheet/SheetShell.tsx")).not.toContain("--sh-head-h");
  });

  it("the head dims with the body on the body's own clock, lifted to the root", () => {
    const gate =
      "@supports (animation-timeline: view()) @media (min-width: 961px) and (prefers-reduced-motion: no-preference)";
    expect(declsIn(sheet, " .sh-root", gate)).toContain("timeline-scope:--sh-run");
    const veil = declsIn(sheet, " .sh-sec--split[data-sh-pin]::after", gate);
    const body = declsIn(sheet, " .sh-body[data-sh-rise]::after", gate);
    const range = "animation-range:containcalc(100%-var(--ft-weld))contain100%";
    expect(veil).toContain("animation:sh-under-veillinearboth");
    expect(veil).toContain("animation-timeline:--sh-run");
    expect(veil).toContain(range);
    expect(body).toContain(range);
  });

  it("the first body section still draws its seam with the head outside the body", () => {
    const seam = blocks(stripComments(sheet)).find((b) =>
      b.path.includes(".sh-sec--split + .sh-body .sh-sec:first-child .sh-band::before")
    );
    expect(seam).toBeDefined();
    expect(seam!.path).toContain(".sh-sec + .sh-sec .sh-band::before");
    expect(flat(seam!.decls)).toContain("background:var(--sh-seam)");
  });

  it("the chrome is on the shared top line, on tokens only, and the head knob is inert on it", () => {
    expect(decls(sheet, ".sh-split[data-sh-survey] .sh-split__copy")).toContain("align-self:start");
    for (const sel of [".sh-split__desig, .sh-split__state", ".sh-split__coord"]) {
      const d = decls(sheet, sel);
      expect(d, sel).toMatch(/letter-spacing:var\(--track-(eyebrow|label)\)/);
      expect(d, sel).toContain("font-family:var(--font-pt-mono)");
    }
    expect(decls(sheet, ".sh-split__state")).toContain("color:var(--gold-ink)");
    expect(decls(sheet, ".sh-split__mark--origin")).toContain("color:var(--gold)");
    expect(
      decls(sheet, '.sh-root[data-sh-head="stack"] .sh-split[data-sh-survey] .sh-split__lead')
    ).toContain("display:block");
    // the three new alphas re-derive in light (the sheet's own law)
    const light = decls(read(THEME), 'html[data-theme="light"] .sh-root');
    for (const t of ["--sh-survey-faint", "--sh-survey-mark", "--sh-survey-grid"])
      expect(light, t).toContain(`${t}:`);
  });
});
