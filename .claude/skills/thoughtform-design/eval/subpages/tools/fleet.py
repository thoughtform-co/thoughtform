r"""What the fleet did, read across every ship that reported home.

    python tools/fleet.py                 write harvest/FLEET.md
    python tools/fleet.py --check         exit 1 when the file is stale
    python tools/fleet.py --html          also write harvest/fleet.html
    python tools/fleet.py --port DIR --out FILE

Reads `harvest/ledger/<callsign>.jsonl`, the rows each ship sent home, and
answers the questions no ship can answer from inside itself. Ships by callsign
and never by client, because that is all the rows carry.

**The first section is the negative space**, and it is the point. A stack of
waves shows what was built; this shows what was not recorded. A ship with five
hundred draws and no ticks is not a ship with a good grader, it is a ship whose
grader has never been measured against anybody, and the fleet could not see
that before these rows came home.

Every number arrives with its denominator. A rate with no n is a rate nobody
can argue with, and the fleet is exactly where a small n hides: four labels at
eighty per cent is three frames and a rounding.

What this may not do, and does not:

- **No mean of means.** A fleet figure is a count and a rate per callsign. Two
  ships of very different sizes averaged together produce a number that
  describes neither.
- **No comparison across rubric versions.** A rubric bump changes what a pass
  is, so the drift section holds each version's own rate side by side rather
  than subtracting them into a trend.
- **No comparison on single-shot grades.** A wave graded once is excluded from
  the lane section by name, because one grade moves the verdict on a quarter of
  a wave.
- **No empty verdict.** A results file that borrowed the shape to carry labels
  rather than grades is dropped at the ship's ledger and again here.

Generated and never hand-edited, like the timeline; `--check` fails when it is
stale. Everything here is the standard library.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import config  # noqa: E402

OUT = os.path.join("harvest", "FLEET.md")
HTML_OUT = os.path.join("harvest", "fleet.html")
LEDGER_DIR = os.path.join("harvest", "ledger")

# Below this many labels a rate is a rounding. It is not a threshold for
# anything; it is the point at which the report stops printing a percentage and
# prints the fraction, so nobody quotes four labels as eighty per cent.
MIN_RATE_N = 8


def _pct(n, of):
    if not of:
        return "-"
    if of < MIN_RATE_N:
        return str(n) + "/" + str(of)
    return "%.0f%% of %d" % (100.0 * n / of, of)


def read_ledgers(port):
    """{callsign: [rows]}, from harvest/ledger/*.jsonl."""
    d = os.path.join(port, LEDGER_DIR)
    out = {}
    if not os.path.isdir(d):
        return out
    for name in sorted(os.listdir(d)):
        if not name.endswith(".jsonl"):
            continue
        callsign = name[: -len(".jsonl")]
        rows = config.ledger_rows(os.path.join(d, name))
        if rows:
            out[callsign] = rows
    return out


class Ship:
    """One ship's rows, indexed the few ways every section needs."""

    def __init__(self, callsign, rows):
        self.callsign = callsign
        self.rows = rows
        self.draws = [r for r in rows if r["kind"] == "draw"]
        # An empty verdict is a labelling pass wearing the results shape. The
        # ship drops it; this drops it again, because one such file on one arc
        # would put a blank tier into every rate the fleet computes.
        self.grades = [r for r in rows if r["kind"] == "grade" and (r.get("verdict") or "")]
        # One grade per candidate for every rate; every grade for the drift
        # section. The rule is config's so the calibration picks the same row.
        self.latest = config.latest_grades(rows)
        self.ticks = [r for r in rows if r["kind"] == "tick"]
        self.decodes = [r for r in rows if r["kind"] == "decode"]
        self.promotes = [r for r in rows if r["kind"] == "promote"]
        # Keyed on the wave id, never the stored name: two waves whose names
        # scrub to the same placeholder are still two waves (0.8.2).
        self.waves = sorted({config.wave_key(r) for r in rows if r.get("wave")})
        self.versions = sorted({g.get("rubric") or "" for g in self.grades} - {""})
        self.approved = {t["candidate"] for t in self.ticks if t.get("approved")}
        self.redone = {t["candidate"] for t in self.ticks if t.get("redo")}
        self.best = {t["candidate"] for t in self.ticks if t.get("best")}
        self.armada = sorted({r.get("armada") or "" for r in rows} - {""})

    def grade_of(self, cand):
        return self.latest.get(cand)


# ---------------------------------------------------------------- sections ---

def inventory(ships):
    out = ["## What the fleet has recorded", ""]
    out.append("The negative space first. A ship with draws and no ticks has a "
               "grader nobody has measured against anything, which is not the "
               "same as a grader that works.")
    out.append("")
    out.append("| Ship | Harness | Waves | Draws | Graded | Approved | Sent back | Best-of-slot | Decoded |")
    out.append("|---|---|---|---|---|---|---|---|---|")
    for s in ships:
        out.append("| " + s.callsign + " | " + (", ".join(s.armada) or "-") + " | "
                   + str(len(s.waves)) + " | " + str(len(s.draws)) + " | "
                   + str(len(s.latest)) + " | " + str(len(s.approved)) + " | "
                   + str(len(s.redone)) + " | " + str(len(s.best)) + " | "
                   + str(len(s.decodes)) + " |")
    out.append("")
    silent = [s.callsign for s in ships if s.draws and not s.ticks]
    if silent:
        out.append("**No person in the record on " + str(len(silent)) + " ship(s): "
                   + ", ".join(silent) + ".** Those ships have drawn and graded and "
                   "nobody's judgment has been written down, so nothing about their "
                   "instruments can be said. The review page builds from the wave; the "
                   "handback is saved beside it; `ledger.py tick --handback` is the "
                   "whole step.")
        out.append("")
    return out


def economics(ships):
    out = ["## What a keeper costs", ""]
    out.append("Draws per keeper is the ratio the next routing decision is made on, "
               "and never a total. Where a ship has ticks the keeper is the person's; "
               "where it has none it is the grader's, which is a different number "
               "wearing the same name, and the column says which.")
    out.append("")
    out.append("| Ship | Lane | Draws | Keepers | Whose | Draws per keeper | Seconds per keeper | USD per keeper |")
    out.append("|---|---|---|---|---|---|---|---|")
    any_row = False
    for s in ships:
        if not s.draws:
            continue
        lanes = {}
        for d in s.draws:
            e = lanes.setdefault(d.get("lane") or "?", {"n": 0, "s": 0.0, "usd": 0.0,
                                                        "keep": 0})
            e["n"] += 1
            e["s"] += float(d.get("seconds") or 0)
            e["usd"] += float(d.get("usd") or 0)
        whose = "person" if s.approved else "grader"
        keepers = s.approved or {c for c, g in s.latest.items()
                                 if g["verdict"] in ("PASS", "PASS_WITH_NOTES")}
        for d in s.draws:
            if d["candidate"] in keepers:
                lanes.setdefault(d.get("lane") or "?", {"n": 0, "s": 0.0, "usd": 0.0,
                                                        "keep": 0})["keep"] += 1
        for ln in sorted(lanes):
            e = lanes[ln]
            k = e["keep"]
            out.append("| " + s.callsign + " | " + ln + " | " + str(e["n"]) + " | "
                       + str(k) + " | " + (whose if k else "-") + " | "
                       + (("%.1f" % (e["n"] / k)) if k else "-") + " | "
                       + (("%.0f" % (e["s"] / k)) if k and e["s"] else "-") + " | "
                       + (("$%.2f" % (e["usd"] / k)) if k and e["usd"] else "-") + " |")
            any_row = True
    if not any_row:
        out.append("| - | - | - | - | - | - | - | - |")
    out.append("")
    unpriced = [s.callsign for s in ships
                if s.draws and not any(d.get("usd") for d in s.draws)]
    if unpriced:
        out.append("No lane price on " + str(len(unpriced)) + " ship(s): "
                   + ", ".join(unpriced) + ". A price is one line in "
                   "`[models.prices]`, and without it the cost column is blank rather "
                   "than guessed.")
        out.append("")
    return out


def calibration(ships):
    out = ["## Does the instrument agree with the person", ""]
    out.append("At the frame, per ship: of the frames the person approved, how many "
               "the grader would have kept; of the frames they sent back, how many it "
               "flagged. Under " + str(MIN_RATE_N) + " labels the fraction is printed "
               "rather than a percentage, because a percentage of four is a rounding. "
               "A label on a frame the grader never graded is not a disagreement and "
               "is not in the rate; the labels column says how many there are.")
    out.append("")
    out.append("| Ship | Labels | Grader kept what they approved | Grader flagged what they rejected | Unstable verdicts |")
    out.append("|---|---|---|---|---|")
    for s in ships:
        if not s.ticks:
            out.append("| " + s.callsign + " | 0 | - | - | "
                       + str(sum(1 for g in s.latest.values() if g.get("unstable"))) + " of "
                       + str(len(s.latest)) + " |")
            continue
        # Only a labelled frame the grader also graded can agree or disagree.
        # 2026-09-13, the first report with rows: one ship's twenty-five
        # approvals read as "0% kept" because none of them had a grade, and a
        # donor's hundred and forty-two finals the same, which is an instrument
        # that was never pointed at the frame, not one that was wrong.
        graded_ok = [c for c in s.approved if s.grade_of(c)]
        graded_bad = [c for c in s.redone if s.grade_of(c)]
        ok = sum(1 for c in graded_ok
                 if s.grade_of(c).get("verdict") in ("PASS", "PASS_WITH_NOTES"))
        bad = sum(1 for c in graded_bad
                  if s.grade_of(c).get("verdict") in ("RETRY", "FAIL"))
        ungraded = (len(s.approved) - len(graded_ok)) + (len(s.redone) - len(graded_bad))
        labels = str(len(s.approved) + len(s.redone))
        if ungraded:
            labels += " (" + str(ungraded) + " with no grade)"
        out.append("| " + s.callsign + " | " + labels
                   + " | " + (_pct(ok, len(graded_ok)) if graded_ok else "-") + " | "
                   + (_pct(bad, len(graded_bad)) if graded_bad else "-") + " | "
                   + str(sum(1 for g in s.latest.values() if g.get("unstable"))) + " of "
                   + str(len(s.latest)) + " |")
    out.append("")
    labelled = [s for s in ships if s.ticks]
    if len(labelled) > 1:
        out.append("**The calibration budget, across ships.** The method says to expect "
                   "about " + str(config.CALIBRATION_N) + " verdicted draws before the "
                   "instrument matches the person. Each ship above is one reading of "
                   "whether that holds; a second ship reaching the same count with the "
                   "same agreement is what would make it a law rather than a budget.")
        out.append("")
    elif labelled:
        out.append("One ship has labels. A budget confirmed on one ship is a note; "
                   "twice is a law.")
        out.append("")
    return out


def drift(ships):
    """Pass rate per rubric version on the same wave. Never subtracted into a
    trend: a rubric bump changes what a pass is, so the versions sit side by
    side and a person reads them."""
    out = ["## What a rubric change did", ""]
    rows = []
    for s in ships:
        by_wave, label = {}, {}
        for g in s.grades:
            k = config.wave_key(g)
            label[k] = g.get("wave") or "?"
            by_wave.setdefault(k, {}).setdefault(g.get("rubric") or "?", []).append(g)
        for wave, versions in sorted(by_wave.items(), key=lambda kv: (label[kv[0]], kv[0])):
            if len(versions) < 2:
                continue
            for v in sorted(versions):
                gs = versions[v]
                keep = sum(1 for g in gs if g["verdict"] in ("PASS", "PASS_WITH_NOTES"))
                rows.append((s.callsign, label[wave], v, len(gs), _pct(keep, len(gs))))
    if not rows:
        out.append("No wave has been graded under two rubric versions yet. When one "
                   "is, both gradings sit here side by side: the versions are never "
                   "subtracted into a trend, because a rubric bump changes what a pass "
                   "is and the difference would be measuring two things at once.")
        out.append("")
        return out
    out.append("The same frames, graded again after the instrument changed. Read the "
               "rows against each other; do not subtract them.")
    out.append("")
    out.append("| Ship | Wave | Rubric | Graded | Keepable |")
    out.append("|---|---|---|---|---|")
    for r in rows:
        out.append("| " + " | ".join(str(x) for x in r) + " |")
    out.append("")
    return out


def failure_modes(ships):
    out = ["## What the instruments cannot see", ""]
    blind, named = {}, {}
    for s in ships:
        for d in s.decodes:
            tag = d.get("tag") or "?"
            bucket = named if d.get("maps_to_check") else blind
            bucket.setdefault(tag, set()).add(s.callsign)
    if not blind and not named:
        out.append("No comment has been decoded yet. A comment is the only place a "
                   "*why* is recorded, and `/decode` on the ship is what turns one "
                   "into a failure mode.")
        out.append("")
        return out
    if blind:
        out.append("**Named by a person, with no check anywhere.** A class of defect "
                   "with no check fails invisibly for as many rounds as you have. A "
                   "mode on two ships is a law candidate; on one, a note.")
        out.append("")
        out.append("| Failure mode | Ships |")
        out.append("|---|---|")
        for tag in sorted(blind):
            out.append("| `" + tag + "` | " + ", ".join(sorted(blind[tag])) + " |")
        out.append("")
    if named:
        out.append("Decoded to a check the rubric already had: "
                   + ", ".join("`" + t + "` (" + ", ".join(sorted(named[t])) + ")"
                               for t in sorted(named)) + ".")
        out.append("")
    return out


def saturation(ships):
    out = ["## Where a wave has stopped teaching", ""]
    rows = []
    for s in ships:
        by_wave, label = {}, {}
        for g in s.latest.values():
            k = config.wave_key(g)
            label[k] = g.get("wave") or "?"
            by_wave.setdefault(k, []).append(g)
        for wave, gs in sorted(by_wave.items(), key=lambda kv: (label[kv[0]], kv[0])):
            if not gs:
                continue
            clean = sum(1 for g in gs if g["verdict"] == "PASS")
            cands = {g["candidate"] for g in gs}
            redone = len(cands & s.redone)
            if clean == len(gs) and redone:
                rows.append((s.callsign, label[wave], len(gs), redone))
    if not rows:
        out.append("No wave yet where the grader passed everything and the person "
                   "still sent frames back. That is the shape to watch for: it means "
                   "the rubric has run out of things it can see, and the next check "
                   "has to come from a comment rather than from the brief.")
        out.append("")
        return out
    out.append("**The grader passed everything and the person still sent frames "
               "back.** The instrument has run out of what it can see on these waves; "
               "the next check comes from a comment, never from the brief.")
    out.append("")
    out.append("| Ship | Wave | Graded | Sent back anyway |")
    out.append("|---|---|---|---|")
    for r in rows:
        out.append("| " + " | ".join(str(x) for x in r) + " |")
    out.append("")
    return out


def lanes(ships):
    """Lane against lane, only where the grading can carry the comparison."""
    out = ["## Lane against lane", ""]
    good, dropped = {}, set()
    for s in ships:
        multi = {config.wave_key(g) for g in s.latest.values() if (g.get("runs") or 1) >= 3}
        single = {config.wave_key(g) for g in s.latest.values() if (g.get("runs") or 1) < 3}
        dropped |= {(s.callsign, w) for w in single}
        lane_of = {d["candidate"]: d.get("lane") or "?" for d in s.draws}
        for g in s.latest.values():
            if config.wave_key(g) not in multi:
                continue
            ln = lane_of.get(g["candidate"])
            if not ln:
                continue
            e = good.setdefault((s.callsign, ln), {"n": 0, "keep": 0})
            e["n"] += 1
            if g["verdict"] in ("PASS", "PASS_WITH_NOTES"):
                e["keep"] += 1
    if not good:
        out.append("Nothing to compare: a lane comparison needs waves graded three "
                   "times, and one grade moves the verdict on a quarter of a wave.")
        out.append("")
        return out
    out.append("Only waves graded three times are in this table. A comparison built "
               "on one grade per candidate is not a comparison.")
    out.append("")
    out.append("| Ship | Lane | Graded | Keepable by the grader |")
    out.append("|---|---|---|---|")
    for (cs, ln), e in sorted(good.items()):
        out.append("| " + cs + " | " + ln + " | " + str(e["n"]) + " | "
                   + _pct(e["keep"], e["n"]) + " |")
    out.append("")
    if dropped:
        out.append(str(len(dropped)) + " wave(s) left out for being graded once.")
        out.append("")
    return out


# ------------------------------------------------------------------- build ---

def build(port) -> str:
    ledgers = read_ledgers(port)
    ships = [Ship(c, rows) for c, rows in sorted(ledgers.items())]

    out = []
    out.append("# Fleet")
    out.append("")
    out.append("Generated by `tools/fleet.py` from `harvest/ledger/*.jsonl`. Never "
               "hand-edited; regenerate when a ledger arrives.")
    out.append("")
    if not ships:
        out.append("No ledger has arrived yet. A ship writes one with "
                   "`python tools/ledger.py wave \"<wave dir>\"`, and the nightly "
                   "harvest carries it to `harvest/ledger/<callsign>.jsonl` after the "
                   "sweep has passed over it.")
        out.append("")
        out.append("---")
        out.append("")
        out.append(dt.date.today().isoformat() + ".")
        return "\n".join(out) + "\n"

    total_rows = sum(len(s.rows) for s in ships)
    out.append(str(len(ships)) + " ship(s), " + str(total_rows) + " rows, "
               + str(sum(len(s.draws) for s in ships)) + " draws, "
               + str(sum(len(s.grades) for s in ships)) + " grades, "
               + str(sum(len(s.ticks) for s in ships)) + " ticks. Ships by callsign "
               "and never by client, because that is all the rows carry.")
    out.append("")
    out.append("Every rate below carries its denominator, and no figure here is an "
               "average across ships: two ships of different sizes averaged together "
               "describe neither.")
    out.append("")

    for section in (inventory, economics, calibration, drift, failure_modes,
                    saturation, lanes):
        out.extend(section(ships))

    out.append("---")
    out.append("")
    out.append("A trend seen on two ships is a law candidate for `SKILL.md`; on one "
               "it is a note in the owning reference. Nothing here promotes anything: "
               "`/harvest-read` does that, and a person does that.")
    out.append("")
    out.append(dt.date.today().isoformat() + ".")
    return "\n".join(out) + "\n"


def to_html(md: str) -> str:
    """The same report as one self-contained page, no network, in the gallery's
    register. A markdown table is fine on a screen and unreadable in a room."""
    body, in_table = [], False
    for line in md.splitlines():
        if line.startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(set(c) <= set("-: ") and c for c in cells):
                continue
            if not in_table:
                body.append("<table>")
                in_table = True
                body.append("<tr>" + "".join("<th>" + html.escape(c) + "</th>"
                                             for c in cells) + "</tr>")
                continue
            body.append("<tr>" + "".join("<td>" + html.escape(c) + "</td>"
                                         for c in cells) + "</tr>")
            continue
        if in_table:
            body.append("</table>")
            in_table = False
        if line.startswith("# "):
            body.append("<h1>" + html.escape(line[2:]) + "</h1>")
        elif line.startswith("## "):
            body.append("<h2>" + html.escape(line[3:]) + "</h2>")
        elif line.strip() == "---":
            body.append("<hr>")
        elif line.strip():
            t = html.escape(line)
            t = t.replace("**", "\x00")
            parts = t.split("\x00")
            t = "".join(p if i % 2 == 0 else "<b>" + p + "</b>"
                        for i, p in enumerate(parts))
            body.append("<p>" + t + "</p>")
    if in_table:
        body.append("</table>")
    return ("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">"
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            "<title>Fleet</title><style>"
            "body{background:#16181b;color:#e9e7e2;font:15px/1.5 -apple-system,"
            "'Segoe UI',Roboto,sans-serif;max-width:1100px;margin:0 auto;padding:30px 20px 80px}"
            "h1{font-size:24px;font-weight:600;margin-bottom:4px}"
            "h2{font-size:16px;font-weight:600;color:#c9c6bf;margin:34px 0 10px;"
            "border-top:1px solid #2a2e34;padding-top:16px}"
            "p{color:#a8a59e;margin:9px 0;max-width:80ch}b{color:#e9e7e2}"
            "table{border-collapse:collapse;margin:14px 0;font-size:13px;width:100%}"
            "th{text-align:left;color:#8c8981;font-weight:600;padding:6px 12px 6px 0;"
            "border-bottom:1px solid #2d3137;white-space:nowrap}"
            "td{padding:5px 12px 5px 0;border-bottom:1px solid #23262b;color:#c1beb7}"
            "hr{border:0;border-top:1px solid #2a2e34;margin:30px 0}"
            "code{font:12px ui-monospace,Consolas,monospace;color:#b8de6e}"
            "</style></head><body>" + "\n".join(body) + "</body></html>")


def main() -> None:
    ap = argparse.ArgumentParser(
        description="What the fleet did, from the rows its ships sent home.")
    ap.add_argument("--port", default=None, metavar="DIR",
                    help="the home port (default: the repo this tool lives in)")
    ap.add_argument("--out", default=None, metavar="FILE",
                    help="write here instead of " + OUT)
    ap.add_argument("--check", action="store_true",
                    help="exit 1 when the file on disk differs from the ledgers")
    ap.add_argument("--html", action="store_true",
                    help="also write a self-contained " + HTML_OUT)
    a = ap.parse_args()

    port = os.path.abspath(os.path.expanduser(a.port or str(config.REPO)))
    out = a.out or os.path.join(port, OUT)
    text = build(port)

    if a.check:
        try:
            with open(out, encoding="utf-8") as f:
                current = f.read()
        except OSError:
            print("  fleet       " + out + " is missing; run tools/fleet.py")
            raise SystemExit(1)
        if current != text:
            print("  fleet       " + out + " is stale; run tools/fleet.py")
            raise SystemExit(1)
        print("  fleet       current")
        raise SystemExit(0)

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("  fleet       " + out)

    ledgers = read_ledgers(port)
    ships = [Ship(c, rows) for c, rows in sorted(ledgers.items())]
    print("  ships       " + (", ".join(s.callsign for s in ships) or "none"))
    print("  rows        " + str(sum(len(s.rows) for s in ships)))
    silent = [s.callsign for s in ships if s.draws and not s.ticks]
    if silent:
        print("  no person   " + ", ".join(silent)
              + "  (drawn and graded, never ticked)")

    if a.html:
        h = os.path.join(port, HTML_OUT)
        with open(h, "w", encoding="utf-8", newline="\n") as f:
            f.write(to_html(text))
        print("  page        " + h)
    raise SystemExit(0)


if __name__ == "__main__":
    main()
