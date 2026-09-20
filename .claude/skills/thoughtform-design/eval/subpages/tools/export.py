r"""The same judgment, written in the formats other people's tools read.

    python tools/export.py --to plugin-eval           the port's cases, runnable
    python tools/export.py --to plugin-eval --out DIR
    python tools/export.py --to environment --repo ../ship --out DIR
    python tools/export.py --to environment --repo ../ship --out DIR --with-content

Nothing here is a new source of truth. Both exports are renderings of files
that already exist and stay where they are: `evals/evals.json` at the port,
`skill/references/rubric.md` and `evals/ledger.jsonl` on a ship. Delete an
export and nothing is lost.

**`plugin-eval`** turns the port's twenty-two behavioural cases into a suite
`claude plugin eval` can run. The cases have been written and maintained since
0.1.0 with no runner at all: the `checks` were regexes nothing executed and the
`assertions` were prose for a model to read. This is the runner, and it brings
one thing the format did not have — a no-plugin baseline, so a case that passes
because the model would have got there anyway stops counting as evidence the
skill works.

Mapping, and where it is lossy:

    prompt        -> prompt.md body
    dimension     -> a tag, so `--tag instrument` runs one dimension
    checks[]      -> one regex grader per check; `kind: forbidden` becomes
                     `match: not_contains`; the `any` list becomes an
                     alternation, and a check with `all` becomes one grader per
                     pattern, because a regex grader is one pattern
    assertions[]  -> one llm grader carrying every assertion as a PASS list
    band: fixed   -> weight 2. The band says a miss is a block; a weight is the
                     nearest thing the format has, and it is not the same thing.

The band is the lossy part and it is named here rather than hidden: `fixed`
means the answer is wrong without it, and a weighted average cannot express
that. Read a failed `fixed` grader as a block whatever the case scored.

**`environment`** writes one ship's work in the shape this kind of task is
usually packaged in: `tasks.jsonl`, `rubric.json` as a weighted checklist,
`gold.jsonl` from the ticks, `grader.md` as the contract the model grader is
held to, and `README.md`. The severities map straight onto the weighting that
such checklists use, because they are the same idea arrived at from the other
direction — ours from rejected work, theirs from training runs:

    gate      -> essential   any failure kills the asset
    critical  -> important   one failure means redraw
    minor     -> optional    two mean redraw, one is a note
    negative anchor -> pitfall

**A bundle carries the rubric, and the rubric is the client's.** Every item in
it was earned by their rejected work on their subjects; this repo's first law
is that such judgment never travels. So a bundle from any ship but the
throwaway fixture **refuses without `--consented`**, which is a sentence
somebody has to mean and not a flag to reach for. `--with-content` adds the
prompts and the filenames on top of that, and says so.

Even with consent, a bundle carries no pixels: task ids, hashes, counts, the
checklist and the person's selections.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import config  # noqa: E402

FIXTURE_CALLSIGN = "petrel"      # the throwaway engagement tests/make_fixture.py builds

SEVERITY_WEIGHT = {"gate": "essential", "critical": "important",
                   "minor": "optional", "advisory": "reporting"}


def _slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-")
    return s or "case"


# Python takes inline flags, JavaScript does not, and the port's cases have
# carried `(?i)` since the first of them because nothing ever executed them.
# Found by running one case for real: four of its five regex graders threw
# `unrecognized character after (?` and scored zero, which is the same result a
# broken check gives and a failing one, and the two are not the same thing.
# The flag is set in the frontmatter, so the prefix is redundant as well as
# fatal.
_INLINE_FLAGS = re.compile(r"\(\?[aiLmsux]+\)")


def _to_js(pattern: str) -> tuple[str, list[str]]:
    """(pattern, notes). A JavaScript-safe form of a Python regex, with every
    change named rather than made quietly: a silently rewritten pattern is a
    check that no longer says what its author wrote."""
    notes, out = [], str(pattern)
    if _INLINE_FLAGS.search(out):
        out = _INLINE_FLAGS.sub("", out)
        notes.append("inline flags removed; case-insensitivity is `flags: i` above")
    for construct, what in (("(?P<", "a named group"), ("(?#", "a comment group")):
        if construct in out:
            notes.append("carries " + what + ", which JavaScript does not read; "
                         "this grader will throw and its case will score low for "
                         "the wrong reason")
    return out, notes


# ------------------------------------------------------------ plugin-eval ---

def _grader_from_check(check: dict) -> list[tuple[str, str]]:
    """(filename, file text) per grader. A check with `any` is one grader with
    an alternation; a check with `all` is one grader per pattern, because a
    regex grader holds one pattern and an `all` that became an alternation
    would pass on any one of its parts."""
    out = []
    forbidden = check.get("kind") == "forbidden"
    weight = 2 if check.get("band") == "fixed" else 1
    name = _slug(check.get("id") or check.get("text") or "check")

    def one(pattern, suffix=""):
        head = ["---", "type: regex",
                "pattern: " + json.dumps(pattern),
                "target: last_message"]
        if forbidden:
            head.append("match: not_contains")
        head.append("flags: i")
        if weight != 1:
            head.append("weight: " + str(weight))
        head.append("---")
        body = [""]
        body.append(("MUST NOT be present. " if forbidden else "MUST be present. ")
                    + str(check.get("text") or "").strip())
        body.append("")
        body.append("Dimension: " + str(check.get("dimension") or "-")
                    + ". Band: " + str(check.get("band") or "-")
                    + (". A miss is a block; the weight above is the nearest thing "
                       "this format has to that." if check.get("band") == "fixed"
                       else "."))
        return name + suffix + ".md", "\n".join(head + body) + "\n"

    if check.get("any"):
        # Translate each arm before joining. An inline flag left in the middle
        # of an alternation is past the point where a prefix substitution can
        # see it, and the whole pattern throws.
        arms = [_to_js(str(p))[0] for p in check["any"]]
        out.append(one("(" + "|".join(arms) + ")"))
    for i, pat in enumerate(check.get("all") or [], 1):
        out.append(one(str(pat), "-" + str(i)))
    if not out:
        out.append(one(re.escape(str(check.get("text") or "")[:40])))
    return out


def _llm_grader(case: dict) -> str:
    lines = ["---", "type: llm", "focus: last_message", "---", ""]
    lines.append("PASS if the reply does all of the following:")
    lines.append("")
    for a in case.get("assertions") or []:
        lines.append("- " + str(a).strip())
    lines.append("")
    lines.append("FAIL if it misses any of them, or if it proposes a move the list "
                 "above rules out.")
    lines.append("")
    lines.append("Judge what the reply says, not how it is formatted. A correct "
                 "answer in an unexpected shape is a pass.")
    return "\n".join(lines) + "\n"


def plugin_eval(port: str, out_dir: str, check_only: bool = False) -> int:
    """Build every file first, then write or compare. A suite that is generated
    and committed goes stale the same way the timeline does, so it gets the same
    `--check`: the export is a rendering, and a rendering that no longer matches
    its source is worse than none, because it looks current."""
    src = os.path.join(port, "evals", "evals.json")
    if not os.path.isfile(src):
        config.die("no evals/evals.json at " + src)
    with open(src, encoding="utf-8") as f:
        suite = json.load(f)

    # The skill's own frontmatter name, which is what the Skill tool records and
    # what a `tool_used` grader has to match. Read, never assumed: the suite's
    # most useful grader would silently never fire if this were a copy that had
    # drifted from the file.
    skill_name = suite.get("skill_name") or "armada"
    skill_md = os.path.join(port, "SKILL.md")
    if os.path.isfile(skill_md):
        m = re.search(r"^name:\s*(\S+)\s*$",
                      open(skill_md, encoding="utf-8").read()[:2000], re.M)
        if m:
            skill_name = m.group(1).strip()

    files = {}      # relative path -> text
    for case in suite.get("evals", []):
        cid = case.get("id") or _slug(case.get("name", "case"))

        dims = sorted({str(c.get("dimension")) for c in case.get("checks") or []
                       if c.get("dimension")})
        front = ["---", "max_turns: 12",
                 "allowed_tools: [Read, Glob, Grep, Skill]"]
        if dims:
            front.append("tags: [" + ", ".join(dims) + "]")
        if case.get("expected_output"):
            # For humans, not used at run time, and the one place the case's own
            # answer survives into the suite.
            front.append("description: " + json.dumps(
                " ".join(str(case["expected_output"]).split())[:280]))
        front.append("---")
        files[cid + "/prompt.md"] = ("\n".join(front) + "\n\n"
                                     + str(case.get("prompt", "")).strip() + "\n")

        for check in case.get("checks") or []:
            for fname, text in _grader_from_check(check):
                files[cid + "/graders/" + fname] = text
        if case.get("assertions"):
            files[cid + "/graders/criteria.md"] = _llm_grader(case)

        # Did the skill fire at all? Excluded from the score in both arms by
        # design - a check that cannot pass without the plugin would push the
        # baseline to zero and inflate the delta - and reported as an indicator.
        # It is the first thing to read when a case scores well and the delta is
        # flat, because that means the model got there without the skill.
        files[cid + "/graders/skill-fired.md"] = (
            "---\ntype: tool_used\ntool: Skill\n"
            "input_match: '\"skill\"\\s*:\\s*\"(?:[\\w-]+:)?" + skill_name
            + "\"'\n---\n\nThe skill was invoked, bare or namespaced. An "
              "indicator, not a score: it cannot pass without the plugin, so "
              "counting it would inflate the delta it is meant to explain.\n")

    files["README.md"] = """# The port's cases, as a runnable suite

Generated by `python tools/export.py --to plugin-eval` from `evals/evals.json`,
which stays the source of truth. Regenerate rather than editing here;
`--to plugin-eval --check` fails when this directory is behind the JSON.

```bash
claude plugin eval . --case <name> --runs 1 --ablation none --max-cost-usd 2
claude plugin eval . --max-cost-usd 20
```

Iterate with one arm and one run; confirm at the default three, which is the
same rule the image grader has had since the beginning and for the same reason.
The second form runs both arms and reports the no-plugin baseline, which is the
thing this format adds that the JSON never had: a case that passes because the
model would have got there anyway is not evidence that the skill works.

Every eval run and every judge grader is a real model call. Pin both models in
CI so a model release is not read as a regression, and always pass a cost
ceiling.

## Two things to read before believing a score

**`band: fixed` in the source became weight 2 here**, because a weighted
average cannot say *block*. A failed `fixed` grader is a block whatever the
case scored.

**A `skill-fired` indicator that fails is the finding**, whatever else passed:
it means the model answered without the skill, so the case is measuring the
model and not this repo.
"""

    if check_only:
        stale = []
        for rel, text in sorted(files.items()):
            path = os.path.join(out_dir, rel.replace("/", os.sep))
            try:
                with open(path, encoding="utf-8") as f:
                    if f.read() != text:
                        stale.append(rel + " differs")
            except OSError:
                stale.append(rel + " is missing")
        on_disk = set()
        for root, _d, names in os.walk(out_dir):
            if "results" in os.path.relpath(root, out_dir).split(os.sep):
                continue
            for n in names:
                on_disk.add(os.path.relpath(os.path.join(root, n),
                                            out_dir).replace(os.sep, "/"))
        for rel in sorted(on_disk - set(files)):
            if not rel.startswith("results/"):
                stale.append(rel + " is not in evals.json any more")
        if stale:
            print("  suite       " + out_dir + " is stale; run "
                  "tools/export.py --to plugin-eval")
            for s in stale[:8]:
                print("    " + s)
            if len(stale) > 8:
                print("    ... and " + str(len(stale) - 8) + " more")
            return 1
        print("  suite       current, " + str(len(files) - 1) + " files")
        return 0

    for rel, text in sorted(files.items()):
        path = os.path.join(out_dir, rel.replace("/", os.sep))
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(text)

    cases = len({r.split("/")[0] for r in files if "/" in r})
    print("  cases       " + str(cases))
    print("  graders     " + str(sum(1 for r in files if "/graders/" in r)))
    print("  out         " + out_dir)
    print("  run one     claude plugin eval . --case <name> --runs 1 "
          "--ablation none --max-cost-usd 2")
    return 0


# ------------------------------------------------------------ environment ---

def environment(repo: str, out_dir: str, with_content: bool, consented: bool) -> int:
    cfg = config.load(os.path.join(repo, "armada.toml"), fresh=True)
    ship = config.callsign(cfg)

    # A bundle is not a harvest note. A harvest note is scrubbed because it is a
    # lesson about the method; a bundle carries the RUBRIC, which is the client's
    # own judgment, earned on their subjects and paid for by their rejected work.
    # The repo's first law is that this never travels, so no flag is enough on
    # its own: the fixture exports freely because it belongs to nobody, and every
    # real ship needs a person to say the conversation happened.
    if ship != FIXTURE_CALLSIGN and not consented:
        config.die("a bundle from " + ship + " carries that engagement's rubric, "
                   "which is their judgment and not the method's: every item in it "
                   "was earned by their rejected work on their subjects. Whether it "
                   "leaves is theirs to decide, so --consented is a sentence you "
                   "have to mean and not a flag you reach for. Export the fixture "
                   "ship to see the shape.")
    if with_content and ship != FIXTURE_CALLSIGN:
        print("  NOTE        --with-content adds this client's prompts and filenames "
              "on top of the rubric. Make sure that is what was agreed, not just "
              "that a bundle was.")

    rubric_path = os.path.join(repo, "skill", "references", "rubric.md")
    checks = config.load_checks(rubric_path)
    rows = config.ledger_rows(os.path.join(repo, "evals", "ledger.jsonl"))
    draws = [r for r in rows if r["kind"] == "draw"]
    grades = {r["candidate"]: r for r in rows if r["kind"] == "grade"}
    ticks = [r for r in rows if r["kind"] == "tick"]
    decodes = [r for r in rows if r["kind"] == "decode"]

    os.makedirs(out_dir, exist_ok=True)
    manifests = {}
    if with_content:
        for wave in sorted({d.get("wave") for d in draws if d.get("wave")}):
            try:
                manifests.update(config.load_manifest(config.wave_dir(wave, cfg=cfg)))
            except SystemExit:
                pass

    # ---- tasks: one per draw, which is one attempt at one slot
    with open(os.path.join(out_dir, "tasks.jsonl"), "w", encoding="utf-8",
              newline="\n") as f:
        for d in draws:
            task = {"task": d["candidate"], "wave": d.get("wave"),
                    "slot": d.get("slot"), "type": d.get("type"),
                    "subject": d.get("subject"), "setting": d.get("setting"),
                    "repair": d.get("repair"), "references": d.get("refs"),
                    "lane": d.get("lane"), "model": d.get("model"),
                    "settings": {"ar": d.get("ar"), "size": d.get("size"),
                                 "quality": d.get("quality")},
                    "prompt_sha": d.get("prompt_sha"),
                    "prompt_chars": d.get("prompt_chars"),
                    "ok": d.get("ok")}
            if with_content:
                for name, row in manifests.items():
                    if config.candidate_id(d.get("wave") or "", name) == d["candidate"]:
                        task["file"] = name
                        task["prompt"] = row.get("prompt")
                        break
            f.write(json.dumps(task, ensure_ascii=False) + "\n")

    # ---- the rubric as a weighted checklist
    blocks = {}
    for c in checks:
        blocks.setdefault(c["block"], []).append(c)
    rubric = {
        "version": config.rubric_version(rubric_path),
        "gating": config.rubric_gates(rubric_path),
        "weights": SEVERITY_WEIGHT,
        "ladder": {"FAIL": "any essential item fails",
                   "RETRY": "any important item fails, or two optional",
                   "PASS_WITH_NOTES": "exactly one optional fails",
                   "PASS": "clean"},
        "runs": 3,
        "tie": "fail",
        "items": [{"id": c["id"], "block": c["block"],
                   "weight": SEVERITY_WEIGHT.get(c["severity"], "optional"),
                   "severity": c["severity"], "set_level": c["set_level"],
                   "criterion": c["check"], "fails_when": c["fails_when"]}
                  for c in checks],
    }
    with open(os.path.join(out_dir, "rubric.json"), "w", encoding="utf-8",
              newline="\n") as f:
        json.dump(rubric, f, ensure_ascii=False, indent=1)
        f.write("\n")

    # ---- gold: what the person actually decided
    tags = {}
    for d in decodes:
        tags.setdefault(d["candidate"], []).append(d.get("tag"))
    with open(os.path.join(out_dir, "gold.jsonl"), "w", encoding="utf-8",
              newline="\n") as f:
        for t in ticks:
            g = grades.get(t["candidate"]) or {}
            f.write(json.dumps({
                "task": t["candidate"], "slot": t.get("slot"),
                "label": ("approved" if t.get("approved")
                          else ("rejected" if t.get("redo") else "unmarked")),
                "best_of_slot": bool(t.get("best")),
                "by": t.get("who"),
                "failure_modes": tags.get(t["candidate"], []),
                "grader_said": g.get("verdict"),
                "grader_agreed": (
                    None if not g.get("verdict") else
                    (g["verdict"] in ("PASS", "PASS_WITH_NOTES")) == bool(t.get("approved"))),
            }, ensure_ascii=False) + "\n")

    grader = """# The grader contract

Two passes per candidate, temperature zero, strict JSON.

**1. The stranger's read.** One call that sees only the candidate: no subject
name, no references. It names the main subject in one noun phrase, says what it
appears to be for, and counts the distinct parts it can see. A prompt that names
the subject gets the subject's name back whatever is in the picture, which is
why this is a separate call and not a section of the next one.

**2. The rubric read.** The candidate first, then the reference that is the
subject's identity truth, then up to two further views the draw was generated
with. Every per-frame item in `rubric.json` is answered true or false, with a
note on each failure.

```json
{"reads_as": "<one noun phrase>",
 "part_count_note": "<what you counted against the reference>",
 "checks": {"A1": true, "A2": false},
 "worst_issue": "<one short phrase, or empty>",
 "notes": "<one or two sentences>"}
```

## The rules that make it comparable

- **Unanswered is unsure is a failure.** An item the grader did not answer
  counts as failed, and is listed separately so a silent grader is visible.
- **Three runs, majority per item, ties fail.** One grade moves the verdict on
  about a quarter of a wave between runs. Every candidate whose verdict was
  unstable across runs is named rather than averaged away.
- **Set-level items are never asked of one frame.** They are graded across the
  whole set, because they are what a person actually names and no single image
  can carry one.
- **The verdict is a floor, not a decision.** A fail means look harder. An item
  that fails a frame the person approved is a defect in the instrument, and
  `gold.jsonl` is where that shows up.
"""
    with open(os.path.join(out_dir, "grader.md"), "w", encoding="utf-8",
              newline="\n") as f:
        f.write(grader)

    approved = sum(1 for t in ticks if t.get("approved"))
    best = sum(1 for t in ticks if t.get("best"))
    readme = """# An environment bundle

Generated by `python tools/export.py --to environment` from one engagement's
rubric and ledger. Regenerate rather than editing; nothing here is a source of
truth.

| File | Holds |
|---|---|
| `tasks.jsonl` | One row per attempt: the slot it was, the lane and settings it ran on, a hash of the prompt |
| `rubric.json` | The checklist, weighted by severity, with the verdict ladder and the three-run rule |
| `gold.jsonl` | What the person decided: approved or rejected, the best of each contested slot, the failure mode a rejection was decoded to, and whether the grader agreed |
| `grader.md` | The contract the model grader is held to |

%(counts)s

## What is not here, and why

**No prompts and no pixels**, unless the bundle was made with `--with-content`,
which refuses any ship but the throwaway fixture without `--consented`. A
client's prompts are the client's; that is a conversation, never a flag.

**No thresholds ported from anywhere.** Every item in the rubric was earned by
rejected work on this engagement's own subjects. The machinery travels between
engagements and the judgment does not, which is the whole method and the reason
a bundle from one is not a template for another.

## What makes the gold worth having

`gold.jsonl` carries **selections**, not scores. Where a slot had more than one
attempt, the person marked which was best, and that comparison is the reliable
label: asked to score pictures one at a time, expert annotators disagree with
themselves; asked which of a matched set is best, they agree with each other.

`grader_agreed` is the column to read first. It is the only thing here that
says whether an automated judgment of this work can be trusted at all.
""" % {"counts": ("Tasks: %d. Items: %d. Labels: %d, of which %d approved and %d "
                  "marked best of a contested slot."
                  % (len(draws), len(checks), len(ticks), approved, best))}
    with open(os.path.join(out_dir, "README.md"), "w", encoding="utf-8",
              newline="\n") as f:
        f.write(readme)

    print("  ship        " + ship)
    print("  tasks       " + str(len(draws)))
    print("  items       " + str(len(checks)) + "  (rubric "
          + config.rubric_version(rubric_path) + ")")
    print("  gold        " + str(len(ticks)) + " labels, " + str(approved)
          + " approved, " + str(best) + " best-of-slot")
    print("  content     " + ("prompts and filenames included"
                              if with_content else "ids and hashes only"))
    print("  out         " + out_dir)
    if not ticks:
        print("\n  No labels: this ship has no ticks yet, so the bundle has a rubric "
              "and no ground truth. Review a wave through the gallery first.")
    return 0


# --------------------------------------------------------------------- cli ---

def main() -> None:
    ap = argparse.ArgumentParser(
        description="Render the port's cases, or one ship's work, in the formats "
                    "other people's tools read.")
    ap.add_argument("--to", required=True, choices=("plugin-eval", "environment"))
    ap.add_argument("--repo", default=None, metavar="PATH",
                    help="the ship, for --to environment")
    ap.add_argument("--port", default=None, metavar="PATH",
                    help="the home port, for --to plugin-eval")
    ap.add_argument("--out", default=None, metavar="DIR")
    ap.add_argument("--with-content", action="store_true",
                    help="include prompts and filenames; refused on a real ship "
                         "without --consented")
    ap.add_argument("--check", action="store_true",
                    help="exit 1 when the export on disk is behind its source")
    ap.add_argument("--consented", action="store_true",
                    help="the client has been asked whether their rubric may leave, "
                         "and said yes. Required for every ship but the fixture")
    a = ap.parse_args()

    if a.to == "plugin-eval":
        port = os.path.abspath(os.path.expanduser(a.port or str(config.REPO)))
        out = os.path.abspath(a.out or os.path.join(port, "evals", "suite"))
        raise SystemExit(plugin_eval(port, out, a.check))

    if a.check:
        config.die("--check is for --to plugin-eval. An environment bundle is made "
                   "for one conversation and kept nowhere, so there is nothing for "
                   "it to be stale against.")
    repo = os.path.abspath(os.path.expanduser(a.repo or str(config.REPO)))
    out = os.path.abspath(a.out or os.path.join(repo, "evals", "environment"))
    raise SystemExit(environment(repo, out, a.with_content, a.consented))


if __name__ == "__main__":
    main()
