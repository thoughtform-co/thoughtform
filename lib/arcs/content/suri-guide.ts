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
        view: "overview",
        repo: {
          label: "GitHub",
          name: "suri-ai-studio, private, on Suri's account",
          strata: [
            { tag: "Skill", name: "One piece of work, written down" },
            { tag: "Plugin", name: "ai-suri: 21 skills, the mother" },
            { tag: "Marketplace", name: "The list Claude reads" },
          ],
        },
        org: { label: "Claude", name: "Suri's organisation", sync: "Sync · 30 min" },
        surfaces: {
          label: "The team",
          items: [
            { glyph: "C", name: "Chat" },
            { glyph: "D", name: "Desktop" },
            { glyph: "W", name: "Cowork" },
            { glyph: ">_", name: "Claude Code" },
          ],
        },
        service: {
          label: "Vercel",
          name: "Feedback connector",
          line: "/skill-feedback → an issue → the owner decides",
        },
        columns: [
          {
            tab: "01 · GitHub",
            title: "Where the skills live.",
            line: "A private repository on Suri's own account. Every change is a pull request that a person merges.",
          },
          {
            tab: "02 · Claude",
            title: "How it reaches the team.",
            line: "Suri's Claude organisation syncs every merged change within 30 minutes and installs it for everyone.",
          },
          {
            tab: "03 · Vercel",
            title: "How it gets better.",
            line: "A small connector turns a remark in the chat into a GitHub issue for the skill's owner, and the fix comes back merged.",
          },
        ],
        foot: ["Owned by Suri", "Versioned in GitHub", "Synced within 30 minutes"],
        alt: "One line runs from the GitHub repository, where the skills sit inside the ai-suri plugin inside the suri-ai-studio marketplace, into Suri's Claude organisation and fans out to the team in chat, Desktop, Cowork and Claude Code. A dashed loop runs back underneath through the feedback connector on Vercel into the repository.",
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
        labels: { done: "done" },
        phases: [
          {
            id: "before",
            label: "Before",
            when: "IT, once",
            steps: [
              {
                id: "github-org",
                title: "Give Suri its own GitHub organisation",
                line: "Private, with its whole history.",
                href: "https://github.com/account/organizations/new",
                done: "5 October",
              },
              {
                id: "model-keys",
                title: "Issue the model keys",
                line: "One Gemini key per person, via the password manager.",
                href: "https://aistudio.google.com/apikey",
              },
              {
                id: "vercel",
                title: "Create a Vercel Pro team",
                line: "Where the connector runs. Hobby is personal use only.",
                href: "https://vercel.com/dashboard",
              },
              {
                id: "google",
                title: "Create a project for the sign-in",
                line: "Audience Internal: only Suri accounts sign in.",
                href: "https://console.cloud.google.com/projectcreate",
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
                line: "Skills, user skills and code execution on.",
                href: "https://claude.ai/admin-settings/skills",
              },
              {
                id: "app",
                title: "Install the Claude GitHub App",
                line: "On this repository only.",
                who: "GitHub admin",
                href: "https://github.com/apps/claude",
              },
              {
                id: "sync",
                title: "Sync the repository",
                line: "Sync automatically on, access Not available.",
                href: "https://claude.ai/admin-settings/skills?tab=inventory",
              },
              {
                id: "access",
                title: "Give the plugin to the team",
                line: "Pilot group first, then Installed by default.",
                href: "https://claude.ai/admin-settings/skills?tab=inventory",
              },
              {
                id: "uploads",
                title: "Remove the uploaded zips",
                line: "Two copies of one skill fire unpredictably.",
                href: "https://claude.ai/admin-settings/skills",
              },
              {
                id: "connectors",
                title: "Switch on Monday and Figma",
                line: "For the creative team. Each person signs in once.",
                href: "https://claude.ai/settings/connectors",
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
                line: "One script walks through it: connector/scripts/setup.sh.",
                href: "https://github.com/suri-intelligence-architect/suri-ai-studio/blob/main/docs/FEEDBACK.md",
              },
              {
                id: "triage",
                title: "Switch the triage on",
                line: "Add its Claude token, then set TRIAGE_ENABLED to true.",
                href: "https://github.com/suri-intelligence-architect/suri-ai-studio/settings/secrets/actions",
              },
              {
                id: "connector",
                title: "Add the connector for everyone",
                line: "For the whole organisation, last, after the first test.",
                who: "Claude Owner",
                href: "https://claude.ai/settings/connectors",
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
                line: "A GitHub Action raises the version.",
                who: "Anyone",
                href: "https://github.com/suri-intelligence-architect/suri-ai-studio/pulls",
              },
              {
                id: "merge",
                title: "Merge it",
                line: "Everyone has it within 30 minutes.",
                who: "A person",
                href: "https://github.com/suri-intelligence-architect/suri-ai-studio/pulls",
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
