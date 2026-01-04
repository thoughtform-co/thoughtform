// ═══════════════════════════════════════════════════════════════
// VECTOR EDITOR TYPES
// ═══════════════════════════════════════════════════════════════

export type EditorTool = "select" | "rect" | "line" | "pen" | "text";

export interface VectorDocument {
  version: string;
  objects: unknown[];
  background?: string;
}

export interface VectorEditorProps {
  /** Current document state (Fabric JSON) */
  vectorDoc?: string | VectorDocument | null;
  /** Current SVG export */
  vectorSvg?: string | null;
  /** Callback when document changes */
  onDocumentChange: (doc: VectorDocument, svg: string) => void;
  /** Callback to close the editor */
  onClose?: () => void;
}

export interface GridSettings {
  enabled: boolean;
  size: number;
  snap: boolean;
}

export interface HistoryState {
  past: string[];
  future: string[];
}
