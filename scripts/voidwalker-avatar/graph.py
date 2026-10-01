"""
graph — a ComfyUI graph in API format, built, patched and CHECKED in Python.

The owner's ask (2026-10-01): ComfyUI graphs authored and run by Claude, no
hand-prompting. A ComfyUI workflow has two JSON shapes and only one of them
can be submitted:

  * UI format — `nodes[]`, `links[]`, positional `widgets_values`: what the
    editor saves and what `morph.comfy_kit` patches for a human to drag in;
  * API format — `{"<id>": {"class_type", "inputs": {name: value | [id, out]}}}`:
    what `POST /prompt` takes. This module builds and edits that one.

⚠ A GRAPH IS CHECKED AGAINST THE SERVER IT WILL RUN ON, NEVER AGAINST MEMORY.
Every ComfyUI server publishes each node's input schema at `/object_info`;
`validate()` walks a graph against it (class exists, required inputs present,
link types match, enum values listed, numbers in range) so a renamed input or
a model file the host does not have fails HERE, free, instead of on a paid
GPU. `models()` lists every model file the graph names and whether the host
lists it — the question that decided the plan tier on 2026-10-01 (Comfy
Cloud's library holds FLW as `SYSTMS_FLW_V1_LTX23.safetensors`, not under the
author's imported name).

⚠ NO UI -> API CONVERTER. The editor's File -> Export (API) is the one
conversion, done once per shipped workflow and committed as a SEED
(`SYSTMS_FLW_LTX23_WF.api.json`). A converter would have to re-implement
widget order, `control_after_generate`, muted nodes and dict-shaped VHS
widgets, which are exactly the parts that drift; `validate()` against the
host is the drift guard instead.

Usage:
  python scripts/voidwalker-avatar/graph.py --selftest
"""

from __future__ import annotations

import copy
import hashlib
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, NamedTuple

HERE = Path(__file__).resolve().parent
FLW_SEED = HERE / "SYSTMS_FLW_LTX23_WF.api.json"
MODEL_EXT = (".safetensors", ".gguf", ".ckpt", ".pt", ".pth", ".bin", ".sft")


class Ref(NamedTuple):
    """A link: output `out` of node `node`. Serialises as `["node", out]`."""

    node: str
    out: int = 0


@dataclass
class Node:
    class_type: str
    inputs: dict[str, Any] = field(default_factory=dict)
    title: str | None = None


def _is_link(v: Any) -> bool:
    return (isinstance(v, (list, tuple)) and len(v) == 2 and isinstance(v[0], str)
            and isinstance(v[1], int) and not isinstance(v[1], bool))


class Graph:
    """An API-format graph. Node ids are strings, as the API wants them."""

    def __init__(self) -> None:
        self.nodes: dict[str, Node] = {}

    # ── construction ──────────────────────────────────────────────────────

    @classmethod
    def from_api(cls, data: dict) -> "Graph":
        g = cls()
        for nid, n in data.items():
            if not isinstance(n, dict) or "class_type" not in n:
                raise ValueError(f"node {nid!r} is not an API-format node (no class_type)")
            ins = {k: (Ref(v[0], v[1]) if _is_link(v) else v) for k, v in (n.get("inputs") or {}).items()}
            g.nodes[str(nid)] = Node(n["class_type"], ins, (n.get("_meta") or {}).get("title"))
        return g

    @classmethod
    def load(cls, path: Path) -> "Graph":
        return cls.from_api(json.loads(Path(path).read_text(encoding="utf-8")))

    def _next_id(self) -> str:
        nums = [int(k) for k in self.nodes if k.isdigit()]
        return str(max(nums, default=0) + 1)

    def add(self, class_type: str, _id: str | None = None, _title: str | None = None, **inputs) -> Ref:
        """Add a node; returns a Ref to its output 0 (index others as `Ref(r.node, i)`)."""
        nid = str(_id) if _id is not None else self._next_id()
        if nid in self.nodes:
            raise ValueError(f"node id {nid} already exists")
        self.nodes[nid] = Node(class_type, dict(inputs), _title)
        return Ref(nid)

    def __getitem__(self, nid: str | int) -> Node:
        return self.nodes[str(nid)]

    def __contains__(self, nid: str | int) -> bool:
        return str(nid) in self.nodes

    def set(self, path: str, value: Any) -> None:
        """`g.set("69.video", "a.mp4")` — the CLI's `--set` form."""
        nid, _, name = path.partition(".")
        if not name:
            raise ValueError(f"--set wants <node>.<input>=<value>, got {path!r}")
        if nid not in self.nodes:
            raise KeyError(f"no node {nid} in the graph")
        self.nodes[nid].inputs[name] = value

    def swap_class(self, nid: str | int, class_type: str, **inputs) -> None:
        """Replace a node's class in place, keeping its id and every link INTO it."""
        n = self[nid]
        links = {k: v for k, v in n.inputs.items() if isinstance(v, Ref)}
        self.nodes[str(nid)] = Node(class_type, {**links, **inputs}, n.title)

    def drop(self, *ids: str | int) -> None:
        gone = {str(i) for i in ids}
        for nid, n in self.nodes.items():
            if nid in gone:
                continue
            for k, v in n.inputs.items():
                if isinstance(v, Ref) and v.node in gone:
                    raise ValueError(f"cannot drop {v.node}: node {nid}.{k} still reads it")
        for i in gone:
            self.nodes.pop(i, None)

    def copy(self) -> "Graph":
        return copy.deepcopy(self)

    # ── serialisation ─────────────────────────────────────────────────────

    def to_api(self) -> dict:
        out = {}
        for nid in sorted(self.nodes, key=lambda k: (not k.isdigit(), int(k) if k.isdigit() else 0, k)):
            n = self.nodes[nid]
            ins = {k: ([v.node, v.out] if isinstance(v, Ref) else v) for k, v in n.inputs.items()}
            entry = {"class_type": n.class_type, "inputs": ins}
            if n.title:
                entry["_meta"] = {"title": n.title}
            out[nid] = entry
        return out

    def sha256(self) -> str:
        blob = json.dumps(self.to_api(), sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        return hashlib.sha256(blob.encode("utf-8")).hexdigest()

    def redacted(self, max_str: int = 96) -> dict:
        """For printing: long strings (prompts) are cut, with a hash to tell them apart."""
        api = self.to_api()
        for n in api.values():
            for k, v in n["inputs"].items():
                if isinstance(v, str) and len(v) > max_str:
                    h = hashlib.sha1(v.encode()).hexdigest()[:12]
                    n["inputs"][k] = f"{v[:max_str]} ...({len(v)} chars, sha1 {h})"
        return api

    def save(self, path: Path) -> str:
        Path(path).write_text(json.dumps(self.to_api(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        return self.sha256()

    # ── checks against a host ─────────────────────────────────────────────

    def validate(self, object_info: dict) -> list[str]:
        """Problems, each prefixed `error:` or `warn:`. An empty list is clean."""
        probs: list[str] = []
        for nid, n in self.nodes.items():
            spec = object_info.get(n.class_type)
            where = f"{nid} ({n.class_type})"
            if spec is None:
                probs.append(f"error: {where}: class not installed on this host")
                continue
            sections = spec.get("input") or {}
            req = sections.get("required") or {}
            opt = sections.get("optional") or {}
            hidden = sections.get("hidden") or {}
            for name in req:
                if name not in n.inputs:
                    probs.append(f"error: {where}: required input {name!r} missing")
            for name, val in n.inputs.items():
                ispec = req.get(name) or opt.get(name)
                if ispec is None:
                    if name not in hidden:
                        probs.append(f"warn: {where}: input {name!r} is not declared by the class")
                    continue
                probs += _check_value(self, where, name, val, ispec, object_info)
        return probs

    def models(self, object_info: dict) -> list[tuple[str, str, str, bool]]:
        """(node, input, filename, listed-on-host) for every model file the graph names."""
        rows = []
        for nid, n in self.nodes.items():
            spec = object_info.get(n.class_type) or {}
            sections = spec.get("input") or {}
            for name, val in n.inputs.items():
                if not (isinstance(val, str) and val.lower().endswith(MODEL_EXT)):
                    continue
                ispec = (sections.get("required") or {}).get(name) or (sections.get("optional") or {}).get(name)
                options = _enum(ispec)
                rows.append((nid, name, val, options is not None and val in options))
        return rows


def _enum(ispec: Any) -> list | None:
    """The allowed values of an enum input, in either schema dialect, else None."""
    if not isinstance(ispec, (list, tuple)) or not ispec:
        return None
    head = ispec[0]
    if isinstance(head, list):
        return head
    if head == "COMBO" and len(ispec) > 1 and isinstance(ispec[1], dict):
        return list(ispec[1].get("options") or [])
    return None


def _check_value(g: Graph, where: str, name: str, val: Any, ispec: Any, oi: dict) -> list[str]:
    probs: list[str] = []
    head = ispec[0] if isinstance(ispec, (list, tuple)) and ispec else ispec
    opts = ispec[1] if isinstance(ispec, (list, tuple)) and len(ispec) > 1 and isinstance(ispec[1], dict) else {}
    if isinstance(val, Ref):
        src = g.nodes.get(val.node)
        if src is None:
            return [f"error: {where}.{name}: links to node {val.node}, which does not exist"]
        outs = (oi.get(src.class_type) or {}).get("output") or []
        if src.class_type in oi and val.out >= len(outs):
            return [f"error: {where}.{name}: node {val.node} has no output {val.out}"]
        if outs and isinstance(head, str) and head not in ("*", "COMBO"):
            got = outs[val.out]
            got_types = set(str(got).split(",")) if isinstance(got, str) else set()
            if got_types and "*" not in got_types and head not in got_types:
                probs.append(f"error: {where}.{name}: wants {head}, node {val.node} gives {got}")
        return probs
    options = _enum(ispec)
    if options is not None:
        if val not in options:
            shown = ", ".join(map(str, options[:6])) + (" ..." if len(options) > 6 else "")
            probs.append(f"error: {where}.{name}: {val!r} is not listed on this host ({shown})")
        return probs
    if head in ("INT", "FLOAT"):
        if isinstance(val, bool) or not isinstance(val, (int, float)):
            return [f"error: {where}.{name}: wants {head}, got {val!r}"]
        lo, hi = opts.get("min"), opts.get("max")
        if lo is not None and val < lo or hi is not None and val > hi:
            probs.append(f"error: {where}.{name}: {val} outside [{lo}, {hi}]")
    elif head == "BOOLEAN" and not isinstance(val, bool):
        probs.append(f"error: {where}.{name}: wants BOOLEAN, got {val!r}")
    elif head == "STRING" and not isinstance(val, str):
        probs.append(f"error: {where}.{name}: wants STRING, got {val!r}")
    elif isinstance(head, str) and head.isupper() and head not in ("INT", "FLOAT", "BOOLEAN", "STRING", "COMBO"):
        # A typed socket (IMAGE, MODEL, ...) given a literal: only a link can fill it.
        probs.append(f"error: {where}.{name}: {head} must be a link, got a literal")
    return probs


# ── the FLW seed ───────────────────────────────────────────────────────────

#: The author's settings the kit promises not to move, by node id. ⚠ Read off
#: `SYSTMS_FLW_LTX23_WF.json` (frontend 1.43.16) on 2026-10-01; the API export
#: names the widgets, and these are the names its UI widgets carry.
FLW_CLASS = {"1": "DiffusionModelLoaderKJ", "4": "LoraLoaderModelOnly", "8": "CLIPTextEncode",
             "9": "CLIPTextEncode", "13": "LTXVAddGuide", "18": "RandomNoise", "19": "CFGGuider",
             "20": "KSamplerSelect", "21": "BasicScheduler", "26": "VHS_VideoCombine",
             "33": "DualCLIPLoader", "49": "LoraLoaderModelOnly", "69": "VHS_LoadVideo",
             "70": "VHS_LoadVideo", "71": "WanVideoVACEStartToEndFrame", "81": "ImageResizeKJv2",
             "96": "LoadAudio"}
FLW_ASSERT = {"13": {"frame_idx": 0, "strength": 1}, "19": {"cfg": 1},
              "20": {"sampler_name": "euler_ancestral_cfg_pp"},
              "21": {"scheduler": "linear_quadratic", "steps": 8, "denoise": 1},
              "4": {"strength_model": 0.5}, "49": {"strength_model": 1}}
#: ⚠ THE LIBRARY NAME, NOT THE AUTHOR'S. The shipped graph asks for
#: `systms__SYSTMS-FLW-IC-LORA-LTX-23__SYSTMS_FLW_V1_LTX23.safetensors` (an
#: imported-LoRA name on the author's account); Comfy Cloud's shared library
#: lists it as this, measured on its public `/api/experiment/models/loras`.
FLW_LORA = "SYSTMS_FLW_V1_LTX23.safetensors"


def load_seed(path: Path = FLW_SEED) -> Graph:
    if not path.exists():
        raise SystemExit(
            f"{path.name} is missing. It is the one-time API export of the SYSTMS graph:\n"
            "  open the kit's SYSTMS_FLW_LTX23_WF.morph.json in the Comfy Cloud editor,\n"
            "  File -> Export (API), and save the file here (kits/README.md, step 5)."
        )
    g = Graph.load(path)
    problems = flw_selftest(g)
    if problems:
        raise SystemExit("the FLW seed is not the graph this lane was written for:\n  " + "\n  ".join(problems))
    return g


def flw_selftest(g: Graph) -> list[str]:
    probs = []
    for nid, cls in FLW_CLASS.items():
        if nid not in g:
            probs.append(f"node {nid} ({cls}) is missing")
        elif g[nid].class_type != cls:
            probs.append(f"node {nid} is {g[nid].class_type}, expected {cls}")
    for nid, want in FLW_ASSERT.items():
        if nid not in g:
            continue
        for k, v in want.items():
            got = g[nid].inputs.get(k)
            if got is not None and got != v:
                probs.append(f"node {nid}.{k} is {got!r}, the author ships {v!r}")
    return probs


def flw_graph(seed: Graph, *, shot_a: str, shot_b: str, audio: str, prompt: str, seed_int: int,
              width: int, prefix: str, frames_per_shot: int = 25, total_frames: int | None = None,
              lora: str = FLW_LORA, lora_strength: float | None = None) -> Graph:
    """The seed patched to one run. ⚠ Only the inputs, the prompt, the seed, the
    output name, the width and the LoRA's library name move; the sampler, the
    guide node and `LTXVAddGuide` stay the author's."""
    g = seed.copy()
    for nid, name in (("69", shot_a), ("70", shot_b)):
        ins = g[nid].inputs
        ins.update(video=name, skip_first_frames=0, frame_load_cap=frames_per_shot, force_rate=0)
    g["96"].inputs["audio"] = audio
    g["8"].inputs["text"] = prompt
    g["18"].inputs["noise_seed"] = int(seed_int)
    g["81"].inputs.update(width=int(width), height=0)
    g["26"].inputs["filename_prefix"] = prefix
    g["49"].inputs["lora_name"] = lora
    if lora_strength is not None:
        g["49"].inputs["strength_model"] = float(lora_strength)
    if total_frames is not None:
        g["71"].inputs["num_frames"] = int(total_frames)
    for nid in [k for k, n in g.nodes.items() if n.class_type in ("GeminiNode", "Note")]:
        try:
            g.drop(nid)
        except ValueError:
            pass
    return g


# ── self-test (offline) ────────────────────────────────────────────────────


def _selftest() -> int:
    oi = {
        "LoadThing": {"input": {"required": {"name": [["a.safetensors", "b.safetensors"]],
                                             "n": ["INT", {"min": 1, "max": 10}]}},
                      "output": ["MODEL"]},
        "UseThing": {"input": {"required": {"model": ["MODEL"], "mode": ["COMBO", {"options": ["x", "y"]}]},
                               "optional": {"flag": ["BOOLEAN", {}]}}, "output": ["IMAGE"]},
        "Save": {"input": {"required": {"images": ["IMAGE"], "prefix": ["STRING", {}]}}, "output": []},
    }
    g = Graph()
    m = g.add("LoadThing", name="a.safetensors", n=3)
    u = g.add("UseThing", model=m, mode="x")
    g.add("Save", images=u, prefix="out")
    assert g.validate(oi) == [], g.validate(oi)
    assert g.models(oi) == [("1", "name", "a.safetensors", True)]
    rt = Graph.from_api(json.loads(json.dumps(g.to_api())))
    assert rt.to_api() == g.to_api() and rt.sha256() == g.sha256()
    assert isinstance(rt["2"].inputs["model"], Ref)

    bad = g.copy()
    bad.set("1.name", "c.safetensors")
    bad.set("1.n", 40)
    bad.set("2.mode", "z")
    bad["3"].inputs["images"] = Ref("1")          # MODEL into IMAGE
    bad["2"].inputs.pop("model")                  # required missing
    bad.add("Missing", x=1)
    errs = [p for p in bad.validate(oi) if p.startswith("error:")]
    for want in ("not listed", "outside", "'z' is not listed", "wants IMAGE", "required input 'model'", "class not installed"):
        assert any(want in e for e in errs), (want, errs)
    assert bad.models(oi)[0][3] is False

    try:
        g.drop("1")
        raise AssertionError("drop of a referenced node must refuse")
    except ValueError:
        pass
    g.swap_class("1", "LoadThing", name="b.safetensors", n=2)
    assert g["2"].inputs["model"] == Ref("1") and g["1"].inputs["name"] == "b.safetensors"
    long = Graph()
    long.add("Save", images=Ref("9"), prefix="x" * 300)
    assert "chars, sha1" in long.redacted()["1"]["inputs"]["prefix"]

    if FLW_SEED.exists():
        probs = flw_selftest(Graph.load(FLW_SEED))
        print("FLW seed:", "ok" if not probs else probs)
    else:
        print(f"FLW seed: {FLW_SEED.name} not exported yet (kits/README.md step 5)")
    print("graph selftest: ok")
    return 0


if __name__ == "__main__":
    import sys

    if "--selftest" in sys.argv:
        raise SystemExit(_selftest())
    print(__doc__)
