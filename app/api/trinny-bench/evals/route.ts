import { jsonError, jsonSuccess } from "@/lib/api/guards";

import { devOnly, runSync } from "../_lib/bench";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** The newest regression result: every pinned negative, its hit rate per
 *  check across the runs, and whether it held. */
export async function GET() {
  const gate = devOnly();
  if (gate) return gate;
  try {
    return jsonSuccess(await runSync(["evals"], 60_000));
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500, "bench_evals");
  }
}
