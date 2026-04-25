import type { Run, Runner } from "./types";

export type QuestState = {
  runners: Runner[];
  runs: Run[];
};

export function runnerRuns(state: QuestState, runnerId: string): Run[] {
  return state.runs.filter((run) => run.runnerId === runnerId);
}

export function totalMilesForRunner(state: QuestState, runnerId: string): number {
  return runnerRuns(state, runnerId).reduce((sum, run) => sum + run.miles, 0);
}

export function totalGoalMiles(state: QuestState): number {
  return state.runners.reduce((sum, runner) => sum + runner.goalMiles, 0);
}

export function combinedMiles(state: QuestState): number {
  return state.runs.reduce((sum, run) => sum + run.miles, 0);
}

export function runnerById(state: QuestState, runnerId: string): Runner | null {
  return state.runners.find((runner) => runner.id === runnerId) || null;
}
