// ═══════════════════════════════════════════════════════════════
// FIGMA REST API TYPES
// ═══════════════════════════════════════════════════════════════

/** Figma node types */
export type FigmaNodeType =
  | "DOCUMENT"
  | "CANVAS"
  | "FRAME"
  | "GROUP"
  | "SECTION"
  | "VECTOR"
  | "BOOLEAN_OPERATION"
  | "STAR"
  | "LINE"
  | "ELLIPSE"
  | "REGULAR_POLYGON"
  | "RECTANGLE"
  | "TABLE"
  | "TABLE_CELL"
  | "TEXT"
  | "SLICE"
  | "COMPONENT"
  | "COMPONENT_SET"
  | "INSTANCE"
  | "STICKY"
  | "SHAPE_WITH_TEXT"
  | "CONNECTOR"
  | "WIDGET";

/** RGBA color */
export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Absolute bounding box */
export interface FigmaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Paint (fill or stroke) */
export interface FigmaPaint {
  type:
    | "SOLID"
    | "GRADIENT_LINEAR"
    | "GRADIENT_RADIAL"
    | "GRADIENT_ANGULAR"
    | "GRADIENT_DIAMOND"
    | "IMAGE"
    | "EMOJI";
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  imageRef?: string;
}

/** Effect (shadow, blur) */
export interface FigmaEffect {
  type: "INNER_SHADOW" | "DROP_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  visible: boolean;
  radius: number;
  color?: FigmaColor;
  offset?: { x: number; y: number };
}

/** A Figma node (recursive tree structure) */
export interface FigmaNode {
  id: string;
  name: string;
  type: FigmaNodeType;
  visible?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: FigmaRect;
  absoluteRenderBounds?: FigmaRect;
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  effects?: FigmaEffect[];
  opacity?: number;
  characters?: string; // Text content for TEXT nodes
  style?: Record<string, unknown>; // Text style for TEXT nodes
  componentId?: string; // For INSTANCE nodes
  description?: string; // For COMPONENT nodes
}

/** Component metadata from file response */
export interface FigmaComponentMeta {
  key: string;
  name: string;
  description: string;
  componentSetId?: string;
  documentationLinks?: Array<{ uri: string }>;
  remote?: boolean;
  containing_frame?: {
    nodeId: string;
    name: string;
    pageName: string;
  };
}

/** Style metadata from file response */
export interface FigmaStyleMeta {
  key: string;
  name: string;
  styleType: "FILL" | "TEXT" | "EFFECT" | "GRID";
  remote?: boolean;
  description?: string;
}

/** GET /v1/files/:key response */
export interface FigmaFileResponse {
  name: string;
  role: string;
  lastModified: string;
  editorType: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponentMeta>;
  componentSets?: Record<string, { key: string; name: string; description: string }>;
  styles: Record<string, FigmaStyleMeta>;
  schemaVersion: number;
}

/** GET /v1/files/:key/nodes response */
export interface FigmaFileNodesResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  nodes: Record<
    string,
    {
      document: FigmaNode;
      components: Record<string, FigmaComponentMeta>;
      styles: Record<string, FigmaStyleMeta>;
    } | null
  >;
}

/** GET /v1/images/:key response */
export interface FigmaImagesResponse {
  err: string | null;
  images: Record<string, string | null>;
  status?: number;
}

/** Variable types */
export type FigmaVariableType = "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";

/** A Figma variable */
export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: FigmaVariableType;
  description?: string;
  hiddenFromPublishing?: boolean;
  valuesByMode: Record<string, unknown>;
}

/** A variable collection */
export interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  remote?: boolean;
  hiddenFromPublishing?: boolean;
  variableIds: string[];
}

/** GET /v1/files/:key/variables/local response */
export interface FigmaVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
}

// ═══════════════════════════════════════════════════════════════
// BRIDGE UI TYPES
// ═══════════════════════════════════════════════════════════════

/** Simplified node for the file tree browser */
export interface FigmaTreeNode {
  id: string;
  name: string;
  type: FigmaNodeType;
  childCount?: number;
  isComponent?: boolean;
  hasChildren?: boolean;
  children?: FigmaTreeNode[];
}

/** Export options */
export interface FigmaExportOptions {
  format: "svg" | "png" | "jpg" | "pdf";
  scale?: number;
  svgOutlineText?: boolean;
  svgIncludeId?: boolean;
}

/** Bridge state for a selected node */
export interface BridgeSelectedNode {
  id: string;
  name: string;
  type: FigmaNodeType;
  node?: FigmaNode;
  previewUrl?: string;
  svgUrl?: string;
}
