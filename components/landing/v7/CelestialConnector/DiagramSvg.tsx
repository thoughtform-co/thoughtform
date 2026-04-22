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
