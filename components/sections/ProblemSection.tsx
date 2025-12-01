import { SectionHeader } from "@/components/ui/SectionHeader";

interface SymptomCardProps {
  number: string;
  title: string;
  description: string;
}

function SymptomCard({ number, title, description }: SymptomCardProps) {
  return (
    <div className="relative pl-8 border-l-2 border-dawn-15 hover:border-dawn-30 transition-colors duration-slow">
      <span className="absolute -left-3 top-0 font-mono text-2xs text-dawn-30 bg-void py-1">
        // {number}
      </span>
      <div className="font-mono text-sm text-dawn mb-2">{title}</div>
      <div className="text-[13px] text-dawn-50 leading-relaxed">
        {description}
      </div>
    </div>
  );
}

const symptoms: SymptomCardProps[] = [
  {
    number: "01",
    title: "The Beige Default",
    description:
      "AI outputs feel generic, interchangeable. Every competitor's AI sounds exactly like yours.",
  },
  {
    number: "02",
    title: "Framework Fatigue",
    description:
      "You've tried every prompting template. Results plateau. The magic wears off.",
  },
  {
    number: "03",
    title: "The Sycophancy Mask",
    description:
      "AI agrees with everything, challenges nothing. You get compliance, not insight.",
  },
  {
    number: "04",
    title: "Adoption Anxiety",
    description:
      "Teams either over-rely or actively resist. No one's found the middle path.",
  },
];

export function ProblemSection() {
  return (
    <section id="manifesto" className="section-spacing bg-void">
      <div className="container-base">
        <SectionHeader label="The Problem" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-20">
          <div>
            <h2 className="font-mono text-[clamp(1.75rem,4vw,2.5rem)] tracking-wide uppercase text-dawn mb-8 leading-tight">
              AI Isn't Software
            </h2>
            <div className="text-[1.0625rem] leading-[1.8] text-dawn-70 space-y-6">
              <p>
                Most companies struggle with AI adoption because they treat it
                like normal software—something to command with the right
                instructions.
              </p>
              <p>
                But{" "}
                <strong className="text-dawn font-medium">
                  AI isn't a tool to command.
                </strong>{" "}
                It's a strange, new intelligence that leaps across dimensions we
                can't fathom. It hallucinates. It surprises. It has its own
                alien logic.
              </p>
              <p>
                In technical work, that strangeness must be constrained. But in
                creative and strategic work?{" "}
                <strong className="text-dawn font-medium">
                  It's the source of truly novel ideas.
                </strong>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {symptoms.map((symptom) => (
              <SymptomCard key={symptom.number} {...symptom} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

