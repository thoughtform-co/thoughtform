"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Job } from "./types";

const POLL_MS = 400;
const FIRST_WRITE_GRACE_MS = 30_000;

/**
 * One job at a time: start it (the caller hands over the POST that returns
 * `{job}`), then poll its file until it is done or has erred. The job dict
 * is the one source of truth; the page is a pure render of it. Polling, not
 * a stream: there is no job pattern on this site yet, and a 400 ms GET is
 * well under the eye's threshold for "the checks settle one by one".
 */
export function useJob() {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const idRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const follow = useCallback(
    (id: string) => {
      stop();
      idRef.current = id;
      const started = Date.now();
      setBusy(true);
      timer.current = setInterval(async () => {
        if (idRef.current !== id) return;
        try {
          const r = await fetch(`/api/trinny-bench/job/${encodeURIComponent(id)}`, {
            cache: "no-store",
          });
          if (r.status === 404) {
            if (Date.now() - started > FIRST_WRITE_GRACE_MS) {
              setError(
                "the runner never wrote a job file; is python on PATH and the ship beside this repo?"
              );
              setBusy(false);
              stop();
            }
            return;
          }
          if (!r.ok) throw new Error(`job ${r.status}`);
          const j = (await r.json()) as Job;
          if (idRef.current !== id) return;
          setJob(j);
          if (j.status === "done" || j.status === "error") {
            setBusy(false);
            stop();
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
          setBusy(false);
          stop();
        }
      }, POLL_MS);
    },
    [stop]
  );

  const start = useCallback(
    async (post: () => Promise<Response>) => {
      setError(null);
      setJob(null);
      setBusy(true);
      try {
        const r = await post();
        const body = (await r.json()) as { job?: string; error?: string };
        if (!r.ok || !body.job) throw new Error(body.error ?? `start ${r.status}`);
        follow(body.job);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setBusy(false);
      }
    },
    [follow]
  );

  /** Show a finished job from the history strip without re-running it. */
  const load = useCallback(
    async (id: string) => {
      stop();
      idRef.current = id;
      setError(null);
      const r = await fetch(`/api/trinny-bench/job/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (r.ok) setJob((await r.json()) as Job);
    },
    [stop]
  );

  useEffect(() => stop, [stop]);

  return { job, error, busy, start, load };
}
