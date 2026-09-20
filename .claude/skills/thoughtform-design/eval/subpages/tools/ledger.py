r"""The ledger. What a wave did, what the instrument said, what the person said.

    python tools/ledger.py wave "<wave dir>"        append a wave's draws and grades
    python tools/ledger.py tick --handback verdicts-2026-09-13.json
    python tools/ledger.py tick <file.png> --approve
    python tools/ledger.py tick <file.png> --redo "the ground went warm"
    python tools/ledger.py tick <file.png> --best   best of its slot
    python tools/ledger.py decode <file.png> --tag C2
    python tools/ledger.py promote <file.png> --pole positive
    python tools/ledger.py summary "<wave dir>"     the eval log's numbers table
    python tools/ledger.py --check                  schema, grammar, zero nouns
    python tools/ledger.py --rebuild                every wave on the drive, again

One append-only line per event in `evals/ledger.jsonl`, committed with the
recipe. Text, about six hundred bytes a row; a ship that ran a thousand draws
carries half a megabyte and can be read by anything.

**Why this exists.** The harness has built a review page for every wave since
its first version, and that page hands back `verdicts-<date>.json`: the tick,
the comment, and now the best of each slot. Across fourteen ships, not one of
those files was ever written back. The grader's side has been rows since the
beginning; the person's side was a sentence in an eval log, a row in a
vocabulary file, or a `zz-approved-` prefix on a filename. Nothing joined the
two, so the question that decides whether a check may gate - *does it agree
with the person?* - could not be asked of any wave without matching filenames
by hand. This file is the join.

**A row is born scrubbed.** No prompt, no comment, no filename, no reference
name, no subject noun, no error text: hashes, counts, codes and classes. The
words stay aboard in the manifest and the handback, where the person reading
them already has the client's context. What travels is the shape.

**A tick is a selection, not a score.** The gallery's best-of-slot control is
the comparative label, and it is worth more than the tick beside it: asked to
score pictures, experts disagree with themselves; asked to pick the best of a
matched set, they agree with each other. The comment is worth more than both,
which is why `/decode` reads it and `calibrate.py` turns it into a label.

Kinds, and what each is the row form of:

    draw      MANIFEST.jsonl        what was asked for, on what lane, at what cost
    grade     qa_results.json       what the instrument said, run by run
    tick      verdicts-*.json       what the person said
    decode    a comment, read       which failure mode the comment named
    promote   approved-register.md  what became an anchor, at either pole

`wave` and `--rebuild` are idempotent: they replace a wave's `draw` and `grade`
rows and never touch a `tick`, a `decode` or a `promote`, because the person's
side cannot be regenerated from anything.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import config  # noqa: E402

EXIT_OK = 0
EXIT_ERROR = 1
EXIT_NOUN = 4          # the same code the sweep uses: a noun reached the file

# The fields a ship fills in with words of its own choosing. A client noun in
# one of these is the ship's naming, stored with the placeholder and reported
# as such; a noun anywhere else is a row builder that learned to carry text,
# and those are different fixes. Found on the first rebuild of a real ship,
# whose rubric version string named the product it was calibrated on.
NAMED_BY_THE_SHIP = {"wave", "rubric", "setting", "tag"}


# ---------------------------------------------------------------- the rows ---

def _stamp() -> str:
    return dt.date.today().isoformat()


def draw_row(ship, wave, name, row, cfg, prices, harness=None):
    """A manifest row as a ledger row. Everything that is a word becomes a hash,
    a count or a code; everything that is a number stays a number."""
    meta = row.get("meta") or {}
    # The origin ship's meta predates the subject key and carries `sku` where
    # the harness writes `subject`. Without the fallback its four hundred draws
    # lose the subject dimension silently, which is the one dimension the fleet
    # asks about most.
    subject = meta.get("subject") or meta.get("sku") or ""
    settings = row.get("settings") or {}
    lane = row.get("model_lane") or ""
    usage = row.get("usage") or {}
    out = {
        "schema": config.LEDGER_SCHEMA,
        "kind": "draw",
        "callsign": ship,
        "armada": harness or config.armada_version(),
        "wave": wave,
        "wave_id": config.wave_id(wave),
        "candidate": config.candidate_id(wave, name),
        "slot": config.slot_id(ship, config.slot_of(name)),
        "type": meta.get("type") or "",
        "subject": config.subject_id(ship, subject) if subject else "",
        "setting": meta.get("setting") or "",
        "repair": bool(meta.get("repair")),
        "draw": row.get("draw") or config.parse_name(name).get("draw") or 0,
        "model": row.get("model") or "",
        "lane": lane,
        "ar": settings.get("ar") or settings.get("aspectRatio") or "",
        "size": settings.get("size") or settings.get("imageSize") or "",
        "quality": settings.get("quality") or "",
        "refs": len(row.get("references") or []),
        "prompt_sha": config.text_sha(row.get("prompt") or ""),
        "prompt_chars": len(str(row.get("prompt") or "")),
        "seconds": row.get("seconds"),
        "ok": bool(row.get("ok", True)),
        "ts": row.get("timestamp") or "",
    }
    if usage:
        out["usage"] = {"in": usage.get("in") or usage.get("input") or 0,
                        "out": usage.get("out") or usage.get("output") or 0}
    price = prices.get(lane)
    if price:
        out["usd"] = round(float(price), 6)
    if not out["ok"]:
        out["error_class"] = config.error_class(row.get("error"))
    return out


def grade_row(ship, wave, rec, payload, harness=None, round_=""):
    """A `qa_results.json` result as a ledger row. Per check, how many runs said
    it passed and how many answered at all - the instrument's own error bar,
    kept per check rather than collapsed into the verdict it produced.

    `round_` is the folder under the wave the results file sat in (`rounds/r1`),
    empty for a file at the wave's own level. Two ships keep a round's grades
    in the round's folder, and the wave name on the row stays the wave's so the
    grade still joins its draw."""
    name = rec.get("file") or ""
    runs = rec.get("runs") or payload.get("runs") or 1
    run_verdicts = list(rec.get("run_verdicts") or [])
    checks = {}
    split = rec.get("split_answers") or {}
    for cid, passed in (rec.get("checks") or {}).items():
        of = len([v for v in run_verdicts if v]) or runs
        yes = of if passed else 0
        s = str(split.get(cid) or "")
        if s:
            # "2/3 said it passed" - the only place the per-run vote survives.
            head = s.split(" ", 1)[0]
            if "/" in head:
                a, _, b = head.partition("/")
                if a.isdigit() and b.isdigit():
                    yes, of = int(a), int(b)
        checks[cid] = {"pass": yes, "of": of}
    out = {
        "schema": config.LEDGER_SCHEMA,
        "kind": "grade",
        "callsign": ship,
        "armada": harness or config.armada_version(),
        "wave": wave,
        "wave_id": config.wave_id(wave),
        "candidate": config.candidate_id(wave, name),
        "slot": config.slot_id(ship, rec.get("slot") or config.slot_of(name)),
        "rubric": payload.get("rubric_version") or payload.get("rubric") or "",
        "gating": bool(payload.get("gating")),
        "grader": rec.get("grader") or payload.get("grader") or "",
        "runs": runs,
        "verdict": rec.get("verdict") or "",
        "run_verdicts": run_verdicts,
        "checks": checks,
        "failed": [f.get("id") for f in (rec.get("failed") or []) if f.get("id")],
        "failed_advisory": [f.get("id") for f in (rec.get("failed_advisory") or [])
                            if f.get("id")],
        "unanswered": list(rec.get("unanswered") or []),
        "unstable": len(set(v for v in run_verdicts if v)) > 1,
        "worst": bool(rec.get("worst_issue")),
        "graded_at": payload.get("graded_at") or "",
    }
    if round_:
        out["round"] = round_
    return out


def tick_row(ship, wave, name, who, approved, comment, best):
    """What the person said about one frame. The comment is a hash and a length:
    the sentence itself stays in the handback beside the wave, because it is the
    client's own words and it is what `/decode` reads."""
    out = {
        "schema": config.LEDGER_SCHEMA,
        "kind": "tick",
        "callsign": ship,
        "wave": wave,
        "wave_id": config.wave_id(wave),
        "candidate": config.candidate_id(wave, name),
        "slot": config.slot_id(ship, config.slot_of(name)),
        "who": who,
        "approved": bool(approved),
        "redo": bool(comment and str(comment).strip()),
        "best": bool(best),
        "date": _stamp(),
    }
    if out["redo"]:
        out["comment_sha"] = config.text_sha(str(comment).strip())
        out["comment_chars"] = len(str(comment).strip())
    return out


def decode_row(ship, wave, name, tag, known):
    """A comment, read: which failure mode it named. `known` says whether the tag
    is a check the rubric already has - a tag that is not is the interesting one,
    because it is a defect the instrument cannot see."""
    return {
        "schema": config.LEDGER_SCHEMA,
        "kind": "decode",
        "callsign": ship,
        "wave": wave,
        "wave_id": config.wave_id(wave),
        "candidate": config.candidate_id(wave, name),
        "slot": config.slot_id(ship, config.slot_of(name)),
        "tag": tag,
        "maps_to_check": bool(known),
        "date": _stamp(),
    }


def promote_row(ship, wave, name, pole):
    return {
        "schema": config.LEDGER_SCHEMA,
        "kind": "promote",
        "callsign": ship,
        "wave": wave,
        "wave_id": config.wave_id(wave),
        "candidate": config.candidate_id(wave, name),
        "slot": config.slot_id(ship, config.slot_of(name)),
        "pole": pole,
        "date": _stamp(),
    }


# --------------------------------------------------------------- the file ---

def append(rows, path=None, cfg=None, scrub_file=None) -> int:
    """Write rows, scrubbed. The scrub here is a belt on top of braces: nothing
    above puts a word in a row, and this is what proves it - a hit means a row
    builder learned to carry a word and the fix is in the builder, so it says
    so rather than quietly cleaning up after itself."""
    if not rows:
        return 0
    p = config.ledger_path() if path is None else path
    ship_nouns = config.nouns(cfg, scrub_file)
    lines, dirty = [], {}
    for row in rows:
        row = dict(row)
        # Field by field first, so the report can say WHICH field carried the
        # word. A wave named in the client's language is the ship's naming and
        # goes on its scrub list; a noun in any other field is a row builder
        # that learned to carry a word, and those are different fixes.
        for k, v in list(row.items()):
            if isinstance(v, str) and v:
                clean, hits = config.scrub(v, ship_nouns)
                if hits:
                    dirty[k] = dirty.get(k, 0) + sum(n for n, _ph in hits.values())
                    row[k] = clean
        text = json.dumps(row, ensure_ascii=False, sort_keys=True)
        clean, hits = config.scrub(text, ship_nouns)      # the belt, for anything nested
        if hits:
            dirty["(nested)"] = dirty.get("(nested)", 0) + sum(n for n, _ph in hits.values())
            text = clean
        lines.append(text)
    if dirty:
        fields = ", ".join(k + " x" + str(v) for k, v in sorted(dirty.items()))
        if set(dirty) <= NAMED_BY_THE_SHIP:
            print("  SCRUBBED    " + fields + " - named in the client's language "
                  "by the ship (a wave, a rubric version, a setting, a tag). The "
                  "rows are stored with the placeholder and join as before; name "
                  "these without client words, or leave it, since the scrub list "
                  "already knows this one.")
        else:
            print("  SCRUBBED    " + fields + " - a row carried a noun. The row "
                  "builder is the bug, not the scrub; the ledger is meant to be "
                  "born clean.")
    os.makedirs(os.path.dirname(os.path.abspath(str(p))) or ".", exist_ok=True)
    with open(str(p), "a", encoding="utf-8", newline="\n") as f:
        for line in lines:
            f.write(line + "\n")
    return len(lines)


def drop_wave(wave, kinds, path=None, nouns=None) -> int:
    """Remove one wave's rows of the given kinds, keeping everything else in
    file order. Used by `wave` and `--rebuild` so a re-grade replaces its own
    rows and never doubles them; `tick`, `decode` and `promote` are never in
    `kinds`, because nothing can regenerate a person.

    A row written since 0.8.2 is matched on its `wave_id`, the raw name
    hashed. A row written before that is matched on its stored name, which may
    be the scrubbed one, so the name given is scrubbed the same way before
    comparing.

    2026-09-13, the origin ship: four waves whose names differed only by a
    product word scrubbed to one placeholder, and matching on the stored name
    made each wave's rebuild drop its siblings' rows as its own. Hence the
    id."""
    p = str(config.ledger_path() if path is None else path)
    if not os.path.exists(p):
        return 0
    wid = config.wave_id(wave)
    names = {wave}
    if nouns:
        names.add(config.scrub(wave, nouns)[0])
    kept, dropped = [], 0
    with open(p, encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not s:
                continue
            try:
                row = json.loads(s)
            except json.JSONDecodeError:
                kept.append(s)
                continue
            mine = (row.get("wave_id") == wid) if row.get("wave_id") \
                else (row.get("wave") in names)
            if mine and row.get("kind") in kinds:
                dropped += 1
                continue
            kept.append(s)
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        for s in kept:
            f.write(s + "\n")
    return dropped


# ------------------------------------------------------------------ a wave ---

def wave_name(wave_dir: str) -> str:
    return os.path.basename(os.path.normpath(str(wave_dir)))


def grade_files(wave_dir):
    """Every results file under the wave, with the round folder it sits in.

    Two layouts the first version did not read, found on the first sweep of
    the fleet: a ship that grades each round of a wave into `rounds/r1/`, and a
    ship that keeps every re-grade under a new rubric version as a sidecar
    beside the current one (`qa_results.rubric-0.7.json`), which is the fleet's
    only rubric-drift series. A file whose name says INVALID is a run the ship
    disowned by name, kept as evidence, and it is not read. Folders starting
    with `_` are working material, as everywhere else."""
    out = []
    for root, dirs, files in os.walk(str(wave_dir)):
        dirs[:] = sorted(d for d in dirs if not d.startswith("_"))
        for f in sorted(files):
            if not (f.startswith("qa_results") and f.endswith(".json")):
                continue
            if "invalid" in f.lower():
                continue
            rel = os.path.relpath(root, str(wave_dir))
            round_ = "" if rel == "." else rel.replace("\\", "/")
            out.append((os.path.join(root, f), round_))
    return out


def read_wave(wave_dir, cfg, ship, harness=None):
    """(draw rows, grade rows) for one wave directory."""
    wave = wave_name(wave_dir)
    prices = dict((cfg.get("models") or {}).get("prices") or {})
    manifest = config.load_manifest(wave_dir)
    draws = [draw_row(ship, wave, name, row, cfg, prices, harness)
             for name, row in sorted(manifest.items())]

    grades = []
    for qa, round_ in grade_files(wave_dir):
        try:
            with open(qa, encoding="utf-8") as f:
                payload = json.load(f)
        except (OSError, json.JSONDecodeError) as e:      # noqa: BLE001
            print("  note: unreadable " + os.path.basename(qa) + " - " + str(e))
            continue
        if not isinstance(payload, dict):
            continue
        for rec in payload.get("results", []):
            if not rec.get("file"):
                continue
            # A row whose verdict is an empty string is a labelling pass that
            # borrowed the results shape, not a grade. Counting it would put a
            # blank tier into every rate the fleet computes.
            if not (rec.get("verdict") or "").strip():
                continue
            grades.append(grade_row(ship, wave, rec, payload, harness, round_))
    return draws, grades


def waves_on_drive(cfg):
    """Every wave directory under the drive's creation folder. Anything starting
    with `_` is working material and never a wave."""
    try:
        root = config.creation_dir(cfg)
    except SystemExit:
        return []
    if not root.exists():
        return []
    return [str(p) for p in sorted(root.iterdir())
            if p.is_dir() and not p.name.startswith("_")]


# ----------------------------------------------------------------- summary ---

def summary(wave_dir, cfg, ship, rows=None):
    """The eval log's own numbers table, filled in. The shape is the one in
    `skill/references/eval-log.md`, so it is pasted rather than transcribed -
    and the last line is the ratio, because the next routing decision is made
    on the ratio and never on a total."""
    wave = wave_name(wave_dir)
    rows = rows if rows is not None else config.ledger_rows()
    wid = config.wave_id(wave)
    mine = [r for r in rows if r.get("wave_id") == wid
            or (not r.get("wave_id") and r.get("wave") == wave)]
    draws = [r for r in mine if r["kind"] == "draw"]
    grades = [r for r in mine if r["kind"] == "grade"]
    ticks = [r for r in mine if r["kind"] == "tick"]

    counts = {}
    for g in grades:
        counts[g["verdict"]] = counts.get(g["verdict"], 0) + 1
    approved = {t["candidate"] for t in ticks if t.get("approved")}
    redone = {t["candidate"] for t in ticks if t.get("redo")}
    best = {t["candidate"] for t in ticks if t.get("best")}

    slots_with_keeper = len({g["slot"] for g in grades
                             if g["candidate"] in approved}) if approved else 0
    if not approved:
        # Nobody has ticked this wave: fall back to what the grader would keep,
        # and say which number it is. The two are not the same thing and a table
        # that does not say which one it holds is the reason nobody trusts it.
        slots_with_keeper = len({g["slot"] for g in grades
                                 if g["verdict"] in ("PASS", "PASS_WITH_NOTES")})

    spend = sum(float(d.get("usd") or 0) for d in draws)
    seconds = sum(float(d.get("seconds") or 0) for d in draws)
    keepers = len(approved) or sum(counts.get(v, 0)
                                   for v in ("PASS", "PASS_WITH_NOTES"))

    lines = []
    lines.append("| | |")
    lines.append("|---|---|")
    lines.append("| Draws | " + str(len(draws)) + " |")
    for v in ("PASS", "PASS_WITH_NOTES", "RETRY", "FAIL"):
        lines.append("| " + v + " | " + str(counts.get(v, 0)) + " |")
    lines.append("| Slots with at least one usable draw, by eye | "
                 + (str(slots_with_keeper) if approved
                    else str(slots_with_keeper) + " (the grader's, nobody has ticked this wave)")
                 + " |")
    ratio = ("%.1f draws per keeper" % (len(draws) / keepers)) if keepers else "no keeper yet"
    cost = ("$%.2f, %s" % (spend, ratio)) if spend else (ratio + ", no price set")
    lines.append("| Cost, and the ratio it sets | " + cost + " |")

    print("\n".join(lines))
    print("")
    print("  wave        " + wave)
    print("  rubric      " + (grades[0]["rubric"] if grades else "ungraded"))
    print("  ticks       " + str(len(approved)) + " approved, " + str(len(redone))
          + " redo, " + str(len(best)) + " best-of-slot"
          + ("" if ticks else "   (no handback read yet)"))
    print("  unstable    " + str(sum(1 for g in grades if g.get("unstable")))
          + " of " + str(len(grades)) + " candidates moved between runs")
    if seconds:
        print("  seconds     " + ("%.0f" % seconds) + " of model time")
    if not spend:
        print("  no [models.prices] in armada.toml, so cost per keeper is blank. "
              "A price is a fact about a lane; set it once.")
    return 0


# ------------------------------------------------------------------- check ---

def check(cfg, ship, path=None, scrub_file=None) -> int:
    """Schema, grammar and the one thing that matters: zero of this ship's nouns
    in the file. Run by `/commit`."""
    p = str(config.ledger_path() if path is None else path)
    if not os.path.exists(p):
        print("  ledger      none yet at " + config.LEDGER_FILE
              + ". A wave that ran before this tool existed is added with "
                "`python tools/ledger.py --rebuild`.")
        return EXIT_OK

    findings, n, kinds = [], 0, {}
    with open(p, encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            s = line.strip()
            if not s:
                continue
            n += 1
            try:
                row = json.loads(s)
            except json.JSONDecodeError as e:              # noqa: BLE001
                findings.append(config.LEDGER_FILE + ":" + str(i) + ": not JSON: " + str(e))
                continue
            if not isinstance(row, dict):
                findings.append(config.LEDGER_FILE + ":" + str(i) + ": not an object.")
                continue
            kind = row.get("kind")
            if kind not in config.LEDGER_KINDS:
                findings.append(config.LEDGER_FILE + ":" + str(i) + ": unknown kind "
                                + repr(kind) + ". Known: " + ", ".join(config.LEDGER_KINDS))
                continue
            kinds[kind] = kinds.get(kind, 0) + 1
            if row.get("schema") != config.LEDGER_SCHEMA:
                findings.append(config.LEDGER_FILE + ":" + str(i) + ": schema "
                                + repr(row.get("schema")) + ", this build writes "
                                + str(config.LEDGER_SCHEMA) + ".")
            for key in ("callsign", "wave", "candidate"):
                if not row.get(key):
                    findings.append(config.LEDGER_FILE + ":" + str(i) + ": no " + key + ".")
            for banned in ("prompt", "comment", "file", "error", "notes", "worst_issue"):
                if isinstance(row.get(banned), str) and row.get(banned).strip():
                    findings.append(config.LEDGER_FILE + ":" + str(i) + ": carries "
                                    + repr(banned) + " as text. A ledger row holds "
                                    "hashes, counts and codes; the words stay aboard.")

    # The ship's own nouns, from the ship's own scrub list. Left at the default
    # under --repo, this would read the port's list, agree with a writer that
    # made the same mistake, and pass a ledger that was born dirty.
    ship_nouns = config.nouns(cfg, scrub_file)
    text = open(p, encoding="utf-8").read()
    _clean, hits = config.scrub(text, ship_nouns, apply=False)
    leaked = sum(c for c, _ph in hits.values())

    for line in findings:
        print("  " + line)
    if leaked:
        print("  " + config.LEDGER_FILE + ": " + str(leaked) + " of this ship's nouns "
              "are in the ledger. The word is not printed; the row builder that "
              "put it there is the bug.")
        return EXIT_NOUN
    if findings:
        print("\n  " + str(len(findings)) + " finding(s) in " + str(n) + " rows.")
        return EXIT_ERROR
    print("  ledger      ok, " + str(n) + " rows ("
          + ", ".join(k + " " + str(v) for k, v in sorted(kinds.items())) + ")")
    print("  nouns       0 of this ship's own in the file")
    return EXIT_OK


# --------------------------------------------------------------------- cli ---

def _resolve(target, cfg, rows=None):
    """(wave, filename) for a candidate named as a path, or as a bare filename
    when exactly one wave in the ledger knows it."""
    name = os.path.basename(str(target))
    parent = os.path.dirname(os.path.abspath(str(target)))
    # <wave>/<TYPE - Type name>/<file>
    if os.path.exists(str(target)) and parent:
        return os.path.basename(os.path.dirname(parent)), name
    rows = rows if rows is not None else config.ledger_rows()
    waves = sorted({r["wave"] for r in rows
                    if r.get("candidate") == config.candidate_id(r.get("wave", ""), name)})
    if len(waves) == 1:
        return waves[0], name
    if not waves:
        config.die("no draw called " + repr(name) + " in the ledger. Give the path to "
                   "the file inside its wave folder, or run "
                   "`python tools/ledger.py wave \"<wave dir>\"` first.")
    config.die(repr(name) + " is in more than one wave (" + ", ".join(waves)
               + "). Give the path to the one you mean.")
    return "", name


def main() -> None:
    ap = argparse.ArgumentParser(
        description="The ledger: what a wave did, what the grader said, what the "
                    "person said. One append-only line per event, born scrubbed.")
    ap.add_argument("--check", action="store_true",
                    help="schema, grammar and zero of this ship's nouns; exit 4 on a noun")
    ap.add_argument("--rebuild", action="store_true",
                    help="re-read every wave on the drive; never touches a tick, "
                         "a decode or a promote")
    ap.add_argument("--out", default=None, help="write here instead of " + config.LEDGER_FILE)
    ap.add_argument("--repo", default=None, metavar="PATH",
                    help="the ship to read and write (default: the repo this tool lives "
                         "in). The port uses this to reach a ship whose tools it must "
                         "not replace")
    sub = ap.add_subparsers(dest="cmd")

    w = sub.add_parser("wave", help="append one wave's draws and grades")
    w.add_argument("wave", help="a wave directory")

    t = sub.add_parser("tick", help="what the person said")
    t.add_argument("target", nargs="?", help="a candidate file, or its name")
    t.add_argument("--handback", default=None, metavar="FILE",
                   help="a verdicts-<date>.json from the review gallery")
    t.add_argument("--approve", action="store_true")
    t.add_argument("--redo", default=None, metavar="COMMENT",
                   help="the comment, verbatim; it is hashed into the row and "
                        "written to the wave's handback")
    t.add_argument("--best", action="store_true", help="the best draw of its slot")
    t.add_argument("--who", default="owner", choices=("owner", "client"))

    d = sub.add_parser("decode", help="which failure mode a comment named")
    d.add_argument("target", help="a candidate file, or its name")
    d.add_argument("--tag", required=True,
                   help="a check id the rubric has (C2), or a new failure-mode slug")

    p = sub.add_parser("promote", help="an approved output, at either pole")
    p.add_argument("target", help="a candidate file, or its name")
    p.add_argument("--pole", default="positive", choices=("positive", "negative"))

    s = sub.add_parser("summary", help="the eval log's numbers table for one wave")
    s.add_argument("wave", help="a wave directory, or a wave name")

    fnd = sub.add_parser("find", help="which frame a candidate id is")
    fnd.add_argument("candidate", help="a 12-character id from the ledger or the "
                                       "calibration")

    a = ap.parse_args()
    # Every path bound to one repo. Without this the port's copy of the tool,
    # run from anywhere, reads the port's config, the port's scrub list and the
    # port's version, and writes into the port's evals/ while naming a ship.
    b = config.bind(a.repo)
    cfg, ship = b.cfg, b.callsign
    out = a.out or b.ledger
    harness = b.harness()
    scrub_file = b.scrub_file

    if a.check:
        raise SystemExit(check(cfg, ship, out, scrub_file))

    if a.rebuild:
        waves = waves_on_drive(cfg)
        if not waves:
            print("  no waves under " + str(config.creation_dir(cfg))
                  + ". Nothing to rebuild.")
            raise SystemExit(EXIT_OK)
        total = 0
        for wd in waves:
            draws, grades = read_wave(wd, cfg, ship, harness)
            if not draws and not grades:
                continue
            drop_wave(wave_name(wd), ("draw", "grade"), out, b.nouns())
            total += append(draws + grades, out, cfg, scrub_file)
            rounds = sorted({g.get("round") for g in grades if g.get("round")})
            versions = sorted({g.get("rubric") for g in grades if g.get("rubric")})
            print("  " + wave_name(wd).ljust(28) + str(len(draws)) + " draws, "
                  + str(len(grades)) + " grades"
                  + ((", rounds " + ", ".join(rounds)) if rounds else "")
                  + ((", rubric " + ", ".join(versions)) if len(versions) > 1 else ""))
        print("\n  " + str(total) + " rows, " + str(len(waves)) + " wave(s), harness "
              + harness + ". Ticks, decodes and promotes were not touched.")
        raise SystemExit(EXIT_OK)

    if a.cmd == "wave":
        draws, grades = read_wave(a.wave, cfg, ship, harness)
        if not draws and not grades:
            config.die("nothing to read in " + str(a.wave) + ". A wave needs a "
                       "MANIFEST.jsonl, and a graded one a qa_results.json.")
        dropped = drop_wave(wave_name(a.wave), ("draw", "grade"), out, b.nouns())
        n = append(draws + grades, out, cfg, scrub_file)
        print("  wave        " + wave_name(a.wave))
        print("  draws       " + str(len(draws)))
        print("  grades      " + str(len(grades))
              + ("" if grades else "   (ungraded; run tools/qa.py, then this again)"))
        if dropped:
            print("  replaced    " + str(dropped) + " earlier row(s) for this wave")
        print("  ledger      " + str(out) + "  (+" + str(n) + ")")
        print("\n  Then the person: tick the gallery, save the handback beside the "
              "wave, and run `ledger.py tick --handback <file>`. The comment is "
              "worth more than the tick.")
        raise SystemExit(EXIT_OK)

    if a.cmd == "tick":
        rows = []
        if a.handback:
            with open(a.handback, encoding="utf-8") as f:
                hb = json.load(f)
            wave = hb.get("wave") or ""
            if not wave:
                config.die("the handback names no wave. It is written by "
                           "tools/make_review_gallery.py and carries one.")
            who = hb.get("who") or a.who
            best = set()
            for _slot, name in (hb.get("best") or {}).items():
                if name:
                    best.add(name)
            for name, v in sorted((hb.get("verdicts") or {}).items()):
                rows.append(tick_row(ship, wave, name, who, v.get("approved"),
                                     v.get("comment"), name in best))
            # A best-of-slot the reviewer marked on a frame they neither approved
            # nor commented on is still a judgment, and the richest one there is.
            for name in sorted(best - set((hb.get("verdicts") or {}).keys())):
                rows.append(tick_row(ship, wave, name, who, False, "", True))
        else:
            if not a.target:
                config.die("give a candidate, or --handback <verdicts-*.json>.")
            wave, name = _resolve(a.target, cfg, config.ledger_rows(out))
            if not (a.approve or a.redo or a.best):
                config.die("say what the person did: --approve, --redo \"<comment>\", "
                           "or --best.")
            rows.append(tick_row(ship, wave, name, a.who, a.approve, a.redo, a.best))
            if a.redo:
                # The sentence itself never enters the ledger, so it has to land
                # somewhere the ship keeps. A comment written nowhere is a wave
                # that has to be re-run to learn what it already taught.
                hb_dir = os.path.dirname(os.path.abspath(str(a.target))) \
                    if os.path.exists(str(a.target)) else "."
                hb_path = os.path.join(hb_dir, "verdicts-" + _stamp() + ".json")
                hb = {"wave": wave, "date": _stamp(), "who": a.who, "verdicts": {}}
                if os.path.exists(hb_path):
                    try:
                        with open(hb_path, encoding="utf-8") as f:
                            hb = json.load(f)
                    except (OSError, json.JSONDecodeError):
                        pass
                hb.setdefault("verdicts", {})[name] = {"approved": bool(a.approve),
                                                       "comment": a.redo}
                with open(hb_path, "w", encoding="utf-8", newline="\n") as f:
                    json.dump(hb, f, ensure_ascii=False, indent=1)
                print("  comment     written verbatim to " + hb_path)
        n = append(rows, out, cfg, scrub_file)
        ok = sum(1 for r in rows if r["approved"])
        redo = sum(1 for r in rows if r["redo"])
        best_n = sum(1 for r in rows if r["best"])
        print("  ticks       " + str(n) + "  (" + str(ok) + " approved, " + str(redo)
              + " redo, " + str(best_n) + " best-of-slot)")
        if redo:
            print("  next        /decode reads the comments into failure modes, and "
                  "`tools/calibrate.py` turns them into labels for the checks.")
        raise SystemExit(EXIT_OK)

    if a.cmd == "decode":
        wave, name = _resolve(a.target, cfg, config.ledger_rows(out))
        known = {c["id"] for c in config.load_checks(b.rubric)} if b.has_rubric() else set()
        row = decode_row(ship, wave, name, a.tag, a.tag in known)
        append([row], out, cfg, scrub_file)
        print("  decode      " + a.tag + ("  (a check the rubric has)" if row["maps_to_check"]
                                          else "  (NOT a check yet - the instrument "
                                               "cannot see this defect)"))
        raise SystemExit(EXIT_OK)

    if a.cmd == "promote":
        wave, name = _resolve(a.target, cfg, config.ledger_rows(out))
        append([promote_row(ship, wave, name, a.pole)], out, cfg, scrub_file)
        print("  promote     " + a.pole + " anchor")
        print("  Then the file: byte-identical into skill/assets/, a row in "
              "skill/references/approved-register.md with the dated quote, and a "
              "line in the rubric's calibration anchors.")
        raise SystemExit(EXIT_OK)

    if a.cmd == "summary":
        wd = a.wave
        if not os.path.isdir(str(wd)):
            wd = str(config.wave_dir(str(wd), cfg=cfg))
        raise SystemExit(summary(wd, cfg, ship, config.ledger_rows(out)))

    if a.cmd == "find":
        # The other direction. An id is what travels; a person still has to be
        # able to open the picture, and the drive is where the names live.
        want = str(a.candidate).strip()
        hits = []
        for wd in waves_on_drive(cfg):
            wv = wave_name(wd)
            for name, row in config.load_manifest(wd).items():
                if config.candidate_id(wv, name) == want:
                    hits.append((wv, name, row.get("path")
                                 or os.path.join(wd, name)))
        if not hits:
            print("  no draw with id " + repr(want) + " on the drive. It may be from "
                  "a wave that has been cleared, or from another ship.")
            raise SystemExit(EXIT_ERROR)
        for wv, name, _p in hits:
            print("  " + wv + "   " + name)
            for root, _d, files in os.walk(str(config.wave_dir(wv, cfg=cfg))):
                if name in files:
                    print("  " + os.path.join(root, name))
        raise SystemExit(EXIT_OK)

    ap.print_help()
    raise SystemExit(EXIT_OK)


if __name__ == "__main__":
    main()
