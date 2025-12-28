"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { EditableText } from "@/components/editor/EditableText";
import { DEFAULT_SECTION_CONTENT, type ShiftContent, type Section } from "@/lib/types";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";

interface ShiftSectionProps {
  section?: Section;
}

const defaultContent = DEFAULT_SECTION_CONTENT.shift as ShiftContent;

type CardinalType = "geometry" | "alterity" | "dynamics";
const cardinalColors: Record<CardinalType, { bar: string; text: string }> = {
  geometry: { bar: "bg-gold", text: "text-gold" },
  alterity: { bar: "bg-dawn", text: "text-dawn" },
  dynamics: { bar: "bg-teal", text: "text-teal" },
};
const cardinalTypes: CardinalType[] = ["geometry", "alterity", "dynamics"];

export function ShiftSection({ section }: ShiftSectionProps) {
  const { updateSection } = useEditorStore();

  const content: ShiftContent = {
    ...defaultContent,
    ...(section?.config as Partial<ShiftContent>),
  };

  const updateContent = (updates: Partial<ShiftContent>) => {
    if (!section) return;
    updateSection(section.id, {
      config: { ...content, ...updates },
    });
  };

  const updateCard = (
    index: number,
    updates: Partial<{ icon: string; title: string; description: string }>
  ) => {
    const newCards = [...content.cards];
    newCards[index] = { ...newCards[index], ...updates };
    updateContent({ cards: newCards });
  };

  return (
    <section id="shift" className="section-spacing bg-void">
      <div className="container-base">
        <SectionHeader label="The Shift" />

        <div className="text-center max-w-[640px] mx-auto mb-20">
          <div className="font-mono text-[clamp(1.5rem,3vw,2rem)] tracking-widest uppercase text-gold mb-2">
            <EditableText
              value={content.title}
              onChange={(title) => updateContent({ title })}
              className="font-mono text-[clamp(1.5rem,3vw,2rem)] tracking-widest uppercase text-gold"
            />
          </div>
          <div className="font-mono text-sm text-dawn-50 italic mb-6">(θɔːtfɔːrm / THAWT-form)</div>
          <p className="text-[1.0625rem] text-dawn-70 leading-relaxed">
            <EditableText
              value={content.definition}
              onChange={(definition) => updateContent({ definition })}
              className="text-[1.0625rem] text-dawn-70 leading-relaxed"
              multiline
              as="span"
            />
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {content.cards.map((card, index) => {
            const type = cardinalTypes[index] || "geometry";
            const colors = cardinalColors[type];

            return (
              <div
                key={index}
                className={cn(
                  "relative pt-10 px-8 pb-8",
                  "bg-surface-1 border border-dawn-08",
                  "hover:border-dawn-15 hover:bg-surface-2",
                  "transition-all duration-base"
                )}
              >
                {/* Top accent bar */}
                <div className={cn("absolute top-0 left-0 right-0 h-[3px]", colors.bar)} />

                <div
                  className={cn("font-mono text-2xs uppercase tracking-widest mb-4", colors.text)}
                >
                  {card.icon} {type}
                </div>
                <div className="font-mono text-[15px] text-dawn mb-3 leading-snug">
                  <EditableText
                    value={card.title}
                    onChange={(title) => updateCard(index, { title })}
                    className="font-mono text-[15px] text-dawn leading-snug"
                  />
                </div>
                <div className="text-sm text-dawn-50 leading-relaxed">
                  <EditableText
                    value={card.description}
                    onChange={(description) => updateCard(index, { description })}
                    className="text-sm text-dawn-50 leading-relaxed"
                    multiline
                    as="span"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
