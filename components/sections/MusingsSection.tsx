import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface MusingCardProps {
  title: string;
  date: string;
  href?: string;
}

function MusingCard({ title, date, href = "#" }: MusingCardProps) {
  return (
    <article
      className={cn(
        "bg-surface-0 border border-dawn-08",
        "hover:border-dawn-15 hover:bg-surface-1",
        "transition-all duration-base"
      )}
    >
      <a href={href} className="block">
        {/* Image placeholder */}
        <div className="aspect-[16/10] bg-surface-1" />

        <div className="p-5">
          <h3 className="font-mono text-sm text-dawn leading-snug mb-3 hover:text-gold transition-colors duration-base">
            {title}
          </h3>
          <div className="font-mono text-2xs tracking-wide text-gold">
            {date}
          </div>
        </div>
      </a>
    </article>
  );
}

const articles: MusingCardProps[] = [
  {
    title: "Why AI for strategic & creative work needs a different approach",
    date: "Jun 10, 2025",
  },
  {
    title: "Stop asking if AI can be creative. Start asking who will teach it.",
    date: "May 6, 2025",
  },
  {
    title: 'We need fewer prompting frameworks and more "AI intuition"',
    date: "Apr 7, 2025",
  },
];

export function MusingsSection() {
  return (
    <section id="musings" className="section-spacing bg-void">
      <div className="container-base">
        <SectionHeader label="Musings" />

        <div className="text-center max-w-[480px] mx-auto mb-12">
          <h2 className="font-mono text-[clamp(1.25rem,2.5vw,1.5rem)] tracking-wide uppercase text-dawn mb-2">
            Latent Musings
          </h2>
          <p className="text-base text-dawn-50">
            Thoughts on AI, work, and the shape of ideas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {articles.map((article) => (
            <MusingCard key={article.title} {...article} />
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

