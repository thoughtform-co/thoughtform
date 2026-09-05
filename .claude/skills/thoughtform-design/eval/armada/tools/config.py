r"""The one place the contracts live.

Every other tool imports this and nothing else about the engagement. Three
files are read at runtime and never copied into code:

    armada.toml                       structure - subjects, types, settings, models, paths
    skill/references/generation.md    prose     - the shared block, settings, repair clauses
    skill/references/rubric.md        judgment  - the checks the grader parses

If a script and one of those files disagree, the file is right and the script
has a bug. That is the mirror rule, and it is what lets a person change how the
work is made by editing English.

Filenames are structure:

    <TYPE>-<subject>[__<suffix>]__<lane>_<nn>.png

`slot_of` gives `<TYPE>-<subject>`; a suffix (`r2`, `alt`) marks a repair draw
that shares the slot and may only win on a strictly better verdict.

Waves live on Drive, never in the repo:

    <drive.root>/<drive.creation>/<wave>/<TYPE> - <Type name>/<file>
    ...                                          /MANIFEST.jsonl

Requires Python 3.11 (tomllib), or 3.10 with `tomli`. Nothing here touches the network.
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

try:
    import tomllib  # Python 3.11+
except ModuleNotFoundError:  # pragma: no cover - older interpreters
    try:
        import tomli as tomllib  # type: ignore  # `pip install tomli`
    except ModuleNotFoundError:
        sys.exit("\n  x armada needs Python 3.11+ (tomllib), or `pip install tomli` on 3.10.\n")

HERE = Path(__file__).resolve().parent
ARMADA_VERSION_FILE = HERE / "ARMADA_VERSION"


# ---------------------------------------------------------------- repo root ---

def repo_root(start: Path | None = None) -> Path:
    """Walk up from `start` (default: this file) to the first `armada.toml`.
    Falls back to the first `.git`, then to the tools' parent."""
    here = (start or HERE).resolve()
    for cand in (here, *here.parents):
        if (cand / "armada.toml").exists():
            return cand
    for cand in (here, *here.parents):
        if (cand / ".git").exists():
            return cand
    return HERE.parent


REPO = repo_root()
CONFIG_PATH = REPO / "armada.toml"
GENERATION_MD = REPO / "skill" / "references" / "generation.md"
RUBRIC_MD = REPO / "skill" / "references" / "rubric.md"


def die(msg: str) -> None:
    sys.exit("\n  x " + msg + "\n")


# ------------------------------------------------------------------- config ---

_DEFAULTS = {
    "engagement": {"name": "engagement", "title": "", "started": "", "callsign": ""},
    "drive": {"root": "", "source": "01_Source", "creation": "02_Creation",
              "final": "03_Final"},
    "env": {"canonical": ""},
    "models": {"default": "nano",
               "lanes": {"nano": "gemini-3-pro-image",
                         "flash": "gemini-3.1-flash-image",
                         "gpt": "gpt-image-2"},
               "graders": ["gemini-flash-latest"]},
    "prompt": {"scale_clause": "SCALE. The subject is {scale}. Everything around it "
                               "is sized to agree with that.",
               "swap_paragraph": "LIGHT AND GROUND.",
               "max_refs": 3},
    "refs": {"refuse": ["DO NOT TRAIN", "SUPERSEDED", "DUPLICATE"],
             "model_ready_px": 2048, "model_ready_mb": 6},
    "formats": {"cuts": {"1:1": [], "4:5": ["9:16"], "3:2": ["16:9", "2:1"],
                         "2:3": ["9:16"]},
                "anchor": 0.42},
    "harvest": {"changelogs": ["skill/CHANGELOG.md"],
                "eval_logs": ["skill/references/eval-log.md"],
                "prompt_logs": ["prompts/LOG.md"],
                "waves": "evals/waves",
                "sections": []},
    "subjects": {}, "types": {}, "settings": {}, "anchors": {},
    "detail_for": {}, "attach": {},
}


def _merge(base: dict, over: dict) -> dict:
    out = dict(base)
    for k, v in over.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _merge(out[k], v)
        else:
            out[k] = v
    return out


_CONFIG_CACHE: dict | None = None


def load(path: Path | None = None, fresh: bool = False) -> dict:
    """armada.toml merged over the defaults above. Cached per process."""
    global _CONFIG_CACHE
    if _CONFIG_CACHE is not None and not fresh and path is None:
        return _CONFIG_CACHE
    p = Path(path) if path else CONFIG_PATH
    if not p.exists():
        # 2026-09: a session ran the harness from the home port and read the
        # generic "no armada.toml" as a broken checkout. The home port has no
        # client and never will; say so rather than sending anyone looking for
        # a file that is not meant to exist here.
        if (HERE.parent / "templates" / "armada.toml").exists():
            die("no armada.toml at " + str(p) + " - and there should not be. This is "
                "Armada itself, the home port: the harness, the method and the "
                "scaffold, with no engagement of its own. Scaffold a ship with "
                "tools/new_engagement.py <dir> --name <slug> --callsign <word>, or "
                "cd into a ship and run it there.")
        die("no armada.toml at " + str(p) + ". Run tools/new_engagement.py, or "
            "cd into an engagement repo.")
    with open(p, "rb") as f:
        raw = tomllib.load(f)
    cfg = _merge(_DEFAULTS, raw)
    # Types get defaults per entry.
    for key, t in cfg["types"].items():
        t.setdefault("name", key)
        t.setdefault("question", "")
        t.setdefault("channel", "")
        t.setdefault("ar", "4:5")
        t.setdefault("anchor", "")
        t.setdefault("setting_blind", False)
        for axis in ("camera", "position", "shape"):
            t.setdefault(axis, "")
        for line in ("shot", "subject", "camera_line"):
            t.setdefault(line, "")
    for key, s in cfg["subjects"].items():
        s.setdefault("noun", key)
        s.setdefault("proof", "")
        s.setdefault("place", "")
        s.setdefault("scale", "")
        s.setdefault("identity", "")
        s.setdefault("detail", {})
        s.setdefault("parts", {})
    if "default" not in cfg["settings"]:
        cfg["settings"]["default"] = {}
    for key, s in cfg["settings"].items():
        s.setdefault("surface", "")
        s.setdefault("anchors", key == "default")
        s.setdefault("places", {})
    if path is None:
        _CONFIG_CACHE = cfg
    return cfg


def armada_version() -> str:
    try:
        return ARMADA_VERSION_FILE.read_text(encoding="utf-8").strip()
    except OSError:
        return "unversioned"


# ----------------------------------------------------------------- callsign ---

CALLSIGN_RE = re.compile(r"^[a-z][a-z0-9-]{1,23}$")


def callsign(cfg: dict | None = None) -> str:
    """`[engagement].callsign`, validated, or a death.

    2026-09: the fleet's first automated report home named its notes after the
    engagement, which put a client's slug in a filename, a branch, a pull
    request title and a label in one run. A callsign is the fix: one word a
    person picks, never derived from the client's name, and the only name the
    home port knows a ship by. `name` stays aboard.
    """
    cfg = cfg or load()
    raw = (cfg.get("engagement", {}).get("callsign") or "").strip()
    if not raw or raw.startswith("{{"):
        die("this ship has no [engagement].callsign in armada.toml. A callsign is "
            "one word, chosen by a person and never derived from the client's name: "
            "it is the only name the home port knows this ship by, and it is what "
            "the note, the branch and the stamp are called. Lower case, a letter "
            "first, 2-24 characters, e.g. callsign = \"petrel\".")
    if not CALLSIGN_RE.match(raw):
        die("callsign " + repr(raw) + " is not a callsign. One word, lower case, a "
            "letter first, then letters, digits or hyphens, 2-24 characters. It is "
            "chosen by a person, never derived from the client's name.")
    name = (cfg.get("engagement", {}).get("name") or "").strip().lower()
    if len(name) > 1 and not name.startswith("{{"):
        if raw == name or name in raw:
            die("callsign " + repr(raw) + " is made of the engagement's own name. A "
                "callsign exists so the client's noun never leaves the ship - a "
                "derived one carries it into every filename, branch and pull "
                "request. Pick an unrelated word.")
    return raw


# ------------------------------------------------------------------- drive ---

def drive_root(cfg: dict | None = None) -> Path:
    cfg = cfg or load()
    root = os.environ.get("ARMADA_DRIVE") or cfg["drive"]["root"]
    if not root:
        die("armada.toml [drive].root is empty and ARMADA_DRIVE is not set. Pixels "
            "need a home outside the repo before anything can be drawn.")
    return Path(root)


def source_dir(cfg: dict | None = None) -> Path:
    cfg = cfg or load()
    return drive_root(cfg) / cfg["drive"]["source"]


def creation_dir(cfg: dict | None = None) -> Path:
    cfg = cfg or load()
    return drive_root(cfg) / cfg["drive"]["creation"]


def wave_dir(wave: str, type_folder: str | None = None, cfg: dict | None = None) -> Path:
    """`<creation>/<wave>[/<TYPE> - <Type name>]`. Created by the writer, not here."""
    d = creation_dir(cfg) / wave
    return d / type_folder if type_folder else d


def type_folder(type_key: str, cfg: dict | None = None) -> str:
    cfg = cfg or load()
    t = cfg["types"].get(type_key) or {}
    return type_key + " - " + t.get("name", type_key)


def resolve_asset(rel: str, cfg: dict | None = None) -> Path:
    """A path in armada.toml is absolute, or relative to `<drive>/<source>`."""
    p = Path(rel)
    if p.is_absolute():
        return p
    return source_dir(cfg) / p


# --------------------------------------------------------------- filenames ---

_NAME = re.compile(
    r"^(?P<slot>[A-Z]+-[a-z0-9-]+)"          # TYPE-subject
    r"(?:__(?P<suffix>[a-z0-9-]+))?"          # optional repair suffix (no underscore)
    r"__(?P<lane>[a-z0-9]+)_(?P<draw>\d\d)"  # lane and draw number
    r"(?:\.[A-Za-z0-9]+)?$")


def parse_name(filename: str) -> dict:
    """`A-carafe__r2__nano_01.png` -> slot A-carafe, suffix r2, lane nano, draw 1.
    Unknown shapes return only `slot` = the part before the first `__`."""
    base = os.path.basename(filename)
    m = _NAME.match(base)
    if not m:
        return {"slot": base.split("__")[0], "suffix": "", "lane": "", "draw": 0}
    d = m.groupdict()
    d["suffix"] = d.get("suffix") or ""
    d["draw"] = int(d["draw"])
    return d


def slot_of(filename: str) -> str:
    return parse_name(filename)["slot"]


def is_repair(filename: str) -> bool:
    return bool(parse_name(filename)["suffix"])


def split_slot(slot: str) -> tuple[str, str]:
    """`H-carafe` -> ('H', 'carafe'). The type is everything before the first dash."""
    if "-" not in slot:
        die("a slot is <TYPE>-<subject>, got " + repr(slot))
    t, s = slot.split("-", 1)
    return t, s


def draw_name(slot: str, lane: str, draw: int, suffix: str = "") -> str:
    return slot + (("__" + suffix) if suffix else "") + "__" + lane + "_" + ("%02d" % draw) + ".png"


# ------------------------------------------------------------- generation.md ---

def _read(path: Path) -> str:
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except OSError:
        die("cannot read " + str(path))
        return ""


def _section(txt: str, heading: str) -> str:
    """The body of `## <heading>` up to the next `## `, or ''."""
    m = re.search(r"^## " + re.escape(heading) + r"[^\n]*\n(.*?)(?=^## |\Z)",
                  txt, re.S | re.M)
    return m.group(1) if m else ""


def _fences(body: str) -> list[str]:
    return [b.strip() for b in re.findall(r"```[a-z]*\s*\n(.*?)```", body, re.S)]


def shared_block(path: Path | None = None) -> str:
    """The fenced block under '## What every frame shares'."""
    txt = _read(path or GENERATION_MD)
    fences = _fences(_section(txt, "What every frame shares"))
    if not fences:
        die("no fenced block under '## What every frame shares' in " + str(path or GENERATION_MD))
    return fences[0]


def setting_paragraphs(path: Path | None = None) -> dict[str, str]:
    """'## Settings': each `**name**` followed by prose and one fence."""
    body = _section(_read(path or GENERATION_MD), "Settings")
    parts = re.split(r"\n\*\*([a-z0-9-]+)\*\*", "\n" + body)
    out = {}
    for name, chunk in zip(parts[1::2], parts[2::2]):
        f = _fences(chunk)
        if f:
            out[name] = f[0]
    return out


def swap_paragraph(block: str, paragraph: str, lead: str) -> str:
    """Replace the paragraph of `block` that starts with `lead`."""
    out, swapped = [], False
    for para in block.split("\n\n"):
        if para.startswith(lead):
            out.append(paragraph)
            swapped = True
        else:
            out.append(para)
    if not swapped:
        die("the shared block has no paragraph starting with " + repr(lead) + " to swap")
    return "\n\n".join(out)


def repair_clauses(path: Path | None = None) -> list[str]:
    return _fences(_section(_read(path or GENERATION_MD), "Repair clauses"))


def slot_repairs(path: Path | None = None) -> dict[str, str]:
    body = _section(_read(path or GENERATION_MD), "Slot repairs")
    rows = re.findall(r"^\|\s*([A-Z]+-[a-z0-9-]+)\s*\|\s*(.+?)\s*\|\s*$", body, re.M)
    return {slot: clause for slot, clause in rows}


# ------------------------------------------------------------------ rubric ---

_CHECK_ROW = re.compile(
    r"^\|\s*([A-Z]\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*"
    r"(gate|critical|minor|advisory)\s*\|\s*$", re.M)

SEVERITY_ORDER = {"gate": 0, "critical": 1, "minor": 2, "advisory": 3}
VERDICT_RANK = {"PASS": 4, "PASS_WITH_NOTES": 3, "RETRY": 2, "FAIL": 1,
                "ERROR": 0, "SKIPPED": -1}


def load_checks(path: Path | None = None) -> list[dict]:
    """Every check row in the rubric, in file order, with `set_level` marked for
    rows under a heading that contains 'set level'. The script holds no copy."""
    txt = _read(path or RUBRIC_MD)
    out = []
    for m in re.finditer(r"^## (.+?)\s*\n(.*?)(?=^## |\Z)", txt, re.S | re.M):
        heading, body = m.group(1), m.group(2)
        set_level = "set level" in heading.lower()
        for i, c, f, s in _CHECK_ROW.findall(body):
            out.append({"id": i, "check": c, "fails_when": f, "severity": s,
                        "set_level": set_level, "block": heading})
    if not out:
        die("no check rows parsed from " + str(path or RUBRIC_MD)
            + " - the table shape is | ID | check | fails when | severity |")
    return out


def rubric_section(name: str, path: Path | None = None) -> str:
    return _section(_read(path or RUBRIC_MD), name).strip()


def rubric_version(path: Path | None = None) -> str:
    m = re.search(r"\*\*Version ([^,*]+),", _read(path or RUBRIC_MD))
    return m.group(1).strip() if m else "unknown"


def rubric_gates(path: Path | None = None) -> bool:
    """The rubric says in words whether it may gate. 'reporting only' anywhere
    in it means it may not."""
    return "reporting only" not in _read(path or RUBRIC_MD).lower()


def plain_captions(path: Path | None = None) -> dict[str, str]:
    """'## Plain language' table: | ID | caption |. Falls back to the bold lead
    sentence of each check."""
    txt = _read(path or RUBRIC_MD)
    out = {}
    body = _section(txt, "Plain language")
    for i, cap in re.findall(r"^\|\s*([A-Z]\d+)\s*\|\s*(.+?)\s*\|\s*$", body, re.M):
        out[i] = cap
    for c in load_checks(path):
        if c["id"] not in out:
            m = re.match(r"\*\*(.+?)\*\*", c["check"])
            out[c["id"]] = m.group(1) if m else c["check"][:80]
    return out


def verdict(failed_ids, checks) -> str:
    """Mirrors the rubric's Scoring table. Change both together or not at all:
    any gate -> FAIL; any critical or two minors -> RETRY; one minor ->
    PASS_WITH_NOTES; clean -> PASS. Advisory never counts."""
    sev = {c["id"]: c["severity"] for c in checks}
    fails = [s for s in (sev.get(i, "minor") for i in failed_ids) if s != "advisory"]
    if "gate" in fails:
        return "FAIL"
    if "critical" in fails:
        return "RETRY"
    minors = fails.count("minor")
    if minors >= 2:
        return "RETRY"
    if minors == 1:
        return "PASS_WITH_NOTES"
    return "PASS"


# --------------------------------------------------------------- manifests ---

def load_manifest(wave_path: Path | str) -> dict:
    """Every MANIFEST.jsonl under the wave, keyed by filename. Failed draws are
    kept under their (never written) filename so a log can say what did not
    come back."""
    import json
    out = {}
    for root, _dirs, files in os.walk(wave_path):
        if "MANIFEST.jsonl" not in files:
            continue
        with open(os.path.join(root, "MANIFEST.jsonl"), encoding="utf-8") as f:
            for line in f:
                try:
                    row = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if row.get("file"):
                    out[row["file"]] = row
    return out


def candidates(wave_path: Path | str) -> list[str]:
    """Every candidate image under the wave. Folders and files starting with
    `_` are working material (display copies, crops, model-ready derives) and
    are never candidates."""
    out = []
    for root, dirs, files in os.walk(wave_path):
        dirs[:] = [d for d in dirs if not d.startswith("_")]
        for f in sorted(files):
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")) and not f.startswith("_"):
                out.append(os.path.join(root, f))
    return out


if __name__ == "__main__":
    cfg = load()
    print("  armada      " + armada_version())
    print("  engagement  " + cfg["engagement"]["name"])
    print("  repo        " + str(REPO))
    print("  drive       " + (cfg["drive"]["root"] or "(unset)"))
    print("  subjects    " + ", ".join(sorted(cfg["subjects"])) or "  subjects    (none)")
    print("  types       " + ", ".join(cfg["types"]) or "  types       (none)")
    print("  settings    " + ", ".join(cfg["settings"]))
    print("  lanes       " + ", ".join(k + "=" + v for k, v in cfg["models"]["lanes"].items()))
