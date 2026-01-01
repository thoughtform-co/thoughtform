// ═══════════════════════════════════════════════════════════════
// SURVEY SEARCH API
// Semantic search using dual Voyage embeddings
// - space="briefing" (default): clean retrieval via briefing embedding
// - space="full": deep similarity via full-context embedding
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

const BUCKET_NAME = "survey-media";
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const DEFAULT_MODEL = "voyage-3-lite";
const SIGNED_URL_EXPIRY = 3600;

type SearchSpace = "briefing" | "full";

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voyageApiKey = process.env.VOYAGE_API_KEY;
    if (!voyageApiKey) {
      return NextResponse.json({ error: "VOYAGE_API_KEY not configured" }, { status: 500 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const {
      query,
      categoryId,
      componentKey,
      limit = 10,
      threshold = 0.3,
      space = "briefing" as SearchSpace,
    } = body;

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Validate space parameter
    if (space !== "briefing" && space !== "full") {
      return NextResponse.json(
        { error: "Invalid space parameter. Use 'briefing' or 'full'." },
        { status: 400 }
      );
    }

    // Generate embedding for query
    const model = process.env.VOYAGE_EMBED_MODEL || DEFAULT_MODEL;

    const voyageResponse = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${voyageApiKey}`,
      },
      body: JSON.stringify({
        model,
        input: query,
        input_type: "query",
      }),
    });

    if (!voyageResponse.ok) {
      const errorData = await voyageResponse.json().catch(() => ({}));
      console.error("Voyage API error:", errorData);
      return NextResponse.json({ error: "Failed to generate query embedding" }, { status: 500 });
    }

    const voyageData = await voyageResponse.json();
    const queryEmbedding = voyageData.data?.[0]?.embedding;

    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      return NextResponse.json({ error: "Invalid embedding response" }, { status: 500 });
    }

    // Format embedding for pgvector
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Choose RPC based on space parameter
    const rpcName =
      space === "briefing" ? "match_survey_items_briefing" : "match_survey_items_full";

    // Call appropriate match RPC
    const { data: results, error: searchError } = await supabase.rpc(rpcName, {
      query_embedding: embeddingStr,
      match_threshold: threshold,
      match_count: limit,
      filter_category_id: categoryId || null,
      filter_component_key: componentKey || null,
    });

    if (searchError) {
      console.error(`Search error (${rpcName}):`, searchError);

      // Try fallback to legacy RPC if new ones don't exist yet
      if (space === "briefing" || space === "full") {
        const { data: fallbackResults, error: fallbackError } = await supabase.rpc(
          "match_survey_items",
          {
            query_embedding: embeddingStr,
            match_threshold: threshold,
            match_count: limit,
            filter_category_id: categoryId || null,
            filter_component_key: componentKey || null,
          }
        );

        if (!fallbackError && fallbackResults) {
          // Generate signed URLs for results
          const itemsWithUrls = await Promise.all(
            (fallbackResults || []).map(
              async (item: { image_path: string; similarity: number }) => {
                if (item.image_path) {
                  const { data: signedData } = await supabase.storage
                    .from(BUCKET_NAME)
                    .createSignedUrl(item.image_path, SIGNED_URL_EXPIRY);
                  return { ...item, image_url: signedData?.signedUrl };
                }
                return item;
              }
            )
          );

          return NextResponse.json({
            items: itemsWithUrls,
            query,
            model,
            space,
            fallback: true,
          });
        }
      }

      return NextResponse.json({
        items: [],
        error: "Semantic search not available. Run migration to enable pgvector.",
      });
    }

    // Generate signed URLs for results
    const itemsWithUrls = await Promise.all(
      (results || []).map(async (item: { image_path: string; similarity: number }) => {
        if (item.image_path) {
          const { data: signedData } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(item.image_path, SIGNED_URL_EXPIRY);
          return { ...item, image_url: signedData?.signedUrl };
        }
        return item;
      })
    );

    return NextResponse.json({
      items: itemsWithUrls,
      query,
      model,
      space,
    });
  } catch (error) {
    console.error("POST /api/survey/search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
