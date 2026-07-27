/**
 * The four directions under judgement.
 *
 * `thesis` = what to look for when comparing; `provenance` = the instrument
 * grammar the direction is drawn from, so a pick carries its lineage into
 * promotion. Same 4-field contract as the section-menu / anchor / card-face
 * labs.
 */
export interface PhlVariant {
  id: "a" | "b" | "c" | "d";
  label: string;
  /** Card directions sit in the services-plate family; the other two do not. */
  card: boolean;
  thesis: string;
  provenance: string;
}

export const PHL_VARIANTS: readonly PhlVariant[] = [
  {
    id: "a",
    label: "A · Field log",
    card: true,
    thesis:
      "A dossier you could pull from a drawer. Reads as one artefact — codes, operator, quote, meta and capture all inside one frame. Judge whether the density feels authoritative or busy.",
    provenance: "svc-plate chamfer shell + M2 survey plates + the owner's Field Log mockup",
  },
  {
    id: "b",
    label: "B · Instrument",
    card: true,
    thesis:
      "Numbers first, prose nowhere. The engagement as a hardware readout — gauges, tick rulers, a scope, a telemetry tape. Judge whether losing the narrative costs or clarifies.",
    provenance: "tools-cards console atoms (pcl-*) + the corridor caption rail",
  },
  {
    id: "c",
    label: "C · Schematic",
    card: false,
    thesis:
      "No frame at all — the artefact IS the composition, annotated like a cutaway. Judge whether frameless holds its own against the masthead, and whether the callouts read at a glance.",
    provenance: "svc-designation NASA-cutaway callouts + the satellite blueprint reference",
  },
  {
    id: "d",
    label: "D · Orbit",
    card: false,
    thesis:
      "The rollout log made spatial: a track with milestones, because an orbit IS a track record. Judge whether the timeline reading beats the stat-tile reading.",
    provenance: "CelestialConnector OrbitalNodes (ADR-026) + the rollout log's own beats",
  },
];
