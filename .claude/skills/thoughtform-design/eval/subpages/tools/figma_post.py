r"""POST image bytes to the single-use upload URLs the design tool hands out.

    python tools/figma_post.py --uploads uploads.json --files files.json [--out result.json]

The design tool's `upload_assets` mints one upload URL per target node, in the order
the node ids were passed. Its JSON reply is saved to `uploads.json` verbatim.
`files.json` is a list, in that same order, of `{"node": "<id>", "file":
"<basename>", "path": "<absolute path>"}` - the rows `figma_prep.py` prints,
plus the node each one goes to. Each URL receives the raw bytes with the
right Content-Type and the upload itself sets the fill on its node.

This exists so the URLs never pass through a transcript by hand and so the
placement step leaves a record beside the images, like a wave's own
`_upload-result.json`: one row per node, ok or not, with the server's reply.

**The upload only PLACES the image when its target node is on the page that is
current in Figma.** Off-page, every POST still returns `success: true` with an
imageHash - the bytes are committed - but the fill is never set and the frames
stay grey. The tell is in the reply: a placed upload carries `placedOnNodeId`
and an unplaced one does not, which is why the whole reply is kept in
`_upload-result.json` rather than a boolean.

So: switch to the target page BEFORE uploading, in the same call that
built it or in one of its own. If it has
already happened, nothing is lost - read the hashes out of the result file and
set the fills directly, which is cheaper than uploading again:

    node.fills = [{type: "IMAGE", scaleMode: "FILL", imageHash: "<hash>"}]
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request

URL_KEYS = ("submitUrl", "submit_url", "uploadUrl", "upload_url", "url")
NODE_KEYS = ("targetNodeId", "target_node_id", "nodeId", "node_id")


def walk(obj):
    """Every dict anywhere inside a JSON value."""
    if isinstance(obj, dict):
        yield obj
        for v in obj.values():
            yield from walk(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk(v)


def upload_entries(reply):
    """The (url, target-node) pairs in the order the server listed them."""
    out = []
    for d in walk(reply):
        url = next((d[k] for k in URL_KEYS if isinstance(d.get(k), str)
                    and d[k].startswith("http")), None)
        if not url:
            continue
        node = next((d[k] for k in NODE_KEYS if isinstance(d.get(k), str)), None)
        out.append((url, node))
    return out


def post(url, path):
    ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
    with open(path, "rb") as f:
        data = f.read()
    req = urllib.request.Request(url, data=data, method="POST",
                                 headers={"Content-Type": ctype,
                                          "Content-Length": str(len(data))})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return True, r.read().decode("utf-8", "replace")[:400]
    except urllib.error.HTTPError as e:
        return False, "HTTP " + str(e.code) + " " + e.read().decode("utf-8", "replace")[:400]
    except (urllib.error.URLError, OSError) as e:
        return False, type(e).__name__ + ": " + str(e)


def main():
    ap = argparse.ArgumentParser(description="POST images to Figma upload URLs.")
    ap.add_argument("--uploads", required=True, help="the upload_assets reply, verbatim")
    ap.add_argument("--files", required=True,
                    help='[{"node": "11:6", "file": "frame-01.jpg", "path": "..."}, ...]')
    ap.add_argument("--out", default=None, help="default: _upload-result.json beside the files")
    a = ap.parse_args()

    with open(a.uploads, encoding="utf-8") as f:
        reply = json.load(f)
    with open(a.files, encoding="utf-8") as f:
        files = json.load(f)

    entries = upload_entries(reply)
    if len(entries) != len(files):
        sys.exit("  " + str(len(entries)) + " upload URLs but " + str(len(files))
                 + " files - the counts must match, in order. Nothing posted.")

    results, ok_n = [], 0
    for (url, target), row in zip(entries, files):
        if target and row.get("node") and target != row["node"]:
            results.append({"node": row["node"], "file": row["file"], "ok": False,
                            "resp": "target mismatch: url is for " + target})
            print("  MISMATCH " + row["node"].ljust(8) + " url targets " + target)
            continue
        ok, resp = post(url, row["path"])
        ok_n += ok
        results.append({"node": row.get("node"), "file": row["file"], "ok": ok, "resp": resp})
        print("  " + ("ok  " if ok else "FAIL") + " " + str(row.get("node")).ljust(8)
              + row["file"].ljust(44) + ("" if ok else resp[:80]))

    out = a.out or os.path.join(os.path.dirname(files[0]["path"]), "_upload-result.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=1, ensure_ascii=False)
    print("\n  " + str(ok_n) + " of " + str(len(files)) + " uploaded   " + out)
    if ok_n != len(files):
        sys.exit(1)


if __name__ == "__main__":
    main()
