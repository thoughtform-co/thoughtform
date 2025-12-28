"use client";

import { EditableText } from "@/components/editor/EditableText";
import { type Section } from "@/lib/types";
import { useEditorStore } from "@/store/editor-store";

interface ProofSectionProps {
  section?: Section;
}

interface ProofContent {
  title: string;
  logos: string[];
}

const defaultContent: ProofContent = {
  title: "Trusted By",
  logos: ["ACC Belgium", "Tool", "Thomas More", "Voka", "Loop Earplugs"],
};

export function ProofSection({ section }: ProofSectionProps) {
  const { updateSection } = useEditorStore();

  const content: ProofContent = {
    ...defaultContent,
    ...(section?.config as Partial<ProofContent>),
  };

  const updateContent = (updates: Partial<ProofContent>) => {
    if (!section) return;
    updateSection(section.id, {
      config: { ...content, ...updates },
    });
  };

  const updateLogo = (index: number, value: string) => {
    const newLogos = [...content.logos];
    newLogos[index] = value;
    updateContent({ logos: newLogos });
  };

  return (
    <section className="py-[60px] md:py-[80px] text-center">
      <div className="container-base">
        <div className="font-mono text-2xs uppercase tracking-[0.15em] text-dawn-30 mb-8">
          <EditableText
            value={content.title}
            onChange={(title) => updateContent({ title })}
            className="font-mono text-2xs uppercase tracking-[0.15em] text-dawn-30"
          />
        </div>
        <div className="flex items-center justify-center gap-12 flex-wrap">
          {content.logos.map((logo, index) => (
            <span
              key={index}
              className="font-mono text-xs text-dawn-30 hover:text-dawn-50 transition-colors duration-base"
            >
              <EditableText
                value={logo}
                onChange={(value) => updateLogo(index, value)}
                className="font-mono text-xs text-dawn-30"
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
