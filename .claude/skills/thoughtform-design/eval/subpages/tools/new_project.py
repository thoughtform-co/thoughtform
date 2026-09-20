r"""Scaffold a project on the standard, or bring an existing repo onto it.

    python tools/new_project.py ../my-project --name my-project --callsign osprey --title "My project"
    python tools/new_project.py ../existing-repo --adopt --callsign osprey
    python tools/new_project.py ../my-project --github [--owner thoughtform-co] [--dry-run]

A project on the standard is any repo of the practice that is not a
production ship. It carries the agent briefing (`AGENTS.md`, imported by
`CLAUDE.md`), the memory file, a changelog, the commit rule and a report-home
hook, so the home port can read it under its callsign without anyone
supervising it. The production scaffold is `new_engagement.py`; a project that
has pixels is a ship and uses that.

Everything under `templates-project/` is copied as it stands, through the
same `copy_templates` the ship scaffold uses, with `{{name}}`, `{{title}}`,
`{{callsign}}` and `{{date}}` substituted. No list of files lives here.

`--adopt` brings a repo that already exists onto the standard and **never
overwrites**: every file that is already there is left alone and reported.
Where `CLAUDE.md` exists and `AGENTS.md` does not, `AGENTS.md` is written as a
pointer to it, so an existing briefing keeps its home; the template's
`CLAUDE.md` is then skipped because one exists. Where `armada.toml` exists (a
ship), its `[harvest]` table gains `memory = "MEMORY.md"` if it has no
`memory` key, and nothing else in it moves. At the home port itself (a
`templates/armada.toml` beside `tools/`) no `armada.toml` is written: the port
has no engagement of its own, and `config.load()` refuses one on purpose.

`--github` creates the private repository under the owner and adds the
`armada-ship` topic, which is how the nightly harvest discovers a repo. It
runs `gh`, which holds its own credentials; nothing here reads or prints a
token. A push refused with a permission error is almost always the wrong
account active in `gh`: `gh auth switch --user <owner>`.
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
import new_engagement as scaffold  # noqa: E402

HERE = Path(__file__).resolve().parent
SRC_REPO = HERE.parent
TEMPLATES = SRC_REPO / "templates-project"

POINTER = ("# Agent briefing\n\n"
           "This repo's briefing is `CLAUDE.md`, written before the standard split the\n"
           "briefing from Claude Code's own lines. Read it first; it is the file every\n"
           "agent follows here. When it is next rewritten, move it here and leave\n"
           "`CLAUDE.md` as `@AGENTS.md` plus what only Claude Code needs.\n")


def slug_of(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "project"


def is_port(target: Path) -> bool:
    """The home port carries the scaffold beside its tools and has no engagement."""
    return (target / "templates" / "armada.toml").exists() and \
        (target / "tools" / "new_engagement.py").exists()


SKIP_DIRS = {".git", "node_modules", "__pycache__", "_drive", ".venv", "venv", "renders",
             "corpus", ".claude"}


def _find(target: Path, want) -> list[str]:
    """Relative POSIX paths of every file whose name `want(name, parts)` accepts,
    skipping the folders a walk must never enter. Sorted, so a toml written
    from the result is stable."""
    out = []
    for root, dirs, files in os.walk(target):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
        rel_root = Path(root).relative_to(target)
        for f in files:
            if want(f, rel_root.parts):
                out.append(str(rel_root / f).replace("\\", "/") if str(rel_root) != "."
                           else f)
    return sorted(out)


def existing_record(target: Path) -> dict:
    """What the repo already keeps that the port reads: changelogs, eval logs,
    prompt logs, a waves folder. An adopted repo keeps them where they are;
    the fresh toml points at them, and no second changelog is written beside
    one that exists (0.4.2)."""
    changelogs = _find(target, lambda n, p: n == "CHANGELOG.md")
    eval_logs = _find(target, lambda n, p: n.lower().replace("_", "-").endswith("eval-log.md"))
    prompt_logs = _find(target, lambda n, p: n == "LOG.md" and "prompts" in p)
    waves = "evals/waves" if (target / "evals" / "waves").is_dir() else ""
    return {"changelogs": changelogs, "eval_logs": eval_logs, "prompt_logs": prompt_logs,
            "waves": waves}


def point_harvest(toml_path: Path, record: dict) -> list[str]:
    """Rewrite the four `[harvest]` list keys of a freshly written project toml
    to the files the repo already has. Textual, one line each; returns the keys
    it changed."""
    text = toml_path.read_text(encoding="utf-8")
    changed = []

    def lst(items):
        return "[" + ", ".join('"' + i + '"' for i in items) + "]"

    for key, value in (("changelogs", lst(record["changelogs"])),
                       ("eval_logs", lst(record["eval_logs"])),
                       ("prompt_logs", lst(record["prompt_logs"])),
                       ("waves", '"' + record["waves"] + '"')):
        if key == "changelogs" and not record["changelogs"]:
            continue                            # the template's root changelog stands
        new, n = re.subn(r"^(\s*)" + key + r"\s*=.*$", r"\g<1>" + key + " = " + value,
                         text, count=1, flags=re.M)
        if n and new != text:
            text, changed = new, changed + [key]
    if changed:
        toml_path.write_text(text, encoding="utf-8")
    return changed


def point_empty_changelogs(toml_path: Path) -> bool:
    """`changelogs = []` becomes `changelogs = ["CHANGELOG.md"]`, textually, and
    nothing else moves. Returns True when the line changed."""
    text = toml_path.read_text(encoding="utf-8")
    new, n = re.subn(r"^(\s*changelogs\s*=\s*)\[\s*\](.*)$", r'\g<1>["CHANGELOG.md"]\2',
                     text, count=1, flags=re.M)
    if n and new != text:
        toml_path.write_text(new, encoding="utf-8")
        return True
    return False


def ensure_memory_key(toml_path: Path) -> bool:
    """Give an existing `[harvest]` table a `memory` key, textually, touching
    nothing else. Returns True when a line was added."""
    text = toml_path.read_text(encoding="utf-8")
    if re.search(r"^\s*memory\s*=", text, re.M):
        return False
    lines = text.splitlines(True)
    out, done = [], False
    for line in lines:
        out.append(line)
        if not done and line.strip() == "[harvest]":
            out.append('memory = "MEMORY.md"      # the memory file; rulings, one line each\n')
            done = True
    if not done:
        out.append("\n[harvest]\nmemory = \"MEMORY.md\"\n")
    toml_path.write_text("".join(out), encoding="utf-8")
    return True


def adopt(target: Path, values: dict, dry_run: bool) -> int:
    if not target.is_dir():
        config.die(str(target) + " is not a directory. --adopt brings a repo that exists "
                   "onto the standard; to make a new one, drop --adopt.")
    notes = []
    claude, agents, toml = target / "CLAUDE.md", target / "AGENTS.md", target / "armada.toml"
    pointer = claude.exists() and not agents.exists()
    port = is_port(target)
    had_toml = toml.exists()
    record = existing_record(target)
    keeps_changelog = bool(record["changelogs"]) and not (target / "CHANGELOG.md").exists()
    if dry_run:
        print("  would adopt " + str(target))
        if pointer:
            print("  AGENTS.md  would be a pointer to the existing CLAUDE.md")
        if port:
            print("  armada.toml would not be written: this is the home port")
        if keeps_changelog:
            print("  CHANGELOG.md would not be written: the repo keeps "
                  + ", ".join(record["changelogs"]))
        if not had_toml and not port:
            print("  armada.toml would point [harvest] at: " + ", ".join(
                record["changelogs"] + record["eval_logs"] + record["prompt_logs"]
                + ([record["waves"]] if record["waves"] else [])) or "  (nothing found)")
        for root, dirs, files in os.walk(TEMPLATES):
            dirs[:] = sorted(d for d in dirs if d not in scaffold.SKIP_NAMES)
            rel = Path(root).relative_to(TEMPLATES)
            for f in sorted(files):
                dest = (target / rel / f) if str(rel) != "." else (target / f)
                state = "left alone" if dest.exists() else "would write"
                if f == "CHANGELOG.md" and str(rel) == "." and keeps_changelog:
                    state = "not written"
                print("  " + state.ljust(12) + str((rel / f) if str(rel) != "." else f).replace("\\", "/"))
        return 0
    if pointer:
        agents.write_text(POINTER, encoding="utf-8")
        notes.append("AGENTS.md written as a pointer to the existing CLAUDE.md")
    written, skipped = scaffold.copy_templates(target, values, src=TEMPLATES, skip_existing=True)
    if port and "armada.toml" in written:
        toml.unlink()
        written.remove("armada.toml")
        notes.append("armada.toml not written: this is the home port, which has no engagement")
    if keeps_changelog and "CHANGELOG.md" in written:
        # A root changelog beside skill/CHANGELOG.md is the two-changelog
        # failure already on record (two homes diverge, and a block of rounds
        # ends up in only one of them).
        (target / "CHANGELOG.md").unlink()
        written.remove("CHANGELOG.md")
        notes.append("CHANGELOG.md not written: the repo keeps " + ", ".join(record["changelogs"]))
    if had_toml and ensure_memory_key(toml):
        notes.append("armada.toml: [harvest] gained memory = \"MEMORY.md\"; nothing else moved")
    if had_toml and "CHANGELOG.md" in written and point_empty_changelogs(toml):
        # The repo had a toml with `changelogs = []` and no changelog anywhere;
        # the root one just written is now the one the port reads.
        notes.append("armada.toml: [harvest].changelogs was empty and now names CHANGELOG.md")
    if not had_toml and "armada.toml" in written:
        keys = point_harvest(toml, record)
        if keys:
            notes.append("armada.toml: [harvest] points at what the repo already keeps ("
                         + ", ".join(keys) + ")")
    if pointer:
        written.insert(0, "AGENTS.md (pointer)")
        skipped = [s for s in skipped if s != "AGENTS.md"]
    print("\n  adopted   " + str(target))
    print("  written   " + (", ".join(written) or "nothing"))
    print("  left alone " + (", ".join(skipped) or "nothing"))
    for n in notes:
        print("  " + n)
    cs = values.get("callsign") or ""
    if not cs and not had_toml:
        print("  callsign  (unset - set [engagement].callsign in armada.toml before the "
              "first harvest)")
    print("  the repo's own files were not touched.")
    return 0


def github(target: Path, owner: str, dry_run: bool, remote: str = "") -> int:
    """The remote, private, with the topic the nightly flow discovers it by.

    `remote` names the repository when it is not the engagement's slug. The
    port holds no naming convention of its own and never will: a fleet that
    prefixes its repos is the operator's decision, made once per ship at the
    command line, and a prefix hardcoded here would rename the next fleet's
    repos for them. 2026-09: three ships in a row created their remote by
    hand for exactly this, which is two more than a flag costs.
    """
    toml = target / "armada.toml"
    if not toml.exists():
        config.die(str(target) + " has no armada.toml; scaffold or --adopt first.")
    cfg = config.load(toml, fresh=True)
    config.callsign(cfg)                    # dies without one: no repo without a callsign
    name = (remote or "").strip() or (cfg["engagement"].get("name") or "").strip()         or slug_of(target.name)
    slug = owner + "/" + name
    cmds = [["gh", "repo", "create", slug, "--private", "--source", str(target), "--push"],
            ["gh", "repo", "edit", slug, "--add-topic", "armada-ship"]]
    for c in cmds:
        print("  " + " ".join(c))
    if dry_run:
        print("  dry run: nothing created.")
        return 0
    if shutil.which("gh") is None:
        config.die("gh is not on PATH. Install the GitHub CLI, or run the two commands above "
                   "by hand.")
    for c in cmds:
        r = subprocess.run(c, cwd=str(target), capture_output=False)
        if r.returncode != 0:
            config.die(" ".join(c[:3]) + " exited " + str(r.returncode) + ". A permission "
                       "error is almost always the wrong account: gh auth switch --user "
                       + owner + ", then run the command again.")
    print("  created " + slug + " (private) with the armada-ship topic.")
    return 0


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Scaffold a project on the standard, or bring an existing repo onto it.")
    ap.add_argument("target", help="the project's directory")
    ap.add_argument("--name", default="", help="short slug, e.g. my-project")
    ap.add_argument("--callsign", default="",
                    help="one word the fleet knows this project by; never derived from a "
                         "client's name")
    ap.add_argument("--title", default="", help='e.g. "My project"')
    ap.add_argument("--date", default=date.today().isoformat(), metavar="YYYY-MM-DD")
    ap.add_argument("--force", action="store_true",
                    help="scaffold into a non-empty directory (it overwrites)")
    ap.add_argument("--adopt", action="store_true",
                    help="bring an existing repo onto the standard; never overwrites")
    ap.add_argument("--github", action="store_true",
                    help="create the private GitHub repo and add the armada-ship topic")
    ap.add_argument("--owner", default="thoughtform-co", help="GitHub owner for --github")
    ap.add_argument("--dry-run", action="store_true", help="say what would happen; do nothing")
    a = ap.parse_args()

    target = Path(a.target).expanduser().resolve()
    if a.github and not a.adopt and not a.name:
        raise SystemExit(github(target, a.owner, a.dry_run))

    name = a.name or slug_of(target.name)
    values = {"name": name, "title": a.title or (a.name or target.name), "date": a.date,
              "callsign": a.callsign}
    if a.adopt:
        code = adopt(target, values, a.dry_run)
        if a.github and code == 0 and not a.dry_run:
            code = github(target, a.owner, False)
        raise SystemExit(code)

    if not a.name:
        config.die("--name is required: it is the project's slug and it goes into "
                   "armada.toml and the README.")
    if target.exists() and any(target.iterdir()) and not a.force:
        config.die(str(target) + " is not empty. Scaffolding over live work is not "
                   "recoverable; pass --force if you meant it, or --adopt to add only "
                   "what is missing.")
    if a.dry_run:
        print("  would scaffold " + str(target) + " from " + str(TEMPLATES))
        for root, dirs, files in os.walk(TEMPLATES):
            dirs[:] = sorted(d for d in dirs if d not in scaffold.SKIP_NAMES)
            rel = Path(root).relative_to(TEMPLATES)
            for f in sorted(files):
                print("  would write " + str((rel / f) if str(rel) != "." else f).replace("\\", "/"))
        raise SystemExit(0)
    target.mkdir(parents=True, exist_ok=True)
    written, _skipped = scaffold.copy_templates(target, values, src=TEMPLATES)
    print("\n  " + values["title"])
    print("  " + str(target))
    print("  callsign  " + (a.callsign or "(unset - set [engagement].callsign before the "
                                          "first harvest)"))
    print("  files     " + str(len(written)))
    print("  " + scaffold.git_init(target))
    print("\n  next, from " + str(target) + ":")
    print("    write what the project is, in README.md")
    print("    read MEMORY.md on entry, write it in the session, commit with /commit")
    if a.github:
        print()
        github(target, a.owner, a.dry_run)
    print()


if __name__ == "__main__":
    main()
