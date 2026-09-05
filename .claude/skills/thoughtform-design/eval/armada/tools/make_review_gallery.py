r"""The review page. One self-contained HTML file, opened from disk, verdicted.

    python tools/make_review_gallery.py "<wave dir>"
    python tools/make_review_gallery.py "<wave dir>" --out delivery/review.html

Grouped by image type, worst verdict first inside each group so nothing hides
at the bottom of a group of passes. Each card carries the candidate, its
verdict, every failed check in the rubric's own wording, what a stranger called
it, and the slot, subject and setting the manifest recorded — so a reviewer
argues with the picture and not with the pipeline.

Click a candidate for a lightbox that puts it beside its comparison image: the
identity reference for that subject when `refs.identity` can resolve one, else
the first reference the manifest says was attached, else nothing. Arrow keys
walk the wave; Escape closes.

Green tick approves. Typing a comment means redo, and the comment is the
calibration data — it is the sentence that becomes a rubric row, so it is worth
more than the tick. A card with a comment cannot also be approved; the page
says so rather than writing a contradiction into the file.

Submit downloads `verdicts-<date>.json`:

    {wave, date, verdicts: {<file>: {approved: bool, comment: str}}}

That handback is the persistence. The page keeps no hidden state, writes to no
server, and needs none: it is a file, mailed or dropped in a folder, and the
next session reads it back.

Every picture is a base64 data URI so the page opens on `file://` with no
server and no CDN. They are DISPLAY copies downscaled to 1200 px and
re-encoded, which is fine **here and only here**: a person is looking at them.
Nowhere a model reads the pixels may an image be re-encoded — identity
references and the masters a crop comes from are byte-preserved, because a
silent resize changes what the model draws months later with no error to warn
anyone.

Never hand over loose files.
"""
from __future__ import annotations

import argparse
import base64
import html
import io
import json
import os
import re
import sys
from datetime import date

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config  # noqa: E402

try:                       # refs is optional: without it the comparison image
    import refs            # falls back to the manifest, which is still true.
except Exception:          # noqa: BLE001
    refs = None

Image.MAX_IMAGE_PIXELS = None
MAX_DISPLAY_PX = 1200
MAX_REF_PX = 1000

VERDICT_CLASS = {"PASS": "v-pass", "PASS_WITH_NOTES": "v-notes", "RETRY": "v-retry",
                 "FAIL": "v-fail", "ERROR": "v-error", "SKIPPED": "v-error"}

# Worst first. Same ladder as `config.VERDICT_RANK`, ascending, with one thing
# the contract cannot say: an unknown or absent verdict sits above FAIL and
# below RETRY. An unknown verdict that sorted below an explicit FAIL once put
# ungraded frames at the top of a client's page as if they were the failures.
UNGRADED_RANK = config.VERDICT_RANK["FAIL"] + 0.5


def rank(verdict: str) -> float:
    return config.VERDICT_RANK.get(verdict or "", UNGRADED_RANK)


def embed(path: str, max_px: int = MAX_DISPLAY_PX, quality: int = 80) -> str:
    """A display copy as a data URI. Re-encoding is fine here; see the header."""
    with Image.open(path) as im:
        im = im.convert("RGB")
        if max(im.size) > max_px:
            scale = max_px / max(im.size)
            im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))),
                           Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=quality, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def subject_of(name: str, rec: dict, row: dict) -> str:
    """The subject this draw is about: the grade says so, else the manifest,
    else the filename grammar."""
    meta = row.get("meta") or {}
    return (rec.get("subject") or meta.get("subject")
            or (config.split_slot(config.slot_of(name))[1]
                if "-" in config.slot_of(name) else ""))


def comparison(name: str, rec: dict, row: dict, cfg: dict):
    """(path, label) for the picture the candidate is judged against.

    The identity reference first — it is what the A block grades against. If
    `refs` cannot resolve one (no refs.py yet, no such subject, missing file),
    the first reference the manifest recorded is the honest second choice: it
    is what was actually attached to this draw. Failing both, no comparison —
    an empty frame beside the candidate says less than nothing."""
    subject = subject_of(name, rec, row)
    if refs is not None and subject:
        try:
            # The original, not a model-ready derive: a review page displays, it
            # does not attach, and it has no business writing derives into the
            # source tree as a side effect of being opened.
            try:
                p = refs.identity(subject, ready=False)
            except TypeError:
                p = refs.identity(subject)
        except (SystemExit, Exception):        # noqa: BLE001 - refs decides, we do not
            p = None
        if p and os.path.exists(str(p)):
            noun = (cfg["subjects"].get(subject) or {}).get("noun") or subject
            return str(p), "the real " + noun
    for p in (row.get("references") or []):
        if p and os.path.exists(str(p)):
            return str(p), "reference: " + os.path.basename(str(p))
    return None, ""


CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{background:#16181b;color:#e9e7e2;font:15px/1.45 -apple-system,'Segoe UI',Roboto,sans-serif;padding:26px 20px 100px}
h1{font-size:22px;font-weight:600}
h2{font-size:15px;font-weight:600;color:#c9c6bf;margin:26px auto 10px;max-width:1180px;
   border-top:1px solid #2a2e34;padding-top:14px;letter-spacing:.02em}
h2 span{color:#8c8981;font-weight:400}
.sub{color:#96938c;font-size:13px;margin:6px auto 8px;max-width:1180px}
.sub b{color:#c9c6bf;font-weight:600}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;max-width:1180px;margin:0 auto}
@media(max-width:820px){.grid{grid-template-columns:1fr}}
.card{background:#1f2226;border:2px solid #2d3137;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.card.ok{border-color:#2f9e63}.card.redo{border-color:#d99a2b}
.shot{width:100%;display:block;cursor:zoom-in;background:#0e0f11;max-height:430px;object-fit:contain}
.meta{padding:11px 13px 13px;display:flex;flex-direction:column;gap:8px;flex:1}
.top{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.name{font-weight:600;font-size:13px;word-break:break-all;flex:1;min-width:0}
.badge{font:600 11px/1 inherit;padding:5px 8px;border-radius:5px;letter-spacing:.05em;white-space:nowrap}
.v-pass{background:#1d4030;color:#6ede9f}.v-notes{background:#33401d;color:#b8de6e}
.v-retry{background:#463617;color:#f0bd5c}.v-fail{background:#4a2220;color:#f0837a}
.v-error{background:#2f3238;color:#a5a29b}
.chip{font-size:11px;color:#8c8981;border:1px solid #34383f;border-radius:5px;padding:4px 7px;white-space:nowrap}
.rows{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:#96938c}
.rows b{color:#c1beb7;font-weight:600}
.fails{display:flex;flex-direction:column;gap:5px}
.fail{font-size:12px;line-height:1.4;display:flex;gap:7px;align-items:flex-start}
.fid{font:600 11px/1.5 ui-monospace,monospace;padding:1px 5px;border-radius:4px;flex:0 0 auto}
.s-gate{background:#4a2220;color:#f0837a}.s-critical{background:#463617;color:#f0bd5c}
.s-minor{background:#2f3238;color:#b0ada6}
.s-advisory{background:#23262b;color:#8f8c85;border:1px solid #34383f}
.fail span{color:#b6b3ac}
.notes{font-size:12.5px;color:#a8a59e;font-style:italic;line-height:1.45}
.nums{font:11.5px/1.5 ui-monospace,Consolas,monospace;color:#84817a;border-top:1px solid #2a2e34;padding-top:8px;white-space:pre-wrap}
.row{display:flex;gap:9px;margin-top:auto;padding-top:4px}
.ok-btn{flex:0 0 42px;height:42px;border-radius:9px;border:2px solid #2f9e63;background:transparent;color:#2f9e63;font-size:19px;cursor:pointer}
.ok-btn:hover{background:#22452f}
.card.ok .ok-btn{background:#2f9e63;color:#fff}
.card.redo .ok-btn{border-color:#4a4d53;color:#4a4d53;cursor:not-allowed}
textarea{flex:1;background:#141619;border:1px solid #32363c;border-radius:9px;color:#e9e7e2;padding:9px 11px;font:13px/1.4 inherit;min-height:42px;resize:vertical}
textarea::placeholder{color:#5c5a55}
.hint{font-size:11.5px;color:#d99a2b;min-height:14px}
.bar{position:fixed;left:0;right:0;bottom:0;background:#101113f2;border-top:1px solid #2d3137;padding:12px 20px;display:flex;gap:14px;align-items:center;justify-content:center;backdrop-filter:blur(6px);z-index:40}
.count{color:#96938c;font-size:13px}
.submit{background:#2f9e63;border:none;color:#fff;font:600 15px inherit;padding:11px 26px;border-radius:10px;cursor:pointer}
#lb{position:fixed;inset:0;background:#000000ee;display:none;align-items:center;justify-content:center;z-index:50;gap:12px;padding:52px 20px 20px}
#lb.on{display:flex}
#lb figure{display:flex;flex-direction:column;align-items:center;gap:7px;max-height:100%}
#lb img{height:78vh;max-width:45vw;border-radius:8px;object-fit:contain}
#lb figcaption{color:#a8a59e;font-size:12px}
#lb .tag{position:fixed;top:14px;left:50%;transform:translateX(-50%);color:#d2cfc8;font-size:13px}
#lb .keys{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);color:#7d7a74;font-size:11.5px}
#out{position:fixed;inset:0;background:#000000e6;display:none;align-items:center;justify-content:center;z-index:60}
#out.on{display:flex}
.panel{background:#1f2226;border-radius:14px;padding:22px;max-width:680px;width:92%}
.panel h2{font-size:16px;margin:0 0 9px;border:none;padding:0}
.panel p{font-size:12.5px;color:#96938c;margin-bottom:10px}
.panel textarea{width:100%;min-height:240px;font-family:ui-monospace,monospace;font-size:11.5px}
.panel .row2{display:flex;gap:10px;margin-top:12px}
.panel button,.panel a{background:#32363c;border:none;color:#e9e7e2;padding:9px 16px;border-radius:9px;cursor:pointer;font:600 13px inherit;text-decoration:none;display:inline-block}
.panel .close{margin-left:auto}
"""

JS = r"""
const S = {};
let LB = -1;
function refresh(k){
  const c = document.getElementById('card-' + k), s = S[k];
  c.classList.toggle('ok', s.approved);
  c.classList.toggle('redo', !s.approved && s.comment.trim() !== '');
  const done = Object.values(S).filter(x => x.approved || x.comment.trim()).length;
  document.getElementById('count').textContent =
    done + ' / ' + ORDER.length + ' reviewed';
}
function toggleOk(k){
  const s = S[k];
  if (!s.approved && s.comment.trim()){
    const h = document.getElementById('hint-' + k);
    h.textContent = 'a comment means redo — clear it to approve';
    setTimeout(() => { h.textContent = ''; }, 2200);
    return;
  }
  s.approved = !s.approved;
  refresh(k);
}
function onComment(k, v){
  const s = S[k];
  s.comment = v;
  if (v.trim()) s.approved = false;   /* a comment means redo */
  refresh(k);
}
function show(i){
  if (i < 0 || i >= ORDER.length) return;
  LB = i;
  const k = ORDER[i], img = document.getElementById('shot-' + k);
  document.getElementById('lb-c').src = img.src;   /* the card's own copy, not a second one */
  const wrap = document.getElementById('lb-rw');
  const r = REFS[img.dataset.r];
  if (r){ document.getElementById('lb-r').src = r.uri; wrap.style.display = 'flex';
          document.getElementById('lb-rc').textContent = r.label; }
  else { wrap.style.display = 'none'; }
  document.getElementById('lb-tag').textContent =
    img.dataset.n + '   ' + (i + 1) + ' / ' + ORDER.length;
  document.getElementById('lb').classList.add('on');
}
function zoom(el){ show(ORDER.indexOf(el.dataset.k)); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ document.getElementById('lb').classList.remove('on');
                           document.getElementById('out').classList.remove('on'); }
  if (!document.getElementById('lb').classList.contains('on')) return;
  if (e.key === 'ArrowRight'){ e.preventDefault(); show(LB + 1); }
  if (e.key === 'ArrowLeft'){ e.preventDefault(); show(LB - 1); }
});
function submit(){
  const stamp = new Date().toISOString().slice(0, 10);
  const verdicts = {};
  ORDER.forEach(k => { verdicts[S[k].file] =
    {approved: S[k].approved, comment: S[k].comment.trim()}; });
  const payload = JSON.stringify({wave: WAVE, date: stamp, verdicts: verdicts}, null, 1);
  document.getElementById('json-out').value = payload;
  const a = document.getElementById('dl');
  a.href = URL.createObjectURL(new Blob([payload], {type: 'application/json'}));
  a.download = 'verdicts-' + stamp + '.json';
  a.textContent = 'Download ' + a.download;
  document.getElementById('out').classList.add('on');
}
function copyJson(){
  const ta = document.getElementById('json-out');
  ta.select(); document.execCommand('copy');
  const b = document.getElementById('copy-btn');
  b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy JSON'; }, 1500);
}
"""


def _md_bold(escaped: str) -> str:
    """`**lead.**` -> bold. The rubric writes its checks with a bold lead
    sentence; printing the asterisks verbatim on a client's page is the
    rubric's wording arriving as source code. Escape first, then this."""
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped)


def _fail_rows(rec: dict, captions: dict) -> str:
    """Every failed check in the rubric's own wording. A caption saying 'A2'
    tells a reviewer nothing; the check's own sentence lets them judge it.
    Advisory failures are shown and marked, never counted."""
    out = []
    for f in list(rec.get("failed") or []) + list(rec.get("failed_advisory") or []):
        fid = str(f.get("id", "?"))
        sev = str(f.get("severity", "minor"))
        text = f.get("check") or captions.get(fid, "")
        out.append('<div class="fail"><span class="fid s-' + html.escape(sev) + '">'
                   + html.escape(fid) + '</span><span>' + _md_bold(html.escape(str(text)))
                   + "</span></div>")
    return "".join(out)


def _meta_rows(rec: dict, row: dict) -> str:
    meta = row.get("meta") or {}
    bits = [("slot", rec.get("slot") or row.get("slot") or ""),
            ("subject", rec.get("subject") or meta.get("subject") or ""),
            ("setting", rec.get("setting") or meta.get("setting") or ""),
            ("lane", row.get("model_lane") or ""),
            ("repair", "yes" if meta.get("repair") else "")]
    return "".join("<span><b>" + k + "</b> " + html.escape(str(v)) + "</span>"
                   for k, v in bits if v)


def build(wave_dir: str, out_path: str, title: str) -> str:
    cfg = config.load()
    payload = {}
    qa_path = os.path.join(wave_dir, "qa_results.json")
    if os.path.exists(qa_path):
        try:
            with open(qa_path, encoding="utf-8") as f:
                payload = json.load(f)
        except (OSError, json.JSONDecodeError) as e:
            print("  note: unreadable qa_results.json — " + str(e))
    grades = {r["file"]: r for r in payload.get("results", []) if r.get("file")}
    manifest = config.load_manifest(wave_dir)
    captions = {}
    try:
        captions = config.plain_captions()
    except SystemExit:
        pass                       # no rubric reachable: the grade's own words do

    items = [(p, os.path.basename(os.path.dirname(p)))
             for p in config.candidates(wave_dir)]
    if not items:
        raise SystemExit("no candidates in " + wave_dir)

    groups: dict[str, list[str]] = {}
    for path, folder in items:
        groups.setdefault(folder, []).append(path)

    ref_uris: dict[str, str] = {}      # path -> ref id, so one reference embeds once
    ref_js: list[str] = []
    sections, state, order = [], [], []
    idx = 0
    for folder in sorted(groups):
        paths = sorted(groups[folder],
                       key=lambda p: (rank(grades.get(os.path.basename(p), {})
                                           .get("verdict", "")), os.path.basename(p)))
        cards, question = [], ""
        for path in paths:
            name = os.path.basename(path)
            rec = grades.get(name, {})
            row = manifest.get(name, {})
            question = question or rec.get("question") or (row.get("meta") or {}).get("question") or ""
            key = "i" + str(idx)
            idx += 1
            order.append(key)

            try:
                cand = embed(path)
            except Exception as e:              # noqa: BLE001 - str(e), never e
                print("  note: " + name + " would not open — " + str(e))
                cand = ""

            rid = ""
            rpath, rlabel = comparison(name, rec, row, cfg)
            if rpath:
                if rpath not in ref_uris:
                    try:
                        uri = embed(rpath, MAX_REF_PX, 78)
                        ref_uris[rpath] = "r" + str(len(ref_uris))
                        ref_js.append(json.dumps(ref_uris[rpath]) + ":{uri:"
                                      + json.dumps(uri) + ",label:" + json.dumps(rlabel) + "}")
                    except Exception as e:      # noqa: BLE001
                        print("  note: comparison " + os.path.basename(rpath)
                              + " would not open — " + str(e))
                rid = ref_uris.get(rpath, "")

            verdict = rec.get("verdict", "")
            badge = ('<span class="badge ' + VERDICT_CLASS.get(verdict, "v-error") + '">'
                     + html.escape(verdict or "UNGRADED") + "</span>")
            chips = "".join('<span class="chip">' + html.escape(str(c)) + "</span>"
                            for c in (rec.get("type_name")
                                      or (row.get("meta") or {}).get("type_name"),
                                      rec.get("channel")) if c)
            fails = _fail_rows(rec, captions)
            worst = _md_bold(html.escape(rec.get("worst_issue", "") or ""))
            notes = _md_bold(html.escape(rec.get("notes", "") or ""))
            note_html = ('<div class="notes">' + worst + (" — " if worst and notes else "")
                         + notes + "</div>") if (worst or notes) else ""

            nums = []
            if rec.get("reads_as_stranger"):
                nums.append("a stranger calls it: " + str(rec["reads_as_stranger"]))
            if rec.get("stranger_counts"):
                nums.append("they counted: " + str(rec["stranger_counts"]))
            if rec.get("part_count_note"):
                nums.append("the grader counted: " + str(rec["part_count_note"]))
            names = rec.get("references") or row.get("reference_names") or []
            if names:
                nums.append("graded against: " + ", ".join(str(n) for n in names))
            if rec.get("unanswered"):
                nums.append("unanswered (recorded as failures): "
                            + ", ".join(str(u) for u in rec["unanswered"]))
            if rec.get("run_verdicts"):
                nums.append("runs: " + ", ".join(str(v) for v in rec["run_verdicts"]))

            cards.append(
                '<div class="card" id="card-' + key + '">'
                # The candidate is embedded once. Carrying the same base64 again
                # in a data- attribute doubled the page for no reader's benefit.
                '<img class="shot" id="shot-' + key + '" src="' + cand
                + '" data-r="' + rid + '" data-k="' + key + '" data-n="'
                + html.escape(name) + '" onclick="zoom(this)">'
                '<div class="meta"><div class="top"><span class="name">'
                + html.escape(name) + "</span>" + chips + badge + "</div>"
                + '<div class="rows">' + _meta_rows(rec, row) + "</div>"
                + ('<div class="fails">' + fails + "</div>" if fails else "")
                + note_html
                + '<div class="nums">' + html.escape("\n".join(nums) or "not graded")
                + "</div>"
                '<div class="row"><button class="ok-btn" title="Approve" onclick="toggleOk('
                "'" + key + "')\">&#10003;</button>"
                '<textarea placeholder="A comment means redo — say what is wrong&#8230;"'
                " oninput=\"onComment('" + key + "', this.value)\"></textarea>"
                '</div><div class="hint" id="hint-' + key + '"></div>'
                "</div></div>")
            state.append("S['" + key + "']={file:" + json.dumps(name)
                         + ",approved:false,comment:''}")

        sections.append("<h2>" + html.escape(folder)
                        + (' <span>· ' + html.escape(question) + "</span>" if question else "")
                        + '</h2><div class="grid">' + "".join(cards) + "</div>")

    counts = {}
    for path, _f in items:
        v = grades.get(os.path.basename(path), {}).get("verdict", "ungraded")
        counts[v] = counts.get(v, 0) + 1
    tally = "  ·  ".join("<b>" + html.escape(v) + "</b> " + str(n)
                         for v, n in sorted(counts.items()))
    status = ("" if payload.get("gating", False) else
              "The grader is <b>uncalibrated</b> and reports rather than decides. ")

    doc = ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
           '<meta name="viewport" content="width=device-width,initial-scale=1">'
           "<title>" + html.escape(title) + "</title><style>" + CSS + "</style></head><body>"
           "<h1>" + html.escape(title) + "</h1>"
           '<div class="sub">' + str(len(items)) + " candidates &nbsp;·&nbsp; " + tally
           + "<br>" + status
           + "Every grade below is a floor, not a verdict — it is the first pass of "
             "looking, and you are the gate. Click a picture to put it beside its "
             "reference; arrow keys walk the wave. Green tick approves; a comment means "
             "redo, and the comment is the calibration data. Submit hands back a JSON "
             "file.</div>"
           + "".join(sections)
           + '<div class="bar"><span class="count" id="count">0 reviewed</span>'
             '<button class="submit" onclick="submit()">Submit review</button></div>'
             '<div id="lb" onclick="if(event.target.id===\'lb\')this.classList.remove(\'on\')">'
             '<span class="tag" id="lb-tag"></span>'
             '<figure><img id="lb-c"><figcaption>candidate</figcaption></figure>'
             '<figure id="lb-rw"><img id="lb-r"><figcaption id="lb-rc"></figcaption></figure>'
             '<span class="keys">← → to walk the wave · Esc to close</span></div>'
             '<div id="out"><div class="panel"><h2>Review captured</h2>'
             "<p>Download the file into the wave folder, or copy the JSON back into the "
             "session. A comment is quoted verbatim into the log and decoded into a "
             'check.</p><textarea id="json-out" readonly></textarea>'
             '<div class="row2"><button id="copy-btn" onclick="copyJson()">Copy JSON</button>'
             '<a id="dl">Download</a><button class="close" '
             "onclick=\"document.getElementById('out').classList.remove('on')\">Close"
             "</button></div></div></div>"
             "<script>const WAVE=" + json.dumps(os.path.basename(os.path.normpath(wave_dir)))
           + ";const ORDER=" + json.dumps(order)
           + ";const REFS={" + ",".join(ref_js) + "};" + JS + "\n"
           + ";".join(state) + ";ORDER.forEach(refresh);</script></body></html>")

    os.makedirs(os.path.dirname(os.path.abspath(out_path)) or ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(doc)
    print("  wrote " + out_path + "  (" + str(os.path.getsize(out_path) // 1024)
          + " KB, " + str(len(items)) + " cards, " + str(len(ref_uris))
          + " comparison image" + ("" if len(ref_uris) == 1 else "s") + ")")
    return out_path


def main():
    ap = argparse.ArgumentParser(description="Build the review page for a wave.")
    ap.add_argument("wave", help="a wave directory")
    ap.add_argument("--out", default=None,
                    help="default <repo>/delivery/review-<wave>.html (gitignored)")
    ap.add_argument("--title", default=None)
    a = ap.parse_args()

    wave_dir = os.path.normpath(a.wave)
    label = os.path.basename(wave_dir)
    out = a.out or os.path.join(config.REPO, "delivery", "review-" + label + ".html")
    cfg = config.load()
    title = a.title or ((cfg["engagement"]["title"] or cfg["engagement"]["name"])
                        + " — " + label)
    build(wave_dir, out, title)
    print("  open it: file:///" + os.path.abspath(out).replace(os.sep, "/"))
    print("  today's handback would be verdicts-" + date.today().isoformat() + ".json")


if __name__ == "__main__":
    main()
