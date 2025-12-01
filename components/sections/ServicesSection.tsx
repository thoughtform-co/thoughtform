import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

type ServiceType = "keynote" | "workshop" | "strategy";

interface ServiceCardProps {
  type: ServiceType;
  typeLabel: string;
  title: string;
  description: string;
}

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

function ServiceCard({
  type,
  typeLabel,
  title,
  description,
}: ServiceCardProps) {
  return (
    <article
      className={cn(
        "relative bg-surface-1 border border-dawn-08 overflow-hidden",
        "hover:border-dawn-15 hover:-translate-y-0.5",
        "transition-all duration-base"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 w-[3px] h-full",
          serviceColors[type]
        )}
      />

      {/* Image placeholder */}
      <div className="aspect-[16/10] bg-surface-0" />

      <div className="p-6">
        <div
          className={cn(
            "flex items-center gap-1.5 font-mono text-2xs uppercase tracking-wide mb-3",
            serviceLabelColors[type]
          )}
        >
          <span
            className={cn("w-[5px] h-[5px]", serviceColors[type])}
            aria-hidden="true"
          />
          {typeLabel}
        </div>
        <h3 className="font-mono text-[15px] text-dawn mb-2 leading-snug">
          {title}
        </h3>
        <p className="text-sm text-dawn-50 leading-relaxed">{description}</p>
      </div>
    </article>
  );
}

const services: ServiceCardProps[] = [
  {
    type: "keynote",
    typeLabel: "Inspire // Keynotes",
    title: "See AI for What It Actually Is",
    description:
      "Shift your organization's mental model. Not software, but alien intelligence. Not frameworks, but navigation.",
  },
  {
    type: "workshop",
    typeLabel: "Practice // Workshops",
    title: "Think Dimensionally WITH AI",
    description:
      "Hands-on navigation training. Small groups (max 6) learn to sense semantic space and generate genuinely novel outputs.",
  },
  {
    type: "strategy",
    typeLabel: "Transform // Strategy",
    title: "Build a Culture of Navigation",
    description:
      "AI adoption that sticks—grounded in your culture, not against it. Map where you are, where you could go.",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="section-spacing bg-void">
      <div className="container-base">
        <SectionHeader label="Services" />

        <div className="text-center max-w-[560px] mx-auto mb-16">
          <h2 className="font-mono text-[clamp(1.5rem,3vw,2rem)] tracking-wide uppercase text-dawn mb-4">
            AI Intuition
          </h2>
          <p className="text-base text-dawn-50 leading-relaxed">
            From inspiration to transformation. Choose your entry point into
            dimensional thinking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => (
            <ServiceCard key={service.type} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}

