"""
comfy — run a ComfyUI graph on a host and bring the result back, unattended.

The lane the owner asked for on 2026-10-01: Claude authors the graph
(`graph.py`), this module uploads its inputs, submits it, waits, downloads the
outputs and writes the record, so nothing is dragged onto a canvas by hand.
One client, two hosts:

  comfy-cloud  https://cloud.comfy.org, header `X-API-Key` (COMFY_API_KEY),
               an RTX 6000 Pro 96 GB; API runs need a paid plan (Standard
               $20/mo covers the SYSTMS graph: its LoRA is in the shared
               library). Endpoints read off the published OpenAPI spec
               (`docs.comfy.org/openapi-cloud.yaml`, 2026-10-01).
  comfy-local  http://127.0.0.1:8188, no auth — kept as a profile for the day
               a local install exists; NOT the lane in use.

Both serve every route under `/api/...`, so the paths below are shared; only
status and outputs differ (Cloud: `/api/job/{id}/status` + `/api/jobs/{id}`;
local: `/api/history/{id}`).

⚠ PAID RUNS ARE THE OWNER'S TO START. `run` prints the graph, the uploads and
an ESTIMATE first (`--dry-run`), refuses over `--max-credits`, and writes the
sidecar BEFORE the first poll, so a dropped connection is `--resume`, never a
second charge. The estimate is paper until the first bill (the same caveat
the fal lane carries); `execution_seconds` lands in the sidecar to correct it.

⚠ THE KEY NEVER RIDES A REDIRECT. `/api/view` answers 302 with a signed URL,
and CPython's redirect handler copies every request header onto the next hop
by default — `X-API-Key` would travel to the storage bucket. `download()`
stops at the 302 and fetches the signed URL with a User-Agent only.

⚠ FREE BEFORE PAID: `models` and the model half of `check` read the PUBLIC
`/api/experiment/models/{folder}` and need no key; `check` with a key also
validates the graph against `/api/object_info` and caches it to
`waves/_comfy/`, so a later `--dry-run` validates offline.

Usage:
  python scripts/voidwalker-avatar/comfy.py selftest
  python scripts/voidwalker-avatar/comfy.py models --grep systms
  python scripts/voidwalker-avatar/comfy.py check  --graph <g.api.json>
  python scripts/voidwalker-avatar/comfy.py nodes TimeSliceEffect
  python scripts/voidwalker-avatar/comfy.py run --graph <g.api.json> --out <dir> --name <run> \\
         --set 1.video=@clip-a.mp4 --set 2.video=@clip-b.mp4 [--set-file 8.text=prompt.txt] --dry-run
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from dataclasses import dataclass
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from graph import MODEL_EXT, Graph  # noqa: E402

CACHE = HERE / "waves" / "_comfy"
UA = "thoughtform-morph-probe/1.0"
#: Comfy Cloud's published API rate for the RTX PRO 6000 (pricing page,
#: 2026-10-01): 957.94 credits an hour for $4.54. ESTIMATES, corrected from
#: the first bill against the sidecar's `execution_seconds`.
CREDITS_PER_GPU_S = 957.94 / 3600
USD_PER_CREDIT = 4.54 / 957.94
#: Model folders the public list is read from, for the free model check.
MODEL_FOLDERS = ("diffusion_models", "loras", "text_encoders", "vae", "checkpoints",
                 "clip", "unet", "upscale_models", "latent_upscale_models")
TERMINAL_OK, TERMINAL_BAD = {"completed", "success"}, {"error", "failed", "cancelled", "lost"}


@dataclass(frozen=True)
class HostProfile:
    name: str
    base: str
    key_name: str | None
    paid: bool
    max_runtime_s: int


HOSTS = {
    "comfy-cloud": HostProfile("comfy-cloud", "https://cloud.comfy.org", "COMFY_API_KEY", True, 1800),
    "comfy-local": HostProfile("comfy-local", "http://127.0.0.1:8188", None, False, 0),
}


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: D401
        return None


class ComfyHost:
    def __init__(self, profile: HostProfile, url: str | None = None):
        self.p = profile
        self.base = (url or profile.base).rstrip("/")

    # ── transport ─────────────────────────────────────────────────────────

    def _key(self) -> str | None:
        if not self.p.key_name:
            return None
        from env import require

        return require(self.p.key_name)

    def _headers(self, auth: bool = True, extra: dict | None = None) -> dict:
        h = {"User-Agent": UA, "Accept": "application/json"}
        if auth and self.p.key_name:
            h["X-API-Key"] = self._key()
        return {**h, **(extra or {})}

    def _scrub(self, text: str) -> str:
        if self.p.key_name:
            from env import load

            k = load().get(self.p.key_name)
            if k:
                text = text.replace(k, f"<{self.p.key_name}>")
        return text

    def request(self, method: str, path: str, body: bytes | None = None, *, auth: bool = True,
                headers: dict | None = None, params: dict | None = None, timeout: int = 120) -> tuple[int, bytes, dict]:
        url = self.base + path + ("?" + urllib.parse.urlencode(params) if params else "")
        req = urllib.request.Request(url, data=body, method=method, headers=self._headers(auth, headers))
        opener = urllib.request.build_opener(_NoRedirect)
        try:
            with opener.open(req, timeout=timeout) as r:
                return r.status, r.read(), dict(r.headers)
        except urllib.error.HTTPError as e:
            return e.code, e.read() or b"", dict(e.headers or {})

    def json(self, method: str, path: str, payload: dict | None = None, **kw) -> dict:
        body = json.dumps(payload).encode() if payload is not None else None
        hdr = {"Content-Type": "application/json"} if body is not None else {}
        code, raw, _ = self.request(method, path, body, headers=hdr, **kw)
        text = raw.decode("utf-8", "replace")
        if code >= 400:
            raise ComfyError(code, path, self._scrub(text[:1500]))
        return json.loads(text) if text.strip() else {}

    # ── endpoints ─────────────────────────────────────────────────────────

    def system_stats(self) -> dict:
        return self.json("GET", "/api/system_stats", auth=False)

    def object_info(self, cache: bool = True) -> dict:
        oi = self.json("GET", "/api/object_info", timeout=300)
        if cache:
            CACHE.mkdir(parents=True, exist_ok=True)
            (CACHE / f"object_info.{self.p.name}.json").write_text(json.dumps(oi), encoding="utf-8")
        return oi

    def cached_object_info(self) -> dict | None:
        p = CACHE / f"object_info.{self.p.name}.json"
        return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None

    def model_list(self, folder: str) -> list[str]:
        try:
            rows = self.json("GET", f"/api/experiment/models/{folder}", auth=False)
        except ComfyError as e:
            if e.status == 404:
                return []
            raise
        return [r["name"] if isinstance(r, dict) else str(r) for r in rows]

    def upload(self, path: Path) -> dict:
        """Upload one input file; returns `{"name", ...}` — the name the graph must use.
        ⚠ Cloud stores inputs by content hash, so the returned name is NOT the
        local filename; never assume it."""
        data = Path(path).read_bytes()
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        body, ctype = multipart({"type": "input", "overwrite": "true"}, {"image": (path.name, data, mime)})
        code, raw, _ = self.request("POST", "/api/upload/image", body, headers={"Content-Type": ctype}, timeout=600)
        if code < 400:
            out = json.loads(raw.decode())
            out["via"] = "upload/image"
            return out
        if not self.p.paid:
            raise ComfyError(code, "/api/upload/image", raw.decode("utf-8", "replace")[:600])
        # Cloud: /upload/image enforces image limits; video and audio are assets.
        body, ctype = multipart({"tags": ["input"], "mime_type": mime, "name": path.name},
                                {"file": (path.name, data, mime)})
        code2, raw2, _ = self.request("POST", "/api/assets", body, headers={"Content-Type": ctype}, timeout=600)
        if code2 >= 400:
            raise ComfyError(code2, "/api/assets", self._scrub(raw2.decode("utf-8", "replace")[:600])
                             + f"\n(upload/image said HTTP {code}: {raw.decode('utf-8', 'replace')[:300]})")
        out = json.loads(raw2.decode())
        out["via"] = "assets"
        return out

    def submit(self, graph_api: dict, client_id: str) -> dict:
        return self.json("POST", "/api/prompt", {"prompt": graph_api, "client_id": client_id})

    def status(self, prompt_id: str) -> tuple[str, dict]:
        """(state, raw): `pending|in_progress|completed|error|cancelled|...`."""
        if self.p.paid:
            raw = self.json("GET", f"/api/job/{prompt_id}/status")
            return str(raw.get("status", "unknown")), raw
        raw = self.json("GET", f"/api/history/{prompt_id}")
        entry = raw.get(prompt_id) or {}
        if not entry:
            return "in_progress", raw
        s = (entry.get("status") or {}).get("status_str", "success")
        return ("completed" if s == "success" else s), raw

    def result(self, prompt_id: str) -> dict:
        """The finished job: `{"outputs": {node: {...}}, ...}`."""
        if self.p.paid:
            return self.json("GET", f"/api/jobs/{prompt_id}")
        return (self.json("GET", f"/api/history/{prompt_id}") or {}).get(prompt_id) or {}

    def download(self, out: dict, dest: Path) -> int:
        params = {"filename": out["filename"], "subfolder": out.get("subfolder", ""), "type": out.get("type", "output")}
        code, raw, hdr = self.request("GET", "/api/view", params=params, timeout=600)
        if code in (301, 302, 303, 307, 308):
            loc = hdr.get("Location") or hdr.get("location")
            # The signed URL carries its own authorisation: User-Agent only.
            with urllib.request.urlopen(urllib.request.Request(loc, headers={"User-Agent": UA}), timeout=600) as r:
                raw = r.read()
        elif code >= 400:
            raise ComfyError(code, "/api/view", raw.decode("utf-8", "replace")[:400])
        dest.write_bytes(raw)
        return len(raw)


class ComfyError(SystemExit):
    """HTTP failure. The status is `.status`: SystemExit owns `.code` (the exit
    value) and overwrites it, so a 404 check once aborted a whole run."""

    def __init__(self, status: int, path: str, text: str):
        super().__init__(f"comfy HTTP {status} on {path}\n{text}")
        self.status = status


# ── helpers ────────────────────────────────────────────────────────────────


def multipart(fields: dict, files: dict) -> tuple[bytes, str]:
    """RFC 7578 by hand (stdlib has none). A list value repeats its field."""
    bnd = "----thoughtform" + uuid.uuid4().hex
    out = bytearray()
    for k, v in fields.items():
        for item in (v if isinstance(v, list) else [v]):
            out += f"--{bnd}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{item}\r\n".encode()
    for k, (fname, data, mime) in files.items():
        out += (f"--{bnd}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{fname}\"\r\n"
                f"Content-Type: {mime}\r\n\r\n").encode()
        out += data + b"\r\n"
    out += f"--{bnd}--\r\n".encode()
    return bytes(out), f"multipart/form-data; boundary={bnd}"


def outputs(result: dict) -> list[dict]:
    """Every file a finished job wrote: [{node, kind, filename, subfolder, type}].
    ⚠ The key varies by node and build (`images`, `gifs` for older VHS,
    `video`/`videos`, `audio`), so all of them are read."""
    rows = []
    for node, out in (result.get("outputs") or {}).items():
        if not isinstance(out, dict):
            continue
        for kind in ("video", "videos", "gifs", "images", "audio"):
            for f in out.get(kind) or []:
                if isinstance(f, dict) and f.get("filename"):
                    rows.append({"node": str(node), "kind": kind, "filename": f["filename"],
                                 "subfolder": f.get("subfolder", ""), "type": f.get("type", "output")})
    return rows


def pick_video(rows: list[dict], prefer_node: str | None = None) -> dict | None:
    vids = [r for r in rows if r["filename"].lower().endswith((".mp4", ".webm", ".mov"))]
    if prefer_node:
        vids = [r for r in vids if r["node"] == prefer_node] or vids
    return vids[0] if vids else None


def estimate(gpu_seconds: float) -> tuple[float, float]:
    credits = gpu_seconds * CREDITS_PER_GPU_S
    return round(credits, 1), round(credits * USD_PER_CREDIT, 3)


def graph_models(g: Graph) -> list[tuple[str, str, str]]:
    return [(nid, k, v) for nid, n in g.nodes.items() for k, v in n.inputs.items()
            if isinstance(v, str) and v.lower().endswith(MODEL_EXT)]


def parse_set(s: str) -> tuple[str, object]:
    path, eq, raw = s.partition("=")
    if not eq:
        raise SystemExit(f"--set wants <node>.<input>=<value>, got {s!r}")
    if raw.startswith("@"):
        return path, Path(raw[1:])  # an upload, resolved at run time
    try:
        return path, json.loads(raw)
    except json.JSONDecodeError:
        return path, raw


# ── commands ───────────────────────────────────────────────────────────────


def cmd_models(args) -> int:
    host = ComfyHost(HOSTS[args.host], args.url)
    folders = [args.folder] if args.folder else list(MODEL_FOLDERS)
    for f in folders:
        names = host.model_list(f)
        hits = [n for n in names if not args.grep or args.grep.lower() in n.lower()]
        print(f"{f}: {len(names)} files" + (f", {len(hits)} match {args.grep!r}" if args.grep else ""))
        for n in hits[: args.limit]:
            print(f"   {n}")
    return 0


def cmd_check(args) -> int:
    """Free: reachability, the model files the graph names against the host's
    public lists, and (with a key) a full validation against object_info."""
    host = ComfyHost(HOSTS[args.host], args.url)
    print(f"host: {host.p.name} {host.base}")
    try:
        st = host.system_stats().get("system", {})
        print(f"  reachable  comfyui {st.get('comfyui_version', '?')}  cloud {st.get('cloud_version', '-')}")
    except Exception as e:  # noqa: BLE001
        print(f"  UNREACHABLE: {e}")
        return 2
    g = Graph.load(Path(args.graph)) if args.graph else None
    rc = 0
    if g is not None:
        print(f"graph: {args.graph}  ({len(g.nodes)} nodes, sha256 {g.sha256()[:16]})")
        listed: set[str] = set()
        for f in MODEL_FOLDERS:
            listed |= set(host.model_list(f))
        for nid, k, v in graph_models(g):
            ok = v in listed
            rc |= 0 if ok else 1
            print(f"  {'listed ' if ok else 'MISSING'} {nid}.{k} = {v}")
    if host.p.key_name:
        from env import describe, env_path

        print(f"env: {env_path()}\n{describe([host.p.key_name])}")
        from env import load

        if not load().get(host.p.key_name):
            print("  (no key: object_info validation skipped — the model check above is the free half)")
            return rc
    oi = host.object_info()
    print(f"  object_info: {len(oi)} node classes (cached to {CACHE / ('object_info.' + host.p.name + '.json')})")
    if g is not None:
        probs = g.validate(oi)
        for p in probs:
            print(f"  {p}")
        rc |= 1 if any(p.startswith("error:") for p in probs) else 0
        print("  validate: " + ("clean" if not probs else f"{len(probs)} findings"))
    return rc


def cmd_nodes(args) -> int:
    host = ComfyHost(HOSTS[args.host], args.url)
    oi = host.cached_object_info() or host.object_info()
    for cls in args.classes:
        spec = oi.get(cls)
        if not spec:
            near = [k for k in oi if cls.lower() in k.lower()][:12]
            print(f"{cls}: not on this host. Near: {', '.join(near) or '-'}")
            continue
        print(json.dumps({"input": spec.get("input"), "output": spec.get("output"),
                          "output_name": spec.get("output_name")}, indent=2)[:6000])
    return 0


def run_graph(host: ComfyHost, g: Graph, sets: list[tuple[str, object]], out_dir: Path, name: str, *,
              dry_run: bool, resume: bool, max_credits: float, est_seconds: float,
              prefer_node: str | None = None, extra: dict | None = None) -> dict | None:
    """Upload, submit, record, wait, download. Returns the sidecar, or None on a dry run."""
    out_dir.mkdir(parents=True, exist_ok=True)
    side = out_dir / f"{name}.json"
    credits, usd = estimate(est_seconds)
    uploads = {p: v for p, v in sets if isinstance(v, Path)}
    for p, v in sets:
        if not isinstance(v, Path):
            g.set(p, v)
    oi = host.cached_object_info()
    print(f"\n== {name}  on {host.p.name}  est {credits} credits ~ ${usd} ({est_seconds:.0f} GPU-s, an ESTIMATE)")
    for p, f in uploads.items():
        print(f"   upload {f.name} ({f.stat().st_size} bytes) -> {p}")
    if oi:
        # An input that will be uploaded still holds the seed's old name here,
        # which the host cannot list yet: its finding is expected, not news.
        pending = [(p.split(".")[0], p.split(".")[1]) for p in uploads]
        probs = [x for x in g.validate(oi)
                 if not any(f"{nid} (" in x and f").{inp}:" in x for nid, inp in pending)]
        for x in probs:
            print(f"   {x}")
    else:
        print("   (no cached object_info: run `comfy.py check` once to validate offline)")
    if dry_run:
        print(json.dumps(g.redacted(), indent=2)[:12000])
        return None
    if host.p.paid and credits > max_credits:
        raise SystemExit(f"estimate {credits} credits is over --max-credits {max_credits}; nothing sent")

    if side.exists() and not resume:
        raise SystemExit(f"{side.name} exists: pass --resume to collect it, or delete it to re-submit (a second charge)")
    if side.exists():
        rec = json.loads(side.read_text(encoding="utf-8"))
    else:
        up_rec = {}
        for p, f in uploads.items():
            r = host.upload(f)
            g.set(p, r["name"])
            up_rec[f.name] = {"input": p, "remote": r["name"], "via": r.get("via"), "bytes": f.stat().st_size}
            print(f"   uploaded {f.name} -> {r['name']} ({r.get('via')})")
        gpath = out_dir / f"{name}.graph.api.json"
        sha = g.save(gpath)
        cid = str(uuid.uuid4())
        resp = host.submit(g.to_api(), cid)
        pid = resp.get("prompt_id")
        if not pid:
            raise SystemExit(f"no prompt_id: {json.dumps(resp)[:800]}")
        rec = {"run": name, "host": host.p.name, "endpoint": host.base + "/api/prompt", "request_id": pid,
               "client_id": cid, "graph": gpath.name, "graph_sha256": sha, "uploads": up_rec,
               "node_errors": resp.get("node_errors") or {}, "estimated_credits": credits,
               "estimated_cost_usd": usd, "submitted_at": time.strftime("%Y-%m-%dT%H:%M:%S"), **(extra or {})}
        side.write_text(json.dumps(rec, indent=2), encoding="utf-8")  # BEFORE the first poll
        print(f"   submitted {pid}")

    t0, wait, last, seen = time.time(), 5.0, "", []
    cap = (host.p.max_runtime_s + 600) if host.p.max_runtime_s else 4 * 3600
    while True:
        state, raw = host.status(rec["request_id"])
        if state != last:
            print(f"   {state}")
            seen.append(state)
            last = state
        if state in TERMINAL_OK:
            break
        if state in TERMINAL_BAD:
            rec.update(statuses=seen, status_raw=raw)
            side.write_text(json.dumps(rec, indent=2), encoding="utf-8")
            raise SystemExit(f"job {state}: {host._scrub(json.dumps(raw)[:1200])}\n(not re-submitted)")
        if time.time() - t0 > cap:
            raise SystemExit("still running past the host's cap — `--resume` later to collect it")
        time.sleep(wait)
        wait = min(30.0, wait * 1.5)

    res = host.result(rec["request_id"])
    rows = outputs(res)
    files = []
    for r in rows:
        dest = out_dir / f"{name}.{r['node']}.{r['filename']}"
        n = host.download(r, dest)
        files.append({**r, "local": dest.name, "bytes": n})
    vid = pick_video(files, prefer_node)
    primary = None
    if vid:
        primary = out_dir / f"{name}.mp4"
        primary.write_bytes((out_dir / vid["local"]).read_bytes())
    es = res.get("execution_status") or {}
    rec.update(statuses=seen, outputs=files, primary=primary.name if primary else None,
               result_status=res.get("status"), execution_status=es,
               wall_seconds=round(time.time() - t0, 1), completed_at=time.strftime("%Y-%m-%dT%H:%M:%S"))
    side.write_text(json.dumps(rec, indent=2), encoding="utf-8")
    with (out_dir / "MANIFEST.jsonl").open("a", encoding="utf-8") as m:
        m.write(json.dumps({k: rec.get(k) for k in ("run", "host", "request_id", "estimated_credits",
                                                     "primary", "wall_seconds", "completed_at")}) + "\n")
    print(f"   done: {len(files)} file(s); primary {rec['primary']}")
    return rec


def cmd_run(args) -> int:
    host = ComfyHost(HOSTS[args.host], args.url)
    g = Graph.load(Path(args.graph))
    sets = [parse_set(s) for s in args.set]
    for s in args.set_file:
        path, _, f = s.partition("=")
        sets.append((path, Path(f).read_text(encoding="utf-8").strip()))
    run_graph(host, g, sets, Path(args.out), args.name, dry_run=args.dry_run, resume=args.resume,
              max_credits=args.max_credits, est_seconds=args.est_seconds, prefer_node=args.prefer_node)
    return 0


# ── self-test (offline) ────────────────────────────────────────────────────


def selftest() -> int:
    body, ctype = multipart({"type": "input", "tags": ["input", "x"]}, {"image": ("a.mp4", b"\x00\x01", "video/mp4")})
    assert ctype.startswith("multipart/form-data; boundary=")
    bnd = ctype.split("=", 1)[1]
    assert body.count(b'name="tags"') == 2 and body.endswith(f"--{bnd}--\r\n".encode())
    assert b'filename="a.mp4"' in body and b"\x00\x01\r\n" in body
    res = {"outputs": {"26": {"gifs": [{"filename": "SYSTMS_FLW_00001.mp4", "subfolder": "", "type": "output"},
                                       {"filename": "SYSTMS_FLW_00001.png", "type": "output"}]},
                       "9": {"images": [{"filename": "x.png"}]}, "12": {"video": [{"filename": "y.mp4"}]}}}
    rows = outputs(res)
    assert len(rows) == 4 and pick_video(rows, "26")["filename"] == "SYSTMS_FLW_00001.mp4"
    assert pick_video(rows, "99")["filename"] in ("SYSTMS_FLW_00001.mp4", "y.mp4")
    c, u = estimate(180)
    assert 40 < c < 60 and 0.15 < u < 0.35, (c, u)
    assert parse_set("8.text=hello world") == ("8.text", "hello world")
    assert parse_set("18.noise_seed=42") == ("18.noise_seed", 42)
    assert parse_set("69.video=@x.mp4") == ("69.video", Path("x.mp4"))

    # The redirect guard: a 302 must stop at the opener, never be followed.
    import http.server
    import threading

    class H(http.server.BaseHTTPRequestHandler):
        seen_key = []

        def do_GET(self):  # noqa: N802
            H.seen_key.append(self.headers.get("X-API-Key"))
            if self.path.startswith("/api/view"):
                self.send_response(302)
                self.send_header("Location", f"http://127.0.0.1:{self.server.server_port}/signed?sig=1")
                self.end_headers()
            else:
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"PIXELS")

        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(("127.0.0.1", 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    prof = HostProfile("test", f"http://127.0.0.1:{srv.server_port}", None, False, 0)
    host = ComfyHost(prof)
    host._headers = lambda auth=True, extra=None: {"User-Agent": UA, "X-API-Key": "SECRET", **(extra or {})}
    tmp = CACHE / "_selftest.bin"
    CACHE.mkdir(parents=True, exist_ok=True)
    n = host.download({"filename": "a.mp4"}, tmp)
    srv.shutdown()
    assert n == 6 and tmp.read_bytes() == b"PIXELS"
    assert H.seen_key == ["SECRET", None], H.seen_key  # the signed hop carried no key
    tmp.unlink()
    print("comfy selftest: ok")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("selftest")

    def host_args(p):
        p.add_argument("--host", choices=sorted(HOSTS), default="comfy-cloud")
        p.add_argument("--url", help="override the host's base URL")

    m = sub.add_parser("models")
    host_args(m)
    m.add_argument("--folder")
    m.add_argument("--grep")
    m.add_argument("--limit", type=int, default=60)
    c = sub.add_parser("check")
    host_args(c)
    c.add_argument("--graph")
    n = sub.add_parser("nodes")
    host_args(n)
    n.add_argument("classes", nargs="+")
    r = sub.add_parser("run")
    host_args(r)
    r.add_argument("--graph", required=True)
    r.add_argument("--out", required=True)
    r.add_argument("--name", required=True)
    r.add_argument("--set", action="append", default=[], help="<node>.<input>=<value>; @file uploads it")
    r.add_argument("--set-file", action="append", default=[], help="<node>.<input>=<text file>")
    r.add_argument("--dry-run", action="store_true")
    r.add_argument("--resume", action="store_true")
    r.add_argument("--max-credits", type=float, default=150.0)
    r.add_argument("--est-seconds", type=float, default=180.0)
    r.add_argument("--prefer-node")
    args = ap.parse_args()
    if args.cmd == "selftest":
        return selftest()
    return {"models": cmd_models, "check": cmd_check, "nodes": cmd_nodes, "run": cmd_run}[args.cmd](args)


if __name__ == "__main__":
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    raise SystemExit(main())
