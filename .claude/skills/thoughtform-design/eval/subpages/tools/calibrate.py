r"""The instrument, measured against the person. Never the other way round.

    python tools/calibrate.py                write evals/CALIBRATION.md
    python tools/calibrate.py --check        exit 1 when the file is stale
    python tools/calibrate.py --rubric 0.1.2 one rubric version only

Reads the ledger and asks, per check: **when the person said a frame was good,
did this check say so too, and when the person sent one back, did this check
catch it?** Those two rates are the only evidence there is about whether a
check is ready to decide anything, because agreement with the person is the
only ground truth a picture has.

The method already names the cost - *expect the grader to be uncalibrated for
roughly thirty verdicted draws* - and every engagement so far predicted it and
paid it. This file is that budget, counted.

**How a tick becomes labels.** An approved frame is the person saying every
check passed on it: it is a pass label for all of them, because approval is a
statement about the whole frame. A frame sent back is the person saying
something failed, and `/decode` says which: the check the comment decoded to
gets a fail label, and every other check on that frame gets *nothing*. Not a
pass - the person never looked at the rest once they saw the defect, and a
silent pass invented there would be the calibration data lying about itself.

    TPR  of the frames the person approved, the share this check passed
    TNR  of the frames the person sent back FOR THIS CHECK, the share it failed

A check reaches `gate-ready` at thirty labels and eighty per cent both ways.
Ninety is the aim. Below either, it stays advisory, which is what the rubric
already says in words and `qa.py` prints on every run.

**Nothing here edits the rubric.** The mirror rule holds: a person reads this
and changes the English, and the grader's behaviour changes with it. A tool
that flipped a gate on a number would be a second place where the instrument
is decided, and the two would disagree on the day it mattered.

The one row that outranks every rate is `contradicted`: a check that fails a
frame the person approved. That is a defect in the instrument and not in the
frame, it does not average away, and it is listed by candidate so it can be
looked at.
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import config  # noqa: E402

OUT = os.path.join("evals", "CALIBRATION.md")


# ------------------------------------------------------------------ labels ---

class Labels:
    """What the person said, per check, from the ticks and the decodes."""

    def __init__(self, rows, rubric=None):
        self.rows = rows
        # One grade per candidate: the newest, or the newest under `rubric`.
        # The rule is config's so the fleet report picks the same row.
        self.grades = config.latest_grades(rows, rubric)
        self.ticks = [r for r in rows if r["kind"] == "tick"]
        self.decodes = [r for r in rows if r["kind"] == "decode"]

        self.approved = {t["candidate"] for t in self.ticks if t.get("approved")}
        self.redone = {t["candidate"] for t in self.ticks if t.get("redo")}
        self.best = {t["candidate"] for t in self.ticks if t.get("best")}
        # A frame can be ticked twice (the owner, then the client). The later
        # row wins, which is file order, because a second reading of the same
        # frame is a correction and not a second opinion.
        for t in self.ticks:
            if t.get("approved"):
                self.redone.discard(t["candidate"])
            elif t.get("redo"):
                self.approved.discard(t["candidate"])

        self.fail_labels = {}          # check id -> {candidate ids}
        for d in self.decodes:
            self.fail_labels.setdefault(d["tag"], set()).add(d["candidate"])

    def undecoded(self):
        """Frames the person sent back that nobody has decoded into a failure
        mode. Each is a label nobody can use, and the most valuable unread thing
        on the ship: it is a defect with a sentence attached and no name."""
        named = set()
        for ids in self.fail_labels.values():
            named |= ids
        return sorted(self.redone - named)

    def per_check(self, check_id, rubric=None):
        """(agreed_pass, of_pass, agreed_fail, of_fail, contradicting ids)."""
        ok = bad = 0
        of_ok = of_bad = 0
        contradicted = []
        for cand in sorted(self.approved):
            g = self.grades.get(cand)
            if not g or (rubric and g.get("rubric") != rubric):
                continue
            c = (g.get("checks") or {}).get(check_id)
            if not c or not c.get("of"):
                continue
            of_ok += 1
            if c["pass"] * 2 > c["of"]:          # the majority, ties fail
                ok += 1
            else:
                contradicted.append(cand)
        for cand in sorted(self.fail_labels.get(check_id, ())):
            g = self.grades.get(cand)
            if not g or (rubric and g.get("rubric") != rubric):
                continue
            c = (g.get("checks") or {}).get(check_id)
            if not c or not c.get("of"):
                continue
            of_bad += 1
            if c["pass"] * 2 <= c["of"]:
                bad += 1
        return ok, of_ok, bad, of_bad, contradicted


def state_of(n, tpr, tnr, contradicted):
    """Where a check stands. `contradicted` outranks every rate: a check that
    marks down work the person approved is wrong about what it is for, and no
    amount of agreement elsewhere makes it ready to decide."""
    if contradicted:
        return "contradicted"
    if n < config.CALIBRATION_N:
        return "unlabelled"
    if tpr is not None and tnr is not None \
            and tpr >= config.AGREEMENT_FLOOR and tnr >= config.AGREEMENT_FLOOR:
        return "gate-ready"
    return "advisory"


def corrected(observed, tpr, tnr):
    """The true pass rate behind a judge with known error rates, by the standard
    prevalence correction: (observed + TNR - 1) / (TPR + TNR - 1). It answers
    the question the raw pass rate cannot - *what share of the frames nobody
    ticked would the person actually keep* - and it is undefined when the judge
    is no better than a coin, which is itself the finding."""
    if tpr is None or tnr is None:
        return None
    denom = tpr + tnr - 1
    if denom <= 0.05:
        return None
    return min(1.0, max(0.0, (observed + tnr - 1) / denom))


def _pct(x):
    return "-" if x is None else ("%.0f%%" % (x * 100))


# ------------------------------------------------------------------- build ---

def build(rows, cfg, ship, rubric=None, checks=None, gating=False, harness="") -> str:
    lab = Labels(rows, rubric)
    checks = checks or []
    by_id = {c["id"]: c for c in checks}
    grades = list(lab.grades.values())
    versions = sorted({r.get("rubric") or "" for r in rows if r.get("kind") == "grade"}
                      - {""})

    out = []
    out.append("# Calibration")
    out.append("")
    out.append("Generated by `tools/calibrate.py` from `" + config.LEDGER_FILE
               + "`. Never hand-edited; regenerate after a handback is read.")
    out.append("")
    out.append("What the instrument said, measured against what the person said. "
               "Agreement with the person is the only ground truth a picture has, "
               "so these are the only numbers that can say whether a check is "
               "ready to decide anything.")
    out.append("")
    out.append("- **" + str(len(lab.approved)) + "** frames approved, **"
               + str(len(lab.redone)) + "** sent back, **" + str(len(lab.best))
               + "** marked best of their slot.")
    out.append("- **" + str(len(grades)) + "** graded candidates"
               + (" at rubric " + rubric if rubric else
                  (" across rubric " + ", ".join(versions) if versions else ""))
               + ".")
    out.append("- The rubric currently **" + ("gates" if gating else "reports only")
               + "**. A check gates when a person removes *reporting only* from "
                 "`skill/references/rubric.md`, never because a number here moved.")
    out.append("")
    out.append("A check is **gate-ready** at " + str(config.CALIBRATION_N)
               + " labels and " + str(int(config.AGREEMENT_FLOOR * 100))
               + "% agreement both ways; " + str(int(config.AGREEMENT_TARGET * 100))
               + "% is the aim. **Contradicted** outranks every rate: a check that "
                 "fails a frame the person approved is a defect in the instrument.")
    out.append("")

    if not checks:
        out.append("No rubric at `skill/references/rubric.md`, so there is no per-check "
                   "table: this ship's instrument is not in the harness's shape, and "
                   "only the frame-level agreement below can be read.")
        out.append("")
    else:
        out.append("| Check | Severity | Agreed on good | Agreed on bad | Labels | State |")
        out.append("|---|---|---|---|---|---|")
    tally = {}
    contradictions = []
    for c in checks:
        if c["set_level"]:
            continue
        ok, of_ok, bad, of_bad, contra = lab.per_check(c["id"], rubric)
        tpr = (ok / of_ok) if of_ok else None
        tnr = (bad / of_bad) if of_bad else None
        n = of_ok + of_bad
        st = state_of(n, tpr, tnr, contra)
        tally[st] = tally.get(st, 0) + 1
        if contra:
            contradictions.append((c["id"], contra))
        out.append("| " + c["id"] + " | " + c["severity"] + " | "
                   + _pct(tpr) + " of " + str(of_ok) + " | "
                   + _pct(tnr) + " of " + str(of_bad) + " | "
                   + str(n) + " | " + st + " |")
    if checks:
        out.append("")
        out.append("  ·  ".join(k + " " + str(v) for k, v in sorted(tally.items()))
                   or "no checks parsed")
        out.append("")

    # ---- the frame level
    keepable = [g for g in grades if g.get("verdict") in ("PASS", "PASS_WITH_NOTES")]
    observed = (len(keepable) / len(grades)) if grades else None
    agree_ok = sum(1 for c in lab.approved
                   if (lab.grades.get(c) or {}).get("verdict") in ("PASS", "PASS_WITH_NOTES"))
    agree_bad = sum(1 for c in lab.redone
                    if (lab.grades.get(c) or {}).get("verdict") in ("RETRY", "FAIL"))
    f_tpr = (agree_ok / len(lab.approved)) if lab.approved else None
    f_tnr = (agree_bad / len(lab.redone)) if lab.redone else None

    out.append("## The frame")
    out.append("")
    out.append("| | |")
    out.append("|---|---|")
    out.append("| Graded candidates | " + str(len(grades)) + " |")
    out.append("| The grader would keep | " + _pct(observed) + " |")
    out.append("| Of the frames the person approved, the grader kept | "
               + _pct(f_tpr) + " of " + str(len(lab.approved)) + " |")
    out.append("| Of the frames the person sent back, the grader flagged | "
               + _pct(f_tnr) + " of " + str(len(lab.redone)) + " |")
    corr = corrected(observed, f_tpr, f_tnr) if observed is not None else None
    out.append("| Corrected for that, the person would keep | " + _pct(corr) + " |")
    unstable = sum(1 for g in grades if g.get("unstable"))
    out.append("| Verdict moved between runs | " + str(unstable) + " of "
               + str(len(grades)) + " |")
    out.append("")
    if corr is None and observed is not None:
        out.append("The correction is undefined: the grader's two rates do not yet "
                   "add to more than a coin, so there is nothing to correct towards. "
                   "That is the finding, not a gap in the data.")
        out.append("")

    # ---- draws per keeper, per lane
    draws = [r for r in rows if r["kind"] == "draw"]
    if draws:
        lanes = {}
        for d in draws:
            e = lanes.setdefault(d.get("lane") or "?", {"n": 0, "usd": 0.0, "s": 0.0})
            e["n"] += 1
            e["usd"] += float(d.get("usd") or 0)
            e["s"] += float(d.get("seconds") or 0)
        keeper_by_lane = {}
        cand_lane = {d["candidate"]: (d.get("lane") or "?") for d in draws}
        for cand in (lab.approved or {g["candidate"] for g in keepable}):
            ln = cand_lane.get(cand)
            if ln:
                keeper_by_lane[ln] = keeper_by_lane.get(ln, 0) + 1
        out.append("## The lane")
        out.append("")
        out.append("Draws per keeper is the ratio the next routing decision is made "
                   "on, and never a total. "
                   + ("Keepers here are the person's ticks."
                      if lab.approved else
                      "Nobody has ticked these waves, so keepers here are the "
                      "grader's, which is a different number wearing the same name."))
        out.append("")
        out.append("| Lane | Draws | Keepers | Draws per keeper | Seconds per keeper | USD per keeper |")
        out.append("|---|---|---|---|---|---|")
        for ln in sorted(lanes):
            e = lanes[ln]
            k = keeper_by_lane.get(ln, 0)
            per = ("%.1f" % (e["n"] / k)) if k else "-"
            secs = ("%.0f" % (e["s"] / k)) if k and e["s"] else "-"
            usd = ("$%.2f" % (e["usd"] / k)) if k and e["usd"] else "-"
            out.append("| " + ln + " | " + str(e["n"]) + " | " + str(k) + " | "
                       + per + " | " + secs + " | " + usd + " |")
        out.append("")

    # ---- what the instrument cannot see
    unknown_tags = sorted({d["tag"] for d in lab.decodes
                           if not d.get("maps_to_check")})
    if unknown_tags or contradictions or lab.undecoded():
        out.append("## What to read before the next wave")
        out.append("")
    if contradictions:
        out.append("**Contradicted checks.** Each of these failed a frame the person "
                   "approved. Fix the check in `skill/references/rubric.md` and record "
                   "it in the repair history; never redraw an approved frame to "
                   "satisfy a check.")
        out.append("")
        for cid, cands in contradictions:
            lead = (by_id.get(cid) or {}).get("check", "")
            lead = lead.split(".")[0].replace("**", "").strip()[:70]
            out.append("- `" + cid + "` (" + lead + ") on " + str(len(cands))
                       + " approved frame(s): " + ", ".join(cands[:6]))
        out.append("")
        out.append("Frames are named by id here and never by filename, because a "
                   "filename carries the subject and this file is in git. "
                   "`python tools/ledger.py find <id>` opens the one you want.")
        out.append("")
    if unknown_tags:
        out.append("**Failure modes with no check.** The person named these and the "
                   "instrument cannot see any of them. A check sees only what it "
                   "names, and a class of defect with no check fails invisibly for "
                   "as many rounds as you have.")
        out.append("")
        for t in unknown_tags:
            n = len(lab.fail_labels.get(t, ()))
            out.append("- `" + t + "` — " + str(n) + " frame(s)")
        out.append("")
    und = lab.undecoded()
    if und:
        out.append("**Comments nobody has decoded**: " + str(len(und))
                   + ". Each is a defect with a sentence attached and no name, and "
                     "until it has one it cannot be a label for anything. Run "
                     "`/decode` on the wave.")
        out.append("")

    if not lab.ticks:
        out.append("## No ticks yet")
        out.append("")
        out.append("Nothing above has a person in it. Build the review page for a "
                   "wave, tick it, save the handback beside the wave, and run "
                   "`python tools/ledger.py tick --handback <file>`. Until then the "
                   "grader is measured against nothing, which is exactly what "
                   "*reporting only* means.")
        out.append("")

    out.append("---")
    out.append("")
    out.append("Ship " + ship + ", harness " + (harness or config.armada_version()) + ", "
               + dt.date.today().isoformat() + ".")
    return "\n".join(out).rstrip() + "\n"


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Measure the instrument against the person, from the ledger.")
    ap.add_argument("--out", default=None, help="write here instead of " + OUT)
    ap.add_argument("--check", action="store_true",
                    help="exit 1 when the file on disk differs from the ledger")
    ap.add_argument("--rubric", default=None, metavar="VERSION",
                    help="one rubric version only, so a repair is not averaged "
                         "with what it replaced")
    ap.add_argument("--repo", default=None, metavar="PATH",
                    help="the ship to read (default: the repo this tool lives in)")
    a = ap.parse_args()

    # Bound to one repo, like the ledger: the port reads a ship's ledger and
    # rubric and writes into that ship's evals/, never its own.
    b = config.bind(a.repo)
    cfg, ship = b.cfg, b.callsign
    rows = config.ledger_rows(b.ledger)
    if not rows:
        print("  no ledger at " + b.ledger + ". Run "
              "`python tools/ledger.py wave \"<wave dir>\"`, or `--rebuild` for "
              "every wave on the drive.")
        raise SystemExit(0)
    checks = config.load_checks(b.rubric) if b.has_rubric() else []
    gating = b.rubric_gates()

    text = build(rows, cfg, ship, a.rubric, checks, gating, b.harness())
    out = a.out or os.path.join(b.root, OUT)

    if a.check:
        try:
            with open(out, encoding="utf-8") as f:
                current = f.read()
        except OSError:
            print("  calibration " + out + " is missing; run tools/calibrate.py")
            raise SystemExit(1)
        if current != text:
            print("  calibration " + out + " is stale; run tools/calibrate.py")
            raise SystemExit(1)
        print("  calibration current")
        raise SystemExit(0)

    os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)

    lab = Labels(rows, a.rubric)
    per_frame = [c for c in checks if not c["set_level"]]
    ready = 0
    for c in per_frame:
        ok, of_ok, bad, of_bad, contra = lab.per_check(c["id"], a.rubric)
        tpr = (ok / of_ok) if of_ok else None
        tnr = (bad / of_bad) if of_bad else None
        if state_of(of_ok + of_bad, tpr, tnr, contra) == "gate-ready":
            ready += 1
    print("  calibration " + out)
    print("  labels      " + str(len(lab.approved)) + " approved, "
          + str(len(lab.redone)) + " sent back, " + str(len(lab.decodes)) + " decoded")
    if per_frame:
        print("  checks      " + str(ready) + " of " + str(len(per_frame))
              + " gate-ready at " + str(config.CALIBRATION_N) + " labels and "
              + str(int(config.AGREEMENT_FLOOR * 100)) + "% both ways")
    else:
        print("  checks      none; no rubric in the harness shape aboard")
    print("  the rubric  " + ("gates" if gating else "reports only"))
    print("\n  Nothing here changes the rubric. A check gates when a person removes "
          "'reporting only' from the English, which is the only place the "
          "instrument is decided.")
    raise SystemExit(0)


if __name__ == "__main__":
    main()
