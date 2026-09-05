#!/usr/bin/env python3
r"""The lane driver: every type across every subject, drawn concurrently.

    python tools/wave.py --wave wave-01-calibration --n 2
    python tools/wave.py --wave wave-01-calibration --only H-carafe --n 1
    python tools/wave.py --print-prompt L-carafe --setting city --repair
    python tools/wave.py --audit
    python tools/wave.py --wave test --n 1 --dry-run

A slot is one type times one subject. The type is a question the engagement
asks about its subjects; the subject is the thing that has to be right. Both
are declared in `armada.toml`, and neither is a taxonomy of this harness's.

Every prompt is this slot's shot, subject and camera line, then the shared
block read from `skill/references/generation.md` at runtime. The shared block
is what the whole set holds in common; the three lines above it are what makes
each frame its own photograph. **Anything in the shared block that is not true
of every slot is a bug**: a paragraph there silently outranks every slot line
beneath it, and it is the failure mode this file keeps running into from a new
direction each time.

Two of those directions, both paid for on a prior engagement:

  * A repair clause written into the shared block to fix one type quietly
    rewrote the other seven.
  * A setting swapped into the shared block told a studio-sweep type it was
    standing in an apartment, and it drew the apartment. Hence
    `setting_blind`: a type that shows no room is not told it is in one, and
    the manifest records the setting that was EFFECTIVE for that frame, not
    the wave's. Recording the wave's setting told a grader the frame was
    somewhere it was not, and cost a whole wave in false failures.

Output goes to the drive: `<creation>/<wave>/<TYPE> - <Type name>/<file>` with
a MANIFEST.jsonl per type folder. Pixels never come back into the repo.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config  # noqa: E402
import generate  # noqa: E402
import refs  # noqa: E402

FILL_FIELDS = "{noun} {proof} {place} {scale} {surface}"


# ------------------------------------------------------------------ prompt ---

def _fill(subject_key: str, setting_key: str, cfg: dict) -> dict:
    s = cfg["subjects"][subject_key]
    st = cfg["settings"][setting_key]
    return {
        "noun": s["noun"],
        "proof": s["proof"],
        # The setting's override, or the subject's own place. A setting swaps
        # exactly two things - the place line and one paragraph - which is what
        # makes a comparison between two settings mean anything.
        "place": (st.get("places") or {}).get(subject_key) or s["place"],
        "scale": s["scale"],
        "surface": st["surface"],
    }


def _format(line: str, fill: dict, what: str) -> str:
    try:
        return line.format(**fill)
    except KeyError as e:
        config.die("the " + what + " line in armada.toml uses {" + str(e).strip("'")
                   + "}, which is not one of " + FILL_FIELDS)
    except (IndexError, ValueError) as e:
        config.die("the " + what + " line in armada.toml is not a valid template ("
                   + str(e) + "). A literal brace has to be doubled: {{ }}.")
    return ""


def effective_setting(type_key: str, setting: str, cfg: dict) -> str:
    """The setting a frame is actually drawn in. A `setting_blind` type shows no
    room, so it is drawn on the default ground whatever the wave says - and the
    manifest records this, not the wave's setting."""
    return "default" if cfg["types"][type_key]["setting_blind"] else setting


def build_prompt(type_key: str, subject_key: str, repair: bool = False,
                 setting: str = "default", *, ground: str | None = None,
                 cfg: dict | None = None) -> str:
    """The prompt for one slot, in the order `## Prompt skeleton` declares:
    shot, subject, camera, scale (only when the subject has one), the shared
    block, and with `--repair` the general clauses then this slot's row."""
    cfg = cfg or config.load()
    _known(type_key, subject_key, setting, cfg)
    t = cfg["types"][type_key]
    eff = effective_setting(type_key, setting, cfg)
    fill = _fill(subject_key, eff, cfg)

    parts = [_format(t["shot"], fill, type_key + " shot"),
             _format(t["subject"], fill, type_key + " subject"),
             _format(t["camera_line"], fill, type_key + " camera_line")]
    if fill["scale"]:
        parts.append(_format(cfg["prompt"]["scale_clause"], fill, "[prompt].scale_clause"))

    block = config.shared_block()
    lead = cfg["prompt"]["swap_paragraph"]
    paragraph = ground if ground is not None else config.setting_paragraphs().get(eff)
    if paragraph:
        block = config.swap_paragraph(block, paragraph, lead)
    elif eff != "default":
        known = ", ".join(sorted(config.setting_paragraphs())) or "(none)"
        config.die("no paragraph for setting '" + eff + "' under '## Settings' in "
                   + str(config.GENERATION_MD) + ".\n    Known: " + known)
    parts.append(block)

    if repair:
        # General clauses first, then this slot's own row. Per slot and not in
        # the shared block, because a general clause silently overrides every
        # item beneath it.
        parts.extend(config.repair_clauses())
        own = config.slot_repairs().get(type_key + "-" + subject_key)
        if own:
            parts.append(own)
    return "\n\n".join(p for p in parts if p)


# ------------------------------------------------------------------- stack ---

def _attach_entries(slot: str, cfg: dict) -> list[str]:
    spec = (cfg.get("attach") or {}).get(slot)
    if not spec:
        return []
    return spec if isinstance(spec, list) else [spec]


def slot_refs(type_key: str, subject_key: str, setting: str = "default",
              cfg: dict | None = None) -> list[str]:
    """The reference stack for one slot, in binding order: identity, then the
    detail view this slot turns on, then any governed attachments, then a look
    anchor - and only when the type names one, the setting says its anchors
    apply, and there is still room under `[prompt].max_refs`."""
    cfg = cfg or config.load()
    _known(type_key, subject_key, setting, cfg)
    slot = type_key + "-" + subject_key
    t = cfg["types"][type_key]
    eff = effective_setting(type_key, setting, cfg)

    stack = [refs.identity(subject_key, cfg=cfg)]
    role = (cfg.get("detail_for") or {}).get(slot)
    if role:
        d = refs.detail(subject_key, role, cfg=cfg)
        if d:
            stack.append(d)
    for entry in _attach_entries(slot, cfg):
        if str(entry).startswith("parts:"):
            stack.extend(refs.parts(subject_key, str(entry).split(":", 1)[1], cfg=cfg))
        else:
            config.die("armada.toml [attach] " + repr(slot) + " = " + repr(entry)
                       + " is not understood.\n    The only entry shape is 'parts:<key>'.")
    cap = int(cfg["prompt"]["max_refs"])
    if t["anchor"] and cfg["settings"][eff]["anchors"] and len(stack) < cap:
        a = refs.anchor(t["anchor"], cfg=cfg)
        if a:
            stack.append(a)
    return refs.check(stack, cfg)


# ------------------------------------------------------------------- slots ---

def _known(type_key: str, subject_key: str, setting: str, cfg: dict) -> None:
    if type_key not in cfg["types"]:
        config.die("unknown type " + repr(type_key) + ". armada.toml declares: "
                   + (", ".join(cfg["types"]) or "(none)"))
    if subject_key not in cfg["subjects"]:
        config.die("unknown subject " + repr(subject_key) + ". armada.toml declares: "
                   + (", ".join(cfg["subjects"]) or "(none)"))
    if setting not in cfg["settings"]:
        config.die("unknown setting " + repr(setting) + ". armada.toml declares: "
                   + ", ".join(cfg["settings"]))


def slots(types=None, subjects=None, cfg: dict | None = None) -> list[tuple[str, str]]:
    cfg = cfg or config.load()
    return [(t, s) for t in (types or list(cfg["types"]))
            for s in (subjects or list(cfg["subjects"]))]


def audit(cfg: dict | None = None) -> int:
    """The difference table. Camera height, where the subject sits, the dominant
    shape - declared per type, written before generating and never left to
    sampling. **Two types sharing all three is a defect**, not a coincidence:
    it means the set answers one question twice and another one never."""
    cfg = cfg or config.load()
    seen: dict[tuple, str] = {}
    clashes = 0
    for key, t in cfg["types"].items():
        axes = (t["camera"], t["position"], t["shape"])
        if axes in seen:
            clashes += 1
            print("  CLASH " + key + " and " + seen[axes] + " share all three axes:")
            print("        camera   " + (axes[0] or "(empty)"))
            print("        position " + (axes[1] or "(empty)"))
            print("        shape    " + (axes[2] or "(empty)"))
        else:
            seen[axes] = key
    print("  " + str(len(cfg["types"])) + " types, " + str(clashes) + " collisions")
    return clashes


# -------------------------------------------------------------- situations ---
#
# A situation is a thing happening, varied across interiors. It is deliberately
# NOT another type: the types are the engagement's own questions and that axis
# stays closed. A situation borrows one slot and varies only the ground
# paragraph, the same swap a setting makes, so the set answers "does this
# moment work in our world?" instead of "what does this subject look like?".

def situations(path=None) -> dict[str, dict[str, str]]:
    """`## Situations` in generation.md: a `### <name>` block per situation,
    each holding `**interior**` headings with one fenced paragraph each."""
    p = path or config.GENERATION_MD
    try:
        with open(p, encoding="utf-8") as f:
            txt = f.read()
    except OSError:
        config.die("cannot read " + str(p))
        return {}
    m = re.search(r"^## Situations[^\n]*\n(.*?)(?=^## |\Z)", txt, re.S | re.M)
    if not m:
        return {}
    out: dict[str, dict[str, str]] = {}
    for block in re.finditer(r"^### ([a-z0-9-]+)[^\n]*\n(.*?)(?=^### |\Z)",
                             m.group(1), re.S | re.M):
        parts = re.split(r"\n\*\*([a-z0-9-]+)\*\*", "\n" + block.group(2))
        interiors = {}
        for name, chunk in zip(parts[1::2], parts[2::2]):
            fences = re.findall(r"```[a-z]*\s*\n(.*?)```", chunk, re.S)
            if fences:
                interiors[name] = fences[0].strip()
        if interiors:
            out[block.group(1)] = interiors
    return out


def _situation(name: str) -> dict[str, str]:
    found = situations()
    if name not in found:
        config.die("no '### " + name + "' block under '## Situations' in "
                   + str(config.GENERATION_MD) + ".\n    Known: "
                   + (", ".join(sorted(found)) or "(none)"))
    return found[name]


# --------------------------------------------------------------------- run ---

def main() -> None:
    cfg = generate.cli_config()
    ap = argparse.ArgumentParser(
        description="Run a wave: every type across every subject.",
        epilog="Output: <creation>/<wave>/<TYPE> - <Type name>/ plus MANIFEST.jsonl.")
    ap.add_argument("--wave", default="", help="e.g. wave-01-calibration")
    ap.add_argument("--n", type=int, default=2, help="draws per slot")
    ap.add_argument("--lane", default=cfg["models"]["default"],
                    choices=sorted(cfg["models"]["lanes"]))
    ap.add_argument("--types", default="", help="comma list, e.g. H,P")
    ap.add_argument("--subjects", default="", help="comma list, e.g. carafe,bowl")
    ap.add_argument("--only", default="", metavar="TYPE-subject", help="one slot")
    ap.add_argument("--slots", default="", help="comma list of exact slots, e.g. H-carafe,L-bowl")
    ap.add_argument("--suffix", default="",
                    help="added to the filename, e.g. r2, so a redraw cannot overwrite "
                         "the draw it repairs")
    ap.add_argument("--repair", action="store_true",
                    help="append the repair clauses from generation.md")
    ap.add_argument("--setting", default="default", choices=sorted(cfg["settings"]),
                    help="swaps the place line per subject and one paragraph of the "
                         "shared block, and nothing else")
    ap.add_argument("--situation", default="", metavar="NAME",
                    help="draw one slot across every interior of a '## Situations' block")
    ap.add_argument("--interior", default="", help="with --situation: just this interior")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--print-prompt", default="", metavar="SLOT",
                    help="print the prompt and the references in binding order; no wave needed")
    ap.add_argument("--audit", action="store_true",
                    help="report types that share camera, position and shape; exit 1 on any")
    ap.add_argument("--dry-run", action="store_true",
                    help="everything except the API call; prints the plan and writes nothing")
    a = ap.parse_args()

    if a.audit:
        raise SystemExit(0 if audit(cfg) == 0 else 1)

    if a.situation:
        return _run_situation(a, cfg)

    if a.print_prompt:
        t, s = config.split_slot(a.print_prompt)
        print(build_prompt(t, s, a.repair, a.setting, cfg=cfg))
        print("\n--- references, in binding order ---")
        for i, r in enumerate(slot_refs(t, s, a.setting, cfg), 1):
            print("  " + str(i) + ". " + os.path.basename(r))
        return

    if not a.wave:
        config.die("--wave is required to draw (only --audit and --print-prompt run without one)")

    if a.slots:
        todo = [config.split_slot(s) for s in a.slots.split(",") if s]
    elif a.only:
        todo = [config.split_slot(a.only)]
    else:
        todo = slots([x for x in a.types.split(",") if x] or None,
                     [x for x in a.subjects.split(",") if x] or None, cfg)
    for t, s in todo:
        _known(t, s, a.setting, cfg)

    print("  wave     " + a.wave)
    print("  setting  " + a.setting + ("  (repair clauses appended)" if a.repair else ""))
    print("  slots    " + str(len(todo)) + " x " + str(a.n) + " draws on lane " + a.lane
          + " (" + generate.lane_model(a.lane, cfg) + ")")
    print("  out      " + str(config.wave_dir(a.wave, cfg=cfg)))
    if a.dry_run:
        print("  DRY RUN  the plan only; no request is sent and nothing is written")
    audit(cfg)
    print("")

    def one(job):
        t, s = job
        name = t + "-" + s
        try:
            out_dir = config.wave_dir(a.wave, config.type_folder(t, cfg), cfg)
            spec = cfg["types"][t]
            eff = effective_setting(t, a.setting, cfg)
            files = generate.draw(
                name + (("__" + a.suffix) if a.suffix else ""),
                build_prompt(t, s, a.repair, a.setting, cfg=cfg),
                out_dir, slot_refs(t, s, a.setting, cfg),
                lane=a.lane, n=a.n, ar=spec["ar"], size="2K",
                meta=generate.meta_row(
                    type=t, type_name=spec["name"], question=spec["question"],
                    channel=spec["channel"], subject=s,
                    subject_noun=cfg["subjects"][s]["noun"], aspect=spec["ar"],
                    camera=spec["camera"], position=spec["position"],
                    shape=spec["shape"], wave=a.wave, setting=eff,
                    repair=bool(a.repair), suffix=a.suffix),
                quiet=True, dry_run=a.dry_run)
            return (name, len(files), None)
        except SystemExit as e:
            return (name, 0, str(e).strip())
        except Exception as e:  # noqa: BLE001 - one slot must never kill the wave
            # str(e), not e. Concatenating the exception object raised a
            # TypeError inside the handler on a prior engagement, which turned
            # one failed slot into a dead wave - the exact outcome this except
            # clause exists to prevent.
            return (name, 0, type(e).__name__ + ": " + str(e))

    noun = " planned" if a.dry_run else " files"
    t0 = time.time()
    done = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, a.workers)) as ex:
        for name, n, err in ex.map(one, todo):
            done += 1
            line = ("  [" + str(done).rjust(2) + "/" + str(len(todo)) + "] "
                    + ("ok  " if err is None else "FAIL") + " " + name.ljust(22)
                    + str(n) + noun)
            if err:
                line += "  " + " ".join(str(err).split())
            generate.say(line)

    print("\n  " + str(round(time.time() - t0)) + "s total")
    if not a.dry_run:
        print("  sheet it:  python tools/make_contact_sheet.py \""
              + str(config.wave_dir(a.wave, cfg=cfg)) + "\"")


def _run_situation(a, cfg: dict) -> None:
    """One slot across every interior of a named situation. The interior swaps
    the same paragraph a setting swaps, and nothing else moves - so a
    difference between two interiors is a difference in the interior."""
    interiors = _situation(a.situation)
    if a.print_prompt:
        picked = [config.split_slot(a.print_prompt)]
    elif a.slots or a.only:
        picked = [config.split_slot(s) for s in ((a.slots or a.only).split(","))]
    else:
        picked = slots([x for x in a.types.split(",") if x] or None,
                       [x for x in a.subjects.split(",") if x] or None, cfg)
    if len(picked) != 1:
        config.die("--situation draws ONE slot across its interiors; " + str(len(picked))
                   + " slots selected.\n    Narrow it with --only TYPE-subject.")
    t, s = picked[0]
    _known(t, s, "default", cfg)
    names = [a.interior] if a.interior else sorted(interiors)
    for i in names:
        if i not in interiors:
            config.die("no interior '" + i + "' in situation '" + a.situation
                       + "'.\n    Known: " + ", ".join(sorted(interiors)))

    if a.print_prompt:
        one_interior = a.interior or names[0]
        print(build_prompt(t, s, a.repair, "default", ground=interiors[one_interior], cfg=cfg))
        print("\n--- references, in binding order ---")
        for i, r in enumerate(slot_refs(t, s, "default", cfg), 1):
            print("  " + str(i) + ". " + os.path.basename(r))
        return

    wave = "situation-" + a.situation
    out_dir = config.wave_dir(wave, cfg=cfg)
    spec = cfg["types"][t]
    print("  situation " + a.situation + "  (slot " + t + "-" + s + ", " + spec["ar"] + ")")
    print("  interiors " + str(len(names)) + " x " + str(a.n) + " draws on lane " + a.lane)
    print("  out       " + str(out_dir) + "\n")

    def one(interior):
        try:
            # The interior rides in the filename suffix, so a situation's draws
            # keep the filename grammar and stay grouped by the slot they vary.
            files = generate.draw(
                t + "-" + s + "__" + interior + (("-" + a.suffix) if a.suffix else ""),
                build_prompt(t, s, a.repair, "default", ground=interiors[interior], cfg=cfg),
                out_dir, slot_refs(t, s, "default", cfg),
                lane=a.lane, n=a.n, ar=spec["ar"], size="2K",
                meta=generate.meta_row(
                    type=t, type_name=spec["name"], question=spec["question"],
                    channel=spec["channel"], subject=s,
                    subject_noun=cfg["subjects"][s]["noun"], aspect=spec["ar"],
                    camera=spec["camera"], position=spec["position"],
                    shape=spec["shape"], wave=wave, setting=interior,
                    repair=bool(a.repair), suffix=interior),
                quiet=True, dry_run=a.dry_run)
            return (interior, len(files), None)
        except SystemExit as e:
            return (interior, 0, str(e).strip())
        except Exception as e:  # noqa: BLE001 - one interior must never kill the set
            return (interior, 0, type(e).__name__ + ": " + str(e))

    t0 = time.time()
    done = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, a.workers)) as ex:
        for interior, n, err in ex.map(one, names):
            done += 1
            generate.say("  [" + str(done) + "/" + str(len(names)) + "] "
                         + ("ok  " if err is None else "FAIL") + " " + interior.ljust(20)
                         + str(n) + (" planned" if a.dry_run else " files")
                         + ("  " + " ".join(str(err).split()) if err else ""))
    print("\n  " + str(round(time.time() - t0)) + "s total")


if __name__ == "__main__":
    main()
