import type {
  CelestialConfig,
  RingsConfig,
  SquareConfig,
  ReticleConfig,
  OrbitalConfig,
  ConstellationConfig,
  EclipticConfig,
  PhaseConfig,
  GlyphRingConfig,
  CrystalConfig,
  ArmatureConfig,
  TickDensity,
} from "@/lib/celestial/schema";
import {
  Rings,
  BearingTicks,
  MeridianAxis,
  RotatedSquare,
  Reticle,
  OrbitalMarker,
  CompassRose,
  RegisterMarks,
  DiagramLabels,
  Constellation,
  EclipticArc,
  PhaseDisk,
  GlyphRing,
  CrystalFacet,
  Armature,
  RadialSpokes,
  OrbitalNodes,
  PlanetBody,
} from "./shapes";

interface DiagramSvgProps {
  config: CelestialConfig;
}

export function DiagramSvg({ config }: DiagramSvgProps) {
  const { preset, diagram } = config;
  const rotation = diagram.rotation;
  const rings = diagram.rings;
  const square = diagram.square;
  const reticleConfig: ReticleConfig = diagram.reticle ?? {
    crosshair: true,
    centerShape: "diamond",
  };
  const orbitalConfig: OrbitalConfig = diagram.orbital ?? { angle: 0, size: "md" };
  const constellationConfig: ConstellationConfig = diagram.constellation ?? {
    seed: 42,
    points: 7,
    density: "sparse",
  };
  const eclipticConfig: EclipticConfig = diagram.ecliptic ?? {
    seed: 42,
    tilt: 23,
    phaseCount: 2,
  };
  const phaseConfig: PhaseConfig = diagram.phase ?? { seed: 42, coverage: 0.35 };
  const glyphRingConfig: GlyphRingConfig = diagram.glyphRing ?? {
    seed: 42,
    radius: "md",
  };
  const crystalConfig: CrystalConfig = diagram.crystal ?? {
    seed: 42,
    facets: 6,
    inset: 0.55,
  };
  const armatureConfig: ArmatureConfig = diagram.armature ?? {
    seed: 42,
    crossbars: 3,
    diamondJoints: 4,
  };
  const tickDensity: TickDensity = rings?.tickDensity ?? 8;

  return (
    <svg viewBox="-120 -120 240 240" fill="none">
      <g transform={rotation ? `rotate(${rotation})` : undefined}>
        {renderPreset(preset, {
          rings,
          square,
          reticleConfig,
          orbitalConfig,
          constellationConfig,
          eclipticConfig,
          phaseConfig,
          glyphRingConfig,
          crystalConfig,
          armatureConfig,
          tickDensity,
        })}
      </g>
    </svg>
  );
}

interface PresetParts {
  rings?: RingsConfig;
  square?: SquareConfig;
  reticleConfig: ReticleConfig;
  orbitalConfig: OrbitalConfig;
  constellationConfig: ConstellationConfig;
  eclipticConfig: EclipticConfig;
  phaseConfig: PhaseConfig;
  glyphRingConfig: GlyphRingConfig;
  crystalConfig: CrystalConfig;
  armatureConfig: ArmatureConfig;
  tickDensity: TickDensity;
}

function renderPreset(preset: string, parts: PresetParts) {
  switch (preset) {
    case "meridian":
      return (
        <>
          {parts.rings && <Rings config={parts.rings} />}
          <BearingTicks density={parts.tickDensity || 8} />
          <MeridianAxis showLabels />
          <OrbitalMarker config={parts.orbitalConfig} />
          <Reticle config={parts.reticleConfig} />
          <DiagramLabels topLeft="N · 180" bottomRight="DESC" />
        </>
      );

    case "squareCascade":
      return (
        <>
          {parts.rings && (
            <Rings
              config={{
                ...parts.rings,
                count: Math.min(parts.rings.count, 2) as RingsConfig["count"],
              }}
            />
          )}
          {parts.square && <RotatedSquare config={parts.square} />}
          <BearingTicks density={4} />
          <CompassRose />
          <OrbitalMarker config={parts.orbitalConfig} />
          <Reticle config={parts.reticleConfig} />
          <DiagramLabels topLeft="Ch · 03" bottomRight="LOCK" />
        </>
      );

    case "heroOrb":
      return (
        <>
          {parts.rings && <Rings config={parts.rings} />}
          <BearingTicks density={12} />
          <CompassRose radius={74} />
          <OrbitalMarker config={{ ...parts.orbitalConfig, size: "lg" }} />
          <Reticle config={parts.reticleConfig} />
          <DiagramLabels topLeft="N · 000" bottomRight="LOCK" />
        </>
      );

    case "reticle":
      return (
        <>
          {parts.rings && <Rings config={parts.rings} />}
          <BearingTicks density={parts.tickDensity || 8} />
          <Reticle config={{ ...parts.reticleConfig, crosshair: true }} />
        </>
      );

    case "compassRose":
      return (
        <>
          {parts.rings && <Rings config={parts.rings} />}
          <BearingTicks density={parts.tickDensity || 12} />
          <CompassRose />
          <Reticle config={parts.reticleConfig} />
        </>
      );

    case "orbital":
      return (
        <>
          {parts.rings && <Rings config={parts.rings} />}
          <BearingTicks density={parts.tickDensity || 8} />
          <OrbitalMarker config={parts.orbitalConfig} />
          <Reticle config={parts.reticleConfig} />
        </>
      );

    case "registerMarks":
      return (
        <>
          {parts.rings && <Rings config={{ ...parts.rings, count: 2 }} />}
          {parts.square && <RotatedSquare config={parts.square} />}
          <RegisterMarks />
          <BearingTicks density={4} />
          <Reticle config={parts.reticleConfig} />
        </>
      );

    // ── New cosmological presets ──

    case "constellation":
      return (
        <>
          {parts.rings && (
            <Rings config={{ ...parts.rings, count: 1, tickDensity: 0, showMeridian: false }} />
          )}
          <Constellation config={parts.constellationConfig} />
          <BearingTicks density={48} />
        </>
      );

    case "ecliptic":
      return (
        <>
          {parts.rings && <Rings config={{ ...parts.rings, count: 2 }} />}
          <EclipticArc config={parts.eclipticConfig} />
          <MeridianAxis showLabels={false} />
          <Reticle config={parts.reticleConfig} />
          <DiagramLabels topLeft="ECLIPTIC" bottomRight="TRANSIT" />
        </>
      );

    case "phase":
      return (
        <>
          <PhaseDisk config={parts.phaseConfig} />
          {parts.rings && <Rings config={{ ...parts.rings, count: 1 }} />}
          <BearingTicks density={12} />
          <OrbitalMarker config={parts.orbitalConfig} />
        </>
      );

    case "sigil":
      return (
        <>
          <GlyphRing config={parts.glyphRingConfig} />
          {parts.square && <RotatedSquare config={{ ...parts.square, nested: true }} />}
          <Reticle config={{ ...parts.reticleConfig, centerShape: "diamond" }} />
        </>
      );

    case "astrolabe":
      return (
        <>
          {parts.rings && <Rings config={{ ...parts.rings, count: 3 }} />}
          <GlyphRing config={{ ...parts.glyphRingConfig, radius: "lg" }} />
          <EclipticArc config={parts.eclipticConfig} />
          <MeridianAxis showLabels />
          <Reticle config={parts.reticleConfig} />
          <DiagramLabels topLeft="ASTROLABE" bottomRight="∂ · 001" />
        </>
      );

    // ── Phase glyph presets (Navigate/Encode/Build) ──

    case "crystallize":
      return (
        <>
          {parts.rings && <Rings config={parts.rings} />}
          <CrystalFacet config={parts.crystalConfig} />
          <GlyphRing config={parts.glyphRingConfig} />
          <Reticle config={{ ...parts.reticleConfig, centerShape: "diamond" }} />
        </>
      );

    case "armature":
      return (
        <>
          {parts.rings && <Rings config={parts.rings} />}
          {parts.square && <RotatedSquare config={parts.square} />}
          <Armature config={parts.armatureConfig} />
          <RegisterMarks />
          <BearingTicks density={parts.tickDensity || 4} />
          <Reticle config={{ ...parts.reticleConfig, centerShape: "diamond" }} />
        </>
      );

    // ── Symbolic astral emblems ──

    // Symmetric talisman (ref: gold astral emblem): concentric rings, an 8-spoke
    // sunburst, a nodes shell, a scatter of stars, diamond centre.
    case "astralEmblem":
      return (
        <>
          {parts.rings && <Rings config={{ ...parts.rings, count: 3 }} />}
          <RadialSpokes count={8} inner={16} length={92} opacity={0.4} />
          <RadialSpokes count={4} inner={14} length={104} strokeWidth={0.7} opacity={0.55} />
          <BearingTicks density={48} />
          <OrbitalNodes
            orbits={[
              { rx: 74, ry: 74, nodes: 8, nodeR: 2, dash: "1 6", opacity: 0.6 },
              { rx: 100, ry: 100, nodes: 4, nodeR: 2.6, hollow: true, dash: "1 8" },
            ]}
          />
          <Constellation config={{ ...parts.constellationConfig, density: "sparse" }} />
          <Reticle config={{ ...parts.reticleConfig, crosshair: false, centerShape: "diamond" }} />
          <DiagramLabels topLeft="ASTRA" bottomRight="fig · A" />
        </>
      );

    // Radial field chart (ref: "fig. E" ringed planet): a central ringed planet,
    // dashed radial arrows, tilted moon orbits, a few stars.
    case "orrerySigil":
      return (
        <>
          <RadialSpokes count={16} inner={26} length={78} dash="3 5" arrow opacity={0.4} />
          <OrbitalNodes
            orbits={[
              { rx: 96, ry: 40, tilt: -12, nodes: 3, nodeR: 3, dash: "4 4", opacity: 0.8 },
              { rx: 70, ry: 30, tilt: -12, nodes: 2, nodeR: 2.2, hollow: true, dash: "3 5" },
              { rx: 116, ry: 50, tilt: -12, nodes: 1, nodeR: 2.4, dash: "2 7", opacity: 0.5 },
            ]}
          />
          <Constellation config={{ ...parts.constellationConfig, points: 5, density: "sparse" }} />
          <PlanetBody radius={16} ringTilt={-12} />
          <DiagramLabels topLeft="القوة" bottomRight="fig · E" />
        </>
      );

    default:
      return (
        <>
          {parts.rings && <Rings config={parts.rings} />}
          <BearingTicks density={8} />
          <Reticle config={parts.reticleConfig} />
        </>
      );
  }
}
