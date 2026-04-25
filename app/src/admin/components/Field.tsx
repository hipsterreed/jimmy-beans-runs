import type { ReactNode } from "react";
import { Label } from "./ui/label";

type Props = {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, hint, htmlFor, children, className = "" }: Props) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}
