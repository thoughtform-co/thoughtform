/**
 * The Trinny bench's reading of a job (ADR-120 Update 1): which colour a
 * check turns, which line a block says, what the verdict card says, where
 * the run is, where the highlight sits and which product a regression case
 * is checked as.
 *
 * The colour rule is the owner's (2026-09-22) and it is asserted as a
 * table: a gate that fails is red; anything judged that fails, a split
 * vote, or a check nobody answered is orange; a check that held on every
 * run is green. The measured rows settle on the measurement alone, and a
 * frame the ship could not compare is n/a, never a green nobody measured.
 *
 * The fixture is rubric 0.2 as `/api/trinny-bench/config` sends it (the
 * ship fills a caption the rubric leaves empty with the check's own lead).
 */
import { describe, expect, it } from "vitest";

import {
  arOf,
  blockReason,
  blockState,
  blocksOf,
  boldLead,
  boxStyle,
  caseTarget,
  checkState,
  colourReason,
  failReason,
  labelBelow,
  negativeResult,
  phaseOf,
  phaseSteps,
  phaseWord,
  positiveResult,
  revealIndex,
  strangerLine,
  strictness,
  verdictLine,
  verdictTone,
  votes,
  worst,
} from "@/app/(internal)/test/trinny-bench/derive";
import type { Check, Job, Measurement, RunRecord } from "@/app/(internal)/test/trinny-bench/types";

const A = "A. Identity. Any failure here stops the asset.";
const B = "B. Proportion and scale";
const C = "C. Material and light";
const D = "D. Brief and register";
const F = "F. Measured colour, computed in code";
const E = "E. Set level";

function chk(
  id: string,
  block: string,
  severity: string,
  lead: string,
  caption?: string,
  flags: { computed?: boolean; set?: boolean } = {}
): Check {
  return {
    id,
    block,
    severity,
    set_level: !!flags.set,
    check: `**${lead}** More of the rule.`,
    fails_when: "",
    caption: caption ?? lead,
    computed: !!flags.computed,
  };
}

const CHECKS: Check[] = [
  chk(
    "A1",
    A,
    "gate",
    "It is this subject, and there is one of it.",
    "the subject's shape or part count is off"
  ),
  chk("A2", A, "gate", "The wordmark is right.", "the wordmark is not the one on the real product"),
  chk(
    "A3",
    A,
    "gate",
    "Colour and finish are the product's.",
    "the colour or finish is not the product's"
  ),
  chk("A4", A, "gate", "Nothing invented on the subject."),
  chk(
    "A5",
    A,
    "gate",
    "No lettering anywhere but the product's own.",
    "there is lettering here that is not on the product"
  ),
  chk("A6", A, "advisory", "Reads as the right thing to a stranger."),
  chk(
    "A7",
    A,
    "gate",
    "No claim appears in the picture.",
    "this frame carries a claim, which this category does not allow"
  ),
  chk("B1", B, "critical", "Proportions match image 1."),
  chk("B2", B, "critical", "Scale is right."),
  chk("B3", B, "critical", "It sits where it would sit."),
  chk("B4", B, "gate", "Hands and bodies are sound."),
  chk("C1", C, "critical", "Material reads as itself."),
  chk("C2", C, "critical", "Light has one source and no fill, and it is the setting's."),
  chk("C3", C, "critical", "The shadow has a cause.", "the shadow does not agree with the light"),
  chk(
    "C4",
    C,
    "minor",
    "The ground is the brand's, for the setting the manifest names.",
    "this is not one of the brand's grounds"
  ),
  chk("C5", C, "minor", "The surface is lived on, not styled."),
  chk("D1", D, "critical", "It answers its own question."),
  chk("D2", D, "critical", "No category cliche."),
  chk("D3", D, "minor", "The register is right."),
  chk("D4", D, "critical", "Photoreal, not rendered."),
  chk("D5", D, "minor", "Composition serves the channel."),
  chk(
    "F1",
    F,
    "advisory",
    "The measured body colour sits in the subject's band.",
    "the measured colour sits outside the product's own band",
    { computed: true }
  ),
  chk(
    "F2",
    F,
    "advisory",
    "The measured colour is not another product's.",
    "the measured colour is another product's in the range",
    { computed: true }
  ),
  chk("E1", E, "critical", "Each frame is its own photograph.", undefined, { set: true }),
  chk("E2", E, "critical", "The set coheres.", undefined, { set: true }),
  chk("E3", E, "minor", "Proof is not repeated.", undefined, { set: true }),
  chk(
    "E4",
    E,
    "critical",
    "A candidate that resembles the anchor's composition is a failure of the range.",
    undefined,
    { set: true }
  ),
];
const byId = (id: string) => CHECKS.find((c) => c.id === id)!;

function measurement(state: string, over: Partial<Measurement> = {}): Measurement {
  return {
    subject: "nakedambition",
    mode: "single",
    box: [0.402, 0.188, 0.597, 0.829],
    located: null,
    stats: { hex: "#ef674e", L: 62, C: 64, h: 38, sampled_box: [0.44, 0.31, 0.56, 0.7] },
    band: { L: 60, a: 0, b: 0, C: 64, h: 38, hex: "#ef674e" },
    colours: null,
    compare: {
      state,
      delta_e00: state === "within" ? 3.82 : state === "off" ? 12.6 : 40.7,
      hue_distance: 0.2,
      dL: 0,
      dC: 0,
      nearest_subject: state === "other_sku" ? "overnight" : "nakedambition",
      line: "The ship's own sentence.",
    },
    state,
    sentence: "",
    lines: { delta_e2000: 10, delta_e2000_set: 12, hue_deg: 15 },
    ...over,
  };
}

function allPass(): Record<string, boolean> {
  return Object.fromEntries(CHECKS.filter((c) => !c.set_level).map((c) => [c.id, true]));
}

function run(checks: Record<string, boolean>, verdict = "PASS"): RunRecord {
  return { verdict, checks, failed: [], failed_advisory: [], unanswered: [] };
}

function job(over: Partial<Job> = {}): Job {
  return {
    id: "bmtest",
    status: "done",
    session: "",
    wave: "",
    created: "",
    updated: null,
    subject: "nakedambition",
    type: "H",
    origin: "generate",
    file: "I:\\x\\H-nakedambition__nano_01.png",
    identity: "I:\\x\\tile.png",
    lane: "nano",
    setting: "default",
    offline: false,
    seconds: { draw: 22.9, measure: 4, stranger: 5, grade: 8 },
    stranger: {
      reads_as: "a coral skincare serum bottle next to a cream swatch",
      part_counts: "two distinct parts",
    },
    measurement: measurement("within"),
    runs: [run(allPass()), run(allPass()), run(allPass())],
    final: {
      ...run(allPass()),
      runs: 3,
      run_verdicts: ["PASS", "PASS", "PASS"],
      split_answers: {},
    },
    results_path: null,
    error: null,
    ...over,
  };
}

/** A done job whose final record carries these changes. */
function judged(
  failIds: string[],
  extra: { split?: Record<string, string>; unanswered?: string[]; verdict?: string } = {}
): Job {
  const checks = allPass();
  for (const id of failIds) checks[id] = false;
  for (const id of extra.unanswered ?? []) delete checks[id];
  const base = job();
  return {
    ...base,
    runs: [run(checks), run(checks), run(checks)],
    final: {
      ...base.final!,
      checks,
      verdict: extra.verdict ?? "FAIL",
      split_answers: extra.split ?? {},
      unanswered: extra.unanswered ?? [],
      failed: failIds.map((id) => ({ id, severity: byId(id).severity, check: byId(id).check })),
    },
  };
}

describe("the colour of a check follows how strictly it holds", () => {
  it("is green when it held on every run", () => {
    expect(checkState(byId("A2"), job())).toBe("pass");
  });
  it("is red when a gate fails on the majority", () => {
    expect(checkState(byId("A3"), judged(["A3"]))).toBe("fail");
    expect(checkState(byId("B4"), judged(["B4"]))).toBe("fail");
  });
  it("is orange when a judged check fails: critical, minor or advisory", () => {
    expect(checkState(byId("C2"), judged(["C2"]))).toBe("review");
    expect(checkState(byId("D3"), judged(["D3"]))).toBe("review");
    expect(checkState(byId("A6"), judged(["A6"]))).toBe("review");
  });
  it("is orange when the runs split, even if the majority passed", () => {
    const j = judged([], { split: { A4: "2/3 said it passed" }, verdict: "PASS" });
    expect(checkState(byId("A4"), j)).toBe("review");
  });
  it("is orange when nobody answered it, before anything else is read", () => {
    const j = judged(["A2"], { unanswered: ["A2"] });
    expect(checkState(byId("A2"), j)).toBe("review");
  });
  it("is n/a when the job predates the check", () => {
    const pre = judged([]);
    delete pre.final!.checks.D5;
    expect(checkState(byId("D5"), pre)).toBe("na");
  });
  it("keeps a measured row waiting until the measurement lands", () => {
    expect(checkState(byId("F1"), job({ measurement: null }))).toBe("pending");
  });
  it("waits, then runs, before the verdict lands", () => {
    expect(checkState(byId("A1"), null)).toBe("pending");
    expect(checkState(byId("A1"), job({ status: "measuring", final: null }))).toBe("pending");
    expect(checkState(byId("A1"), job({ status: "grading", final: null }))).toBe("running");
  });
});

describe("the measured rows settle on the measurement, and say only what was measured", () => {
  const measuring = (state: string) =>
    job({ status: "measuring", final: null, runs: [], measurement: measurement(state) });
  it("settles F before any grade exists", () => {
    expect(checkState(byId("F1"), measuring("within"))).toBe("pass");
    expect(checkState(byId("F2"), measuring("within"))).toBe("pass");
  });
  it("turns F1 orange off the band, and F2 orange on another product's band", () => {
    expect(checkState(byId("F1"), measuring("off"))).toBe("review");
    expect(checkState(byId("F2"), measuring("off"))).toBe("pass");
    expect(checkState(byId("F2"), measuring("other_sku"))).toBe("review");
  });
  it("reads n/a when the ship could not compare, whatever it scored", () => {
    const j = job({ measurement: measurement("not_applied", { box: null }) });
    expect(checkState(byId("F1"), j)).toBe("na");
    const f = blocksOf(CHECKS).find((b) => b.letter === "F")!;
    expect(blockState(f, j)).toBe("na");
    expect(blockReason(f, j)).toBe("The ship's own sentence.");
  });
  it("says the colour in the ship's own numbers", () => {
    expect(colourReason(measurement("within"))).toBe(
      "Within its band: ΔE 3.8, inside the line of 10."
    );
    expect(colourReason(measurement("off"))).toBe(
      "Outside its band: ΔE 12.6, past the line of 10."
    );
    expect(colourReason(measurement("other_sku"))).toBe(
      "Another product's colour: nearer Overnight Sensation's band than its own (ΔE 40.7)."
    );
  });
});

describe("a block is its worst check", () => {
  const blocks = blocksOf(CHECKS);
  it("groups per-frame checks by the rubric's headings, in file order, without the set level", () => {
    expect(blocks.map((b) => b.letter)).toEqual(["A", "B", "C", "D", "F"]);
    expect(blocks.map((b) => b.name)).toEqual([
      "Identity",
      "Proportion and scale",
      "Material and light",
      "Brief and register",
      "Measured colour",
    ]);
    expect(blocks.reduce((n, b) => n + b.checks.length, 0)).toBe(23);
  });
  it("ranks fail over review over pass over n/a, and unsettled over all", () => {
    expect(worst(["pass", "review", "fail"])).toBe("fail");
    expect(worst(["pass", "review", "na"])).toBe("review");
    expect(worst(["pass", "na"])).toBe("pass");
    expect(worst(["na", "na"])).toBe("na");
    expect(worst(["pass", "running"])).toBe("running");
    expect(worst(["fail", "pending"])).toBe("pending");
    expect(worst([])).toBe("na");
  });
  it("settles the measured block first, then A to D in order", () => {
    expect(blocks.map(revealIndex)).toEqual([1, 2, 3, 4, 0]);
  });
});

describe("the line under a block", () => {
  const blocks = blocksOf(CHECKS);
  const block = (l: string) => blocks.find((b) => b.letter === l)!;
  it("says what the block checks before anything has looked", () => {
    expect(blockReason(block("A"), null)).toMatch(/^It is this product/);
  });
  it("counts a clean block", () => {
    expect(blockReason(block("B"), job())).toBe("Held on all 4 checks, 3 of 3 runs.");
  });
  it("names the worst failure in the rubric's plain language, with its vote", () => {
    expect(blockReason(block("A"), judged(["A3", "A4"]))).toBe(
      "the colour or finish is not the product's · 3 of 3 runs · and 1 more"
    );
  });
  it("falls back to the check's own lead when the rubric has no plain caption", () => {
    expect(failReason(byId("C1"))).toBe("not held: material reads as itself");
    expect(failReason(byId("C3"))).toBe("the shadow does not agree with the light");
    expect(boldLead(byId("B1").check)).toBe("Proportions match image 1");
  });
  it("says a split as not sure, with the vote", () => {
    const j = judged([], { split: { A4: "2/3 said it passed" }, verdict: "PASS" });
    expect(blockReason(block("A"), j)).toBe(
      "not sure: nothing invented on the subject · 2 of 3 runs passed it"
    );
  });
});

describe("the verdict card", () => {
  it("maps the rubric's words to their tones", () => {
    expect(verdictTone("PASS")).toBe("pass");
    expect(verdictTone("PASS_WITH_NOTES")).toBe("review");
    expect(verdictTone("RETRY")).toBe("review");
    expect(verdictTone("FAIL")).toBe("fail");
    expect(verdictTone("ERROR")).toBe("na");
    expect(verdictTone(undefined)).toBe("na");
  });
  const checks = CHECKS;
  it("holds when nothing failed", () => {
    expect(verdictLine(job(), checks)).toBe("Held on every check, three runs out of three.");
  });
  it("prefers the grader's worst issue on a real run, the gate's caption otherwise", () => {
    const j = judged(["A5", "B3"]);
    j.final!.worst_issue = "An award roundel sits top right.";
    expect(verdictLine(j, checks)).toBe("An award roundel sits top right.");
    j.offline = true;
    expect(verdictLine(j, checks)).toBe("there is lettering here that is not on the product");
  });
  it("names an advisory colour disagreement without counting it", () => {
    const j = judged([], { verdict: "PASS" });
    j.final!.failed_advisory = [{ id: "F1", severity: "advisory", check: "" }];
    expect(verdictLine(j, checks)).toBe("The measured colour disagrees: advisory, not counted.");
  });
  it("says when no run answered", () => {
    const j = job();
    j.runs = [0, 1, 2].map(() => ({ ...run({}), error: "quota" }));
    expect(verdictLine(j, checks)).toBe("No run answered: quota");
  });
  it("never shows a rehearsal's stub as a stranger's read", () => {
    expect(strangerLine(job())).toBe(
      "A stranger saw “a coral skincare serum bottle next to a cream swatch”, two distinct parts."
    );
    expect(strangerLine(job({ offline: true }))).toBe("No stranger in a rehearsal.");
    expect(strangerLine(job({ stranger: { reads_as: "", offline: true } }))).toBe(
      "No stranger in a rehearsal."
    );
  });
});

describe("where the run is", () => {
  it("reads the phase off the job file", () => {
    expect(phaseOf(null, false)).toBe("idle");
    expect(phaseOf(null, true)).toBe("starting");
    expect(phaseOf(job({ status: "drawing", origin: "upload" }), true)).toBe("placing");
    expect(phaseOf(job({ status: "measuring", measurement: null }), true)).toBe("measuring");
    expect(phaseOf(job({ status: "measuring" }), true)).toBe("stranger");
    expect(phaseOf(job({ status: "grading" }), true)).toBe("grading");
    expect(phaseOf(job(), false)).toBe("done");
  });
  it("counts the grades back, and says the verdict when done", () => {
    const g = job({ status: "grading", final: null, runs: [run(allPass())] });
    expect(phaseWord(g, true, 3)).toBe("Grading · 1 of 3 back");
    expect(phaseWord(job(), false, 3)).toBe("Pass");
  });
  it("lights the steps in order, with their seconds once done", () => {
    const g = job({ status: "grading", final: null });
    expect(phaseSteps(g, true, 3, "generate").map((s) => s.state)).toEqual([
      "done",
      "done",
      "done",
      "active",
    ]);
    const done = phaseSteps(job(), false, 3, "generate");
    expect(done.map((s) => s.seconds)).toEqual([22.9, 4, 5, 8]);
    expect(phaseSteps(null, true, 3, "upload")[0]).toMatchObject({
      label: "Place",
      state: "active",
    });
  });
  it("marks where an erred run stopped", () => {
    const e = job({ status: "error", final: null, stranger: null });
    expect(phaseSteps(e, false, 3, "generate").map((s) => s.state)).toEqual([
      "done",
      "done",
      "stopped",
      "pending",
    ]);
  });
  it("shows each vote, and a run that has not come back", () => {
    const runs = [run({ A2: true }), run({ A2: false })];
    expect(votes("A2", runs, 3)).toEqual(["pass", "fail", "pending"]);
  });
});

describe("the highlight sits on the product", () => {
  it("turns the ship's normalised box into percentages", () => {
    expect(boxStyle([0.393, 0.143, 0.605, 0.86])).toEqual({
      left: "39.3%",
      top: "14.3%",
      width: "21.2%",
      height: "71.7%",
    });
  });
  it("refuses a box that is not one", () => {
    expect(boxStyle(null)).toBeNull();
    expect(boxStyle([0.5, 0.5, 0.4, 0.9])).toBeNull();
    expect(boxStyle([0.1, 0.1, 0.2])).toBeNull();
  });
  it("puts the label below a box that touches the top", () => {
    expect(labelBelow([0.4, 0.02, 0.6, 0.9])).toBe(true);
    expect(labelBelow([0.4, 0.19, 0.6, 0.83])).toBe(false);
  });
  it("reads an aspect ratio", () => {
    expect(arOf("1:1")).toBe(1);
    expect(arOf("4:5")).toBe(0.8);
    expect(arOf("3:2")).toBe(1.5);
    expect(arOf(undefined)).toBe(1);
  });
});

describe("the evals", () => {
  it("checks a case as the product its name says, never as its colour", () => {
    const files: Array<[string, string | null, string, string]> = [
      ["neg-beyourbest-washed-out__neg_01.png", "H-beyourbest__nano_01.png", "beyourbest", "H"],
      [
        "neg-beyourbest-wordmark-erased__neg_01.png",
        "H-beyourbest__nano_02.png",
        "beyourbest",
        "H",
      ],
      [
        "neg-nakedambition-hue-minus20__neg_01.png",
        "H-nakedambition__nano_01.png",
        "nakedambition",
        "H",
      ],
      [
        "neg-nakedambition-hue-plus20__neg_01.png",
        "H-nakedambition__nano_01.png",
        "nakedambition",
        "H",
      ],
      [
        "neg-nakedambition-roundel__neg_01.png",
        "H-nakedambition__nano_01.png",
        "nakedambition",
        "H",
      ],
      [
        "neg-nakedambition-to-plum__neg_01.png",
        "H-nakedambition__nano_02.png",
        "nakedambition",
        "H",
      ],
      ["neg-overnight-claim-text__neg_01.png", "H-overnight__nano_02.png", "overnight", "H"],
      ["neg-overnight-gloss__neg_01.png", "H-overnight__nano_01.png", "overnight", "H"],
      ["pos-H-beyourbest__nano_01__pos_01.png", null, "beyourbest", "H"],
      ["pos-H-nakedambition__nano_01__pos_01.png", null, "nakedambition", "H"],
      ["pos-H-overnight__nano_01__pos_01.png", null, "overnight", "H"],
    ];
    for (const [file, from, subject, type] of files) {
      expect(caseTarget(file, from)).toEqual({ subject, type });
    }
    expect(caseTarget("neg-nakedambition-to-plum__neg_01.png", null)).toEqual({
      subject: "nakedambition",
      type: "H",
    });
    expect(caseTarget("holiday.png", null)).toBeNull();
  });
  it("says held or missed by the weakest pinned check", () => {
    expect(
      negativeResult({ held: true, must_fail: ["F1", "A3"], hits: { F1: 3, A3: 3 } }, 3).word
    ).toBe("Held 3/3");
    expect(negativeResult({ held: false, must_fail: ["A3", "C1"], hits: {} }, 3).word).toBe(
      "Missed 0/3"
    );
    expect(positiveResult({ pass_fraction: 1 }, 3)).toEqual({ clean: true, word: "Clean 3/3" });
    expect(positiveResult({ pass_fraction: 0.33 }, 3)).toEqual({ clean: false, word: "Noisy 1/3" });
  });
  it("reads the degrees of freedom off the rubric's severities", () => {
    const { fixed, adapted } = strictness(CHECKS);
    expect(fixed.map((c) => c.id)).toEqual(["A1", "A2", "A3", "A4", "A5", "A7", "B4"]);
    expect(adapted.map((b) => b.letter)).toEqual(["A", "B", "C", "D", "F"]);
    expect(adapted.flatMap((b) => b.checks).length).toBe(16);
  });
});
