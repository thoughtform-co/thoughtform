"use client";

import { useEffect, useRef, useState } from "react";

import { mountV7Prototype } from "./prototypeRuntime";

const PROTOTYPE_HTML_URL = "/prototypes/v7/landing-v7-motion.html";
const PROTOTYPE_TOKENS_URL = "/prototypes/v7/tokens.css";

export function LandingV7() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    const controller = new AbortController();

    const loadPrototype = async () => {
      try {
        const [htmlResponse, tokensResponse] = await Promise.all([
          fetch(PROTOTYPE_HTML_URL, { signal: controller.signal }),
          fetch(PROTOTYPE_TOKENS_URL, { signal: controller.signal }),
        ]);

        if (!htmlResponse.ok) {
          throw new Error(`Failed to load prototype HTML (${htmlResponse.status})`);
        }

        if (!tokensResponse.ok) {
          throw new Error(`Failed to load prototype token CSS (${tokensResponse.status})`);
        }

        const [htmlText, tokensCss] = await Promise.all([
          htmlResponse.text(),
          tokensResponse.text(),
        ]);

        if (cancelled || !hostRef.current) return;

        cleanup = mountV7Prototype(hostRef.current, { htmlText, tokensCss });
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unknown v7 prototype load error");
      }
    };

    loadPrototype();

    return () => {
      cancelled = true;
      controller.abort();
      cleanup?.();
    };
  }, []);

  return (
    <section className="v7-shell" aria-label="Thoughtform v7 staging route">
      {status !== "ready" ? (
        <div
          className={`v7-shell__status v7-shell__status--${status}`}
          role={status === "error" ? "alert" : "status"}
        >
          <div className="v7-shell__eyebrow">V7 import runtime</div>
          <h1 className="v7-shell__title">
            {status === "error" ? "Prototype load failed." : "Importing v7 prototype."}
          </h1>
          <p className="v7-shell__copy">
            {status === "error"
              ? errorMessage ||
                "The imported landing source could not be loaded into the staging route."
              : "Loading the exact HTML, token system, and motion behavior from the imported prototype source."}
          </p>
        </div>
      ) : null}

      <div
        ref={hostRef}
        className="v7-shell__host"
        aria-busy={status === "loading"}
        data-status={status}
      />
    </section>
  );
}
