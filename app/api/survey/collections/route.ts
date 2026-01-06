// ═══════════════════════════════════════════════════════════════
// SURVEY COLLECTIONS API
// CRUD for grouping related survey items (same brand/website/campaign)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized, getServerUser } from "@/lib/auth-server";

// GET - Fetch all collections for the current user
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

    const user = await getServerUser(request);
    if (!user || !("id" in user) || !user.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("survey_collections")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching collections:", error);
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }

    return NextResponse.json({ collections: data || [] });
  } catch (error) {
    console.error("Collections GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new collection
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

    const user = await getServerUser(request);
    if (!user || !("id" in user) || !user.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("survey_collections")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating collection:", error);
      return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
    }

    return NextResponse.json({ collection: data });
  } catch (error) {
    console.error("Collections POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update a collection
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

    const user = await getServerUser(request);
    if (!user || !("id" in user) || !user.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("id");

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID required" }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if ("name" in body && typeof body.name === "string") {
      updates.name = body.name.trim();
    }
    if ("description" in body) {
      updates.description = body.description?.trim() || null;
    }
    if ("color" in body) {
      updates.color = body.color || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("survey_collections")
      .update(updates)
      .eq("id", collectionId)
      .eq("user_id", user.id) // Ensure user owns the collection
      .select()
      .single();

    if (error) {
      console.error("Error updating collection:", error);
      return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
    }

    return NextResponse.json({ collection: data });
  } catch (error) {
    console.error("Collections PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a collection
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

    const user = await getServerUser(request);
    if (!user || !("id" in user) || !user.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("id");

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID required" }, { status: 400 });
    }

    // Note: Items in this collection will have their collection_id set to NULL
    // due to ON DELETE SET NULL constraint in the database
    const { error } = await supabase
      .from("survey_collections")
      .delete()
      .eq("id", collectionId)
      .eq("user_id", user.id); // Ensure user owns the collection

    if (error) {
      console.error("Error deleting collection:", error);
      return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Collections DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
