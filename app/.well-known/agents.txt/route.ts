import { AGENTS_TXT_HEADERS, renderAgentsTxt } from "@/lib/agents/text";

/**
 * /.well-known/agents.txt — the address the Internet-Draft names first
 * (ADR-157). Same bytes as `/agents.txt`, whose address the `Link` header
 * gives as the canonical one, so an agent that asks at either gets one file.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(renderAgentsTxt(), { headers: AGENTS_TXT_HEADERS });
}
