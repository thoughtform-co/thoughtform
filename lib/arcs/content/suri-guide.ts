import type { ArcDef } from "../types";

/**
 * SURI, THE SETUP IN PRACTICE: the configuration page's practical companion.
 *
 * Owner, 2026-10-07: "a simple page that explains very clearly and concisely
 * the steps of plugins / marketplace / skill / github and vercel to host api
 * keys / route feedback … an extension of the suri configuration page …
 * really focused on the practicals with obviously a section or two that
 * explains the vision behind it". The configuration page says how the setup
 * thinks; this page says who clicks what, in which order.
 *
 * ADR-151 U1 (owner, same day: "why does every section look the same"): one
 * callout for the why, then four beats that are each their own drawing, the
 * `guide` kind's map, checklist, matrix and pipeline. The term is the large
 * type and its meaning the small; no title is a slogan.
 *
 * ⚠ EVERY STEP IS THE REPOSITORY'S OWN, read from `suri-ai-studio` on
 * 7 October 2026 (`docs/SETUP.md`, `docs/FEEDBACK.md`, `docs/COWORK.md`,
 * `connector/README.md`, `docs/google-ai-setup-for-IT.md`). A menu path is
 * the one those files give; when Claude's settings move, the file and this
 * page change together.
 *
 * ⚠ IT IS THE CLIENT'S PAGE. People by role (a Claude Owner, IT, the
 * maintainer, the skill's owner); no price, no key, no fleet word.
 */
export const SURI_GUIDE_ARC: ArcDef = {
  slug: "suri-guide",
  leaf: "guide",
  format: "workshop",
  client: "suri",
  kind: "workshop",
  cardChip: "guide",
  status: "running",
  date: "2026-10-07",
  cardTitle: "Suri · the setup, in practice",
  cardLede:
    "The plugin, the marketplace, GitHub and Vercel: who sets up what, where the keys live and how feedback reaches a skill's owner.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Suri · The setup, in practice",
    title: { pre: "One repository,", em: "in everyone's Claude." },
    lede: "The parts, the steps and who takes them, from the plugin to the service that keeps the keys and routes feedback.",
    actions: [
      { id: "start", label: "The steps", href: "#steps", primary: true },
      { id: "feedback", label: "Feedback", href: "#feedback" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    plate: "gateway",
    curtain: true,
  },
  meta: {
    title: "Suri · The setup, in practice",
    description:
      "How Suri's Claude plugin reaches the team: the skills, the marketplace, GitHub, the keys, and the path a remark takes to a skill's owner.",
  },
  sections: [
    /* ── 01 · Why ─────────────────────────────────────────────────────── */
    {
      id: "why",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "01 · Why it is built this way",
      menuLabel: "Why",
      line: { pre: "The tools change every month.", em: "The judgment stays in Suri's files." },
      subline:
        "So the setup runs on Suri's own accounts, is written down as plain files, and gets better from the people who use it.",
    },

    /* ── 02 · The map: the system, and what each word means ──────────── */
    {
      id: "map",
      kind: "guide",
      menuLabel: "The parts",
      menuPrimary: true,
      head: {
        eyebrow: "02 · The parts",
        title: { pre: "How the parts", em: "fit together." },
        sub: "The skills live in GitHub. Claude brings them to the team. Feedback comes back through one small service on Vercel.",
      },
      guide: {
        view: "map",
        repo: {
          pin: 4,
          label: "GitHub",
          name: "Private repository, on Suri's account",
          marketplace: {
            pin: 3,
            label: "Marketplace",
            name: "suri-ai-studio",
            plugins: [
              {
                pin: 2,
                label: "Plugin",
                name: "ai-suri",
                skills: {
                  pin: 1,
                  names: ["mother", "brand", "brief", "design-review", "video-edit"],
                  more: "+ 16 more",
                },
              },
            ],
          },
        },
        org: {
          pin: 5,
          label: "Claude",
          name: "Suri's organisation",
          line: "Syncs the plugin and gives it to the people it is for.",
        },
        team: {
          label: "The team",
          name: "Where you use it",
          surfaces: ["Chat", "Desktop", "Cowork", "Claude Code"],
        },
        service: {
          pin: 6,
          label: "Vercel",
          name: "Feedback connector",
          line: "Files remarks as GitHub issues, and keeps its own keys.",
        },
        arrows: { sync: "Sync", reach: "Installed", remark: "/skill-feedback", issue: "Issue" },
        terms: [
          {
            n: 1,
            term: "Skill",
            line: "One piece of work written down: its steps, its context, good and bad examples, and its checks. Claude uses it when a request needs it.",
          },
          {
            n: 2,
            term: "Plugin",
            line: "A team's skills in one package. Suri has one, ai-suri: 21 skills, run in order by the mother.",
          },
          {
            n: 3,
            term: "Marketplace",
            line: "The list of plugins and versions Claude reads. A raised version tells Claude there is something new.",
          },
          {
            n: 4,
            term: "GitHub",
            line: "The private repository that holds all of it. Every change is a pull request, and a person merges it.",
          },
          {
            n: 5,
            term: "Claude organisation",
            line: "Picks up a merged change within 30 minutes and gives each plugin to its group.",
          },
          {
            n: 6,
            term: "Vercel",
            line: "Runs the feedback connector, the one part that lives outside Claude, and holds its keys.",
          },
        ],
        alt: "Suri's GitHub repository holds the marketplace, which holds the ai-suri plugin and its skills. It syncs into Suri's Claude organisation, which installs it for the team in chat, Desktop, Cowork and Claude Code. A remark from the team goes through the feedback connector on Vercel and comes back to the repository as an issue.",
      },
    },

    /* ── 03 · The checklist ────────────────────────────────────────────── */
    {
      id: "steps",
      kind: "guide",
      menuLabel: "The steps",
      menuPrimary: true,
      head: {
        eyebrow: "03 · The steps",
        title: { pre: "Setting it up,", em: "in order." },
        sub: "Each step once, by the role named beside it. Until the sync is on, the team installs the plugin as a zip.",
      },
      guide: {
        view: "checklist",
        labels: { who: "Who", where: "Where", done: "Done" },
        phases: [
          {
            id: "before",
            label: "Before",
            when: "IT, once",
            steps: [
              {
                id: "github-org",
                title: "Give Suri its own GitHub organisation",
                line: "The repository lives there, private, with its whole history.",
                who: "IT",
                done: "5 October",
              },
              {
                id: "model-keys",
                title: "Issue the model keys",
                line: "One Gemini key per person, from Suri's own Google Cloud project, through the password manager.",
                who: "IT",
              },
              {
                id: "vercel",
                title: "Create a Vercel Pro team",
                line: "The feedback connector runs there. The free plan is for personal use only.",
                who: "IT",
              },
              {
                id: "google",
                title: "Create a project for the sign-in",
                line: "In Suri's Google Workspace, audience Internal, so only Suri accounts can sign in.",
                who: "IT",
              },
            ],
          },
          {
            id: "connect",
            label: "Connect",
            when: "A Claude Owner, once",
            steps: [
              {
                id: "policy",
                title: "Switch skills on",
                line: "Skills for the organisation, user-created skills for the creative team, and code execution on.",
                who: "Claude Owner",
                where: ["Organization settings", "Plugins and skills", "Policy"],
              },
              {
                id: "app",
                title: "Install the Claude GitHub App",
                line: "On this repository only. Approve webhooks, read and write, if GitHub asks.",
                who: "GitHub admin",
              },
              {
                id: "sync",
                title: "Sync the repository",
                line: "Leave Sync automatically on and the default access Not available. The first sync takes up to 30 minutes.",
                who: "Claude Owner",
                where: ["Organization settings", "Plugins & skills", "Add", "Sync from GitHub"],
              },
              {
                id: "access",
                title: "Give the plugin to the team",
                line: "A pilot group first, then Installed by default for everyone.",
                who: "Claude Owner",
                where: ["Inventory", "ai-suri", "Group access"],
              },
              {
                id: "uploads",
                title: "Remove the uploaded zips",
                line: "Two copies of one skill fire unpredictably, and an upload never updates.",
                who: "Claude Owner",
                where: ["Organization skills"],
              },
              {
                id: "connectors",
                title: "Switch on Monday and Figma",
                line: "So the skills read the boards and the components. Each person signs in once.",
                who: "Claude Owner",
              },
            ],
          },
          {
            id: "feedback-setup",
            label: "Feedback",
            when: "The maintainer, with IT",
            steps: [
              {
                id: "deploy",
                title: "Deploy the connector",
                line: "One script walks through it and says what is left: connector/scripts/setup.sh.",
                who: "Maintainer",
              },
              {
                id: "triage",
                title: "Switch the triage on",
                line: "Its Claude token goes into the repository's secrets, then TRIAGE_ENABLED is set to true.",
                who: "Maintainer",
                where: ["GitHub", "Settings", "Secrets and variables", "Actions"],
              },
              {
                id: "connector",
                title: "Add the connector for everyone",
                line: "For the whole organisation, at the connector's address followed by /mcp. Last, once the first test has passed.",
                who: "Claude Owner",
              },
            ],
          },
          {
            id: "every-change",
            label: "Then",
            when: "Every change",
            steps: [
              {
                id: "pr",
                title: "Open a pull request",
                line: "A change to the file that owns the rule. A GitHub Action raises the version.",
                who: "Anyone",
              },
              {
                id: "merge",
                title: "Merge it",
                line: "Claude syncs the new version to everyone within 30 minutes.",
                who: "A person",
              },
            ],
          },
        ],
      },
    },

    /* ── 04 · The keys, as a matrix ────────────────────────────────────── */
    {
      id: "keys",
      kind: "guide",
      menuLabel: "The keys",
      menuPrimary: true,
      head: {
        eyebrow: "04 · The keys",
        title: { pre: "Where each", em: "key lives." },
        sub: "No key is ever in the repository or in a chat. The skills read a key by its name and never print it.",
      },
      guide: {
        view: "matrix",
        labels: { key: "Key", lives: "lives here", never: "never" },
        places: [
          { id: "env", name: ".env on the laptop" },
          { id: "vercel", name: "Vercel settings" },
          { id: "secrets", name: "GitHub secrets" },
          { id: "repo", name: "The repository", never: true },
          { id: "chat", name: "A chat or message", never: true },
        ],
        keys: [
          {
            id: "model",
            name: "Model keys",
            line: "Gemini, for pictures, video and sound.",
            who: "IT issues one per person",
            at: 0,
          },
          {
            id: "connector",
            name: "Connector keys",
            line: "The Google sign-in, the GitHub App key, the signing secret.",
            who: "The maintainer sets them",
            at: 1,
          },
          {
            id: "token",
            name: "Triage token",
            line: "The Claude token the feedback triage runs on.",
            who: "Its owner, from a terminal",
            at: 2,
          },
        ],
      },
    },

    /* ── 05 · Feedback, as a pipeline ──────────────────────────────────── */
    {
      id: "feedback",
      kind: "guide",
      menuLabel: "Feedback",
      menuPrimary: true,
      head: {
        eyebrow: "05 · Feedback",
        title: { pre: "How a remark reaches", em: "the skill's owner." },
        sub: "No GitHub account is needed to give feedback. Nothing changes until the owner decides and a person merges.",
      },
      guide: {
        view: "pipeline",
        labels: { person: "A person", machine: "Runs by itself" },
        stations: [
          {
            id: "say",
            actor: "Anyone at Suri",
            by: "person",
            title: "Types /skill-feedback",
            line: "Says what went wrong, reads the exact text, and says yes. Signs in once with Google.",
          },
          {
            id: "filed",
            actor: "Connector · Vercel",
            by: "machine",
            title: "Files an issue",
            line: "Shows similar remarks first, so a repeat counts as one more voice.",
          },
          {
            id: "labelled",
            actor: "Triage · GitHub",
            by: "machine",
            title: "Labels it",
            line: "Reads the remark against the skill's files and comments. Changes no file.",
          },
          {
            id: "decides",
            actor: "The skill's owner",
            by: "person",
            title: "Decides",
            line: "Fix it, later, close it, or send it to a developer.",
          },
          {
            id: "drafts",
            actor: "Triage · GitHub",
            by: "machine",
            title: "Drafts the fix",
            line: "The smallest change, with the test that would have caught it.",
          },
          {
            id: "merges",
            actor: "A person",
            by: "person",
            title: "Merges it",
            line: "The version goes up.",
          },
        ],
        close:
          "Claude syncs the fix to everyone within 30 minutes. Heard once, a remark is noted beside the skill; heard twice, on other work, it becomes a rule.",
      },
    },

    /* ── 06 · Close ────────────────────────────────────────────────────── */
    {
      id: "more",
      kind: "close",
      menuLabel: "The full steps",
      head: {
        eyebrow: "06 · The full steps",
        title: { pre: "Every step is also in", em: "the repository." },
        sub: "docs/SETUP.md for the plugin, docs/FEEDBACK.md for the feedback path, docs/COWORK.md for the zip.",
      },
      actions: [
        {
          id: "mail",
          label: "vince@thoughtform.co",
          href: "mailto:vince@thoughtform.co",
          primary: true,
        },
      ],
      footerLine: "Thoughtform · Antwerp · 2026",
      signature: "Vince Buyssens",
    },
  ],
};
