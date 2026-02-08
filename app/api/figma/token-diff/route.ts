/**
 * Figma Token Diff API Route
 *
 * GET /api/figma/token-diff - Compare Figma variables against codebase tokens
 * Query params:
 *   ?fileKey=...   (optional)
 *   ?category=color (optional, filter by category)
 *
 * Returns a structured diff report showing matched, drifted, figma-only, and code-only tokens.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth-server";
import { getVariables } from "@/lib/figma/client";
import { diffTokens, CODEBASE_TOKENS } from "@/lib/figma/token-diff";
import type { TokenDiffEntry } from "@/lib/figma/token-diff";

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get("fileKey") || undefined;
    const categoryFilter = searchParams.get("category") || undefined;

    let report;

    try {
      const result = await getVariables(fileKey);
      report = diffTokens(result.meta.variables, result.meta.variableCollections);
    } catch (varError) {
      // If variables API fails (plan limitation), return code-only report
      console.warn("[figma/token-diff] Variables API unavailable:", varError);

      const codeOnly: TokenDiffEntry[] = CODEBASE_TOKENS.map((t) => ({
        status: "code_only" as const,
        name: t.name.replace(/^--/, ""),
        codeName: t.name,
        codeValue: t.value,
        category: t.category,
      }));

      report = {
        matched: [],
        drifted: [],
        figmaOnly: [],
        codeOnly,
        summary: {
          total: codeOnly.length,
          matched: 0,
          drifted: 0,
          figmaOnly: 0,
          codeOnly: codeOnly.length,
        },
      };
    }

    // Apply category filter if specified
    if (categoryFilter) {
      const filter = (entries: TokenDiffEntry[]) =>
        entries.filter((e) => e.category === categoryFilter);

      report = {
        matched: filter(report.matched),
        drifted: filter(report.drifted),
        figmaOnly: filter(report.figmaOnly),
        codeOnly: filter(report.codeOnly),
        summary: {
          total:
            filter(report.matched).length +
            filter(report.drifted).length +
            filter(report.figmaOnly).length +
            filter(report.codeOnly).length,
          matched: filter(report.matched).length,
          drifted: filter(report.drifted).length,
          figmaOnly: filter(report.figmaOnly).length,
          codeOnly: filter(report.codeOnly).length,
        },
      };
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("[figma/token-diff] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not set") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
