import { readFile } from "node:fs/promises";

import { NextRequest, NextResponse } from "next/server";

import { jsonError } from "@/lib/api/guards";

import { devOnly, mimeOf, servable } from "../_lib/bench";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Serve one image from Drive or the skill's assets, and nothing else: the
 *  path is resolved and must sit under one of those two roots. */
export async function GET(request: NextRequest) {
  const gate = devOnly();
  if (gate) return gate;
  const p = request.nextUrl.searchParams.get("p") ?? "";
  if (!p) return jsonError("p is required", 400, "bench_img");
  try {
    if (!(await servable(p))) return jsonError("not under a servable root", 403, "bench_img_root");
    const bytes = await readFile(p);
    return new NextResponse(bytes, {
      status: 200,
      headers: { "Content-Type": mimeOf(p), "Cache-Control": "no-store" },
    });
  } catch {
    return jsonError("not found", 404, "bench_img");
  }
}
