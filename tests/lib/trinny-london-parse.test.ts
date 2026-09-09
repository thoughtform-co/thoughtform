import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getTrinnyLondonContent } from "@/lib/v7-parse";

const ROOT = join(__dirname, "..", "..");

/**
 * /trinny-london pitch variant (ADR-093) — drift guard.
 *
 * The same shape as `tests/lib/claude-workshop-parse.test.ts`, against the
 * variant's own prototype. Both files exist because the two prototypes are
 * FORKS of one another (ADR-093): they are byte-identical today and will
 * diverge when this page takes its client copy, so each needs a guard that
 * fails on its own file rather than on the other's.
 */

// Duplicated from app/(marketing)/trinny-london/page.tsx (importing the
// server component would drag Next.js server context into vitest). If the
// route's options change, this copy must change with them — that is what
// makes the assertions below a drift guard rather than a restatement.
const TRINNY_PARSE_OPTIONS = {
  removeStations: [
    "definition",
    "missing-layer",
    "intelligence-layer",
    "continuum",
    "practice",
    "buildQuote",
    "build",
  ],
  corridorMountId: "home-corridor-mount",
} as const;

const parsed = () => getTrinnyLondonContent(TRINNY_PARSE_OPTIONS).bodyHtml;

/** Ordered station ids as they appear in the parsed body. */
function stationOrder(bodyHtml: string): string[] {
  return Array.from(bodyHtml.matchAll(/<section[^>]*\sid="([^"]+)"/g)).map((m) => m[1]);
}

describe("trinny-london variant parse (ADR-093)", () => {
  it("injects exactly one corridor mount", () => {
    const matches = parsed().match(/id="home-corridor-mount"/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("orders the journey hero → about → corridor → proof → turn → proposition → contact", () => {
    const body = parsed();
    const order = stationOrder(body);
    expect(order).toEqual(["hero", "about", "services", "turn", "proposition", "contact"]);
    // The mount is a div, not a section — assert it lands between the bio
    // and services, which is the whole point of the variant.
    const at = (needle: string) => body.indexOf(needle);
    expect(at('id="about"')).toBeLessThan(at('id="home-corridor-mount"'));
    expect(at('id="home-corridor-mount"')).toBeLessThan(at('id="services"'));
  });

  it("removes every corridor-replaced station", () => {
    const body = parsed();
    for (const id of TRINNY_PARSE_OPTIONS.removeStations) {
      expect(body).not.toContain(`id="${id}"`);
    }
  });

  it("NEVER ships the about-stage portal slot", () => {
    // ADR-053 invariant 1, inherited whole. With #about above #services the
    // ADR-047 deck-flip clock clamps to 1, which decommissions the services
    // card ring on arrival (ghost cards, no orbits) and pulls a -100svh
    // margin under the hero. The static voidwalker is the about surface here.
    expect(parsed()).not.toContain("data-about-root");
  });

  it("mounts the proof STACK in #services, never the services stage (ADR-094)", () => {
    /* The station keeps its id — it is the corridor's exit anchor and a
       manifest row — but its slot is this route's own. `ServicesPortal`
       returns before `createRoot` without `[data-services-root]`, which is
       what keeps the casefile, the masthead, the plate cluster and the ring
       hit-areas off this page; a second slot would mount two stacks. */
    const body = parsed();
    expect(body.match(/data-tl-proof-root/g) ?? []).toHaveLength(1);
    expect(body).not.toContain("data-services-root");
    expect(body).not.toContain("services-stage-root");
  });

  it("declares the proposal as the ambient's kill edge, and it is the only one", () => {
    /* `useCorridorExitScroll` resolves the kill target by id and this page
       has none of the ids it knows below the corridor, so a station DECLARES
       itself. ADR-095 U1 moved the declaration: the interstitial slab that
       used to carry it is deleted, and `#proposition` — the first opaque
       station below the corridor — is the edge now. The turn between them is
       transparent on purpose; the canvas has to live through the whole beat. */
    const body = parsed();
    const prop = body.match(/<section[^>]*\sid="proposition"[^>]*>/)?.[0] ?? "";
    expect(prop).toContain("data-corridor-kill");
    expect(prop).toContain('data-station="proposition"');
    // Exactly one kill edge: two would make the hook's read an accident of
    // document order.
    expect(body.match(/data-corridor-kill/g) ?? []).toHaveLength(1);
    // And the interstitial is gone, not merely emptied.
    expect(body).not.toContain('id="trinny"');
    expect(body).not.toContain("tl-inter__");
  });

  it("ships the four product cutouts from public/ inside the turn, posed by the writer, sized", () => {
    /* ADR-095: the products live in `#turn` now. CSP is `img-src 'self'`,
       so they cannot be Contentful URLs. They carry NO `data-parallax` —
       that channel derives from the element's live rect (constant inside a
       pinned stage) and writes `translate`, which the turn's writer owns —
       and NO `data-m`, which would be a second owner of their opacity. Each
       carries its `data-tm` index, the writer's key into its pose. */
    const body = parsed();
    const turnStart = body.indexOf('id="turn"');
    const turnEnd = body.indexOf("</section>", turnStart);
    const turn = body.slice(turnStart, turnEnd);
    const imgs = turn.match(/<img[^>]*class="tl-turn__product[^"]*"[^>]*>/g) ?? [];
    expect(imgs).toHaveLength(4);
    const indices = new Set<string>();
    for (const img of imgs) {
      const src = img.match(/src="([^"]+)"/)?.[1] ?? "";
      expect(src).toMatch(/^\/trinny-london\/[a-z-]+\.webp$/);
      expect(existsSync(join(ROOT, "public", src))).toBe(true);
      expect(img).toMatch(/\swidth="\d+"/);
      expect(img).toMatch(/\sheight="\d+"/);
      expect(img).not.toContain("data-parallax");
      expect(img).not.toContain("data-m=");
      indices.add(img.match(/data-tm="(\d)"/)?.[1] ?? "");
    }
    expect([...indices].sort()).toEqual(["0", "1", "2", "3"]);
    // The interstitial keeps none: the kill edge is a copy slab now.
    const trinnyStart = body.indexOf('id="trinny"');
    const trinny = body.slice(trinnyStart, body.indexOf("</section>", trinnyStart));
    expect(trinny).not.toContain("<img");
    expect(trinny).not.toContain("tl-inter__product");
  });

  it("the turn is transparent over the canvas, and carries the wash and the decoded copy", () => {
    /* The canvas must live THROUGH the turn — the kill sits on
       `#proposition` (asserted above, count 1). `data-station="proposition"`
       turns the journey here, with no mark of its own (the roster keeps five
       rows). ADR-095 U1 adds the ground's shader canvas and the copy. */
    const body = parsed();
    const turn = body.match(/<section[^>]*\sid="turn"[^>]*>/)?.[0] ?? "";
    expect(turn).not.toBe("");
    expect(turn).not.toContain("data-corridor-kill");
    expect(turn).toContain('data-station="proposition"');
    expect(body.match(/data-tl-turn-stage/g) ?? []).toHaveLength(1);
    expect(body.match(/class="tl-turn__mark"/g) ?? []).toHaveLength(1);
    expect(body.match(/data-tl-turn-wash/g) ?? []).toHaveLength(1);
    // Order: the turn sits between the proof and the kill edge.
    const at = (needle: string) => body.indexOf(needle);
    expect(at('id="services"')).toBeLessThan(at('id="turn"'));
    expect(at('id="turn"')).toBeLessThan(at('id="proposition"'));

    /* Every decoded line is a GHOST plus a LIVE layer carrying the SAME
       string: the ghost holds the box and the accessible text, the live
       layer is what the writer overwrites. A drift between the two would
       show as the block resizing the moment the decode starts. And no
       `data-m` anywhere in the copy — that is the move-and-fade reveal this
       replaces, and it would be a second owner of the same opacity. */
    const start = body.indexOf('class="tl-turn__copy"');
    const copy = body.slice(start, body.indexOf("</section>", start));
    expect(copy).not.toContain("data-m");
    const ghosts = [...copy.matchAll(/<span class="tl-dc__ghost">([^<]*)<\/span>/g)].map(
      (m) => m[1]
    );
    const lives = [...copy.matchAll(/<span class="tl-dc__live"[^>]*>([^<]*)<\/span>/g)].map(
      (m) => m[1]
    );
    expect(ghosts).toHaveLength(4);
    expect(lives).toEqual(ghosts);
    for (const live of copy.match(/<span class="tl-dc__live"[^>]*>/g) ?? []) {
      expect(live).toContain("data-tl-decode");
      expect(live).toContain('aria-hidden="true"');
    }
  });

  it("letters the proposal without the Arc's vocabulary or a digit", () => {
    /* The proposal is the offer; the Arc is the approach. The owner asked
       for them kept apart, and the drawing letters no count — it plots
       their stack, it does not measure it. */
    const body = parsed();
    // From the section's own `<` — slicing at the id would leave the tag's
    // remaining attributes (its screen label carries an ordinal) in the text.
    const start = body.lastIndexOf("<section", body.indexOf('id="proposition"'));
    const end = body.lastIndexOf("<section", body.indexOf('id="contact"'));
    const prop = body.slice(start, end).replace(/<[^>]+>/g, " ");
    expect(prop).not.toMatch(/\b(navigate|encode|build)\b/i);
    expect(prop).not.toMatch(/\d/);
    expect(prop.toLowerCase()).not.toContain("self-sufficien");
  });

  it("ships the wordmark and drops the legacy HUD chrome", () => {
    const body = parsed();
    expect(body).toContain('class="hud__brand"');
    // The React HudNav overlay owns the top-right nav; the prototype's
    // static copy would render a second hamburger.
    expect(body).not.toContain('id="hudNav"');
    // ADR-043: the wordmark occupies the bottom-left corner.
    expect(body).not.toContain('<div class="hud__corner hud__corner--bl">');
  });

  it("keeps both tick ladders injected", () => {
    const body = parsed();
    expect(body).toContain("hud__rail__tick");
    expect(body).not.toContain('<div id="leftTicks"></div>');
    expect(body).not.toContain('<div id="rightTicks"></div>');
  });

  it("leaves no orphan celestial slot at the services seam", () => {
    expect(parsed()).not.toContain("data-celestial-slot");
  });

  it("keeps the hero elements the terminal boot requires", () => {
    const body = parsed();
    for (const cls of ["hero__headline", "hero__desc", "hero__cta", "hero__bg"]) {
      expect(body).toContain(cls);
    }
  });

  it("leaves no link pointing at a removed station, and the hero CTA enters the corridor", () => {
    const body = parsed();
    for (const id of TRINNY_PARSE_OPTIONS.removeStations) {
      expect(body).not.toContain(`href="#${id}"`);
    }
    // `removeHudNavEntries` DELETES any <a> whose href targets a removed
    // station — it runs before the redirect pass, so an authored link to a
    // removed station vanishes rather than being retargeted. The hero's
    // primary CTA therefore points at the mount id directly.
    expect(body).toContain('href="#home-corridor-mount"');
    expect(body).toMatch(/hero__cta__btn--primary"\s+href="#home-corridor-mount"/);
  });

  it("reads its OWN prototype file — the fork is a file, not an alias", () => {
    /* ⚠ THE TWO PROTOTYPES ARE BYTE-IDENTICAL AT THE FORK, so every
       assertion above passes against either file and none of them would
       notice `getTrinnyLondonContent` pointing at the workshop's HTML.
       Only the path can be checked, and it is checked on DISK because
       that is also what Vercel's file tracer needs to find (ADR-093). */
    expect(existsSync(join(ROOT, "public/prototypes/v7/landing-trinny-london.html"))).toBe(true);
    const src = readFileSync(join(ROOT, "lib/v7-parse/index.ts"), "utf8");
    expect(src).toContain('"public/prototypes/v7/landing-trinny-london.html"');
  });
});
