// ═══════════════════════════════════════════════════════════════
// SURVEY EMBED API
// Generate Voyage embeddings for semantic search
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

const BUCKET_NAME = "survey-media";
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const DEFAULT_MODEL = "voyage-3-lite"; // 1024 dimensions

// Build embedding text from item fields
function buildEmbeddingText(item: {
  title?: string | null;
  notes?: string | null;
  tags?: string[];
  sources?: Array<{ label?: string; note?: string }>;
  category_id?: string | null;
  component_key?: string | null;
  analysis?: {
    transferNotes?: string;
    summary?: string;
    tags?: string[];
  } | null;
}): string {
  const parts: string[] = [];

  if (item.title) {
    parts.push(`Title: ${item.title}`);
  }

  if (item.category_id) {
    parts.push(`Category: ${item.category_id}`);
  }

  if (item.component_key) {
    parts.push(`Component: ${item.component_key}`);
  }

  if (item.tags && item.tags.length > 0) {
    parts.push(`Tags: ${item.tags.join(", ")}`);
  }

  if (item.notes) {
    parts.push(`Notes: ${item.notes}`);
  }

  if (item.sources && item.sources.length > 0) {
    const sourceLabels = item.sources
      .map((s) => s.label)
      .filter(Boolean)
      .join(", ");
    if (sourceLabels) {
      parts.push(`Sources: ${sourceLabels}`);
    }
  }

  // Include AI analysis if available
  if (item.analysis) {
    if (item.analysis.summary) {
      parts.push(`AI Summary: ${item.analysis.summary}`);
    }
    if (item.analysis.transferNotes) {
      parts.push(`Transfer Notes: ${item.analysis.transferNotes}`);
    }
    if (item.analysis.tags && item.analysis.tags.length > 0) {
      parts.push(`AI Tags: ${item.analysis.tags.join(", ")}`);
    }
  }

  return parts.join("\n");
}

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
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // Get item
    const { data: item, error: fetchError } = await supabase
      .from("survey_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Build embedding text
    const embeddingText = buildEmbeddingText(item);

    if (!embeddingText.trim()) {
      return NextResponse.json(
        { error: "No content to embed. Add title, notes, or tags first." },
        { status: 400 }
      );
    }

    // Call Voyage API
    const model = process.env.VOYAGE_EMBED_MODEL || DEFAULT_MODEL;

    const voyageResponse = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${voyageApiKey}`,
      },
      body: JSON.stringify({
        model,
        input: embeddingText,
        input_type: "document",
      }),
    });

    if (!voyageResponse.ok) {
      const errorData = await voyageResponse.json().catch(() => ({}));
      console.error("Voyage API error:", errorData);
      return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 });
    }

    const voyageData = await voyageResponse.json();
    const embedding = voyageData.data?.[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json({ error: "Invalid embedding response" }, { status: 500 });
    }

    // Format embedding for pgvector
    const embeddingStr = `[${embedding.join(",")}]`;

    // Update item with embedding using raw SQL for vector type
    const { error: updateError } = await supabase.rpc("update_survey_embedding", {
      item_id: itemId,
      embedding_vector: embeddingStr,
      embedding_model_name: model,
      embedding_text_content: embeddingText,
    });

    // If RPC doesn't exist, try direct update (embedding as array)
    if (updateError) {
      console.log("RPC not available, trying direct update...");

      // Update without embedding (just the text fields)
      const { error: fallbackError } = await supabase
        .from("survey_items")
        .update({
          embedding_model: model,
          embedding_text: embeddingText,
        })
        .eq("id", itemId);

      if (fallbackError) {
        console.error("Failed to save embedding:", fallbackError);
        return NextResponse.json({ error: "Failed to save embedding" }, { status: 500 });
      }

      // Try raw SQL update for the vector
      const { error: vectorError } = await supabase.rpc("exec_sql", {
        query: `UPDATE survey_items SET embedding = '${embeddingStr}'::vector WHERE id = '${itemId}'`,
      });

      if (vectorError) {
        console.warn("Could not set embedding vector, may need migration:", vectorError);
      }
    }

    // Refetch item
    const { data: updatedItem } = await supabase
      .from("survey_items")
      .select("*")
      .eq("id", itemId)
      .single();

    // Get signed URL for response
    const { data: signedData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(updatedItem?.image_path || item.image_path, 3600);

    return NextResponse.json({
      item: { ...(updatedItem || item), image_url: signedData?.signedUrl },
      embeddingDimensions: embedding.length,
      model,
    });
  } catch (error) {
    console.error("POST /api/survey/embed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
