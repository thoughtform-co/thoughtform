import { HANDSHAKE, renderHandshake } from "@/lib/handshake/text";

/**
 * /handshake.txt — the owner's letter to the non-human readers of this site
 * (ADR-157). The text is `lib/handshake/text.ts`; this serves it and nothing
 * else.
 *
 * Static: the text is a constant of the build. Open CORS, so an agent in a
 * browser can fetch it from any page. The `Link` header names the canonical
 * address because the site also answers on its Vercel hostname.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(renderHandshake(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      Link: `<${HANDSHAKE.canonical}>; rel="canonical"`,
    },
  });
}
