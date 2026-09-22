import { NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/api/guards";

import { devOnly, getConfig } from "../_lib/bench";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** What the page needs to draw itself: the rubric's checks with their
 *  captions, the subjects with their bands, the types, the session. */
export async function GET(request: NextRequest) {
  const gate = devOnly();
  if (gate) return gate;
  try {
    const fresh = request.nextUrl.searchParams.get("fresh") === "1";
    return jsonSuccess(await getConfig(fresh));
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500, "bench_config");
  }
}
