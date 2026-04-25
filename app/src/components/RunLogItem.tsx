import type { Run } from "../lib/types";
import { formatMiles, parseDateLabel } from "../lib/utils";

type Props = {
  run: Run;
  onSelect?: (run: Run) => void;
};

export function RunLogItem({ run, onSelect }: Props) {
  return (
    <li
      className="log-item"
      role="button"
      tabIndex={0}
      aria-label="Delete run"
      data-run-id={run.id}
      onClick={() => onSelect?.(run)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(run);
        }
      }}
    >
      <span className="log-miles">{formatMiles(run.miles)} mi</span>
      <span className="log-date">{parseDateLabel(run.runDate)}</span>
    </li>
  );
}
