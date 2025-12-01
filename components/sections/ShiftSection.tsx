import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

type CardinalType = "geometry" | "alterity" | "dynamics";

interface CardinalCardProps {
  type: CardinalType;
  symbol: string;
  label: string;
  title: string;
  description: string;
}

const cardinalColors: Record<CardinalType, { bar: string; text: string }> = {
  geometry: { bar: "bg-gold", text: "text-gold" },
  alterity: { bar: "bg-dawn", text: "text-dawn" },
  dynamics: { bar: "bg-teal", text: "text-teal" },
};

function CardinalCard({
  type,
  symbol,
  label,
  title,
  description,
}: CardinalCardProps) {
  const colors = cardinalColors[type];

  return (
    <div
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
        className={cn(
          "font-mono text-2xs uppercase tracking-widest mb-4",
          colors.text
        )}
      >
        {symbol} {label}
      </div>
      <div className="font-mono text-[15px] text-dawn mb-3 leading-snug">
        {title}
      </div>
      <div className="text-sm text-dawn-50 leading-relaxed">{description}</div>
    </div>
  );
}

const cardinals: CardinalCardProps[] = [
  {
    type: "geometry",
    symbol: "◆",
    label: "Geometry",
    title: "Navigate its intelligence",
    description:
      "AI thinks in semantic space—meaning as coordinates in dimensions you can't visualize. Learn to sense where you are and steer where you're going.",
  },
  {
    type: "alterity",
    symbol: "○",
    label: "Alterity",
    title: "Steer it away from mediocrity",
    description:
      "AI is genuinely other—not a helpful assistant, not a stochastic parrot. Its alien perspective is where the valuable surprises live.",
  },
  {
    type: "dynamics",
    symbol: "◇",
    label: "Dynamics",
    title: "Leverage its hallucinations",
    description:
      "Every interaction shapes both you and the system. What looks like a bug is often a feature—creative leaps invisible to rigid frameworks.",
  },
];

export function ShiftSection() {
  return (
    <section id="shift" className="section-spacing bg-void">
      <div className="container-base">
        <SectionHeader label="The Shift" />

        <div className="text-center max-w-[640px] mx-auto mb-20">
          <div className="font-mono text-[clamp(1.5rem,3vw,2rem)] tracking-widest uppercase text-gold mb-2">
            Thoughtform
          </div>
          <div className="font-mono text-sm text-dawn-50 italic mb-6">
            (θɔːtfɔːrm / THAWT-form)
          </div>
          <p className="text-[1.0625rem] text-dawn-70 leading-relaxed">
            The practice of intuitive human-AI collaboration. Not
            prompting—navigating. Not commanding—co-evolving.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {cardinals.map((cardinal) => (
            <CardinalCard key={cardinal.type} {...cardinal} />
          ))}
        </div>
      </div>
    </section>
  );
}

