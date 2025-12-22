"use client";

import { Component, ReactNode } from "react";

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback to render on error. Defaults to a dark background. */
  fallback?: ReactNode;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for WebGL/Canvas components.
 *
 * Catches errors from ParticleCanvasV2, ThreeGateway, and other 3D/canvas
 * components to prevent the entire page from crashing if WebGL fails.
 *
 * Usage:
 * ```tsx
 * <CanvasErrorBoundary>
 *   <ParticleCanvasV2 config={config} />
 * </CanvasErrorBoundary>
 * ```
 */
export class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  constructor(props: CanvasErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("CanvasErrorBoundary caught an error:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback ?? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--void, #0a0908)",
              width: "100%",
              height: "100%",
            }}
            aria-hidden="true"
          />
        )
      );
    }

    return this.props.children;
  }
}

export default CanvasErrorBoundary;
