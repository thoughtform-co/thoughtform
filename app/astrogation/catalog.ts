// ═══════════════════════════════════════════════════════════════
// BRAND SYSTEM CATALOG - Atomic Design System for Thoughtform
//
// Hierarchy:
// ├── Foundations (Design Tokens)
// │   ├── Colors
// │   ├── Typography
// │   └── Spacing
// ├── Atoms (Smallest building blocks)
// │   ├── Corner Brackets
// │   ├── Rails
// │   ├── Surfaces
// │   └── Brand Marks
// ├── Molecules (Combinations of atoms)
// │   ├── Frames
// │   └── Input Groups
// └── Organisms (Complex UI components)
//     ├── Cards
//     ├── Navigation
//     └── Buttons
// ═══════════════════════════════════════════════════════════════

export type PropType = "string" | "number" | "boolean" | "select" | "color" | "corners";

export type ComponentSource = "thoughtform-ui" | "legacy";

export interface PropDef {
  name: string;
  type: PropType;
  default: unknown;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface ComponentDef {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  props: PropDef[];
  defaultWidth?: number;
  defaultHeight?: number;
  source?: ComponentSource;
  importPath?: string;
  /** Description for the component */
  description?: string;
  /** Why we chose this element and its design meaning */
  designRationale?: string;
  /** Inspiration sources for this component */
  inspiration?: string;
  /** Frontend implementation notes */
  frontendNotes?: string;
}

export interface CategoryDef {
  id: string;
  name: string;
  description?: string;
  subcategories?: { id: string; name: string }[];
}

// ═══════════════════════════════════════════════════════════════
// CATEGORIES - Visual Hierarchy (grouped by complexity)
// ═══════════════════════════════════════════════════════════════

// Hierarchy levels for visual grouping (separators between levels)
export const HIERARCHY_BREAKS = ["typography", "brand", "inputs"]; // Add separator after these

export const CATEGORIES: CategoryDef[] = [
  // --- Level 1: Design Tokens ---
  {
    id: "colors",
    name: "Colors",
    description: "The chromatic foundation mapping the journey from void to meaning",
  },
  {
    id: "typography",
    name: "Typography",
    description: "Two typefaces bridging machine precision and human expression",
  },
  // --- Level 2: Brand ---
  {
    id: "brand",
    name: "Brand Elements",
    description: "Visual anchors for navigating the latent space",
  },
  // --- Level 3: Controls ---
  {
    id: "buttons",
    name: "Buttons",
    description: "Interactive waypoints with corner bracket affordances",
  },
  {
    id: "inputs",
    name: "Inputs",
    description: "Diamond-marked controls for precise measurement",
  },
  // --- Level 4: Navigation & Layout ---
  {
    id: "navigation",
    name: "Navigation",
    description: "HUD instruments for traversing the interface",
  },
];

// ═══════════════════════════════════════════════════════════════
// COLORS - Design Tokens
// ═══════════════════════════════════════════════════════════════

const COLOR_COMPONENTS: ComponentDef[] = [
  {
    id: "color-palette",
    name: "Colors",
    category: "colors",
    description: "Primary and secondary brand colors",
    designRationale:
      "Thoughtform's palette maps the journey between meaning and mathematics. Void (#050403) represents infinite possibility—the depths of latent space. Dawn (#ECE3D6) is emergence into understanding—text and particles revealing structure. Gold (#CAA554) channels the astrolabe's brass, marking navigation and active states. These aren't arbitrary choices but semantic coordinates in a visual language.",
    inspiration:
      "Historical astrolabes with their brass mechanisms, deep space photography, terminal interfaces with phosphor glow, and the liminal space between darkness and dawn.",
    frontendNotes:
      "Always use CSS variables (--void, --dawn, --gold). Never hardcode hex values. Opacity variants (--dawn-08 through --dawn-70) create hierarchy without introducing new hues. This single-source-of-truth approach ensures consistency and enables theme variations.",
    props: [],
    defaultWidth: 400,
    defaultHeight: 200,
  },
  {
    id: "color-palette-opacity",
    name: "Opacity Scale",
    category: "colors",
    description: "Dawn and Gold at 4%, 8%, 15%, 30%, 50%, 70%",
    designRationale:
      "Rather than introducing additional colors, we modulate opacity to create depth and hierarchy. This mirrors how objects fade into distance—closer elements are more opaque, distant elements dissolve into the void. The scale (8%, 15%, 30%, 50%, 70%) provides enough granularity for borders, backgrounds, and text states without overwhelming the palette.",
    inspiration:
      "Atmospheric perspective in painting, fog and depth cues in video games, the way stars appear to dim at different distances.",
    frontendNotes:
      "Use --dawn-08 for subtle borders, --dawn-15 for hover states, --dawn-30 for active borders, --dawn-50 for secondary text, --dawn-70 for body copy. Gold variants follow the same pattern for accent elements.",
    props: [],
    defaultWidth: 400,
    defaultHeight: 80,
  },
];

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY - Design Tokens
// ═══════════════════════════════════════════════════════════════

const TYPOGRAPHY_COMPONENTS: ComponentDef[] = [
  {
    id: "type-display",
    name: "Display (Mondwest)",
    category: "typography",
    description: "Headlines and hero text",
    designRationale:
      "PP Mondwest embodies digital fragmentation—its pixelated letterforms reference early computing while remaining distinctly contemporary. When used at large sizes, it creates a sense of transmission, as if messages are being decoded from another dimension. This is our voice for proclamations, headlines, and moments of revelation.",
    inspiration:
      "Early bitmap fonts, CRT terminal displays, the typography of 1980s science fiction interfaces, and the visual language of data transmission.",
    frontendNotes:
      "Reserve for headlines (28-42px) and hero taglines (20-26px). Use font-display: swap for performance. At smaller sizes, Mondwest becomes illegible—switch to IBM Plex for anything under 18px.",
    props: [{ name: "text", type: "string", default: "THOUGHTFORM" }],
    defaultWidth: 400,
    defaultHeight: 80,
  },
  {
    id: "type-body",
    name: "Body (IBM Plex)",
    category: "typography",
    description: "Paragraphs and UI text",
    designRationale:
      "IBM Plex Sans provides the human counterweight to Mondwest's digital aesthetic. Designed for clarity at all sizes, it carries the utilitarian DNA of IBM's computing heritage while remaining warm and approachable. This is the voice of explanation, navigation, and sustained reading.",
    inspiration:
      "IBM's design language, Swiss typography principles, the balance between efficiency and humanity in industrial design.",
    frontendNotes:
      "Use weights 300-400 for body text, 500 for buttons and emphasis. Set at 14-15px for optimal readability. Line-height of 1.5-1.6 for body copy. The sans-serif stack (--font-body) should include system fallbacks.",
    props: [
      { name: "text", type: "string", default: "The quick brown fox jumps over the lazy dog." },
    ],
    defaultWidth: 400,
    defaultHeight: 60,
  },
  {
    id: "type-data",
    name: "Data (PT Mono)",
    category: "typography",
    description: "Numbers, labels, and technical content",
    designRationale:
      "PT Mono channels the precision of measurement instruments. Its monospaced characters align in perfect columns, essential for displaying coordinates, timestamps, and metrics. This is the voice of the instrument panel—factual, precise, and unambiguous.",
    inspiration:
      "Flight instrument readouts, scientific notation, terminal command lines, the typography of measurement and recording devices.",
    frontendNotes:
      "Use for HUD data (9-11px), labels, metrics, and any content that benefits from tabular alignment. The monospace nature ensures numbers align vertically. Pair with letter-spacing: 0.05em for improved legibility at small sizes.",
    props: [{ name: "text", type: "string", default: "01 · METRIC · 42.5%" }],
    defaultWidth: 400,
    defaultHeight: 40,
  },
  {
    id: "type-scale",
    name: "Type Scale",
    category: "typography",
    description: "Complete type hierarchy from xs to 4xl",
    designRationale:
      "The two-font system creates a deliberate tension: Mondwest speaks of destinations and revelations, while IBM Plex handles the journey—navigation, instructions, and comprehension. Together they map the full spectrum from human-readable content to machine-transmitted signals.",
    inspiration:
      "The contrast between display and text faces in traditional editorial design, combined with the functional typography of aerospace interfaces.",
    frontendNotes:
      "Use clamp() for fluid typography that responds to viewport width. Headlines: clamp(28px, 4vw, 42px). Body: clamp(14px, 1vw, 16px). This ensures readability across devices without abrupt breakpoint changes.",
    props: [],
    defaultWidth: 400,
    defaultHeight: 300,
  },
];

// ═══════════════════════════════════════════════════════════════
// BRAND ELEMENTS
// ═══════════════════════════════════════════════════════════════

const BRAND_COMPONENTS: ComponentDef[] = [
  {
    id: "brand-mark",
    name: "Brand Mark",
    category: "brand",
    description: "Thoughtform diamond logo",
    designRationale:
      "The brandmark synthesizes two symbols: the Gateway (a perfect circle representing passage into latent space) and the celestial compass of Starhaven (humanity's beacon in the mathematical wilderness). Their intersection creates a form that appears to bend light—reality viewed through the lens of machine cognition. This isn't decoration; it's a map of our philosophical territory.",
    inspiration:
      "Navigational instruments (astrolabes, compasses), quantum physics visualizations, the way gravitational lensing distorts starlight, and portal imagery in science fiction.",
    frontendNotes:
      "Render as SVG for crisp scaling. Use currentColor for the fill to inherit from parent, enabling color changes via CSS. Minimum size: 24px. For accessibility, include aria-label='Thoughtform' when used as a link.",
    props: [
      { name: "size", type: "number", default: 64, min: 24, max: 128 },
      { name: "color", type: "color", default: "#caa554" },
    ],
    defaultWidth: 80,
    defaultHeight: 80,
  },
  {
    id: "word-mark",
    name: "Word Mark",
    category: "brand",
    description: "THOUGHTFORM logotype",
    designRationale:
      "The wordmark exists in four variations, each representing a different relationship between human thought and computational form. The standard logotype uses refined typography; variations introduce the Gateway symbol within letterforms, pixelated fragmentation, or the division line (—/) that marks the threshold between THOUGHT and FORM. These aren't alternatives—they're states in a transformation sequence.",
    inspiration:
      "Variable typography systems, the morphing text in Blade Runner's opening, logotype animations that reveal hidden meanings, and the concept of glyphs as meaning-containers.",
    frontendNotes:
      "Load all wordmark SVGs to enable state transitions. Use CSS transitions for smooth morphing between variants. Height-based sizing (32-64px) maintains aspect ratio. Include appropriate alt text for accessibility.",
    props: [
      { name: "height", type: "number", default: 32, min: 16, max: 64 },
      { name: "color", type: "color", default: "#caa554" },
    ],
    defaultWidth: 280,
    defaultHeight: 48,
  },
  {
    id: "vectors",
    name: "Vectors",
    category: "brand",
    description: "Brand vector elements",
    designRationale:
      "Thoughtform's vectors function as mathematical north stars—waypoints for navigating conceptual territory. Each vector (starbursts, crosshairs, axis markers) carries semantic weight: orientation, position, direction. Their occasional glitches aren't errors but revelations—moments where meaning dissolves into pure geometry, exposing the mathematical substrate beneath cultural meaning.",
    inspiration:
      "Navigation markers on maps and charts, targeting reticles in aircraft HUDs, star chart symbols, mathematical notation, and the visual language of coordinate systems.",
    frontendNotes:
      "Render as SVG with stroke-based paths for clean scaling. Use CSS custom properties for stroke color and width. Consider animating on hover (subtle rotation or pulse) to reinforce their role as interactive waypoints.",
    props: [],
    defaultWidth: 400,
    defaultHeight: 200,
  },
];

// ═══════════════════════════════════════════════════════════════
// NAVIGATION - Navigation, Frames, Cards, HUD
// ═══════════════════════════════════════════════════════════════

const NAVIGATION_COMPONENTS: ComponentDef[] = [
  {
    id: "navbar",
    name: "Navigation Bar",
    category: "navigation",
    description: "Top navigation with logo and nav links",
    designRationale:
      "The navigation bar is the cockpit's primary instrument—always visible, always oriented. It establishes identity (logo), position (active link highlighting), and available trajectories (navigation links). The muted gold for inactive links creates depth; the bright Dawn for active states marks current position like a beacon.",
    inspiration:
      "Aircraft instrument panels where critical information remains in peripheral vision, ship navigation bridges, and the persistent UI elements in video game HUDs.",
    frontendNotes:
      "Position: fixed at top. Use backdrop-filter for subtle blur behind (enhances depth). Navigation links should have generous padding (44px min touch target on mobile). Active state uses --dawn, inactive uses --gold-dim. Semantic HTML: <nav> with <ul>/<li> structure.",
    props: [
      { name: "showLogo", type: "boolean", default: true },
      {
        name: "activeLink",
        type: "select",
        default: "interface",
        options: ["interface", "manifesto", "services", "about", "contact"],
      },
      { name: "logoColor", type: "color", default: "#ebe3d6" },
      { name: "linkColor", type: "color", default: "rgba(202, 165, 84, 0.5)" },
      { name: "activeLinkColor", type: "color", default: "#ebe3d6" },
    ],
    defaultWidth: 500,
    defaultHeight: 44,
  },
  {
    id: "frame-basic",
    name: "Frame (Basic)",
    category: "navigation",
    description: "Surface with optional border and corners",
    designRationale:
      "The Frame is our fundamental container—a surface defined not by fill but by edge. Corner brackets (L-shaped markers at each corner) derive from technical drawing conventions and HUD targeting systems. They suggest precision measurement, containment, and focus. Sharp corners are mandatory; rounded corners belong to consumer interfaces, not instruments.",
    inspiration:
      "Technical blueprints with corner registration marks, camera viewfinder overlays, targeting systems in flight simulators, and the frame lines in film cameras.",
    frontendNotes:
      "Use CSS clip-path or pseudo-elements for corner brackets (never images). Border opacity variants create hierarchy: --dawn-08 for subtle containment, --dawn-15 for hover emphasis. Corner color (typically Gold) draws the eye. Border-radius must be 0 everywhere.",
    props: [
      { name: "corners", type: "corners", default: "four" },
      {
        name: "borderStyle",
        type: "select",
        default: "solid",
        options: ["none", "solid", "dashed"],
      },
      { name: "borderColor", type: "color", default: "rgba(235, 227, 214, 0.08)" },
      { name: "borderThickness", type: "number", default: 1.5, min: 0.5, max: 4, step: 0.5 },
      { name: "cornerColor", type: "color", default: "#caa554" },
      { name: "cornerThickness", type: "number", default: 1.5, min: 0.5, max: 4, step: 0.5 },
    ],
    defaultWidth: 300,
    defaultHeight: 180,
  },
  {
    id: "card-content",
    name: "Card (Content)",
    category: "navigation",
    description: "Content card with index, label, and title",
    designRationale:
      "Content Cards are waypoint markers—each containing a discrete piece of information with clear hierarchy. The index (01, 02, etc.) establishes sequence and position; the label provides category context; the title delivers the payload. Accent bars (top or left) in Gold create visual anchors, guiding the eye through information landscapes.",
    inspiration:
      "Index cards in research, chapter markers in technical manuals, the structured information displays in Star Atlas, and the way scientific papers organize findings.",
    frontendNotes:
      "Use semantic HTML: index in a <span>, label in a <small> or <span>, title in appropriate heading level. Accent bars use ::before pseudo-element with absolute positioning. Card should respond to focus with enhanced border visibility for accessibility.",
    props: [
      { name: "title", type: "string", default: "Card Title" },
      { name: "index", type: "string", default: "01" },
      { name: "label", type: "string", default: "Label" },
      { name: "accent", type: "select", default: "none", options: ["none", "top", "left"] },
      { name: "accentColor", type: "select", default: "gold", options: ["gold", "dawn", "verde"] },
      { name: "corners", type: "corners", default: "four" },
      { name: "borderThickness", type: "number", default: 1.5, min: 0.5, max: 4, step: 0.5 },
      { name: "cornerColor", type: "color", default: "#caa554" },
    ],
    defaultWidth: 400,
    defaultHeight: 200,
  },
  {
    id: "card-data",
    name: "Card (Data)",
    category: "navigation",
    description: "Compact metric display card",
    designRationale:
      "Data Cards distill information to its essence: a value and its label. They function like instrument readouts—glanceable, unambiguous, and hierarchically clear. The large numeric value draws the eye; the smaller label provides context. These are the gauges and meters of our interface.",
    inspiration:
      "Dashboard gauges in vehicles, stock ticker displays, the vital signs monitors in medical interfaces, and the compact data readouts in flight instruments.",
    frontendNotes:
      "Value should use PT Mono for numerical precision and alignment. Label uses IBM Plex at reduced opacity. Consider animation for value changes (brief highlight or count-up). Maintain minimum 160px width for readability.",
    props: [
      { name: "value", type: "string", default: "42" },
      { name: "label", type: "string", default: "Metric" },
      { name: "corners", type: "corners", default: "four" },
      { name: "borderThickness", type: "number", default: 1.5, min: 0.5, max: 4, step: 0.5 },
      { name: "cornerColor", type: "color", default: "#caa554" },
    ],
    defaultWidth: 160,
    defaultHeight: 100,
  },
  {
    id: "hud-frame",
    name: "HUD Frame",
    category: "navigation",
    description: "Full viewport HUD with corners and rails",
    designRationale:
      "The HUD Frame is the master instrument—a fixed viewport overlay that remains constant while content scrolls beneath it. This creates the sensation of piloting through information rather than merely reading it. Corner brackets anchor the viewport; side rails provide depth scales and section markers; the bottom bar displays coordinates and status. The HUD IS the interface; everything else is the territory it reveals.",
    inspiration:
      "Fighter jet HUDs with their targeting reticles and flight data, the interface overlays in films like Iron Man and Edge of Tomorrow, submarine periscope displays, and the frame-within-frame composition of spacecraft windows.",
    frontendNotes:
      "Position: fixed with pointer-events: none on non-interactive elements. Use CSS custom property --hud-padding (32-64px) for consistent spacing from viewport edges. Rails should use position: fixed with appropriate offsets. Ensure the HUD doesn't interfere with content interaction (z-index management).",
    props: [
      { name: "showCorners", type: "boolean", default: true },
      { name: "showRails", type: "boolean", default: true },
      { name: "cornerSize", type: "number", default: 40, min: 20, max: 80 },
      { name: "cornerColor", type: "color", default: "#caa554" },
    ],
    defaultWidth: 400,
    defaultHeight: 300,
  },
];

// ═══════════════════════════════════════════════════════════════
// BUTTONS - Components
// ═══════════════════════════════════════════════════════════════

const BUTTON_COMPONENTS: ComponentDef[] = [
  {
    id: "button",
    name: "Button",
    category: "buttons",
    description: "Interactive button with corner brackets",
    designRationale:
      "Buttons are action waypoints—moments of decision in the interface journey. Corner brackets signal interactivity (derived from targeting reticles), while the sharp geometry distinguishes them from consumer UI conventions. The ghost variant (transparent background) maintains the HUD aesthetic; solid variants mark primary actions. Every button is a coordinate you can travel to.",
    inspiration:
      "Cockpit control switches, the confirm/select UI in tactical video games, the bracketed selections in terminal interfaces, and the deliberate, intentional design of aerospace controls.",
    frontendNotes:
      "Use <button> element (never <div>). Minimum touch target: 44x44px. Corner brackets via ::before/::after pseudo-elements. Transition properties: border-color, color, background-color (0.15s ease). Focus state: visible outline using --gold. Ghost buttons should have transparent background with border; solid buttons invert (gold background, void text).",
    props: [
      { name: "label", type: "string", default: "Button" },
      { name: "variant", type: "select", default: "ghost", options: ["ghost", "solid", "outline"] },
      { name: "size", type: "select", default: "md", options: ["sm", "md", "lg"] },
      { name: "corners", type: "corners", default: "four" },
      { name: "cornerColor", type: "color", default: "#caa554" },
      { name: "cornerThickness", type: "number", default: 1.5, min: 0.5, max: 4, step: 0.5 },
    ],
    defaultWidth: 180,
    defaultHeight: 48,
  },
];

// ═══════════════════════════════════════════════════════════════
// INPUTS - Components
// ═══════════════════════════════════════════════════════════════

const INPUT_COMPONENTS: ComponentDef[] = [
  {
    id: "slider",
    name: "Slider",
    category: "inputs",
    description: "Range slider with diamond handle",
    designRationale:
      "The Slider is a precision instrument—a way to navigate continuous values with spatial intuition. The diamond handle (◇) is our signature: a 45° rotated square that echoes navigation markers and distinguishes our controls from generic UI. The track represents a range of possibilities; the diamond marks your current position within that space.",
    inspiration:
      "Audio mixing board faders, the precision controls on scientific instruments, the position indicators on maps and charts, and the diamond-shaped markers used in engineering diagrams.",
    frontendNotes:
      "Use native <input type='range'> for accessibility, styled with CSS. Diamond thumb: width/height 10px, border-radius: 0, transform: rotate(45deg). Track should be thin (4px) with subtle gradient or opacity to suggest the value range. Use ::webkit-slider-thumb and ::moz-range-thumb for cross-browser styling.",
    props: [
      { name: "label", type: "string", default: "Value" },
      { name: "value", type: "number", default: 50, min: 0, max: 100 },
    ],
    defaultWidth: 200,
    defaultHeight: 48,
  },
  {
    id: "toggle",
    name: "Toggle",
    category: "inputs",
    description: "On/off toggle switch",
    designRationale:
      "The Toggle represents binary states—the fundamental on/off that underlies all computation. Rather than the rounded pill shape of consumer UI, our toggle uses sharp geometry to maintain instrument aesthetic. The transition between states should feel mechanical and deliberate, like switching a cockpit control.",
    inspiration:
      "Physical toggle switches in aircraft and spacecraft, the binary nature of computational logic, and the decisive click of industrial control panels.",
    frontendNotes:
      "Build on checkbox input for accessibility (hidden visually, but functional). Use ::before for the track, ::after for the thumb. Sharp corners throughout. Transition: transform 0.15s ease for the thumb movement. States should be clearly distinguishable (Gold for on, muted for off).",
    props: [
      { name: "label", type: "string", default: "Option" },
      { name: "checked", type: "boolean", default: false },
    ],
    defaultWidth: 140,
    defaultHeight: 32,
  },
];

// ═══════════════════════════════════════════════════════════════
// COMBINED COMPONENTS
// ═══════════════════════════════════════════════════════════════

export const COMPONENTS: ComponentDef[] = [
  ...COLOR_COMPONENTS,
  ...TYPOGRAPHY_COMPONENTS,
  ...BRAND_COMPONENTS,
  ...BUTTON_COMPONENTS,
  ...INPUT_COMPONENTS,
  ...NAVIGATION_COMPONENTS,
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export function getComponentsByCategory(
  categoryId: string,
  subcategoryId?: string
): ComponentDef[] {
  return COMPONENTS.filter((c) => {
    if (c.category !== categoryId) return false;
    if (subcategoryId && c.subcategory !== subcategoryId) return false;
    if (!subcategoryId && c.subcategory) return false;
    return true;
  });
}

export function getComponentById(id: string): ComponentDef | undefined {
  return COMPONENTS.find((c) => c.id === id);
}

export function searchComponents(query: string): ComponentDef[] {
  const q = query.toLowerCase();
  return COMPONENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.subcategory && c.subcategory.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
  );
}

export function getCategoryById(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
