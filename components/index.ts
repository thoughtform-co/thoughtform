// ═══════════════════════════════════════════════════════════════
// ACTIVE COMPONENTS - Used by the main landing page
// ═══════════════════════════════════════════════════════════════

// UI Components
export { Button } from "./ui/Button";
export { SectionHeader } from "./ui/SectionHeader";
export { Navigation } from "./ui/Navigation";
export { FlowNode } from "./ui/FlowNode";

// Parallax Components
export {
  ParallaxLayer,
  ParallaxContainer,
  FadeInOnScroll,
  ScaleOnScroll,
} from "./parallax/ParallaxLayer";

// ═══════════════════════════════════════════════════════════════
// INTERNAL/LEGACY COMPONENTS - Used only by protected /test/* routes
// These are kept for admin testing but not used in the main app.
// Copies archived in legacy/ folder for reference.
// ═══════════════════════════════════════════════════════════════

// Canvas Components (used by sections)
export { HeroCanvas } from "./canvas/HeroCanvas";
export { AttractorCanvas } from "./canvas/AttractorCanvas";
export { WaveCanvas } from "./canvas/WaveCanvas";
export { ThreeBackground } from "./canvas/ThreeBackground";

// Section Components (used by test routes)
export { HeroSection } from "./sections/HeroSection";
export { ProblemSection } from "./sections/ProblemSection";
export { QuoteSection } from "./sections/QuoteSection";
export { ShiftSection } from "./sections/ShiftSection";
export { ProofSection } from "./sections/ProofSection";
export { TaglineSection } from "./sections/TaglineSection";
export { ServicesSection } from "./sections/ServicesSection";
export { AboutSection } from "./sections/AboutSection";
export { MusingsSection } from "./sections/MusingsSection";
export { CTASection } from "./sections/CTASection";
export { Footer } from "./sections/Footer";
export { FreeformSection } from "./sections/FreeformSection";

// Editor Components (used by sections)
export { PageRenderer } from "./editor/PageRenderer";
export { SectionWrapper } from "./editor/SectionWrapper";
export { SectionToolbar } from "./editor/SectionToolbar";
export { SectionSidebar } from "./editor/SectionSidebar";
export { EditorToolbar } from "./editor/EditorToolbar";
export { PropertyPanel } from "./editor/PropertyPanel";
export { LayerPanel } from "./editor/LayerPanel";
export { BackgroundPicker } from "./editor/BackgroundPicker";
export { DraggableElement } from "./editor/DraggableElement";
export { EditableText } from "./editor/EditableText";
export { EditableImage } from "./editor/EditableImage";
export { EditableButton } from "./editor/EditableButton";
export { KeyboardShortcutsProvider } from "./editor/KeyboardShortcutsProvider";

// Element Components (used by editor)
export { TextElement } from "./editor/elements/TextElement";
export { ImageElement } from "./editor/elements/ImageElement";
export { VideoElement } from "./editor/elements/VideoElement";
export { ButtonElement } from "./editor/elements/ButtonElement";
export { ContainerElement } from "./editor/elements/ContainerElement";
export { DividerElement } from "./editor/elements/DividerElement";
