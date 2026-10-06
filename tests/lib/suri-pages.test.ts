import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SURI_LUNCH_JOURNEY_ORDER } from "@/app/(marketing)/arcs/suri/lunch-and-learn/journey";
import { WORKSHOP_V3_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/journey";
import { arcTitleText } from "@/components/arcs/chrome";
import { promptToLoopRun } from "@/components/arcs/prompt-to-loop/promptToLoopRun";
import { PROMPT_TO_LOOP_SLIDES } from "@/components/arcs/prompt-to-loop/promptToLoopSlides";
import { getArcAt } from "@/lib/arcs/registry";
import { HAND_IT_TO_AN_AGENT } from "@/lib/arcs/content/shared/handItToAnAgent";
import {
  SURI_RUNS,
  SURI_WORKED,
  SURI_WORKS,
  SURI_WORKSTREAM_ORDER,
  SURI_WORKSTREAMS,
} from "@/lib/arcs/content/shared/suriWork";
import { THREE_WAYS_LOOP } from "@/lib/arcs/content/shared/threeWaysLoop";
import { THE_CATCH_LINE } from "@/lib/arcs/content/shared/workshopFraming";
import { WHAT_FOLLOWS_TITLE } from "@/lib/arcs/content/shared/whatFollows";
import { WORKSHOP_INTRO } from "@/lib/arcs/content/shared/workshopIntro";
import { SURI_CONFIGURATION_ARC } from "@/lib/arcs/content/suri-configuration";
import { SURI_LUNCH_AND_LEARN_ARC } from "@/lib/arcs/content/suri-lunch-and-learn";

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
    /* ADR-147 U8: the breakdown's own sheet, for Prompt to Loop after the loop. */
    expect(page, "carries the breakdown's sheet").toContain(
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
    /* v3's journey, its equilibrium opener included since ADR-147 U1 (owner,
       2026-10-05), mounted from v3's own modules. */
    expect([...SURI_LUNCH_JOURNEY_ORDER]).toEqual([...WORKSHOP_V3_JOURNEY_ORDER]);
    expect(page, "splices v3's opener").toContain('"../../thoughtform/workshop-v3/equilibrium"');
    expect(page, "imports v3's opener sheet").toContain(
      '"../../thoughtform/workshop-v3/equilibrium.css"'
    );
    expect(portals, "mounts v3's hologram, never a copy").toContain(
      '"../../thoughtform/workshop-v3/EquilibriumMount"'
    );
  });

  it("opens on the shared board with Suri's own head, then the situation by reference", () => {
    const [open, stages, curve, resource, steer, question] = LUNCH.sections;
    expect(open.kind).toBe("hero-board");
    if (open.kind !== "hero-board") return;
    expect(open.id).toBe(HAND_IT_TO_AN_AGENT.id);
    expect(open.lit).toBe(HAND_IT_TO_AN_AGENT.lit);
    expect(open.head.title).not.toEqual(HAND_IT_TO_AN_AGENT.head.title);
    expect(open.head.sub, "its own sub keeps it off the shared slide's readers").not.toBe(
      HAND_IT_TO_AN_AGENT.head.sub
    );
    /* The stages at their names alone (ADR-147 U7): the shared figure, every
       stage's sentence and Loop example dropped. */
    expect(stages.kind).toBe("stages");
    if (stages.kind === "stages") {
      expect(stages.axes).toBe(THREE_WAYS_LOOP.axes);
      expect(stages.stages.map((st) => st.name)).toEqual(
        THREE_WAYS_LOOP.stages.map((st) => st.name)
      );
      expect(stages.stages.some((st) => st.body || st.example)).toBe(false);
    }
    expect(curve).toBe(WORKSHOP_INTRO.curve);
    /* ADR-147 U7: how we measure it leads into the spectrum, which keeps the
       record's figure and sub under this room's title; the beat is his line. */
    expect(resource.kind).toBe("resource");
    expect(steer.kind === "spectrum" && steer.head.sub).toBe(WORKSHOP_INTRO.steer.head.sub);
    expect(steer.kind === "spectrum" && arcTitleText(steer.head.title)).toBe(
      "AI sits between a tool and a collaborator."
    );
    expect(question.kind === "interstitial" && question.line).toEqual({
      pre: "AI is a superhuman intelligence,",
      em: "but sucks at running itself.",
    });
    /* v3's horizon and the labs' bet, by reference, after the two plates. */
    const ids = LUNCH.sections.map((s) => s.id);
    expect(ids.indexOf("the-horizon")).toBe(ids.indexOf("leverage-suri") + 1);
    expect(ids.indexOf("signal")).toBe(ids.indexOf("the-horizon") + 1);
  });

  it("switches Suri's three pieces of work, in the same order in every group", () => {
    const groups = new Map<string, string[]>();
    for (const s of LUNCH.sections) {
      if (!s.worked) continue;
      groups.set(s.worked.group, [...(groups.get(s.worked.group) ?? []), s.worked.id]);
    }
    // ADR-147 U8: the configuration is the one switched group left on the page.
    expect([...groups.keys()]).toEqual(["config"]);
    for (const [group, ids] of groups) {
      expect(ids, group).toEqual(SURI_WORKS.map((w) => SURI_WORKED[w].id));
    }
  });

  it("reads the kickoff's loop by reference, then runs Prompt to Loop (U8)", () => {
    const ad = LUNCH.sections.find((s) => s.id === "loop-ad");
    expect(ad?.kind === "interstitial" && ad.clip?.src).toBe("/arcs/prompt-to-loop/loop.mp4");
    /* After the loop: the shared breakdown from "How it runs", then the
       ending. The technical beats are off this page. */
    const ids = LUNCH.sections.map((s) => s.id);
    expect(ids.slice(ids.indexOf("loop-ad") + 1)).toEqual(["no-reflection"]);
    expect(ids, "Brief, set, checks is off the page").not.toContain("the-loop");
    const tail = routeFile("suri", "lunch-and-learn", "WorkshopTail.tsx");
    expect(tail, "mounts the shared breakdown").toContain("PromptToLoop");
    expect(tail, "from How it runs").toContain('"ptl-runs"');
  });

  it("ends on the loop he made, the last slide (U8: no close)", () => {
    const video = LUNCH.sections.at(-1)!;
    expect(video.kind).toBe("media");
    if (video.kind !== "media") return;
    expect(video.media.type).toBe("video");
    expect(video.media.aspect, "a 9:16 loop takes the portrait cap").toBe("portrait");
    for (const src of [video.media.src, video.media.poster]) {
      expect(src?.startsWith("/arcs/suri/"), `${src} under the client's folder`).toBe(true);
      expect(existsSync(join(process.cwd(), "public", src ?? "")), `${src} on disk`).toBe(true);
    }
  });

  it("lays every card grid of its own out in twos or fours", () => {
    for (const s of LUNCH.sections) {
      if (s.kind !== "cards" || s.ledger) continue;
      expect([2, 4], s.id).toContain(s.cards.length);
    }
  });

  it("numbers its beats in order, a switched group once, and its hero lands on the page", () => {
    /* The ending after the breakdown is unnumbered (U8): the breakdown
       numbers its own slides. */
    beats(LUNCH)
      .filter((s) => s.id !== "no-reflection" && s.kind !== "close")
      .forEach((s, i) => {
        const eyebrow =
          s.kind === "interstitial" ? s.eyebrow : "head" in s ? s.head?.eyebrow : undefined;
        expect(eyebrow?.startsWith(String(i + 1).padStart(2, "0")), `${s.id}: ${eyebrow}`).toBe(
          true
        );
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

  /* ADR-148 (owner, 2026-10-06): the simplified setup, in his order. */
  it("is the simplified setup, in the owner's order (ADR-148)", () => {
    expect(beats(CONFIG).map((s) => `${s.kind}:${s.worked ? s.worked.group : s.id}`)).toEqual([
      "spectrum:tool-and-collaborator",
      "curve:the-curve",
      "interstitial:real-question",
      "questions:configuration",
      "cards:skills-and-evals",
      "horizon:the-horizon",
      "interstitial:one-real-job",
      "prompt-to-loop:ptl-top",
      "skill-run:workstream",
      "close:close",
    ]);
    const steer = CONFIG.sections[0];
    expect(steer.kind === "spectrum" && steer.poles).toBe(WORKSHOP_INTRO.steer.poles);
    /* ADR-148 U2: the curve, then the shared catch, and the configuration
       carries the question in its own title. */
    const curve = CONFIG.sections[1];
    expect(curve.kind === "curve" && curve.lanes).toBe(WORKSHOP_INTRO.curve.lanes);
    const caught = CONFIG.sections[2];
    expect(caught.kind === "interstitial" && caught.line).toBe(THE_CATCH_LINE);
    const lunchCatch = LUNCH.sections.find((s) => s.id === "real-question");
    expect(lunchCatch?.kind === "interstitial" && lunchCatch.line, "one line, two pages").toBe(
      THE_CATCH_LINE
    );
    const board = CONFIG.sections.find((s) => s.id === "configuration");
    expect(board?.kind === "questions" && arcTitleText(board.head.title)).toBe(
      "How intelligence should take part in the work."
    );
  });

  it("runs three of Suri's workstreams under one switch, from one record", () => {
    const runs = CONFIG.sections.filter((s) => s.kind === "skill-run");
    expect(runs.map((s) => s.worked?.id)).toEqual([...SURI_WORKSTREAM_ORDER]);
    expect(runs.map((s) => s.worked?.label)).toEqual(
      SURI_WORKSTREAM_ORDER.map((w) => SURI_WORKSTREAMS[w].label)
    );
    for (const s of runs) {
      if (s.kind !== "skill-run") continue;
      const which = SURI_WORKSTREAM_ORDER.find((w) => SURI_WORKSTREAMS[w].id === s.worked?.id)!;
      expect(s.ask).toBe(SURI_RUNS[which].ask);
      expect(s.evals).toBe(SURI_RUNS[which].evals);
    }
    expect(JSON.stringify(CONFIG), "no fee, no key").not.toMatch(/£|\$|€|GBP|sk-|AIza/);
  });

  /* ADR-148 U1 (owner): the steps Claude took to make the Loop ad are "the
     entire point", so the breakdown is mounted whole, from the one record. */
  it("mounts Prompt to Loop whole, from the one record (U1)", () => {
    const ptl = CONFIG.sections.find((s) => s.kind === "prompt-to-loop");
    expect(ptl?.kind === "prompt-to-loop" && promptToLoopRun(ptl)).toEqual(PROMPT_TO_LOOP_SLIDES);
    expect(ptl?.id, "the section's id is the first slide's").toBe(PROMPT_TO_LOOP_SLIDES[0].id);
    expect(routeFile("[slug]", "[leaf]", "page.tsx")).toContain(
      "prompt-to-loop/prompt-to-loop.css"
    );
  });

  it("numbers its beats in order and closes on the shared close", () => {
    /* The breakdown numbers its own slides (1 · The setup … 12 · Next time). */
    beats(CONFIG)
      .filter((s) => s.kind !== "prompt-to-loop")
      .forEach((s, i) => {
        const eyebrow =
          "head" in s && s.head ? s.head.eyebrow : "eyebrow" in s ? s.eyebrow : undefined;
        expect(eyebrow?.startsWith(String(i + 1).padStart(2, "0")), `${s.id}: ${eyebrow}`).toBe(
          true
        );
      });
    const close = CONFIG.sections.at(-1);
    expect(close?.kind === "close" && close.head.title).toBe(WHAT_FOLLOWS_TITLE);
    /* U3: right after the Loop ad, "the loop" reads as the ad. */
    expect(close?.kind === "close" && close.head.sub).not.toMatch(/\bloop\b/i);
    const ids = new Set(CONFIG.sections.map((s) => s.id));
    for (const action of CONFIG.hero.actions ?? []) {
      expect(ids.has(action.href.slice(1)), action.href).toBe(true);
    }
  });
});
