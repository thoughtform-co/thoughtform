// ═══════════════════════════════════════════════════════════════
// SURVEY ITEMS API
// CRUD for design reference items
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized, getServerUser } from "@/lib/auth-server";

const BUCKET_NAME = "survey-media";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// GET - Fetch items with optional filters
export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get authenticated user
    const user = await getServerUser(request);
    if ((!user || !("id" in user) || !user.id) && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");
    const componentKey = searchParams.get("component_key");

    // ═══════════════════════════════════════════════════════════════
    // PERFORMANCE OPTIMIZATION: Exclude large text fields from initial load
    // ═══════════════════════════════════════════════════════════════
    // Exclude large text fields (briefing, description, embedding_text) that aren't
    // needed for grid view. This significantly reduces payload size and improves load time.
    // These fields are typically several KB each and aren't displayed in the grid.
    // Detail view will fetch full data when an item is selected via loadItemFullData().
    // ═══════════════════════════════════════════════════════════════
    // Note: We still include annotations and analysis as they're needed for detail view
    // and are typically smaller. briefing_embedding_text is included for the embedded indicator.
    let query = supabase
      .from("survey_items")
      .select(
        "id, image_path, image_mime, image_width, image_height, title, notes, tags, category_id, component_key, sources, analysis, annotations, briefing_embedding_text, briefing_embedding_model, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    const userIdForQuery =
      user &&
      typeof user === "object" &&
      user !== null &&
      "id" in user &&
      (user as { id?: unknown }).id
        ? String((user as { id: unknown }).id)
        : null;

    // Include legacy rows created in dev (user_id IS NULL) so they remain visible when signed in.
    if (userIdForQuery) {
      query = query.or(`user_id.eq.${userIdForQuery},user_id.is.null`);
    }

    // Apply filters - only if values are provided and not empty
    if (categoryId && categoryId.trim() !== "") {
      query = query.eq("category_id", categoryId);
    }
    if (componentKey && componentKey.trim() !== "") {
      query = query.eq("component_key", componentKey);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching survey items:", error);
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }

    // Generate signed URLs for images
    const itemsWithUrls = await Promise.all(
      (data || []).map(async (item) => {
        if (item.image_path) {
          const { data: signedData } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(item.image_path, SIGNED_URL_EXPIRY);
          return { ...item, image_url: signedData?.signedUrl };
        }
        return item;
      })
    );

    // Also fetch all items for counts (without filters)
    let allItemsQuery = supabase.from("survey_items").select("id, category_id, component_key");
    if (userIdForQuery) {
      allItemsQuery = allItemsQuery.or(`user_id.eq.${userIdForQuery},user_id.is.null`);
    }
    const { data: allData } = await allItemsQuery;

    return NextResponse.json({
      items: itemsWithUrls,
      allItems: allData || [],
    });
  } catch (error) {
    console.error("GET /api/survey/items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Upload new item (multipart/form-data)
export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const categoryId = formData.get("category_id") as string | null;
    const componentKey = formData.get("component_key") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PNG, JPEG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Generate file path
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "png";
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 50);
    const filePath = `uploads/${timestamp}_${safeName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file: " + uploadError.message },
        { status: 500 }
      );
    }

    // Get image dimensions (basic approach - could be enhanced)
    let imageWidth: number | null = null;
    let imageHeight: number | null = null;

    // Get authenticated user
    const user = await getServerUser(request);
    if ((!user || !("id" in user) || !user.id) && process.env.NODE_ENV !== "development") {
      // Clean up uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([uploadData.path]);
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // Insert database record with user_id
    const userId = user && "id" in user ? user.id : null;
    const { data: item, error: dbError } = await supabase
      .from("survey_items")
      .insert({
        user_id: userId,
        category_id: categoryId || null,
        component_key: componentKey || null,
        image_path: uploadData.path,
        image_mime: file.type,
        image_width: imageWidth,
        image_height: imageHeight,
        sources: [],
        tags: [],
        analysis: {},
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file on DB error
      await supabase.storage.from(BUCKET_NAME).remove([uploadData.path]);
      console.error("Database insert error:", dbError);
      return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
    }

    // Generate signed URL for response
    const { data: signedData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(item.image_path, SIGNED_URL_EXPIRY);

    return NextResponse.json({
      item: { ...item, image_url: signedData?.signedUrl },
    });
  } catch (error) {
    console.error("POST /api/survey/items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update item fields
export async function PATCH(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing item id" }, { status: 400 });
    }

    // Only allow updating specific fields
    const allowedFields = [
      "category_id",
      "component_key",
      "title",
      "notes",
      "sources",
      "tags",
      "analysis",
      "annotations",
    ];
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from("survey_items")
      .update(filteredUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating item:", error);
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }

    // Generate signed URL
    if (item.image_path) {
      const { data: signedData } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(item.image_path, SIGNED_URL_EXPIRY);
      return NextResponse.json({
        item: { ...item, image_url: signedData?.signedUrl },
      });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PATCH /api/survey/items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete an item
export async function DELETE(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing item id" }, { status: 400 });
    }

    // Get item to find image path
    const { data: item } = await supabase
      .from("survey_items")
      .select("image_path")
      .eq("id", id)
      .single();

    // Delete from database
    const { error } = await supabase.from("survey_items").delete().eq("id", id);

    if (error) {
      console.error("Error deleting item:", error);
      return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }

    // Delete from storage
    if (item?.image_path) {
      await supabase.storage.from(BUCKET_NAME).remove([item.image_path]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/survey/items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Configure for file uploads
export const runtime = "nodejs";
export const maxDuration = 60;
