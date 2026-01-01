// ═══════════════════════════════════════════════════════════════
// SURVEY EMBED API
// Generate dual Voyage embeddings for semantic search
// - Briefing embedding: clean semantic retrieval
// - Full-context embedding: deep similarity with all context
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

const BUCKET_NAME = "survey-media";
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const DEFAULT_MODEL = "voyage-3"; // 1024 dimensions (voyage-3-lite is 512)

interface SurveyItemForEmbedding {
  title?: string | null;
  notes?: string | null;
  description?: string | null;
  briefing?: string | null;
  tags?: string[];
  sources?: Array<{ label?: string; note?: string }>;
  category_id?: string | null;
  component_key?: string | null;
  annotations?: Array<{ note?: string }>;
  analysis?: {
    transferNotes?: string;
    summary?: string;
    tags?: string[];
  } | null;
}

// Build BRIEFING embedding text (clean, focused retrieval)
// Used for: default semantic search, design intent queries
function buildBriefingEmbeddingText(item: SurveyItemForEmbedding): string {
  const parts: string[] = [];

  // Primary: the briefing itself
  if (item.briefing) {
    parts.push(item.briefing);
  }

  // Secondary: classification context
  if (item.category_id) {
    parts.push(`Category: ${item.category_id}`);
  }

  if (item.component_key) {
    parts.push(`Component: ${item.component_key}`);
  }

  if (item.tags && item.tags.length > 0) {
    parts.push(`Tags: ${item.tags.join(", ")}`);
  }

  if (item.title) {
    parts.push(`Title: ${item.title}`);
  }

  return parts.join("\n\n");
}

// Build FULL-CONTEXT embedding text (comprehensive, deep similarity)
// Used for: "find similar" operations, detailed context matching
function buildFullEmbeddingText(item: SurveyItemForEmbedding): string {
  const parts: string[] = [];

  // Briefing (if available)
  if (item.briefing) {
    parts.push(`Implementation Briefing:\n${item.briefing}`);
  }

  // Description (visual analysis)
  if (item.description) {
    parts.push(`Visual Description:\n${item.description}`);
  }

  // Title
  if (item.title) {
    parts.push(`Title: ${item.title}`);
  }

  // Classification
  if (item.category_id) {
    parts.push(`Category: ${item.category_id}`);
  }

  if (item.component_key) {
    parts.push(`Component: ${item.component_key}`);
  }

  // User tags
  if (item.tags && item.tags.length > 0) {
    parts.push(`Tags: ${item.tags.join(", ")}`);
  }

  // User notes
  if (item.notes) {
    parts.push(`User Notes:\n${item.notes}`);
  }

  // Annotation notes
  if (item.annotations && item.annotations.length > 0) {
    const annotationNotes = item.annotations
      .filter((a) => a.note)
      .map((a) => a.note)
      .join("\n");
    if (annotationNotes) {
      parts.push(`Annotation Notes:\n${annotationNotes}`);
    }
  }

  // Sources
  if (item.sources && item.sources.length > 0) {
    const sourceLabels = item.sources
      .map((s) => s.label)
      .filter(Boolean)
      .join(", ");
    if (sourceLabels) {
      parts.push(`Sources: ${sourceLabels}`);
    }
  }

  // AI analysis
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

  return parts.join("\n\n");
}

// Helper to generate embedding via Voyage API
async function generateEmbedding(
  text: string,
  model: string,
  apiKey: string
): Promise<number[] | null> {
  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: text,
      input_type: "document",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Voyage API error:", errorData);
    return null;
  }

  const data = await response.json();
  return data.data?.[0]?.embedding || null;
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

    const model = process.env.VOYAGE_EMBED_MODEL || DEFAULT_MODEL;

    // Build both embedding texts
    const briefingText = buildBriefingEmbeddingText(item);
    const fullText = buildFullEmbeddingText(item);

    // Require at least some content for embedding
    if (!briefingText.trim() && !fullText.trim()) {
      return NextResponse.json(
        { error: "No content to embed. Add briefing, notes, or tags first." },
        { status: 400 }
      );
    }

    const results: {
      briefing?: { dimensions: number; text: string };
      full?: { dimensions: number; text: string };
    } = {};

    // Generate briefing embedding (if briefing content exists)
    if (briefingText.trim()) {
      const briefingEmbedding = await generateEmbedding(briefingText, model, voyageApiKey);

      if (briefingEmbedding) {
        const embeddingStr = `[${briefingEmbedding.join(",")}]`;

        const { error: briefingError } = await supabase.rpc("update_survey_embedding_briefing", {
          item_id: itemId,
          embedding_vector: embeddingStr,
          embedding_model_name: model,
          embedding_text_content: briefingText,
        });

        if (briefingError) {
          console.warn("Failed to save briefing embedding (RPC may not exist):", briefingError);
        } else {
          results.briefing = { dimensions: briefingEmbedding.length, text: briefingText };
        }
      }
    }

    // Generate full-context embedding
    if (fullText.trim()) {
      const fullEmbedding = await generateEmbedding(fullText, model, voyageApiKey);

      if (fullEmbedding) {
        const embeddingStr = `[${fullEmbedding.join(",")}]`;

        // Try RPC first
        const { error: updateError } = await supabase.rpc("update_survey_embedding", {
          item_id: itemId,
          embedding_vector: embeddingStr,
          embedding_model_name: model,
          embedding_text_content: fullText,
        });

        // Fallback if RPC doesn't exist
        if (updateError) {
          console.log("RPC not available, trying direct update...");

          const { error: fallbackError } = await supabase
            .from("survey_items")
            .update({
              embedding_model: model,
              embedding_text: fullText,
            })
            .eq("id", itemId);

          if (fallbackError) {
            console.error("Failed to save full embedding:", fallbackError);
          }
        }

        results.full = { dimensions: fullEmbedding.length, text: fullText };
      }
    }

    // Check if at least one embedding was generated
    if (!results.briefing && !results.full) {
      return NextResponse.json({ error: "Failed to generate embeddings" }, { status: 500 });
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
      embeddings: results,
      model,
    });
  } catch (error) {
    console.error("POST /api/survey/embed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
