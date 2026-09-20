r"""Best draw per slot, from a graded wave.

    python tools/pick.py "<wave dir>"
    python tools/pick.py "<wave dir>" --min PASS --out picks.json

Ranks strictly, through `config.VERDICT_RANK`: PASS beats PASS_WITH_NOTES beats
RETRY beats FAIL. Treating the two pass tiers as equal once cost a clean draw to
a prefix-matching bug in a prior engagement, so the ranking is never inferred
from the string.

**An unknown verdict is not a low verdict, it is an ungraded one.** A results
file carrying a verdict this build has never heard of once fell through to a
default that put it BELOW an explicit FAIL, so every slot whose other draws
carried the unrecognised word surfaced its failed draw instead. Unknown sits
above FAIL and below RETRY here, the same place the contact sheet and the review
gallery put it - but it is **never picked**, because a draw nobody graded cannot
be the best one. It is named in the output rather than sorted away.

**Never promote from a tie.** When the best two draws of a slot score the same
and the score is not a clean PASS, the slot is reported as undecided rather than
resolved by filename order - equal scores mean the rubric did not discriminate,
not that the candidates are equivalent. A tie at PASS is the one exception: two
clean draws are two clean draws, and refusing to ship either helps nobody.

**A draw all runs agreed on beats one they argued about**, at the same verdict.
A prior wave produced the case: two draws both graded PASS, one unanimously and
one on two runs of three, and sorting by filename picked the wobbly one.

A repair draw (a suffix, per `config.is_repair`) and the draw it repairs share a
slot. **The repair wins only on a strictly better verdict** than the best draw it
repairs; a tie leaves the original in place, because a repair that did not
measurably improve anything is not an improvement.

**A person's best-of-slot outranks all of it.** Where the ledger carries a
`best` tick for a slot, that draw is the pick and the ranking above is not
consulted: when a measurement disagrees with a frame the person chose, the
measurement is what is wrong. The output says which slots were decided that way,
because a shortlist that hides where its answers came from is a shortlist nobody
can argue with.

Nothing here is a decision either. `picks.json` is a shortlist for a person.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import config  # noqa: E402

# Image extensions only, and never a working file. A results file can still
# carry rows for display copies and crops from before those were pruned: they
# are the same pictures at lower quality and must never win a slot.
_IMAGE = (".png", ".jpg", ".jpeg", ".webp")

# The one thing the contract cannot say: where an unknown or absent verdict
# sits. Above FAIL and below RETRY, matching `make_contact_sheet.py` and
# `make_review_gallery.py`, so the three tools never disagree about the order of
# the same wave. See the docstring for the failure that fixed this.
UNGRADED_RANK = config.VERDICT_RANK["FAIL"] + 0.5


def rank(verdict: str) -> float:
    return config.VERDICT_RANK.get(verdict or "", UNGRADED_RANK)


def graded(rec) -> bool:
    """A verdict this build understands. Only these can win a slot."""
    return rec.get("verdict") in config.VERDICT_RANK


def unanimous(rec) -> bool:
    return len(set(rec.get("run_verdicts") or [])) <= 1


def results_path(wave: str) -> tuple[str, str]:
    """Accepts the wave directory or the results file itself."""
    wave = os.path.normpath(wave)
    if os.path.isfile(wave):
        return wave, os.path.dirname(wave) or "."
    return os.path.join(wave, "qa_results.json"), wave


def by_slot(data) -> dict:
    out = {}
    for r in data.get("results", []):
        name = r.get("file") or ""
        if not name.lower().endswith(_IMAGE) or name.startswith("_"):
            continue
        out.setdefault(config.slot_of(name), []).append(r)
    return out


def eligible(rows):
    """Originals, plus only those repairs that beat every original outright."""
    originals = [r for r in rows if not config.is_repair(r["file"])]
    repairs = [r for r in rows if config.is_repair(r["file"])]
    if not originals:
        return repairs, []
    bar = max(rank(r["verdict"]) for r in originals)
    kept = [r for r in repairs if rank(r["verdict"]) > bar]
    refused = [r for r in repairs if rank(r["verdict"]) <= bar]
    return originals + kept, refused


def choose(rows):
    """(pick, why) for one slot. `why` is 'picked', 'undecided' or 'below'."""
    rows = sorted(rows, key=lambda r: (-rank(r["verdict"]), not unanimous(r), r["file"]))
    best = rows[0]
    rivals = [r for r in rows
              if rank(r["verdict"]) == rank(best["verdict"])
              and unanimous(r) == unanimous(best)]
    if len(rivals) > 1 and best["verdict"] != "PASS":
        return best, "undecided", len(rivals)
    return best, "picked", len(rivals)


def human_bests(wave_name):
    """Every candidate the person marked best of its slot in this wave, by id.
    Read from the ledger, which is where a handback lands; a ship with no ledger
    yet simply has none, and the ranking decides as it always did.

    Keyed on the candidate and never on the slot: a ledger row's slot is an id
    whose subject half is hashed, so joining on it would mean hashing here too
    and agreeing forever about how. The candidate id is already the join."""
    try:
        rows = config.ledger_rows()
    except Exception:                       # noqa: BLE001 - the picker still picks
        return set()
    return {r.get("candidate") for r in rows
            if r.get("kind") == "tick" and r.get("wave") == wave_name and r.get("best")}


def main():
    ap = argparse.ArgumentParser(description="Best draw per slot, from a graded wave.")
    ap.add_argument("wave", help="a wave directory, or a qa_results.json")
    ap.add_argument("--min", default="PASS_WITH_NOTES",
                    help="lowest verdict allowed to be picked (default %(default)s)")
    ap.add_argument("--out", default=None,
                    help="default picks.json beside the wave")
    a = ap.parse_args()

    if a.min not in config.VERDICT_RANK:
        config.die("--min " + repr(a.min) + " is not a verdict. Known: "
                   + ", ".join(sorted(config.VERDICT_RANK,
                                      key=lambda v: -config.VERDICT_RANK[v])))
    floor = config.VERDICT_RANK[a.min]

    path, wave = results_path(a.wave)
    if not os.path.exists(path):
        config.die("no graded results at " + path + ". Run tools/qa.py first.")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    if data.get("grader") == "offline-fake":
        print("  OFFLINE     these verdicts came from the fake grader. They are a "
              "pipeline test, not a grading, and nothing below should be shipped.")
    if data.get("runs", 1) < 2:
        print("  NOTE        these grades are single-shot. On a prior corpus one "
              "grade moved the verdict on a quarter of a wave; do not pick from them.")

    slots = by_slot(data)
    wave_label = data.get("wave") or os.path.basename(wave)
    chosen = human_bests(wave_label)
    picked, undecided, below, refused_repairs, unknown = {}, [], [], [], []
    by_person = []
    for slot, rows in sorted(slots.items()):
        for r in rows:
            if not graded(r):
                unknown.append((r["file"], r.get("verdict")))

        # The person's own best, before any of the ranking runs. It is not
        # ranked against anything, and the repair rule does not veto it either:
        # a frame someone chose by eye outranks the instrument that was built
        # to predict what they would choose.
        mine = [r for r in rows
                if config.candidate_id(wave_label, r["file"]) in chosen]
        if mine:
            r = mine[0]
            picked[slot] = {"file": r["file"], "verdict": r.get("verdict") or "",
                            "unstable": not unanimous(r),
                            "draws_considered": len(rows), "by": "person"}
            by_person.append(slot)
            continue

        rows, refused = eligible(rows)
        refused_repairs.extend((r["file"], r["verdict"]) for r in refused)
        if not rows:
            continue
        best, why, rivals = choose(rows)
        if not graded(best):
            # It sorts above FAIL so it stays visible; it is still not a grade,
            # so it cannot be the answer to "which one do we send".
            below.append({"slot": slot, "verdict": best.get("verdict"),
                          "file": best["file"],
                          "worst_issue": "this draw carries no verdict this build "
                                         "understands; it was never graded"})
            continue
        if rank(best["verdict"]) < floor:
            below.append({"slot": slot, "verdict": best["verdict"],
                          "file": best["file"],
                          "worst_issue": (best.get("worst_issue") or "")[:80]})
            continue
        if why == "undecided":
            undecided.append({"slot": slot, "verdict": best["verdict"],
                              "tied": rivals,
                              "files": [r["file"] for r in rows
                                        if rank(r["verdict"]) == rank(best["verdict"])]})
            continue
        picked[slot] = {"file": best["file"], "verdict": best["verdict"],
                        "unstable": not unanimous(best),
                        "draws_considered": len(rows), "by": "grader"}

    for slot, e in picked.items():
        print("  " + slot.ljust(18) + (e["verdict"] or "ungraded").ljust(17)
              + e["file"].ljust(36)
              + ("CHOSEN BY EYE " if e.get("by") == "person" else "")
              + ("UNSTABLE" if e["unstable"] else ""))
    for u in undecided:
        print("  " + u["slot"].ljust(18) + "undecided        " + str(u["tied"])
              + " draws tied at " + u["verdict"] + " - the rubric did not discriminate")
    for b in below:
        print("  " + b["slot"].ljust(18) + "none             best was "
              + str(b["verdict"]) + "  " + b["worst_issue"])
    for f, v in refused_repairs:
        print("  repair refused    " + f.ljust(36) + v
              + " did not beat the draw it repairs")
    for f, v in unknown:
        print("  UNGRADED          " + f.ljust(36) + repr(v)
              + " - no verdict this build understands; it can never be picked")

    print("\n  " + str(len(picked)) + " picked, " + str(len(undecided))
          + " undecided, " + str(len(below)) + " with nothing above " + a.min
          + "   (" + str(len(slots)) + " slots)")
    if by_person:
        print("  " + str(len(by_person)) + " of them chosen by eye in the gallery, "
              "not by the ranking: " + ", ".join(sorted(by_person)))
    if picked:
        print("\n  --pick " + ",".join(sorted(picked)))
        print("  files  " + ",".join(picked[s]["file"] for s in sorted(picked)))

    out = a.out or os.path.join(wave, "picks.json")
    payload = {"wave": wave_label,
               "picked": {s: {"file": e["file"], "verdict": e["verdict"],
                              "by": e.get("by", "grader")}
                          for s, e in picked.items()},
               "undecided": undecided,
               "below_floor": below}
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=1)
    print("  " + out)


if __name__ == "__main__":
    main()
