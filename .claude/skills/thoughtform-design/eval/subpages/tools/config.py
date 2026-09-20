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
                         "gpt": "gpt-image-2",
                         "sunburst": "gpt-image-2.5-sunburst"},
               "graders": ["gemini-flash-latest"],
               # What one draw costs on each lane, in USD (0.7.0). Structural,
               # not aesthetic: a price is a fact about a lane, and without it
               # the ledger's cost per keeper is blank rather than guessed. The
               # eval log has asked for "cost, and the ratio it sets" since the
               # first wave and every ship has written it by hand.
               "prices": {}},
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
                "sections": [],
                # The fourth file (0.4.0): rulings, one line each, the essence
                # the home port extracts from. An empty string disables it.
                "memory": "MEMORY.md"},
    "figma": {"file": "", "folder": ""},
    # The client's page on the practice's own site (0.6.0): `client` is the
    # slug its page lives under, `page` the path the page has. Empty until
    # the page exists; `tools/deploy.py --site-page <path>` writes it.
    "site": {"client": "", "page": ""},
    "subjects": {}, "types": {}, "settings": {}, "anchors": {},
    "detail_for": {}, "attach": {},
}

# ------------------------------------------------------------- the machine ---
#
# Where this machine keeps its repos, its pixels and its design folder. It is
# the operator's, never an engagement's and never this repo's: a port that
# hardcodes one person's paths ships them to the next client. `deploy.py` reads
# it so a new engagement can be stood up with one command; everything else
# works without it.
#
#     ~/.armada.toml, or $ARMADA_MACHINE
#
#     [roots]
#     repos = 'C:\...\repos'      # where an engagement's repo is created
#     drive = 'D:\...\Production' # where its pixels folder is created
#     site  = 'C:\...\site'       # the practice's own site repo, whose
#                                 # own scaffold makes a client page
#     [github]
#     owner = "my-org"
#     [figma]
#     plan   = "team::123"        # the plan key a new board file is made under
#     folder = "456"              # the folder id it is made in

MACHINE_DEFAULTS = {"roots": {"repos": "", "drive": "", "site": ""},
                    "github": {"owner": ""},
                    "figma": {"plan": "", "folder": ""}}


def machine_path() -> Path:
    return Path(os.environ.get("ARMADA_MACHINE")
                or (Path.home() / ".armada.toml")).expanduser()


def machine(path: Path | None = None) -> dict:
    """The operator's own roots, merged over the defaults. A missing file is an
    empty config, never a death: only `deploy.py` needs one."""
    p = Path(path) if path else machine_path()
    if not p.exists():
        return dict(MACHINE_DEFAULTS)
    with open(p, "rb") as f:
        return _merge(MACHINE_DEFAULTS, tomllib.load(f))


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


# ------------------------------------------------------------------- scrub ---
#
# A ship's own nouns, and the replacement that takes them out of anything
# leaving it. Lived in `harvest.py` until 0.7.0, when the ledger became a
# second thing that must be born scrubbed; two implementations of one rule is
# a rule that will disagree with itself, and the half that disagrees is the
# half nobody is watching.

def nouns(cfg: dict | None = None, scrub_file: Path | str | None = None):
    """Everything this ship must not send home: what `armada.toml` names, and
    every phrase in `harvest/scrub.txt`. Longest first, so a scrub replaces the
    most specific phrase before its parts."""
    cfg = cfg or load()
    out = {}
    eng = cfg.get("engagement") or {}
    for key in ("name", "title"):
        v = (eng.get(key) or "").strip()
        if v and not v.startswith("{{"):
            out[v] = "<engagement>"
    for key, s in (cfg.get("subjects") or {}).items():
        out[key] = "<subject>"
        noun = (s.get("noun") or "").strip()
        if noun:
            out[noun] = "<subject>"
    path = Path(scrub_file) if scrub_file else (REPO / "harvest" / "scrub.txt")
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        text = ""
    for line in text.splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            out[line] = "<redacted>"
    return sorted(out.items(), key=lambda kv: -len(kv[0]))


def scrub(text, ship_nouns, apply: bool = True):
    """Report hits; replace them when `apply`. Case-insensitive, whole words for
    single tokens, phrase match for longer ones.

    A phrase that starts with `=` is matched case-sensitively (0.4.1). It exists
    for a product named with a common word: a kettle called Prime, a lamp called
    Beacon. Scrubbed case-insensitively, that word would also be swept out of
    the port's own prose and the nightly would fail on every note from that
    ship; left off the list, the product name travels."""
    text = str(text)
    hits = {}
    for phrase, placeholder in ship_nouns:
        exact = phrase.startswith("=")
        word = phrase[1:].strip() if exact else phrase
        if not word:
            continue
        pat = (r"\b" + re.escape(word) + r"\b") if " " not in word else re.escape(word)
        flags = 0 if exact else re.I
        n = len(re.findall(pat, text, flags))
        if n:
            hits[phrase] = (n, placeholder)
            if apply:
                text = re.sub(pat, placeholder, text, flags=flags)
    return text, hits


def by_placeholder(hits) -> dict:
    """`{'<subject>': 11, '<engagement>': 3}`. The only shape a note is allowed
    to carry: a count says a scrub happened, a phrase undoes it."""
    out = {}
    for _phrase, (n, placeholder) in hits.items():
        out[placeholder] = out.get(placeholder, 0) + n
    return out


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


# ------------------------------------------------------------------ ledger ---
#
# The fifth file, 2026-09-13. One append-only line per event, born scrubbed,
# so what a wave taught survives as rows and not only as prose.
#
# The failure it is here for: across fourteen ships the harness produced a
# handback file for every review gallery it built, and not one of those files
# was ever written. The grader's side was rows from the first version; the
# person's side was a paragraph in an eval log, a table in a vocabulary file
# and a prefix on a filename. Nothing joined the two, so the one question that
# decides whether a check may gate - does it agree with the person? - could
# not be asked of any wave without matching filenames by hand.
#
# Five kinds, each the row form of an artefact that already exists:
#
#     draw      a MANIFEST.jsonl row      what was asked for, and what it cost
#     grade     a qa_results.json row     what the instrument said
#     tick      a verdicts-*.json row     what the person said
#     decode    a comment, read           which failure mode the comment named
#     promote   an approved-register row  what became an anchor, either pole
#
# **A row carries no prompt, comment, filename, reference name, subject noun
# or error text.** Hashes, counts, codes and classes only. The words stay on
# the ship in the manifest and the handback, where they belong and where the
# person reading them already has the client's context. The ledger is the half
# that travels, so it is the half that is born with nothing to scrub.

LEDGER_SCHEMA = 1
LEDGER_KINDS = ("draw", "grade", "tick", "decode", "promote")
LEDGER_FILE = "evals/ledger.jsonl"

# When a check has been asked of enough of the person's verdicts to have an
# opinion about the person. The method already names this number: "expect the
# grader to be uncalibrated for roughly thirty verdicted draws", and every
# engagement so far predicted that cost and paid it.
CALIBRATION_N = 30

# Where a check stops being advisory. The floor is the applied-evals floor for
# an LLM judge measured against a domain expert's labels; the target is what a
# judge is aimed at. Both are agreement with the person, never accuracy: there
# is no other ground truth for whether a picture is good.
AGREEMENT_FLOOR = 0.80
AGREEMENT_TARGET = 0.90


def candidate_id(wave: str, filename: str) -> str:
    """The id a draw keeps for the rest of its life, across the manifest, the
    grade, the tick and the decode. A hash and not the filename, because a
    filename carries the subject key and the subject key is a client noun."""
    import hashlib
    base = os.path.basename(str(filename))
    return hashlib.sha1((str(wave) + "/" + base).encode("utf-8")).hexdigest()[:12]


def subject_id(ship: str, subject: str) -> str:
    """A subject as an id. Stable within one ship and meaningless outside it,
    which is the point: the fleet can ask whether one subject is harder than
    another without the port learning what either of them is."""
    import hashlib
    return hashlib.sha1((str(ship) + "/" + str(subject)).encode("utf-8")).hexdigest()[:8]


def slot_id(ship: str, slot: str) -> str:
    """`H-carafe` -> `H-1f0c9a3e`. The type code travels because it is ours; the
    subject is hashed because it is the client's.

    2026-09-13, the first ledger the suite ever wrote: every row carried its slot
    as `<TYPE>-<subject>`, so the ledger's own scrub rewrote each one to
    `H-<subject>` on the way to disk and nothing downstream could join on it.
    The scrub was right and the row was wrong. A field that has to be scrubbed
    is a field that was built wrong, which is why the writer prints when it
    scrubs anything at all."""
    s = str(slot)
    if "-" not in s:
        return subject_id(ship, s)
    t, subj = s.split("-", 1)
    if not _TYPE_CODE.match(t):
        # 2026-09-13, the origin ship's back-fill: its filenames are in its own
        # grammar, and on two waves the token before the dash was a product
        # word, so the scrub rewrote the "type code" of a hundred and thirty-six
        # rows. Only a type code travels; anything else is hashed whole.
        return subject_id(ship, s)
    return t + "-" + subject_id(ship, subj)


_TYPE_CODE = re.compile(r"^[A-Z][A-Z0-9]{0,2}$")


def wave_id(wave: str) -> str:
    """A wave's key in the ledger: the raw folder name, hashed, so a wave whose
    name carries a client word is stored under a placeholder and still keys
    its own rows.

    2026-09-13, the origin ship's back-fill: four waves whose names differed
    only by a product word scrubbed to the same placeholder, and each wave's
    rebuild dropped its siblings' rows as its own. Three waves were gone from
    the ledger and `--check` passed. A scrubbed name is not a key."""
    import hashlib
    return hashlib.sha1(str(wave).encode("utf-8")).hexdigest()[:8]


def wave_key(row: dict) -> str:
    """What a report groups a row by: the wave id where the row has one, the
    stored name for a row written before 0.8.2."""
    return row.get("wave_id") or row.get("wave") or ""


def text_sha(text) -> str:
    """A prompt or a comment as a hash. Two draws that carry the same hash were
    asked the same question; nothing else about them is recoverable."""
    import hashlib
    return hashlib.sha1(str(text).encode("utf-8")).hexdigest()[:12]


def error_class(error) -> str:
    """A failed draw's reason as a class, never its text. An error string is the
    one field in a manifest row that carries whatever the provider felt like
    saying, which on a refusal is a description of the client's own prompt."""
    e = str(error or "").lower()
    if not e.strip():
        return ""
    if "finishreason" in e or "refus" in e or "safety" in e or "blocked" in e:
        return "refusal"
    if "timed out" in e or "timeout" in e:
        return "timeout"
    if re.search(r"\b5\d\d\b", e):
        return "http5"
    if re.search(r"\b4\d\d\b", e):
        return "http4"
    return "other"


def ledger_path(repo: Path | str | None = None) -> Path:
    return Path(repo or REPO) / LEDGER_FILE


def latest_grades(rows, rubric: str | None = None) -> dict:
    """{candidate: the grade row that counts}. The newest by `graded_at`, then
    file order; `rubric` narrows to one version first.

    A candidate can carry several grade rows: a re-grade under a new rubric
    version kept as a sidecar, a round's own file under a wave, a repair round
    merged in. The drift report wants all of them side by side; everything that
    turns a grade into a rate wants exactly one, and two tools choosing
    differently would be two answers to whether the instrument agrees with the
    person. So the rule lives here and both import it. A row with no
    `graded_at` never outranks one that has it: a degraded round file that
    recorded a verdict and no time is a weaker record, not a later one."""
    out = {}
    for r in rows:
        if r.get("kind") != "grade" or not (r.get("verdict") or "").strip():
            continue
        if rubric and r.get("rubric") != rubric:
            continue
        c = r.get("candidate")
        prev = out.get(c)
        if prev is None or (r.get("graded_at") or "") >= (prev.get("graded_at") or ""):
            out[c] = r
    return out


# ----------------------------------------------------------------- binding ---
#
# Every path a tool reads, bound to one repo root. `harvest.py` learned this at
# 0.2.1: the port's first nightly run imported it inside a clone and every path
# still resolved to the port's own checkout, because the tool asked this module
# where it was rather than being told. 0.8.1 gives the ledger and the
# calibration the same binding, because the origin ship carries the donor
# scripts the harness was extracted from, must never be refitted, and still has
# four hundred draws the fleet should be able to read.

class Bound:
    def __init__(self, root):
        self.root = os.path.abspath(os.path.expanduser(str(root)))
        self.toml = os.path.join(self.root, "armada.toml")
        self.cfg = load(self.toml, fresh=True)
        self.callsign = callsign(self.cfg)
        self.scrub_file = os.path.join(self.root, "harvest", "scrub.txt")
        self.rubric = os.path.join(self.root, "skill", "references", "rubric.md")
        self.ledger = os.path.join(self.root, *LEDGER_FILE.split("/"))
        self.version_file = os.path.join(self.root, "tools", "ARMADA_VERSION")

    def harness(self) -> str:
        """What is aboard, in the words the harvest note uses. A row stamped
        with the port's version for a ship that carries donor tools would claim
        a harness the ship never had."""
        try:
            v = Path(self.version_file).read_text(encoding="utf-8").strip()
        except OSError:
            v = ""
        if v:
            return v
        if not os.path.isdir(os.path.join(self.root, "tools")):
            return "no tools aboard"
        return "donor tools, pre-harness"

    def has_rubric(self) -> bool:
        return os.path.isfile(self.rubric)

    def rubric_gates(self) -> bool:
        """No rubric is reporting only, never gating, and never a death."""
        return rubric_gates(self.rubric) if self.has_rubric() else False

    def nouns(self):
        return nouns(self.cfg, self.scrub_file)


def bind(repo: Path | str | None = None) -> Bound:
    """The repo a tool should read: `--repo PATH` when the port is standing
    outside a ship, else the repo this file lives in."""
    return Bound(repo or REPO)


def ledger_rows(path: Path | str | None = None) -> list[dict]:
    """Every row of the ledger, in file order. A line that does not parse is
    skipped rather than fatal: an append-only log that refuses to be read
    because of one bad line is a log that loses everything before it."""
    import json
    p = Path(path) if path else ledger_path()
    out = []
    try:
        text = p.read_text(encoding="utf-8")
    except OSError:
        return out
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(row, dict) and row.get("kind") in LEDGER_KINDS:
            out.append(row)
    return out


# --------------------------------------------------------------- MEMORY.md ---
#
# The fourth file, 2026-09-12. A project's rulings, one line each, dated, in
# four fixed sections; the essence the home port extracts from and the file a
# session reads on entry. The grammar is small on purpose so a parser and a
# person read the same thing:
#
#     - YYYY-MM-DD [tag] what was decided, learned or ruled out -> where the evidence is
#
# Two tags and no more. A tagged line always carries a pointer: a breakthrough
# without evidence is a claim. The ceiling exists because a memory file that
# grows without bound stops being read, and the rule above it is that
# compression removes arguments, never rulings.

MEMORY_SECTIONS = ("Decided", "Learned", "Ruled out", "Open")
MEMORY_TAGS = ("breakthrough", "verdict")
MEMORY_CAP = 120

_MEMORY_LINE = re.compile(
    r"^- (?P<date>\d{4}-\d{2}-\d{2})"
    r"(?:\s+\[(?P<tag>[a-z][a-z-]*)\])?"
    r"\s+(?P<text>.*?)"
    r"(?:\s+->\s+(?P<pointer>\S.*?))?\s*$")


def _memory_text(path: Path | str) -> str | None:
    """The file's text, or None when there is no such file. A project without a
    memory file is a project without one, never a crash."""
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return None


def memory_entries(path: Path | str) -> list[dict]:
    """Every entry in a MEMORY.md, in file order. Each: section, date (a
    datetime.date, or None when the line does not parse), tag ('' when
    untagged), text, pointer ('' when none), line (1-based). Lines that are not
    in the grammar are returned with date None so a lint can name them; a
    reader that wants only the parsed ones filters on date."""
    import datetime as _dt
    txt = _memory_text(path)
    if txt is None:
        return []
    out, section = [], ""
    for n, raw in enumerate(txt.splitlines(), 1):
        line = raw.rstrip()
        if line.startswith("## "):
            section = line[3:].strip()
            continue
        if not section or not line.startswith("- "):
            continue
        m = _MEMORY_LINE.match(line)
        if not m:
            out.append({"section": section, "date": None, "tag": "", "text": line[2:].strip(),
                        "pointer": "", "line": n})
            continue
        try:
            d = _dt.date.fromisoformat(m.group("date"))
        except ValueError:
            d = None
        out.append({"section": section, "date": d, "tag": m.group("tag") or "",
                    "text": m.group("text").strip(), "pointer": (m.group("pointer") or "").strip(),
                    "line": n})
    return out


def memory_lint(path: Path | str, cap: int = MEMORY_CAP) -> list[str]:
    """Findings, each `MEMORY.md:<line>: <what>`. Empty when the file is in the
    grammar. A missing file is one finding, because a repo on the standard has
    one."""
    txt = _memory_text(path)
    name = os.path.basename(str(path)) or "MEMORY.md"
    if txt is None:
        return [name + ": missing"]
    lines = txt.splitlines()
    out = []
    if len(lines) > cap:
        out.append(name + ":1: " + str(len(lines)) + " lines, over the ceiling of " + str(cap)
                   + ". Compress: merge and shorten, remove arguments, keep every ruling and pointer.")
    section = ""
    seen = []
    for n, raw in enumerate(lines, 1):
        line = raw.rstrip()
        if line.startswith("## "):
            section = line[3:].strip()
            if section not in MEMORY_SECTIONS:
                out.append(name + ":" + str(n) + ": unknown section '" + section + "'. The four are "
                           + ", ".join(MEMORY_SECTIONS) + ".")
            seen.append(section)
            continue
        if not section:
            continue                    # prose above the first heading is allowed
        if not line.strip():
            continue
        if not line.startswith("- "):
            out.append(name + ":" + str(n) + ": prose under a section. One line per entry, "
                       "a ruling not an argument; the argument lives where the pointer says.")
            continue
        m = _MEMORY_LINE.match(line)
        if not m:
            out.append(name + ":" + str(n) + ": not in the grammar. Expected "
                       "'- YYYY-MM-DD [tag] text -> pointer'.")
            continue
        try:
            import datetime as _dt
            _dt.date.fromisoformat(m.group("date"))
        except ValueError:
            out.append(name + ":" + str(n) + ": '" + m.group("date") + "' is not a date.")
        tag = m.group("tag") or ""
        if tag and tag not in MEMORY_TAGS:
            out.append(name + ":" + str(n) + ": unknown tag [" + tag + "]. The two are "
                       + ", ".join("[" + t + "]" for t in MEMORY_TAGS) + ".")
        if tag and not (m.group("pointer") or "").strip():
            out.append(name + ":" + str(n) + ": a [" + tag + "] line without a pointer. "
                       "A breakthrough without evidence is a claim; add ' -> <file>'.")
        if not m.group("text").strip():
            out.append(name + ":" + str(n) + ": an entry with no text.")
    for s in MEMORY_SECTIONS:
        if s not in seen:
            out.append(name + ": no '## " + s + "' section.")
    return out


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
