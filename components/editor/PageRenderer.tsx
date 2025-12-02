"use client";

import { useEffect, useState } from "react";
import { useEditorStore, useSections, useIsEditMode } from "@/store/editor-store";
import { initializeHomePage } from "@/lib/queries";
import { Navigation } from "@/components/ui/Navigation";
import { FlowNode } from "@/components/ui/FlowNode";
import { Footer } from "@/components/sections/Footer";
import { SectionWrapper } from "./SectionWrapper";
import { EditorToolbar } from "./EditorToolbar";
import { SectionSidebar } from "./SectionSidebar";
import { PropertyPanel } from "./PropertyPanel";
import { LayerPanel } from "./LayerPanel";
import type { Section, Page } from "@/lib/types";

// Default sections for the landing page (used if Supabase has no data)
const DEFAULT_SECTIONS: Section[] = [
  { id: "hero", pageId: "home", type: "hero", orderIndex: 0, config: {}, background: null, minHeight: "100vh", createdAt: "", updatedAt: "" },
  { id: "problem", pageId: "home", type: "problem", orderIndex: 1, config: {}, background: null, minHeight: "auto", createdAt: "", updatedAt: "" },
  { id: "quote", pageId: "home", type: "quote", orderIndex: 2, config: {}, background: null, minHeight: "auto", createdAt: "", updatedAt: "" },
  { id: "shift", pageId: "home", type: "shift", orderIndex: 3, config: {}, background: null, minHeight: "auto", createdAt: "", updatedAt: "" },
  { id: "proof", pageId: "home", type: "proof", orderIndex: 4, config: {}, background: null, minHeight: "auto", createdAt: "", updatedAt: "" },
  { id: "tagline", pageId: "home", type: "tagline", orderIndex: 5, config: {}, background: null, minHeight: "auto", createdAt: "", updatedAt: "" },
  { id: "services", pageId: "home", type: "services", orderIndex: 6, config: {}, background: null, minHeight: "auto", createdAt: "", updatedAt: "" },
  { id: "about", pageId: "home", type: "about", orderIndex: 7, config: {}, background: null, minHeight: "auto", createdAt: "", updatedAt: "" },
  { id: "musings", pageId: "home", type: "musings", orderIndex: 8, config: {}, background: null, minHeight: "auto", createdAt: "", updatedAt: "" },
  { id: "cta", pageId: "home", type: "cta", orderIndex: 9, config: {}, background: null, minHeight: "auto", createdAt: "", updatedAt: "" },
];

const DEFAULT_PAGE: Page = {
  id: "home",
  slug: "home",
  title: "Thoughtform | Navigate AI for Creative Breakthroughs",
  createdAt: "",
  updatedAt: "",
};

// Sections that should have flow nodes before them
const FLOW_NODE_BEFORE: string[] = ["problem", "shift", "services", "about", "musings"];

export function PageRenderer() {
  const { setPage, setSections } = useEditorStore();
  const sections = useSections();
  const isEditMode = useIsEditMode();
  const [isLoading, setIsLoading] = useState(true);

  // Load or initialize page data from Supabase
  useEffect(() => {
    async function loadPage() {
      try {
        // This will create the page/sections if they don't exist
        const data = await initializeHomePage();
        
        if (data && data.sections.length > 0) {
          // Use data from Supabase
          setPage(data.page);
          setSections(data.sections);
          console.log("✓ Loaded page from database");
        } else {
          // Fall back to defaults (Supabase not configured)
          setPage(DEFAULT_PAGE);
          setSections(DEFAULT_SECTIONS);
          console.log("→ Using default sections (Supabase not configured)");
        }
      } catch (error) {
        console.error("Failed to load page:", error);
        // Fall back to defaults on error
        setPage(DEFAULT_PAGE);
        setSections(DEFAULT_SECTIONS);
      } finally {
        setIsLoading(false);
      }
    }

    loadPage();
  }, [setPage, setSections]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="font-mono text-2xs uppercase tracking-widest text-dawn-30 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Editor UI */}
      <EditorToolbar />
      
      {isEditMode && (
        <>
          <SectionSidebar />
          <PropertyPanel />
          <LayerPanel />
        </>
      )}

      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <main className="relative bg-void">
        {sections.map((section, index) => (
          <div key={section.id}>
            {/* Flow node before certain sections */}
            {FLOW_NODE_BEFORE.includes(section.type) && index > 0 && <FlowNode />}
            
            {/* Section */}
            <SectionWrapper section={section} />
          </div>
        ))}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
