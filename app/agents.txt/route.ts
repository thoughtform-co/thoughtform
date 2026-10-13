import { AGENTS_TXT_HEADERS, renderAgentsTxt } from "@/lib/agents/text";

/**
 * /agents.txt — the site's declaration for software agents (ADR-157). The
 * text is `lib/agents/text.ts`; this serves it and nothing else.
 *
 * Static: the text is a constant of the build. `/.well-known/agents.txt`
 * serves the same bytes, and `/agent.txt` redirects here (`next.config.mjs`).
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(renderAgentsTxt(), { headers: AGENTS_TXT_HEADERS });
}
