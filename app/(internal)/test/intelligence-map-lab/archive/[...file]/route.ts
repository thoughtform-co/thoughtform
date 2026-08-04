import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

/**
 * The lab's ARCHIVE FILE SERVER — stills only.
 *
 * WHY A ROUTE HANDLER AND NOT `public/`. The whole variant system is required to
 * live inside this lab folder, and `public/` is outside it. So the contact-sheet
 * PNGs sit in `lab-archive/stills/` and are read off disk here. Dev-only by
 * construction: `/test/*` is rewritten to a 404 by `proxy.ts` in production and
 * the route group's layout gates on the allowed user.
 *
 * ⚠ THE OWNER'S THREE HTML PROTOTYPES DO NOT COME THROUGH HERE. Every response
 * in this app carries `X-Frame-Options: DENY` (`lib/security/headers.mjs`),
 * which blocks a same-origin iframe as hard as a cross-origin one — so the
 * archive variants read their file on the SERVER and hand it to the iframe as
 * `srcDoc`. A `srcdoc` document has no HTTP response of its own, so the frame
 * header cannot apply to it, and the page still renders byte-exact.
 */

const ROOT = path.join(
  process.cwd(),
  "app",
  "(internal)",
  "test",
  "intelligence-map-lab",
  "lab-archive"
);

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ file: string[] }> }) {
  const { file } = await ctx.params;

  /* Traversal guard. The segments are decoded by the router, so a `..` would
     arrive intact — resolve first, then prove the result is still inside ROOT. */
  const target = path.resolve(ROOT, ...file);
  if (!target.startsWith(ROOT + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const type = TYPES[path.extname(target).toLowerCase()];
  if (!type) return new NextResponse("Unsupported", { status: 415 });

  try {
    const bytes = await readFile(target);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: { "Content-Type": type, "Cache-Control": "no-store" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
