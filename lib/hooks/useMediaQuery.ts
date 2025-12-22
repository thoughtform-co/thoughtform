"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

/**
 * Hook to detect if a media query matches
 * Uses useSyncExternalStore for proper SSR hydration
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Use useSyncExternalStore for proper SSR support
  const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") return () => {};

    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
  };

  const getSnapshot = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Hook to detect if viewport is mobile (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}

/**
 * Hook to detect if viewport is tablet (768px - 1024px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
}

/**
 * Hook to detect if viewport is desktop (> 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1025px)");
}
