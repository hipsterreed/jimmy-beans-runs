import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  cardClassName?: string;
  children: ReactNode;
};

export function ModalShell({
  open,
  onClose,
  ariaLabelledBy,
  ariaDescribedBy,
  cardClassName,
  children,
}: Props) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-shell is-open">
      <div className="modal-backdrop" onClick={onClose} />
      <section
        className={`modal-card${cardClassName ? ` ${cardClassName}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
      >
        {children}
      </section>
    </div>
  );
}
