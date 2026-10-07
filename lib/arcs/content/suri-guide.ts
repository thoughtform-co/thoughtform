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
 * ADR-151 U5 (owner, same day): four beats on one system, the `guide` kind's
 * panels. The system in words beside the flow drawn down the page; the setup
 * clustered per tool, every step a link; the keys; the feedback loop. Plain
 * technical English, no slogan titles.
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
    title: { pre: "The setup", em: "in practice." },
    lede: "How Suri's skills reach the team, and how they get better.",
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
    /* ── 01 · The system ───────────────────────────────────────────────── */
    {
      id: "system",
      kind: "guide",
      menuLabel: "The system",
      menuPrimary: true,
      head: {
        eyebrow: "01 · The system",
        title: { pre: "System", em: "overview." },
      },
      guide: {
        view: "system",
        paragraphs: [
          "Suri's skills are text files in one private GitHub repository. Claude syncs it into Suri's organisation, and every merged change reaches the whole team within 30 minutes. When a skill gets something wrong, anyone types /skill-feedback: a small service on Vercel files it as a GitHub issue, the skill's owner decides, and the fix comes back the same way.",
        ],
        stack: [
          {
            label: "GitHub",
            name: "suri-ai-studio",
            child: {
              label: "Plugin · ai-suri",
              items: ["mother", "brand", "brief", "+ 18 skills"],
            },
          },
          {
            label: "Claude",
            name: "Suri's organisation",
            items: ["Chat", "Desktop", "Cowork", "Claude Code"],
            lit: true,
          },
          {
            label: "Vercel",
            name: "Feedback connector",
            line: "/skill-feedback → GitHub issue → the owner decides",
          },
        ],
        between: ["Sync · within 30 min", "/skill-feedback"],
        back: "Issue",
        alt: "Three panels down the page. GitHub holds the suri-ai-studio repository, with the marketplace inside it and the ai-suri plugin and its skills inside that. An arrow marked sync leads down to Suri's Claude organisation, which installs the plugin in chat, Desktop, Cowork and Claude Code. An arrow marked /skill-feedback leads down to the feedback connector on Vercel, and a dashed return path marked issue runs back up to GitHub.",
      },
    },

    /* ── 02 · Setup ─────────────────────────────────────────────────────── */
    {
      id: "setup",
      kind: "guide",
      menuLabel: "Setup",
      menuPrimary: true,
      head: {
        eyebrow: "02 · Setup",
        title: { pre: "Setup", em: "per tool." },
        sub: "Each step once. The link opens the page where it is done.",
      },
      guide: {
        view: "tools",
        labels: { done: "· done" },
        tools: [
          {
            id: "github",
            label: "GitHub",
            role: "GitHub admin",
            what: "Holds the repository. Every change is a pull request.",
            steps: [
              {
                id: "org",
                title: "Create a GitHub organisation",
                line: "",
                href: "https://github.com/account/organizations/new",
                done: "5 October",
              },
              {
                id: "app",
                title: "Install the Claude GitHub App",
                line: "",
                href: "https://github.com/apps/claude",
              },
              {
                id: "triage",
                title: "Add the triage token",
                line: "A secret, then TRIAGE_ENABLED=true.",
                href: "https://github.com/suri-intelligence-architect/suri-ai-studio/settings/secrets/actions",
              },
              {
                id: "merge",
                title: "Merge pull requests",
                line: "A GitHub Action raises the version.",
                href: "https://github.com/suri-intelligence-architect/suri-ai-studio/pulls",
              },
            ],
          },
          {
            id: "google",
            label: "Google Cloud",
            role: "IT",
            what: "Issues the model key and the sign-in.",
            steps: [
              {
                id: "key",
                title: "Create the Gemini API key",
                line: "One per person, via the password manager.",
                href: "https://aistudio.google.com/apikey",
              },
              {
                id: "signin",
                title: "Create the sign-in project",
                line: "Audience Internal.",
                href: "https://console.cloud.google.com/projectcreate",
              },
            ],
          },
          {
            id: "vercel",
            label: "Vercel",
            role: "The maintainer",
            what: "Runs the feedback connector.",
            steps: [
              {
                id: "team",
                title: "Create a Pro team",
                line: "Hobby is for personal use only.",
                href: "https://vercel.com/dashboard",
              },
              {
                id: "deploy",
                title: "Deploy the connector",
                line: "connector/scripts/setup.sh.",
                href: "https://github.com/suri-intelligence-architect/suri-ai-studio/blob/main/docs/FEEDBACK.md",
              },
            ],
          },
          {
            id: "claude",
            label: "Claude",
            role: "Claude Owner",
            what: "Syncs and installs the plugin.",
            steps: [
              {
                id: "policy",
                title: "Switch skills on",
                line: "Skills, user skills, code execution.",
                href: "https://claude.ai/admin-settings/skills",
              },
              {
                id: "sync",
                title: "Sync the repository",
                line: "Sync automatically on.",
                href: "https://claude.ai/admin-settings/skills?tab=inventory",
              },
              {
                id: "access",
                title: "Install for the team",
                line: "Pilot first, then Installed by default.",
                href: "https://claude.ai/admin-settings/skills?tab=inventory",
              },
              {
                id: "zips",
                title: "Remove the uploaded zips",
                line: "",
                href: "https://claude.ai/admin-settings/skills",
              },
              {
                id: "connectors",
                title: "Connect Monday and Figma",
                line: "",
                href: "https://claude.ai/settings/connectors",
              },
              {
                id: "connector",
                title: "Add the connector",
                line: "Last, after the first test.",
                href: "https://claude.ai/settings/connectors",
              },
            ],
          },
        ],
      },
    },

    /* ── 03 · Keys ──────────────────────────────────────────────────────── */
    {
      id: "keys",
      kind: "guide",
      menuLabel: "Keys",
      menuPrimary: true,
      head: {
        eyebrow: "03 · Keys",
        title: { pre: "Where each key", em: "is stored." },
        sub: "The skills read a key by its name and never print it.",
      },
      guide: {
        view: "matrix",
        label: "Keys",
        labels: { key: "Key", lives: "stored here", never: "never" },
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
            name: "Model key",
            line: "Gemini, for pictures, video and sound.",
            who: "IT issues one per person",
            at: 0,
          },
          {
            id: "connector",
            name: "Connector keys",
            line: "Google sign-in, GitHub App key, signing secret.",
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

    /* ── 04 · Feedback ──────────────────────────────────────────────────── */
    {
      id: "feedback",
      kind: "guide",
      menuLabel: "Feedback",
      menuPrimary: true,
      head: {
        eyebrow: "04 · Feedback",
        title: { pre: "How feedback", em: "reaches the owner." },
        sub: "No GitHub account is needed. Nothing changes until the owner decides and a person merges.",
      },
      guide: {
        view: "pipeline",
        label: "Feedback loop",
        labels: { person: "A person", machine: "Runs by itself" },
        stations: [
          {
            id: "say",
            actor: "Anyone at Suri",
            by: "person",
            title: "Types /skill-feedback",
            line: "Says what went wrong, and says yes.",
          },
          {
            id: "filed",
            actor: "Connector · Vercel",
            by: "machine",
            title: "Files an issue",
            line: "Similar remarks are shown first.",
          },
          {
            id: "labelled",
            actor: "Triage · GitHub",
            by: "machine",
            title: "Labels it",
            line: "Reads it against the skill. Changes nothing.",
          },
          {
            id: "decides",
            actor: "The skill's owner",
            by: "person",
            title: "Decides",
            line: "Fix it, later, close it, or hand it on.",
          },
          {
            id: "drafts",
            actor: "Triage · GitHub",
            by: "machine",
            title: "Drafts the fix",
            line: "The smallest change, with its test.",
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
          "Everyone has the fix within 30 minutes. Heard twice, a remark becomes a rule.",
      },
    },

    /* ── 05 · Close ─────────────────────────────────────────────────────── */
    {
      id: "more",
      kind: "close",
      menuLabel: "Docs",
      head: {
        eyebrow: "05 · Docs",
        title: { pre: "The full steps are in", em: "the repository." },
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
