r"""The grader. Advisory, always.

Grades a wave against `skill/references/rubric.md`, which `config.load_checks`
parses at runtime and nothing here keeps a copy of. Edit checks in the markdown;
this file is only the harness. The one hardcoded piece of judgment lives in
`config.verdict`, mirroring the rubric's Scoring table - change both together or
not at all.

    python tools/qa.py --batch "<wave dir>"
    python tools/qa.py --batch "<wave dir>" --workers 6 --runs 3
    python tools/qa.py --one "<file>.png"
    python tools/qa.py --dry-run "<wave dir>"     builds the prompts, calls nothing
    python tools/qa.py --batch "<wave dir>" --offline    fake grader, no network

**A verdict is a floor, not a decision.** Graders miss real defects and invent
imaginary ones in roughly equal measure. A fail means look harder. A check that
fails a frame the client has approved is a defect in the instrument, not in the
frame.

Two layers per candidate:

  1. **The stranger's read** - one call that sees only the candidate, with no
     subject name and no references, and says what the object is. A prompt that
     names the subject gets the subject's name back whatever is in the picture,
     which is why this is a separate call. The instruction is the fenced text
     under the rubric's `## Stranger's read`, verbatim.
  2. **The rubric read** - the candidate first, then the identity reference for
     its subject, then the extra views the draw was generated with, then the
     grading rules and every per-frame check, answered strictly true or false.
     Unanswered is unsure is a failure.

A block whose rubric heading contains *set level* is never asked of one frame.
Those checks are what a client actually names and no single image can carry
them; they are reported across the wave instead.

**Grade three times, report the majority.** Measured on a prior corpus, grading
the same wave twice moved the verdict on a quarter of it: one grade is not
evidence, and a comparison between two arms that rests on one grade per
candidate is not a comparison. `--runs` defaults to 3, ties fail, and every
candidate whose verdict was unstable across runs is listed by name so a coin is
visible rather than averaged away.

Writes `qa_results.json` beside the wave. Reporting only until the rubric says
otherwise: the calibration status is printed on every run and nothing here
decides anything.
"""
from __future__ import annotations

import argparse
import base64
import concurrent.futures
import hashlib
import json
import mimetypes
import os
import re
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import config  # noqa: E402

# refs.py and envload.py are owned elsewhere in the repo. Import them by name;
# a missing one is reported and degrades the offline paths rather than being
# faked here, because a stub that silently resolves references would grade a
# wave against nothing and call it a pass.
try:
    import refs  # noqa: E402
except ImportError:  # pragma: no cover - reported, never faked
    refs = None
try:
    from envload import require  # noqa: E402
except ImportError:  # pragma: no cover
    require = None


DEFAULT_RUNS = 3          # the floor, not a preference. See the docstring.
DEFAULT_WORKERS = 5


def key_name_for(model_id: str) -> str:
    """Which credential a model id implies. Named here so `doctor.py` asks for
    the same keys the graders and lanes will actually reach for; the ids drift,
    the vendor prefixes do not."""
    m = (model_id or "").lower()
    if m.startswith(("gpt", "o1", "o3", "dall")) or "openai" in m:
        return "OPENAI_API_KEY"
    return "GEMINI_API_KEY"


def _first_fence(body: str) -> str:
    """The first fenced block of a rubric section. `config` has this for
    generation.md only; the rubric needs it too."""
    m = re.search(r"```[a-z]*\s*\n(.*?)```", body, re.S)
    return m.group(1).strip() if m else ""


def max_bytes(cfg: dict) -> int:
    return int(cfg["refs"]["model_ready_mb"] * 1_000_000)


def model_ready(path: str, cfg: dict) -> str:
    """An attachable copy of `path`. Delegates to refs.py, which owns the derive
    and its atomic write; without refs.py the original is sent as-is."""
    if refs is not None:
        try:
            return str(refs.model_ready(path))
        except Exception:                       # noqa: BLE001 - one file, not the wave
            return path
    return path


# --------------------------------------------------------------- transport ---

def _scrub(text, key) -> str:
    """No credential ever rides out on an error string. The request URL carries
    the key, and an error body, a proxy notice or a URLError can quote it back -
    and `qa_results.json` is written to disk, read by everyone and often mailed
    around. Reported by length, like everywhere else."""
    t = str(text)
    if key and len(key) >= 8:
        t = t.replace(key, "<" + str(len(key)) + "-char key>")
    return t


def _b64(p: str) -> str:
    with open(p, "rb") as f:
        return base64.b64encode(f.read()).decode()


def _mime(p: str) -> str:
    return mimetypes.guess_type(p)[0] or "image/png"


def part(path: str) -> dict:
    return {"inline_data": {"mime_type": _mime(path), "data": _b64(path)}}


def call(key, parts, graders, model=None, tries=(0, 6, 14)):
    """One text call over image parts. Returns (parsed JSON, model id) or raises.

    Graders come from `armada.toml [models].graders`, tried in order; the first
    that answers grades. 429/500/503 are the transient three and are retried
    with a backoff; anything else moves to the next grader. Temperature 0 and a
    JSON response type, because a grade that varies with sampling is not a
    grade - and even so the answer is parsed with a `{...}` fallback, because a
    model that was asked for JSON still sometimes wraps it in prose."""
    last = ""
    for m in ([model] if model else list(graders)):
        url = ("https://generativelanguage.googleapis.com/v1beta/models/"
               + m + ":generateContent?key=" + key)
        for backoff in tries:
            if backoff:
                time.sleep(backoff)
            req = urllib.request.Request(
                url,
                data=json.dumps({
                    "contents": [{"parts": parts}],
                    "generationConfig": {"temperature": 0,
                                         "responseMimeType": "application/json"},
                }).encode(),
                headers={"Content-Type": "application/json"}, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=300) as r:
                    data = json.load(r)
            except urllib.error.HTTPError as e:
                last = e.read().decode(errors="replace")[:300]
                if e.code in (429, 500, 503):
                    continue
                break
            except (urllib.error.URLError, TimeoutError) as e:
                last = str(e)
                continue
            txt = ""
            for cand in data.get("candidates", []):
                for p in cand.get("content", {}).get("parts", []):
                    txt += p.get("text", "")
            if not txt.strip():
                last = "empty response"
                continue
            try:
                return json.loads(txt), m
            except json.JSONDecodeError:
                mm = re.search(r"\{.*\}", txt, re.S)
                if mm:
                    try:
                        return json.loads(mm.group(0)), m
                    except json.JSONDecodeError:
                        pass
                last = "unparseable JSON: " + txt[:200]
    raise RuntimeError(last or "no grader answered")


# ------------------------------------------------------------ the two reads ---

# Used only when the rubric has no `## Stranger's read` section. The rubric's
# own words win: a subject the harness has never heard of gets counted properly
# only if the rubric says what its parts are called.
STRANGER_FALLBACK = (
    "You are shown one photograph. Name the main subject in it in one short noun "
    "phrase, as you would to someone who has not seen the picture, with no "
    "negations and no brand names. Then say in one sentence what it appears to be "
    "for. Then count the distinct parts of the main subject that you can see.")

STRANGER_SCHEMA = (
    "Return ONLY JSON:\n"
    "{\"reads_as\":\"<noun phrase>\",\"purpose\":\"<one sentence>\","
    "\"part_counts\":\"<short phrase>\"}")


def stranger_prompt() -> str:
    body = config.rubric_section("Stranger's read")
    text = _first_fence(body) or STRANGER_FALLBACK
    return text + "\n\n" + STRANGER_SCHEMA


def stranger_read(key, candidate, graders, grader=None):
    out, _ = call(key, [part(candidate), {"text": stranger_prompt()}], graders, grader)
    return out


def grading_prompt(checks, meta, stranger) -> str:
    """The rubric read, assembled. The preamble is the harness's and is generic;
    everything with an opinion in it comes from the rubric."""
    lines = []
    lines.append("You are grading one generated photograph against the real subject "
                 "it depicts. Image 1 is the CANDIDATE, under review.")
    if meta.get("has_identity"):
        lines.append("Image 2 is the IDENTITY REFERENCE: a photograph of the real "
                     "subject. It is never under review. A difference between the "
                     "candidate and the identity reference is a fault in the CANDIDATE.")
    else:
        lines.append("No identity reference is attached for this candidate. Say so in "
                     "your notes, and grade only what can be judged without one.")
    if meta.get("extra_refs"):
        lines.append("Further images are additional views of the same real subject, "
                     "attached because this shot turns on geometry the identity view "
                     "does not show. They are also never under review.")
    lines.append("")
    lines.append("THE SUBJECT: " + str(meta.get("subject_noun") or meta.get("subject")
                                       or "unknown"))
    lines.append("THE IMAGE TYPE: " + str(meta.get("type") or "?") + " - "
                 + str(meta.get("type_name") or "") + ", answering the question "
                 + repr(meta.get("question") or "") + ", for "
                 + str(meta.get("channel") or ""))
    if meta.get("setting"):
        lines.append("THE SETTING: " + str(meta["setting"]) + ". Judge the ground and "
                     "the light against this setting, not against another house.")
    lines.append("")
    rules = config.rubric_section("Grading rules")
    if rules:
        lines.append("GRADING RULES")
        lines.append(rules)
        lines.append("")
    lines.append("THIS CANDIDATE, as read by someone who saw only the picture and was "
                 "told nothing about the subject:")
    lines.append("  it reads as: " + str(stranger.get("reads_as", "")))
    lines.append("  they say it is for: " + str(stranger.get("purpose", "")))
    lines.append("  they counted: " + str(stranger.get("part_counts", "")))
    lines.append("")
    lines.append("Grade every check strictly true (passes) or false (fails). When you "
                 "are unsure, the check FAILS. Answer every id; an unanswered check is "
                 "recorded as a failure.")
    lines.append("")
    for c in checks:
        if c["set_level"]:
            continue          # graded across the wave, never on one frame
        lines.append(c["id"] + ". " + c["check"])
        lines.append("    FAILS WHEN: " + c["fails_when"])
    lines.append("")
    ids = [c["id"] for c in checks if not c["set_level"]]
    lines.append("Return ONLY JSON:")
    lines.append('{"reads_as":"<one noun phrase, your own>",'
                 '"part_count_note":"<what you counted against the reference>",'
                 '"checks":{' + ",".join('"' + i + '":true|false' for i in ids) + '},'
                 '"worst_issue":"<one short phrase, or empty>",'
                 '"notes":"<one or two sentences>"}')
    return "\n".join(lines)


# ------------------------------------------------------------- one candidate ---

def resolve_refs(path, meta_row, cfg):
    """What the grader gets to look at besides the candidate: the identity
    reference for this subject, then up to two of the extra views the draw was
    actually generated with, so the grader sees the same geometry the generator
    did. Never a previous draw, and never more than the model can hold - past a
    small stack the attention averages it."""
    m = (meta_row or {}).get("meta") or {}
    out, why = [], []
    subject = m.get("subject")
    if subject and refs is not None:
        try:
            out.append(str(refs.identity(subject)))
        except SystemExit as e:
            why.append("identity for " + str(subject) + " did not resolve: "
                       + str(e).strip())
        except Exception as e:                  # noqa: BLE001
            why.append("identity for " + str(subject) + " did not resolve: " + str(e))
    elif subject:
        why.append("refs.py is not importable, so no identity reference was attached")
    else:
        why.append("the manifest row names no subject, so no identity reference exists")

    cap = max_bytes(cfg)
    for extra in (meta_row or {}).get("references", [])[1:3]:
        if os.path.exists(extra) and os.path.getsize(extra) <= cap:
            out.append(extra)
        elif os.path.exists(extra):
            why.append(os.path.basename(extra) + " is over the attach cap and was left out")
    return out, why


def _blank(path, meta_row):
    """Every record carries every key, whatever happened to it. A results file
    whose rows have different shapes is a results file nobody can sort."""
    m = (meta_row or {}).get("meta") or {}
    return {
        "file": os.path.basename(path), "path": path,
        "slot": (meta_row or {}).get("slot") or config.slot_of(path),
        "type": m.get("type"), "type_name": m.get("type_name"),
        "question": m.get("question"), "channel": m.get("channel"),
        "subject": m.get("subject"), "setting": m.get("setting"),
        "references": [], "reads_as_stranger": "", "stranger_counts": "",
        "grader": "", "reads_as_grader": "", "part_count_note": "",
        "checks": {}, "failed": [], "failed_advisory": [], "unanswered": [],
        "verdict": "ERROR", "worst_issue": "", "notes": "",
        "runs": 1, "split_answers": {}, "run_verdicts": [],
    }


def _score(rec, answers, checks):
    """Answers -> failed rows -> verdict. Unanswered is unsure is a failure, so
    the loop asks whether the answer is `True`, never whether it is falsy."""
    failed, advisory, unanswered = [], [], []
    for c in checks:
        if c["set_level"]:
            continue
        if c["id"] not in answers:
            unanswered.append(c["id"])
        if answers.get(c["id"]) is not True:
            row = {"id": c["id"], "severity": c["severity"],
                   "check": c["check"].replace("**", "")[:180]}
            (advisory if c["severity"] == "advisory" else failed).append(row)
    rec["checks"] = answers
    rec["failed"] = sorted(failed, key=lambda r: config.SEVERITY_ORDER[r["severity"]])
    rec["failed_advisory"] = advisory
    rec["unanswered"] = unanswered
    rec["verdict"] = config.verdict([f["id"] for f in failed], checks)
    return rec


# --------------------------------------------------------------- the fake ---

def _fake_answer(filename, cid, run):
    """Deterministic nonsense, and labelled as such everywhere it lands.

    `--offline` exists so the whole pipeline - majority, the unstable list, the
    results schema, sorting, set-level notes, merge, and everything downstream
    that reads the results file - can be exercised without a key and without a
    network. The rates are chosen so a wave comes back with a spread across the
    verdict ladder rather than a wall of one verdict: roughly one check in
    sixteen fails, and one in thirteen argues with itself between runs, which on
    a twenty-check rubric leaves some frames clean, some with a note and some
    failed. Same inputs, same answers, forever."""
    h = hashlib.sha1((filename + "|" + cid).encode()).digest()
    if h[0] % 13 == 0:                  # a check this file cannot make its mind up about
        return bool((h[1] + run) % 2)
    return h[0] % 16 != 0


def grade_offline(path, checks, meta_row, run):
    rec = _blank(path, meta_row)
    m = (meta_row or {}).get("meta") or {}
    name = rec["file"]
    rec["grader"] = "offline-fake"
    rec["reads_as_stranger"] = m.get("subject_noun") or m.get("subject") or "an object"
    rec["stranger_counts"] = "not counted: offline"
    rec["reads_as_grader"] = rec["reads_as_stranger"]
    rec["part_count_note"] = "offline fake grader, nothing was looked at"
    answers = {c["id"]: _fake_answer(name, c["id"], run)
               for c in checks if not c["set_level"]}
    _score(rec, answers, checks)
    rec["notes"] = "offline fake grade, not a reading of this image"
    rec["worst_issue"] = (rec["failed"][0]["id"] + " (offline)") if rec["failed"] else ""
    return rec


# -------------------------------------------------------------- grade_one ---

def grade_one(key, path, checks, cfg, manifest, grader=None, run=0, offline=False):
    """One candidate, one run. Every failure here is this candidate's own: an
    exception becomes an ERROR row with `str(e)`, never a raise, because one
    slot must never kill the wave."""
    name = os.path.basename(path)
    meta_row = manifest.get(name, {})
    if offline:
        return grade_offline(path, checks, meta_row, run)

    rec = _blank(path, meta_row)
    m = meta_row.get("meta") or {}
    ref_paths, why = resolve_refs(path, meta_row, cfg)
    rec["references"] = [os.path.basename(p) for p in ref_paths]

    cand = model_ready(path, cfg)
    graders = cfg["models"]["graders"]
    try:
        stranger = stranger_read(key, cand, graders, grader)
    except (RuntimeError, OSError) as e:
        stranger = {"reads_as": "", "purpose": "", "part_counts": "",
                    "error": _scrub(e, key)[:200]}
    rec["reads_as_stranger"] = stranger.get("reads_as", "")
    rec["stranger_counts"] = stranger.get("part_counts", "")

    gmeta = {"subject": m.get("subject"), "subject_noun": m.get("subject_noun"),
             "type": m.get("type"), "type_name": m.get("type_name"),
             "question": m.get("question"), "channel": m.get("channel"),
             "setting": m.get("setting"),
             "has_identity": bool(ref_paths),
             "extra_refs": len(ref_paths) > 1}
    parts = [part(cand)] + [part(model_ready(p, cfg)) for p in ref_paths]
    parts.append({"text": grading_prompt(checks, gmeta, stranger)})
    try:
        out, model = call(key, parts, graders, grader)
    except (RuntimeError, OSError) as e:
        rec["error"] = _scrub(e, key)[:300]
        return rec

    rec["grader"] = model
    rec["reads_as_grader"] = out.get("reads_as", "")
    rec["part_count_note"] = out.get("part_count_note", "")
    _score(rec, out.get("checks") or {}, checks)
    rec["worst_issue"] = out.get("worst_issue", "")
    rec["notes"] = " ".join(x for x in [out.get("notes", "")] + why if x)[:600]
    return rec


# ------------------------------------------------------- runs and majority ---

def majority(recs, checks):
    """One record per candidate, each check answered the way most runs answered
    it. **Ties fail**, because unsure is a failure. How split each answer was is
    recorded, so a check that keeps flipping is visible rather than averaged
    away, and the per-run verdicts are kept so a wobbly draw cannot pass itself
    off as a settled one.

    **Only runs that answered get a vote.** A run that died in transport has no
    opinion about the picture, and counting its silence as unsure-is-a-failure
    turns a bad key into twenty failed checks against an image nothing ever
    looked at. Found by grading one file with an invalid key and reading back a
    record that blamed the frame."""
    base = dict(recs[0])
    base["runs"] = len(recs)
    base["run_verdicts"] = [r.get("verdict") for r in recs]
    answered = [r for r in recs if (r.get("checks") or {})]
    if not answered:
        base["split_answers"] = {}
        base["verdict"] = "ERROR"
        base["notes"] = " | ".join(dict.fromkeys(
            r.get("error", "") for r in recs if r.get("error")))[:600]
        return base

    ids = set()
    for r in answered:
        ids.update(r["checks"].keys())
    answers, split = {}, {}
    for cid in sorted(ids):
        votes = [r["checks"].get(cid) for r in answered]
        yes = sum(1 for v in votes if v is True)
        no = len(votes) - yes
        answers[cid] = yes > no                 # a tie is not a pass
        if yes and no:
            split[cid] = str(yes) + "/" + str(len(votes)) + " said it passed"
    _score(base, answers, checks)
    base["split_answers"] = split
    notes = [r.get("notes", "") for r in recs if r.get("notes")]
    if len(answered) < len(recs):
        notes.insert(0, "graded on " + str(len(answered)) + " of " + str(len(recs))
                     + " runs; the rest errored")
    base["notes"] = " | ".join(dict.fromkeys(notes))[:600]
    base["worst_issue"] = next((r.get("worst_issue") for r in recs
                                if r.get("worst_issue")), "")
    return base


# --------------------------------------------------------------- set level ---

def proof_types(cfg):
    """Which image types turn on the subject's physical proof. Read from the
    slot lines in armada.toml rather than named here, so a rename of the type
    does not silently retire the check."""
    out = []
    for key, t in cfg["types"].items():
        blob = " ".join(str(t.get(k, "")) for k in ("shot", "subject", "camera_line"))
        if "{proof}" in blob:
            out.append(key)
    return out


def set_notes(results, checks, cfg):
    """The set-level block, reported across the wave and never gated. These are
    the checks a client actually names, and no single frame can carry one.

    What is mechanical is computed. What needs eyes is named as needing eyes,
    rather than quietly dropped: a check that vanishes from the output reads as
    a check that passed."""
    notes = []
    kinds = {}
    for r in results:
        kinds.setdefault(r.get("type") or "?", []).append(r)

    # One physical proof per subject. Two frames claiming the same proof for the
    # same subject is a repetition the set pays for, not a coincidence.
    for t in proof_types(cfg):
        seen = {}
        for r in results:
            if r.get("type") == t and r.get("subject"):
                seen.setdefault(r["subject"], set()).add(
                    r.get("slot") or config.slot_of(r["file"]))
        for subject, slots in sorted(seen.items()):
            if len(slots) > 1:
                notes.append("set: proof repeated - " + subject + " has "
                             + str(len(slots)) + " proof slots ("
                             + ", ".join(sorted(slots)) + ")")

    present = ", ".join(sorted(k for k in kinds if k and k != "?"))
    notes.append("set: " + str(len([k for k in kinds if k and k != "?"]))
                 + " image types present" + ((" (" + present + ")") if present else "")
                 + "; the difference table is audited at generation time")
    if "?" in kinds:
        notes.append("set: " + str(len(kinds["?"])) + " candidate(s) carry no image "
                     "type - the manifest never heard of them")

    eyes = [c["id"] for c in checks if c["set_level"]]
    if eyes:
        notes.append("set: " + ", ".join(eyes) + " are graded across the wave by eye, "
                     "not by this harness. Look at the contact sheet before the frames.")
    return notes


# ------------------------------------------------------------------ dry run ---

def dry_run(target, checks, cfg):
    """Build everything, call nothing, write nothing. What a person checks
    before spending a wave's worth of calls on a prompt with a typo in it."""
    target = os.path.normpath(target)
    if os.path.isdir(target):
        files = config.candidates(target)
        if not files:
            config.die("no candidates under " + target)
        path, wave = files[0], target
    else:
        path, wave = target, os.path.dirname(target)
    manifest = config.load_manifest(wave)
    name = os.path.basename(path)
    meta_row = manifest.get(name, {})
    m = meta_row.get("meta") or {}

    print("  DRY RUN     nothing is called, nothing is written")
    print("  candidate   " + path)
    print("  manifest    " + ("found" if meta_row else "NO ROW for this file - the "
                              "grader would see no subject and no references"))
    ref_paths, why = resolve_refs(path, meta_row, cfg)
    print("  references  " + (str(len(ref_paths)) + " would be attached, in this order"
                              if ref_paths else "none would be attached"))
    for i, p in enumerate(ref_paths, 2):
        size = os.path.getsize(p) if os.path.exists(p) else 0
        print("    image " + str(i) + "     " + p + "  ("
              + str(round(size / 1000)) + " kB"
              + ("" if os.path.exists(p) else ", MISSING") + ")")
    for w in why:
        print("    note      " + w)

    stranger = {"reads_as": "<the stranger's answer>", "purpose": "<...>",
                "part_counts": "<...>"}
    print("\n  ---- stranger prompt (image 1 = the candidate, alone) ----\n")
    print(stranger_prompt())
    gmeta = {"subject": m.get("subject"), "subject_noun": m.get("subject_noun"),
             "type": m.get("type"), "type_name": m.get("type_name"),
             "question": m.get("question"), "channel": m.get("channel"),
             "setting": m.get("setting"), "has_identity": bool(ref_paths),
             "extra_refs": len(ref_paths) > 1}
    print("\n  ---- grading prompt ----\n")
    print(grading_prompt(checks, gmeta, stranger))
    per_frame = len([c for c in checks if not c["set_level"]])
    print("\n  " + str(per_frame) + " per-frame checks, "
          + str(len(checks) - per_frame) + " set-level")


# ---------------------------------------------------------------------- cli ---

def main():
    ap = argparse.ArgumentParser(
        description="Grade a wave against the rubric. Advisory, always.")
    ap.add_argument("--batch", help="a wave directory")
    ap.add_argument("--one", help="a single file")
    ap.add_argument("--dry-run", dest="dry_run", metavar="FILE_OR_DIR",
                    help="build and print both prompts for the first candidate, "
                         "list the references that would be attached, call nothing")
    ap.add_argument("--offline", action="store_true",
                    help="grade with a deterministic fake grader instead of a model. "
                         "Exercises the whole pipeline without a key. Every row is "
                         "labelled grader=offline-fake and is not a grade.")
    ap.add_argument("--workers", type=int, default=DEFAULT_WORKERS)
    ap.add_argument("--runs", type=int, default=DEFAULT_RUNS,
                    help="grade each candidate this many times and report the "
                         "majority answer per check (default %(default)s)")
    ap.add_argument("--grader", default=None, help="force one grader model id")
    ap.add_argument("--out", default=None, help="results file (default "
                                                "qa_results.json beside the wave)")
    ap.add_argument("--filter", default="", metavar="SUBSTRING",
                    help="grade only candidates whose filename contains this, e.g. a "
                         "repair suffix. Use with --merge so the rest of the wave "
                         "keeps the grades it already has.")
    ap.add_argument("--merge", action="store_true",
                    help="load the existing results file and update only the rows "
                         "graded now, instead of replacing it")
    a = ap.parse_args()

    if not (a.batch or a.one or a.dry_run):
        ap.error("one of --batch, --one or --dry-run is required")

    cfg = config.load()
    checks = config.load_checks()
    version = config.rubric_version()
    print("  rubric      " + version + "   " + str(len(checks)) + " checks ("
          + str(len([c for c in checks if c["set_level"]])) + " set level)")
    if not config.rubric_gates():
        print("  CALIBRATION uncalibrated, REPORTING ONLY. Nothing below is a "
              "decision; it is a first pass of looking. You are the gate.")
    if refs is None:
        print("  NOTE        tools/refs.py is not importable: no identity reference "
              "can be attached, and every reference-bearing check is graded blind.")

    if a.dry_run:
        dry_run(a.dry_run, checks, cfg)
        return

    key = ""
    if a.offline:
        print("  OFFLINE     deterministic fake grader. Every row is labelled "
              "grader=offline-fake. This is a pipeline test, not a grading.")
    else:
        if require is None:
            config.die("tools/envload.py is not importable, so no key can be read "
                       "by name. Use --offline to exercise the pipeline without one.")
        key = require(key_name_for(a.grader or (cfg["models"]["graders"] or [""])[0]))

    if a.one:
        wave = os.path.dirname(os.path.abspath(a.one))
        manifest = config.load_manifest(wave)
        recs = [grade_one(key, a.one, checks, cfg, manifest, a.grader, r, a.offline)
                for r in range(max(1, a.runs))]
        print(json.dumps(majority(recs, checks), indent=1)[:4000])
        return

    wave = os.path.normpath(a.batch)
    manifest = config.load_manifest(wave)
    files = config.candidates(wave)
    print("  wave        " + wave)
    print("  candidates  " + str(len(files)) + "   manifest rows " + str(len(manifest)))
    if a.filter:
        files = [f for f in files if a.filter in os.path.basename(f)]
        print("  filter      " + a.filter + "  ->  " + str(len(files)) + " to grade")
        if not files:
            config.die("nothing matched the filter " + repr(a.filter))
        if not a.merge:
            print("  NOTE: --filter without --merge writes a results file covering "
                  "only the matched candidates. The rest of the wave reads as ungraded.")
    if not files:
        config.die("no candidates under " + wave)

    runs = max(1, a.runs)
    if runs < 2:
        print("  RUNS        1. Measured on a prior corpus, one grade moves the "
              "verdict on a quarter of a wave between runs. This cannot compare "
              "anything: not two arms, not two prompts, not two models.")
    else:
        print("  runs        " + str(runs) + ", reported as the majority answer per check")
    print("")

    t0 = time.time()
    jobs = [(f, r) for f in files for r in range(runs)]
    per_file = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, a.workers)) as ex:
        futs = {ex.submit(grade_one, key, f, checks, cfg, manifest,
                          a.grader, r, a.offline): (f, r) for f, r in jobs}
        for i, fut in enumerate(concurrent.futures.as_completed(futs), 1):
            rec = fut.result()
            per_file.setdefault(rec["file"], []).append(rec)
            if i % max(1, runs) == 0 or runs == 1:
                print("  [" + str(i).rjust(3) + "/" + str(len(jobs)) + "] "
                      + rec["verdict"].ljust(16) + rec["file"].ljust(34)
                      + ",".join(f["id"] for f in rec.get("failed", []))
                      + "  " + (rec.get("worst_issue") or "")[:56], flush=True)

    results = [majority(recs, checks) for recs in per_file.values()]
    unstable = [r["file"] for r in results if len(set(r.get("run_verdicts") or [])) > 1]

    out_path = a.out or os.path.join(wave, "qa_results.json")
    carried = []
    if a.merge:
        # Keep the grades the rest of the wave already has, and say how many were
        # carried rather than earned in this run. A merged file that does not
        # declare the merge invites someone to read it as one grading.
        if os.path.exists(out_path):
            with open(out_path, encoding="utf-8") as f:
                prior = json.load(f)
            fresh = {r["file"] for r in results}
            carried = [r for r in prior.get("results", []) if r["file"] not in fresh]
            results.extend(carried)
            unstable.extend(u for u in prior.get("unstable", []) if u not in fresh)
            print("\n  merged      " + str(len(results) - len(carried)) + " graded now, "
                  + str(len(carried)) + " carried from the previous run")
        else:
            print("\n  --merge asked for, but no previous results file at " + out_path)

    # An unknown verdict is not a low verdict, it is a broken record: rank it
    # below every known one so it can never win a slot by accident.
    results.sort(key=lambda r: (config.VERDICT_RANK.get(r["verdict"], -2), r["file"]))
    counts, per_check = {}, {}
    for r in results:
        counts[r["verdict"]] = counts.get(r["verdict"], 0) + 1
        for f in r.get("failed", []) + r.get("failed_advisory", []):
            per_check[f["id"]] = per_check.get(f["id"], 0) + 1

    payload = {
        "wave": os.path.basename(wave),
        "rubric_version": version,
        "gating": config.rubric_gates(),
        "graded_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "runs": runs,
        "checks": checks,
        "unstable": unstable,
        "verdict_counts": counts,
        "failed_counts": dict(sorted(per_check.items())),
        "set_level": set_notes(results, checks, cfg),
        "results": results,
    }
    if a.offline:
        payload["grader"] = "offline-fake"
    if carried:
        payload["carried"] = len(carried)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=1)

    print("\n  " + str(round(time.time() - t0)) + "s")
    for v in sorted(counts, key=lambda x: -config.VERDICT_RANK.get(x, -2)):
        print("  " + v.ljust(18) + str(counts[v]))
    if per_check:
        print("\n  most-failed checks:")
        for cid, n in sorted(per_check.items(), key=lambda kv: -kv[1])[:8]:
            print("    " + cid.ljust(5) + str(n))
    if runs > 1:
        print("\n  verdict unstable across runs on " + str(len(unstable)) + " of "
              + str(len(results)) + " candidates" + (":" if unstable else ""))
        for f in unstable[:10]:
            print("    " + f)
    print("")
    for n in payload["set_level"]:
        print("  " + n)
    print("\n  wrote " + out_path)
    print("  A verdict is a floor, not a decision. Look at every keeper against its "
          "identity reference before it goes anywhere.")


if __name__ == "__main__":
    main()
