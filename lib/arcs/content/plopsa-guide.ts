import type { ArcDef } from "../types";

/**
 * PLOPSA, DE SETUP IN DE PRAKTIJK: the workshop page's practical companion,
 * in the client's own language.
 *
 * Owner, 2026-10-07: "for both suri and plopsa i want a simple page that
 * explains very clearly and concisely the steps of plugins / marketplace /
 * skill / github and vercel to host api keys / route feedback". The same
 * beats as `suri-guide` (ADR-151 U1: the callout, then the `guide` kind's map,
 * checklist, matrix and pipeline), with Plopsa's own facts: two plugins, a
 * repository still under Thoughtform's account until Plopsa has its own, and
 * a feedback path that is drawn as what follows, because it is not built yet.
 *
 * ⚠ EVERY STEP IS THE REPOSITORY'S OWN, read from `plopsa-ai-studio` on
 * 7 October 2026 (`docs/SETUP.md`, `docs/CHANGING-A-RULE.md`, `README.md`,
 * `.claude-plugin/marketplace.json`) and the workshop page's IT beat. The
 * feedback beat is the kit's path (the connector every repository built from
 * the kit carries), marked "Volgt" until Plopsa's own runs.
 *
 * ⚠ IT IS THE CLIENT'S PAGE, IN FLEMISH. People by role; no price, no key,
 * no fleet word; an image is a "beeld", never a "plaat" (owner, 2026-09-28);
 * no title opens on a count or pivots on "niet X maar Y" (ADR-130 U2).
 */
export const PLOPSA_GUIDE_ARC: ArcDef = {
  slug: "plopsa-guide",
  leaf: "guide",
  format: "workshop",
  client: "plopsa",
  kind: "workshop",
  cardChip: "guide",
  status: "running",
  date: "2026-10-07",
  cardTitle: "Plopsa · de setup in de praktijk",
  cardLede:
    "De plugins, de marketplace, GitHub en Vercel: wie wat instelt, waar de sleutels staan en hoe feedback bij de eigenaar van een skill komt.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Plopsa · De setup in de praktijk",
    title: { pre: "Van de repository", em: "tot in ieders Claude." },
    lede: "De onderdelen, de stappen en wie ze zet, van de plugin tot de dienst die de sleutels bewaart en feedback doorstuurt.",
    actions: [
      { id: "start", label: "De stappen", href: "#stappen", primary: true },
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
    title: "Plopsa · De setup in de praktijk",
    description:
      "Hoe Plopsa's Claude-plugins bij het team komen: de skills, de marketplace, GitHub, de sleutels, en de weg die een opmerking aflegt naar de eigenaar van een skill.",
  },
  sections: [
    /* ── 01 · Waarom ──────────────────────────────────────────────────── */
    {
      id: "waarom",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "01 · Waarom het zo gebouwd is",
      menuLabel: "Waarom",
      line: {
        pre: "De tools veranderen elke maand.",
        em: "Het oordeel blijft in jullie bestanden.",
      },
      subline:
        "Daarom draait de setup op Plopsa's eigen accounts, staat hij in gewone tekstbestanden, en wordt hij beter door wie hem gebruikt.",
    },

    /* ── 02 · De kaart: het systeem, en wat elk woord betekent ────────── */
    {
      id: "onderdelen",
      kind: "guide",
      menuLabel: "Onderdelen",
      menuPrimary: true,
      head: {
        eyebrow: "02 · De onderdelen",
        title: { pre: "Hoe de onderdelen", em: "in elkaar passen." },
        sub: "De skills staan in GitHub. Claude brengt ze naar het team. Feedback komt terug via één kleine dienst op Vercel.",
      },
      guide: {
        view: "map",
        repo: {
          pin: 4,
          label: "GitHub",
          name: "Privé-repository, nu nog bij Thoughtform",
          marketplace: {
            pin: 3,
            label: "Marketplace",
            name: "plopsa-plugins",
            plugins: [
              {
                pin: 2,
                label: "Plugin · voor iedereen",
                name: "plopsa",
                skills: { pin: 1, names: ["brand", "copy", "menuprijzen", "visuals"] },
              },
              {
                pin: 2,
                label: "Plugin · Creative-team",
                name: "creative",
                skills: { pin: 1, names: ["mother"] },
              },
            ],
          },
        },
        org: {
          pin: 5,
          label: "Claude",
          name: "De organisatie van Plopsa",
          line: "Synchroniseert de plugins en geeft ze aan wie ze nodig heeft.",
        },
        team: {
          label: "Het team",
          name: "Waar je ermee werkt",
          surfaces: ["Chat", "Desktop", "Cowork", "Claude Code"],
        },
        service: {
          pin: 6,
          label: "Vercel",
          name: "Feedbackconnector",
          line: "Dient opmerkingen in als GitHub-issue, en bewaart zijn eigen sleutels.",
          state: "Volgt",
        },
        arrows: { sync: "Sync", reach: "Geïnstalleerd", remark: "/skill-feedback", issue: "Issue" },
        terms: [
          {
            n: 1,
            term: "Skill",
            line: "Een stuk werk dat is uitgeschreven: de stappen, de context, goede en foute voorbeelden, en de checks. Claude gebruikt hem wanneer een vraag erom vraagt.",
          },
          {
            n: 2,
            term: "Plugin",
            line: "De skills van een team in één pakket. Plopsa heeft er twee: plopsa met wat elk team deelt, en creative met de mother die het werk van het Creative-team in volgorde draait.",
          },
          {
            n: 3,
            term: "Marketplace",
            line: "De lijst van plugins en hun versies die Claude leest. Een hogere versie zegt Claude dat er iets nieuws is.",
          },
          {
            n: 4,
            term: "GitHub",
            line: "De privé-repository waar alles in staat. Elke wijziging is een pull request, en een mens voegt hem samen.",
          },
          {
            n: 5,
            term: "Claude-organisatie",
            line: "Haalt een samengevoegde wijziging binnen 30 minuten op en geeft elke plugin aan wie hem nodig heeft.",
          },
          {
            n: 6,
            term: "Vercel",
            line: "Draait straks de feedbackconnector, het enige onderdeel dat buiten Claude draait, en bewaart zijn sleutels.",
          },
        ],
        alt: "De GitHub-repository bevat de marketplace plopsa-plugins, met de plugins plopsa en creative en hun skills. Die synchroniseert naar de Claude-organisatie van Plopsa, die ze installeert voor het team in de chat, Desktop, Cowork en Claude Code. Een opmerking van het team gaat straks via de feedbackconnector op Vercel als issue terug naar de repository.",
      },
    },

    /* ── 03 · De stappen ───────────────────────────────────────────────── */
    {
      id: "stappen",
      kind: "guide",
      menuLabel: "De stappen",
      menuPrimary: true,
      head: {
        eyebrow: "03 · De stappen",
        title: { pre: "De setup,", em: "in volgorde." },
        sub: "Elke stap één keer, door de rol ernaast. Tot de koppeling er is, installeert het team de plugins als zip.",
      },
      guide: {
        view: "checklist",
        labels: { who: "Wie", where: "Waar", done: "Klaar" },
        phases: [
          {
            id: "vooraf",
            label: "Vooraf",
            when: "IT, eenmalig",
            steps: [
              {
                id: "github-account",
                title: "Een GitHub-account voor Plopsa",
                line: "De repository verhuist van ons account naar dat van Plopsa, met heel zijn geschiedenis.",
                who: "IT",
              },
              {
                id: "model-keys",
                title: "De modelsleutels uitgeven",
                line: "Een Gemini- en een OpenAI-sleutel op naam van Plopsa, via de wachtwoordmanager.",
                who: "IT",
              },
            ],
          },
          {
            id: "koppelen",
            label: "Koppelen",
            when: "Een Claude-eigenaar, eenmalig",
            steps: [
              {
                id: "app",
                title: "De Claude GitHub App installeren",
                line: "Alleen op deze repository. Keur webhooks, lezen en schrijven, goed als GitHub erom vraagt.",
                who: "GitHub-beheerder",
              },
              {
                id: "sync",
                title: "De repository koppelen",
                line: "De eerste synchronisatie start vanzelf en duurt tot 30 minuten.",
                who: "Claude-eigenaar",
                where: ["Organization settings", "Plugins", "Add plugins", "GitHub"],
              },
              {
                id: "default",
                title: "De plugins aan het team geven",
                line: "Installed by default: plopsa voor iedereen, creative voor het Creative-team.",
                who: "Claude-eigenaar",
              },
              {
                id: "auto",
                title: "Sync automatically aanzetten",
                line: "Zo komt elke samengevoegde wijziging vanzelf bij iedereen. Vraagt beheerderstoegang tot de repository op GitHub.",
                who: "Claude-eigenaar",
              },
              {
                id: "zips",
                title: "De zips weghalen",
                line: "Twee kopieën van één skill werken onvoorspelbaar, en een zip werkt zichzelf nooit bij.",
                who: "Claude-eigenaar",
              },
            ],
          },
          {
            id: "feedback-setup",
            label: "Feedback",
            when: "Later, IT met de beheerder",
            steps: [
              {
                id: "vercel",
                title: "Een Vercel Pro-team",
                line: "Daar draait de connector. Het gratis plan is enkel voor persoonlijk gebruik.",
                who: "IT",
              },
              {
                id: "aanmelding",
                title: "Een project voor de aanmelding",
                line: "Binnen jullie eigen bedrijfsaccounts, zodat enkel Plopsa-accounts zich kunnen aanmelden.",
                who: "IT",
              },
              {
                id: "connector",
                title: "De connector voor iedereen toevoegen",
                line: "Voor de hele organisatie, op het adres van de connector gevolgd door /mcp. Als laatste, na de eerste test.",
                who: "Claude-eigenaar",
              },
            ],
          },
          {
            id: "daarna",
            label: "Daarna",
            when: "Bij elke wijziging",
            steps: [
              {
                id: "pr",
                title: "Een pull request openen",
                line: "Een wijziging in het bestand dat de regel bezit. Een GitHub Action verhoogt de versie.",
                who: "Iemand van het team",
              },
              {
                id: "merge",
                title: "Samenvoegen",
                line: "Claude zet de nieuwe versie binnen 30 minuten bij iedereen.",
                who: "Een mens",
              },
            ],
          },
        ],
      },
    },

    /* ── 04 · De sleutels ──────────────────────────────────────────────── */
    {
      id: "sleutels",
      kind: "guide",
      menuLabel: "De sleutels",
      menuPrimary: true,
      head: {
        eyebrow: "04 · De sleutels",
        title: { pre: "Waar elke", em: "sleutel staat." },
        sub: "Geen enkele sleutel staat ooit in de repository of in een chat. De skills lezen een sleutel bij naam en tonen hem nooit.",
      },
      guide: {
        view: "matrix",
        labels: { key: "Sleutel", lives: "staat hier", never: "nooit" },
        places: [
          { id: "env", name: ".env op de laptop" },
          { id: "vercel", name: "Instellingen van Vercel" },
          { id: "secrets", name: "Secrets van GitHub" },
          { id: "repo", name: "De repository", never: true },
          { id: "chat", name: "Een chat of bericht", never: true },
        ],
        keys: [
          {
            id: "model",
            name: "Modelsleutels",
            line: "Gemini en OpenAI, voor de beelden. De leverancier factureert per aanroep.",
            who: "IT geeft ze uit",
            at: 0,
          },
          {
            id: "connector",
            name: "Sleutels van de connector",
            line: "De aanmelding, de sleutel van de GitHub App, het geheim waarmee hij tekent.",
            who: "De beheerder, zodra hij draait",
            at: 1,
          },
          {
            id: "token",
            name: "Token van de triage",
            line: "Het Claude-token waarop de feedbacktriage draait.",
            who: "Wie het bezit, vanuit een terminal",
            at: 2,
          },
        ],
      },
    },

    /* ── 05 · Feedback (volgt) ─────────────────────────────────────────── */
    {
      id: "feedback",
      kind: "guide",
      menuLabel: "Feedback",
      menuPrimary: true,
      head: {
        eyebrow: "05 · Feedback",
        title: { pre: "Hoe een opmerking bij", em: "de eigenaar komt." },
        sub: "Zo werkt het zodra de connector bij Plopsa draait. Niemand heeft er een GitHub-account voor nodig.",
      },
      guide: {
        view: "pipeline",
        labels: { person: "Een mens", machine: "Loopt vanzelf" },
        state: "Volgt",
        stations: [
          {
            id: "zeg",
            actor: "Iedereen bij Plopsa",
            by: "person",
            title: "Typt /skill-feedback",
            line: "Zegt wat er misging, leest de exacte tekst, en zegt ja. Meldt zich één keer aan.",
          },
          {
            id: "issue",
            actor: "Connector · Vercel",
            by: "machine",
            title: "Dient een issue in",
            line: "Toont eerst gelijkaardige opmerkingen, zodat een herhaling als extra stem telt.",
          },
          {
            id: "label",
            actor: "Triage · GitHub",
            by: "machine",
            title: "Labelt het",
            line: "Leest de opmerking naast de bestanden van de skill en reageert. Wijzigt geen bestand.",
          },
          {
            id: "beslist",
            actor: "De eigenaar",
            by: "person",
            title: "Beslist",
            line: "Fixen, later, sluiten, of doorsturen naar een developer.",
          },
          {
            id: "voorstel",
            actor: "Triage · GitHub",
            by: "machine",
            title: "Stelt de fix voor",
            line: "De kleinste wijziging, met de test die de fout had gevangen.",
          },
          {
            id: "samen",
            actor: "Een mens",
            by: "person",
            title: "Voegt samen",
            line: "De versie gaat omhoog.",
          },
        ],
        close:
          "Claude zet de fix binnen 30 minuten bij iedereen. Tot de connector draait: zeg het tegen ons, of pas de regel aan via een pull request (docs/CHANGING-A-RULE.md).",
      },
    },

    /* ── 06 · Close ────────────────────────────────────────────────────── */
    {
      id: "meer",
      kind: "close",
      menuLabel: "Alle stappen",
      head: {
        eyebrow: "06 · Alle stappen",
        title: { pre: "Elke stap staat ook in", em: "de repository." },
        sub: "docs/SETUP.md voor de plugins, docs/CHANGING-A-RULE.md voor een regel die anders moet.",
      },
      actions: [
        {
          id: "mail",
          label: "vince@thoughtform.co",
          href: "mailto:vince@thoughtform.co",
          primary: true,
        },
      ],
      footerLine: "Thoughtform · Antwerpen · 2026",
      signature: "Vince Buyssens",
    },
  ],
};
