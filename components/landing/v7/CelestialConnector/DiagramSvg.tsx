import type {
  CelestialConfig,
  RingsConfig,
  SquareConfig,
  ReticleConfig,
  OrbitalConfig,
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
  const tickDensity: TickDensity = rings?.tickDensity ?? 8;

  return (
    <svg viewBox="-120 -120 240 240" fill="none">
      <g transform={rotation ? `rotate(${rotation})` : undefined}>
        {renderPreset(preset, { rings, square, reticleConfig, orbitalConfig, tickDensity })}
      </g>
    </svg>
  );
}

interface PresetParts {
  rings?: RingsConfig;
  square?: SquareConfig;
  reticleConfig: ReticleConfig;
  orbitalConfig: OrbitalConfig;
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
