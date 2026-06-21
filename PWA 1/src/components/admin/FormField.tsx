import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  className?: string;
  children: ReactNode;
}

export function FormField({ label, className, children }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium uppercase tracking-wider text-foreground/70">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
