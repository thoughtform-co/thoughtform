"""
env — read the generation keys BY NAME and never print one.

Lifted from `armada/tools/envload.py` (the harness this chain's still lane is
copied from), with the env path re-pointed at this folder. Its three
load-bearing properties are kept exactly:

  * the parser is NARROW (`^NAME=value$`), so an inlined JSON service account
    or a stray RTF fragment stays invisible rather than being dumped;
  * `require(name)` returns the value to the ONE function about to sign a
    request, and returns it nowhere else;
  * `describe()` / `--check` prints NAMES AND LENGTHS ONLY.

⚠ THE FILE IS GITIGNORED BY `.gitignore:77` (`.env`, a bare pattern that
matches at any depth). Verified with `git check-ignore -v`; if that ever stops
being true this file is the first thing to move, not the last.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parent / ".env"
_LINE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)=(.*)$")
_loaded: dict[str, str] | None = None


def load(path: Path = ENV_PATH) -> dict[str, str]:
    """Parse the env file once. Process env wins, so CI can override."""
    global _loaded
    if _loaded is not None:
        return _loaded
    found: dict[str, str] = {}
    if path.exists():
        for raw in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            m = _LINE.match(line)
            if not m:
                continue
            value = m.group(2).strip().strip('"').strip("'")
            if value:
                found[m.group(1)] = value
    for key in list(found):
        if os.environ.get(key):
            found[key] = os.environ[key]
    _loaded = found
    return found


def require(name: str) -> str:
    """The value, to the caller about to sign a request. Never logged."""
    value = load().get(name) or os.environ.get(name)
    if not value:
        raise SystemExit(
            f"{name} is not set.\n"
            f"  Put it in {ENV_PATH} as one `{name}=...` line, then re-check with:\n"
            f"    python3 scripts/voidwalker-avatar/env.py --check {name}"
        )
    return value


def describe(names: list[str] | None = None) -> str:
    env = load()
    keys = names or sorted(env)
    rows = []
    for key in keys:
        value = env.get(key) or os.environ.get(key)
        rows.append(
            f"  {key:28} {'present' if value else 'MISSING':8} "
            f"{'len=' + str(len(value)) if value else ''}"
        )
    return "\n".join(rows)


if __name__ == "__main__":
    wanted = sys.argv[2:] if len(sys.argv) > 2 and sys.argv[1] == "--check" else None
    print(f"env: {ENV_PATH}")
    print(describe(wanted))
