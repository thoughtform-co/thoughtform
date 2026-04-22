/**
 * Seed celestial_designs + celestial_slots from the hardcoded seed data.
 *
 * Usage:
 *   npx tsx scripts/seed-celestial.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */
import { createClient } from "@supabase/supabase-js";
import { SEED_CONFIGS, SEED_SLOT_ASSIGNMENTS } from "../lib/celestial/seed-data";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Seeding celestial designs...");

  const designIdMap: Record<string, string> = {};

  for (const [name, config] of Object.entries(SEED_CONFIGS)) {
    const { data: existing } = await supabase
      .from("celestial_designs")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      console.log(`  [skip] "${name}" already exists (${existing.id})`);
      designIdMap[name] = existing.id;
      continue;
    }

    const { data, error } = await supabase
      .from("celestial_designs")
      .insert({ name, config })
      .select("id")
      .single();

    if (error) {
      console.error(`  [error] "${name}":`, error.message);
      continue;
    }

    console.log(`  [created] "${name}" → ${data.id}`);
    designIdMap[name] = data.id;
  }

  console.log("\nAssigning designs to slots...");

  for (const [slotId, designName] of Object.entries(SEED_SLOT_ASSIGNMENTS)) {
    const designId = designIdMap[designName];
    if (!designId) {
      console.error(`  [skip] No design id for "${designName}"`);
      continue;
    }

    const { error } = await supabase
      .from("celestial_slots")
      .upsert(
        { slot_id: slotId, design_id: designId, orientation: "horizontal", enabled: true },
        { onConflict: "slot_id" }
      );

    if (error) {
      console.error(`  [error] slot "${slotId}":`, error.message);
    } else {
      console.log(`  [assigned] "${slotId}" → "${designName}" (${designId})`);
    }
  }

  console.log("\nDone.");
}

main();
