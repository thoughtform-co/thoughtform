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

  it("orders the journey hero → about → corridor → proof → turn → proposition → offer → contact", () => {
    const body = parsed();
    const order = stationOrder(body);
    /* `offer` (ADR-094 U9): the proposal's beats after the configuration,
       a station whose only child is the slot the arcs' components mount
       into — so at parse time it is an empty box, and the region walks
       below that slice up to the `<section` before `#contact` still land
       on the proposition alone. */
    expect(order).toEqual(["hero", "about", "services", "turn", "proposition", "offer", "contact"]);
    expect(body.match(/data-tl-offer-root/g) ?? []).toHaveLength(1);
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

  it("declares THE OFFER as the ambient's kill edge, and it is the only one", () => {
    /* `useCorridorExitScroll` resolves the kill target by id and this page
       has none of the ids it knows below the corridor, so a station DECLARES
       itself. The declaration has moved three times: ADR-095 U1 deleted the
       interstitial slab that carried it, handing it to `#proposition`; U5
       then made `#proposition` TRANSPARENT and pinned, so the parked mark
       survives into the proposal and fades behind its record instead of
       dying at its top edge, and `#contact` took it; ADR-094 U9 appended
       the offer between the two, and THAT is the first opaque station
       below the corridor now. */
    const body = parsed();
    const offer = body.match(/<section[^>]*\sid="offer"[^>]*>/)?.[0] ?? "";
    expect(offer).toContain("data-corridor-kill");
    expect(offer).toContain('data-station="offer"');
    const contact = body.match(/<section[^>]*\sid="contact"[^>]*>/)?.[0] ?? "";
    expect(contact).not.toContain("data-corridor-kill");
    const prop = body.match(/<section[^>]*\sid="proposition"[^>]*>/)?.[0] ?? "";
    expect(prop).not.toContain("data-corridor-kill");
    expect(prop).toContain('data-station="proposition"');
    // Exactly one kill edge: two would make the hook's read an accident of
    // document order.
    expect(body.match(/data-corridor-kill/g) ?? []).toHaveLength(1);
    // And the interstitial is gone, not merely emptied.
    expect(body).not.toContain('id="trinny"');
    expect(body).not.toContain("tl-inter__");
  });

  it("the proposal is a SLOT the configuration mounts into (ADR-099)", () => {
    /* ADR-095 U5 made this station a pinned stage whose record powered on in
       place, because an opaque station in normal flow can only ARRIVE by
       travelling and its content travels with it. That solved the slide and
       bought a worse thing: a pin cannot start until the beat above it has
       finished, so the turn emptied (products out at 0.88, the line un-typed
       at 0.90) and the reader crossed a viewport of held ground before
       anything appeared. The owner read it as "a blank section or a leftover
       section briefly appears".

       The record is an arc beat now, mounted by `TrinnyPortals` into the one
       slot below. It scrolls in over the emptying stage — the stations
       overlap by `--tl-prop-lead` — so nothing slides over anything and
       nothing waits.

       ⚠ THE ABSENCES ARE THE ASSERTION. `data-m` is the move-and-fade system
       this station may never use; `data-tl-prop-stage` and `data-tl-reveal`
       are the retired pin and its channel, and a stage left behind with the
       writer gone would pin `q` at 0 and latch the record invisible. */
    const body = parsed();
    const start = body.indexOf('id="proposition"');
    const prop = body.slice(start, body.indexOf("</section>", start));
    expect(prop).not.toContain("data-m");
    expect(body.match(/data-tl-config-root/g) ?? []).toHaveLength(1);
    expect(body).not.toContain("data-tl-prop-stage");
    expect(body).not.toContain("data-tl-reveal");
    expect(prop).not.toContain("tl-config__");
    /* The ground SURVIVES the move: ADR-095 U4's held field and U6's swap are
       untouched, which is what keeps the client's colour across the seam. */
    expect(prop).toContain("data-tl-prop-wash");
  });

  it("the contact block reveals without travelling", () => {
    /* Same law, different machinery (ADR-095 U5). This block is NOT pinned —
       a page's last card does not need a stage — so the scrubbed channel the
       proposal uses would have nothing to key on. `fade` is the one role in
       `data-m` that does not translate, so it is the same ruling with the
       machinery already in the sheet. Anything else here is a slide. */
    const body = parsed();
    const start = body.indexOf('id="contact"');
    const contact = body.slice(start, body.indexOf("</section>", start));
    const roles = [...contact.matchAll(/data-m="([a-z]+)"/g)].map((m) => m[1]);
    expect(roles.length).toBeGreaterThan(0);
    expect([...new Set(roles)]).toEqual(["fade"]);
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
    /* The canvas must live THROUGH the turn AND the proposal — the kill
       sits on `#contact` (asserted above, count 1). `data-station="proposition"`
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
    /* ⚠ SLICE THE STATION, NOT THE FIRST COPY BLOCK. There are TWO now
       (ADR-095 U3): the title sits above the mark and the paragraph and the
       call to action below it, so an `indexOf('class="tl-turn__copy"')`
       matches neither — both carry a modifier — and would silently slice
       from zero, landing on the hero. */
    const start = body.indexOf('id="turn"');
    const copy = body.slice(start, body.indexOf("</section>", start));
    expect(copy).not.toContain("data-m");
    /* The split itself, so the composition cannot quietly re-merge onto the
       mark: two blocks, the title in the upper one and the call to action in
       the lower. */
    expect(copy).toContain('class="tl-turn__copy tl-turn__copy--over"');
    expect(copy).toContain('class="tl-turn__copy tl-turn__copy--under"');
    expect(copy.indexOf("tl-turn__title")).toBeLessThan(copy.indexOf("tl-turn__copy--under"));
    expect(copy.indexOf("tl-turn__copy--under")).toBeLessThan(copy.indexOf("tl-turn__cta"));
    const ghosts = [...copy.matchAll(/<span class="tl-dc__ghost">([^<]*)<\/span>/g)].map(
      (m) => m[1]
    );
    const lives = [...copy.matchAll(/<span class="tl-dc__live"[^>]*>([^<]*)<\/span>/g)].map(
      (m) => m[1]
    );
    /* ⚠ THREE, NOT FOUR (owner, 2026-09-10): the eyebrow came out of the
       upper block, leaving the title, the paragraph and the call to action.
       The COUNT is what the writer walks — `useTurnScroll` reads every
       `[data-tl-decode]` in order — so a stale number here would not fail
       on the page, it would decode a line that is not on it. */
    expect(ghosts).toHaveLength(3);
    expect(lives).toEqual(ghosts);
    // ⚠ AND THE CLIENT'S OWN NAME IS THE ONLY ONE ON THIS BEAT. The turn is
    // the pitch's hinge; naming the other engagement here reads as a
    // reference rather than as an offer (owner, same pass).
    expect(ghosts.join(" ")).not.toContain("Loop Earplugs");
    for (const live of copy.match(/<span class="tl-dc__live"[^>]*>/g) ?? []) {
      expect(live).toContain("data-tl-decode");
      expect(live).toContain('aria-hidden="true"');
    }
  });

  it("leaves the proposal's copy to the record it now mounts (ADR-099)", () => {
    /* This walked the station's own markup for the Arc's vocabulary, a
       digit and "self-sufficient" — right while the record was hand-written
       here. It is data now (`offer/offerSections.ts`), so the walk moved to
       `tests/lib/trinny-offer.test.ts`, which reads the same bans from
       `lib/arcs/copyLaw.ts` over every string the page can letter.

       ⚠ WHAT STAYS HERE IS WHAT THE HTML STILL OWNS: the station is a shell,
       so it must letter NOTHING. A head that crept back into the prototype
       would be a second source for one record, and the two would drift. */
    const body = parsed();
    const start = body.lastIndexOf("<section", body.indexOf('id="proposition"'));
    const end = body.lastIndexOf("<section", body.indexOf('id="offer"'));
    const text = body
      .slice(start, end)
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ");
    expect(text.trim()).toBe("");
    // And the retired head's own classes are gone with it.
    for (const cls of ["tl-prop__head", "tl-prop__title", "tl-prop__desc", "tl-prop__eyebrow"]) {
      expect(body, cls).not.toContain(cls);
    }
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
