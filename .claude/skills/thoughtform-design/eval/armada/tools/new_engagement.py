r"""Scaffold an engagement, and later refresh its harness.

    python tools/new_engagement.py ../acme-visuals --name acme --callsign petrel \
        --title "Acme — product visuals at scale" --drive "/Volumes/Drive/Acme"

    python tools/new_engagement.py ../acme-visuals --upgrade-tools

Everything under `templates/` is copied as it stands. There is no list of files
in this script and there must not be: the template set grows — a CLAUDE.md, a
DRIVE.md, a brief, a prompts log, a skill — and a scaffold that knows their
names is a scaffold that silently stops copying the newest one. Whatever is in
the folder is what a new engagement gets.

`{{name}}`, `{{title}}`, `{{callsign}}` and `{{date}}` are substituted in text
files and in path components. Binary files are copied byte for byte and never
re-encoded: a template may ship reference images, and those are inputs to a
validated pipeline where a silent resize changes what the model draws with no
error to warn anyone.

The callsign is the one word the fleet knows this ship by — chosen by a person,
never derived from the client's name — and `tools/harvest.py` refuses to write
without it. It may be left empty here and filled in later, in `armada.toml`.

`tools/` travels with the engagement. A client receives a self-contained repo:
the prose it can edit, and the harness that reads it. `--upgrade-tools`
refreshes only that folder and reports the version it moved between; it never
touches the engagement's toml, prose or pixels, because those are the parts the
engagement earned and this repo knows nothing about.

An existing non-empty target is refused. Scaffolding over live work is not a
recoverable mistake, and `--force` is the sentence that says you meant it.

`--upgrade-tools` refuses a target whose `tools/` carries no `ARMADA_VERSION`.
2026-09, found on a product-range engagement: its own donor tools shared
filenames with the harness — `qa.py`, `pick.py`, `crop.py` — but not their
CLIs, and a refit would have replaced working scripts with strangers under the
same names. `--adopt` is the sentence that says this ship really is taking the
harness on for the first time.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config  # noqa: E402

HERE = Path(__file__).resolve().parent
SRC_REPO = HERE.parent
TEMPLATES = SRC_REPO / "templates"

SKIP_NAMES = {"__pycache__", ".DS_Store", ".pytest_cache"}


def is_text(data: bytes) -> bool:
    """Text is what decodes as UTF-8 and holds no NUL. Everything else is
    copied untouched — the substitution must never walk into a PNG."""
    if b"\x00" in data:
        return False
    try:
        data.decode("utf-8")
        return True
    except UnicodeDecodeError:
        return False


def substitute(text: str, values: dict) -> str:
    for k, v in values.items():
        text = text.replace("{{" + k + "}}", v)
    return text


def copy_templates(target: Path, values: dict) -> int:
    if not TEMPLATES.is_dir():
        config.die("no templates/ beside " + str(HERE) + " — this is not the Armada "
                   "repo, or the templates were not checked out.")
    n = 0
    for root, dirs, files in os.walk(TEMPLATES):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_NAMES)
        rel = Path(root).relative_to(TEMPLATES)
        dest_dir = target / Path(substitute(str(rel), values)) if str(rel) != "." else target
        dest_dir.mkdir(parents=True, exist_ok=True)
        for f in sorted(files):
            if f in SKIP_NAMES:
                continue
            src = Path(root) / f
            dest = dest_dir / substitute(f, values)
            data = src.read_bytes()
            if is_text(data):
                dest.write_text(substitute(data.decode("utf-8"), values), encoding="utf-8")
            else:
                shutil.copy2(src, dest)         # byte-identical, always
            n += 1
    return n


def copy_tools(target: Path) -> tuple[int, list[str]]:
    """Every tool plus the version stamp. Files already in the target's tools/
    that this repo does not have are left alone and reported: deleting a tool an
    engagement wrote for itself is not this script's call."""
    dest_dir = target / "tools"
    dest_dir.mkdir(parents=True, exist_ok=True)
    sent = set()
    n = 0
    for src in sorted(HERE.iterdir()):
        if src.name in SKIP_NAMES or not src.is_file():
            continue
        if src.suffix != ".py" and src.name != "ARMADA_VERSION":
            continue
        shutil.copy2(src, dest_dir / src.name)
        sent.add(src.name)
        n += 1
    extra = sorted(p.name for p in dest_dir.iterdir()
                   if p.is_file() and p.suffix == ".py" and p.name not in sent)
    return n, extra


def read_version(tools_dir: Path) -> str:
    try:
        return (tools_dir / "ARMADA_VERSION").read_text(encoding="utf-8").strip()
    except OSError:
        return "unversioned"


def set_drive_root(toml_path: Path, drive: str) -> bool:
    """Write `[drive].root`. Only the first `root =` after `[drive]` is touched;
    a path is written as a TOML literal string so a Windows backslash survives."""
    if not toml_path.exists():
        return False
    text = toml_path.read_text(encoding="utf-8")
    value = ('"' + drive.replace("\\", "\\\\").replace('"', '\\"') + '"'
             if "'" in drive else "'" + drive + "'")
    out, in_drive, done = [], False, False
    for line in text.splitlines(True):
        stripped = line.strip()
        if stripped.startswith("["):
            in_drive = stripped.startswith("[drive]")
        if in_drive and not done and re.match(r"^\s*root\s*=", line):
            out.append("root = " + value + "\n")
            done = True
            continue
        out.append(line)
    if not done:
        out.append("\n[drive]\nroot = " + value + "\n")
    toml_path.write_text("".join(out), encoding="utf-8")
    return True


def git_init(target: Path) -> str:
    if shutil.which("git") is None:
        return "git not on PATH — skipped"
    if (target / ".git").exists():
        return "already a git repo — left alone"
    try:
        # `-b main`: the fleet's branches and pull requests are cut from main,
        # and a ship whose default branch is called something else is a manual
        # step at every refit.
        subprocess.run(["git", "init", "-q", "-b", "main"], cwd=str(target),
                       check=True, capture_output=True)
        return "git init (main)"
    except Exception as e:                      # noqa: BLE001 - str(e), never e
        return "git init failed: " + str(e)


def upgrade(target: Path, adopt: bool = False) -> int:
    if not (target / "armada.toml").exists():
        config.die(str(target) + " has no armada.toml — that is not an engagement, and "
                   "--upgrade-tools refreshes nothing else.")
    if (target / "tools").resolve() == HERE:
        config.die("that engagement's tools/ is this repo's tools/ — nothing to "
                   "upgrade from.")
    if not (target / "tools" / "ARMADA_VERSION").exists() and not adopt:
        config.die(str(target / "tools") + " has no ARMADA_VERSION, so this ship is "
                   "not carrying the harness. A refit refreshes a harness; it is not "
                   "a port of tools. A ship carrying its own donor tools under the "
                   "same filenames — qa.py, pick.py, crop.py — would have them "
                   "replaced by strangers with different CLIs. Read what is there "
                   "first; pass --adopt if this ship really is taking the harness on.")
    before = read_version(target / "tools")
    n, extra = copy_tools(target)
    after = read_version(target / "tools")
    print("  tools     " + before + " -> " + after
          + ("  (unchanged)" if before == after else ""))
    print("  refreshed " + str(n) + " files in " + str(target / "tools"))
    if extra:
        print("  left alone (not in this repo): " + ", ".join(extra))
    print("  the engagement's armada.toml, prose and pixels were not touched.")
    return 0


def main():
    ap = argparse.ArgumentParser(
        description="Scaffold an engagement from templates/, or refresh its tools/.")
    ap.add_argument("target", help="the new engagement's directory")
    ap.add_argument("--name", default="", help="short slug, e.g. acme")
    ap.add_argument("--callsign", default="",
                    help="one word the fleet knows this ship by, e.g. petrel; never "
                         "derived from the client's name")
    ap.add_argument("--title", default="", help='e.g. "Acme — product visuals at scale"')
    ap.add_argument("--drive", default="", help="absolute path where pixels will live")
    ap.add_argument("--date", default=date.today().isoformat(), metavar="YYYY-MM-DD")
    ap.add_argument("--force", action="store_true",
                    help="scaffold into a non-empty directory (it overwrites)")
    ap.add_argument("--upgrade-tools", action="store_true",
                    help="refresh <target>/tools/ from this repo and stop")
    ap.add_argument("--adopt", action="store_true",
                    help="with --upgrade-tools: this ship is taking the harness on "
                         "for the first time and has no ARMADA_VERSION yet")
    a = ap.parse_args()

    target = Path(a.target).expanduser().resolve()
    if a.upgrade_tools:
        raise SystemExit(upgrade(target, adopt=a.adopt))

    if not a.name:
        config.die("--name is required: it is the engagement's slug and it goes into "
                   "armada.toml, the skill and the folder names.")
    if target.exists() and any(target.iterdir()) and not a.force:
        config.die(str(target) + " is not empty. Scaffolding over live work is not "
                   "recoverable; pass --force if you meant it.")

    values = {"name": a.name, "title": a.title or a.name, "date": a.date,
              "callsign": a.callsign}
    target.mkdir(parents=True, exist_ok=True)
    n_t = copy_templates(target, values)
    n_c, extra = copy_tools(target)

    if a.drive:
        set_drive_root(target / "armada.toml", a.drive)

    print("\n  " + (a.title or a.name))
    print("  " + str(target))
    print("  callsign  " + (a.callsign or "(unset — set [engagement].callsign before "
                                          "the first harvest)"))
    print("  templates " + str(n_t) + " files")
    print("  tools     " + str(n_c) + " files, armada " + read_version(target / "tools"))
    if extra:
        print("  left alone in tools/: " + ", ".join(extra))
    print("  drive     " + (a.drive or "(unset — set [drive].root before drawing "
                                       "anything, or export ARMADA_DRIVE)"))
    print("  " + git_init(target))
    print("\n  next, from " + str(target) + ":")
    print("    python tools/doctor.py")
    print("    python tools/wave.py --audit")
    print("    python tools/wave.py --print-prompt <SLOT>")
    print()


if __name__ == "__main__":
    main()
