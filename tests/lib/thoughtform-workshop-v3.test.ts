import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { WORKSHOP_V3_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/journey";
import {
  V3_BREAKDOWN,
  V3_CLOSE,
  V3_ECONOMICS,
  V3_JUST_ASK,
  V3_SITUATION,
} from "@/app/(marketing)/arcs/thoughtform/workshop-v3/runs";
import { WORKSHOP_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/workshop-v1/journey";
import { PROMPT_TO_LOOP_SLIDES } from "@/components/arcs/prompt-to-loop/promptToLoopSlides";
import { AP_HOGESCHOOL_ARC } from "@/lib/arcs/content/ap-hogeschool";
import { HAND_IT_TO_AN_AGENT } from "@/lib/arcs/content/shared/handItToAnAgent";
import { MARKET_SIGNAL_COLUMNS } from "@/lib/arcs/content/shared/marketSignal";
import { THREE_WAYS_LOOP } from "@/lib/arcs/content/shared/threeWaysLoop";
import {
  FEEDBACK_STEPS,
  GET_STARTED_CARDS,
  THE_HORIZON_RECORD,
} from "@/lib/arcs/content/shared/workshopPractice";
import {
  WHAT_FOLLOWS_CLOSE,
  WHAT_FOLLOWS_SUB,
  WHAT_FOLLOWS_TITLE,
} from "@/lib/arcs/content/shared/whatFollows";
import {
  HARD_TO_STEER_BEAT,
  REAL_QUESTION_BEAT,
  THE_CURVE_BEAT,
} from "@/lib/arcs/content/shared/workshopFraming";
import { THOUGHTFORM_WORKSHOP_V2_ARC } from "@/lib/arcs/content/thoughtform-workshop-v2";
import { THOUGHTFORM_WORKSHOP_V3_ARC } from "@/lib/arcs/content/thoughtform-workshop-v3";

/**
 * The workshop's third house cut, route guard (ADR-143).
 *
 * ⚠ THE SHAPE IS THE AP LECTURE'S OWN TEST, and for its reason: the parse test
 * already guards the shared prototype for every own route, and the folder walk
 * in `thoughtform-workshop-v2.test.ts` covers this folder's `OWN_ROUTE_SLUGS`
 * row. What is pinned here is what is TRUE OF THIS ROUTE: that it shares
 * rather than forks, that its situation is read by reference from the two
 * pages it was cut from, and that the breakdown is split where the owner put
 * the economics.
 */

const ARCS_DIR = join(__dirname, "..", "..", "app", "(marketing)", "arcs");
const routeFile = (...p: string[]) => readFileSync(join(ARCS_DIR, ...p), "utf8");

describe("the workshop's third house cut (ADR-143)", () => {
  it("shares the corridor with v1 rather than forking it", () => {
    const page = routeFile("thoughtform", "workshop-v3", "page.tsx");
    expect(page, "renders v1's root class").toContain('className="tw-root"');
    expect(page, "imports v1's route sheet").toContain('"../workshop-v1/thoughtform-workshop.css"');
    expect(page, "reads v1's prototype").toContain("getThoughtformWorkshopContent");
    expect(page, "loads the shared breakdown's sheet").toContain(
      '"@/components/arcs/prompt-to-loop/prompt-to-loop.css"'
    );
    const portals = routeFile("thoughtform", "workshop-v3", "WorkshopPortals.tsx");
    expect(portals, "reuses v1's proof, never a copy").toContain('"../workshop-v1/WorkshopProof"');
    expect(portals, "reuses v1's About flow").toContain('"../workshop-v1/flow/useWorkshopFlow"');
    /* Equal TODAY; separate files so the owner's intro pass can change one. */
    expect([...WORKSHOP_V3_JOURNEY_ORDER]).toEqual([...WORKSHOP_JOURNEY_ORDER]);
  });

  it("carries no worked-example switch", () => {
    const tail = routeFile("thoughtform", "workshop-v3", "WorkshopTail.tsx");
    expect(tail, "the tail mounts no switch").not.toContain("ArcWorkedSwitch");
    for (const s of THOUGHTFORM_WORKSHOP_V3_ARC.sections) {
      expect(s.worked, `${s.id}: a panel stamp on a page with no switch`).toBeUndefined();
    }
  });

  /**
   * ⚠ ONE SECTION, ONE RECORD (owner, 2026-10-02). The situation is the second
   * cut's opening and stages and the AP lecture's three middle beats, the SAME
   * objects on every page that shows them, so a copy edit lands everywhere.
   */
  it("reads the situation by reference from the pages it was cut from", () => {
    const [open, stages, curve, steer, question] = THOUGHTFORM_WORKSHOP_V3_ARC.sections;
    expect(open).toBe(HAND_IT_TO_AN_AGENT);
    expect(stages).toBe(THREE_WAYS_LOOP);
    expect(curve).toBe(THE_CURVE_BEAT);
    expect(steer).toBe(HARD_TO_STEER_BEAT);
    expect(question).toBe(REAL_QUESTION_BEAT);
    expect(THOUGHTFORM_WORKSHOP_V2_ARC.sections[1], "v2 reads the same stages").toBe(
      THREE_WAYS_LOOP
    );
    for (const beat of [THE_CURVE_BEAT, HARD_TO_STEER_BEAT, REAL_QUESTION_BEAT]) {
      expect(
        AP_HOGESCHOOL_ARC.sections.find((s) => s.id === beat.id),
        `the AP lecture reads ${beat.id}`
      ).toBe(beat);
    }
  });

  /**
   * Tom on the Moon and In The Pocket's wall are the AP lecture's worlds; this
   * cut starts its worked example at the breakdown instead (owner, 2026-10-03).
   */
  it("carries none of the lecture's worlds or its student tail", () => {
    const ids = THOUGHTFORM_WORKSHOP_V3_ARC.sections.map((s) => s.id);
    for (const gone of [
      "configuration",
      "tom-on-the-moon",
      "tom-skill",
      "tom-scale",
      "tom-verdict",
      "itp-wall",
      "ambition",
      "this-week",
      "rewarded",
    ]) {
      expect(ids, `${gone} is not on this page`).not.toContain(gone);
    }
  });

  /**
   * ⚠ THE SPLIT IS WHERE THE OWNER PUT IT: the breakdown runs to its bill, the
   * economics answer the bill, "Now it's a skill" closes the breakdown after
   * them, then Laura's test and the close. Every slide renders exactly once.
   */
  it("splits Prompt to Loop around the economics, every slide once", () => {
    expect(V3_SITUATION.map((s) => s.id).slice(4)).toEqual([
      "real-question",
      "configuration-motion",
      "leverage-motion",
      "the-horizon",
      "signal",
      "its-evals-motion",
    ]);
    expect(V3_BREAKDOWN[0]?.id).toBe("ptl-top");
    expect(V3_BREAKDOWN.at(-1)?.id).toBe("ptl-cost");
    expect(V3_ECONOMICS.map((s) => s.id)).toEqual([
      "the-money",
      "the-economics",
      "volume-and-taste",
      "the-team",
    ]);
    expect(V3_JUST_ASK.map((s) => s.id)).toEqual(["ptl-next"]);
    expect(V3_CLOSE.map((s) => s.id)).toEqual([
      "in-other-hands",
      "made-real-motion",
      "the-skill-motion",
      "the-plugin-motion",
      "using-it-motion",
      "when-wrong-motion",
      "get-started",
      "close",
    ]);
    expect([...V3_BREAKDOWN, ...V3_JUST_ASK]).toEqual([...PROMPT_TO_LOOP_SLIDES]);
    expect(
      [...V3_SITUATION, ...V3_ECONOMICS, ...V3_CLOSE].map((s) => s.id),
      "every section in exactly one run"
    ).toEqual(THOUGHTFORM_WORKSHOP_V3_ARC.sections.map((s) => s.id));
  });

  /** The breakdown is one record on disk, under the shared folder. */
  it("finds every picture and the film of the shared breakdown on disk", () => {
    for (const slide of PROMPT_TO_LOOP_SLIDES) {
      for (const [, src] of slide.body.matchAll(/(?:src|poster)="(\/arcs\/[^"]+)"/g)) {
        expect(src.startsWith("/arcs/prompt-to-loop/"), `${src} is the shared folder`).toBe(true);
        expect(existsSync(join(process.cwd(), "public", src)), `${src} on disk`).toBe(true);
      }
    }
  });

  /**
   * Laura's message, made concise: four rows in order, the Vesper row the
   * total, her own sentence the tip. First name only, and the two colleagues
   * her thread names are not on the page.
   */
  it("draws Laura's comparison as a ledger ending on Vesper", () => {
    const beat = THOUGHTFORM_WORKSHOP_V3_ARC.sections.find((s) => s.id === "in-other-hands");
    expect(beat?.kind).toBe("cards");
    if (beat?.kind !== "cards") return;
    expect(beat.ledger?.columns).toEqual(["When", "The work", "Time"]);
    expect(beat.cards.map((c) => c.title)).toEqual([
      "Over a week",
      "About 16 hours",
      "4 to 5 hours",
      "15 minutes",
    ]);
    expect(beat.cards.at(-1)?.body).toContain("Vesper");
    expect(beat.tips?.[0]?.tag).toMatch(/^Laura · /);
    expect(JSON.stringify(beat)).not.toMatch(/Soave|Bala|Clarissa/);
  });

  /** Two or four cards, never three: `.arc-cards` is two columns at 1280px.
   *  The one exception is getting started, v2's record by reference. */
  it("lays every card grid of its own out in twos or fours", () => {
    for (const s of THOUGHTFORM_WORKSHOP_V3_ARC.sections) {
      if (s.kind !== "cards" || s.ledger) continue;
      if (s.cards === GET_STARTED_CARDS) continue;
      expect([2, 4], `${s.id}`).toContain(s.cards.length);
    }
  });

  /**
   * U2 (owner, 2026-10-03): why the two parts a team writes matter, before the
   * breakdown — the two plates opened up for the ad, the horizon's two
   * timelines, the labs' bets — from the Moira session's own slides. The
   * horizon and the clippings are shared records; the plates are the ad's.
   */
  it("sets up the breakdown with why the context and the evals matter", () => {
    const ids = THOUGHTFORM_WORKSHOP_V3_ARC.sections.map((s) => s.id);
    expect(ids.slice(ids.indexOf("configuration-motion"), ids.indexOf("the-money"))).toEqual([
      "configuration-motion",
      "leverage-motion",
      "the-horizon",
      "signal",
      "its-evals-motion",
    ]);
    const plates = THOUGHTFORM_WORKSHOP_V3_ARC.sections.find((s) => s.id === "leverage-motion");
    const board = THOUGHTFORM_WORKSHOP_V3_ARC.sections.find((s) => s.id === "configuration-motion");
    if (plates?.kind !== "cards" || board?.kind !== "questions") throw new Error("kinds");
    /* The same two plates as on the board, opened up: each card's line is
       the board's own answer for that plate. */
    const answer = (id: string) => board.left.find((q) => q.id === id)?.answer;
    expect(plates.cards.map((c) => c.body.replace(/\.$/, ""))).toEqual([
      answer("context"),
      answer("evals"),
    ]);
    const signal = THOUGHTFORM_WORKSHOP_V3_ARC.sections.find((s) => s.id === "signal");
    expect(signal?.kind === "signal" && signal.columns).toBe(MARKET_SIGNAL_COLUMNS);
    /* The skill as the file it is moved after the proof, beside the plugin. */
    expect(ids.indexOf("the-skill-motion")).toBe(ids.indexOf("made-real-motion") + 1);
  });

  /**
   * U1 (owner, 2026-10-03): the answer to the real question for the ad, its
   * skill and its evals before the breakdown; how it reaches a team after the
   * proof. ONE worked example, the motion ad. The beats that read the same for
   * every example are v2's records by reference.
   */
  it("answers the real question for the ad, and reads the practice beats from v2", () => {
    const at = (id: string) => THOUGHTFORM_WORKSHOP_V3_ARC.sections.find((s) => s.id === id);
    const board = at("configuration-motion");
    expect(board?.kind === "questions" && board.work.name).toBe("A ten-second motion ad");
    const skill = at("the-skill-motion");
    expect(skill?.kind === "skill-file" && skill.path).toBe("motion-design / SKILL.md");
    const horizon = at("the-horizon");
    expect(horizon?.kind === "horizon" && horizon.agent).toBe(THE_HORIZON_RECORD.agent);
    const v2Horizon = THOUGHTFORM_WORKSHOP_V2_ARC.sections.find((s) => s.id === "the-horizon");
    expect(v2Horizon?.kind === "horizon" && v2Horizon.agent, "v2 reads it too").toBe(
      THE_HORIZON_RECORD.agent
    );
    const wrong = at("when-wrong-motion");
    expect(wrong?.kind === "chat" && wrong.aside).toBe(FEEDBACK_STEPS);
    const started = at("get-started");
    expect(started?.kind === "cards" && started.cards).toBe(GET_STARTED_CARDS);
    /* The workstream seam: every example-specific beat is suffixed, so the
       day a second workstream is authored they become `worked` panels. */
    for (const id of [
      "configuration-motion",
      "leverage-motion",
      "the-skill-motion",
      "its-evals-motion",
      "made-real-motion",
      "the-plugin-motion",
      "using-it-motion",
      "when-wrong-motion",
    ]) {
      expect(at(id), id).toBeDefined();
    }
  });

  it("closes on the shared close at its own number", () => {
    const close = THOUGHTFORM_WORKSHOP_V3_ARC.sections.at(-1);
    expect(close?.kind).toBe("close");
    if (close?.kind !== "close") return;
    expect(close.head.title).toBe(WHAT_FOLLOWS_TITLE);
    expect(close.head.sub).toBe(WHAT_FOLLOWS_SUB);
    expect(close.actions).toBe(WHAT_FOLLOWS_CLOSE.actions);
    expect(close.head.eyebrow).toBe("22 · What follows");
    const v2 = THOUGHTFORM_WORKSHOP_V2_ARC.sections.at(-1);
    expect(v2?.kind === "close" && v2.head.title, "v2's close reads it too").toBe(
      WHAT_FOLLOWS_TITLE
    );
  });

  it("numbers its own beats in order, and its hero lands on the page", () => {
    const own = THOUGHTFORM_WORKSHOP_V3_ARC.sections.map((s) =>
      s.kind === "interstitial" ? s.eyebrow : "head" in s ? s.head?.eyebrow : undefined
    );
    own.forEach((eyebrow, i) => {
      expect(eyebrow?.startsWith(String(i + 1).padStart(2, "0")), `${eyebrow}`).toBe(true);
    });
    const ids = new Set(THOUGHTFORM_WORKSHOP_V3_ARC.sections.map((s) => s.id));
    for (const action of THOUGHTFORM_WORKSHOP_V3_ARC.hero.actions ?? []) {
      expect(ids.has(action.href.slice(1)), action.href).toBe(true);
    }
  });
});
