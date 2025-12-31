import { getComponentById } from "../catalog";

// ═══════════════════════════════════════════════════════════════
// JSX CODE GENERATOR
// ═══════════════════════════════════════════════════════════════

const COMPONENT_NAMES: Record<string, string> = {
  // Foundations
  "color-palette-primary": "ColorPalette",
  "color-palette-semantic": "ColorPalette",
  "color-palette-opacity": "ColorPalette",
  "type-display": "Typography",
  "type-body": "Typography",
  "type-data": "Typography",
  "type-scale": "TypeScale",
  // Atoms
  "brand-mark": "BrandMark",
  "word-mark": "WordMark",
  "word-mark-sans": "WordMarkSans",
  "word-mark-lockup-horizontal": "WordMarkLockupHorizontal",
  "word-mark-lockup-vertical": "WordMarkLockupVertical",
  "corner-bracket": "CornerBracket",
  "corner-brackets-group": "CornerBrackets",
  rail: "Rail",
  // Molecules
  "frame-basic": "Frame",
  "frame-terminal": "Frame",
  // Organisms
  "card-content": "Card",
  "card-data": "Card",
  navbar: "NavigationBar",
  "hud-frame": "HUDFrame",
  button: "Button",
  slider: "Slider",
  toggle: "Toggle",
};

export function generateJSXCode(componentId: string, props: Record<string, unknown>): string {
  const def = getComponentById(componentId);
  if (!def) return "// Unknown component";

  const componentName = COMPONENT_NAMES[componentId] || def.name.replace(/\s+/g, "");

  const propsEntries = Object.entries(props).filter(([key, value]) => {
    const propDef = def.props.find((p) => p.name === key);
    return propDef && value !== propDef.default;
  });

  // Add variant prop for certain components
  if (componentId === "card-data") {
    propsEntries.push(["variant", "data"]);
  } else if (componentId === "frame-terminal") {
    propsEntries.push(["variant", "terminal"]);
  }

  const propsString = propsEntries
    .map(([key, value]) => {
      if (typeof value === "string") return `${key}="${value}"`;
      if (typeof value === "boolean") return value ? key : `${key}={false}`;
      return `${key}={${JSON.stringify(value)}}`;
    })
    .join(" ");

  if (componentId === "button" && props.label) {
    const filteredProps = propsEntries.filter(([k]) => k !== "label");
    const filteredPropsString = filteredProps
      .map(([key, value]) => {
        if (typeof value === "string") return `${key}="${value}"`;
        if (typeof value === "boolean") return value ? key : `${key}={false}`;
        return `${key}={${JSON.stringify(value)}}`;
      })
      .join(" ");
    return `<${componentName}${filteredPropsString ? " " + filteredPropsString : ""}>${props.label}</${componentName}>`;
  }

  return `<${componentName}${propsString ? " " + propsString : ""} />`;
}
