import { isAdmin } from "../lib/admin";
import { buildMissionSteps, combinedMilesFor } from "../lib/chart";
import type { QuestState } from "../lib/selectors";
import { totalGoalMiles } from "../lib/selectors";
import { useQuestStore } from "../store/questStore";
import { MissionCard } from "./MissionCard";

type Props = {
  state: QuestState;
  devMode: boolean;
};

export function SideQuestsPanel({ state, devMode }: Props) {
  const onResetQuest = useQuestStore((s) => s.openResetModal);
  const onPlayQuest = useQuestStore((s) => s.openQuestGame);

  const steps = buildMissionSteps(totalGoalMiles(state));
  const totalMiles = combinedMilesFor(state);

  return (
    <section className="mission-panel">
      <div className="mission-header">
        <div>
          <p className="eyebrow">Side Quests</p>
          <h2>Unlock each side quest by reaching the mile requirement</h2>
        </div>
        <button
          id="resetButton"
          className="reset-button"
          type="button"
          hidden={!isAdmin}
          onClick={onResetQuest}
        >
          Reset Quest
        </button>
      </div>
      <div id="missions" className="mission-grid">
        {steps.length === 0 ? (
          <article className="mission-card unlocked">
            <h3>Waiting On Side Quests</h3>
            <p>Add a runner to generate the quest path.</p>
          </article>
        ) : (
          steps.map((step) => (
            <MissionCard
              key={step.title}
              step={step}
              totalMiles={totalMiles}
              devMode={devMode}
              onPlayQuest={onPlayQuest}
            />
          ))
        )}
      </div>
    </section>
  );
}
