#!/usr/bin/env python3
r"""The reference index: which file is the truth about which subject.

`armada.toml` says what is true about the subjects and where that truth is
stored; this file turns a subject and a role into an absolute path, or into a
clear failure naming what is missing. Nothing here is a judgement about how a
picture should look.

Roles:

    identity   the file the whole pipeline is anchored on - the packshot, the
               portrait, the location plate. Attached FIRST on every draw of
               that subject, and never a previous draw. Output as the next
               input drifts the subject across a set, and on a set whose whole
               point is that the subject is right, that is the one failure
               that cannot be retouched away.
    detail     a second view - angle, reverse, controls, parts - attached only
               when the shot turns on geometry the identity view cannot show.
               Narrowing the reference beats writing another sentence about
               the angle.
    anchor     a look anchor: an approved OUTPUT, never identity truth. Third
               at most, and only where a setting says its anchors apply.
    parts      governed cut-outs of exact components. Attached, never
               described, because the point of a governed cut-out is that
               nobody redraws it.

**A missing file is a finding to report, never a substitution.** A role that
`armada.toml` does not declare returns nothing and the stack is simply shorter;
a role it does declare whose file is not there stops the run and names the
path. The difference matters: the first is a choice, the second is a broken
index, and quietly attaching a different file turns the second into a set of
pictures of the wrong thing.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config  # noqa: E402

IMAGE_SUFFIXES = (".png", ".jpg", ".jpeg", ".webp")

# Derived copies live in a folder beside the source. The leading underscore is
# load-bearing: `config.candidates()` skips `_` folders, so a derive can never
# be graded, promoted or handed over as if it were a draw.
DERIVED_DIRNAME = "_model-ready"


# --------------------------------------------------------------- the index ---

def _subject(subject: str, cfg: dict) -> dict:
    s = cfg["subjects"].get(subject)
    if s is None:
        known = ", ".join(cfg["subjects"]) or "(none declared)"
        config.die("unknown subject: " + repr(subject) + ". armada.toml declares: " + known)
    return s


def _must_exist(p: Path, what: str) -> Path:
    if not p.exists():
        config.die(what + " is declared in armada.toml but not on disk:\n    " + str(p)
                   + "\n    A missing reference is a finding to report, never a reason to"
                     "\n    attach a different file.")
    return p


def identity(subject: str, ready: bool = True, cfg: dict | None = None) -> str:
    """The file that is the truth about this subject. Attached first, always."""
    cfg = cfg or config.load()
    rel = _subject(subject, cfg).get("identity", "")
    if not rel:
        config.die("[subjects." + subject + "] has no `identity`. Every subject needs the"
                   "\n    one real file the whole pipeline is anchored on.")
    p = _must_exist(config.resolve_asset(rel, cfg), "the identity reference for " + subject)
    return model_ready(p, cfg) if ready else str(p)


def detail(subject: str, role: str, ready: bool = True, cfg: dict | None = None) -> str | None:
    """A second view of the subject, or None when the toml declares no such
    role. Never another subject's file, and never the identity view again."""
    cfg = cfg or config.load()
    rel = (_subject(subject, cfg).get("detail") or {}).get(role)
    if not rel:
        return None
    p = _must_exist(config.resolve_asset(rel, cfg),
                    "the detail view '" + role + "' for " + subject)
    return model_ready(p, cfg) if ready else str(p)


def anchor(key: str, ready: bool = True, cfg: dict | None = None) -> str | None:
    """A look anchor from `[anchors]`, or None when none is declared under that
    name. Anchors are approved output; they never outrank the identity file."""
    cfg = cfg or config.load()
    rel = (cfg.get("anchors") or {}).get(key)
    if not rel:
        return None
    p = _must_exist(config.resolve_asset(rel, cfg), "the look anchor '" + key + "'")
    return model_ready(p, cfg) if ready else str(p)


def parts(subject: str, key: str, ready: bool = True, cfg: dict | None = None) -> list[str]:
    """The governed cut-outs under `[subjects.<s>.parts].<key>`, in name order.

    The value is a directory (every image in it), a single file, or a list of
    either. An empty declared directory is a finding, not an empty stack: it
    means the governed set moved and nobody said so."""
    cfg = cfg or config.load()
    spec = (_subject(subject, cfg).get("parts") or {}).get(key)
    if not spec:
        return []
    out: list[Path] = []
    for item in (spec if isinstance(spec, list) else [spec]):
        p = _must_exist(config.resolve_asset(item, cfg),
                        "the parts entry '" + key + "' for " + subject)
        if p.is_dir():
            found = sorted(f for f in p.iterdir()
                           if f.suffix.lower() in IMAGE_SUFFIXES and not f.name.startswith("_"))
            if not found:
                config.die("the parts directory for " + subject + "/" + key + " holds no images:"
                           "\n    " + str(p))
            out.extend(found)
        else:
            out.append(p)
    return [model_ready(p, cfg) if ready else str(p) for p in out]


# ---------------------------------------------------------------- the stack ---

def check(stack, cfg: dict | None = None) -> list[str]:
    """The stack as it may actually be sent: nothing refused, nothing past the cap.

    A filename carrying a `[refs].refuse` marker is the instruction - the file
    says of itself that it must not be sent - and refusing it is not a matter
    of taste. Past `[prompt].max_refs` the model averages the stack and the
    subject drifts toward a generic one, so the tail is dropped rather than
    silently degrading every draw in the wave."""
    cfg = cfg or config.load()
    out = [str(p) for p in stack if p]
    for p in out:
        base = os.path.basename(p)
        for bad in cfg["refs"]["refuse"]:
            if bad and bad in base:
                config.die("refusing to attach a marked file: " + base
                           + "\n    The filename is the instruction ([refs].refuse in armada.toml).")
    cap = int(cfg["prompt"]["max_refs"])
    if len(out) > cap:
        sys.stderr.write("  note: " + str(len(out)) + " references, keeping the first "
                         + str(cap) + " ([prompt].max_refs)\n")
    return out[:cap]


# ------------------------------------------------------ model-ready copies ---
#
# A photographer's original runs to five figures of pixels and tens of MB. No
# image API takes that: a Gemini inline_data part is base64, so a 99 MB file is
# a 132 MB request. So a derived copy is made once per reference and attached
# instead.
#
# This is NOT re-encoding a pinned reference. The original is never touched,
# never moved and never resized. The derived copy lives in its own `_` folder
# beside the source, carries a JSON sidecar saying exactly how it was made, and
# is re-derived whenever the source or the recipe changes. The manifest records
# the attached path, and the sidecar is the only thing that survives the derive
# being deleted - which it will be, because it is a pixel.

def _needs_derive(src: Path, max_px: int, max_bytes: int) -> bool:
    if src.stat().st_size > max_bytes:
        return True
    try:
        from PIL import Image
        Image.MAX_IMAGE_PIXELS = None
        with Image.open(src) as im:
            return max(im.size) > max_px
    except ImportError:
        return False          # no Pillow: the byte cap is the only test available
    except Exception:
        return False          # not something Pillow reads: attach it as it is


def _has_alpha(im) -> bool:
    return im.mode in ("RGBA", "LA", "PA") or "transparency" in im.info


def _token(src: Path, max_px: int, max_bytes: int) -> str:
    """Identifies the source AND the recipe, so re-editing either one derives
    again instead of quietly reusing a copy made under the old rules."""
    st = src.stat()
    seed = "|".join([str(st.st_size), str(st.st_mtime_ns), str(max_px), str(max_bytes)])
    return hashlib.sha1(seed.encode()).hexdigest()[:10]


def _atomic_write(dest: Path, write) -> None:
    """Write through a private temp file in the destination folder, then
    `os.replace`. Two reasons, both found the hard way on a prior engagement
    running a wave five slots wide:

      1. Every slot of one subject derives the SAME identity file, so five
         threads opened one destination at once and the encode died with
         `OSError: [Errno 22] Invalid argument`, taking the wave with it.
      2. The destination was a cloud-synced mount, where a long streaming write
         of a large file is not reliably atomic and a reader can see a
         half-written image.

    A unique temp plus `os.replace` makes the derive idempotent under
    concurrency: whichever thread finishes last wins, byte-identically, and no
    reader ever sees a partial file."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(suffix=dest.suffix, prefix=".derive-", dir=str(dest.parent))
    os.close(fd)
    try:
        write(tmp)
        os.replace(tmp, dest)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def model_ready(src, cfg: dict | None = None) -> str:
    """An attachable copy of `src`, made once and reused.

    Returns the original untouched when it is already inside `[refs]`
    `model_ready_px` and `model_ready_mb`. Otherwise a derive: the long side
    scaled to the cap with LANCZOS, JPEG quality 90 - or PNG when the source
    carries alpha, because a governed cut-out without its transparency is a
    different attachment and the model will draw the white box."""
    cfg = cfg or config.load()
    src = Path(src)
    max_px = int(cfg["refs"]["model_ready_px"])
    max_bytes = int(float(cfg["refs"]["model_ready_mb"]) * 1_000_000)
    if not _needs_derive(src, max_px, max_bytes):
        return str(src)

    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None

    derived = src.parent / DERIVED_DIRNAME
    with Image.open(src) as probe:
        alpha = _has_alpha(probe)
        original_size = list(probe.size)
    suffix = ".png" if alpha else ".jpg"
    dest = derived / (src.stem + "__mr" + _token(src, max_px, max_bytes) + suffix)
    if dest.exists():
        return str(dest)

    with Image.open(src) as im:
        im.load()
        im = im.convert("RGBA") if alpha else im.convert("RGB")
        if max(im.size) > max_px:
            scale = max_px / max(im.size)
            im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))),
                           Image.LANCZOS)
        recipe = ("Pillow convert " + ("RGBA" if alpha else "RGB")
                  + ", LANCZOS long side to " + str(max_px) + " px, "
                  + ("PNG, alpha preserved" if alpha
                     else "progressive JPEG quality 90, optimized"))
        if alpha:
            _atomic_write(dest, lambda t: im.save(t, "PNG", optimize=True))
        else:
            _atomic_write(dest, lambda t: im.save(t, "JPEG", quality=90, optimize=True,
                                                  progressive=True))
        derived_size = list(im.size)

    sidecar = dest.with_suffix(".json")
    payload = json.dumps({
        "derived_from": str(src),
        "original_size_px": original_size,
        "original_bytes": src.stat().st_size,
        "derived_size_px": derived_size,
        "derived_bytes": dest.stat().st_size,
        "recipe": recipe,
        "caps": {"model_ready_px": max_px, "model_ready_mb": cfg["refs"]["model_ready_mb"]},
        "why": ("the original is larger than the image APIs accept; the original is "
                "untouched and remains the reference of record"),
        "made": "tools/refs.py::model_ready",
        "armada": config.armada_version(),
    }, indent=1)
    _atomic_write(sidecar, lambda t: Path(t).write_text(payload, encoding="utf-8"))
    return str(dest)


# ------------------------------------------------------------------- report ---

def report(cfg: dict | None = None) -> int:
    """Print the index with what is on disk and what is not. Never derives -
    this is the offline check, and it must not write a pixel to answer."""
    cfg = cfg or config.load()
    missing = 0
    print("  drive   " + str(config.drive_root(cfg)))
    print("  source  " + str(config.source_dir(cfg)))
    for key, s in cfg["subjects"].items():
        rel = s.get("identity", "")
        p = config.resolve_asset(rel, cfg) if rel else None
        ok = bool(p and p.exists())
        missing += 0 if ok else 1
        size = ("%7.2f MB" % (p.stat().st_size / 1e6)) if ok else "         "
        print("  " + ("ok  " if ok else "MISS") + " " + key.ljust(16) + size + "  "
              + (p.name if p else "(no identity declared)"))
        for role, drel in sorted((s.get("detail") or {}).items()):
            dp = config.resolve_asset(drel, cfg)
            missing += 0 if dp.exists() else 1
            print("       " + ("ok  " if dp.exists() else "MISS") + " " + role.ljust(14)
                  + dp.name)
        for pkey in sorted(s.get("parts") or {}):
            try:
                n = len(parts(key, pkey, ready=False, cfg=cfg))
            except SystemExit:
                n, missing = 0, missing + 1
            print("       parts " + pkey.ljust(14) + str(n) + " governed cut-outs")
    for akey, arel in sorted((cfg.get("anchors") or {}).items()):
        ap = config.resolve_asset(arel, cfg)
        missing += 0 if ap.exists() else 1
        print("  " + ("ok  " if ap.exists() else "MISS") + " anchor " + akey.ljust(9) + ap.name)
    print("\n  " + str(missing) + " missing")
    return missing


def main() -> None:
    ap = argparse.ArgumentParser(
        description="The reference index over armada.toml. Reports what is on disk.")
    ap.add_argument("--check", action="store_true",
                    help="exit non-zero when a declared reference is missing")
    ap.add_argument("--model-ready", metavar="PATH", default="",
                    help="derive one attachable copy of PATH and print its path")
    a = ap.parse_args()
    if a.model_ready:
        print(model_ready(a.model_ready))
        return
    missing = report()
    if a.check and missing:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
