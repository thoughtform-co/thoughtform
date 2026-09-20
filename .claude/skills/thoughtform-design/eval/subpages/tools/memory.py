r"""The memory file, read and linted.

    python tools/memory.py                     every entry, in file order
    python tools/memory.py --since 2026-09-01  entries dated on or after
    python tools/memory.py --check             lint; exit 1 on any finding
    python tools/memory.py --repo ../project   another repo's file

`MEMORY.md` is the fourth file of a repo on the standard (0.4.0): what the
project decided, learned and ruled out, one line per entry, dated, in four
fixed sections, with a pointer to where the argument lives. It is the file a
session reads on entry and the essence the home port extracts from, so it has
a grammar and a ceiling. The grammar and the parser live in `config.py`; this
tool only reads, lists and checks.

Which file: `[harvest].memory` in the repo's `armada.toml` when there is one
(an empty string disables the memory file for that repo), else `MEMORY.md` at
the repo root. The home port has no toml and reads its own `MEMORY.md`.

Output is ASCII. Nothing here reads a key.
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import config  # noqa: E402


def memory_path(repo: str) -> str | None:
    """The memory file for a repo, or None when its toml disables it."""
    root = os.path.abspath(os.path.expanduser(repo))
    toml = os.path.join(root, "armada.toml")
    rel = "MEMORY.md"
    if os.path.isfile(toml):
        cfg = config.load(toml, fresh=True)
        rel = (cfg.get("harvest") or {}).get("memory", "MEMORY.md")
        if not rel:
            return None
    return os.path.join(root, rel)


def main() -> None:
    ap = argparse.ArgumentParser(description="Read or lint a repo's MEMORY.md.")
    ap.add_argument("--repo", default=None, metavar="PATH",
                    help="the repo (default: the one this tool lives in)")
    ap.add_argument("--since", default=None, metavar="YYYY-MM-DD",
                    help="list only entries dated on or after this")
    ap.add_argument("--check", action="store_true",
                    help="lint the file against the grammar; exit 1 on any finding")
    a = ap.parse_args()

    repo = a.repo or str(config.REPO)
    path = memory_path(repo)
    if path is None:
        print("  memory      disabled in armada.toml ([harvest].memory is empty)")
        raise SystemExit(0)
    rel = os.path.relpath(path, os.path.abspath(repo)).replace("\\", "/")

    if a.check:
        findings = config.memory_lint(path)
        if findings:
            for f in findings:
                print("  " + f)
            print("\n  " + str(len(findings)) + " finding(s) in " + rel + ".")
            raise SystemExit(1)
        entries = [e for e in config.memory_entries(path) if e["date"]]
        tagged = sum(1 for e in entries if e["tag"])
        print("  memory      " + rel + ": " + str(entries and len(entries) or 0)
              + " entries, " + str(tagged) + " tagged, ok")
        raise SystemExit(0)

    since = None
    if a.since:
        try:
            since = dt.date.fromisoformat(a.since)
        except ValueError as e:                 # noqa: BLE001 - str(e), never e
            config.die("--since wants YYYY-MM-DD: " + str(e))
    entries = config.memory_entries(path)
    if not entries and not os.path.isfile(path):
        print("  memory      no " + rel + " in " + repo)
        raise SystemExit(0)
    shown = 0
    for e in entries:
        if e["date"] is None:
            continue
        if since and e["date"] < since:
            continue
        tag = (" [" + e["tag"] + "]") if e["tag"] else ""
        ptr = ("  -> " + e["pointer"]) if e["pointer"] else ""
        print("  " + e["date"].isoformat() + tag + "  " + e["section"].lower().ljust(9)
              + " " + e["text"] + ptr)
        shown += 1
    print("\n  " + str(shown) + " entr" + ("y" if shown == 1 else "ies")
          + (" since " + since.isoformat() if since else "") + " in " + rel + ".")
    raise SystemExit(0)


if __name__ == "__main__":
    main()
