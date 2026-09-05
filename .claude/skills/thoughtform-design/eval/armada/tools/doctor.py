r"""The preflight. Run it once after onboarding, and again whenever a wave
behaves like the files moved.

    python tools/doctor.py
    python tools/doctor.py --json

Everything an engagement needs before the first draw is a file somewhere, and
every one of those files is something a person edits by hand. This walks the
three runtime documents and the drive and says, one line each, whether they
agree with one another.

**It exits 1 when something would break a wave**, and only warns otherwise. The
distinction is deliberate: a missing look anchor is a warning because the wave
still draws; a missing identity reference is a failure because the wave draws
the wrong subject and nothing downstream can tell. The cost of the loose
version is a wave's worth of calls spent on the wrong thing, discovered at the
grading step.

**No credential value is ever printed here.** Keys are reported by name and, as
proof, by length.
"""
from __future__ import annotations

import argparse
import io
import json
import os
import sys
import contextlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import config  # noqa: E402

try:
    from qa import key_name_for  # noqa: E402
except ImportError:                                       # pragma: no cover
    def key_name_for(model_id):
        m = (model_id or "").lower()
        return "OPENAI_API_KEY" if m.startswith(("gpt", "o1", "o3", "dall")) \
            else "GEMINI_API_KEY"

try:
    from envload import require  # noqa: E402
except ImportError:                                       # pragma: no cover
    require = None


def _msg(e) -> str:
    """`config.die` frames its message with a leading marker for a terminal.
    Inside a report line the marker is noise, so it comes off here."""
    s = str(e).strip()
    return s[2:].strip() if s.startswith("x ") else s


class Report:
    """A list of lines, each with a verdict. FAIL means a wave would break."""

    def __init__(self):
        self.rows = []

    def add(self, status, name, detail=""):
        self.rows.append({"status": status, "check": name, "detail": detail})

    def ok(self, name, detail=""):
        self.add("ok", name, detail)

    def warn(self, name, detail=""):
        self.add("warn", name, detail)

    def fail(self, name, detail=""):
        self.add("fail", name, detail)

    @property
    def failures(self):
        return [r for r in self.rows if r["status"] == "fail"]

    @property
    def warnings(self):
        return [r for r in self.rows if r["status"] == "warn"]


# ------------------------------------------------------------------ checks ---

def check_config(rep):
    try:
        cfg = config.load(fresh=True)
    except SystemExit as e:
        rep.fail("armada.toml", _msg(e))
        return None
    except Exception as e:                                # noqa: BLE001
        rep.fail("armada.toml", "does not parse: " + str(e))
        return None
    name = cfg["engagement"]["name"] or "(unnamed)"
    if "{{" in name:
        rep.fail("armada.toml", "still holds template placeholders: " + name
                 + ". Run tools/new_engagement.py or fill [engagement] in by hand.")
    else:
        rep.ok("armada.toml", name + " - " + str(len(cfg["subjects"])) + " subjects, "
               + str(len(cfg["types"])) + " types, " + str(len(cfg["settings"]))
               + " settings")
    if not cfg["subjects"]:
        rep.fail("subjects", "none defined; there is nothing for a wave to be about")
    if not cfg["types"]:
        rep.fail("types", "none defined; a wave has no slots without them")
    return cfg


def check_drive(rep, cfg):
    """Returns the drive root when it is there to be walked, else None. Pixels
    live outside the repo, so an unmounted drive is a warning, not a failure:
    the tools still parse, and a person on a second machine should be able to
    run the doctor without the share attached."""
    try:
        root = config.drive_root(cfg)
    except SystemExit as e:
        rep.fail("drive root", _msg(e))
        return None
    if root.exists():
        rep.ok("drive root", str(root))
        return root
    rep.warn("drive root", str(root) + " is not reachable from here. Every file "
             "check below is skipped, not passed.")
    return None


def check_assets(rep, cfg, mounted):
    """Identity references first: the whole pipeline is anchored on them.

    Then everything else armada.toml names by path. A configured asset that does
    not resolve is a failure even though the wave would still draw: the slot
    that turns on it draws without the geometry it exists for, and nothing in
    the output says so."""
    for key, s in sorted(cfg["subjects"].items()):
        rel = s.get("identity") or ""
        if not rel:
            rep.fail("identity " + key, "no identity reference configured. Every draw "
                     "attaches this first; without it the subject is whatever the "
                     "model remembers.")
            continue
        if not mounted:
            rep.warn("identity " + key, "not checked, the drive is not mounted: " + rel)
            continue
        p = config.resolve_asset(rel, cfg)
        if p.exists():
            rep.ok("identity " + key, str(p))
        else:
            rep.fail("identity " + key, "missing: " + str(p))

    for slot, role in sorted(cfg["detail_for"].items()):
        label = "detail_for " + slot
        try:
            _t, subject = config.split_slot(slot)
        except SystemExit as e:
            rep.fail(label, _msg(e))
            continue
        if _t not in cfg["types"]:
            rep.fail(label, "names type " + _t + ", which armada.toml has no [types."
                     + _t + "]")
            continue
        s = cfg["subjects"].get(subject)
        if s is None:
            rep.fail(label, "names subject " + subject + ", which is not configured")
            continue
        rel = (s.get("detail") or {}).get(role)
        if not rel:
            rep.fail(label, "turns on detail " + repr(role) + ", which "
                     "[subjects." + subject + ".detail] does not have")
            continue
        if not mounted:
            rep.warn(label, "not checked, the drive is not mounted: " + rel)
            continue
        p = config.resolve_asset(rel, cfg)
        (rep.ok if p.exists() else rep.fail)(label, str(p) if p.exists()
                                             else "missing: " + str(p))

    anchors = cfg["anchors"]
    if not anchors:
        rep.warn("anchors", "none yet. Correct until the client has approved an "
                 "output; a look anchor is an approved frame, never a reference.")
    for name, rel in sorted(anchors.items()):
        label = "anchor " + name
        if not mounted:
            rep.warn(label, "not checked, the drive is not mounted: " + rel)
            continue
        p = config.resolve_asset(rel, cfg)
        (rep.ok if p.exists() else rep.fail)(label, str(p) if p.exists()
                                             else "missing: " + str(p))

    for slot, spec in sorted(cfg["attach"].items()):
        label = "attach " + slot
        try:
            _t, subject = config.split_slot(slot)
        except SystemExit as e:
            rep.fail(label, _msg(e))
            continue
        s = cfg["subjects"].get(subject)
        if s is None:
            rep.fail(label, "names subject " + subject + ", which is not configured")
            continue
        spec = str(spec)
        if spec.startswith("parts:"):
            role = spec.split(":", 1)[1]
            rel = (s.get("parts") or {}).get(role)
            if not rel:
                rep.fail(label, "asks for parts:" + role + ", which [subjects."
                         + subject + ".parts] does not have")
                continue
        else:
            rel = spec
        if not mounted:
            rep.warn(label, "not checked, the drive is not mounted: " + rel)
            continue
        p = config.resolve_asset(rel, cfg)
        (rep.ok if p.exists() else rep.fail)(label, str(p) if p.exists()
                                             else "missing: " + str(p))


def check_generation(rep, cfg):
    """The prose half of the contract. A setting that has no paragraph swaps
    nothing and silently draws in the default house, which reads as the setting
    doing nothing rather than as a missing file."""
    if not config.GENERATION_MD.exists():
        rep.fail("generation.md", "missing at " + str(config.GENERATION_MD))
        return
    try:
        shared = config.shared_block()
    except SystemExit as e:
        rep.fail("generation.md shared block", _msg(e))
        return
    rep.ok("generation.md", "shared block, " + str(len(shared.split("\n\n")))
           + " paragraphs, " + str(len(shared)) + " chars")

    lead = cfg["prompt"]["swap_paragraph"]
    if any(p.startswith(lead) for p in shared.split("\n\n")):
        rep.ok("swap paragraph", repr(lead) + " leads a paragraph of the shared block")
    else:
        rep.fail("swap paragraph", "no paragraph of the shared block starts with "
                 + repr(lead) + ", so --setting would swap nothing and every wave "
                 "would draw in the default house without saying so")

    paras = config.setting_paragraphs()
    if "default" in paras:
        rep.ok("setting default", "has a paragraph in generation.md")
    else:
        rep.fail("setting default", "no **default** paragraph under '## Settings'. "
                 "Keep it there so the swap is explicit rather than implied.")
    for name in sorted(cfg["settings"]):
        if name == "default":
            continue
        if name in paras:
            rep.ok("setting " + name, "has a paragraph in generation.md")
        else:
            rep.fail("setting " + name, "configured in armada.toml but has no "
                     "**" + name + "** paragraph under '## Settings'")
    orphans = sorted(set(paras) - set(cfg["settings"]))
    for name in orphans:
        rep.warn("setting " + name, "a paragraph in generation.md that armada.toml "
                 "has no [settings." + name + "] for; nothing can select it")


def check_rubric(rep):
    if not config.RUBRIC_MD.exists():
        rep.fail("rubric.md", "missing at " + str(config.RUBRIC_MD))
        return
    try:
        checks = config.load_checks()
    except SystemExit as e:
        rep.fail("rubric.md", _msg(e))
        return
    per_frame = [c for c in checks if not c["set_level"]]
    rep.ok("rubric.md", "version " + config.rubric_version() + ", " + str(len(checks))
           + " checks (" + str(len(per_frame)) + " per frame, "
           + str(len(checks) - len(per_frame)) + " set level)")
    if config.rubric_gates():
        rep.ok("calibration", "the rubric says it may gate")
    else:
        rep.warn("calibration", "uncalibrated, reporting only. qa.py will grade and "
                 "refuse to decide. You are the gate.")
    if config.rubric_section("Scoring"):
        rep.ok("scoring table", "present; config.verdict mirrors it")
    else:
        rep.fail("scoring table", "no '## Scoring' section. The verdict ladder in "
                 "config.verdict then mirrors nothing and cannot be checked against "
                 "the rubric it claims to follow.")
    if not config.rubric_section("Grading rules"):
        rep.warn("grading rules", "no '## Grading rules' section; the grader's prompt "
                 "will carry the checks with no instructions around them")
    if not config.rubric_section("Stranger's read"):
        rep.warn("stranger's read", "no '## Stranger's read' section; qa.py falls back "
                 "to its own generic wording, which knows nothing about this subject")


def difference_table(rep, cfg):
    """Two types sharing camera height, subject position and dominant shape is a
    defect: the wave draws the same photograph twice under two names. `wave.py`
    owns the audit; when it is not there yet the same three-axis check runs from
    armada.toml, because this is a preflight and it should not depend on which
    tools happen to exist."""
    mod = None
    try:
        import wave as maybe                              # noqa: PLC0415
        # The stdlib also ships a `wave`. Only ours counts.
        if os.path.dirname(os.path.abspath(getattr(maybe, "__file__", ""))) == HERE \
                and hasattr(maybe, "audit"):
            mod = maybe
    except Exception:                                     # noqa: BLE001
        mod = None
    if mod is not None:
        try:
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                clashes = mod.audit()
            n = clashes if isinstance(clashes, int) else 0
            (rep.ok if not n else rep.fail)(
                "difference table",
                "wave.audit(): " + (str(n) + " collisions" if n else "clash-free"))
            return
        except (SystemExit, Exception):                   # noqa: BLE001
            pass  # fall through to the local check rather than losing the preflight

    seen, clashes, thin = {}, 0, []
    for key, t in cfg["types"].items():
        axes = (t.get("camera", ""), t.get("position", ""), t.get("shape", ""))
        if not all(axes):
            thin.append(key)
        if axes in seen:
            rep.fail("difference table", key + " and " + seen[axes] + " share all "
                     "three axes: camera height, position and dominant shape. One of "
                     "them is drawing the other's photograph.")
            clashes += 1
        seen[axes] = key
    for key in thin:
        rep.warn("difference table", key + " leaves one of camera/position/shape "
                 "empty; the axis it does not state is the one sampling decides")
    if not clashes:
        rep.ok("difference table", str(len(cfg["types"])) + " types, clash-free")


def check_keys(rep, cfg):
    """By name and by length. A doctor that proves a key is present by showing
    it has just published it into a terminal, a scrollback and a screenshot."""
    wanted = {}
    for lane, model in cfg["models"]["lanes"].items():
        wanted.setdefault(key_name_for(model), []).append(lane)
    for g in cfg["models"]["graders"]:
        wanted.setdefault(key_name_for(g), []).append("grader")
    if require is None:
        rep.fail("envload", "tools/envload.py is not importable, so no key can be "
                 "read by name: " + ", ".join(sorted(wanted)))
        return
    for name, users in sorted(wanted.items()):
        try:
            value = require(name)
        except SystemExit:
            value = ""
        except Exception:                                 # noqa: BLE001
            value = ""
        if value:
            rep.ok("key " + name, "present, " + str(len(value)) + " chars  (for "
                   + ", ".join(sorted(set(users))) + ")")
        else:
            rep.fail("key " + name, "absent. Needed by " + ", ".join(sorted(set(users)))
                     + ". Put it in the canonical .env by name; never in the repo.")


def check_pillow(rep):
    try:
        from PIL import Image  # noqa: F401,PLC0415
        import PIL             # noqa: PLC0415
        rep.ok("Pillow", "importable, " + getattr(PIL, "__version__", "version unknown"))
    except ImportError as e:
        rep.fail("Pillow", "not importable (" + str(e) + "). Crops, contact sheets and "
                 "model-ready derives all need it.")


def check_version(rep):
    v = config.armada_version()
    if v == "unversioned":
        rep.warn("armada version", "no tools/ARMADA_VERSION. A wave graded by an "
                 "unnamed build cannot be compared with one graded by another.")
    else:
        rep.ok("armada version", v)


# --------------------------------------------------------------------- cli ---

def run():
    rep = Report()
    check_version(rep)
    cfg = check_config(rep)
    if cfg is None:
        return rep
    mounted = check_drive(rep, cfg) is not None
    check_assets(rep, cfg, mounted)
    check_generation(rep, cfg)
    check_rubric(rep)
    difference_table(rep, cfg)
    check_keys(rep, cfg)
    check_pillow(rep)
    return rep


def main():
    ap = argparse.ArgumentParser(
        description="Preflight an engagement: config, assets, prose, rubric, keys.")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    a = ap.parse_args()

    rep = run()
    payload = {
        "repo": str(config.REPO),
        "armada": config.armada_version(),
        "ok": not rep.failures,
        "failures": len(rep.failures),
        "warnings": len(rep.warnings),
        "checks": rep.rows,
    }
    if a.json:
        print(json.dumps(payload, indent=1))
    else:
        print("  repo        " + str(config.REPO))
        print("")
        for r in rep.rows:
            mark = {"ok": "  ok  ", "warn": "  warn", "fail": "  FAIL"}[r["status"]]
            print(mark + "  " + r["check"].ljust(22) + r["detail"])
        print("")
        if rep.failures:
            print("  " + str(len(rep.failures)) + " would break a wave, "
                  + str(len(rep.warnings)) + " worth knowing.")
            print("  Fix the failures before drawing. A wave run against a missing "
                  "reference costs its whole run to find out.")
        else:
            print("  Clear. " + str(len(rep.warnings)) + " warning(s); read them, "
                  "then draw.")
    raise SystemExit(1 if rep.failures else 0)


if __name__ == "__main__":
    main()
