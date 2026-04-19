"use client";

const STATIONS = [
  { id: "hero", number: "01", label: "Interface", screenLabel: "INTERFACE" },
  {
    id: "definition",
    number: "02",
    label: "Thoughtform",
    screenLabel: "THOUGHTFORM",
  },
  {
    id: "continuum",
    number: "03",
    label: "Continuum",
    screenLabel: "CONTINUUM",
  },
  { id: "practice", number: "04", label: "Practice", screenLabel: "PRACTICE" },
  { id: "services", number: "05", label: "Services", screenLabel: "SERVICES" },
  { id: "products", number: "06", label: "Products", screenLabel: "PRODUCTS" },
  { id: "about", number: "07", label: "About", screenLabel: "ABOUT" },
  { id: "contact", number: "08", label: "Contact", screenLabel: "CONTACT" },
] as const;

export function LandingV7() {
  return (
    <div className="v7-landing" data-theme="dark">
      <main className="v7-stations">
        {STATIONS.map((station) => (
          <section
            key={station.id}
            id={station.id}
            className="v7-station"
            data-station={station.id}
            data-screen-label={station.screenLabel}
          >
            <div className="v7-station__inner">
              <span className="v7-station__number">{station.number}</span>
              <h2 className="v7-station__label">{station.label}</h2>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
