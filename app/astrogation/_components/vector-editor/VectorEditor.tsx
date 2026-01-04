"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Toolbar } from "./Toolbar";
import type {
  VectorEditorProps,
  EditorTool,
  GridSettings,
  HistoryState,
  VectorDocument,
} from "./types";

// ═══════════════════════════════════════════════════════════════
// VECTOR EDITOR - Full-screen Fabric.js canvas with floating toolbar
// ═══════════════════════════════════════════════════════════════

// Default colors from Thoughtform palette
const DEFAULT_FILL = "#caa554";
const DEFAULT_STROKE = "rgba(235, 227, 214, 0.5)";
const CANVAS_BG = "#0a0908";

// Type definitions for Fabric.js v6
type FabricCanvas = InstanceType<typeof import("fabric").Canvas>;
type FabricObject = InstanceType<typeof import("fabric").FabricObject>;

export function VectorEditor({ vectorDoc, onDocumentChange, onClose }: VectorEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const fabricModuleRef = useRef<typeof import("fabric") | null>(null);

  // Use refs for values that need to be accessed in event callbacks
  const activeToolRef = useRef<EditorTool>("select");
  const gridRef = useRef<GridSettings>({ enabled: true, size: 20, snap: true });
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const activeShapeRef = useRef<FabricObject | null>(null);
  const isLoadingRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State for UI (these trigger re-renders)
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [grid, setGrid] = useState<GridSettings>({ enabled: true, size: 20, snap: true });
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Sync state to refs
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  // ─────────────────────────────────────────────────────────────
  // Canvas resize handler
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Leave space for toolbar (64px) and some padding
        setCanvasSize({
          width: Math.floor(rect.width - 48),
          height: Math.floor(rect.height - 48),
        });
      }
    }

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Update fabric canvas size
  useEffect(() => {
    if (fabricRef.current && canvasSize.width > 0 && canvasSize.height > 0) {
      fabricRef.current.setDimensions(canvasSize);
      drawGrid();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize]);

  // ─────────────────────────────────────────────────────────────
  // Snap to grid helper
  // ─────────────────────────────────────────────────────────────

  const snapToGrid = useCallback((value: number) => {
    const g = gridRef.current;
    if (!g.snap) return value;
    return Math.round(value / g.size) * g.size;
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Document change handler (debounced)
  // ─────────────────────────────────────────────────────────────

  const triggerDocumentChange = useCallback(() => {
    if (!fabricRef.current || isLoadingRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      if (!fabricRef.current) return;

      const canvas = fabricRef.current;
      const json = canvas.toJSON();

      const doc: VectorDocument = {
        version: "1.0",
        objects: json.objects || [],
        background: json.background,
      };

      const { width, height } = canvasSize;
      const svg = canvas.toSVG({
        viewBox: { x: 0, y: 0, width, height },
      });

      onDocumentChange(doc, svg);
    }, 300);
  }, [onDocumentChange, canvasSize]);

  // ─────────────────────────────────────────────────────────────
  // Grid drawing
  // ─────────────────────────────────────────────────────────────

  const drawGrid = useCallback(() => {
    if (!fabricRef.current || !fabricModuleRef.current) return;

    const canvas = fabricRef.current;
    const fabric = fabricModuleRef.current;
    const g = gridRef.current;
    const { width, height } = canvasSize;

    // Remove existing grid lines
    const gridObjects = canvas
      .getObjects()
      .filter((obj: FabricObject) => (obj as FabricObject & { isGrid?: boolean }).isGrid);
    gridObjects.forEach((obj: FabricObject) => canvas.remove(obj));

    if (!g.enabled) {
      canvas.renderAll();
      return;
    }

    const gridColor = "rgba(235, 227, 214, 0.08)";

    // Draw vertical lines
    for (let x = 0; x <= width; x += g.size) {
      const line = new fabric.Line([x, 0, x, height], {
        stroke: gridColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      (line as InstanceType<typeof fabric.Line> & { isGrid: boolean }).isGrid = true;
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += g.size) {
      const line = new fabric.Line([0, y, width, y], {
        stroke: gridColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      (line as InstanceType<typeof fabric.Line> & { isGrid: boolean }).isGrid = true;
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }

    canvas.renderAll();
  }, [canvasSize]);

  // Redraw grid when settings change
  useEffect(() => {
    if (fabricRef.current) {
      drawGrid();
    }
  }, [grid.enabled, grid.size, drawGrid]);

  // ─────────────────────────────────────────────────────────────
  // Initialize Fabric.js
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    async function initFabric() {
      try {
        const fabricModule = await import("fabric");
        if (!mounted || !canvasRef.current) return;

        fabricModuleRef.current = fabricModule;

        const canvas = new fabricModule.Canvas(canvasRef.current, {
          width: canvasSize.width,
          height: canvasSize.height,
          backgroundColor: CANVAS_BG,
          selection: true,
          preserveObjectStacking: true,
        });

        fabricRef.current = canvas;

        // ─── Event handlers (using refs for current state) ───

        canvas.on("object:modified", () => triggerDocumentChange());
        canvas.on("object:added", () => triggerDocumentChange());
        canvas.on("object:removed", () => triggerDocumentChange());
        canvas.on("path:created", () => {
          // Exit drawing mode after pen stroke
          canvas.isDrawingMode = false;
          triggerDocumentChange();
        });

        canvas.on("mouse:down", (evt: unknown) => {
          const e = evt as { e: MouseEvent };
          const tool = activeToolRef.current;
          const fabric = fabricModuleRef.current;
          if (!fabric || tool === "select") return;

          const pointer = canvas.getPointer(e.e);
          const x = snapToGrid(pointer.x);
          const y = snapToGrid(pointer.y);

          drawStartRef.current = { x, y };
          isDrawingRef.current = true;

          let shape: FabricObject | null = null;

          switch (tool) {
            case "rect":
              shape = new fabric.Rect({
                left: x,
                top: y,
                width: 1,
                height: 1,
                fill: DEFAULT_FILL,
                stroke: DEFAULT_STROKE,
                strokeWidth: 1,
                originX: "left",
                originY: "top",
              });
              break;

            case "ellipse":
              shape = new fabric.Ellipse({
                left: x,
                top: y,
                rx: 1,
                ry: 1,
                fill: DEFAULT_FILL,
                stroke: DEFAULT_STROKE,
                strokeWidth: 1,
                originX: "left",
                originY: "top",
              });
              break;

            case "line":
              shape = new fabric.Line([x, y, x, y], {
                stroke: DEFAULT_FILL,
                strokeWidth: 2,
              });
              break;

            case "text":
              shape = new fabric.IText("Text", {
                left: x,
                top: y,
                fontSize: 24,
                fill: DEFAULT_FILL,
                fontFamily: "IBM Plex Sans, sans-serif",
              });
              canvas.add(shape);
              canvas.setActiveObject(shape);
              (shape as InstanceType<typeof fabric.IText>).enterEditing();
              setActiveTool("select");
              isDrawingRef.current = false;
              return;

            case "pen":
              canvas.isDrawingMode = true;
              if (canvas.freeDrawingBrush) {
                canvas.freeDrawingBrush.color = DEFAULT_FILL;
                canvas.freeDrawingBrush.width = 2;
              }
              return;
          }

          if (shape) {
            activeShapeRef.current = shape;
            canvas.add(shape);
            canvas.renderAll();
          }
        });

        canvas.on("mouse:move", (evt: unknown) => {
          const e = evt as { e: MouseEvent };
          const tool = activeToolRef.current;
          if (!isDrawingRef.current || !drawStartRef.current) return;
          if (tool === "select" || tool === "text" || tool === "pen") return;

          const pointer = canvas.getPointer(e.e);
          const startX = drawStartRef.current.x;
          const startY = drawStartRef.current.y;
          const currentX = snapToGrid(pointer.x);
          const currentY = snapToGrid(pointer.y);

          const shape = activeShapeRef.current;
          if (!shape) return;

          const width = Math.abs(currentX - startX);
          const height = Math.abs(currentY - startY);
          const left = Math.min(startX, currentX);
          const top = Math.min(startY, currentY);

          switch (tool) {
            case "rect":
              shape.set({ left, top, width: width || 1, height: height || 1 });
              break;

            case "ellipse":
              (shape as InstanceType<typeof import("fabric").Ellipse>).set({
                left,
                top,
                rx: width / 2 || 1,
                ry: height / 2 || 1,
              });
              break;

            case "line":
              (shape as InstanceType<typeof import("fabric").Line>).set({
                x2: currentX,
                y2: currentY,
              });
              break;
          }

          canvas.renderAll();
        });

        canvas.on("mouse:up", () => {
          isDrawingRef.current = false;
          drawStartRef.current = null;

          if (activeShapeRef.current) {
            canvas.setActiveObject(activeShapeRef.current);
            activeShapeRef.current = null;
          }

          // Exit pen mode
          if (activeToolRef.current === "pen") {
            canvas.isDrawingMode = false;
          }
        });

        canvas.on("object:moving", (e: { target?: FabricObject }) => {
          const g = gridRef.current;
          if (!g.snap || !e.target) return;
          e.target.set({
            left: snapToGrid(e.target.left || 0),
            top: snapToGrid(e.target.top || 0),
          });
        });

        // Load initial document if provided
        if (vectorDoc) {
          isLoadingRef.current = true;
          const jsonDoc = typeof vectorDoc === "string" ? JSON.parse(vectorDoc) : vectorDoc;
          canvas.loadFromJSON(jsonDoc).then(() => {
            canvas.renderAll();
            isLoadingRef.current = false;
            drawGrid();
          });
        } else {
          drawGrid();
        }

        setFabricLoaded(true);
      } catch (error) {
        console.error("Failed to initialize Fabric.js:", error);
      }
    }

    initFabric();

    return () => {
      mounted = false;
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Tool actions
  // ─────────────────────────────────────────────────────────────

  const handleToolChange = useCallback((tool: EditorTool) => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    canvas.isDrawingMode = false;

    if (tool === "select") {
      canvas.selection = true;
      canvas.forEachObject((obj: FabricObject) => {
        if (!(obj as FabricObject & { isGrid?: boolean }).isGrid) {
          obj.selectable = true;
          obj.evented = true;
        }
      });
    } else {
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.forEachObject((obj: FabricObject) => {
        if (!(obj as FabricObject & { isGrid?: boolean }).isGrid) {
          obj.selectable = false;
          obj.evented = false;
        }
      });
    }

    canvas.renderAll();
    setActiveTool(tool);
  }, []);

  const handleDelete = useCallback(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    const activeObjects = canvas.getActiveObjects();

    if (activeObjects.length > 0) {
      saveToHistory();
      activeObjects.forEach((obj: FabricObject) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, []);

  const handleDuplicate = useCallback(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    const activeObject = canvas.getActiveObject();

    if (activeObject) {
      saveToHistory();
      activeObject.clone().then((cloned: FabricObject) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
      });
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // History
  // ─────────────────────────────────────────────────────────────

  const saveToHistory = useCallback(() => {
    if (!fabricRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    setHistory((prev) => ({
      past: [...prev.past.slice(-19), json],
      future: [],
    }));
  }, []);

  const handleUndo = useCallback(() => {
    if (!fabricRef.current || history.past.length === 0) return;

    const canvas = fabricRef.current;
    const currentState = JSON.stringify(canvas.toJSON());
    const previousState = history.past[history.past.length - 1];

    setHistory((prev) => ({
      past: prev.past.slice(0, -1),
      future: [currentState, ...prev.future],
    }));

    isLoadingRef.current = true;
    canvas.loadFromJSON(JSON.parse(previousState)).then(() => {
      canvas.renderAll();
      isLoadingRef.current = false;
      drawGrid();
    });
  }, [history.past, drawGrid]);

  const handleRedo = useCallback(() => {
    if (!fabricRef.current || history.future.length === 0) return;

    const canvas = fabricRef.current;
    const currentState = JSON.stringify(canvas.toJSON());
    const nextState = history.future[0];

    setHistory((prev) => ({
      past: [...prev.past, currentState],
      future: prev.future.slice(1),
    }));

    isLoadingRef.current = true;
    canvas.loadFromJSON(JSON.parse(nextState)).then(() => {
      canvas.renderAll();
      isLoadingRef.current = false;
      drawGrid();
    });
  }, [history.future, drawGrid]);

  // ─────────────────────────────────────────────────────────────
  // Keyboard shortcuts
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !containerRef.current?.contains(document.activeElement) &&
        document.activeElement !== document.body
      )
        return;

      const isMod = e.metaKey || e.ctrlKey;

      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObj = fabricRef.current?.getActiveObject();
        if (activeObj && (activeObj as InstanceType<typeof import("fabric").IText>).isEditing)
          return;
        e.preventDefault();
        handleDelete();
        return;
      }

      if (isMod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if ((isMod && e.key === "z" && e.shiftKey) || (isMod && e.key === "y")) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (isMod && e.key === "d") {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      // Escape to close
      if (e.key === "Escape" && onClose) {
        e.preventDefault();
        onClose();
        return;
      }

      if (!isMod) {
        switch (e.key.toLowerCase()) {
          case "v":
            handleToolChange("select");
            break;
          case "r":
            handleToolChange("rect");
            break;
          case "o":
            handleToolChange("ellipse");
            break;
          case "l":
            handleToolChange("line");
            break;
          case "p":
            handleToolChange("pen");
            break;
          case "t":
            handleToolChange("text");
            break;
        }
      }

      // Arrow nudging
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (!fabricRef.current) return;
        const activeObj = fabricRef.current.getActiveObject();
        if (!activeObj || (activeObj as InstanceType<typeof import("fabric").IText>).isEditing)
          return;

        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        let dx = 0,
          dy = 0;

        switch (e.key) {
          case "ArrowUp":
            dy = -step;
            break;
          case "ArrowDown":
            dy = step;
            break;
          case "ArrowLeft":
            dx = -step;
            break;
          case "ArrowRight":
            dx = step;
            break;
        }

        activeObj.set({
          left: (activeObj.left || 0) + dx,
          top: (activeObj.top || 0) + dy,
        });
        fabricRef.current.renderAll();
        triggerDocumentChange();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleDelete,
    handleUndo,
    handleRedo,
    handleDuplicate,
    handleToolChange,
    triggerDocumentChange,
    onClose,
  ]);

  // ─────────────────────────────────────────────────────────────
  // Copy SVG
  // ─────────────────────────────────────────────────────────────

  const handleCopySVG = useCallback(() => {
    if (!fabricRef.current) return;

    const { width, height } = canvasSize;
    const svg = fabricRef.current.toSVG({
      viewBox: { x: 0, y: 0, width, height },
    });

    navigator.clipboard.writeText(svg);
  }, [canvasSize]);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="vector-editor" ref={containerRef} tabIndex={0}>
      {/* Header with close button */}
      <div className="vector-editor__header">
        <div className="vector-editor__title">
          <span className="vector-editor__title-icon">⬡</span>
          <span>FORGE</span>
        </div>
        {onClose && (
          <button className="vector-editor__close" onClick={onClose} title="Close (Esc)">
            <span className="vector-editor__close-icon">←</span>
            <span>Back to Catalog</span>
          </button>
        )}
      </div>

      {/* Canvas area */}
      <div className="vector-editor__canvas-area">
        <canvas ref={canvasRef} />
        {!fabricLoaded && (
          <div className="vector-editor__loading">
            <span className="vector-editor__loading-icon">⬡</span>
            <span>Initializing Forge...</span>
          </div>
        )}
      </div>

      {/* Floating toolbar at bottom */}
      <Toolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        grid={grid}
        onGridChange={setGrid}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onCopySVG={handleCopySVG}
      />
    </div>
  );
}
