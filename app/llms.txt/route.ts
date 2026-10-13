import { HANDSHAKE } from "@/lib/handshake/text";
import { publishedPosts } from "@/lib/musings/registry";

/**
 * /llms.txt — the site's index for language models, on the llms.txt
 * convention (a Markdown file at the root: a title, a one-line summary,
 * sections of links). It exists so the handshake can be found by the one
 * discovery convention there is (ADR-157), and it lists exactly what
 * `app/sitemap.ts` lists: the routes meant to be found.
 *
 * ⚠ THE MUSINGS ARE FILES READ BY PATH, so this route has its own row in
 * `next.config.mjs` `outputFileTracingIncludes`; without it the route works
 * in dev and 500s on Vercel.
 *
 * ⚠ THE SUMMARY IS THE SITE'S OWN LINE (the About), never a second pitch.
 */
export const dynamic = "force-static";

const SITE = "https://thoughtform.co";

export function GET(): Response {
  const posts = publishedPosts()
    .map((post) => `- [${post.title}](${SITE}/musings/${post.slug}): ${post.summary}`)
    .join("\n");

  const body = `# Thoughtform

> Vince Buyssens' practice in Antwerp. AI isn't software to command, but an intelligence to navigate; Thoughtform helps teams build that relationship.

## The site

- [Home](${SITE}/): the thesis, the Arc (Navigate, Encode, Build), the proof, the services, and who Vince is
- [Home sessions](${SITE}/home-sessions): small mornings at the owner's table in Antwerp
- [Musings](${SITE}/musings): the writing

## Musings

${posts}

## For machine readers

- [Handshake](${HANDSHAKE.canonical}): a letter from Vince to the non-human readers of this site. It carries no instructions.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
