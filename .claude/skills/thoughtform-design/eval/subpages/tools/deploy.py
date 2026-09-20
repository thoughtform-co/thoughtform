r"""Stand up a new engagement: the five moves, in one command.

    python tools/deploy.py "Acme" --callsign petrel
    python tools/deploy.py "Acme" --callsign petrel --title "Acme, product imagery"
    python tools/deploy.py "Acme" --callsign petrel --kind project --dry-run
    python tools/deploy.py --dir ../Arcs_Acme --figma-file <key>

The five moves, in this order, because each one needs the one before it:

1. **The pixels folder**, at `<roots.drive>/<YYYYMMDD>_<Client>`, with
   `01_Source`, `02_Creation` and `03_Final` inside it. Recipe in git, pixels
   there, and the path goes into `armada.toml` so every tool finds it.
2. **The repo**, at `<roots.repos>/Arcs_<Client>`, scaffolded from
   `templates/` for a ship or `templates-project/` for a repo with no pixels,
   then `git init` and one commit, because a repo with no commit cannot be
   pushed.
3. **The remote**, private, under `<github.owner>`, with the `armada-ship`
   topic, which is how the home port's nightly flow discovers it at all.
   `--remote <name>` when the repository is not named for the slug; the port
   carries no naming convention of its own.
4. **The board file**, in the design tool, in the practice's own folder. That
   one move is not a shell command: a design file is created through the
   design tool's own interface, so this prints the exact call and then
   `--figma-file <key>` writes the key back into `armada.toml`.
5. **The client's page**, on the practice's own site, which is where a
   proposal is read. The site owns its own scaffold and this only runs it:
   `[roots].site` says where that repo is, and `--site-page <path>` writes
   the path back, under the slug the toml already holds. Without the root
   this prints the command and stops, which is the same contract move 4 has.

The roots come from the operator's `~/.armada.toml` (`config.machine()`), not
from this repo, which knows nothing about anybody's disk. `--repos`, `--drive`
and `--owner` override it; without either, this says which key is missing and
stops rather than guessing.

Nothing here is irreversible without saying so first: `--dry-run` prints the
five moves and touches nothing.
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config  # noqa: E402
import new_engagement as scaffold  # noqa: E402
import new_project  # noqa: E402

SUBFOLDERS = ("01_Source", "02_Creation", "03_Final")


def slug_of(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def run(cmd, cwd=None):
    """UTF-8 explicitly: `text=True` decodes with the console's codepage, and
    on a Windows machine that is cp1252, which raises on the first non-ASCII
    character another repo's scaffold prints. `errors="replace"` because a
    mangled character in a report is a report; a traceback is not."""
    r = subprocess.run(cmd, cwd=cwd and str(cwd), capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    return r.returncode, (r.stdout or "") + (r.stderr or "")


def git_first_commit(repo: Path, client: str) -> str:
    """One commit, so the remote has something to receive. Staged from the repo
    root only: `git add -A` run from anywhere else picks up a stray git root."""
    if not (repo / ".git").exists():
        return "no git repo"
    code, out = run(["git", "add", "-A"], repo)
    if code != 0:
        return "git add failed: " + out.strip()[:120]
    code, _ = run(["git", "diff", "--cached", "--quiet"], repo)
    if code == 0:
        return "nothing to commit"
    code, out = run(["git", "commit", "-q", "-m",
                     "chore(scaffold): " + client + " on the standard, from the port"], repo)
    if code != 0:
        # The usual cause on a machine that has never committed, and the one
        # worth naming: git says "Author identity unknown" over several lines
        # and the truncation below cuts the instruction off, so the operator
        # sees a failure with no cause. Move 3 then has nothing to push and the
        # whole of day one stops without anyone knowing why (found on a CI
        # runner, 2026-09-13, where no identity is configured by default).
        if "identity unknown" in out.lower() or "please tell me who you are" in out.lower():
            return ("git has no identity on this machine, so the scaffold could "
                    "not be committed and move 3 has nothing to push. Set one "
                    "and re-run: git config --global user.name \"<you>\" and "
                    "git config --global user.email \"<you@example.com>\".")
        return "git commit failed: " + out.strip()[:120]
    return "one commit"


def write_figma_file(toml_path: Path, key: str, folder: str) -> bool:
    """Write `[figma].file` (and `folder`) into an engagement's toml, textually.

    Scoped to the `[figma]` block and nothing else: `file` and `folder` are
    ordinary words, and a regex let loose over a whole toml would happily
    rewrite the first one it met in another table.
    """
    text = toml_path.read_text(encoding="utf-8")
    m = re.search(r"^\[figma\]\s*$", text, re.M)
    if not m:
        return False
    start = m.end()
    nxt = re.search(r"^\[", text[start:], re.M)
    end = start + (nxt.start() if nxt else len(text) - start)
    block, changed = text[start:end], False
    for field, value in (("file", key), ("folder", folder)):
        if not value:
            continue
        new, n = re.subn(r"^(\s*" + field + r'\s*=\s*)"[^"]*"', r'\g<1>"' + value + '"',
                         block, count=1, flags=re.M)
        if n:
            block, changed = new, True
    if changed:
        toml_path.write_text(text[:start] + block + text[end:], encoding="utf-8")
    return changed


def write_site_page(toml_path: Path, client_slug: str, page: str) -> bool:
    """Write `[site].client` and `[site].page` into an engagement's toml.

    Block-scoped, for `write_figma_file`'s reason one table along: `client`
    and `page` are ordinary words, and a regex let loose over a whole toml
    would rewrite the first one it met somewhere else.
    """
    text = toml_path.read_text(encoding="utf-8")
    m = re.search(r"^\[site\]\s*$", text, re.M)
    if not m:
        return False
    start = m.end()
    nxt = re.search(r"^\[", text[start:], re.M)
    end = start + (nxt.start() if nxt else len(text) - start)
    block, changed = text[start:end], False
    for field, value in (("client", client_slug), ("page", page)):
        if not value:
            continue
        new, n = re.subn(r"^(\s*" + field + r'\s*=\s*)"[^"]*"', r'\g<1>"' + value + '"',
                         block, count=1, flags=re.M)
        if n:
            block, changed = new, True
    if changed:
        toml_path.write_text(text[:start] + block + text[end:], encoding="utf-8")
    return changed


def site_step(site_root: str, client: str, slug: str, page: str = "") -> list:
    """Move 5, in `figma_step`'s shape: the command, then the round trip.

    The site owns the scaffold. This names it and runs it; what a client
    page contains is the site repo's business, and a port that wrote the
    site's files would be two places to change one page.
    """
    lines = ["  5. the client's page, on the site:"]
    if page:
        lines.append("       already set: " + page)
        return lines
    lines.append('       node scripts/new-arc.mjs --client ' + slug
                 + ' --name "' + client + '"')
    lines.append("                        in " + (site_root or "(no [roots].site in ~/.armada.toml)"))
    lines.append("       then: python tools/deploy.py --dir <repo> --site-page arcs/" + slug
                 + "-proposal")
    return lines


def run_site_scaffold(site_root: str, client: str, slug: str) -> str:
    """Run the site's own scaffold. Never commits, never pushes: the site is
    somebody's working tree, and a port that committed into it would be
    landing a page nobody had read."""
    root = Path(site_root).expanduser()
    script = root / "scripts" / "new-arc.mjs"
    if not script.exists():
        return "no scripts/new-arc.mjs at " + str(root)
    code, out = run(["node", "scripts/new-arc.mjs", "--client", slug, "--name", client], root)
    if code != 0:
        return "scaffold failed: " + out.strip()[:200]
    return "scaffolded, uncommitted, in " + str(root)


def figma_step(cfg_machine: dict, client: str, key: str = "") -> list:
    plan = cfg_machine["figma"].get("plan", "")
    folder = cfg_machine["figma"].get("folder", "")
    lines = ["  4. the board file, in the design tool:"]
    if key:
        lines.append("       already set: " + key)
        return lines
    lines.append('       create_new_file  fileName="' + client + '"  editorType="design"')
    lines.append("                        planKey=" + (plan or "(unset in ~/.armada.toml)"))
    lines.append("                        projectId=" + (folder or "(unset in ~/.armada.toml)"))
    lines.append("       then: python tools/deploy.py --dir <repo> --figma-file <key>")
    return lines


def main() -> None:
    ap = argparse.ArgumentParser(description="Stand up a new engagement: the four moves.")
    ap.add_argument("client", nargs="?", default="",
                    help='the client as a person writes it, e.g. "Acme" or "Acme Bakehouse"')
    ap.add_argument("--callsign", default="",
                    help="one word the fleet knows it by, never derived from the client")
    ap.add_argument("--title", default="", help="the engagement's one line")
    ap.add_argument("--name", default="", help="slug; default: derived from the client")
    ap.add_argument("--kind", default="ship", choices=("ship", "project"),
                    help="ship: pixels, waves, a rubric. project: a repo on the standard")
    ap.add_argument("--dir", default="", help="the repo path; default: <roots.repos>/Arcs_<Client>")
    ap.add_argument("--repos", default="", help="override [roots].repos")
    ap.add_argument("--drive", default="", help="override [roots].drive")
    ap.add_argument("--owner", default="", help="override [github].owner")
    ap.add_argument("--machine", default="", help="read this machine config instead of ~/.armada.toml")
    ap.add_argument("--date", default=date.today().isoformat(), metavar="YYYY-MM-DD")
    ap.add_argument("--no-github", action="store_true", help="scaffold and stop; create no remote")
    ap.add_argument("--remote", default="", metavar="NAME",
                    help="the repository's name under the owner, when it is not the "
                         "slug (a fleet that prefixes its repos passes it here)")
    ap.add_argument("--figma-file", default="", metavar="KEY",
                    help="write this board file key into an existing engagement's toml and stop")
    ap.add_argument("--site-page", default="", metavar="PATH",
                    help="write this client-page path into an existing engagement's toml and stop")
    ap.add_argument("--site-client", default="", metavar="SLUG",
                    help="with --site-page: the site's client slug, when it is not "
                         "[engagement].name")
    ap.add_argument("--site", default="", help="override [roots].site")
    ap.add_argument("--no-site", action="store_true", help="skip move 5; make no client page")
    ap.add_argument("--dry-run", action="store_true", help="print the five moves; touch nothing")
    a = ap.parse_args()

    m = config.machine(Path(a.machine) if a.machine else None)
    repos = a.repos or m["roots"].get("repos", "")
    drive_root = a.drive or m["roots"].get("drive", "")
    owner = a.owner or m["github"].get("owner", "")
    site_root = a.site or m["roots"].get("site", "")

    # --figma-file on its own: the fourth move, landing.
    if a.figma_file:
        if not a.dir:
            config.die("--figma-file needs --dir <repo>: it writes the key into that "
                       "engagement's armada.toml.")
        toml = Path(a.dir).expanduser().resolve() / "armada.toml"
        if not toml.exists():
            config.die("no armada.toml at " + str(toml))
        ok = write_figma_file(toml, a.figma_file, m["figma"].get("folder", ""))
        print("  figma     " + ("[figma].file = " + a.figma_file if ok
                                else "no [figma] block in that toml; add one"))
        raise SystemExit(0 if ok else 1)

    # --site-page on its own: the fifth move, landing.
    if a.site_page:
        if not a.dir:
            config.die("--site-page needs --dir <repo>: it writes the path into that "
                       "engagement's armada.toml.")
        toml = Path(a.dir).expanduser().resolve() / "armada.toml"
        if not toml.exists():
            config.die("no armada.toml at " + str(toml))
        # The slug is READ, never carved out of the path. Move 5 hands the
        # site `--client <[engagement].name>`, so the toml already holds the
        # exact slug the page lives under. 2026-09: this line derived it as
        # everything before the first hyphen, which is right for a one-word
        # client and silently wrong for every other - a two-word client's
        # page landed under half its name. The engagement it is taken from
        # cannot disagree with the page the scaffold made.
        slug = a.site_client or (config.load(toml, fresh=True)["engagement"].get("name") or "")
        slug = slug.strip()
        if not slug:
            config.die("no [engagement].name in " + str(toml) + " and no --site-client. "
                       "The site's client slug is the engagement's own; a guess would "
                       "point this ship at somebody else's page.")
        if not a.site_page.startswith("arcs/" + slug + "-") and a.site_page != "arcs/" + slug:
            print("  note      the page path does not start with arcs/" + slug
                  + "-; writing [site].client = " + slug + " anyway. --site-client overrides.")
        ok = write_site_page(toml, slug, a.site_page)
        print("  site      " + ("[site].page = " + a.site_page if ok
                                else "no [site] block in that toml; add one"))
        raise SystemExit(0 if ok else 1)

    if not a.client:
        config.die('the client is the first argument, as a person writes it: '
                   'python tools/deploy.py "Acme" --callsign petrel')
    client = a.client.strip()
    name = a.name or slug_of(client)
    title = a.title or client
    repo = Path(a.dir).expanduser().resolve() if a.dir else None
    if repo is None:
        if not repos:
            config.die("no repos root. Set [roots].repos in " + str(config.machine_path())
                       + ", or pass --repos / --dir.")
        repo = Path(repos).expanduser().resolve() / ("Arcs_" + client)
    pixels = None
    if a.kind == "ship":
        if not drive_root:
            config.die("no drive root. Set [roots].drive in " + str(config.machine_path())
                       + ", or pass --drive. A ship's pixels need a home outside the repo.")
        pixels = Path(drive_root).expanduser().resolve() / (
            a.date.replace("-", "") + "_" + client)

    print()
    print("  " + client + ("" if a.kind == "ship" else "  (a project, no pixels)"))
    print("  1. pixels    " + (str(pixels) if pixels else "none; not a ship"))
    print("  2. repo      " + str(repo) + "   from "
          + ("templates/" if a.kind == "ship" else "templates-project/"))
    remote = a.remote.strip() or name
    print("  3. remote    " + ((owner + "/" + remote + "  private, topic armada-ship")
                               if owner and not a.no_github else
                               "none" if a.no_github else "(no [github].owner set)"))
    for line in figma_step(m, client):
        print(line)
    if not a.no_site:
        for line in site_step(site_root, client, name):
            print(line)
    print()

    if a.dry_run:
        print("  dry run: nothing created.\n")
        raise SystemExit(0)

    if repo.exists() and any(repo.iterdir()):
        config.die(str(repo) + " is not empty. Standing an engagement up over live work "
                   "is not recoverable.")

    # 1 -----------------------------------------------------------------------
    if pixels:
        for sub in SUBFOLDERS:
            (pixels / sub).mkdir(parents=True, exist_ok=True)
        print("  pixels    " + str(pixels) + "  (" + ", ".join(SUBFOLDERS) + ")")

    # 2 -----------------------------------------------------------------------
    values = {"name": name, "title": title, "date": a.date, "callsign": a.callsign}
    repo.mkdir(parents=True, exist_ok=True)
    src = None if a.kind == "ship" else new_project.TEMPLATES
    written, _ = scaffold.copy_templates(repo, values, src=src)
    n_tools = 0
    if a.kind == "ship":
        n_tools, extra = scaffold.copy_tools(repo)
        if extra:
            print("  left alone in tools/: " + ", ".join(extra))
    if pixels:
        scaffold.set_drive_root(repo / "armada.toml", str(pixels))
    print("  repo      " + str(repo) + "  " + str(len(written)) + " files"
          + (", " + str(n_tools) + " tools, armada " + scaffold.read_version(repo / "tools")
             if n_tools else ""))
    print("  git       " + scaffold.git_init(repo))
    print("  commit    " + git_first_commit(repo, client))

    # 3 -----------------------------------------------------------------------
    if a.no_github:
        print("  remote    skipped")
    elif not owner:
        print("  remote    skipped: no [github].owner and no --owner")
    else:
        new_project.github(repo, owner, False, remote)

    # 5 -----------------------------------------------------------------------
    # Run before move 4 is PRINTED, because move 4 is the one a person has to
    # make by hand: it should be the last thing left on screen.
    if a.no_site:
        print("  site      skipped")
    elif not site_root:
        print("  site      skipped: no [roots].site and no --site")
    else:
        print("  site      " + run_site_scaffold(site_root, client, name))

    # 4 -----------------------------------------------------------------------
    print()
    for line in figma_step(m, client):
        print(line)
    if not a.no_site and site_root:
        print()
        print("  the page is scaffolded and UNCOMMITTED. From " + site_root + ":")
        print("    add the two hand-written rows the scaffold printed, fill in the copy,")
        print("    npm run verify, then commit it yourself.")
    print("\n  then, from " + str(repo) + ":")
    if a.kind == "ship":
        print("    python tools/doctor.py")
        print("    fill armada.toml, generation.md and rubric.md, then the first wave")
    else:
        print("    write what the project is in README.md; read MEMORY.md on entry")
    print()


if __name__ == "__main__":
    main()
