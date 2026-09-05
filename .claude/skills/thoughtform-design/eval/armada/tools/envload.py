#!/usr/bin/env python3
r"""Credentials by name, and by name only.

Nothing here ever prints, logs or returns a credential value to a caller that
did not ask for it by name. `require("GEMINI_API_KEY")` hands the value to the
one function that is about to sign a request with it; every other path in this
file deals in names and lengths.

Precedence, highest first:

    1. the process environment
    2. `<repo>/.env`, then `<repo>/.env.txt`
    3. the file named by `ARMADA_ENV`
    4. `armada.toml` `[env].canonical`

The order is the useful one: a shell export beats a checked-out file, a repo
file beats a machine-wide one, and the canonical path in the toml is the
fallback for a machine where several engagements share one key store. All four
are gitignored or outside the repo; none of them is ever committed.

Parsing is deliberately narrow. Only lines matching

    ^[A-Za-z_][A-Za-z0-9_]*=(.*)$

are read. Measured on a prior corpus: a shared `.env` had a JSON service
account inlined across a dozen indented lines, and anything that "lists the
keys in this file" by splitting on `=` dumps the private key to the terminal.
Matching the key at the start of the line makes that block invisible instead of
dangerous.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config  # noqa: E402

# One key per line: a name, then "=", then the rest of the line verbatim.
# Anything else - JSON braces, indented quoted keys, prose, blanks, comments -
# is skipped, which is what keeps an inlined service-account block harmless.
_KEY_LINE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)=(.*)$")

_ENV_FILES = (".env", ".env.txt")  # highest-precedence file first


def _strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
        return value[1:-1]
    return value


def parse_env_file(path: Path) -> dict:
    """One env file as a dict. Every line that is not `KEY=value` is ignored,
    and the first hit for a key inside one file wins."""
    found: dict[str, str] = {}
    try:
        text = Path(path).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return found
    for raw in text.splitlines():
        m = _KEY_LINE.match(raw.rstrip("\r\n"))
        if not m:
            continue
        found.setdefault(m.group(1), _strip_quotes(m.group(2)))
    return found


def _canonical() -> Path | None:
    """`armada.toml` `[env].canonical`, if there is a toml and it names one.
    Reading credentials must not require an engagement, so a missing toml is
    silence here rather than the failure `config.load()` would raise."""
    if not config.CONFIG_PATH.exists():
        return None
    try:
        rel = (config.load().get("env") or {}).get("canonical", "")
    except SystemExit:
        return None
    return Path(rel) if rel else None


def search_paths() -> list[Path]:
    """The files consulted, highest precedence first (the process environment
    sits above all of them and is not a file)."""
    paths = [config.REPO / name for name in _ENV_FILES]
    named = os.environ.get("ARMADA_ENV", "").strip()
    if named:
        paths.append(Path(named))
    canon = _canonical()
    if canon:
        paths.append(canon)
    return paths


def load_env() -> dict:
    """The merged credential map. Lowest precedence is read first so the
    higher one overwrites it."""
    merged: dict[str, str] = {}
    for path in reversed(search_paths()):
        merged.update(parse_env_file(path))
    for key, value in os.environ.items():
        if value and _KEY_LINE.match(key + "="):
            merged[key] = value
    return merged


_CACHE: dict | None = None


def env(refresh: bool = False) -> dict:
    """Cached `load_env()`, so a long run reads the files once."""
    global _CACHE
    if _CACHE is None or refresh:
        _CACHE = load_env()
    return _CACHE


def require(name: str, values: dict | None = None) -> str:
    """The value for `name`, or exit with a message naming the key and every
    file that was searched for it. The message never contains a value."""
    values = values if values is not None else env()
    value = values.get(name, "")
    if not value:
        lines = ["missing credential: " + name,
                 "    Set it as a single line " + name + "=<value> in the process",
                 "    environment or in one of these, highest precedence first:"]
        for p in search_paths():
            lines.append("      " + ("ok      " if Path(p).exists() else "missing ") + str(p))
        lines.append("    All of them are gitignored or outside the repo. Never commit")
        lines.append("    or print the value.")
        config.die("\n".join(lines))
    return value


def describe(values: dict | None = None) -> list[tuple[str, int]]:
    """Key names and value lengths only - safe to print anywhere."""
    values = values if values is not None else env()
    return [(k, len(v)) for k, v in sorted(values.items())]


def file_keys() -> list[str]:
    """The names of the keys the searched files declare, sorted. Names only."""
    names: set[str] = set()
    for p in search_paths():
        names.update(parse_env_file(p))
    return sorted(names)


def source_of(name: str) -> str:
    """Where `name` is coming from, by file, for a check line. Never a value."""
    if os.environ.get(name):
        return "process env"
    for p in search_paths():
        if name in parse_env_file(p):
            return str(p)
    return "-"


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Report which credentials are present. Names and lengths only, never values.",
        epilog="python tools/envload.py --check GEMINI_API_KEY OPENAI_API_KEY")
    ap.add_argument("--check", nargs="*", metavar="KEY",
                    help="keys to report on; with no names, every key the searched files declare")
    a = ap.parse_args()

    print("  repo    " + str(config.REPO))
    for p in search_paths():
        print("  env     " + ("ok      " if Path(p).exists() else "missing ") + str(p))

    values = env()
    if a.check is None:
        print("\n  pass --check KEY [KEY ...] to report on named keys")
        return
    names = a.check or file_keys()
    if not names:
        print("\n  no keys declared in any searched file")
        return
    print("")
    for name in names:
        v = values.get(name, "")
        if v:
            print("  " + name.ljust(28) + "present  len=" + str(len(v))
                  + "  from " + source_of(name))
        else:
            print("  " + name.ljust(28) + "absent")


if __name__ == "__main__":
    main()
