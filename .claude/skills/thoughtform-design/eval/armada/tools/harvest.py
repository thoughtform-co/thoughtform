r"""The report home. What a ship learned, packaged for the fleet.

    python tools/harvest.py                          since the last harvest
    python tools/harvest.py --since 2026-09-01       since a date
    python tools/harvest.py --no-scrub               print verbatim, write nothing
    python tools/harvest.py --repo ../some-ship      report on a ship elsewhere
    python tools/harvest.py --repo ../ship --commits-since 4f21a9c
    python tools/harvest.py --repo ../ship --sweep . fail if a noun leaked

An engagement is a ship: it carries the shared harness, earns its own judgment
on its own client's subjects, and comes home to report. This is the report.

Every path is bound from `--repo` (default: the repo this tool lives in), so
the home port can run this against a clone it has just made without any tool
believing it is inside that ship. `[harvest]` in the ship's `armada.toml` says
where its lessons are written; globs are relative to the repo root:

    changelogs    dated `## ` entries - what changed in how the work is made
    eval_logs     dated `## ` entries - the finding, the ruled-out, the standing
                  conclusion of each, never the whole log
    prompt_logs   the 'Ruled out' sections - what nobody should retry
    waves         the directory whose `*.md` are counted
    sections      `PATH::Heading prefix` - one named `## ` section, copied whole

A ship built before that table points those keys at its own files. A missing
file is "none" in its section, never a crash.

**The report carries lessons, never client words, and it is scrubbed by
default.** The nouns `armada.toml` names - the engagement's name and title,
every subject key and noun - become `<engagement>` and `<subject>`.
`harvest/scrub.txt` in the ship carries the rest, one phrase per line, `#`
comments allowed, each replaced with `<redacted>`: a scrub knows only the
nouns the toml names, and people, places, products and other ships live in
that list. 2026-09: a note came home naming a person the toml had never heard
of, and the de-clienting section it carried listed every phrase it had
replaced - which put the words back into the file that was meant to lose them.
The section now counts by placeholder and never prints a phrase.

`--no-scrub` prints the verbatim note and its hit list to stdout for a person
de-clienting by hand, and writes no file. `--sweep DIR` is the last gate: it
greps a directory for this ship's nouns and exits 4 on any hit, naming the
file and the count and never the word.

Exit codes: 0 written, 2 nothing new since the stamp, 4 a sweep found a noun,
1 an error.

Then, at the home port: the note lands in Armada's `harvest/` as
`<date>-<callsign>.md`, and the rule is the one the method already has - a
lesson that arrives from two ships becomes a law in SKILL.md; one that arrives
once is a note in the owning reference. Nothing here decides which; it makes
the arrival legible.
"""
from __future__ import annotations

import argparse
import datetime as dt
import glob as globmod
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import config  # noqa: E402

_DATE = re.compile(r"(\d{4}-\d{2}-\d{2})")
_COMMIT = re.compile(r"^[a-z]+\([^)]+\): .+")

# An eval-log entry is long; only the paragraphs that carry a conclusion travel.
_LEADS = ("the finding", "finding", "ruled out", "standing conclusion")

EXIT_OK = 0
EXIT_NOTHING_NEW = 2
EXIT_SWEEP_HIT = 4


def _read(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


def _date_in(text):
    m = _DATE.search(text)
    if not m:
        return None
    try:
        return dt.date.fromisoformat(m.group(1))
    except ValueError:
        return None


def _sections(txt):
    """Every `## heading` with its body, in file order."""
    for m in re.finditer(r"^## (.+?)\s*\n(.*?)(?=^## |\Z)", txt, re.S | re.M):
        yield m.group(1).strip(), m.group(2).strip(), m.start()


# --------------------------------------------------------------------- ship ---

class Ship:
    """Every path a harvest reads, bound to one repo root.

    2026-09: the home port's first nightly run imported this module inside a
    clone and every path still resolved to the port's own checkout, because the
    tool asked `config` where it was rather than being told. Nothing here reads
    a module-level path.
    """

    def __init__(self, root):
        self.root = os.path.abspath(os.path.expanduser(str(root)))
        self.toml = os.path.join(self.root, "armada.toml")
        self.cfg = config.load(self.toml, fresh=True)
        self.callsign = config.callsign(self.cfg)
        h = self.cfg.get("harvest") or {}
        self.changelogs = list(h.get("changelogs") or [])
        self.eval_logs = list(h.get("eval_logs") or [])
        self.prompt_logs = list(h.get("prompt_logs") or [])
        self.waves_dir = os.path.join(self.root, str(h.get("waves") or "evals/waves"))
        self.sections = list(h.get("sections") or [])
        self.rubric = os.path.join(self.root, "skill", "references", "rubric.md")
        self.harvest_dir = os.path.join(self.root, "harvest")
        self.last = os.path.join(self.harvest_dir, ".last")
        self.scrub_file = os.path.join(self.harvest_dir, "scrub.txt")
        self.version_file = os.path.join(self.root, "tools", "ARMADA_VERSION")

    # -- what the ship is running -------------------------------------------

    def harness(self):
        v = _read(self.version_file).strip()
        return v or "donor tools, pre-harness"

    def rubric_version(self):
        # A ship from before the scaffold may keep its rubric somewhere else, or
        # not have one yet. That is a header line, not a reason to refuse the
        # report: config's readers die on a missing file, so they are only asked
        # when there is a file.
        if not os.path.isfile(self.rubric):
            return "none at skill/references/rubric.md"
        return config.rubric_version(self.rubric)

    def rubric_gates(self):
        if not os.path.isfile(self.rubric):
            return False        # no rubric is reporting only, never gating
        return config.rubric_gates(self.rubric)

    def files(self, patterns):
        """Globs relative to the repo root, in a stable order, existing only."""
        out = []
        for pat in patterns:
            p = str(pat)
            if os.path.isabs(p):
                found = sorted(globmod.glob(p))
            else:
                found = sorted(globmod.glob(os.path.join(self.root, p)))
            for f in found:
                if os.path.isfile(f) and f not in out:
                    out.append(f)
        return out

    def rel(self, path):
        try:
            return os.path.relpath(path, self.root).replace("\\", "/")
        except ValueError:
            return str(path).replace("\\", "/")

    # -- sources -------------------------------------------------------------

    def dated_sections(self, path, since):
        """`## ` entries dated on or after `since`. On a first harvest (no
        stamp, no --since) an undated entry is kept, because undated is not the
        same as old. Once a stamp exists it means everything before it was
        read, so an undated entry is not collected again: the first live run
        re-sent a whole eval log that a person had already read (2026-09)."""
        out = []
        for head, body, _at in _sections(_read(path)):
            d = _date_in(head)
            if since and (d is None or d < since):
                continue
            out.append((head, body, d))
        return out

    def changelog_entries(self, since):
        out = []
        for path in self.files(self.changelogs):
            for head, body, d in self.dated_sections(path, since):
                out.append((self.rel(path), head, body, d))
        return out

    def eval_findings(self, since):
        """The heading plus the paragraphs that carry a conclusion. A wave log
        is long and most of it is setup; what a second ship needs is the
        finding, the ruled-out and the standing conclusion."""
        out = []
        for path in self.files(self.eval_logs):
            for head, body, d in self.dated_sections(path, since):
                kept = [p for p in _paragraphs(body) if _is_finding(p)]
                if not kept:
                    first = _paragraphs(body)
                    kept = first[:1]
                if not kept:
                    continue
                out.append((self.rel(path), head, "\n\n".join(kept), d))
        return out

    def ruled_out(self, since):
        """Every 'Ruled out' section of the prompt logs, in file order. These
        are the entries the method calls the highest-value ones, and the ones a
        next engagement most needs to inherit as a lesson."""
        out = []
        for path in self.files(self.prompt_logs):
            txt = _read(path)
            for m in re.finditer(r"^## (Ruled out[^\n]*)\s*\n(.*?)(?=^## |^---|\Z)",
                                 txt, re.S | re.M):
                head, body = m.group(1).strip(), m.group(2).strip()
                # A ruled-out section is rarely dated itself; take the nearest
                # date above it in the file as its date.
                dates = _DATE.findall(txt[:m.start()])
                d = None
                if dates:
                    try:
                        d = dt.date.fromisoformat(dates[-1])
                    except ValueError:
                        d = None
                if since and (d is None or d < since):
                    continue
                out.append((self.rel(path), head, body, d))
        return out

    def named_sections(self):
        """`[harvest].sections`: `PATH::Heading prefix`, copied whole. For a
        ship that keeps a lesson somewhere the table does not know about."""
        out = []
        for entry in self.sections:
            raw = str(entry)
            if "::" not in raw:
                continue
            rel, prefix = raw.split("::", 1)
            prefix = prefix.strip()
            for path in self.files([rel.strip()]):
                for head, body, _at in _sections(_read(path)):
                    if head.lower().startswith(prefix.lower()):
                        out.append((self.rel(path), head, body))
        return out

    def rubric_repairs(self, since):
        """The bullets under 'Repair history:' in the rubric preamble, dated."""
        txt = _read(self.rubric)
        m = re.search(r"Repair history:\s*\n(.*?)(?=^## )", txt, re.S | re.M)
        if not m:
            return []
        out = []
        for b in re.findall(r"^- (.+?)(?=^- |\Z)", m.group(1), re.S | re.M):
            b = " ".join(b.split())
            d = _date_in(b)
            if since and (d is None or d < since):
                continue
            out.append((b, d))
        return out

    def waves(self):
        if not os.path.isdir(self.waves_dir):
            return []
        return sorted(f[:-3] for f in os.listdir(self.waves_dir)
                      if f.endswith(".md") and not f.startswith("README"))

    def commits_since(self, sha):
        """Findings written as commit subjects. A ship that logs in commits and
        nowhere else still has something to report; the conventional shape is
        the filter, so a merge or a 'wip' never travels."""
        if not sha:
            return []
        try:
            r = subprocess.run(["git", "-C", self.root, "log", "--no-merges",
                                "--format=%s", sha + "..HEAD"],
                               capture_output=True, text=True, timeout=60)
        except Exception:                       # noqa: BLE001 - git absent is not a crash
            return []
        if r.returncode != 0:
            return []
        return [line.strip() for line in (r.stdout or "").splitlines()
                if _COMMIT.match(line.strip())]

    # -- the nouns -----------------------------------------------------------

    def nouns(self):
        """Everything this ship must not send home: what armada.toml names, and
        every phrase in harvest/scrub.txt. Longest first so a scrub replaces the
        most specific phrase before its parts."""
        nouns = {}
        eng = self.cfg["engagement"]
        for key in ("name", "title"):
            v = (eng.get(key) or "").strip()
            if v and not v.startswith("{{"):
                nouns[v] = "<engagement>"
        for key, s in self.cfg["subjects"].items():
            nouns[key] = "<subject>"
            noun = (s.get("noun") or "").strip()
            if noun:
                nouns[noun] = "<subject>"
        for line in _read(self.scrub_file).splitlines():
            line = line.split("#", 1)[0].strip()
            if line:
                nouns[line] = "<redacted>"
        return sorted(nouns.items(), key=lambda kv: -len(kv[0]))


def _paragraphs(body):
    return [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip()]


def _is_finding(para):
    m = re.match(r"\*\*(.+?)\*\*", para)
    lead = (m.group(1) if m else para)[:40].strip().lower()
    return any(lead.startswith(w) for w in _LEADS)


# -------------------------------------------------------------------- scrub ---

def scrub(text, nouns, apply=True):
    """Report hits; replace them when `apply`. Case-insensitive, whole words for
    single tokens, phrase match for longer ones."""
    hits = {}
    for phrase, placeholder in nouns:
        pat = (r"\b" + re.escape(phrase) + r"\b") if " " not in phrase else re.escape(phrase)
        n = len(re.findall(pat, text, re.I))
        if n:
            hits[phrase] = (n, placeholder)
            if apply:
                text = re.sub(pat, placeholder, text, flags=re.I)
    return text, hits


def by_placeholder(hits):
    """`{'<subject>': 11, '<engagement>': 3}`. The only shape the note is
    allowed to carry: a count says a scrub happened, a phrase undoes it."""
    out = {}
    for _phrase, (n, placeholder) in hits.items():
        out[placeholder] = out.get(placeholder, 0) + n
    return out


# ------------------------------------------------------------------- report ---

def build(ship, since, apply_scrub, commits_sha=None):
    today = dt.date.today()
    entries = ship.changelog_entries(since)
    reps = ship.rubric_repairs(since)
    ro = ship.ruled_out(since)
    findings = ship.eval_findings(since)
    # A named section is a standing lesson; it travels on the first harvest only.
    named = ship.named_sections() if not since else []
    commits = ship.commits_since(commits_sha)

    lines = []
    lines.append("# Harvest - " + ship.callsign + " - " + today.isoformat())
    lines.append("")
    lines.append("Harness " + ship.harness() + ". Rubric " + ship.rubric_version()
                 + (", reporting only" if not ship.rubric_gates() else ", gating")
                 + ". Waves run: " + str(len(ship.waves())) + ".")
    lines.append("Since: " + (since.isoformat() if since else "the beginning") + ".")
    lines.append("")
    lines.append("What this ship learned about how the work is made, for the home port.")
    lines.append("Lessons travel; client words do not. A lesson that arrives from two")
    lines.append("ships becomes a law in SKILL.md; one that arrives once is a note in")
    lines.append("the owning reference. Nothing below has been promoted yet.")
    lines.append("")

    lines.append("## Changes to how the work is made")
    lines.append("")
    if not entries:
        lines.append("None since " + (since.isoformat() if since else "the scaffold") + ".")
        lines.append("")
    for src, head, body, _d in entries:
        lines.append("### " + head + "  (" + src + ")")
        lines.append("")
        lines.append(body)
        lines.append("")

    lines.append("## Rubric repairs (checks that were wrong about what they were for)")
    lines.append("")
    if not reps:
        lines.append("None recorded.")
    for b, _d in reps:
        lines.append("- " + b)
    lines.append("")

    lines.append("## Ruled out")
    lines.append("")
    if not ro:
        lines.append("Nothing ruled out yet.")
        lines.append("")
    for src, head, body, _d in ro:
        lines.append("### " + head + "  (" + src + ")")
        lines.append("")
        lines.append(body)
        lines.append("")

    lines.append("## The findings (eval logs)")
    lines.append("")
    if not findings:
        lines.append("No eval log, or nothing new in it.")
        lines.append("")
    for src, head, body, _d in findings:
        lines.append("### " + head + "  (" + src + ")")
        lines.append("")
        lines.append(body)
        lines.append("")

    lines.append("## Sections this ship named")
    lines.append("")
    if not named:
        lines.append("None named in [harvest].sections.")
        lines.append("")
    for src, head, body in named:
        lines.append("### " + head + "  (" + src + ")")
        lines.append("")
        lines.append(body)
        lines.append("")

    if commits:
        lines.append("## Findings written as commits")
        lines.append("")
        for s in commits:
            lines.append("- " + s)
        lines.append("")

    lines.append("## Waves")
    lines.append("")
    lines.append(", ".join(ship.waves()) or "none")
    lines.append("")

    text = "\n".join(lines).rstrip() + "\n"
    text, hits = scrub(text, ship.nouns(), apply_scrub)

    counts = by_placeholder(hits)
    tail = ["## De-clienting", ""]
    if apply_scrub:
        if counts:
            tail.append("Replaced " + str(sum(counts.values())) + " hits: "
                        + ", ".join(k + " x" + str(v) for k, v in sorted(counts.items()))
                        + ".")
        else:
            tail.append("No hits against the toml's nouns or the ship's scrub list.")
        tail.append("A scrub knows only the nouns armada.toml names and the phrases in")
        tail.append("harvest/scrub.txt. Read the note once more for quotes, people,")
        tail.append("places and product details before it is merged; anything found")
        tail.append("here is removed and the ship's scrub list gains the word.")
    else:
        tail.append("**Not scrubbed.** " + str(sum(counts.values())) + " hits would be "
                    "replaced: " + (", ".join(k + " x" + str(v)
                                              for k, v in sorted(counts.items()))
                                    or "none") + ".")
        tail.append("This text is verbatim and has not left the ship.")

    nothing_new = not (entries or reps or ro or findings or named or commits)
    return text + "\n" + "\n".join(tail) + "\n", hits, nothing_new


# -------------------------------------------------------------------- sweep ---

def _sweep_files(root):
    """Every text file under `root`. A git repo is asked what it tracks and what
    it has not ignored; anything else is walked. `.git` and binaries never."""
    root = os.path.abspath(root)
    if os.path.exists(os.path.join(root, ".git")):
        try:
            r = subprocess.run(["git", "-C", root, "ls-files", "--cached", "--others",
                                "--exclude-standard"],
                               capture_output=True, text=True, timeout=120)
            if r.returncode == 0:
                return [os.path.join(root, p) for p in (r.stdout or "").splitlines()
                        if p.strip()]
        except Exception:                       # noqa: BLE001 - fall back to the walk
            pass
    out = []
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d != ".git" and d != "__pycache__"]
        for f in sorted(files):
            out.append(os.path.join(base, f))
    return out


def sweep(ship, target):
    """Grep `target` for this ship's nouns. Prints `path: count` per hit and
    never the phrase - a sweep report that quoted the word it found would be
    the leak it exists to catch."""
    nouns = ship.nouns()
    target = os.path.abspath(os.path.expanduser(str(target)))
    hits = []
    for path in _sweep_files(target):
        try:
            data = open(path, "rb").read()
        except OSError:
            continue
        if b"\x00" in data:
            continue
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            continue
        _t, found = scrub(text, nouns, apply=False)
        n = sum(c for c, _p in found.values())
        if n:
            rel = os.path.relpath(path, target).replace("\\", "/")
            hits.append((rel, n))
    for rel, n in sorted(hits):
        print("  " + rel + ": " + str(n))
    if hits:
        print("\n  " + str(len(hits)) + " file(s) carry this ship's nouns, "
              + str(sum(n for _r, n in hits)) + " hits. The word is not printed; "
                "open the file and look for the subjects and the phrases in "
                "harvest/scrub.txt.")
        return EXIT_SWEEP_HIT
    print("  sweep       " + str(target) + ": 0 hits")
    return EXIT_OK


# --------------------------------------------------------------------- main ---

def main():
    ap = argparse.ArgumentParser(
        description="Package what a ship learned, scrubbed, for the fleet.")
    ap.add_argument("--repo", default=None, metavar="PATH",
                    help="the ship to report on (default: the repo this tool lives in)")
    ap.add_argument("--since", default=None, metavar="YYYY-MM-DD",
                    help="collect entries dated on or after this (default: the last harvest)")
    ap.add_argument("--scrub", action="store_true",
                    help="no-op: the scrub is the default and cannot be forgotten")
    ap.add_argument("--no-scrub", action="store_true",
                    help="print the verbatim note and its hit list; write nothing")
    ap.add_argument("--commits-since", default=None, metavar="SHA",
                    help="add the conventional commit subjects since SHA")
    ap.add_argument("--sweep", default=None, metavar="DIR",
                    help="grep DIR for this ship's nouns; exit 4 on any hit")
    ap.add_argument("--out", default=None,
                    help="write here instead of harvest/<date>-<callsign>.md")
    ap.add_argument("--dry-run", action="store_true", help="print the note, write nothing")
    a = ap.parse_args()

    ship = Ship(a.repo or config.REPO)

    if a.sweep:
        raise SystemExit(sweep(ship, a.sweep))

    since = None
    if a.since:
        try:
            since = dt.date.fromisoformat(a.since)
        except ValueError as e:                 # noqa: BLE001 - str(e), never e
            config.die("--since wants YYYY-MM-DD: " + str(e))
    else:
        last = _read(ship.last).strip().splitlines()
        stamp = last[0].strip() if last else ""
        if stamp:
            try:
                since = dt.date.fromisoformat(stamp)
            except ValueError:
                since = None

    text, hits, nothing_new = build(ship, since, not a.no_scrub, a.commits_since)
    counts = by_placeholder(hits)

    if a.no_scrub:
        print(text)
        print("  verbatim, unwritten. " + str(sum(c for c, _p in hits.values()))
              + " hits would be replaced:")
        for phrase, (n, placeholder) in sorted(hits.items()):
            print("    " + phrase + " x" + str(n) + " -> " + placeholder)
        print("  Re-run without --no-scrub to write the note.")
        raise SystemExit(EXIT_OK)

    if a.dry_run:
        print(text)
        raise SystemExit(EXIT_NOTHING_NEW if nothing_new else EXIT_OK)

    if nothing_new:
        print("  nothing new since " + (since.isoformat() if since else "the beginning")
              + ". No note written.")
        raise SystemExit(EXIT_NOTHING_NEW)

    today = dt.date.today().isoformat()
    os.makedirs(ship.harvest_dir, exist_ok=True)
    out = a.out or os.path.join(ship.harvest_dir, today + "-" + ship.callsign + ".md")
    parent = os.path.dirname(os.path.abspath(out))
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(text)
    with open(ship.last, "w", encoding="utf-8") as f:
        f.write(today + "\n")

    print("  callsign    " + ship.callsign)
    print("  harvest     " + out)
    print("  since       " + (since.isoformat() if since else "the beginning"))
    print("  changelog   " + str(len(ship.changelog_entries(since))) + " entries")
    print("  repairs     " + str(len(ship.rubric_repairs(since))))
    print("  ruled out   " + str(len(ship.ruled_out(since))) + " sections")
    print("  findings    " + str(len(ship.eval_findings(since))) + " eval-log entries")
    if a.commits_since:
        print("  commits     " + str(len(ship.commits_since(a.commits_since))) + " subjects")
    print("  scrubbed    " + str(sum(counts.values())) + " hits ("
          + (", ".join(k + " x" + str(v) for k, v in sorted(counts.items())) or "none")
          + ")")
    print("  read it once more: a scrub knows only the toml's nouns and scrub.txt.")
    raise SystemExit(EXIT_OK)


if __name__ == "__main__":
    main()
