import type { ArcDef } from "../types";

/**
 * Plopsa, workshop III, as an arc: the page the room runs on Monday
 * 28 September 2026 and the handout it prints to.
 *
 * Twelve beats, one idea per viewport, in the client's own language. The
 * first two workshops (30 July) were tool sessions; this one builds the
 * setup that makes their campaign visuals at volume, and hands it over as
 * a plugin their own Claude organisation installs.
 *
 * ⚠ IT IS THE CLIENT'S PAGE. It may name their parks, their campaign
 * families and the rule their designer gave; it prints no fee and no
 * fleet vocabulary. Their artwork is never shown; the pictures are the
 * plates the setup drew of their own places, and the templates read as a
 * layer tree.
 */
export const PLOPSA_WORKSHOP_ARC: ArcDef = {
  slug: "plopsa-workshop",
  format: "workshop",
  client: "plopsa",
  kind: "workshop",
  status: "running",
  // Filed the day the page was made (ADR-118); the workshop itself is 28 September, in the copy.
  date: "2026-09-26",
  cardTitle: "Plopsa · workshop III",
  cardLede:
    "Van beelden maken naar een setup die beelden maakt: de campagneplaat, de checks en de plugin.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Plopsa · Workshop III · 28 september 2026",
    title: { pre: "Van beelden maken naar", em: "een setup die beelden maakt." },
    lede: "Zes templates, vijf plekken, drie soorten platen, één regel over copy. Vandaag bouwen we de setup die jullie campagnebeelden in elk formaat maakt, met het juiste logo, en die jullie zelf draaien.",
    actions: [
      { id: "start", label: "Waar we staan", href: "#waar-we-staan", primary: true },
      { id: "live", label: "Live", href: "#live" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    /* The homepage's own key visual, delivered the landing's way (ADR-075):
       the gateway plate, theme-dependent, which earns the route its
       `HERO_ROUTES` row and drops the static preload. The curtain is
       declared, as on the proposals (ADR-078 U1). */
    plate: "gateway",
    curtain: true,
  },
  meta: {
    title: "Plopsa · workshop III — Thoughtform",
    description:
      "De setup die Plopsa's campagnebeelden op schaal maakt: de plaat, de checks, de composite en de plugin.",
  },
  sections: [
    {
      id: "waar-we-staan",
      kind: "cards",
      menuLabel: "Waar we staan",
      menuPrimary: true,
      columns: 3,
      head: {
        eyebrow: "01 · Waar we staan",
        title: { pre: "Twee sessies achter ons,", em: "één vraag voor ons." },
        sub: "In juli leerden we prompten en zetten we Claude op. Het huiswerk was: één skill per workflow. Vandaag beginnen we bij wat er is.",
      },
      cards: [
        {
          id: "juli-1",
          n: "01",
          kicker: "30 juli · sessie I",
          title: "Beeld en video, hands-on",
          body: "Hoe een beeldmodel navigeert in plaats van gehoorzaamt, waarom een referentie alles is, en waar het model steevast fout gaat: tekst, logo's, figuren.",
        },
        {
          id: "juli-2",
          n: "02",
          kicker: "30 juli · sessie II",
          title: "Claude en de eerste skills",
          body: "Een skill is een briefing voor een nieuwe collega. De huisstijl en de prompting per park staan sindsdien als skill klaar.",
        },
        {
          id: "vandaag",
          n: "03",
          kicker: "28 september · sessie III",
          title: "De setup, en wie hem draait",
          body: "Geen tool erbij. Een werkwijze die jullie eigen modellen, jullie eigen sleutels en jullie eigen oordeel aan elkaar knoopt, en die in jullie Claude-organisatie geïnstalleerd staat als plugin.",
        },
      ],
    },
    {
      id: "de-vraag",
      kind: "interstitial",
      variant: "quote",
      eyebrow: "02 · De vraag",
      line: {
        pre: "Visuals en advertenties",
        em: "aan de lopende band,",
        post: "in verschillende formaten, met de juiste logo's en branding.",
      },
      subline:
        "Dat is de opdracht. De vraag is niet welk model, maar wat vast ligt, wat varieert, en wie oordeelt.",
      attribution: "De briefing van 22 september 2026",
    },
    {
      id: "een-psd-ontleed",
      kind: "flow",
      menuLabel: "De template",
      menuPrimary: true,
      head: {
        eyebrow: "03 · Een template ontleed",
        title: { pre: "Van één template naar", em: "elke taal." },
        sub: "Zes templates, één bouwwijze: een plaat, het parklogo, het campagnemerk, een tagline, een datum of een prijs. De setup tekent de plaat; de code zet de rest, per taal en per formaat, uit jullie eigen bestanden.",
      },
      brief: {
        label: "De template",
        fields: [
          "Plaat",
          "Parklogo",
          "Campagnemerk",
          "Tagline",
          "Datum",
          "Prijs",
          "Taal",
          "Vrije zone",
        ],
      },
      renders: {
        label: "Wat de setup tekent",
        images: [
          {
            src: "/arcs/plopsa/plate-chalet-tall.webp",
            alt: "Een gegenereerde plaat van een Studio 100-chalet",
          },
          {
            src: "/arcs/plopsa/plate-smurfendorp-tall.webp",
            alt: "Een gegenereerde plaat van het smurfendorp",
          },
          {
            src: "/arcs/plopsa/plate-hotel-tall.webp",
            alt: "Een gegenereerde plaat van het Theater Hotel",
          },
        ],
      },
      scale: {
        label: "Elke taal",
        markets: ["NL", "FR", "DE", "EN"],
      },
      steps: ["Tekenen", "Opmaken"],
    },
    {
      id: "krea-of-setup",
      kind: "cards",
      menuLabel: "Krea of setup",
      columns: 2,
      head: {
        eyebrow: "04 · Twee wegen",
        title: { pre: "Krea nodes naast", em: "een eigen setup." },
        sub: "Krea is goed, en niemand verkoopt een beter model. Nodes tonen mooi hoe een pijplijn loopt. De vraag is waar jullie oordeel terechtkomt: in hun account, of in jullie eigen bestanden.",
      },
      cards: [
        {
          id: "krea",
          n: "01",
          kicker: "Krea nodes",
          title: "Een grafiek van modelaanroepen",
          body: "Je ziet de stappen en klikt ze aan elkaar. Elke stap kost een opslag op de API-prijs. Er zit geen merkoordeel in, geen check op de plek, geen copyregel, geen verslag van wat de reviewer zei. Elke iteratie upload je het origineel opnieuw.",
        },
        {
          id: "setup",
          n: "02",
          kicker: "Eigen setup",
          title: "Dezelfde modellen, op jullie sleutels",
          body: "Een skill als briefing, een rubriek als oordeel, elke plaat drie keer gegradeerd, jullie als laatste poort, en alles in jullie eigen repository. Wat jullie betalen is een team dat de setup zonder ons draait, en oordeel dat van jullie blijft.",
        },
      ],
      tips: [
        {
          id: "tab",
          tag: "TIP · KREA",
          body: "Wil het team Krea erbij houden? Dat is een extra tabblad. De setup vraagt geen tool weg.",
        },
        {
          id: "kost",
          tag: "TIP · KOST",
          body: "In juli lag het al op tafel: één cent per aanroep wordt vijf cent achter een wrapper. Op volume is dat het verschil tussen een abonnement en een setup.",
        },
      ],
    },
    {
      id: "configuratie",
      kind: "configuration",
      menuLabel: "De configuratie",
      menuPrimary: true,
      head: {
        eyebrow: "05 · Wat het team bezit",
        title: { pre: "Eén setup,", em: "van jullie." },
        sub: "Eén laag die het team draait en blijft uitbouwen als wij weg zijn. Het werk schrijft de laag, de automatisatie draait erop. Kies een team om te zien hoe dezelfde laag anders gelezen wordt.",
      },
      owner: "Van Plopsa",
      layer: [
        { id: "regels", tag: "Regels", name: "wat nooit getekend wordt" },
        { id: "plekken", tag: "Plekken", name: "elke plek zoals ze bestaat" },
        { id: "merk", tag: "Merk", name: "logo's, kleuren en fonts" },
        { id: "checks", tag: "Checks", name: "wie het bevestigt" },
      ],
      seam: {
        adoption: "Het team leert op het eigen werk en schrijft op wat goed is.",
        automation: "De laag draait in de tools die ze al hebben, en geeft de tijd terug.",
      },
      teams: [
        {
          id: "creative",
          name: "Creative",
          work: "platen en formaten",
          layers: ["regels", "plekken", "merk", "checks"],
          owner: "De designers, de laatste poort",
          runs: "De visuals-skill, op Plopsa's sleutels",
          bar: "De plek klopt, geen tekst, geen figuur",
          reach: "De templates, de plekken en het merk",
          where: "Claude, met beeldgeneratie",
        },
        {
          id: "campagne",
          name: "Campagne",
          work: "briefing en copy",
          layers: ["regels", "merk"],
          owner: "Content, op elke caption",
          runs: "De copy-skill en de merkskill",
          bar: "Geen call to action op kindercontent",
          reach: "De copy die het goed deed",
          where: "Claude",
        },
      ],
      next: { name: "Web", work: "pagina's uit de laag" },
      kickers: ["Eén configuratie", "De mensen draaien het", "Geen leverancier ertussen"],
      labels: {
        layer: "De laag",
        adoption: "Adoptie",
        automation: "Automatisatie",
        configuration: "de configuratie",
        owner: "Wie het bezit",
        runs: "Wat het draait",
        bar: "De lat",
        reach: "Wat het bereikt",
        where: "Waar het draait",
      },
    },
    {
      id: "de-loop",
      kind: "list-groups",
      menuLabel: "De loop",
      layout: "columns",
      head: {
        eyebrow: "06 · De loop",
        title: { pre: "Brief, wave, checks,", em: "en dan jij." },
        sub: "Eén loop, op één campagnefamilie. Wij zetten hem vandaag op en draaien hem mee tot jullie hem zonder ons draaien.",
      },
      groups: [
        {
          id: "run",
          label: "De loop, op één familie",
          blurb: "De hospitality-familie, de chalets. Elke andere familie draait op dezelfde loop.",
          items: [
            {
              id: "brief",
              tag: "Brief",
              name: "De plek, het type, het seizoen",
              body: "Eén regel in de brief. De foto van de plek gaat altijd eerst mee als referentie.",
            },
            {
              id: "wave",
              tag: "Wave",
              name: "Twee versies per slot",
              body: "Vijf plekken, drie soorten platen, in drie minuten getekend.",
            },
            {
              id: "checks",
              tag: "Checks",
              name: "Drie keer gegradeerd",
              body: "Achtentwintig checks in gewoon Nederlands. De grader adviseert, hij beslist niet.",
            },
            {
              id: "compositie",
              tag: "Compositie",
              name: "Logo, tagline en datum, in elk formaat",
              body: "Uit jullie eigen bestanden. Op kindercontent weigert ze een call to action.",
            },
          ],
        },
        {
          id: "mensen",
          label: "Wie beslist, en waar",
          blurb: "Wie op welke stap de laatste poort is.",
          items: [
            {
              id: "designers",
              tag: "Plopsa",
              name: "De designers, de laatste poort op elk beeld",
              body: "Kiezen in de galerij en zeggen waarom. Wat twee keer gezegd wordt, wordt een check.",
              meta: "Elke wave",
            },
            {
              id: "content",
              tag: "Plopsa",
              name: "Content, op elke caption",
              body: "Beslist over de copyregel en de call to action per funnelstap.",
              meta: "Elke campagne",
            },
            {
              id: "it",
              tag: "Plopsa",
              name: "IT, op de plugin en de sleutels",
              body: "Installeert de plugin voor het team en beheert de twee API-sleutels.",
              meta: "Eén keer, dan per release",
            },
            {
              id: "vince",
              tag: "Thoughtform",
              name: "Vince, op de setup en de checks",
              body: "Zet de loop op en schrijft mee wat jullie terugsturen. Tegen week vier kijkt hij toe.",
              meta: "Vier weken",
            },
          ],
        },
      ],
    },
    {
      id: "live",
      kind: "cards",
      menuLabel: "Live",
      menuPrimary: true,
      // Two, not three: at the room's 1280 the house grid is two columns,
      // and a third card would sit alone under the fold.
      columns: 2,
      head: {
        eyebrow: "07 · Live, in het lokaal",
        title: { pre: "Eén campagnefamilie", em: "door de loop." },
        sub: "Twintig minuten: een brief, de prompt, een wave, drie grades, een pick, en de compositie in elk formaat. Dit kwam er uit de eerste wave, getekend op jullie eigen foto's.",
      },
      cards: [
        {
          id: "heidi",
          n: "01",
          kicker: "Brede plaat",
          image: {
            src: "/arcs/plopsa/plate-heidi-wide.webp",
            alt: "Een gegenereerde brede plaat van Heidi The Ride",
          },
          title: "Heidi The Ride",
          body: "De houten structuur en de afdaling zoals op de foto. Links rust voor het merk en de titel.",
          metaRows: [
            { label: "Oordeel", value: "Pass, drie keer" },
            { label: "Model", value: "Nano Banana Pro" },
          ],
        },
        {
          id: "chalet",
          n: "02",
          kicker: "Brede plaat",
          image: {
            src: "/arcs/plopsa/plate-chalet-wide.webp",
            alt: "Een gegenereerde brede plaat van een Studio 100-chalet",
          },
          title: "Studio 100 Chalets",
          body: "De blauwe planken en de luiken met het hart. De familie die we vandaag live doorlopen.",
          metaRows: [
            { label: "Oordeel", value: "Pass, drie keer" },
            { label: "Model", value: "Nano Banana Pro" },
          ],
        },
      ],
    },
    {
      id: "de-regels",
      kind: "list-groups",
      menuLabel: "De regels",
      layout: "plates",
      head: {
        eyebrow: "08 · De regels, geëncodeerd",
        title: { pre: "Elke regel is", em: "één check." },
        sub: "Wat jullie in juli en in september zeiden, staat nu als tekst in de setup. Niet als geheugen van één persoon, maar als regel die elke plaat en elke caption langs moet.",
      },
      groups: [
        {
          id: "beeld",
          label: "Beeld",
          blurb: "Wat een plaat mag zijn",
          items: [
            {
              id: "plek",
              tag: "GATE",
              name: "De plek zoals ze bestaat",
              body: "Een attractie of gebouw verschijnt alleen zoals het gebouwd is, met een foto als referentie. Geen foto, geen beeld.",
            },
            {
              id: "schoon",
              tag: "GATE",
              name: "Schone plaat",
              body: "Geen tekst, geen logo, geen badge, geen call to action in het beeld. Dat komt uit het bestand, in de composite.",
            },
            {
              id: "figuur",
              tag: "GATE",
              name: "Geen figuur",
              body: "Geen Studio 100-figuur, geen mascotte, geen kostuum. Die worden geplaatst uit het officiële materiaal.",
            },
          ],
          foot: { label: "Faalt", lines: ["Het beeld wordt niet bewaard. Opnieuw tekenen."] },
        },
        {
          id: "copy",
          label: "Copy",
          blurb: "Wat onder een beeld mag staan",
          items: [
            {
              id: "cta",
              tag: "REGEL",
              name: "Geen call to action op kindercontent",
              body: "Alle content met een Studio 100-figuur, op foto of video, ook een K3-show. Geen Beleef, Ontdek, Ga mee, Zien we jullie daar.",
            },
            {
              id: "info",
              tag: "OK",
              name: "Datum, plaats en prijs",
              body: "Informatie is geen uitnodiging. Van 17 oktober tot en met 8 november mag altijd.",
            },
            {
              id: "vraag",
              tag: "TWIJFEL",
              name: "Tag iemand, swipe, wie",
              body: "Jullie eigen posts doen het. Of dat als call to action geldt, beslissen jullie vandaag; tot dan meldt de check het als twijfel.",
            },
          ],
          foot: { label: "Faalt", lines: ["De composite schrijft het bestand niet weg."] },
        },
        {
          id: "merk",
          label: "Merk",
          blurb: "Wat de composite zelf doet",
          items: [
            {
              id: "logo",
              tag: "CODE",
              name: "Logo per park, op contrast",
              body: "Wit op foto, parkkleur op crème, zwart waar de parkkleur wegvalt. Uit het bestand, nooit hertekend.",
            },
            {
              id: "zone",
              tag: "CODE",
              name: "De vrije zone",
              body: "Boven 30 procent bij een staand beeld, links 45 procent bij een liggend beeld. De template's veiligheidszone is de waarheid.",
            },
            {
              id: "font",
              tag: "CODE",
              name: "Semplicita en Proxima Nova",
              body: "Uit de licentie op de laptop. Zonder licentie zegt elke composite stand-in op zijn gezicht.",
            },
          ],
          foot: {
            label: "Levert",
            lines: ["Elk formaat, elke taal, elk park, uit één goedgekeurde plaat."],
          },
        },
      ],
    },
    {
      id: "zelf-doen",
      kind: "cards",
      menuLabel: "Zelf doen",
      columns: 4,
      head: {
        eyebrow: "09 · Zelf doen",
        title: { pre: "Een uur aan het stuur,", em: "in jullie eigen bestanden." },
        sub: "Niet kijken maar doen. Vier oefeningen, elk op een echt bestand, elk met een eigen resultaat dat in de setup blijft.",
      },
      cards: [
        {
          id: "check",
          n: "01",
          kicker: "15 min",
          title: "Schrijf één check",
          body: "Kies een fout die je in juli zag. Schrijf in gewoon Nederlands wat er fout aan is. De grader leest die zin bij de volgende wave.",
        },
        {
          id: "wave",
          n: "02",
          kicker: "15 min",
          title: "Draai één wave",
          body: "Kies een plek en een type. Twee draws. Kijk naar de sheet vóór je naar een beeld kijkt.",
        },
        {
          id: "verdict",
          n: "03",
          kicker: "15 min",
          title: "Decodeer één verdict",
          body: "Zeg wat je van een plaat vindt, in je eigen woorden. Die woorden worden een regel als je ze twee keer zegt.",
        },
        {
          id: "copy",
          n: "04",
          kicker: "15 min",
          title: "Grade één caption",
          body: "Schrijf een caption voor een K3-post en laat de copycheck erover gaan. Herschrijf tot het door is.",
        },
      ],
    },
    {
      id: "wat-it-installeert",
      kind: "cards",
      menuLabel: "IT",
      columns: 3,
      head: {
        eyebrow: "10 · Wat IT installeert",
        title: { pre: "Drie dingen,", em: "in deze volgorde." },
        sub: "De plugin, de sleutels en de organisatie. Alles in naam van Plopsa, niets in de onze. Vandaag installeren we de plugin als zip; na het gesprek met IT synchroniseert hij vanuit GitHub.",
      },
      cards: [
        {
          id: "plugin",
          n: "01",
          kicker: "Claude Team",
          title: "De plugin",
          body: "Organisatie-instellingen, Plugins en skills, Toevoegen. Vandaag als zip per persoon; daarna als GitHub-repository die vanzelf bijwerkt, en Installed by default voor het team.",
        },
        {
          id: "github",
          n: "02",
          kicker: "GitHub",
          title: "Een eigen account",
          body: "De repository met de plugins staat privé onder een account van Plopsa, zodat de Claude-beheerder hem kan koppelen. Tot dan staat hij bij ons.",
        },
        {
          id: "keys",
          n: "03",
          kicker: "Sleutels",
          title: "Twee API-sleutels",
          body: "Een Gemini-sleutel en een OpenAI-sleutel op naam van Plopsa, in een .env op de laptop die waves draait. Nooit in de repository. Gefactureerd door de leverancier, in de lage honderden per maand.",
        },
      ],
      footnote: "De volledige stappen staan in docs/SETUP.md in de repository.",
    },
    {
      id: "wat-volgt",
      kind: "close",
      menuLabel: "Wat volgt",
      head: {
        eyebrow: "11 · Wat volgt",
        title: { pre: "Vier weken,", em: "en dan draait het bij jullie." },
        sub: "Week 1: de eerste campagne door de loop, met de designers aan de knoppen. Week 2: de copy en de campagneteams erbij. Week 3: de tweede familie, en de checks die inmiddels gelden. Week 4: de overdracht, met een datum. Daarna een check-in na één maand en na drie.",
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
