import { combinedMiles, totalGoalMiles, type QuestState } from "../lib/selectors";
import { formatMiles } from "../lib/utils";
import { JourneyScene } from "./JourneyScene";

function ringNarration(progressRatio: number, goal: number): string {
  if (goal <= 0) return "The ring waits for the fellowship to form.";
  if (progressRatio >= 1) return "The ring is gone. Mount Doom claims another jewelry victim.";
  if (progressRatio >= 0.8) return "The lava glow is visible. Final push to the crater.";
  if (progressRatio >= 0.6) return "Mordor is near. The road looks hostile but runnable.";
  if (progressRatio >= 0.4) return "Past Rivendell. The fellowship pace is holding.";
  if (progressRatio >= 0.2) return "Beyond the Shire. Bree is in sight.";
  return "The ring has barely left the Shire.";
}

type Props = {
  state: QuestState;
};

export function QuestTotalCard({ state }: Props) {
  const total = combinedMiles(state);
  const goal = totalGoalMiles(state);
  const ratio = goal > 0 ? Math.min(total / goal, 1) : 0;
  const remaining = Math.max(goal - total, 0);

  let progressText = "Recruit runners to begin the quest.";
  if (goal > 0) {
    progressText =
      remaining > 0
        ? `${formatMiles(remaining)} miles to Mount Doom`
        : "Quest complete. The fellowship reached Mount Doom.";
  }

  return (
    <article className="quest-card total-card">
      <div className="total-card-header">
        <div className="total-miles-display">
          <span className="total-miles-value" id="totalMiles">
            {formatMiles(total)}
          </span>
          <span className="total-miles-sep">/</span>
          <span className="total-miles-goal" id="goalMiles">
            {formatMiles(goal)}
          </span>
          <span className="total-miles-unit">mi</span>
        </div>
        <div className="ring-ornament" aria-hidden="true">
          <div className="ring-ornament-beams" />
          <div className="ring-ornament-ring">
            <div className="ring-ornament-inner" />
          </div>
        </div>
      </div>

      <JourneyScene progressRatio={ratio} />

      <div className="total-card-footer">
        <p className="label">Fellowship Progress</p>
        <p id="progressText" className="supporting">
          {progressText}
        </p>
      </div>
      <p id="ringText" className="supporting" style={{ display: "none" }}>
        {ringNarration(ratio, goal)}
      </p>
    </article>
  );
}
