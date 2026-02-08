/**
 * Figma Variables API Route
 *
 * GET /api/figma/variables - Read all variables and styles from the file
 * Query params:
 *   ?fileKey=... (optional)
 *
 * Note: The Variables REST API requires at minimum a Professional plan.
 * On Professional, only read access is available.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth-server";
import { getVariables } from "@/lib/figma/client";

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get("fileKey") || undefined;

    const result = await getVariables(fileKey);

    // Flatten into a more usable format
    const collections = Object.values(result.meta.variableCollections).map((c) => ({
      id: c.id,
      name: c.name,
      modes: c.modes,
      defaultModeId: c.defaultModeId,
      variableCount: c.variableIds.length,
    }));

    const variables = Object.values(result.meta.variables).map((v) => ({
      id: v.id,
      name: v.name,
      type: v.resolvedType,
      collectionId: v.variableCollectionId,
      description: v.description,
      hidden: v.hiddenFromPublishing,
      values: v.valuesByMode,
    }));

    return NextResponse.json({
      collections,
      variables,
      totalVariables: variables.length,
      totalCollections: collections.length,
    });
  } catch (error) {
    console.error("[figma/variables] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    // Variables API may return 403 if plan doesn't support it
    if (message.includes("403")) {
      return NextResponse.json(
        {
          error: "Variables API requires a Professional or Enterprise plan",
          collections: [],
          variables: [],
          totalVariables: 0,
          totalCollections: 0,
        },
        { status: 403 }
      );
    }

    const status = message.includes("not set") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
