"use client";

import { EditableText } from "@/components/editor/EditableText";
import { EditableButton } from "@/components/editor/EditableButton";
import { DEFAULT_SECTION_CONTENT, type CTAContent, type Section } from "@/lib/types";
import { useEditorStore } from "@/store/editor-store";

interface CTASectionProps {
  section?: Section;
}

const defaultContent = DEFAULT_SECTION_CONTENT.cta as CTAContent;

export function CTASection({ section }: CTASectionProps) {
  const { updateSection } = useEditorStore();

  // Merge section config with defaults
  const content: CTAContent = {
    ...defaultContent,
    ...(section?.config as Partial<CTAContent>),
  };

  const updateContent = (updates: Partial<CTAContent>) => {
    if (!section) return;
    updateSection(section.id, {
      config: { ...content, ...updates },
    });
  };

  return (
    <section id="contact" className="section-spacing text-center">
      <div className="container-narrow">
        <h2 className="font-mono text-[clamp(1.5rem,3vw,2rem)] tracking-wide uppercase text-dawn mb-6">
          <EditableText
            value={content.headline}
            onChange={(headline) => updateContent({ headline })}
            className="font-mono text-[clamp(1.5rem,3vw,2rem)] tracking-wide uppercase text-dawn"
          />
        </h2>
        {content.subheadline && (
          <p className="text-[1.0625rem] text-dawn-70 leading-relaxed max-w-[560px] mx-auto mb-10">
            <EditableText
              value={content.subheadline}
              onChange={(subheadline) => updateContent({ subheadline })}
              className="text-[1.0625rem] text-dawn-70 leading-relaxed"
              multiline
              as="span"
            />
          </p>
        )}
        <div className="flex gap-3 justify-center flex-wrap">
          <EditableButton
            config={content.primaryButton}
            onChange={(primaryButton) => updateContent({ primaryButton })}
          />
          {content.secondaryButton && (
            <EditableButton
              config={content.secondaryButton}
              onChange={(secondaryButton) => updateContent({ secondaryButton })}
            />
          )}
        </div>
      </div>
    </section>
  );
}
