import type { Runner } from "../lib/types";
import { characterFor, customImageForRunner } from "../lib/utils";
import { totalMilesForRunner, type QuestState } from "../lib/selectors";
import { ProgressRing } from "./ProgressRing";

const OFFSETS = [
  { x: 30, y: 22, delay: 1.1 },
  { x: 52, y: 18, delay: 2.3 },
  { x: 72, y: 24, delay: 0.6 },
  { x: 18, y: 50, delay: 1.8 },
  { x: 42, y: 46, delay: 0.2 },
  { x: 63, y: 52, delay: 2.7 },
  { x: 84, y: 48, delay: 1.4 },
  { x: 28, y: 78, delay: 0.8 },
  { x: 52, y: 82, delay: 2.0 },
  { x: 74, y: 78, delay: 1.5 },
];

type Props = {
  state: QuestState;
};

export function FellowshipCluster({ state }: Props) {
  const ordered = [...state.runners].sort((a, b) => a.createdAtMs - b.createdAtMs);

  return (
    <div id="fellowshipCluster" className="fellowship-cluster" aria-hidden="true">
      {ordered.map((runner: Runner, index: number) => {
        const character = characterFor(runner.characterKey);
        const offset = OFFSETS[index % OFFSETS.length];
        const customImage = customImageForRunner(runner);
        const miles = totalMilesForRunner(state, runner.id);
        const ratio = runner.goalMiles > 0 ? Math.min(miles / runner.goalMiles, 1) : 0;

        return (
          <div
            key={runner.id}
            className="cluster-bubble"
            style={{
              left: `${offset.x}%`,
              top: `${offset.y}%`,
              animationDelay: `${offset.delay}s`,
            }}
          >
            <div className={`cluster-frame${ratio >= 1 ? " legendary" : ""}`}>
              <div
                className={`cluster-avatar${customImage ? " sprite-photo" : ` sprite-${character.key}`}`}
                style={customImage ? { backgroundImage: `url("${customImage}")` } : undefined}
              />
              <ProgressRing size={64} radius={28} ratio={ratio} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
