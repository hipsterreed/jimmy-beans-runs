import { addRun } from "../lib/firebase";
import { totalMilesForRunner } from "../lib/selectors";
import type { Run, Runner } from "../lib/types";
import { useQuestStore } from "../store/questStore";
import { RunnerCard } from "./RunnerCard";

type Props = {
  runners: Runner[];
  runs: Run[];
};

export function RosterPanel({ runners, runs }: Props) {
  const openRunnerModal = useQuestStore((s) => s.openRunnerModal);
  const openDeleteRunModal = useQuestStore((s) => s.openDeleteRunModal);
  const setSyncState = useQuestStore((s) => s.setSyncState);

  const onAddRunner = () => openRunnerModal("add");
  const onEditRunner = (runner: Runner) => openRunnerModal("edit", runner.id);
  const onDeleteRun = (run: Run) =>
    openDeleteRunModal({ runId: run.id, miles: run.miles, date: run.runDate });
  const onLogRun = async (runnerId: string, miles: number, runDate: string) => {
    setSyncState({ message: "Writing to the fellowship ledger...", status: "loading" });
    try {
      await addRun(runnerId, miles, runDate);
    } catch (error) {
      console.error(error);
      setSyncState({
        message: "Could not log miles. Check Firestore rules.",
        status: "error",
      });
    }
  };
  const orderedRunners = [...runners].sort((a, b) => a.createdAtMs - b.createdAtMs);

  return (
    <section className="mission-panel roster-panel">
      <div className="mission-header">
        <p className="eyebrow" style={{ margin: 0 }}>
          Fellowship Roster
        </p>
        <button id="addRunnerButton" type="button" onClick={onAddRunner}>
          Add Fellowship Member
        </button>
      </div>
      <section id="runnerGrid" className="character-grid">
        {orderedRunners.length === 0 ? (
          <article className="character-card empty-card">
            <p className="eyebrow">No Runners Yet</p>
            <h2>Start the fellowship</h2>
            <p className="supporting">Add a runner, pick a character, and set the first monthly goal.</p>
          </article>
        ) : (
          orderedRunners.map((runner) => (
            <RunnerCard
              key={runner.id}
              runner={runner}
              miles={totalMilesForRunner({ runners, runs }, runner.id)}
              runs={runs.filter((run) => run.runnerId === runner.id)}
              onEdit={onEditRunner}
              onLogRun={onLogRun}
              onDeleteRun={onDeleteRun}
            />
          ))
        )}
      </section>
    </section>
  );
}
