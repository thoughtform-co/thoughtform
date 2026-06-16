/**
 * Scope the v7 prototype's stylesheet for embedded use inside the
 * Next.js app. The prototype was authored as a stand-alone HTML
 * page with `:root`, `html, body`, and `body.theme-*` selectors;
 * we rewrite each of those to `.v7-doc` so the rules can apply to
 * the React-rendered prototype shell without leaking into the rest
 * of the app.
 *
 * Currently exposed as part of the parser's `scopedCss` return —
 * historically used when the prototype was rendered into a Shadow
 * DOM. Production stopped consuming `scopedCss` once the static
 * `landing.css` import covered the page; the helper stays in case
 * any future route needs the inline scoping again.
 */
export function scopeV7Css(tokensCss: string, inlineStyles: string): string {
  const bootstrap = `.v7-doc {
  position: relative;
  min-height: 100vh;
  --depth: 0;
  --hero-cover: 0;
}`;

  const fixedTokens = tokensCss.replace(/url\(['"]?fonts\//g, "url('/fonts/");

  return [bootstrap, fixedTokens, inlineStyles]
    .join("\n")
    .replace(/:root/g, ".v7-doc")
    .replace(/\[data-theme="light"\]/g, '.v7-doc[data-theme="light"]')
    .replace(/html,\s*body/g, ".v7-doc")
    .replace(/\bbody(?=(?:\.[A-Za-z-]+|\[[^\]]+\]|\s*\{))/g, ".v7-doc");
}
