import { supabase, isSupabaseConfigured } from "./supabase";
import type { Page, Section, Element, SectionType, ElementType, ElementContent, BackgroundConfig } from "./types";

// ═══════════════════════════════════════════════════════════════════
// TYPE CONVERTERS (snake_case <-> camelCase)
// ═══════════════════════════════════════════════════════════════════

function toPage(row: Record<string, unknown>): Page {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toSection(row: Record<string, unknown>): Section {
  return {
    id: row.id as string,
    pageId: row.page_id as string,
    type: row.type as SectionType,
    orderIndex: row.order_index as number,
    config: (row.config as Record<string, unknown>) ?? {},
    background: row.background as BackgroundConfig | null,
    minHeight: (row.min_height as string) ?? "auto",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toElement(row: Record<string, unknown>): Element {
  return {
    id: row.id as string,
    sectionId: row.section_id as string,
    type: row.type as ElementType,
    x: row.x as number,
    y: row.y as number,
    width: row.width as number | null,
    height: row.height as number | null,
    content: row.content as ElementContent,
    zIndex: row.z_index as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ═══════════════════════════════════════════════════════════════════
// PAGE QUERIES
// ═══════════════════════════════════════════════════════════════════

export async function getPageBySlug(slug: string): Promise<Page | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return toPage(data);
}

export async function createPage(slug: string, title?: string): Promise<Page | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("pages")
    .insert({ slug, title })
    .select()
    .single();

  if (error || !data) return null;
  return toPage(data);
}

export async function updatePage(id: string, updates: Partial<Pick<Page, "slug" | "title">>): Promise<Page | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("pages")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return toPage(data);
}

// ═══════════════════════════════════════════════════════════════════
// SECTION QUERIES
// ═══════════════════════════════════════════════════════════════════

export async function getSectionsByPageId(pageId: string): Promise<Section[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("page_id", pageId)
    .order("order_index", { ascending: true });

  if (error || !data) return [];
  return data.map(toSection);
}

export async function createSection(
  pageId: string,
  type: SectionType,
  orderIndex: number,
  config: Record<string, unknown> = {},
  background: BackgroundConfig | null = null,
  minHeight = "auto"
): Promise<Section | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("sections")
    .insert({
      page_id: pageId,
      type,
      order_index: orderIndex,
      config,
      background,
      min_height: minHeight,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toSection(data);
}

export async function updateSection(
  id: string,
  updates: Partial<Pick<Section, "type" | "orderIndex" | "config" | "background" | "minHeight">>
): Promise<Section | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
  if (updates.config !== undefined) dbUpdates.config = updates.config;
  if (updates.background !== undefined) dbUpdates.background = updates.background;
  if (updates.minHeight !== undefined) dbUpdates.min_height = updates.minHeight;

  const { data, error } = await supabase
    .from("sections")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return toSection(data);
}

export async function deleteSection(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase.from("sections").delete().eq("id", id);
  return !error;
}

export async function reorderSections(pageId: string, sectionIds: string[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const client = supabase; // Local reference for TypeScript
  
  // Update each section's order_index
  const updates = sectionIds.map((id, index) =>
    client.from("sections").update({ order_index: index }).eq("id", id)
  );

  const results = await Promise.all(updates);
  return results.every((r) => !r.error);
}

// ═══════════════════════════════════════════════════════════════════
// ELEMENT QUERIES
// ═══════════════════════════════════════════════════════════════════

export async function getElementsBySectionId(sectionId: string): Promise<Element[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("elements")
    .select("*")
    .eq("section_id", sectionId)
    .order("z_index", { ascending: true });

  if (error || !data) return [];
  return data.map(toElement);
}

export async function createElement(
  sectionId: string,
  type: ElementType,
  x: number,
  y: number,
  content: ElementContent,
  width?: number,
  height?: number,
  zIndex = 0
): Promise<Element | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("elements")
    .insert({
      section_id: sectionId,
      type,
      x,
      y,
      width,
      height,
      content,
      z_index: zIndex,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toElement(data);
}

export async function updateElement(
  id: string,
  updates: Partial<Pick<Element, "x" | "y" | "width" | "height" | "content" | "zIndex">>
): Promise<Element | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.x !== undefined) dbUpdates.x = updates.x;
  if (updates.y !== undefined) dbUpdates.y = updates.y;
  if (updates.width !== undefined) dbUpdates.width = updates.width;
  if (updates.height !== undefined) dbUpdates.height = updates.height;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.zIndex !== undefined) dbUpdates.z_index = updates.zIndex;

  const { data, error } = await supabase
    .from("elements")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return toElement(data);
}

export async function deleteElement(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase.from("elements").delete().eq("id", id);
  return !error;
}

// ═══════════════════════════════════════════════════════════════════
// BATCH OPERATIONS
// ═══════════════════════════════════════════════════════════════════

export async function getPageWithSections(slug: string): Promise<{ page: Page; sections: Section[] } | null> {
  const page = await getPageBySlug(slug);
  if (!page) return null;

  const sections = await getSectionsByPageId(page.id);
  return { page, sections };
}

export async function savePage(page: Page, sections: Section[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  // Update page
  await updatePage(page.id, { slug: page.slug, title: page.title ?? undefined });

  // Reorder sections
  const sectionIds = sections.map((s) => s.id);
  await reorderSections(page.id, sectionIds);

  return true;
}

