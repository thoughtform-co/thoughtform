"""
env — read the generation key BY NAME, from the ONE canonical file, and never
print it.

Lifted from `armada/tools/envload.py` (the harness this chain's still lane is
copied from). Its load-bearing properties are kept exactly:

  * the parser is NARROW (`^NAME=value$`), so an inlined JSON service account
    or a stray RTF fragment stays invisible rather than being dumped;
  * `require(name)` returns the value to the ONE function about to sign a
    request, and returns it nowhere else;
  * `describe()` / `--check` prints NAMES AND LENGTHS ONLY.

⚠ THE KEY LIVES IN ONE FILE, SHARED ACROSS PROJECTS, AND THIS CHAIN POINTS AT IT
(owner, 2026-08-31: "one canonical `.env`, do not go hunting"). The first cut of
this module read `scripts/voidwalker-avatar/.env` and its README told the reader
to COPY the key there — a second copy is a second thing to rotate, and the owner
has ruled against exactly that. Resolution order, and nothing else:

  1. `VOIDWALKER_ENV_FILE`, when set — a deliberate override (CI, another box);
  2. the canonical file below;
  3. a local `.env` beside this module ONLY if the canonical file is absent —
     kept so a machine without that tree can still run, never preferred.

⚠ ONLY THE NAMES THIS CHAIN USES ARE LOADED (`WANTED`). The canonical file holds
every generation key the practice has; a module that loads all of them holds
all of them in memory and can list all of them. It cannot now.

⚠ A MISSING OR REJECTED KEY STOPS THE RUN. It never falls back to another
provider or to a key found elsewhere on disk.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

CANONICAL = Path(
    r"C:\Users\buyss\Manifold Delta\Artifacts\Arcs_In The Pocket\projects"
    r"\20260820-ai-readiness\skill\scripts\.env"
)
LOCAL = Path(__file__).resolve().parent / ".env"
#: The only keys this chain signs requests with. ⚠ `OPENAI_API_KEY` joined for
#: ONE call (ADR-082 U41): the face edit's GPT Image 2 branch — the skill's own
#: "identity rescue when face drifts" route, documented since U1 and never
#: coded. Same law: read by name, printed as a length, never a fallback.
WANTED = ("GEMINI_API_KEY", "OPENAI_API_KEY")

_LINE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)=(.*)$")
_loaded: dict[str, str] | None = None


def env_path() -> Path:
    """Where the key is read from — see the resolution order above."""
    override = os.environ.get("VOIDWALKER_ENV_FILE")
    if override:
        return Path(override)
    if CANONICAL.exists():
        return CANONICAL
    return LOCAL


def load(path: Path | None = None) -> dict[str, str]:
    """Parse the file once, keeping only `WANTED`. Process env wins, so CI can
    override without a file at all."""
    global _loaded
    if _loaded is not None:
        return _loaded
    source = path or env_path()
    found: dict[str, str] = {}
    if source.exists():
        for raw in source.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            m = _LINE.match(line)
            if not m or m.group(1) not in WANTED:
                continue
            value = m.group(2).strip().strip('"').strip("'")
            if value:
                found[m.group(1)] = value
    for key in WANTED:
        if os.environ.get(key):
            found[key] = os.environ[key]
    _loaded = found
    return found


def require(name: str) -> str:
    """The value, to the caller about to sign a request. Never logged."""
    if name not in WANTED:
        raise SystemExit(f"{name} is not a key this chain uses (WANTED: {', '.join(WANTED)})")
    value = load().get(name)
    if not value:
        raise SystemExit(
            f"{name} is not set in {env_path()}.\n"
            f"  Stopping — this chain does not fall back to another provider or key.\n"
            f"  Re-check with:  python scripts/voidwalker-avatar/env.py --check {name}"
        )
    return value


def describe(names: list[str] | None = None) -> str:
    env = load()
    rows = []
    for key in names or list(WANTED):
        value = env.get(key)
        rows.append(
            f"  {key:28} {'present' if value else 'MISSING':8} "
            f"{'len=' + str(len(value)) if value else ''}"
        )
    return "\n".join(rows)


if __name__ == "__main__":
    wanted = sys.argv[2:] if len(sys.argv) > 2 and sys.argv[1] == "--check" else None
    print(f"env: {env_path()}")
    print(describe(wanted))
