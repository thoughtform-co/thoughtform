/**
 * PointLight - 2D point light influence calculator for canvas rendering.
 * Use to create dynamic lighting effects on particles.
 */

export interface PointLightConfig {
  x: number;
  y: number;
  intensity: number;
  radius: number;
  color: string;
  falloff?: "linear" | "quadratic" | "smooth";
}

export interface LightInfluence {
  brightness: number;
  color: string;
  distance: number;
}

/**
 * Calculate the light influence at a given point
 */
export function calculateLightInfluence(
  pointX: number,
  pointY: number,
  light: PointLightConfig
): LightInfluence {
  const dx = pointX - light.x;
  const dy = pointY - light.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > light.radius) {
    return { brightness: 0, color: light.color, distance };
  }

  const normalizedDistance = distance / light.radius;
  let attenuation: number;

  switch (light.falloff ?? "smooth") {
    case "linear":
      attenuation = 1 - normalizedDistance;
      break;
    case "quadratic":
      attenuation = 1 - normalizedDistance * normalizedDistance;
      break;
    case "smooth":
    default:
      // Smooth hermite interpolation
      attenuation =
        1 -
        (3 * normalizedDistance * normalizedDistance -
          2 * normalizedDistance * normalizedDistance * normalizedDistance);
      break;
  }

  return {
    brightness: attenuation * light.intensity,
    color: light.color,
    distance,
  };
}

/**
 * Combine multiple light influences into a final color
 */
export function combineLights(baseColor: string, lights: LightInfluence[]): string {
  if (lights.length === 0) return baseColor;

  // Parse base color
  const base = parseColor(baseColor);

  let totalR = base.r;
  let totalG = base.g;
  let totalB = base.b;

  for (const light of lights) {
    if (light.brightness <= 0) continue;

    const lightColor = parseColor(light.color);

    // Additive blending scaled by brightness
    totalR = Math.min(255, totalR + lightColor.r * light.brightness * 0.5);
    totalG = Math.min(255, totalG + lightColor.g * light.brightness * 0.5);
    totalB = Math.min(255, totalB + lightColor.b * light.brightness * 0.5);
  }

  return `rgb(${Math.round(totalR)}, ${Math.round(totalG)}, ${Math.round(totalB)})`;
}

/**
 * Parse color string to RGB values
 */
function parseColor(color: string): { r: number; g: number; b: number } {
  // Handle hex
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  // Handle rgb/rgba
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
    };
  }

  // Thoughtform color tokens fallback
  const tokens: Record<string, { r: number; g: number; b: number }> = {
    gold: { r: 212, g: 175, b: 55 },
    dawn: { r: 236, g: 227, b: 214 },
    verde: { r: 57, g: 255, b: 20 },
    void: { r: 10, g: 10, b: 12 },
  };

  return tokens[color] ?? { r: 255, g: 255, b: 255 };
}

/**
 * Create a point light with Thoughtform defaults
 */
export function createPointLight(
  x: number,
  y: number,
  options: Partial<Omit<PointLightConfig, "x" | "y">> = {}
): PointLightConfig {
  return {
    x,
    y,
    intensity: options.intensity ?? 1,
    radius: options.radius ?? 200,
    color: options.color ?? "#d4af37", // Gold
    falloff: options.falloff ?? "smooth",
  };
}
