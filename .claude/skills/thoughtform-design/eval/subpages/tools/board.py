r"""What goes on the client board, and what the caption under it has to say.

    python tools/board.py "<wave dir>"
    python tools/board.py "<wave dir>" --drop L-bowl --force-clean P-carafe

Every slot gets its best draw. **A grey box on a client page says nothing; a
frame with its defect written under it says exactly where the boundary is**,
which is more useful and just as honest. A missing slot invites the reader to
imagine either a triumph or a disaster and gives them no way to tell which; a
labelled near-miss lets them judge the actual distance, and tells them the
pipeline noticed. So this produces two lists rather than one:

    clean    - best draw is PASS or PASS_WITH_NOTES. Goes up as work.
    flagged  - best draw still fails a check. Goes up with the failure named, in
               the client's own language, so nobody has to guess whether we saw it.

The distinction is the whole point. Filling a board by quietly lowering the bar
is how a pipeline stops being trustworthy; filling it with the bar visible is
how the bar gets argued about, which is what a review is for.

Captions come from the rubric's `## Plain language` table via
`config.plain_captions`, falling back to each check's own bold lead. A caption
saying "A2" tells a reviewer nothing; a caption saying the mark is wrong lets
them judge it.

**Nothing here decides.** A human reads the flagged list and can move any row
into `clean` or drop it entirely - `--force-clean` and `--drop` take slot names.
When `picks.json` is beside the wave it is honoured: the board shows what the
pick chose, so the two documents can never disagree in front of a client.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import config  # noqa: E402
from pick import by_slot, graded, rank, results_path, unanimous  # noqa: E402

CLEAN_FLOOR = config.VERDICT_RANK["PASS_WITH_NOTES"]

# A draw carrying no verdict this build understands is not clean and it is not
# a failure either. It goes up flagged, and the caption says the true thing
# rather than nothing: an empty caption under a frame is the grey box again.
UNGRADED_CAPTION = "this draw was never graded"


def _v(entry) -> str:
    return str(entry.get("verdict") or "ungraded")


def _slots(values):
    """`--drop A,B --drop C` and `--drop A --drop B` mean the same thing."""
    out = set()
    for v in values or []:
        out.update(s.strip() for s in v.split(",") if s.strip())
    return out


def main():
    ap = argparse.ArgumentParser(description="Decide what goes on the client board.")
    ap.add_argument("wave", help="a wave directory, or a qa_results.json")
    ap.add_argument("--out", default=None, help="default board.json beside the wave")
    ap.add_argument("--picks", default=None,
                    help="a picks.json to honour (default: picks.json beside the wave, "
                         "if one is there)")
    ap.add_argument("--force-clean", dest="force_clean", action="append", default=[],
                    metavar="SLOT", help="treat this slot as clean; repeatable, "
                                         "or a comma list")
    ap.add_argument("--drop", action="append", default=[], metavar="SLOT",
                    help="leave this slot off the board; repeatable, or a comma list")
    a = ap.parse_args()

    path, wave = results_path(a.wave)
    if not os.path.exists(path):
        config.die("no graded results at " + path + ". Run tools/qa.py first.")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    if data.get("grader") == "offline-fake":
        print("  OFFLINE     these verdicts came from the fake grader. Nothing below "
              "belongs in front of a client.")

    picks_path = a.picks or os.path.join(wave, "picks.json")
    picks = {}
    if os.path.exists(picks_path):
        with open(picks_path, encoding="utf-8") as f:
            picks = (json.load(f).get("picked") or {})
        print("  picks       " + picks_path + "  (" + str(len(picks)) + " slots)")

    captions = config.plain_captions()
    forced, dropped = _slots(a.force_clean), _slots(a.drop)
    slots = by_slot(data)
    unknown_slots = (forced | dropped) - set(slots)

    clean, flagged, empty = {}, {}, []
    for slot, rows in sorted(slots.items()):
        if slot in dropped:
            empty.append(slot)
            continue
        rows = sorted(rows, key=lambda r: (-rank(r["verdict"]), not unanimous(r),
                                           r["file"]))
        best, source = rows[0], "best of wave"
        chosen = (picks.get(slot) or {}).get("file")
        if chosen:
            hit = next((r for r in rows if r["file"] == chosen), None)
            if hit is not None:
                best, source = hit, "picks.json"
        note = "; ".join(dict.fromkeys(
            captions.get(f["id"], f["id"]) for f in best.get("failed", [])))
        if not graded(best):
            note = UNGRADED_CAPTION
        entry = {
            "file": best["file"],
            "verdict": best.get("verdict"),
            "source": source,
            "graded": graded(best),
            "unstable": not unanimous(best),
            "failed": [f["id"] for f in best.get("failed", [])],
            "note": note,
            "worst": best.get("worst_issue", ""),
            "draws_considered": len(rows),
        }
        if slot in forced:
            entry["forced_clean"] = True
            clean[slot] = entry
        elif graded(best) and rank(best["verdict"]) >= CLEAN_FLOOR:
            clean[slot] = entry
        else:
            flagged[slot] = entry

    out = {"wave": data.get("wave") or os.path.basename(wave),
           "runs": data.get("runs", 1),
           "rubric_version": data.get("rubric_version", "unknown"),
           "gating": data.get("gating", False),
           "clean": clean, "flagged": flagged, "empty": empty}
    out_path = a.out or os.path.join(wave, "board.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)

    print("\n  CLEAN - goes up as work")
    for s, e in clean.items():
        print("    " + s.ljust(18) + _v(e).ljust(17) + e["file"].ljust(34)
              + ("forced " if e.get("forced_clean") else "")
              + ("unstable" if e["unstable"] else ""))
    if not clean:
        print("    (none)")
    print("\n  FLAGGED - goes up with the defect named")
    for s, e in flagged.items():
        print("    " + s.ljust(18) + _v(e).ljust(17) + e["file"].ljust(34)
              + (e["note"] or e["worst"])[:64])
    if not flagged:
        print("    (none)")
    if empty:
        print("\n  EMPTY on purpose: " + ", ".join(empty))
    for s in sorted(unknown_slots):
        print("  NOTE        " + s + " was named on the command line but is not a slot "
              "in this wave; nothing was done with it")

    print("\n  " + str(len(clean)) + " clean, " + str(len(flagged)) + " flagged, "
          + str(len(empty)) + " empty   of " + str(len(slots)) + " slots")
    print("  " + out_path)
    print("  Nothing here decided anything. Read the flagged list before it goes out.")


if __name__ == "__main__":
    main()
