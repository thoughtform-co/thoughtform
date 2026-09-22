import { ThemeLock } from "@/components/landing/v7/ThemeLock";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";

import { TrinnyBench } from "./TrinnyBench";

// landing.css carries the @font-face block and the token chain; theme.css
// the light cascade (the route is light-locked, ADR-093); the route's own
// sheet last so its scoped rules win. No sheet, no HUD: the module stands
// alone (ADR-120 Update 1).
import "@/components/landing/v7/landing.css";
import "@/components/landing/v7/theme.css";
import "./trinny-bench.css";

/**
 * /test/trinny-bench — the Trinny London brand bench (ADR-120, Update 1).
 *
 * A live module, not a curated one: generate a product image with the
 * ship's harness or upload one, and have the rubric grade it three times
 * with the colour measured in code. The judgment lives in the sibling repo
 * (`Arcs_Trinny London/skill/references/`); this page is its face, in the
 * grammar of Moira's workshop bench: one module, a switch, three views and
 * a rail of checks, on the plain ground of the client's own product tiles.
 *
 * `?offline=1` rehearses against the harness's deterministic fake grader
 * with the colour layer still real; a Generate still draws for real.
 * `?job=<id>` opens a job from today's session without re-running it.
 */

const JOB_ID = /^[A-Za-z0-9_-]{1,80}$/;

export default async function TrinnyBenchRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const offline = sp.offline === "1";
  const job = typeof sp.job === "string" && JOB_ID.test(sp.job) ? sp.job : null;
  return (
    <>
      {THEME_TOGGLE && <ThemeLock />}
      <main className="tb-root">
        <div className="tb-page">
          <header className="tb-head">
            {/* eslint-disable-next-line @next/next/no-img-element -- the client's own mark, their grey */}
            <img
              className="tb-head__mark"
              src="/trinny-london/trinny-london-mark.svg"
              alt="Trinny London"
              width={40}
              height={40}
            />
            <h1 className="tb-head__title">
              <span>Generate a product image, or drop one in.</span>{" "}
              <span className="tb-head__accent">The rubric checks it.</span>
            </h1>
            <p className="tb-head__lede">
              Three grades, the majority per check. Colour is measured in code against the
              product&rsquo;s own tile. Nothing here decides: a person is the gate.
            </p>
          </header>
          <TrinnyBench offline={offline} jobId={job} />
        </div>
      </main>
    </>
  );
}
