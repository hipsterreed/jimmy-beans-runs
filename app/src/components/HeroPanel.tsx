import type { QuestState } from "../lib/selectors";
import { FellowshipCluster } from "./FellowshipCluster";
import { QuestTotalCard } from "./QuestTotalCard";

type Props = {
  state: QuestState;
};

export function HeroPanel({ state }: Props) {
  return (
    <section className="hero-panel">
      <div className="hero-top">
        <p className="eyebrow hero-eyebrow">The April Quest</p>
        <div className="hero-content">
          <h1>Destroy the Ring Together</h1>
          <p className="hero-copy">
            Build a full fellowship, pick your LOTR avatars, and log every mile on the road to Mount Doom. Each runner sets a personal monthly goal and the fellowship target grows with them.
          </p>
        </div>
        <FellowshipCluster state={state} />
      </div>

      <div className="quest-row">
        <QuestTotalCard state={state} />
      </div>
    </section>
  );
}
