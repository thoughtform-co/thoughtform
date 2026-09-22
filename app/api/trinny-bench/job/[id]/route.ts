import { NextRequest } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/api/guards";

import { devOnly, readJob } from "../../_lib/bench";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One job, as the runner last wrote it. 404 until its first write lands. */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = devOnly();
  if (gate) return gate;
  const { id } = await ctx.params;
  try {
    const job = await readJob(id);
    if (!job) return jsonError("no such job yet", 404, "bench_job");
    return jsonSuccess(job);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : String(e), 500, "bench_job");
  }
}
