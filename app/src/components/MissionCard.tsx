import { PLAYABLE_SIDE_QUESTS } from "../lib/data";
import { formatMiles } from "../lib/utils";
import type { MissionStep } from "../lib/chart";

type Props = {
  step: MissionStep;
  totalMiles: number;
  devMode: boolean;
  onPlayQuest?: (questTitle: string) => void;
};

export function MissionCard({ step, totalMiles, devMode, onPlayQuest }: Props) {
  const unlocked = totalMiles >= step.miles;
  const playable = (unlocked || devMode) ? PLAYABLE_SIDE_QUESTS[step.title] : null;
  const showDescription = unlocked || devMode;

  const className = [
    "mission-card",
    unlocked ? "unlocked" : "",
    devMode && !unlocked ? "dev-visible" : "",
    playable ? "playable-quest" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleActivate = () => {
    if (playable) onPlayQuest?.(step.title);
  };

  return (
    <article
      className={className}
      data-playable-quest={playable ? step.title : undefined}
      role={playable ? "button" : undefined}
      tabIndex={playable ? 0 : undefined}
      aria-label={
        playable ? `${devMode && !unlocked ? "Preview" : "Play"} ${step.title}` : undefined
      }
      onClick={playable ? handleActivate : undefined}
      onKeyDown={
        playable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleActivate();
              }
            }
          : undefined
      }
    >
      <div className="mission-marker">{formatMiles(step.miles)} mi</div>
      <div className="mission-icon">{playable ? "▶" : unlocked ? "⚔" : "🔒"}</div>
      <h3 className="mission-title">{step.title}</h3>
      <p className="mission-body">
        {showDescription ? step.description : `Unlocks at ${formatMiles(step.miles)} miles.`}
      </p>
    </article>
  );
}
