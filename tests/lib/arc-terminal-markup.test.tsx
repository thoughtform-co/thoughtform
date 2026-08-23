import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { CLAUDE_WORKSHOP_ARC } from "@/lib/arcs/content/claude-workshop";
import { AI_KEYNOTE_ARC } from "@/lib/arcs/content/ai-keynote";
import { PORTFOLIO_ARC } from "@/lib/arcs/content/portfolio";
import type { ArcSection } from "@/lib/arcs/types";

/**
 * Terminal-motion markup conventions (ADR-057).
 *
 * Two properties are pinned here because both fail silently in a way no
 * eye would catch:
 *
 * 1. **v1 byte-identity.** "Shipped without touching the v1 pages" is
 *    only true if reveal mode emits ZERO terminal markup. Assert it,
 *    and a stray unconditional `data-arc-*` becomes a test failure
 *    rather than a diff nobody reads.
 * 2. **The decode contract.** Every target's attribute must equal its
 *    rendered text (SSR, no-JS and the fallback tier all ship RESOLVED
 *    copy — only the client controller ever blanks it), and every target
 *    must be a LEAF, because the scramble writes `textContent` and would
 *    destroy any markup inside.
 */

const ALL: readonly ArcSection[] = [
  ...CLAUDE_WORKSHOP_ARC.sections,
  ...AI_KEYNOTE_ARC.sections,
  ...PORTFOLIO_ARC.sections,
];
const DOSSIERS: readonly ArcSection[] = PORTFOLIO_ARC.sections.filter((s) => s.kind === "dossier");

const render = (sections: readonly ArcSection[], motion: "reveal" | "terminal") =>
  renderToStaticMarkup(<ArcSectionRenderer sections={sections} motion={motion} />);

describe("arc terminal markup (ADR-057)", () => {
  it("reveal mode emits no terminal markup at all", () => {
    const html = render(ALL, "reveal");
    for (const token of [
      "data-arc-beat",
      "data-arc-panel",
      "data-arc-decode",
      "data-arc-type",
      "data-arc-still",
      "data-arc-notail",
      "arc-tdec",
      "arc-stage",
      "arc-plane",
      "arc-beat__tail",
      "--ci-off",
      "--beat-tail",
    ]) {
      expect(html, `reveal markup must not contain ${token}`).not.toContain(token);
    }
  });

  it("reveal mode is byte-identical to the default (no motion prop)", () => {
    expect(render(ALL, "reveal")).toBe(renderToStaticMarkup(<ArcSectionRenderer sections={ALL} />));
  });

  it("terminal mode wraps every section in a stage and a plane", () => {
    const html = render(ALL, "terminal");
    const beats = html.match(/data-arc-beat/g)?.length ?? 0;
    const stages = html.match(/class="arc-stage"/g)?.length ?? 0;
    const planes = html.match(/class="arc-plane"/g)?.length ?? 0;
    expect(beats).toBe(ALL.length);
    expect(stages).toBe(ALL.length);
    expect(planes).toBe(ALL.length);
  });

  it("only the close band is tailless — every other beat can fold", () => {
    const html = render(ALL, "terminal");
    const closes = ALL.filter((s) => s.kind === "close").length;
    expect(html.match(/data-arc-notail/g)?.length ?? 0).toBe(closes);
    expect(html.match(/arc-beat__tail/g)?.length ?? 0).toBe(ALL.length - closes);
  });

  it("every decode target is a leaf whose attribute matches its text", () => {
    const html = render(ALL, "terminal");
    // `data-arc-decode="TEXT">TEXT</span>` — a leaf with identical copy.
    const targets = [...html.matchAll(/data-arc-decode="([^"]*)">([^<]*)<\/span>/g)];
    expect(targets.length).toBeGreaterThan(50);
    for (const [, attr, text] of targets) {
      expect(text).toBe(attr);
    }
    // Any target that is NOT immediately closed by its own text has
    // markup inside it, which the scramble would destroy.
    const all = [...html.matchAll(/data-arc-decode="/g)].length;
    expect(targets.length).toBe(all);
  });

  it("every typewriter target carries its full text", () => {
    const html = render(ALL, "terminal");
    const targets = [...html.matchAll(/data-arc-type="([^"]*)">([^<]*)<\/span>/g)];
    expect(targets.length).toBeGreaterThan(10);
    for (const [, attr, text] of targets) expect(text).toBe(attr);
  });

  it("every decoding box has a ghost twin reserving its layout", () => {
    const html = render(ALL, "terminal");
    const ghosts = html.match(/arc-tdec__ghost/g)?.length ?? 0;
    const lives = html.match(/arc-tdec__live/g)?.length ?? 0;
    // One ghost per live layer — an unreserved blank collapses the box
    // and shifts the whole centred beat when the section arms.
    expect(ghosts).toBe(lives);
    expect(ghosts).toBeGreaterThan(40);
  });

  it("the masthead is marked still — no travel, no crossfade", () => {
    const html = render(ALL, "terminal");
    const heads = html.match(/data-arc-still/g)?.length ?? 0;
    // Every head, interstitial band and close band — and every dossier,
    // whose masthead is derived from the tool record (ADR-072).
    const expected = ALL.filter(
      (s) => s.kind === "interstitial" || s.kind === "close" || s.kind === "dossier" || "head" in s
    ).length;
    expect(heads).toBe(expected);
  });

  it("a dossier beat is one stage around the casefile's console, and only its masthead decodes (ADR-072)", () => {
    expect(DOSSIERS.length).toBe(4);
    const html = render(DOSSIERS, "terminal");
    expect(html.match(/data-arc-beat/g)?.length).toBe(4);
    expect(html.match(/class="arc-stage"/g)?.length).toBe(4);
    expect(html.match(/data-arc-still/g)?.length).toBe(4);
    // The console is an APERTURE on its own rung — never a travelling
    // panel, so the lightbox's portal has no transformed ancestor to escape.
    expect(html.match(/class="arc-dossier__console arc-ap"/g)?.length).toBe(4);
    // The eyebrow, the title's pre and its em — three leaves per beat.
    expect(html.match(/data-arc-decode="/g)?.length).toBe(12);
    // Nothing inside the console decodes: the wireframe's labels are plain
    // aria-hidden spans the controller never sees.
    for (const console of html.split('class="fl-con ').slice(1)) {
      const inner = console.slice(0, console.indexOf("</ul>"));
      expect(inner).not.toContain("data-arc-");
    }
    // The bay is the landing's — the one button, no deleted chrome.
    expect(html.match(/Watch walkthrough/g)?.length).toBe(4);
    expect(html).not.toContain("fl-bay__br");
    expect(html).not.toContain("fl-run");
    // Reveal mode is the same markup with zero terminal tokens.
    const reveal = render(DOSSIERS, "reveal");
    expect(reveal).toBe(renderToStaticMarkup(<ArcSectionRenderer sections={DOSSIERS} />));
    expect(reveal).not.toContain("data-arc-");
    expect(reveal).not.toContain("arc-ap");
  });
});
