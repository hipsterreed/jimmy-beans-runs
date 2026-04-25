import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type Props = {
  thumbnail?: string | null;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function ListRow({ thumbnail, title, subtitle, actions, className }: Props) {
  return (
    <div
      className={cn(
        "bg-card flex items-center gap-3 rounded-md border px-3 py-2.5 shadow-xs",
        className,
      )}
    >
      {thumbnail !== undefined && (
        <div className="bg-muted h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
          {thumbnail && (
            <img
              src={thumbnail}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-foreground truncate text-sm font-medium">{title}</div>
        {subtitle && (
          <div className="text-muted-foreground truncate text-xs">{subtitle}</div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ListEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
      {children}
    </div>
  );
}
