"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { EditableText } from "@/components/editor/EditableText";
import { DEFAULT_SECTION_CONTENT, type ServicesContent, type Section } from "@/lib/types";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";

interface ServicesSectionProps {
  section?: Section;
}

const defaultContent = DEFAULT_SECTION_CONTENT.services as ServicesContent;

type ServiceType = "keynote" | "workshop" | "strategy";
const serviceColors: Record<ServiceType, string> = {
  keynote: "bg-gold",
  workshop: "bg-teal",
  strategy: "bg-dawn",
};
const serviceLabelColors: Record<ServiceType, string> = {
  keynote: "text-gold",
  workshop: "text-teal",
  strategy: "text-dawn",
};
const serviceTypes: ServiceType[] = ["keynote", "workshop", "strategy"];
const serviceLabels: string[] = ["Inspire // Keynotes", "Practice // Workshops", "Transform // Strategy"];

export function ServicesSection({ section }: ServicesSectionProps) {
  const { updateSection } = useEditorStore();

  const content: ServicesContent = {
    ...defaultContent,
    ...(section?.config as Partial<ServicesContent>),
  };

  const updateContent = (updates: Partial<ServicesContent>) => {
    if (!section) return;
    updateSection(section.id, {
      config: { ...content, ...updates },
    });
  };

  const updateService = (index: number, updates: Partial<{ title: string; description: string }>) => {
    const newServices = [...content.services];
    newServices[index] = { ...newServices[index], ...updates };
    updateContent({ services: newServices });
  };

  return (
    <section id="services" className="section-spacing bg-void">
      <div className="container-base">
        <SectionHeader label="Services" />

        <div className="text-center max-w-[560px] mx-auto mb-16">
          <h2 className="font-mono text-[clamp(1.5rem,3vw,2rem)] tracking-wide uppercase text-dawn mb-4">
            <EditableText
              value={content.title}
              onChange={(title) => updateContent({ title })}
              className="font-mono text-[clamp(1.5rem,3vw,2rem)] tracking-wide uppercase text-dawn"
            />
          </h2>
          <p className="text-base text-dawn-50 leading-relaxed">
            From inspiration to transformation. Choose your entry point into dimensional thinking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {content.services.map((service, index) => {
            const type = serviceTypes[index] || "keynote";
            
            return (
              <article
                key={index}
                className={cn(
                  "relative bg-surface-1 border border-dawn-08 overflow-hidden",
                  "hover:border-dawn-15 hover:-translate-y-0.5",
                  "transition-all duration-base"
                )}
              >
                {/* Left accent bar */}
                <div className={cn("absolute top-0 left-0 w-[3px] h-full", serviceColors[type])} />

                {/* Image placeholder */}
                <div className="aspect-[16/10] bg-surface-0" />

                <div className="p-6">
                  <div className={cn(
                    "flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wide mb-3",
                    serviceLabelColors[type]
                  )}>
                    <span className={cn("w-[5px] h-[5px]", serviceColors[type])} aria-hidden="true" />
                    {serviceLabels[index]}
                  </div>
                  <h3 className="font-mono text-[15px] text-dawn mb-2 leading-snug">
                    <EditableText
                      value={service.title}
                      onChange={(title) => updateService(index, { title })}
                      className="font-mono text-[15px] text-dawn leading-snug"
                    />
                  </h3>
                  <p className="text-sm text-dawn-50 leading-relaxed">
                    <EditableText
                      value={service.description}
                      onChange={(description) => updateService(index, { description })}
                      className="text-sm text-dawn-50 leading-relaxed"
                      multiline
                      as="span"
                    />
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
