"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { EditableText } from "@/components/editor/EditableText";
import { DEFAULT_SECTION_CONTENT, type ProblemContent, type Section } from "@/lib/types";
import { useEditorStore } from "@/store/editor-store";

interface ProblemSectionProps {
  section?: Section;
}

const defaultContent = DEFAULT_SECTION_CONTENT.problem as ProblemContent;

export function ProblemSection({ section }: ProblemSectionProps) {
  const { updateSection } = useEditorStore();

  const content: ProblemContent = {
    ...defaultContent,
    ...(section?.config as Partial<ProblemContent>),
  };

  const updateContent = (updates: Partial<ProblemContent>) => {
    if (!section) return;
    updateSection(section.id, {
      config: { ...content, ...updates },
    });
  };

  const updateSymptom = (index: number, updates: Partial<{ icon: string; text: string }>) => {
    const newSymptoms = [...content.symptoms];
    newSymptoms[index] = { ...newSymptoms[index], ...updates };
    updateContent({ symptoms: newSymptoms });
  };

  return (
    <section id="manifesto" className="section-spacing bg-void">
      <div className="container-base">
        <SectionHeader label="The Problem" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-20">
          <div>
            <h2 className="font-mono text-[clamp(1.75rem,4vw,2.5rem)] tracking-wide uppercase text-dawn mb-8 leading-tight">
              <EditableText
                value={content.title}
                onChange={(title) => updateContent({ title })}
                className="font-mono text-[clamp(1.75rem,4vw,2.5rem)] tracking-wide uppercase text-dawn leading-tight"
              />
            </h2>
            <div className="text-[1.0625rem] leading-[1.8] text-dawn-70">
              <EditableText
                value={content.description}
                onChange={(description) => updateContent({ description })}
                className="text-[1.0625rem] leading-[1.8] text-dawn-70"
                multiline
              />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {content.symptoms.map((symptom, index) => (
              <div 
                key={index}
                className="relative pl-8 border-l-2 border-dawn-15 hover:border-dawn-30 transition-colors duration-slow"
              >
                <span className="absolute -left-3 top-0 font-mono text-2xs text-dawn-30 bg-void py-1">
                  // 0{index + 1}
                </span>
                <div className="font-mono text-sm text-dawn mb-2">
                  <EditableText
                    value={symptom.text}
                    onChange={(text) => updateSymptom(index, { text })}
                    className="font-mono text-sm text-dawn"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
