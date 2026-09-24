"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { record } from "@/lib/landing/blackBox";

import { ProofStack } from "./proof-stack/ProofStack";

interface Props {
  children: ReactNode;
  /** Passed through to the fallback pile so it renders the same record. */
  fallback: ReactNode;
}

interface State {
  error: Error | null;
  /** True when the fallback ITSELF threw: render nothing. */
  fallbackFailed: boolean;
}

/**
 * The services stage's error boundary (ADR-123 §Part 1, commit A).
 *
 * `ServicesPortal` mounts the whole `#services` beat in its own React root,
 * and a root has no boundary above it: an uncaught error anywhere in the
 * stage — the pile, the ring, the band — empties the station. The station is
 * most of the page's height, so the document collapses under the reader and
 * the scroll clamps, which reads exactly like "it reloaded and landed
 * somewhere else". The phone diag could not tell those apart, and neither
 * could the owner.
 *
 * The fallback is the PILE ALONE (the record the section exists to show, and
 * the bulk of its height), or nothing if the pile is what threw. Either way
 * the error is logged under `[services-boundary]` and written to the black
 * box with the scroll position, so a reload's PREV line names it.
 *
 * ⚠ React UNMOUNTS an errored subtree — the fallback is a fresh `ProofStack`,
 * not the one that threw, and its channels re-seed from rects on the next
 * frame. Nothing in the corridor's own root is touched.
 */
export class ServicesBoundary extends Component<Props, State> {
  state: State = { error: null, fallbackFailed: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[services-boundary]", error.message);
    if (process.env.NODE_ENV === "development") {
      console.error("ServicesBoundary caught:", error);
      console.error("Component stack:", info.componentStack);
    }
    if (this.state.error && this.state.error !== error) {
      // The fallback threw too.
      this.setState({ fallbackFailed: true });
    }
    record({
      err: `${error.name}: ${error.message}`.slice(0, 200),
      errStack: (error.stack ?? "").split("\n").slice(0, 4).join(" | ").slice(0, 400),
      errY: Math.round(window.scrollY),
      errAt: Date.now(),
    });
  }

  render(): ReactNode {
    if (this.state.fallbackFailed) return null;
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

/** The fallback `ServicesPortal` hands the boundary: the pile, whole. */
export function ServicesFallbackPile(props: React.ComponentProps<typeof ProofStack>) {
  return (
    <div className="services-stage services-stage--fallback" data-services-fallback="">
      <ProofStack {...props} />
    </div>
  );
}
