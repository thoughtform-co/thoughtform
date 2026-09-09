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

  it("orders the journey hero → about → corridor → proof → trinny → proposition → contact", () => {
    const body = parsed();
    const order = stationOrder(body);
    expect(order).toEqual(["hero", "about", "services", "trinny", "proposition", "contact"]);
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

  it("declares the interstitial as the ambient's kill edge and opens the proposal there", () => {
    /* `useCorridorExitScroll` resolves the kill target by id and this page
       has none of the ids it knows below the corridor, so the interstitial
       DECLARES itself (ADR-094). Both new stations publish `proposition` on
       the station bus, which is how the Proposal mark lights from the
       interstitial on. */
    const body = parsed();
    const trinny = body.match(/<section[^>]*\sid="trinny"[^>]*>/)?.[0] ?? "";
    expect(trinny).toContain("data-corridor-kill");
    expect(trinny).toContain('data-station="proposition"');
    const prop = body.match(/<section[^>]*\sid="proposition"[^>]*>/)?.[0] ?? "";
    expect(prop).toContain('data-station="proposition"');
    // Exactly one kill edge: two would make the hook's read an accident of
    // document order.
    expect(body.match(/data-corridor-kill/g) ?? []).toHaveLength(1);
  });

  it("ships the four product cutouts from public/, on the parallax channel, sized", () => {
    /* CSP is `img-src 'self'`, so the products cannot be Contentful URLs;
       and ADR-021 bans wall-clock motion on the landing, so the "float" is
       `data-parallax` (the house channel), never a keyframe. */
    const body = parsed();
    const imgs = body.match(/<img[^>]*class="tl-inter__product[^"]*"[^>]*>/g) ?? [];
    expect(imgs).toHaveLength(4);
    for (const img of imgs) {
      const src = img.match(/src="([^"]+)"/)?.[1] ?? "";
      expect(src).toMatch(/^\/trinny-london\/[a-z-]+\.webp$/);
      expect(existsSync(join(ROOT, "public", src))).toBe(true);
      expect(img).toMatch(/\swidth="\d+"/);
      expect(img).toMatch(/\sheight="\d+"/);
      expect(img).toMatch(/data-parallax="0\.\d+"/);
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
