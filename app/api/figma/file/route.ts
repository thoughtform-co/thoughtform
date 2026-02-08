/**
 * Figma File API Route
 *
 * GET /api/figma/file - Browse file structure (pages, frames, layers)
 * Query params:
 *   ?fileKey=... (optional, defaults to FIGMA_FILE_KEY)
 *   ?depth=N    (optional, tree depth, default 2 for pages + top-level frames)
 *   ?ids=1:2,3:4 (optional, specific node IDs)
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth-server";
import { getFile } from "@/lib/figma/client";
import type { FigmaNode, FigmaTreeNode } from "@/lib/figma/types";

/** Convert a full Figma node tree to a lightweight tree for the browser */
function toTreeNode(node: FigmaNode, maxDepth: number, currentDepth = 0): FigmaTreeNode {
  const isComponent = node.type === "COMPONENT" || node.type === "COMPONENT_SET";
  const hasChildren = Boolean(node.children?.length);

  return {
    id: node.id,
    name: node.name,
    type: node.type,
    childCount: node.children?.length || 0,
    isComponent,
    hasChildren,
    children:
      hasChildren && currentDepth < maxDepth
        ? node.children!.map((c) => toTreeNode(c, maxDepth, currentDepth + 1))
        : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get("fileKey") || undefined;
    const depth = parseInt(searchParams.get("depth") || "2", 10);
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || undefined;

    const file = await getFile(fileKey, { depth, ids });

    // Convert to lightweight tree
    const tree = toTreeNode(file.document, depth);

    return NextResponse.json({
      name: file.name,
      lastModified: file.lastModified,
      version: file.version,
      thumbnailUrl: file.thumbnailUrl,
      tree,
      componentCount: Object.keys(file.components).length,
      styleCount: Object.keys(file.styles).length,
    });
  } catch (error) {
    console.error("[figma/file] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not set") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
