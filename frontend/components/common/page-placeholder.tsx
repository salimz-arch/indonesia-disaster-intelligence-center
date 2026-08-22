import type { LucideIcon } from "lucide-react";

export function PagePlaceholder({
  title,
  description,
  step,
  icon: Icon,
}: {
  title: string;
  description: string;
  step: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-idic-border bg-idic-card/50 p-12 text-center">
      <Icon size={36} className="text-idic-cyan/70" aria-hidden />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-slate-400">{description}</p>
      <span className="rounded-full border border-idic-cyan/30 bg-idic-cyan/10 px-3 py-1 text-xs text-idic-cyan">
        Aktif pada {step}
      </span>
    </div>
  );
}
