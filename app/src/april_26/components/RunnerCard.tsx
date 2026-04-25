import type { Run, Runner } from "../lib/types";
import { characterFor, customImageForRunner, formatMiles } from "../lib/utils";
import { LogRunForm } from "./LogRunForm";
import { ProgressRing } from "./ProgressRing";
import { RunLogItem } from "./RunLogItem";

function runnerNarration(milesProgress: number): string {
  if (milesProgress >= 1) return "Goal cleared. Officially returning from Mordor.";
  if (milesProgress >= 0.75) return "Final stretch. Lava glow in sight.";
  if (milesProgress >= 0.4) return "Mid-quest form. Fellowship pace is healthy.";
  if (milesProgress > 0) return "Early miles are on the board.";
  return "Fresh quest. No miles logged yet.";
}

type Props = {
  runner: Runner;
  miles: number;
  runs: Run[];
  onEdit?: (runner: Runner) => void;
  onLogRun?: (runnerId: string, miles: number, runDate: string) => Promise<void> | void;
  onDeleteRun?: (run: Run) => void;
};

export function RunnerCard({ runner, miles, runs, onEdit, onLogRun, onDeleteRun }: Props) {
  const character = characterFor(runner.characterKey);
  const customImage = customImageForRunner(runner);
  const progressRatio = runner.goalMiles > 0 ? Math.min(miles / runner.goalMiles, 1) : 0;
  const sortedRuns = [...runs].sort((a, b) => b.createdAtMs - a.createdAtMs);

  return (
    <article className="character-card" data-character={character.accent} data-runner-id={runner.id}>
      <div className="card-nameplate">
        <h2 className="runner-name">{runner.name}</h2>
        <button
          type="button"
          className="ghost-button edit-runner-button"
          aria-label="Edit runner"
          data-runner-id={runner.id}
          onClick={() => onEdit?.(runner)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
          </svg>
        </button>
      </div>

      <div className="card-scroll">
        <div className="character-header">
          <div className="sprite-wrap">
            <div className={`sprite-frame${progressRatio >= 1 ? " legendary" : ""}`}>
              <div
                className={`sprite${customImage ? " sprite-photo" : ` sprite-${character.key}`}`}
                aria-hidden="true"
                style={customImage ? { backgroundImage: `url("${customImage}")` } : undefined}
              />
              <ProgressRing size={110} radius={51} ratio={progressRatio} />
            </div>
            <p className="runner-role">{character.label}</p>
          </div>
          <div className="runner-header-right">
            <p className="runner-miles-inline">
              <span className="runner-mile-value">{formatMiles(miles)}</span>
              {" / "}
              <span className="runner-goal-value">{runner.goalMiles}</span> mi
            </p>
            <p className="supporting runner-flavor">{character.flavor}</p>
          </div>
        </div>

        <div className="log-section">
          <ul className="run-log">
            {sortedRuns.map((run) => (
              <RunLogItem key={run.id} run={run} onSelect={onDeleteRun} />
            ))}
          </ul>
        </div>
      </div>

      <p className="quest-mood">{runnerNarration(progressRatio)}</p>
      <LogRunForm runnerId={runner.id} onSubmit={onLogRun} />
    </article>
  );
}
