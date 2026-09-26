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
      kind: "anatomy",
      menuLabel: "De template",
      menuPrimary: true,
      badge: "Zes templates · 25 september",
      head: {
        eyebrow: "03 · Een template ontleed",
        title: { pre: "Elke template is", em: "dezelfde zes lagen." },
        sub: "Smurfen Halloween, Halloween Celebration, After Summer, Winter Celebration, Early Bird, Piet Piraat Show: zes bestanden, één bouwwijze. Wat vast ligt maakt de code. Wat varieert maakt het model, of de fotograaf. Wat mag en wat nooit mag, is het oordeel.",
      },
      rows: [
        {
          id: "plaat",
          label: "Plaat",
          body: "De foto of het gegenereerde beeld onder alles. Varieert per visual. Zonder tekst, zonder logo, zonder figuur, met een rustige zone waar het merk komt.",
        },
        {
          id: "logo",
          label: "Parklogo",
          body: "De tab met het logo van het park, in de kleur van dat park. Vast per park, geplaatst uit het merkbestand, nooit getekend.",
        },
        {
          id: "campagne",
          label: "Campagnemerk",
          body: "Het logo van de campagne. Vast per campagne, geschaald per formaat, als geleverd.",
        },
        {
          id: "tagline",
          label: "Tagline",
          body: "De pil met de regel copy. Varieert per taal en per markt, en gaat door de copycheck.",
        },
        {
          id: "datum",
          label: "Datum of prijs",
          body: "De regel met de periode, de korting of de prijs per persoon. Informatie, geen call to action.",
        },
        {
          id: "zone",
          label: "Veiligheidszone",
          body: "De verborgen laag die zegt waar het platform zijn eigen knoppen legt. Vast per formaat, en de waarheid over waar de plaat rustig moet blijven.",
        },
      ],
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
      kind: "anatomy",
      menuLabel: "De configuratie",
      menuPrimary: true,
      badge: "Eén stuk werk · zes vragen",
      head: {
        eyebrow: "05 · De configuratie",
        title: { pre: "Eén stuk werk,", em: "zes vragen eromheen." },
        sub: "Niet welk model, maar wat eromheen staat. Zes antwoorden per stuk werk, opgeschreven in jullie eigen bestanden; de designers en het campagneteam lezen er elk hun deel van.",
      },
      rows: [
        {
          id: "model",
          label: "Model",
          body: "Nano Banana Pro tekent de plaat en houdt de plek vast; GPT Image is de tweede mening; de edit-lane herstelt en verlengt. Eén veld, niet het midden.",
        },
        {
          id: "skill",
          label: "Skill",
          body: "De briefing voor een nieuwe collega: de huisstijl, de prompting per park, de copyregel, de checks. Tekst, in jullie repository, als plugin in jullie Claude.",
        },
        {
          id: "context",
          label: "Context",
          body: "Elke plek zoals ze bestaat, met een foto als waarheid. De zes templates, ontleed. De copy die het goed deed.",
        },
        {
          id: "bereik",
          label: "Bereik",
          body: "De Drive met de bronnen, de modellen op jullie sleutels, de galerij. Niet het platform, niet de publicatie: daar stopt het.",
        },
        {
          id: "review",
          label: "Review",
          body: "Elke plaat drie keer gegradeerd tegen de checks, daarna de contactsheet, daarna jullie. Een grade adviseert; een mens beslist.",
        },
        {
          id: "eigenaar",
          label: "Eigenaar",
          body: "De designers zijn de laatste poort op elk beeld; content op elke caption. Wij zijn er tot een datum, de setup daarna ook.",
        },
      ],
    },
    {
      id: "de-loop",
      kind: "steps",
      menuLabel: "De loop",
      head: {
        eyebrow: "06 · De loop",
        title: { pre: "Brief, wave, checks,", em: "en dan jij." },
        sub: "Wat het team krijgt is geen demo maar een run: tekenen, de set beoordelen, drie keer graderen, kiezen, in elkaar zetten, nakijken. Elke stap heeft een eigenaar.",
      },
      items: [
        {
          id: "loop",
          kicker: "01 · De run",
          name: "Van brief tot galerij",
          body: "De brief noemt plek, type en seizoen. Het model tekent twee versies per slot, de sheet toont de set, de grader leest elke plaat drie keer. Een mens kiest.",
          visual: {
            kind: "loop",
            stations: [
              { id: "brief", name: "Brief", by: "team" },
              { id: "wave", name: "Wave", by: "model" },
              { id: "grade", name: "Grade", by: "model" },
              { id: "pick", name: "Pick", by: "team" },
            ],
            hub: "de plaat",
            fix: ["Twee draws per slot", "Drie grades per plaat"],
          },
        },
        {
          id: "check",
          kicker: "02 · De check",
          name: "De rubriek leest de plaat",
          body: "Achtentwintig checks in gewoon Nederlands. Klopt de plek met de foto? Staat er tekst of een figuur in? Is de vrije zone vrij? De grader adviseert tot het team dertig keer meekeek.",
          visual: {
            kind: "scan",
            image: {
              src: "/arcs/plopsa/plate-check.jpg",
              alt: "Een gegenereerde plaat van de chalet, onder de checks",
              width: 1600,
              height: 2000,
            },
            fix: ["Chalet · tall plate", "Eerste wave · nano"],
            checks: [
              { id: "plek", key: "Plek", reading: "Zoals op de foto", x: 0.5, y: 0.18 },
              { id: "tekst", key: "Tekst", reading: "Geen tekst, geen logo", x: 0.22, y: 0.38 },
              { id: "figuur", key: "Figuur", reading: "Geen figuur", x: 0.7, y: 0.52 },
              { id: "zone", key: "Zone", reading: "Bovenste derde vrij", x: 0.5, y: 0.78 },
            ],
            verdict: "Advies · de designer beslist",
          },
        },
        {
          id: "overdracht",
          kicker: "03 · De overdracht",
          name: "De setup blijft, wij niet",
          body: "De skills, de checks en de scripts staan in jullie eigen repository en als plugin in jullie Claude-organisatie. De sprint eindigt op een datum; de setup niet.",
          visual: {
            kind: "handover",
            inner: "de setup",
            outer: "de sprint",
            node: "jullie",
            fix: ["Plugin in Claude", "Repository van Plopsa"],
          },
        },
      ],
    },
    {
      id: "live",
      kind: "media",
      menuLabel: "Live",
      menuPrimary: true,
      head: {
        eyebrow: "07 · Live, in het lokaal",
        title: { pre: "Eén campagnefamilie", em: "door de loop." },
        sub: "Twintig minuten. Een brief voor de chalets, de prompt die eruit rolt, een wave, de sheet, drie grades, een pick, en de composite met logo en datum in elk formaat. Wat er fout gaat laten we staan: dat is de les.",
      },
      media: {
        type: "image",
        src: "/arcs/plopsa/wave-01-contact-sheet.jpg",
        alt: "De contactsheet van de eerste wave: dertig platen van vijf plekken in drie types",
      },
      caption: {
        label: "Wave 01 · kalibratie",
        role: "Vijf plekken, drie types, twee draws per slot",
        meta: "26 september 2026 · getekend op de eigen foto's als referentie",
        sourceLabel: "De contactsheet",
      },
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
