import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SURI_LUNCH_JOURNEY_ORDER } from "@/app/(marketing)/arcs/suri/lunch-and-learn/journey";
import { WORKSHOP_V3_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/journey";
import { getArcAt } from "@/lib/arcs/registry";
import { HAND_IT_TO_AN_AGENT } from "@/lib/arcs/content/shared/handItToAnAgent";
import { SURI_WORKED, SURI_WORKS } from "@/lib/arcs/content/shared/suriWork";
import { THREE_WAYS_LOOP } from "@/lib/arcs/content/shared/threeWaysLoop";
import { WHAT_FOLLOWS_TITLE } from "@/lib/arcs/content/shared/whatFollows";
import { WORKSHOP_INTRO } from "@/lib/arcs/content/shared/workshopIntro";
import { SURI_CONFIGURATION_ARC } from "@/lib/arcs/content/suri-configuration";
import { SURI_LUNCH_AND_LEARN_ARC } from "@/lib/arcs/content/suri-lunch-and-learn";
import { SURI_ASK_CARDS, SURI_LOOP_GROUPS } from "@/lib/arcs/content/suri-workshop";

/**
 * Suri's two pages (ADR-147): the lunch and learn, cut from the workshop's
 * third house cut, and the Creative Intelligence Configuration.
 *
 * ⚠ THE SHAPE IS v3's OWN TEST. The parse test guards the shared prototype
 * and the folder walk in `thoughtform-workshop-v2.test.ts` covers the own
 * route's `OWN_ROUTE_SLUGS` row; `arcs-registry` pins every shared body
 * `toBe` across the three pages that read it. What is pinned here is what is
 * TRUE OF THESE TWO ROUTES: that the lunch and learn shares v3 rather than
 * forking it, that its tail is Suri's work as tabs with the loop as the
 * ending, and that the configuration page's track letters its own words.
 */

const ARCS_DIR = join(__dirname, "..", "..", "app", "(marketing)", "arcs");
const routeFile = (...p: string[]) => readFileSync(join(ARCS_DIR, ...p), "utf8");
const LUNCH = SURI_LUNCH_AND_LEARN_ARC;
const CONFIG = SURI_CONFIGURATION_ARC;

/** A page's beats: every section, a switched group counted once. */
function beats(arc: typeof LUNCH) {
  const seen = new Set<string>();
  return arc.sections.filter((s) => {
    if (!s.worked) return true;
    if (seen.has(s.worked.group)) return false;
    seen.add(s.worked.group);
    return true;
  });
}

describe("Suri's lunch and learn (ADR-147)", () => {
  it("lives at /arcs/suri/lunch-and-learn and shares v3's corridor by import", () => {
    expect(getArcAt("suri", "lunch-and-learn")).toBe(LUNCH);
    const page = routeFile("suri", "lunch-and-learn", "page.tsx");
    expect(page, "renders v1's root class").toContain('className="tw-root" data-tw-cut="v3"');
    expect(page, "imports v1's route sheet").toContain(
      '"../../thoughtform/workshop-v1/thoughtform-workshop.css"'
    );
    expect(page, "reads v1's prototype").toContain("getThoughtformWorkshopContent");
    expect(page, "rewrites the hero with v3's module").toContain(
      '"../../thoughtform/workshop-v3/hero"'
    );
    expect(page, "rewrites the About with v3's module").toContain(
      '"../../thoughtform/workshop-v3/about"'
    );
    expect(page, "reads the intro record").toContain("WORKSHOP_INTRO");
    expect(page, "carries no breakdown").not.toContain(
      '"@/components/arcs/prompt-to-loop/prompt-to-loop.css"'
    );
    const portals = routeFile("suri", "lunch-and-learn", "WorkshopPortals.tsx");
    expect(portals, "mounts v3's proof, never a copy").toContain(
      '"../../thoughtform/workshop-v3/WorkshopProof"'
    );
    expect(portals, "reuses v1's About flow").toContain(
      '"../../thoughtform/workshop-v1/flow/useWorkshopFlow"'
    );
    const tail = routeFile("suri", "lunch-and-learn", "WorkshopTail.tsx");
    expect(tail, "mounts the worked switch beside the sections").toContain("ArcWorkedSwitch");
    expect(tail, "no breakdown").not.toContain("PromptToLoop");
    /* v3's journey without its equilibrium opener (ADR-143 U7): that station is
       v3's own, still moving (U8, U9), and the owner ports v3's later changes
       to this page himself. Everything else in the corridor is the same. */
    expect([...SURI_LUNCH_JOURNEY_ORDER]).toEqual(
      WORKSHOP_V3_JOURNEY_ORDER.filter((id) => id !== "equilibrium")
    );
  });

  it("opens on the shared board with Suri's own head, then the situation by reference", () => {
    const [open, stages, curve, steer, question] = LUNCH.sections;
    expect(open.kind).toBe("hero-board");
    if (open.kind !== "hero-board") return;
    expect(open.id).toBe(HAND_IT_TO_AN_AGENT.id);
    expect(open.lit).toBe(HAND_IT_TO_AN_AGENT.lit);
    expect(open.head.title).not.toEqual(HAND_IT_TO_AN_AGENT.head.title);
    expect(open.head.sub, "its own sub keeps it off the shared slide's readers").not.toBe(
      HAND_IT_TO_AN_AGENT.head.sub
    );
    expect(stages).toBe(THREE_WAYS_LOOP);
    expect(curve).toBe(WORKSHOP_INTRO.curve);
    expect(steer).toBe(WORKSHOP_INTRO.steer);
    expect(question).toBe(WORKSHOP_INTRO.question);
  });

  it("switches Suri's three pieces of work, in the same order in every group", () => {
    const groups = new Map<string, string[]>();
    for (const s of LUNCH.sections) {
      if (!s.worked) continue;
      groups.set(s.worked.group, [...(groups.get(s.worked.group) ?? []), s.worked.id]);
    }
    expect([...groups.keys()]).toEqual(["config", "using", "wrong"]);
    for (const [group, ids] of groups) {
      expect(ids, group).toEqual(SURI_WORKS.map((w) => SURI_WORKED[w].id));
    }
  });

  it("reads the kickoff's loop and asks by reference, and authors its own IT beat", () => {
    const loop = LUNCH.sections.find((s) => s.id === "the-loop");
    expect(loop?.kind === "list-groups" && loop.groups).toBe(SURI_LOOP_GROUPS);
    const ask = LUNCH.sections.find((s) => s.id === "what-we-ask");
    expect(ask?.kind === "cards" && ask.cards).toBe(SURI_ASK_CARDS);
    const it = LUNCH.sections.find((s) => s.id === "what-it-connects");
    expect(it?.kind).toBe("cards");
    /* The kickoff's IT beat predates the marketplace story; this page's own
       says the plugins sync from GitHub. */
    expect(JSON.stringify(it)).toContain("GitHub");
  });

  it("ends on the loop he made, then the shared close", () => {
    const [video, close] = LUNCH.sections.slice(-2);
    expect(video.kind).toBe("media");
    if (video.kind !== "media") return;
    expect(video.media.type).toBe("video");
    expect(video.media.aspect, "a 9:16 loop takes the portrait cap").toBe("portrait");
    for (const src of [video.media.src, video.media.poster]) {
      expect(src?.startsWith("/arcs/suri/"), `${src} under the client's folder`).toBe(true);
      expect(existsSync(join(process.cwd(), "public", src ?? "")), `${src} on disk`).toBe(true);
    }
    expect(close.kind).toBe("close");
    if (close.kind !== "close") return;
    expect(close.head.title).toBe(WHAT_FOLLOWS_TITLE);
  });

  it("lays every card grid of its own out in twos or fours", () => {
    for (const s of LUNCH.sections) {
      if (s.kind !== "cards" || s.ledger) continue;
      expect([2, 4], s.id).toContain(s.cards.length);
    }
  });

  it("numbers its beats in order, a switched group once, and its hero lands on the page", () => {
    beats(LUNCH).forEach((s, i) => {
      const eyebrow =
        s.kind === "interstitial" ? s.eyebrow : "head" in s ? s.head?.eyebrow : undefined;
      expect(eyebrow?.startsWith(String(i + 1).padStart(2, "0")), `${s.id}: ${eyebrow}`).toBe(true);
    });
    const ids = new Set(LUNCH.sections.map((s) => s.id));
    for (const action of LUNCH.hero.actions ?? []) {
      expect(ids.has(action.href.slice(1)), action.href).toBe(true);
    }
  });
});

describe("Suri's Creative Intelligence Configuration (ADR-147)", () => {
  it("lives at /arcs/suri/configuration on the generic route, a setup", () => {
    expect(getArcAt("suri", "configuration")).toBe(CONFIG);
    expect(CONFIG.cardChip).toBe("setup");
    expect(existsSync(join(ARCS_DIR, "suri", "configuration")), "no own folder").toBe(false);
  });

  it("opens on the month as a track that letters its own words", () => {
    const track = CONFIG.sections[0];
    expect(track.kind).toBe("syllabus");
    if (track.kind !== "syllabus") return;
    expect(track.words?.station).toBe("Step");
    expect(track.words?.rows).toEqual(["What you do", "What you end with", "Done when", "Where"]);
    expect(track.phases.map((p) => p.id)).toEqual(["day-one", "day-two", "week-one", "after"]);
    expect(track.classes.map((c) => c.name)).toEqual([
      "Connect",
      "One skill",
      "Write it down",
      "Into the plugin",
      "Feedback",
      "Run it",
      "Hand over",
    ]);
    /* The owner's phases (2026-10-04): day one or two on one skill and
       writing a way of working down; after a week, the plugins, the
       marketplace and the feedback skill. */
    const phaseOf = (name: string) => track.classes.find((c) => c.name === name)?.phase;
    expect(phaseOf("One skill")).toBe("day-one");
    expect(phaseOf("Write it down")).toBe("day-two");
    expect(phaseOf("Into the plugin")).toBe("week-one");
    expect(phaseOf("Feedback")).toBe("week-one");
    const ids = new Set(CONFIG.sections.map((s) => s.id));
    for (const c of track.classes) {
      if (c.example) expect(ids.has(c.example.href.slice(1)), c.example.href).toBe(true);
    }
  });

  it("says what to connect as two readout plates, in Suri's name, with no digit", () => {
    const connect = CONFIG.sections.find((s) => s.id === "what-to-connect");
    expect(connect?.kind === "list-groups" && connect.layout).toBe("readout");
    if (connect?.kind !== "list-groups") return;
    expect(connect.groups.map((g) => g.id)).toEqual(["claude", "suri"]);
    /* The plates letter no digit: a week is "week three", never a number. */
    expect(JSON.stringify(connect.groups)).not.toMatch(/\d/);
    expect(JSON.stringify(CONFIG), "no fee, no key").not.toMatch(/£|\$|€|GBP|sk-|AIza/);
  });

  it("numbers its beats in order and closes on the shared close", () => {
    beats(CONFIG).forEach((s, i) => {
      const eyebrow = "head" in s ? s.head?.eyebrow : undefined;
      expect(eyebrow?.startsWith(String(i + 1).padStart(2, "0")), `${s.id}: ${eyebrow}`).toBe(true);
    });
    const close = CONFIG.sections.at(-1);
    expect(close?.kind === "close" && close.head.title).toBe(WHAT_FOLLOWS_TITLE);
    const ids = new Set(CONFIG.sections.map((s) => s.id));
    for (const action of CONFIG.hero.actions ?? []) {
      expect(ids.has(action.href.slice(1)), action.href).toBe(true);
    }
  });
});
