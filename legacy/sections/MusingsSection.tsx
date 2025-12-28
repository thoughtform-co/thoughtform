"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { EditableText } from "@/components/editor/EditableText";
import { type Section } from "@/lib/types";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";

interface MusingsSectionProps {
  section?: Section;
}

interface MusingArticle {
  title: string;
  date: string;
  href?: string;
}

interface MusingsContent {
  sectionTitle: string;
  subtitle: string;
  articles: MusingArticle[];
}

const defaultContent: MusingsContent = {
  sectionTitle: "Latent Musings",
  subtitle: "Thoughts on AI, work, and the shape of ideas.",
  articles: [
    {
      title: "Why AI for strategic & creative work needs a different approach",
      date: "Jun 10, 2025",
    },
    {
      title: "Stop asking if AI can be creative. Start asking who will teach it.",
      date: "May 6, 2025",
    },
    { title: 'We need fewer prompting frameworks and more "AI intuition"', date: "Apr 7, 2025" },
  ],
};

export function MusingsSection({ section }: MusingsSectionProps) {
  const { updateSection } = useEditorStore();

  const content: MusingsContent = {
    ...defaultContent,
    ...(section?.config as Partial<MusingsContent>),
  };

  const updateContent = (updates: Partial<MusingsContent>) => {
    if (!section) return;
    updateSection(section.id, {
      config: { ...content, ...updates },
    });
  };

  const updateArticle = (index: number, updates: Partial<MusingArticle>) => {
    const newArticles = [...content.articles];
    newArticles[index] = { ...newArticles[index], ...updates };
    updateContent({ articles: newArticles });
  };

  return (
    <section id="musings" className="section-spacing bg-void">
      <div className="container-base">
        <SectionHeader label="Musings" />

        <div className="text-center max-w-[480px] mx-auto mb-12">
          <h2 className="font-mono text-[clamp(1.25rem,2.5vw,1.5rem)] tracking-wide uppercase text-dawn mb-2">
            <EditableText
              value={content.sectionTitle}
              onChange={(sectionTitle) => updateContent({ sectionTitle })}
              className="font-mono text-[clamp(1.25rem,2.5vw,1.5rem)] tracking-wide uppercase text-dawn"
            />
          </h2>
          <p className="text-base text-dawn-50">
            <EditableText
              value={content.subtitle}
              onChange={(subtitle) => updateContent({ subtitle })}
              className="text-base text-dawn-50"
              as="span"
            />
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {content.articles.map((article, index) => (
            <article
              key={index}
              className={cn(
                "bg-surface-0 border border-dawn-08",
                "hover:border-dawn-15 hover:bg-surface-1",
                "transition-all duration-base"
              )}
            >
              <div className="block">
                {/* Image placeholder */}
                <div className="aspect-[16/10] bg-surface-1" />

                <div className="p-5">
                  <h3 className="font-mono text-sm text-dawn leading-snug mb-3">
                    <EditableText
                      value={article.title}
                      onChange={(title) => updateArticle(index, { title })}
                      className="font-mono text-sm text-dawn leading-snug"
                      multiline
                    />
                  </h3>
                  <div className="font-mono text-2xs tracking-wide text-gold">
                    <EditableText
                      value={article.date}
                      onChange={(date) => updateArticle(index, { date })}
                      className="font-mono text-2xs tracking-wide text-gold"
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center">
          <Button variant="ghost" href="#">
            Read More →
          </Button>
        </div>
      </div>
    </section>
  );
}
