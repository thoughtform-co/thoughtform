import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label: string;
  className?: string;
}

export function SectionHeader({ label, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center gap-4 mb-12 w-full", className)}>
      <div className="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-gold whitespace-nowrap">
        <span className="text-dawn-30">{"//"}</span>
        {label}
      </div>
      <div className="flex-1 h-px min-w-[100px] bg-gradient-to-r from-dawn-15 to-transparent" />
    </div>
  );
}

