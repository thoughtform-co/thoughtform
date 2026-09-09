/**
 * The pre-paint theme bootstrap (ADR-058, extended by ADR-093).
 *
 * Lifted out of `app/layout.tsx` when the route lock was added, on the
 * `heroPreloadScript()` precedent: an inline script is a STRING, nothing
 * type-checks it, and every failure mode is silent — so it is built from
 * the same constants the rest of the app reads and pinned by a test.
 *
 * It runs before `<body>` paints, which is the whole point: the light
 * cascade has to apply on the FIRST paint or a light visitor sees a frame
 * of dark. Order:
 *
 *   1. the ROUTE LOCK (ADR-093) — a locked route is light, full stop, and
 *      returns before anything else is read;
 *   2. `?theme=light|dark` — the QA / Playwright override, never persisted;
 *   3. `localStorage["tf-theme"]` — the visitor's own choice;
 *   4. dark.
 *
 * ⚠ THE LOCK IS FIRST, AND THAT ORDER IS THE DECISION. It beats a stored
 * preference (the reader may have chosen dark on `/` months ago) and it
 * beats `?theme=dark` (there is no legitimate reason to force a pitch page
 * into a theme it was not composed in; a smoke that wants to prove the lock
 * holds asks for dark and asserts it does not get it).
 *
 * ⚠ THE LOCK NEVER WRITES STORAGE. `data-theme` is a paint decision;
 * `tf-theme` is the visitor's. A lock that persisted itself would follow
 * the reader back to `/` and silently change a site they never asked to
 * change.
 *
 * ⚠ The attribute is only ever "light" or ABSENT — dark is the unqualified
 * `:root` default and is never written as a value (ADR-058: eleven inner
 * elements carry an inert `data-theme="dark"`, so a dark-keyed selector
 * would double-match them).
 */

import { THEME_STORAGE_KEY } from "@/components/landing/v7/themeToggle";

import { LIGHT_LOCKED_ROUTES, THEME_LOCK_ATTR } from "./themeLock";

/**
 * The inline script's source.
 *
 * Everything it needs is inlined as a JSON literal rather than read at
 * runtime: it executes before any module graph exists.
 */
export const themeBootstrapScript = (): string =>
  `(function(){try{` +
  `var d=document.documentElement;` +
  // 1 — the route lock. Stamps BOTH attributes and returns: the second one
  //     is what the route sheet keys its hidden switch off, and what the
  //     smoke asserts, so a lock that set only `data-theme` would be
  //     indistinguishable from a visitor who happened to prefer light.
  `var p=location.pathname.replace(/\\/+$/,"")||"/";` +
  `if(${JSON.stringify(LIGHT_LOCKED_ROUTES)}.indexOf(p)>=0){` +
  `d.setAttribute("data-theme","light");` +
  `d.setAttribute(${JSON.stringify(THEME_LOCK_ATTR)},"light");` +
  `return;}` +
  // 2–4 — ADR-058's original chain, unchanged.
  `var q=new URLSearchParams(location.search).get("theme");` +
  `var s=null;try{s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}` +
  `var t=(q==="light"||q==="dark")?q:((s==="light"||s==="dark")?s:"dark");` +
  `if(t==="light")d.setAttribute("data-theme","light");` +
  `}catch(e){}})();`;
